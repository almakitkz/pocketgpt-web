export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://pocketgpt-server.onrender.com";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...((options.headers || {}) as Record<string, string>),
  };

  const res = await fetch(API_URL + path, {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.error?.code || data?.detail || data?.message || "Request failed"
    );
  }

  return data;
}
