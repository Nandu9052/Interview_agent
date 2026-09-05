"""IBM watsonx Orchestrate tools for the Interview Trainer agent."""
import os
import requests
import json
from ibm_watsonx_orchestrate.agent_builder.tools import tool, ToolPermission

WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_MODEL_ID   = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")

_token_cache: dict = {"token": None, "expires_at": 0}


def _get_token(api_key: str) -> str:
    import time
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key},
        timeout=30,
    )
    resp.raise_for_status()
    d = resp.json()
    _token_cache["token"] = d["access_token"]
    _token_cache["expires_at"] = now + d.get("expires_in", 3600)
    return _token_cache["token"]


def _generate(prompt: str, api_key: str, max_tokens: int = 600, temp: float = 0.7) -> str:
    token = _get_token(api_key)
    url = f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"
    payload = {
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "input": prompt,
        "parameters": {"decoding_method": "sample", "max_new_tokens": max_tokens, "temperature": temp, "top_p": 0.9},
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["results"][0]["generated_text"].strip()


@tool(
    name="generate_interview_question",
    description="Generate a tailored interview question for a specific role, difficulty and topic using IBM Granite.",
    permission=ToolPermission.READ_ONLY,
)
def generate_interview_question(
    role: str,
    difficulty: str,
    topic: str,
    api_key: str,
) -> str:
    """
    Generate a technical or behavioral interview question.

    Args:
        role: The job role (e.g. 'Software Engineer', 'Data Scientist')
        difficulty: Question difficulty: 'Easy', 'Medium', or 'Hard'
        topic: The topic area (e.g. 'Data Structures', 'System Design')
        api_key: IBM Cloud API key for watsonx.ai authentication

    Returns:
        A JSON string with the question, type, hint, and expected keywords
    """
    prompt = f"""You are an expert technical interviewer for a {difficulty} {role} interview.
Generate ONE interview question about: {topic}

Respond in JSON format:
{{"question": "...", "type": "technical|behavioral", "hint": "...", "expected_keywords": ["..."]}}

JSON:"""
    result = _generate(prompt, api_key, max_tokens=300, temp=0.8)
    try:
        start = result.find("{")
        end = result.rfind("}") + 1
        return result[start:end]
    except Exception:
        return json.dumps({"question": result, "type": "technical", "hint": "", "expected_keywords": []})


@tool(
    name="evaluate_interview_answer",
    description="Evaluate a candidate's answer to an interview question and provide detailed feedback with a score.",
    permission=ToolPermission.READ_ONLY,
)
def evaluate_interview_answer(
    question: str,
    answer: str,
    role: str,
    difficulty: str,
    api_key: str,
) -> str:
    """
    Evaluate a candidate answer and return structured feedback.

    Args:
        question: The interview question that was asked
        answer: The candidate's answer
        role: The target job role
        difficulty: Interview difficulty level
        api_key: IBM Cloud API key for watsonx.ai authentication

    Returns:
        A JSON string with score (1-10), strengths, improvements, feedback, and sample_answer
    """
    prompt = f"""Evaluate this {difficulty} {role} interview answer:
Question: {question}
Answer: {answer}

Respond in JSON:
{{"score": <1-10>, "strengths": ["..."], "improvements": ["..."], "feedback": "...", "sample_answer": "..."}}

JSON:"""
    result = _generate(prompt, api_key, max_tokens=500, temp=0.3)
    try:
        start = result.find("{")
        end = result.rfind("}") + 1
        return result[start:end]
    except Exception:
        return json.dumps({"score": 5, "strengths": [], "improvements": [], "feedback": result, "sample_answer": ""})


@tool(
    name="generate_interview_report",
    description="Generate a comprehensive performance report after completing an interview session.",
    permission=ToolPermission.READ_ONLY,
)
def generate_interview_report(
    role: str,
    difficulty: str,
    qa_summary: str,
    api_key: str,
) -> str:
    """
    Generate a final interview performance report.

    Args:
        role: The job role interviewed for
        difficulty: Interview difficulty level
        qa_summary: A text summary of questions asked and answers given
        api_key: IBM Cloud API key for watsonx.ai authentication

    Returns:
        A JSON string with overall_score, grade, recommendation, strengths, improvements, and skill_scores
    """
    prompt = f"""Generate a performance report for a {difficulty} {role} interview.

{qa_summary}

Respond in JSON:
{{"overall_score": <1-100>, "grade": "A|B|C|D|F", "summary": "...", "strengths": ["..."], "areas_for_improvement": ["..."], "recommendation": "Hire|Consider|No Hire", "next_steps": ["..."], "skill_scores": {{"technical_knowledge": <1-100>, "communication": <1-100>, "problem_solving": <1-100>, "confidence": <1-100>, "depth_of_answer": <1-100>}}}}

JSON:"""
    result = _generate(prompt, api_key, max_tokens=600, temp=0.3)
    try:
        start = result.find("{")
        end = result.rfind("}") + 1
        return result[start:end]
    except Exception:
        return json.dumps({"overall_score": 60, "grade": "C", "summary": result, "strengths": [], "areas_for_improvement": [], "recommendation": "Consider", "next_steps": [], "skill_scores": {}})
