"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#233648] bg-[#111A22]/80 px-6 md:px-10 py-4 backdrop-blur-sm text-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-md bg-[#1173d4] p-2">
          <span className="material-symbols-outlined text-white text-xl">mic</span>
        </div>
        <Link href="/dashboard" className="text-xl font-bold">InterviewBot AI</Link>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white">Dashboard</Link>
        <Link href="/assessments" className="text-sm font-medium text-gray-300 hover:text-white">Assessments</Link>
        <Link href="/feedback" className="text-sm font-medium text-gray-300 hover:text-white">Feedback</Link>
        <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold">U</span>
          <span className="hidden lg:inline">Profile</span>
        </Link>
      </nav>
      <button className="md:hidden">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </header>
  );
}


