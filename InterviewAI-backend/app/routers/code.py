from fastapi import APIRouter, Depends, HTTPException
from app.services.code_runner import run_python_code, run_code
from app.schemas.content import CodeRunRequest, CodeRunResponse


router = APIRouter()


@router.post("/run_code", response_model=CodeRunResponse)
def run_code_api(payload: CodeRunRequest):
    """
    Run code (without saving as an interview answer).
    This is used for the 'Run Code' button in frontend.
    """
    try:
        success, output = run_code(payload.language_code, payload.code, stdin=payload.stdin)
        return CodeRunResponse(success=success, output=output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
