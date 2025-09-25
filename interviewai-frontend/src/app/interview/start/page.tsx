"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function InterviewStartPage() {
  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">You're all set</h1>
          <p className="mt-3 text-gray-400">We will generate a personalized interview based on your resume and the job description.</p>
        </div>

        <div className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="rounded-lg bg-[#0F1720] p-5 border border-[#2A3B4A]">
              <div className="text-sm text-gray-400">Resume-based Questions</div>
              <div className="mt-2 text-2xl font-bold">2–3</div>
            </li>
            <li className="rounded-lg bg-[#0F1720] p-5 border border-[#2A3B4A]">
              <div className="text-sm text-gray-400">Behavioral Questions</div>
              <div className="mt-2 text-2xl font-bold">1–2</div>
            </li>
            <li className="rounded-lg bg-[#0F1720] p-5 border border-[#2A3B4A]">
              <div className="text-sm text-gray-400">Coding Questions</div>
              <div className="mt-2 text-2xl font-bold">2</div>
            </li>
          </ul>

          <div className="mt-8 flex justify-end">
            <Link href="/interview/session" className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-600">
              <span className="material-symbols-outlined">play_arrow</span>
              Start Interview
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


