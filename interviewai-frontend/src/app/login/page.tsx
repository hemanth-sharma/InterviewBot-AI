"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser, loginWithGoogle } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { loginAsDefaultUser } from "@/lib/api";


export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		try {
			await loginUser({ email, password });
			router.replace("/dashboard");
		} catch (err: any) {
			setError(err?.message || "Login failed");
		} finally {
			setIsLoading(false);
		}
	}

	async function onGoogleSuccess(credential: string | undefined) {
		if (!credential) {
			setError("No Google credential received");
			return;
		}
		setError(null);
		try {
			await loginWithGoogle(credential);
			router.replace("/dashboard");
		} catch (err: any) {
			setError(err?.message || "Google login failed");
		}
	}

	function onGoogleError() {
		setError("Google sign-in was cancelled or failed");
	}

	function onSkip() {
		setError(null);
		setIsLoading(true);
		loginAsDefaultUser()
			.then(() => router.replace("/dashboard"))
			.catch((err) => setError(err?.message || "Login failed"))
			.finally(() => setIsLoading(false));
	}

	return (
		<div className="bg-[#111A22] text-white min-h-screen flex flex-col">
			{/* Header */}
			<header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#233648] bg-[#111A22]/80 px-10 py-4 backdrop-blur-sm">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center rounded-md bg-[#1173d4] p-2">
						<span className="material-symbols-outlined text-white text-xl">mic</span>
					</div>
					<h2 className="text-xl font-bold">InterviewBot AI</h2>
				</div>
				<nav className="hidden md:flex items-center gap-8">
					<Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white">Dashboard</Link>
					<Link href="/assessments" className="text-sm font-medium text-gray-300 hover:text-white">Assessments</Link>
					<Link href="/feedback" className="text-sm font-medium text-gray-300 hover:text-white">Feedback</Link>
					<Link href="/profile" className="rounded-full h-8 w-8 bg-gray-700 flex items-center justify-center text-xs font-bold">U</Link>
				</nav>
				<button className="md:hidden">
					<span className="material-symbols-outlined">menu</span>
				</button>
			</header>

			{/* Main Content */}
			<main className="flex flex-1 items-center justify-center py-16">
				<div className="w-full max-w-md space-y-8 px-4">
					{/* Title */}
					<div className="text-center">
						<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Practice interviews with AI</h1>
						<p className="mt-4 text-gray-400">Get instant feedback on your answers and improve your interview skills.</p>
					</div>

					{/* Auth Options */}
					<div className="space-y-4">
					<button
							type="button"
							onClick={onSkip}
							className="w-full rounded-md bg-gray-600 py-3 px-4 font-semibold text-white shadow-sm hover:bg-gray-500"
						>
							Skip & Login as Demo
						</button>
						<div className="flex w-full justify-center">
							<GoogleLogin
								onSuccess={(response) => onGoogleSuccess(response.credential)}
								onError={onGoogleError}
								shape="rectangular"
								text="continue_with"
								theme="filled_black"
							/>
						</div>

						{/* Divider */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-gray-700"></span>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="bg-[#111A22] px-2 text-gray-500">or</span>
							</div>
						</div>

						{/* Error */}
						{error ? (
							<p className="text-red-400 text-sm" role="alert">{error}</p>
						) : null}

						{/* Form */}
						<form className="space-y-6" onSubmit={onSubmit}>
							<div>
								<label htmlFor="email" className="sr-only">Email</label>
								<input
									type="email"
									id="email"
									name="email"
									placeholder="Email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full rounded-md bg-gray-800 py-3 px-4 text-white placeholder-gray-500 shadow-sm focus:border-[#1173d4] focus:ring-[#1173d4]"
								/>
							</div>
							<div>
								<label htmlFor="password" className="sr-only">Password</label>
								<input
									type="password"
									id="password"
									name="password"
									placeholder="Password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full rounded-md bg-gray-800 py-3 px-4 text-white placeholder-gray-500 shadow-sm focus:border-[#1173d4] focus:ring-[#1173d4]"
								/>
							</div>
							<button
								type="submit"
								disabled={isLoading}
								className="w-full rounded-md bg-[#1173d4] py-3 px-4 font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
							>
								{isLoading ? "Signing in..." : "Continue with Email"}
							</button>
						</form>
						

					</div>

					{/* Footer */}
					<p className="text-center text-sm text-gray-400">
						Don’t have an account?
						<Link href="/signup" className="font-medium text-[#1173d4] hover:underline"> Sign up</Link>
					</p>
				</div>
			</main>
		</div>
	);
}


