# app/services/code_runner.py
import subprocess
import tempfile
import uuid
from typing import Tuple, Optional
import requests
from app.config import settings

HEADERS = {
    "X-RapidAPI-Host": settings.RAPIDAPI_HOST,
    "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
    "Content-Type": "application/json"
}

def run_python_code(user_code: str, input_data: str = "") -> Tuple[bool, str]:
    """
    Very simple python runner for dev only.
    WARNING: This runs untrusted code — DO NOT use in production.
    Use a sandbox (docker, gVisor, Firecracker) or external service.
    Returns (success, output_text)
    """
    fname = f"/tmp/{uuid.uuid4().hex}.py"
    try:
        with open(fname, "w", encoding="utf-8") as f:
            f.write(user_code)
        # run with timeout
        proc = subprocess.run(["python", fname], input=input_data.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10)
        out = proc.stdout.decode("utf-8", errors="ignore")
        success = proc.returncode == 0
        return success, out
    except subprocess.TimeoutExpired:
        return False, "Timeout expired"
    except Exception as e:
        return False, str(e)




# Mapping languages to Judge0 IDs (CE version)
LANGUAGE_MAP = {
    "python": 71,      # Python 3.8.1
    "javascript": 63,  # Node.js 12.14.0
    "cpp": 54,         # C++ (GCC 9.2.0)
    "java": 62,        # Java (OpenJDK 13.0.1)
    "go": 60           # Go (1.13.5)
}

def run_code(language: str, code: str, stdin: Optional[str] = "") -> Tuple[bool, str]:
    """
    Run code using Judge0 API (via RapidAPI).
    language: one of python, javascript, cpp, java, go
    code: source code as string
    stdin: optional input string
    Returns (success, output)
    """
    if language not in LANGUAGE_MAP:
        return False, f"Language '{language}' not supported."

    url = f"https://{settings.RAPIDAPI_HOST}/submissions?base64_encoded=false&wait=true"

    payload = {
        "language_id": LANGUAGE_MAP[language],
        "source_code": code,
        "stdin": stdin
    }

    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=15)
        response.raise_for_status()
        result = response.json()

        # Judge0 returns output fields
        stdout = result.get("stdout")
        stderr = result.get("stderr")
        compile_output = result.get("compile_output")

        if stdout:
            return True, stdout.strip()
        elif stderr:
            return False, stderr.strip()
        elif compile_output:
            return False, compile_output.strip()
        else:
            return False, "No output received."
    except Exception as e:
        return False, str(e)
