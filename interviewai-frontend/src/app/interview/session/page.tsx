"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { endInterview, getNextQuestion, submitAnswer } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId || Number.isNaN(interviewId)) return;
    loadNextQuestion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  async function loadNextQuestion(initial = false) {
    setError(null);
    setIsLoading(true);
    try {
      const res: any = await getNextQuestion(interviewId);
      // support both next and first question shapes
      const qid: number = res?.question_id ?? res?.id ?? null;
      const text: string = res?.text ?? res?.question?.text ?? "";
      const qtype: string = res?.qtype ?? res?.question?.qtype ?? "";
      const ordinal: number | undefined = res?.ordinal ?? res?.question?.ordinal;
      setQuestionId(qid);
      setQuestionText(text);
      setQuestionType(qtype);
      if (ordinal) setQuestionOrdinal(ordinal);
      if (!initial) {
        setAnswerText("");
        setCodeText("// Start writing your code here...");
      }
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

  const headerTitle = questionText || "Loading question...";

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-xs text-gray-400">QUESTION {questionOrdinal} </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <span className="material-symbols-outlined text-gray-400">timer</span>
            {/* Timer UI could be wired to expires_at if desired */}
            <span className="material-symbols-outlined text-gray-400">help</span>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
          {headerTitle}
        </h1>

        {/* Card */}
        <div className="rounded-xl border border-[#233648] bg-[#111A22] p-0 shadow-xl shadow-black/20 overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#233648]">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="material-symbols-outlined text-xl">mic</span>
              <span>Speak or type your answer</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMode("text")} className={`px-3 py-1 rounded-md text-sm ${mode === "text" ? "bg-blue-600" : "bg-[#0F1720]"}`}>Text</button>
              <button onClick={() => setMode("code")} className={`px-3 py-1 rounded-md text-sm ${mode === "code" ? "bg-blue-600" : "bg-[#0F1720]"}`}>Code</button>
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
                  <label htmlFor="language" className="sr-only">Language</label>
                  <select id="language" aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-md bg-[#0F1720] border border-[#2A3B4A] px-2 py-1 text-sm">
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>TypeScript</option>
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
                  <button onClick={() => setTestOutput("3/4 tests passed (sample)")} className="inline-flex items-center gap-2 rounded-lg bg-[#2B3947] px-4 py-2 text-sm">Run Tests</button>
                  {testOutput && <div className="text-sm text-gray-300">{testOutput}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="px-6 py-4 border-t border-[#233648] flex justify-end gap-3">
            <button onClick={() => setShowEndConfirm(true)} className="rounded-lg bg-[#2B3947] px-4 py-2.5">End Interview</button>
            <button onClick={onSubmitAnswer} disabled={isLoading || !questionId} className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
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
              <p className="mt-2 text-gray-400">Your progress will be saved. You can resume later.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowEndConfirm(false)} className="rounded-md bg-[#2B3947] px-4 py-2">Cancel</button>
                <button onClick={onEndInterview} className="rounded-md bg-[#1173d4] px-4 py-2 font-semibold text-white">End & View Results</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


