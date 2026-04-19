"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Забыли пароль?",
    subtitle: "Введи email. Мы отправим 6-значный код для сброса пароля.",
    emailPlaceholder: "Email",
    submit: "Отправить код",
    loading: "Отправляем...",
    fallbackError: "Не удалось отправить код",
    success: "Если аккаунт существует, письмо с кодом уже отправлено.",
    next: "Перейти к сбросу пароля",
    back: "Назад ко входу",
  },
  en: {
    title: "Forgot password?",
    subtitle: "Enter your email. We’ll send a 6-digit code to reset your password.",
    emailPlaceholder: "Email",
    submit: "Send code",
    loading: "Sending...",
    fallbackError: "Failed to send code",
    success: "If an account exists, the reset code email has already been sent.",
    next: "Go to reset password",
    back: "Back to login",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const emailFromQuery = params.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery.trim().toLowerCase());
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setLoading(true);

    try {
      await apiFetch("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, lang }),
      });
      setSuccessText(t.success);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto mt-2 w-full max-w-[520px] rounded-3xl border border-[#1f2937] bg-[#111827] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:mt-6 sm:p-6">
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
            className="w-full min-w-0 rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none placeholder:text-white/45"
          />

          {errorText ? (
            <div className="break-anywhere rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
              {errorText}
            </div>
          ) : null}

          {successText ? (
            <div className="break-anywhere rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">
              {successText}
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <a href="/login" className="text-[#60a5fa] no-underline hover:text-blue-300">
            {t.back}
          </a>
          <a
            href={`/reset-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
            className="text-[#60a5fa] no-underline hover:text-blue-300"
          >
            {t.next}
          </a>
        </div>
      </div>
    </main>
  );
}
