"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Регистрация",
    subtitle: "Создай аккаунт PocketGPT.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Пароль минимум 8 символов",
    submit: "Создать аккаунт",
    loading: "Создание...",
    fallbackError: "Ошибка регистрации",
    loginHint: "Уже есть аккаунт?",
    loginLink: "Войти",
  },
  en: {
    title: "Signup",
    subtitle: "Create your PocketGPT account.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password (minimum 8 characters)",
    submit: "Create account",
    loading: "Creating...",
    fallbackError: "Signup failed",
    loginHint: "Already have an account?",
    loginLink: "Log in",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function SignupPage() {
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
      const data = await apiFetch("/v1/auth/signup", {
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
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[520px] rounded-3xl border border-[#1f2937] bg-[#111827] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:p-6">
        <h1 className="mb-2 text-3xl font-bold">{t.title}</h1>
        <p className="mt-0 text-sm text-[#a1a1aa] sm:text-base">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-blue-500"
          />

          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-blue-500"
          />

          {errorText ? (
            <div className="rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
              {errorText}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-default disabled:opacity-80"
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <div className="mt-5 text-sm text-[#a1a1aa]">
          {t.loginHint}{" "}
          <Link href="/login" className="text-[#60a5fa] no-underline hover:text-blue-300">
            {t.loginLink}
          </Link>
        </div>
      </div>
    </main>
  );
}