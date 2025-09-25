from sqlalchemy.orm import Session
from app.models.content import Interview, Answer

def calculate_scores(interview: Interview, db: Session):
    """
    Go through all answers and compute per-category scores.
    Assume qtype is in ['behavioral', 'coding', 'resume'].
    """
    scores = {"behavioral": [], "coding": [], "technical": []}

    for answer in interview.answers:
        qtype = answer.question.qtype if answer.question else None
        if qtype == "behavioral":
            scores["behavioral"].append(answer.score or 0)
        elif qtype == "coding":
            scores["coding"].append(answer.score or 0)
        elif qtype == "resume":
            scores["technical"].append(answer.score or 0)

    def avg(lst): return int(sum(lst)/len(lst)) if lst else 0

    return {
        "technical_score": avg(scores["technical"]),
        "behavioral_score": avg(scores["behavioral"]),
        "coding_score": avg(scores["coding"]),
        "overall_score": int(
            (avg(scores["technical"]) + avg(scores["behavioral"]) + avg(scores["coding"])) / 3
        ),
    }


def generate_feedback(interview: Interview, scores: dict) -> str:
    """
    Placeholder for AI feedback generation.
    Right now, return a simple text based on scores.
    """
    prompt = "Give a one to two lines feedback on improvements to consider on the below interview scores."
    fb = []
    if scores["technical_score"] < 50:
        fb.append("Work on your technical knowledge; try practicing more fundamentals.")
    else:
        fb.append("Your technical knowledge seems solid.")

    if scores["behavioral_score"] < 50:
        fb.append("Improve your communication and STAR method for behavioral answers.")
    else:
        fb.append("You communicate your experiences well.")

    if scores["coding_score"] < 50:
        fb.append("Focus more on coding practice and debugging skills.")
    else:
        fb.append("Your coding skills are good.")

    return " ".join(fb)
