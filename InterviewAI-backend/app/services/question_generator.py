# app/services/question_generator.py
from typing import Dict, Optional
import json
import re
from app.services.llm_client import get_llm
from app.models.content import Question, Answer
from app.config import settings


def generate_next_question(
    interview,
    resume_text: str,
    jd_text: str,
    step: int,
    provider: str = "gemini",
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict:
    """
    Generate the next question for an interview based on step & history.
    Returns: {"qtype":..., "text":..., "extra":..., "ordinal":...}
    """

    # Default provider + api key from config
    if provider == "openai" and not api_key:
        api_key = settings.OPENAI_API_KEY
        model = model or "gpt-4o-mini"
        # model = model or "gpt-3.5-turbo"

    if provider == "gemini" and not api_key:
        api_key = settings.GEMINI_API_KEY
        # model = model or "gemini-pro"
        model = model or "gemini-2.5-flash"

    # Decide qtype progression
    if step == 0:
        expected_type = "intro"
    elif step <= 2:
        expected_type = "resume"
    elif step <= 4:
        expected_type = "behavioral"
    else:
        expected_type = "coding"

    # Collect history (Q&A so far)
    history = []
    for q in interview.questions:
        ans = next((a for a in q.answers), None)
        history.append({"q": q.text, "a": ans.user_text if ans else ""})

    history_text = "\n".join(
        [f"Q{i}: {h['q']}\nA{i}: {h.get('a','')}" for i, h in enumerate(history)]
    ) or "None"

    # Build prompt
    prompt = f"""
You are a professional interviewer simulating a real interview.

Resume:
{resume_text}

Job Description:
{jd_text}

Previous Q&A so far:
{history_text}

Now generate the NEXT question.

Rules:
- Stay natural, like an HR/technical interviewer.
- If the last answer was shallow, you may ask a follow-up.
- Otherwise, move forward to the next category.
- Current target category: {expected_type}
- Response must be valid JSON object with keys:
  - qtype: one of [intro, resume, behavioral, coding]
  - text: the question
  - extra: optional metadata
    """

    try:
        llm = get_llm(provider, api_key, model)
    except Exception as e:
        print(f"LLM Exception: {e}")
        llm = None

    if llm:
        try:
            # Always use invoke(), with safe fallback
            raw = llm.invoke(prompt) if hasattr(llm, "invoke") else llm(prompt)
            raw_text = getattr(raw, "content", None) or str(raw)

            match = re.search(r"(\{.*\})", raw_text, re.S)
            json_str = match.group(1) if match else raw_text
            q = json.loads(json_str)

            q["ordinal"] = step + 1
            if "qtype" not in q:
                q["qtype"] = expected_type
            return q
        except Exception as e:
            print("⚠️ LLM parsing failed, fallback used:", e)

    # Fallback deterministic
    fallback_map = {
        "intro": "Tell me about yourself.",
        "resume": "Can you describe a project from your resume that you are proud of?",
        "behavioral": "Tell me about a time you resolved a conflict at work.",
        "coding": "Implement a function to reverse a string and explain its complexity.",
    }

    return {
        "qtype": expected_type,
        "text": fallback_map.get(expected_type, "Tell me something interesting about yourself."),
        "extra": None,
        "ordinal": step + 1,
    }
