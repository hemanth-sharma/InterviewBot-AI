"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { getCurrentUser, getUserHistory, getUserLastHistory, getInterviewHistory } from "@/lib/api";

export default function AssessmentsPage() {
  const [lastHistory, setLastHistory] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, any>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Get current user to extract user_id
        const me: any = await getCurrentUser();
        const uid = me?.id ?? me?.user_id;
        if (!uid) throw new Error("User ID not found");
        setUserId(uid);

        // Fetch last interview and full history in parallel
        const [last, fullHistory] = await Promise.all([
          getUserLastHistory(uid),
          getUserHistory(uid),
        ]);
        setLastHistory(last);
        setHistory(Array.isArray(fullHistory) ? fullHistory : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load interview history");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    } catch {
      return "Unknown";
    }
  };

  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "N/A";
    return `${Math.round(score)}%`;
  };

  async function toggleExpand(interviewId: number) {
    setError(null);
    if (expandedId === interviewId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(interviewId);
    if (!expandedData[interviewId]) {
      try {
        setLoadingDetailId(interviewId);
        const data = await getInterviewHistory(interviewId);
        setExpandedData((prev) => ({ ...prev, [interviewId]: data }));
      } catch (err: any) {
        setError(err?.message || "Failed to load interview details");
      } finally {
        setLoadingDetailId(null);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-[#0E1620] min-h-screen text-white">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
          <div className="text-center">Loading interview results...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold">Interview Results</h1>
        <p className="mt-2 text-gray-400">Review your performance and identify areas for improvement.</p>

        {error ? (
          <div className="mt-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        {/* Top Cards - Last Interview Scores */}
        {lastHistory ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Overall Score", value: formatScore(lastHistory.overall_score) },
              { label: "Technical", value: formatScore(lastHistory.technical_score) },
              { label: "Behavioral", value: formatScore(lastHistory.behavioral_score) },
              { label: "Coding", value: formatScore(lastHistory.coding_score) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
                <div className="text-sm text-gray-400">{item.label}</div>
                <div className="mt-3 text-3xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center text-gray-400">No interview results available</div>
        )}

        <h2 className="mt-10 text-2xl font-bold">Interview History</h2>
        <div className="mt-4 space-y-3">
          {history.length > 0 ? (
            history.map((item, idx) => (
              <div key={item.id || idx} className="rounded-lg bg-[#111A22] border border-[#233648]">
                <button
  onClick={() => toggleExpand(item.id)}
  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0F1720]"
>
  <div className="flex items-center gap-4">
    <div className="text-gray-400 w-24">{formatDate(item.created_at)}</div>
    <div>Interview #{item.id}</div>
  </div>
  <div className="flex items-center gap-2">
    <div className="text-gray-300">{formatScore(item.overall_score)}</div>
    {/* Arrow Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
        expandedId === item.id ? "rotate-180" : ""
      }`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</button>


                {expandedId === item.id && (
                  <div className="border-t border-[#233648] px-5 py-4">
                    {loadingDetailId === item.id ? (
                      <div className="text-sm text-gray-400">Loading details...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4">
                          <div className="text-xs text-gray-400">Overall</div>
                          <div className="mt-1 text-xl font-semibold">{formatScore(expandedData[item.id]?.overall_score)}</div>
                        </div>
                        <div className="rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4">
                          <div className="text-xs text-gray-400">Technical</div>
                          <div className="mt-1 text-xl font-semibold">{formatScore(expandedData[item.id]?.technical_score)}</div>
                        </div>
                        <div className="rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4">
                          <div className="text-xs text-gray-400">Behavioral</div>
                          <div className="mt-1 text-xl font-semibold">{formatScore(expandedData[item.id]?.behavioral_score)}</div>
                        </div>
                        <div className="rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4">
                          <div className="text-xs text-gray-400">Coding</div>
                          <div className="mt-1 text-xl font-semibold">{formatScore(expandedData[item.id]?.coding_score)}</div>
                        </div>
                        <div className="md:col-span-5 rounded-md bg-[#0F1720] border border-[#2A3B4A] p-4">
                          <div className="text-xs text-gray-400">AI Feedback</div>
                          <div className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">{expandedData[item.id]?.feedback || "No feedback available."}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">No interview history found</div>
          )}
        </div>
      </main>
    </div>
  );
}


