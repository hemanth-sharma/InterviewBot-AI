"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { registerUser } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		try {
			await registerUser({ name, email, password });
			router.replace("/dashboard");
		} catch (err: any) {
			setError(err?.message || "Signup failed");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="bg-[#111A22] text-white min-h-screen flex flex-col">
			<Navbar />
			<main className="flex flex-1 items-center justify-center py-16">
				<div className="w-full max-w-md space-y-8 px-4">
					<div className="text-center">
						<h1 className="text-4xl font-bold tracking-tighter">Create your account</h1>
						<p className="mt-3 text-gray-400">Get started with InterviewBot AI</p>
					</div>

					{error ? (
						<p className="text-red-400 text-sm" role="alert">{error}</p>
					) : null}

					<form className="space-y-5" onSubmit={onSubmit}>
						<div>
							<label htmlFor="name" className="sr-only">Name</label>
							<input id="name" name="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md bg-gray-800 py-3 px-4 text-white placeholder-gray-500 focus:border-[#1173d4] focus:outline-none" />
						</div>
						<div>
							<label htmlFor="email" className="sr-only">Email</label>
							<input type="email" id="email" name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md bg-gray-800 py-3 px-4 text-white placeholder-gray-500 focus:border-[#1173d4] focus:outline-none" />
						</div>
						<div>
							<label htmlFor="password" className="sr-only">Password</label>
							<input type="password" id="password" name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md bg-gray-800 py-3 px-4 text-white placeholder-gray-500 focus:border-[#1173d4] focus:outline-none" />
						</div>
						<button type="submit" disabled={isLoading} className="w-full rounded-md bg-[#1173d4] py-3 px-4 font-semibold text-white hover:bg-blue-600 disabled:opacity-60">{isLoading ? "Creating account..." : "Sign up"}</button>
					</form>

					<p className="text-center text-sm text-gray-400">Already have an account? <Link href="/login" className="text-[#1173d4] hover:underline">Log in</Link></p>
				</div>
			</main>
		</div>
	);
}


