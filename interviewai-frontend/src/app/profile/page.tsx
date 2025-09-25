"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

export default function ProfileSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCurrentUser();
        setMe(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load user");
      }
    })();
  }, []);

  return (
    <div className="bg-[#0E1620] min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6">Settings</h1>

        {error ? (
          <div className="mb-6 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        {me ? (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#233648] bg-[#111A22] p-4">
              <div className="text-xs text-gray-400">Name</div>
              <div className="mt-1 text-lg">{me.name ?? "-"}</div>
            </div>
            <div className="rounded-xl border border-[#233648] bg-[#111A22] p-4">
              <div className="text-xs text-gray-400">Email</div>
              <div className="mt-1 text-lg">{me.email ?? "-"}</div>
            </div>
            <div className="rounded-xl border border-[#233648] bg-[#111A22] p-4">
              <div className="text-xs text-gray-400">Role</div>
              <div className="mt-1 text-lg">{me.role ?? "-"}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm text-gray-300 mb-2">Full Name</label>
                <input id="fullName" placeholder="Your full name" className="w-full rounded-md bg-[#0F1720] border border-[#2A3B4A] py-3 px-4" defaultValue={me?.name ?? ""} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-gray-300 mb-2">Email</label>
                <input id="email" placeholder="you@example.com" className="w-full rounded-md bg-[#0F1720] border border-[#2A3B4A] py-3 px-4" defaultValue={me?.email ?? ""} />
              </div>
              <div>
                <label htmlFor="interest" className="block text-sm text-gray-300 mb-2">Field of Interest</label>
                <select id="interest" aria-label="Field of Interest" className="w-full rounded-md bg-[#0F1720] border border-[#2A3B4A] py-3 px-4">
                  <option>Software Engineering</option>
                  <option>Data Science</option>
                  <option>Product Management</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#233648] bg-[#111A22] p-6 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">App Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-lg bg-[#0F1720] border border-[#2A3B4A] px-4 py-3">
                <span>Email Notifications</span>
                <input type="checkbox" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
              </label>
              <label className="flex items-center justify-between rounded-lg bg-[#0F1720] border border-[#2A3B4A] px-4 py-3">
                <span>Dark Mode</span>
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </label>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button className="rounded-md bg-[#2B3947] px-4 py-2">Cancel</button>
              <button className="rounded-md bg-[#1173d4] px-4 py-2 font-semibold text-white">Save Changes</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


