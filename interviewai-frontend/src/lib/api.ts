// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;

    // Always send credentials for cookies
    const res = await fetch(url, {
        ...options,
        credentials: "include", // crucial for cookie-based auth
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    // Auto-refresh access token if 401
    if (res.status === 401) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            // retry the request
            return apiRequest(endpoint, options);
        }
    }

    if (!res.ok) {
        const errorText = await safeReadText(res);
        throw new Error(`API Error: ${res.status} ${errorText}`);
    }

    return safeReadJson(res);
}

async function apiRequestForm(endpoint: string, formData: FormData, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
        method: options.method || "POST",
        body: formData,
        headers: options.headers,
        credentials: "include",
    });

    if (res.status === 401) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            return apiRequestForm(endpoint, formData, options);
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
        return undefined as unknown as T;
    }
}

// Refresh access token via backend endpoint
async function attemptTokenRefresh(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include", // cookies automatically sent
            headers: { "Content-Type": "application/json" },
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Auth API helpers
export async function registerUser(payload: { name?: string; email: string; password: string }) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function loginUser(payload: { email: string; password: string }) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function loginWithGoogle(idToken: string) {
    return apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token_str: idToken }),
    });
}

export async function logout() {
    return apiRequest("/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
    return apiRequest("/auth/me", { method: "GET" });
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

// Job APIs
export async function createJobDescription(jd_text: string) {
    return apiRequest("/job/", {
        method: "POST",
        body: JSON.stringify({ jd_text }),
    });
}

export async function getJobDescription(jdId: number) {
    return apiRequest(`/job/${jdId}`, { method: "GET" });
}

// Interview APIs
export type StartInterviewPayload = {
    resume_id: number;
    job_description_id: number;
    user_id?: number;
    timer_minutes: number;
};

export async function startInterview(payload: StartInterviewPayload) {
    return apiRequest("/interview/start", { method: "POST", body: JSON.stringify(payload) });
}

export async function getNextQuestion(interviewId: number) {
    return apiRequest(`/interview/${interviewId}/next`, { method: "POST" });
}

export async function submitAnswer(
    interviewId: number,
    payload: { question_id: number; user_text: string; is_coding: boolean; code?: string; code_language?: string }
) {
    return apiRequest(`/interview/${interviewId}/answer`, { method: "POST", body: JSON.stringify(payload) });
}

export async function endInterview(interviewId: number) {
    return apiRequest(`/interview/${interviewId}/end`, { method: "POST" });
}

export async function getInterview(interviewId: number) {
    return apiRequest(`/interview/${interviewId}`);
}

// Run Code APIs
export async function runCode(payload: { code: string; language_code: string; stdin?: string }) {
    return apiRequest("/code/run_code", { method: "POST", body: JSON.stringify(payload) });
}

// Feedback APIs
export async function submitFeedback(payload: { email: string; feedback_type: string; feedback_text: string }) {
    return apiRequest("/feedbacks/", { method: "POST", body: JSON.stringify(payload) });
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

// Default user login
export async function loginAsDefaultUser() {
    return loginUser({
        email: process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL || "johndoe@email.com",
        password: process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD || "password123",
    });
}
