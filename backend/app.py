"""
Interview Trainer — Unified Flask Server
Serves React frontend + REST API with RAG-powered question generation.
IBM Granite 4 (ibm/granite-4-h-small) via watsonx.ai
"""
import os, json, uuid
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv("config.env")

# ─── App setup ───────────────────────────────────────────────────────────────
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

app = Flask(__name__, static_folder=None)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"])

app.config.update(
    SQLALCHEMY_DATABASE_URI="sqlite:///interview_trainer.db",
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "dev-secret-key"),
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=24),
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,  # 5MB upload limit for resumes
)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ─── Database Models ─────────────────────────────────────────────────────────

class User(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name          = db.Column(db.String(100), nullable=False)
    role          = db.Column(db.String(100), default="Software Engineer")
    experience    = db.Column(db.String(50), default="Mid-level")
    resume_text   = db.Column(db.Text, default="")
    skills        = db.Column(db.Text, default="[]")   # JSON list
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    interviews    = db.relationship("Interview", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id, "email": self.email, "name": self.name,
            "role": self.role, "experience": self.experience,
            "resume_text": self.resume_text,
            "skills": json.loads(self.skills or "[]"),
            "created_at": self.created_at.isoformat(),
        }


class Interview(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    session_id   = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    user_id      = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    role         = db.Column(db.String(100), nullable=False)
    difficulty   = db.Column(db.String(50), nullable=False)
    topics       = db.Column(db.Text, default="[]")
    status       = db.Column(db.String(20), default="active")
    started_at   = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    overall_score = db.Column(db.Float, default=0)
    grade        = db.Column(db.String(2), default="")
    report       = db.Column(db.Text, default="{}")
    rag_context  = db.Column(db.Text, default="[]")  # Retrieved knowledge items used
    questions    = db.relationship("Question", backref="interview", lazy=True)

    def to_dict(self, include_questions=False):
        d = {
            "id": self.id, "session_id": self.session_id, "role": self.role,
            "difficulty": self.difficulty, "topics": json.loads(self.topics),
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "overall_score": self.overall_score, "grade": self.grade,
            "duration_minutes": (
                int((self.completed_at - self.started_at).total_seconds() / 60)
                if self.completed_at else None
            ),
        }
        if include_questions:
            d["questions"] = [q.to_dict() for q in self.questions]
            d["report"] = json.loads(self.report)
            d["rag_context"] = json.loads(self.rag_context)
        return d


class Question(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    interview_id  = db.Column(db.Integer, db.ForeignKey("interview.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default="technical")
    topic         = db.Column(db.String(100), default="")
    answer_text   = db.Column(db.Text, default="")
    score         = db.Column(db.Float, default=0)
    feedback      = db.Column(db.Text, default="{}")
    rag_source_id = db.Column(db.String(20), default="")  # KB item id used
    model_answer  = db.Column(db.Text, default="")        # From RAG KB
    asked_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "question_text": self.question_text,
            "question_type": self.question_type, "topic": self.topic,
            "answer_text": self.answer_text, "score": self.score,
            "feedback": json.loads(self.feedback),
            "model_answer": self.model_answer,
            "rag_source_id": self.rag_source_id,
            "asked_at": self.asked_at.isoformat(),
        }


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.get_json()
    if not d or not all(k in d for k in ["email", "password", "name"]):
        return jsonify({"error": "email, password, and name are required"}), 400
    if User.query.filter_by(email=d["email"]).first():
        return jsonify({"error": "Email already registered"}), 409
    user = User(
        email=d["email"],
        password_hash=generate_password_hash(d["password"]),
        name=d["name"],
        role=d.get("role", "Software Engineer"),
        experience=d.get("experience", "Mid-level"),
        skills=json.dumps(d.get("skills", [])),
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json()
    if not d or not all(k in d for k in ["email", "password"]):
        return jsonify({"error": "email and password required"}), 400
    user = User.query.filter_by(email=d["email"]).first()
    if not user or not check_password_hash(user.password_hash, d["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})


@app.route("/api/auth/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = db.session.get(User, int(get_jwt_identity()))
    d = request.get_json()
    for f in ["name", "role", "experience", "resume_text"]:
        if f in d:
            setattr(user, f, d[f])
    if "skills" in d:
        user.skills = json.dumps(d["skills"])
    db.session.commit()
    return jsonify({"user": user.to_dict()})


# ─── Resume / RAG Routes ─────────────────────────────────────────────────────

@app.route("/api/profile/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume():
    """Accept plain-text resume, extract skills via RAG, save to profile."""
    user = db.session.get(User, int(get_jwt_identity()))
    d = request.get_json()
    resume_text = d.get("resume_text", "").strip()
    if not resume_text:
        return jsonify({"error": "resume_text is required"}), 400

    from rag_knowledge_base import search_by_resume_keywords, retrieve_industry_context
    matched_questions = search_by_resume_keywords(resume_text, user.role)
    # Extract unique categories as inferred skills
    inferred_skills = list({q["category"] for q in matched_questions})
    user.resume_text = resume_text
    user.skills = json.dumps(inferred_skills)
    db.session.commit()

    return jsonify({
        "message": "Resume processed",
        "inferred_skills": inferred_skills,
        "matched_question_count": len(matched_questions),
        "user": user.to_dict(),
    })


@app.route("/api/rag/industry-profile", methods=["GET"])
@jwt_required()
def get_industry_profile():
    """Return industry expectations and prep tips for user's target role."""
    user = db.session.get(User, int(get_jwt_identity()))
    from rag_knowledge_base import retrieve_industry_context
    context = retrieve_industry_context(user.role)
    return jsonify({"context": context, "role": user.role})


@app.route("/api/rag/preview-questions", methods=["POST"])
@jwt_required()
def preview_questions():
    """RAG: Return a curated preview of questions for the chosen role/difficulty/topics."""
    user = db.session.get(User, int(get_jwt_identity()))
    d = request.get_json()
    role       = d.get("role", user.role)
    difficulty = d.get("difficulty")
    topics     = d.get("topics", [])
    resume_kw  = user.resume_text  # Use resume for personalization

    from rag_knowledge_base import retrieve_questions, search_by_resume_keywords, retrieve_industry_context

    questions = []
    if resume_kw:
        questions = search_by_resume_keywords(resume_kw, role)
    else:
        for topic in (topics or ["General"]):
            questions += retrieve_questions(role=role, difficulty=difficulty, category=topic, limit=3)

    seen_ids = set()
    unique_q = []
    for q in questions:
        if q["id"] not in seen_ids:
            seen_ids.add(q["id"])
            unique_q.append(q)

    industry = retrieve_industry_context(role)

    return jsonify({
        "questions": unique_q[:8],
        "industry_context": industry,
        "personalized": bool(resume_kw),
        "total": len(unique_q[:8]),
    })


# ─── Interview Routes ─────────────────────────────────────────────────────────

@app.route("/api/interviews/start", methods=["POST"])
@jwt_required()
def start_interview():
    user = db.session.get(User, int(get_jwt_identity()))
    d = request.get_json()
    role       = d.get("role", user.role)
    difficulty = d.get("difficulty", "Medium")
    topics     = d.get("topics", ["Data Structures", "Algorithms"])

    from rag_knowledge_base import retrieve_questions
    rag_items = retrieve_questions(role=role, difficulty=difficulty, limit=10)
    rag_context = [{"id": r["id"], "category": r["category"], "keywords": r["keywords"]} for r in rag_items]

    interview = Interview(
        user_id=user.id, role=role, difficulty=difficulty,
        topics=json.dumps(topics), rag_context=json.dumps(rag_context),
    )
    db.session.add(interview)
    db.session.commit()
    return jsonify({"interview": interview.to_dict()}), 201


@app.route("/api/interviews/<session_id>/question", methods=["POST"])
@jwt_required()
def get_question(session_id):
    from watsonx_client import generate_interview_question
    from rag_knowledge_base import retrieve_questions

    interview = Interview.query.filter_by(session_id=session_id).first_or_404()
    req_data  = request.get_json() or {}
    topics    = json.loads(interview.topics)
    topic     = req_data.get("topic", topics[0] if topics else "General")

    prev_questions = [q.question_text for q in interview.questions]

    # RAG: retrieve relevant KB questions for context
    rag_items = retrieve_questions(
        role=interview.role, difficulty=interview.difficulty,
        category=topic, limit=3,
    )
    rag_context_str = ""
    rag_source_id   = ""
    model_answer_hint = ""

    if rag_items:
        best = rag_items[0]
        rag_source_id = best["id"]
        model_answer_hint = best.get("model_answer", "")
        rag_context_str = (
            f"\nRelevant industry context:\n"
            f"- Example topic area: {best['category']}\n"
            f"- Industry note: {best.get('industry_context', '')}\n"
            f"- Key keywords to probe: {', '.join(best.get('keywords', []))}\n"
        )

    q_data = generate_interview_question(
        role=interview.role, difficulty=interview.difficulty,
        topic=topic, previous_questions=prev_questions,
        rag_context=rag_context_str,
    )

    question = Question(
        interview_id=interview.id,
        question_text=q_data["question"],
        question_type=q_data.get("type", "technical"),
        topic=topic,
        rag_source_id=rag_source_id,
        model_answer=model_answer_hint,
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({
        "question_id": question.id,
        "question": q_data["question"],
        "type": q_data.get("type", "technical"),
        "hint": q_data.get("hint", ""),
        "topic": topic,
        "question_number": len(interview.questions),
        "industry_tip": rag_items[0].get("tips", "") if rag_items else "",
    })


@app.route("/api/interviews/<session_id>/answer", methods=["POST"])
@jwt_required()
def submit_answer(session_id):
    from watsonx_client import evaluate_answer

    interview   = Interview.query.filter_by(session_id=session_id).first_or_404()
    d           = request.get_json()
    question_id = d.get("question_id")
    answer_text = d.get("answer", "")

    question = db.session.get(Question, question_id)
    if not question or question.interview_id != interview.id:
        return jsonify({"error": "Question not found"}), 404

    evaluation = evaluate_answer(
        question=question.question_text, answer=answer_text,
        role=interview.role, difficulty=interview.difficulty,
        model_answer_hint=question.model_answer,
    )

    question.answer_text = answer_text
    question.score = evaluation.get("score", 5)
    question.feedback = json.dumps(evaluation)
    db.session.commit()

    return jsonify({
        "evaluation": evaluation,
        "question_id": question_id,
        "model_answer": question.model_answer,
    })


@app.route("/api/interviews/<session_id>/complete", methods=["POST"])
@jwt_required()
def complete_interview(session_id):
    from watsonx_client import generate_report

    interview = Interview.query.filter_by(session_id=session_id).first_or_404()
    qa_pairs  = [
        {"question": q.question_text, "answer": q.answer_text, "score": q.score}
        for q in interview.questions if q.answer_text
    ]

    user = db.session.get(User, interview.user_id)
    report = generate_report(
        role=interview.role, difficulty=interview.difficulty,
        qa_pairs=qa_pairs, user_name=user.name, experience=user.experience,
    )

    interview.status       = "completed"
    interview.completed_at = datetime.utcnow()
    interview.overall_score = report.get("overall_score", 0)
    interview.grade        = report.get("grade", "C")
    interview.report       = json.dumps(report)
    db.session.commit()

    return jsonify({"report": report, "interview": interview.to_dict(include_questions=True)})


@app.route("/api/interviews/<session_id>", methods=["GET"])
@jwt_required()
def get_interview(session_id):
    interview = Interview.query.filter_by(session_id=session_id).first_or_404()
    return jsonify({"interview": interview.to_dict(include_questions=True)})


@app.route("/api/interviews", methods=["GET"])
@jwt_required()
def list_interviews():
    user_id = int(get_jwt_identity())
    interviews = Interview.query.filter_by(user_id=user_id).order_by(
        Interview.started_at.desc()
    ).all()
    return jsonify({"interviews": [i.to_dict() for i in interviews]})


# ─── Analytics ────────────────────────────────────────────────────────────────

@app.route("/api/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    user_id   = int(get_jwt_identity())
    completed = Interview.query.filter_by(user_id=user_id, status="completed").all()

    if not completed:
        return jsonify({
            "total_interviews": 0, "average_score": 0, "best_score": 0,
            "improvement_trend": [], "score_by_difficulty": {},
            "recent_scores": [], "grade_distribution": {},
        })

    scores = [i.overall_score for i in completed]
    trend  = [
        {"date": i.completed_at.strftime("%b %d"), "score": i.overall_score}
        for i in sorted(completed, key=lambda x: x.started_at)[-10:]
    ]
    by_diff = {}
    for i in completed:
        by_diff.setdefault(i.difficulty, []).append(i.overall_score)

    return jsonify({
        "total_interviews": len(completed),
        "average_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "improvement_trend": trend,
        "score_by_difficulty": {k: round(sum(v) / len(v), 1) for k, v in by_diff.items()},
        "recent_scores": scores[-5:],
        "grade_distribution": {
            g: sum(1 for i in completed if i.grade == g)
            for g in ["A", "B", "C", "D", "F"]
        },
    })


# ─── Question Bank ────────────────────────────────────────────────────────────

@app.route("/api/questions", methods=["GET"])
@jwt_required()
def get_questions():
    from rag_knowledge_base import KNOWLEDGE_BASE
    category   = request.args.get("category")
    difficulty = request.args.get("difficulty")
    q_type     = request.args.get("type")
    role       = request.args.get("role")

    questions = [
        {
            "id": q["id"], "category": q["category"], "difficulty": q["difficulty"],
            "question": q["question"], "type": q["type"],
            "model_answer": q["model_answer"], "tips": q.get("tips", ""),
            "industry_context": q.get("industry_context", ""),
            "keywords": q.get("keywords", []), "role": q["role"],
        }
        for q in KNOWLEDGE_BASE
    ]

    if category:   questions = [q for q in questions if q["category"] == category]
    if difficulty: questions = [q for q in questions if q["difficulty"] == difficulty]
    if q_type:     questions = [q for q in questions if q["type"] == q_type]
    if role:       questions = [q for q in questions if q["role"] == role or q["role"] == "All"]

    return jsonify({"questions": questions, "total": len(questions)})


# ─── Health check ─────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small"),
        "rag": "enabled",
        "version": "2.0",
    })


# ─── Serve React SPA ──────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    """Serve React build assets or fall back to index.html for client-side routing."""
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    index = FRONTEND_DIST / "index.html"
    # Serve real static files (JS/CSS/assets) directly
    if path:
        static_file = FRONTEND_DIST / path
        if static_file.exists() and static_file.is_file():
            return send_from_directory(str(FRONTEND_DIST), path)
    # All React Router paths → serve index.html
    if index.exists():
        return send_file(str(index))
    return jsonify({
        "message": "InterviewAI API running. Build frontend: cd frontend && npm run build",
        "api_docs": "/api/health",
    }), 200


# ─── Bootstrap ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
        print(f"✅ Frontend dist: {'found' if FRONTEND_DIST.exists() else 'not built yet — run: cd frontend && npm run build'}")
        print(f"🚀 Server starting on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
