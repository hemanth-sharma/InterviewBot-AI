# Interview Practice Bot 🚀

An **AI-powered interview preparation platform** that simulates real interview experiences.  
It supports **technical, behavioral, and coding questions**, provides **instant scoring & feedback**, and even lets you **practice coding with live code execution**.

---

## ✨ Features

- 🎙️ **Voice Input** – Answer questions by speaking; speech is transcribed in real time.  
- 🧑‍💻 **Coding Questions with Code Runner** – Run your code instantly using the Judge0 API.  
- 🤖 **AI-Powered Questions** – Dynamically generated interview questions based on your resume and job description.  
- 📊 **Scoring & Feedback** – Each answer is evaluated by AI (for text) or executed (for code).  
- ⏱️ **Timer & Session Control** – Time-bound interviews that auto-submit when time expires.  
- 🎧 **Voice Playback** – Questions are read aloud to simulate a real interview environment.  

---

## 🏗️ Tech Stack

**Frontend (UI):**
- [Next.js](https://nextjs.org/) – React framework for the web app  
- Tailwind CSS – modern styling  
- Web Speech API – browser-based speech recognition & synthesis  

**Backend (API):**
- [FastAPI](https://fastapi.tiangolo.com/) – Python backend for interviews & scoring  
- PostgreSQL – database for users, resumes, job descriptions, and interview sessions  
- Judge0 API – code execution service  
- OpenAI/Gemini – LLM-based scoring & question generation  

---

## ⚙️ Setup

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/interview-bot.git
cd interview-bot

```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

pip install -r requirements.txt
```
#### Configure .env inside backend/:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/interviewbot
SECRET_KEY=supersecretkey
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
RAPIDAPI_KEY=your_rapidapi_judge0_key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```
#### Run FastAPI
```bash
uvicorn app.main:app --reload
```
### 3. Frontend (NextJs)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at 👉 http://localhost:3000


#### 📡 API Endpoints (Key)

- POST /interview/start – start a new interview session
- POST /interview/{id}/next – get next question
- POST /interview/{id}/answer – submit an answer
- POST /code/run_code – standalone run-code endpoint
- POST /interview/{id}/end – end the interview & calculate score


#### 🎮 Usage Flow

1. Upload resume + job description (optional).
2. Start an interview → First question is generated.
3. Answer via typing, speaking, or coding.
4. Get real-time scoring & feedback.
5. Timer auto-submits when session ends.
6. Final score & breakdown shown in dashboard.

### Folder Structure
```bash
interviewai-frontend/       # Next.js app
  └── src/
      ├── app/              # Pages (dashboard, interview, login, etc.)
      ├── components/       # Navbar, UI components
      ├── lib/              # API calls, hooks (speech, etc.)
      └── globals.css       # Tailwind setup

interviewai-backend/        # FastAPI app
  └── app/
      ├── routers/          # Routes (interview, auth, code)
      ├── services/         # Code runner, scoring, question generator
      ├── models/           # SQLAlchemy models
      ├── schemas/          # Pydantic schemas
      └── config.py         # Settings (env vars)

```

### 🚀 Roadmap
- Add Leetcode question style
- Add unit test cases for code runner
- Improve scoring with custom rubric per question type
- Deploy with Docker & CI/CD pipeline


### 📜 License

MIT License © 2025 – Built with ❤️ for better interview preparation.