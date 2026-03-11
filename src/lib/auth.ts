export type AuthUser = {
  id: string;
  email: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveAuth(token: string, user: AuthUser) {
  if (!isBrowser()) return;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem("token");
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  if (!isBrowser()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
}