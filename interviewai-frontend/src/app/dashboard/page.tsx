"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { createJobDescription, getCurrentUser, startInterview, uploadResume } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleResumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setResumeFile(file);
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) setResumeFile(file);
  }

  function preventDefault(event: React.DragEvent) {
    event.preventDefault();
  }

  async function startInterviewFlow() {
    setError(null);
    if (!resumeFile) return setError("Please select a resume file to upload.");
    if (!jobDescription.trim()) return setError("Please paste a job description.");

    setIsStarting(true);
    try {
      // Upload resume
      const resumeRes: any = await uploadResume(resumeFile);
      const resumeId: number = resumeRes?.id ?? resumeRes?.resume_id ?? resumeRes?.resumeId;
      if (!resumeId) throw new Error("Failed to upload resume");

      // Create job description
      const jdRes: any = await createJobDescription(jobDescription);
      const jdId: number = jdRes?.id ?? jdRes?.job_description_id ?? jdRes?.jd_id ?? jdRes?.jobDescriptionId;
      if (!jdId) throw new Error("Failed to create job description");

      // Optional: get user id
      let userId: number | undefined;
      try {
        const me: any = await getCurrentUser();
        userId = me?.id ?? me?.user_id ?? undefined;
      } catch {}

      // Start interview
      const started: any = await startInterview({
        resume_id: Number(resumeId),
        job_description_id: Number(jdId),
        user_id: userId,
        timer_minutes: 10,
      });
      const interviewId: number = started?.id ?? started?.interview_id;
      if (!interviewId) throw new Error("Interview did not start correctly");

      // Go to session
      router.replace(`/interview/session?interviewId=${interviewId}`);
    } catch (err: any) {
      setError(err?.message || "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Prepare for Your Interview</h1>
          <p className="mt-3 text-gray-400">Upload your resume and job description to get started.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Resume */}
          <section className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">Upload Your Resume</h2>
            <label
              onDrop={onDrop}
              onDragOver={preventDefault}
              onDragEnter={preventDefault}
              onDragLeave={preventDefault}
              htmlFor="resume"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#2A3B4A] bg-[#0F1720] p-10 text-center cursor-pointer hover:border-[#385371]"
            >
              <span className="material-symbols-outlined text-4xl text-gray-400">upload</span>
              <p className="font-semibold text-gray-300">Drag and drop or click to upload</p>
              <p className="text-sm text-gray-500">PDF or DOCX, up to 10MB</p>
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeChange}
              />
              {resumeFile && <div className="mt-2 text-xs text-gray-400">Selected: {resumeFile.name}</div>}
            </label>
          </section>

          {/* Paste Job Description */}
          <section className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">Paste Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="h-64 w-full resize-none rounded-md border border-[#2A3B4A] bg-[#0F1720] p-4 text-gray-200 placeholder-gray-500 focus:border-[#1173d4] focus:outline-none"
            />
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={startInterviewFlow}
            disabled={isStarting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-600 disabled:opacity-60"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            {isStarting ? "Starting..." : "Start Interview"}
          </button>
        </div>
      </main>
    </div>
  );
}
