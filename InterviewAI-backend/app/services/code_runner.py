# app/services/code_runner.py
import subprocess
import tempfile
import uuid
from typing import Tuple, Optional

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
