// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// In-memory lock to avoid concurrent refresh storms
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function isBrowser() {
	return typeof window !== "undefined";
}

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
	if (!isBrowser()) return { accessToken: null, refreshToken: null };
	try {
		const accessToken = window.localStorage.getItem("accessToken");
		const refreshToken = window.localStorage.getItem("refreshToken");
		return { accessToken, refreshToken };
	} catch {
		return { accessToken: null, refreshToken: null };
	}
}

function setStoredTokens(accessToken: string | null, refreshToken?: string | null) {
	if (!isBrowser()) return;
	try {
		if (accessToken) {
			window.localStorage.setItem("accessToken", accessToken);
		} else {
			window.localStorage.removeItem("accessToken");
		}
		if (refreshToken !== undefined) {
			if (refreshToken) {
				window.localStorage.setItem("refreshToken", refreshToken);
			} else {
				window.localStorage.removeItem("refreshToken");
			}
		}
	} catch {
		// ignore storage errors
	}
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
	const url = `${API_BASE}${endpoint}`;
	const { accessToken } = getStoredTokens();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string> | undefined),
	};

	if (accessToken && !headers["Authorization"]) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}

	let res = await fetch(url, { ...options, headers });

	if (res.status === 401) {
		const newToken = await attemptTokenRefresh();
		if (newToken) {
			const retryHeaders: Record<string, string> = {
				...headers,
				Authorization: `Bearer ${newToken}`,
			};
			res = await fetch(url, { ...options, headers: retryHeaders });
		}
	}

	if (!res.ok) {
		const errorText = await safeReadText(res);
		throw new Error(`API Error: ${res.status} ${errorText}`);
	}

	return safeReadJson(res);
}

// Form/multipart request without forcing JSON content-type
export async function apiRequestForm(endpoint: string, formData: FormData, options: RequestInit = {}) {
	const url = `${API_BASE}${endpoint}`;
	const { accessToken } = getStoredTokens();
	const headers: Record<string, string> = {
		...(options.headers as Record<string, string> | undefined),
	};
	if (accessToken && !headers["Authorization"]) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}
	let res = await fetch(url, { method: options.method || "POST", body: formData, headers });
	if (res.status === 401) {
		const newToken = await attemptTokenRefresh();
		if (newToken) {
			const retryHeaders: Record<string, string> = {
				...headers,
				Authorization: `Bearer ${newToken}`,
			};
			res = await fetch(url, { method: options.method || "POST", body: formData, headers: retryHeaders });
		}
	}
	if (!res.ok) {
		const errorText = await safeReadText(res);
		throw new Error(`API Error: ${res.status} ${errorText}`);
	}
	return safeReadJson(res);
}

async function safeReadText(res: Response): Promise<string> {
	try {
		return await res.text();
	} catch {
		return "";
	}
}

async function safeReadJson<T = any>(res: Response): Promise<T> {
	try {
		return (await res.json()) as T;
	} catch {
		// if no JSON body
		return undefined as unknown as T;
	}
}

async function attemptTokenRefresh(): Promise<string | null> {
	const { refreshToken } = getStoredTokens();
	if (!refreshToken) return null;

	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = (async () => {
		try {
			const res = await fetch(`${API_BASE}/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refresh_token: refreshToken }),
			});
			if (!res.ok) {
				clearTokens();
				return null;
			}
			const data: any = await safeReadJson(res);
			const newAccess: string | undefined = data?.access_token || data?.access || data?.accessToken;
			const newRefresh: string | undefined = data?.refresh_token || data?.refresh || data?.refreshToken;
			if (newAccess) setStoredTokens(newAccess, newRefresh ?? undefined);
			return newAccess ?? null;
		} catch {
			clearTokens();
			return null;
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

export function clearTokens() {
	setStoredTokens(null, null);
}

export function getAccessToken(): string | null {
	return getStoredTokens().accessToken;
}

export function getRefreshToken(): string | null {
	return getStoredTokens().refreshToken;
}

// Auth API helpers
export async function registerUser(payload: { name?: string; email: string; password: string }) {
	const res = await apiRequest("/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	// If backend returns tokens on register, store them
	const access: string | undefined = (res as any)?.access_token || (res as any)?.access || (res as any)?.accessToken;
	const refresh: string | undefined = (res as any)?.refresh_token || (res as any)?.refresh || (res as any)?.refreshToken;
	if (access) setStoredTokens(access, refresh ?? undefined);
	return res;
}

export async function loginUser(payload: { email: string; password: string }) {
	const res = await apiRequest("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const access: string | undefined = (res as any)?.access_token || (res as any)?.access || (res as any)?.accessToken;
	const refresh: string | undefined = (res as any)?.refresh_token || (res as any)?.refresh || (res as any)?.refreshToken;
	if (access) setStoredTokens(access, refresh ?? undefined);
	return res;
}

export async function loginWithGoogle(idToken: string) {
	const res = await apiRequest("/auth/google", {
		method: "POST",
		body: JSON.stringify({ id_token_str: idToken }),
	});
	const access: string | undefined = (res as any)?.access_token || (res as any)?.access || (res as any)?.accessToken;
	const refresh: string | undefined = (res as any)?.refresh_token || (res as any)?.refresh || (res as any)?.refreshToken;
	if (access) setStoredTokens(access, refresh ?? undefined);
	return res;
}

export async function refreshSession() {
	const newAccess = await attemptTokenRefresh();
	return newAccess;
}

export async function getCurrentUser() {
	return apiRequest("/auth/me", { method: "GET" });
}

export function getGoogleAuthUrl(): string {
	return `${API_BASE}/auth/google`;
}

export function logout() {
	clearTokens();
}

// Resume APIs
export async function uploadResume(file: File) {
	const form = new FormData();
	form.append("file", file);
	return apiRequestForm("/resume/upload", form);
}

export async function getResume(resumeId: number) {
	return apiRequest(`/resume/${resumeId}`, { method: "GET" });
}

// Job Description APIs
export async function createJobDescription(jd_text : string) {
	return apiRequest("/job/", {
		method: "POST",
		body: JSON.stringify({ jd_text  }),
	});
}

export async function getJobDescription(jdId: number) {
	return apiRequest(`/job/${jdId}`, { method: "GET" });
}

// Interview APIs
export type StartInterviewPayload = {
	resume_id: number;
	job_description_id: number;
	user_id?: number; // optional if backend infers from token
	timer_minutes: number;
};

export async function startInterview(payload: StartInterviewPayload) {
	return apiRequest("/interview/start", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function getNextQuestion(interviewId: number) {
	return apiRequest(`/interview/${interviewId}/next`, {
		method: "POST",
	});
}

export async function submitAnswer(interviewId: number, payload: { question_id: number; user_text: string; is_coding: boolean; code?: string; code_language?: string; }) {
	return apiRequest(`/interview/${interviewId}/answer`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function endInterview(interviewId: number) {
	return apiRequest(`/interview/${interviewId}/end`, {
		method: "POST",
	});
}

// Feedback APIs
export async function submitFeedback(payload: { email: string; feedback_type: string; feedback_text: string }) {
	return apiRequest("/feedbacks/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// History APIs
export async function getUserHistory(userId: number) {
	return apiRequest(`/history/user/${userId}`, { method: "GET" });
}

export async function getUserLastHistory(userId: number) {
	return apiRequest(`/history/user/${userId}/last`, { method: "GET" });
}

export async function getInterviewHistory(interviewId: number) {
	return apiRequest(`/history/${interviewId}`, { method: "GET" });
}
