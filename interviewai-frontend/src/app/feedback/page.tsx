"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { submitFeedback } from "@/lib/api";

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("General Feedback");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await submitFeedback({
        email,
        feedback_type: feedbackType.toLowerCase().replace(" ", "_"),
        feedback_text: feedbackText,
      });
      setSuccess(true);
      setEmail("");
      setFeedbackText("");
      setFeedbackType("General Feedback");
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <div className="rounded-xl border border-[#233648] bg-[#111A22] p-8 shadow-xl shadow-black/20">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold">Share Your Feedback</h1>
            <p className="mt-2 text-gray-400">Help us improve the platform for everyone.</p>
          </div>

          {error ? (
            <div className="mb-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-md border border-green-900 bg-green-950/50 px-4 py-3 text-sm text-green-300">Thank you for your feedback!</div>
          ) : null}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">Email</label>
              <input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md bg-[#0F1720] border border-[#2A3B4A] py-3 px-4 text-white placeholder-gray-500 focus:border-[#1173d4] focus:outline-none" 
              />
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm text-gray-300 mb-2">Feedback</label>
              <textarea 
                id="feedback" 
                placeholder="Tell us what you think..." 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                className="h-40 w-full resize-none rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4 text-white placeholder-gray-500 focus:border-[#1173d4] focus:outline-none" 
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm text-gray-300 mb-2">Feedback type</label>
              <select 
                id="type" 
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full rounded-md bg-[#0F1720] border border-[#2A3B4A] py-3 px-4"
              >
                <option>General Feedback</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#1173d4] py-3 px-4 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}


