# app/services/parse_and_ai.py
import io
import pdfplumber
import docx
import json
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from app.services.llm_client import get_llm  # factory that returns a langchain-compatible LLM or None

# ---------- Parsing helpers ----------
def parse_pdf(file_bytes: bytes) -> str:
    text_chunks = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_chunks.append(page_text)
    return "\n\n".join(text_chunks).strip()

def parse_docx(file_bytes: bytes) -> str:
    f = io.BytesIO(file_bytes)
    doc = docx.Document(f)
    paragraphs = [p.text for p in doc.paragraphs if p.text]
    return "\n\n".join(paragraphs).strip()

def parse_file(filename: str, file_bytes: bytes) -> str:
    filename = filename.lower()
    if filename.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif filename.endswith(".docx"):
        return parse_docx(file_bytes)
    else:
        try:
            return file_bytes.decode("utf-8")
        except Exception:
            return ""

# ---------- Question generation ----------
def generate_questions_from_resume_and_jd(
    resume_text: str,
    jd_text: str,
    num_resume_q: int = 3,
    num_behavioral: int = 2,
    num_coding: int = 2,
    provider: str = "openai",
    provider_api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> List[Dict]:
    """
    Returns list of dicts: {"qtype":..., "text":..., "extra":..., "ordinal":...}
    Uses LLM via factory if available, else returns deterministic fallback.
    """
    # Build LLM client (LangChain style); may return None if not configured
    llm = None
    try:
        llm = get_llm(provider=provider, api_key=provider_api_key, model=model)
    except Exception:
        llm = None

    # Simple fallback deterministic questions if no llm or if quota exhausted
    if not llm:
        questions = []
        for i in range(num_resume_q):
            questions.append({"qtype": "resume", "text": f"Resume-based question {i+1}: Describe a project you worked on related to skill X.", "extra": None, "ordinal": i})
        for j in range(num_behavioral):
            questions.append({"qtype": "behavioral", "text": f"Behavioral question {j+1}: Tell me about a time you resolved a conflict.", "extra": None, "ordinal": num_resume_q + j})
        for k in range(num_coding):
            questions.append({"qtype": "coding", "text": f"Coding question {k+1}: Implement function to reverse a string and describe complexity.", "extra": json.dumps({"difficulty":"easy/medium"}), "ordinal": num_resume_q + num_behavioral + k})
        return questions

    # Build prompt
    # Use a clean, structured prompt that requests JSON output
    prompt = f"""
You are an interviewer. Given the resume and the job description, produce a JSON array of interview questions.

Requirements:
- Produce exactly {num_resume_q} resume-based technical questions referencing the resume.
- Produce exactly {num_behavioral} behavioral questions aligned with the JD.
- Produce exactly {num_coding} coding questions (easy/medium) with a short spec in metadata.
Return a JSON array where each element has keys: qtype (resume|behavioral|coding), text, extra (optional JSON), ordinal.

Resume:
{resume_text}

Job Description:
{jd_text}
    """

    # Use the llm to generate text. We assume llm.call or .generate style depending on provider wrapper.
    try:
        # LangChain-compatible: many wrappers can be called with llm(prompt) or llm.generate
        if hasattr(llm, "generate") or hasattr(llm, "call") or hasattr(llm, "__call__"):
            raw = None
            try:
                # try typical call interface
                raw = llm(prompt)
            except TypeError:
                try:
                    raw = llm.call(prompt)
                except Exception:
                    raw = llm.generate([prompt])  # some use generate
                    # extract text
                    if hasattr(raw, "generations"):
                        raw = raw.generations[0][0].text
            # raw may be a dict-like response or string
            if isinstance(raw, (dict, list)):
                # if llm returned structured result
                raw_text = json.dumps(raw)
            else:
                raw_text = str(raw)
        else:
            raw_text = ""
    except Exception as e:
        raw_text = ""

    # Try to extract JSON array
    try:
        import re
        m = re.search(r"(\[.*\])", raw_text, re.S)
        json_str = m.group(1) if m else raw_text
        data = json.loads(json_str)
        # ensure ordinal
        for idx, item in enumerate(data):
            if "ordinal" not in item:
                item["ordinal"] = idx
            if "extra" not in item and "metadata" in item:
                item["extra"] = item.get("metadata")
        return data
    except Exception:
        # fallback if parsing fails
        return [
            {"qtype":"resume","text":"Describe a key project from your resume.","extra":None,"ordinal":0},
            {"qtype":"behavioral","text":"Tell me about a time you faced a challenge.","extra":None,"ordinal":1},
            {"qtype":"coding","text":"Implement a function that reverses a string and explain complexity.","extra":None,"ordinal":2},
        ]
