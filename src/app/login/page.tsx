"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Вход",
    subtitle: "Войди в аккаунт PocketGPT.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Пароль",
    submit: "Войти",
    loading: "Вход...",
    fallbackError: "Ошибка входа",
    signupHint: "Нет аккаунта?",
    signupLink: "Создать аккаунт",
  },
  en: {
    title: "Login",
    subtitle: "Log in to your PocketGPT account.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    submit: "Log in",
    loading: "Logging in...",
    fallbackError: "Login failed",
    signupHint: "No account yet?",
    signupLink: "Create account",
  },
};

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    const updateLang = () => {
      setLang(getLang());
    };

    updateLang();
    window.addEventListener("site-language-change", updateLang);

    return () => {
      window.removeEventListener("site-language-change", updateLang);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setLoading(true);

    try {
      const data = await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveAuth(data.auth.token, data.user);
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 80px)",
        background: "#050816",
        color: "white",
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "40px auto",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>{t.title}</h1>
        <p style={{ color: "#a1a1aa", marginTop: 0 }}>{t.subtitle}</p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 14, marginTop: 20 }}
        >
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #374151",
              background: "#0b1220",
              color: "white",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #374151",
              background: "#0b1220",
              color: "white",
              outline: "none",
            }}
          />

          {errorText ? (
            <div
              style={{
                background: "#3f1d1d",
                color: "#fecaca",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #7f1d1d",
              }}
            >
              {errorText}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.8 : 1,
              fontWeight: 600,
            }}
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <div style={{ marginTop: 18, color: "#a1a1aa", fontSize: 14 }}>
          {t.signupHint}{" "}
          <a
            href="/signup"
            style={{
              color: "#60a5fa",
              textDecoration: "none",
            }}
          >
            {t.signupLink}
          </a>
        </div>
      </div>
    </main>
  );
}