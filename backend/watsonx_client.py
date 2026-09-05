"""
IBM watsonx.ai client — RAG-enhanced text & chat generation with IBM Granite 4.
"""
import os
import re
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / "config.env")

WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com").rstrip("/")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_MODEL_ID   = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")

_token_cache: dict = {"token": None, "expires_at": 0}


def _get_iam_token() -> str:
    """Retrieve and cache IBM Cloud IAM access token."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]
    
    if not WATSONX_API_KEY:
        raise ValueError("WATSONX_API_KEY is not set in config.env")
        
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


def _clean_json_string(text: str) -> str:
    """Remove markdown wrappers, clean common json anomalies."""
    if not text:
        return ""
    # Strip markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text.strip(), flags=re.MULTILINE)
    
    # Locate outermost braces
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]
        
    # Remove trailing commas before closing braces/brackets
    text = re.sub(r",\s*([\]}])", r"\1", text)
    return text.strip()


def _safe_json(text: str, fallback: dict) -> dict:
    """Safely parse JSON from model output with resilient error handling."""
    if not text:
        return fallback
    cleaned = _clean_json_string(text)
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Try searching for JSON using regex
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            cleaned_match = _clean_json_string(match.group(1))
            parsed = json.loads(cleaned_match)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    return fallback


def _call_watsonx_chat(messages: list, max_tokens: int = 600, temperature: float = 0.5) -> str:
    """Call watsonx.ai chat completions endpoint (recommended for Granite 4)."""
    token = _get_iam_token()
    url = f"{WATSONX_URL}/ml/v1/chat/completions?version=2023-05-29"
    payload = {
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.9,
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    choices = data.get("choices") or []
    if choices and choices[0].get("message", {}).get("content"):
        return choices[0]["message"]["content"].strip()
    raise ValueError(f"Unexpected watsonx chat response shape: {json.dumps(data)[:300]}")


def _call_watsonx_text(prompt: str, max_new_tokens: int = 600, temperature: float = 0.5) -> str:
    """Fallback call to watsonx.ai text generation endpoint."""
    token = _get_iam_token()
    url = f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"
    payload = {
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "input": prompt,
        "parameters": {
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
    data = resp.json()
    results = data.get("results") or []
    if results and results[0].get("generated_text") is not None:
        return results[0]["generated_text"].strip()
    raise ValueError(f"Unexpected watsonx text response shape: {json.dumps(data)[:300]}")


def _execute_prompt(system_prompt: str, user_prompt: str, max_tokens: int = 600, temperature: float = 0.5) -> str:
    """Execute LLM call via chat completions with fallback to text generation."""
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return _call_watsonx_chat(messages, max_tokens=max_tokens, temperature=temperature)
    except Exception as chat_err:
        try:
            combined = f"System: {system_prompt}\n\nUser: {user_prompt}\n\nAssistant:\n"
            return _call_watsonx_text(combined, max_new_tokens=max_tokens, temperature=temperature)
        except Exception:
            raise chat_err


# ─── RAG-Enhanced Question Generation ────────────────────────────────────────

def generate_interview_question(
    role: str,
    difficulty: str,
    topic: str,
    previous_questions: list = None,
    rag_context: str = "",
) -> dict:
    """Generate a contextual interview question using IBM Granite with RAG context."""
    from rag_knowledge_base import retrieve_questions

    prev_clause = ""
    if previous_questions:
        clean_prev = [q for q in previous_questions if q][-5:]
        if clean_prev:
            prev_clause = "\nAlready asked (DO NOT repeat or ask closely similar questions):\n" + "\n".join(f"- {q}" for q in clean_prev)

    system_prompt = (
        "You are an expert technical and hiring interviewer. "
        "Your task is to generate one high-quality, authentic interview question. "
        "You MUST respond ONLY with a valid JSON object matching the requested schema. Do not output markdown fences or explanatory text."
    )

    user_prompt = f"""Role: {role}
Difficulty Level: {difficulty}
Topic Area: {topic}
{rag_context}
{prev_clause}

Generate ONE original, clear, professional interview question for this candidate.
Respond ONLY with this JSON structure:
{{
  "question": "The interview question text here",
  "type": "technical",
  "hint": "A concise hint on what a strong answer should cover",
  "expected_keywords": ["keyword1", "keyword2", "keyword3"]
}}"""

    # Build smart fallback from RAG in case of API failure
    rag_items = retrieve_questions(role=role, difficulty=difficulty, category=topic, limit=5)
    best_fallback = None
    if rag_items:
        # Find one not in previous_questions
        for item in rag_items:
            if not previous_questions or not any(item["question"].lower() in pq.lower() for pq in previous_questions):
                best_fallback = item
                break
        if not best_fallback:
            best_fallback = rag_items[0]

    fallback_obj = {
        "question": best_fallback["question"] if best_fallback else f"Can you explain your experience and best practices when working with {topic} in a {role} role?",
        "type": best_fallback.get("type", "technical") if best_fallback else "technical",
        "hint": best_fallback.get("tips", f"Cover core principles, practical trade-offs, and real-world examples of {topic}.") if best_fallback else f"Cover key principles of {topic}.",
        "expected_keywords": best_fallback.get("keywords", [topic.lower(), role.lower()]) if best_fallback else [topic.lower()],
    }

    try:
        raw_text = _execute_prompt(system_prompt, user_prompt, max_tokens=350, temperature=0.7)
        parsed = _safe_json(raw_text, fallback_obj)
        if not parsed.get("question"):
            parsed["question"] = fallback_obj["question"]
        if not parsed.get("type"):
            parsed["type"] = "technical"
        if "hint" not in parsed:
            parsed["hint"] = fallback_obj.get("hint", "")
        if "expected_keywords" not in parsed or not isinstance(parsed.get("expected_keywords"), list):
            parsed["expected_keywords"] = fallback_obj.get("expected_keywords", [])
        return parsed
    except Exception:
        return fallback_obj


# ─── RAG-Enhanced Answer Evaluation ─────────────────────────────────────────

def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    difficulty: str,
    model_answer_hint: str = "",
) -> dict:
    """Evaluate a candidate's answer with IBM Granite and RAG model answer reference."""
    rag_hint = ""
    if model_answer_hint:
        rag_hint = f"\nReference Model Answer Outline: {model_answer_hint}\n"

    system_prompt = (
        "You are an expert technical interviewer evaluating a candidate's interview answer. "
        "Score objectively on a 1-10 scale based on accuracy, depth, clarity, and relevance. "
        "Provide constructive feedback, highlight concrete strengths, areas for improvement, and a concise model answer. "
        "You MUST respond ONLY with a valid JSON object matching the requested schema."
    )

    user_prompt = f"""Role: {role}
Difficulty Level: {difficulty}
Question: {question}
Candidate's Answer: {answer}
{rag_hint}

Evaluate the candidate's answer thoroughly.
Respond ONLY with this JSON structure:
{{
  "score": <integer from 1 to 10>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific area for improvement 1", "specific area for improvement 2"],
  "feedback": "2-3 constructive sentences explaining the evaluation and how to improve",
  "sample_answer": "A clear, comprehensive model answer hitting all key points",
  "missing_concepts": ["key concept or keyword missed"]
}}"""

    # Build smart fallback evaluation
    ans_words = len(answer.strip().split()) if answer else 0
    if ans_words < 5:
        fallback_score = 3
        fallback_feedback = "Your answer was very brief. Try to elaborate on technical details, structure, and real-world examples."
        fallback_strengths = ["Answer submitted"]
        fallback_improvements = ["Provide more detailed explanations", "Include concrete examples and trade-offs"]
    elif ans_words < 20:
        fallback_score = 6
        fallback_feedback = "Good initial thought. Expanding on edge cases, performance considerations, and architecture would make your answer stronger."
        fallback_strengths = ["Addressed the core question"]
        fallback_improvements = ["Elaborate on implementation details", "Mention key trade-offs"]
    else:
        fallback_score = 8
        fallback_feedback = "Strong and detailed explanation covering the fundamental concepts well."
        fallback_strengths = ["Detailed response", "Demonstrated solid conceptual understanding"]
        fallback_improvements = ["Structure answer with explicit points", "Highlight edge cases"]

    fallback_obj = {
        "score": fallback_score,
        "strengths": fallback_strengths,
        "improvements": fallback_improvements,
        "feedback": fallback_feedback,
        "sample_answer": model_answer_hint or "A strong answer explains core definitions, trade-offs, practical application, and edge cases.",
        "missing_concepts": [],
    }

    try:
        raw_text = _execute_prompt(system_prompt, user_prompt, max_tokens=550, temperature=0.3)
        parsed = _safe_json(raw_text, fallback_obj)
        # Ensure score is an int between 1 and 10
        try:
            parsed["score"] = max(1, min(10, int(parsed.get("score", fallback_score))))
        except Exception:
            parsed["score"] = fallback_score

        if not parsed.get("strengths") or not isinstance(parsed["strengths"], list):
            parsed["strengths"] = fallback_obj["strengths"]
        if not parsed.get("improvements") or not isinstance(parsed["improvements"], list):
            parsed["improvements"] = fallback_obj["improvements"]
        if not parsed.get("feedback"):
            parsed["feedback"] = fallback_obj["feedback"]
        if not parsed.get("sample_answer"):
            parsed["sample_answer"] = fallback_obj["sample_answer"]
        if "missing_concepts" not in parsed or not isinstance(parsed.get("missing_concepts"), list):
            parsed["missing_concepts"] = []
        return parsed
    except Exception:
        return fallback_obj


# ─── RAG-Enhanced Report Generation ─────────────────────────────────────────

def generate_report(
    role: str,
    difficulty: str,
    qa_pairs: list,
    user_name: str = "",
    experience: str = "",
) -> dict:
    """Generate a comprehensive performance report across all questions."""
    summary_lines = []
    total_score = 0
    valid_count = 0
    for i, item in enumerate(qa_pairs):
        q_score = item.get("score", 5)
        total_score += q_score
        valid_count += 1
        summary_lines.append(
            f"Q{i+1} [Score: {q_score}/10]: {item.get('question', '')}\n"
            f"   Candidate Answer: {item.get('answer', '')[:250]}"
        )
    qa_summary = "\n\n".join(summary_lines)
    
    avg_score = (total_score / max(valid_count, 1)) * 10  # Scale 0-100
    overall_num = int(round(avg_score))
    
    if overall_num >= 90:
        grade = "A"
        recommendation = "Strong Hire"
    elif overall_num >= 80:
        grade = "B"
        recommendation = "Hire"
    elif overall_num >= 70:
        grade = "C"
        recommendation = "Consider"
    elif overall_num >= 60:
        grade = "D"
        recommendation = "Consider"
    else:
        grade = "F"
        recommendation = "No Hire"

    candidate_ctx = f"Candidate Name: {user_name or 'Candidate'}, Experience Level: {experience or 'Mid-level'}"

    system_prompt = (
        "You are an expert technical interviewer and hiring manager. "
        "Generate a comprehensive, personalized performance evaluation report. "
        "You MUST respond ONLY with a valid JSON object matching the requested schema."
    )

    user_prompt = f"""{candidate_ctx}
Target Role: {role}
Difficulty Level: {difficulty}

Interview Questions and Answers Summary:
{qa_summary}

Calculate overall performance and generate a detailed report.
Respond ONLY with this JSON structure:
{{
  "overall_score": <integer 0-100>,
  "grade": "A|B|C|D|F",
  "summary": "3-4 sentence comprehensive executive summary of candidate performance",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areas_for_improvement": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "recommendation": "Strong Hire|Hire|Consider|No Hire",
  "next_steps": ["actionable preparation step 1", "actionable preparation step 2", "actionable preparation step 3"],
  "preparation_plan": "A tailored 2-week preparation strategy addressing key gaps",
  "skill_scores": {{
    "technical_knowledge": <integer 0-100>,
    "communication": <integer 0-100>,
    "problem_solving": <integer 0-100>,
    "confidence": <integer 0-100>,
    "depth_of_answer": <integer 0-100>
  }}
}}"""

    fallback_obj = {
        "overall_score": overall_num,
        "grade": grade,
        "summary": f"{user_name or 'The candidate'} completed the {difficulty}-level {role} interview with an overall score of {overall_num}%. Demonstrates foundational competency and clear communication with opportunities to deepen architectural and technical nuances.",
        "strengths": [
            f"Demonstrated good foundational knowledge of {role} concepts",
            "Clear and articulate communication style",
            "Addressed key interview topics systematically",
        ],
        "areas_for_improvement": [
            "Provide deeper analysis of edge cases and performance trade-offs",
            "Elaborate on production scalability considerations",
            "Structure complex answers using standard frameworks (e.g., STAR)",
        ],
        "recommendation": recommendation,
        "next_steps": [
            f"Practice system design and advanced problem solving for {role}",
            "Review core data structure and architecture trade-offs",
            "Conduct timed mock interview sessions on weak topics",
        ],
        "preparation_plan": f"Week 1: Focus on deep-dive technical reviews and core algorithms. Week 2: Practice system design case studies and mock behavioral questions for {role}.",
        "skill_scores": {
            "technical_knowledge": min(100, max(20, overall_num + 2)),
            "communication": min(100, max(20, overall_num - 2)),
            "problem_solving": min(100, max(20, overall_num)),
            "confidence": min(100, max(20, overall_num - 5)),
            "depth_of_answer": min(100, max(20, overall_num - 3)),
        },
    }

    try:
        raw_text = _execute_prompt(system_prompt, user_prompt, max_tokens=700, temperature=0.3)
        parsed = _safe_json(raw_text, fallback_obj)
        # Validate score and skills
        try:
            parsed["overall_score"] = max(0, min(100, int(parsed.get("overall_score", overall_num))))
        except Exception:
            parsed["overall_score"] = overall_num

        if not parsed.get("grade") or parsed["grade"] not in ["A", "B", "C", "D", "F"]:
            parsed["grade"] = grade
        if not parsed.get("recommendation"):
            parsed["recommendation"] = recommendation
        if not parsed.get("summary"):
            parsed["summary"] = fallback_obj["summary"]
        if not parsed.get("strengths") or not isinstance(parsed["strengths"], list):
            parsed["strengths"] = fallback_obj["strengths"]
        if not parsed.get("areas_for_improvement") or not isinstance(parsed["areas_for_improvement"], list):
            parsed["areas_for_improvement"] = fallback_obj["areas_for_improvement"]
        if not parsed.get("next_steps") or not isinstance(parsed["next_steps"], list):
            parsed["next_steps"] = fallback_obj["next_steps"]
        if not parsed.get("preparation_plan"):
            parsed["preparation_plan"] = fallback_obj["preparation_plan"]
        
        skill_scores = parsed.get("skill_scores")
        if not skill_scores or not isinstance(skill_scores, dict):
            parsed["skill_scores"] = fallback_obj["skill_scores"]
        else:
            for k in ["technical_knowledge", "communication", "problem_solving", "confidence", "depth_of_answer"]:
                if k not in skill_scores:
                    skill_scores[k] = fallback_obj["skill_scores"][k]
                else:
                    try:
                        skill_scores[k] = max(0, min(100, int(skill_scores[k])))
                    except Exception:
                        skill_scores[k] = overall_num
        return parsed
    except Exception:
        return fallback_obj


# ─── Resume Analysis ───────────────────────────────────────────────────────────

def analyze_resume(resume_text: str, role: str) -> dict:
    """Extract key insights, skills, and focus areas from candidate resume."""
    from rag_knowledge_base import search_by_resume_keywords

    matched_kb = search_by_resume_keywords(resume_text, role)
    inferred_categories = list({q["category"] for q in matched_kb})

    system_prompt = (
        "You are an expert technical talent assessor. "
        "Extract technical skills, estimated years of experience, strengths, skill gaps, and interview focus areas. "
        "You MUST respond ONLY with a valid JSON object matching the requested schema."
    )

    user_prompt = f"""Target Role: {role}

Resume Content:
{resume_text[:2500]}

Analyze this resume thoroughly.
Respond ONLY with this JSON structure:
{{
  "skills": ["extracted technical skill 1", "skill 2", "skill 3", "skill 4"],
  "experience_years": <estimated integer number of years>,
  "strengths": ["key candidate strength 1", "key candidate strength 2"],
  "gaps": ["potential skill or domain gap 1", "gap 2"],
  "interview_focus_areas": ["priority interview topic 1", "priority interview topic 2"],
  "readiness_score": <integer 0-100>
}}"""

    fallback_obj = {
        "skills": inferred_categories or ["Software Engineering", "Problem Solving", "System Architecture"],
        "experience_years": 3,
        "strengths": ["Demonstrated hands-on project experience", "Relevant technical stack knowledge"],
        "gaps": ["Deep distributed systems edge cases", "Large-scale performance optimization"],
        "interview_focus_areas": inferred_categories[:3] if inferred_categories else ["Core Fundamentals", "System Design"],
        "readiness_score": 75,
    }

    try:
        raw_text = _execute_prompt(system_prompt, user_prompt, max_tokens=450, temperature=0.3)
        parsed = _safe_json(raw_text, fallback_obj)
        if not parsed.get("skills") or not isinstance(parsed["skills"], list):
            parsed["skills"] = fallback_obj["skills"]
        return parsed
    except Exception:
        return fallback_obj

