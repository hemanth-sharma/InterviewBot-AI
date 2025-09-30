from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, resume, job, interview, history, feedback, code

app = FastAPI(title="Interview Practice Bot MVP")

# Allow frontend
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://127.0.0.1:3000",
    # Later you can add your production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(job.router, prefix="/job", tags=["Job"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(feedback.router, prefix="/feedbacks", tags=["feedbacks"])
app.include_router(code.router, prefix="/code", tags=["Code"])


@app.get("/")
def root():
    return {"message": "Interview Practice Bot API is running 🚀"}
