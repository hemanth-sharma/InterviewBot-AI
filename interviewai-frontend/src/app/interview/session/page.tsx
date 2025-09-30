"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { endInterview, getNextQuestion, getInterview, submitAnswer, runCode } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { useSpeechToText } from "@/lib/useSpeechToText";

export default function InterviewSessionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const interviewId = useMemo(() => Number(params.get("interviewId")), [params]);

  const [mode, setMode] = useState<"text" | "code">("text");
  const [language, setLanguage] = useState("Python");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [questionOrdinal, setQuestionOrdinal] = useState<number>(1);
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionType, setQuestionType] = useState<string>("");

  const [answerText, setAnswerText] = useState("");
  const [codeText, setCodeText] = useState("// Start writing your code here...");

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording } = useSpeechToText();
  const [showExpired, setShowExpired] = useState(false);

  const languageMap: Record<string, string> = {
    Python: "python",
    JavaScript: "javascript",
    Go: "go",
    Java: "java",
    "C++": "cpp",
  };
  


  // 🔹 Load interview first
  useEffect(() => {
    if (!interviewId || Number.isNaN(interviewId)) return;
    loadInterview();
  }, [interviewId]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowExpired(true);
    }
  }, [timeLeft]);
  

  async function loadInterview() {
    try {
      const interview: any = await getInterview(interviewId);
      setExpiresAt(interview.expires_at);

      const now = new Date();
      const expires = new Date(interview.expires_at);

      if (!interview.is_active) {
        router.replace("/dashboard"); // redirect to dashboard
        return;
      }

      if (interview.questions.length > 0) {
        const lastQ = interview.questions[interview.questions.length - 1];
        setQuestionId(lastQ.id);
        setQuestionText(lastQ.text);
        setQuestionType(lastQ.qtype);
        setQuestionOrdinal(lastQ.ordinal);

        speakQuestion(lastQ.text); // 🔊 Speak when loaded
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load interview");
    }
  }

  async function loadNextQuestion() {
    setError(null);
    setIsLoading(true);
    try {
      const res: any = await getNextQuestion(interviewId);
      setQuestionId(res.question_id);
      setQuestionText(res.text);
      setQuestionType(res.qtype);
      setQuestionOrdinal(res.ordinal);
      setAnswerText("");
      setCodeText("// Start writing your code here...");

      speakQuestion(res.text); // 🔊 Speak next question
    } catch (err: any) {
      setError(err?.message || "Failed to load next question");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitAnswer() {
    if (!interviewId || !questionId) return;
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        question_id: questionId,
        user_text: mode === "text" ? answerText : "",
        is_coding: mode === "code",
        code: mode === "code" ? codeText : undefined,
        code_language: mode === "code" ? language : undefined,
      };
      await submitAnswer(interviewId, payload);
      await loadNextQuestion();
    } catch (err: any) {
      setError(err?.message || "Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  }

  async function onEndInterview() {
    if (!interviewId) return;
    setError(null);
    setIsLoading(true);
    try {
      await endInterview(interviewId);
      router.replace("/assessments");
    } catch (err: any) {
      setError(err?.message || "Failed to end interview");
    } finally {
      setIsLoading(false);
    }
  }

  async function onRunCode() {
    setError(null);
    setTestOutput("Running code...");
    try {
      const res: any = await runCode({
        code: codeText,
        language_code: languageMap[language] || language.toLowerCase(),
      });
      setTestOutput(res.output || (res.success ? "Executed successfully ✅" : "Execution failed ❌"));
    } catch (err: any) {
      setTestOutput(null);
      setError(err?.message || "Failed to run code");
    }
  }
  

  // Timer
  useEffect(() => {
    if (!expiresAt) return;

    function updateTimer() {
      let safeExpiresAt = expiresAt;
      if (safeExpiresAt.includes(".")) {
        safeExpiresAt = safeExpiresAt.split(".")[0] + "Z";
      } else if (!safeExpiresAt.endsWith("Z")) {
        safeExpiresAt += "Z";
      }
      const diff = new Date(safeExpiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  function formatTime(seconds: number | null) {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // 🔊 Voice-over for questions
  function speakQuestion(text: string) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1; // adjust speed
    utterance.pitch = 1;
    window.speechSynthesis.cancel(); // stop any previous speech
    window.speechSynthesis.speak(utterance);
  }

  // Recording
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((spokenText) => {
        setAnswerText((prev) => prev + " " + spokenText);
      });
    }
  }
  

  const headerTitle = questionText || "Loading question...";

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-xs text-gray-400">QUESTION {questionOrdinal}</div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <span className="material-symbols-outlined text-gray-400">timer</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <h1 className="text-center text-xl md:text-2xl font-extrabold tracking-tight mb-6 flex items-center justify-center gap-3">
          {headerTitle}
          <button
            onClick={() => speakQuestion(headerTitle)}
            className="ml-2 p-2 rounded-full bg-[#2B3947] hover:bg-[#3b4d5e]"
            aria-label="Play question audio"
          >
            <span className="material-symbols-outlined">volume_up</span>
          </button>
        </h1>

        {/* Card */}
        <div className="rounded-xl border border-[#233648] bg-[#111A22] shadow-xl shadow-black/20 overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#233648]">
            <div className="flex items-center gap-3 text-gray-300">
            <button
              onClick={toggleRecording}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition shadow-md ${
                isRecording ? "bg-red-600 animate-pulse" : "bg-[#2B3947] hover:bg-[#3b4d5e]"
              }`}
              aria-label="Toggle speech recognition"
            >
              <span className="material-symbols-outlined text-white text-xl">
                {isRecording ? "mic_off" : "mic"}
              </span>
            </button>


              {/* <span className="material-symbols-outlined text-xl">mic</span> */}
              <span>Speak or type your answer</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("text")}
                className={`px-3 py-1 rounded-md text-sm ${mode === "text" ? "bg-blue-600" : "bg-[#0F1720]"}`}
              >
                Text
              </button>
              <button
                onClick={() => setMode("code")}
                className={`px-3 py-1 rounded-md text-sm ${mode === "code" ? "bg-blue-600" : "bg-[#0F1720]"}`}
              >
                Code
              </button>
            </div>
          </div>

          {/* Editor */}
          {mode === "text" ? (
            <div className="p-6">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Start typing..."
                className="h-64 w-full resize-none rounded-md border border-[#2A3B4A] bg-[#0F1720] p-4 text-gray-200 placeholder-gray-500 focus:border-[#1173d4] focus:outline-none"
              />
            </div>
          ) : (
            <div className="p-0">
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#233648]">
                <div className="text-sm text-gray-300">Code Editor</div>
                <div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-md bg-[#0F1720] border border-[#2A3B4A] px-2 py-1 text-sm"
                  >
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>Go</option>
                    <option>Java</option>
                    <option>C++</option>
                  </select>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  aria-label="Code editor"
                  placeholder="Start writing your code here..."
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value)}
                  className="h-72 w-full rounded-md border border-[#2A3B4A] bg-[#0F1720] p-4 text-gray-200 placeholder-gray-500 focus:border-[#1173d4] focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={onRunCode}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2B3947] px-4 py-2 text-sm"
                  >
                    Run Code
                  </button>
                  {testOutput && <div className="text-sm text-gray-300">{testOutput}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="px-6 py-4 border-t border-[#233648] flex justify-end gap-3">
            <button
              onClick={() => setShowEndConfirm(true)}
              className="rounded-lg bg-[#2B3947] px-4 py-2.5"
            >
              End Interview
            </button>
            <button
              onClick={onSubmitAnswer}
              disabled={isLoading || !questionId}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              Submit
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* End Interview Modal */}
        {showEndConfirm && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl bg-[#111A22] border border-[#233648] p-6">
              <h3 className="text-xl font-semibold">End interview?</h3>
              <p className="mt-2 text-gray-400">
                Are you sure? Visit assessments to see your performance.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="rounded-md bg-[#2B3947] px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={onEndInterview}
                  className="rounded-md bg-[#1173d4] px-4 py-2 font-semibold text-white"
                >
                  End & View Results
                </button>
              </div>
            </div>
          </div>
        )}
        {showExpired && (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-md rounded-xl bg-[#111A22] border border-[#233648] p-6 text-center">
      <h3 className="text-xl font-semibold mb-2">Time’s up!</h3>
      <p className="text-gray-400 mb-6">
        Your interview session has expired. Please submit to view results.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={onEndInterview}
          className="rounded-md bg-[#1173d4] px-4 py-2 font-semibold text-white hover:bg-blue-600"
        >
          End & View Results
        </button>
      </div>
    </div>
  </div>
)}

      </main>
    </div>
  );
}
