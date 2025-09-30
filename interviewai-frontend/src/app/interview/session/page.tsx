// /src/app/interview/session/page.tsx
import { Suspense } from "react";
import InterviewSessionClient from "./InterviewSessionClient";
import Navbar from "@/components/Navbar";


export default function InterviewSessionPage() {
  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <Suspense fallback={<div>Loading interview session...</div>}>
          <InterviewSessionClient />
        </Suspense>
      </main>
    </div>
  );
}
