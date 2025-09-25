# app/services/scoring.py
from typing import Optional
import math


# def score_answer(user_answer: str, ...):
#     pass


def score_text_answer(user_text: str, reference: Optional[str] = None) -> int:
    """
    Very simple heuristic scoring: length & presence of keywords (placeholder).
    Return 0-10.
    """
    if not user_text or user_text.strip() == "":
        return 0
    base = min(10, max(1, len(user_text.split()) // 10))  # 1 point per ~10 words up to 10
    # TODO: compare with reference using embedding similarity or LLM scoring
    return int(base)

def aggregate_scores(tech_scores: list[int], behavioral_scores: list[int], coding_scores: list[int]) -> int:
    if not (tech_scores or behavioral_scores or coding_scores):
        return 0
    # simple weighted average
    tech_avg = sum(tech_scores)/len(tech_scores) if tech_scores else 0
    beh_avg = sum(behavioral_scores)/len(behavioral_scores) if behavioral_scores else 0
    code_avg = sum(coding_scores)/len(coding_scores) if coding_scores else 0
    # weights: coding 40%, technical 35%, behavioral 25%
    total = (0.4*code_avg + 0.35*tech_avg + 0.25*beh_avg)
    return int(round(total))



# app/services/scoring.py
from typing import Optional, Dict
import json
from app.services.llm_client import get_llm


def score_with_llm(
    question_text: str,
    user_answer: str,
    qtype: str = "general",
    reference: Optional[str] = None,
    provider: str = "gemini",
    model: str = "gemini-2.5-flash"
) -> Dict[str, int]:
    """
    Ask the LLM to evaluate the candidate's answer.
    Returns a dict of scores like:
      {"technical_score": 7, "behavioral_score": 5, "coding_score": 0, "overall_score": 6}
    """

    if not user_answer or user_answer.strip() == "":
        return {"technical_score": 0, "behavioral_score": 0, "coding_score": 0, "overall_score": 0}

    llm = get_llm(provider=provider, model=model)

    prompt = f"""
    You are an expert interview evaluator. 
    Evaluate the candidate's answer to the question.

    Question type: {qtype}
    Question: {question_text}
    Candidate Answer: {user_answer}
    Reference Context (if any): {reference or "N/A"}

    Please respond in strict JSON format with integer scores from 0 to 10:
    {{
      "score": int,   // overall score.
    }}
    """

    try:
        response = llm.invoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        scores = json.loads(text)
        return  int(scores.get("score", 0))
        
    except Exception as e:
        # fallback: simple heuristic
        base = min(10, max(1, len(user_answer.split()) // 10))
        return base