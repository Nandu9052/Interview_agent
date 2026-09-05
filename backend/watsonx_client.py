"""IBM watsonx.ai client — RAG-enhanced text generation with IBM Granite 4."""
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv("config.env")

WATSONX_API_KEY   = os.getenv("WATSONX_API_KEY", "")
WATSONX_URL       = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_MODEL_ID  = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")

_token_cache: dict = {"token": None, "expires_at": 0}


def _get_iam_token() -> str:
    import time
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": WATSONX_API_KEY},
        timeout=30,
    )
    resp.raise_for_status()
    d = resp.json()
    _token_cache["token"] = d["access_token"]
    _token_cache["expires_at"] = now + d.get("expires_in", 3600)
    return _token_cache["token"]


def _call_watsonx(prompt: str, max_new_tokens: int = 800, temperature: float = 0.7) -> str:
    """Core call to watsonx.ai text generation endpoint."""
    token = _get_iam_token()
    url = f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"
    payload = {
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "input": prompt,
        "parameters": {
            "decoding_method": "sample",
            "max_new_tokens": max_new_tokens,
            "temperature": temperature,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
        },
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["results"][0]["generated_text"].strip()


def _safe_json(text: str, fallback: dict) -> dict:
    """Extract and parse JSON from model output, with fallback."""
    try:
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except Exception:
        pass
    return fallback


# ─── RAG-Enhanced Question Generation ────────────────────────────────────────

def generate_interview_question(
    role: str,
    difficulty: str,
    topic: str,
    previous_questions: list = None,
    rag_context: str = "",
) -> dict:
    """Generate a contextual interview question, enhanced with RAG knowledge."""
    prev = ""
    if previous_questions:
        prev = "\nAlready asked (do not repeat):\n" + "\n".join(f"- {q}" for q in previous_questions[-4:])

    prompt = f"""You are an expert interviewer conducting a {difficulty}-level interview for a {role} position.
{rag_context}{prev}

Generate ONE original interview question about: {topic}

Rules:
- Match the {difficulty} difficulty level precisely
- Be specific and relevant to a real {role} interview
- Do NOT repeat previous questions

Respond ONLY in this JSON format (no extra text):
{{
  "question": "The interview question here",
  "type": "technical|behavioral|situational|hr",
  "hint": "A brief hint about what a good answer covers",
  "expected_keywords": ["keyword1", "keyword2", "keyword3"]
}}

JSON:"""

    text = _call_watsonx(prompt, max_new_tokens=350, temperature=0.8)
    return _safe_json(text, {
        "question": text.split("\n")[0] if text else f"Tell me about your experience with {topic}.",
        "type": "technical",
        "hint": "",
        "expected_keywords": [],
    })


# ─── RAG-Enhanced Answer Evaluation ─────────────────────────────────────────

def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    difficulty: str,
    model_answer_hint: str = "",
) -> dict:
    """Evaluate a candidate's answer with RAG model answer as reference."""
    rag_hint = ""
    if model_answer_hint:
        rag_hint = f"\nReference answer outline: {model_answer_hint}\n"

    prompt = f"""You are an expert interviewer evaluating a {difficulty}-level {role} candidate.
{rag_hint}
Question: {question}
Candidate's Answer: {answer}

Evaluate thoroughly. Respond ONLY in this JSON format:
{{
  "score": <integer 1-10>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "feedback": "2-3 sentence constructive feedback referencing specific parts of the answer",
  "sample_answer": "A concise model answer hitting the key points",
  "missing_concepts": ["concept the candidate missed"]
}}

JSON:"""

    text = _call_watsonx(prompt, max_new_tokens=550, temperature=0.4)
    return _safe_json(text, {
        "score": 5,
        "strengths": ["Attempted the question"],
        "improvements": ["Provide more specific examples", "Cover key technical concepts"],
        "feedback": "Your answer shows some understanding. Try to be more specific with technical details.",
        "sample_answer": model_answer_hint or "",
        "missing_concepts": [],
    })


# ─── RAG-Enhanced Report Generation ─────────────────────────────────────────

def generate_report(
    role: str,
    difficulty: str,
    qa_pairs: list,
    user_name: str = "",
    experience: str = "",
) -> dict:
    """Generate a personalized, comprehensive interview performance report."""
    summary_lines = []
    for i, item in enumerate(qa_pairs):
        summary_lines.append(
            f"Q{i+1} [{item.get('score', 'N/A')}/10]: {item['question']}\n"
            f"   Answer: {item['answer'][:200]}{'...' if len(item['answer']) > 200 else ''}"
        )
    summary = "\n".join(summary_lines)

    candidate_ctx = f"Candidate: {user_name}, Experience: {experience}" if user_name else ""

    prompt = f"""You are an expert interviewer writing a comprehensive performance report.
{candidate_ctx}
Role: {role} | Level: {difficulty}

Interview Summary:
{summary}

Generate a detailed, personalized report in this exact JSON format:
{{
  "overall_score": <integer 0-100>,
  "grade": "A|B|C|D|F",
  "summary": "3-4 sentence personalized summary addressing the candidate by context",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areas_for_improvement": ["specific area 1", "specific area 2", "specific area 3"],
  "recommendation": "Strong Hire|Hire|Consider|No Hire",
  "next_steps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "preparation_plan": "A 2-week preparation strategy tailored to their weak areas",
  "skill_scores": {{
    "technical_knowledge": <0-100>,
    "communication": <0-100>,
    "problem_solving": <0-100>,
    "confidence": <0-100>,
    "depth_of_answer": <0-100>
  }}
}}

JSON:"""

    text = _call_watsonx(prompt, max_new_tokens=700, temperature=0.3)
    avg = sum(item.get("score", 5) for item in qa_pairs) / max(len(qa_pairs), 1)
    overall = int(avg * 10)

    return _safe_json(text, {
        "overall_score": overall,
        "grade": "A" if overall >= 90 else "B" if overall >= 80 else "C" if overall >= 70 else "D" if overall >= 60 else "F",
        "summary": f"Interview completed for {role} at {difficulty} level.",
        "strengths": ["Completed the interview"],
        "areas_for_improvement": ["Deepen technical knowledge", "Practice concise communication"],
        "recommendation": "Consider",
        "next_steps": ["Review weak topics", "Practice on LeetCode", "Mock interviews"],
        "preparation_plan": "Focus on core fundamentals for 2 weeks before next interview.",
        "skill_scores": {
            "technical_knowledge": overall,
            "communication": overall,
            "problem_solving": overall,
            "confidence": overall,
            "depth_of_answer": overall,
        },
    })


# ─── Resume Analysis ───────────────────────────────────────────────────────────

def analyze_resume(resume_text: str, role: str) -> dict:
    """Use Granite to extract key insights from a resume text."""
    prompt = f"""Analyze this resume for a {role} position and extract key information.

Resume:
{resume_text[:2000]}

Respond in JSON:
{{
  "skills": ["skill1", "skill2", "skill3"],
  "experience_years": <estimated number>,
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "interview_focus_areas": ["area1", "area2", "area3"],
  "readiness_score": <0-100>
}}

JSON:"""

    text = _call_watsonx(prompt, max_new_tokens=400, temperature=0.3)
    return _safe_json(text, {
        "skills": [],
        "experience_years": 0,
        "strengths": [],
        "gaps": [],
        "interview_focus_areas": [],
        "readiness_score": 50,
    })
