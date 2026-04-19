"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Подтверждение email",
    subtitle: "Введи 6-значный код, который мы отправили тебе на почту.",
    emailPlaceholder: "Email",
    codePlaceholder: "6-значный код",
    submit: "Подтвердить email",
    loading: "Проверяем...",
    resend: "Отправить код ещё раз",
    resendLoading: "Отправка...",
    resendSuccess: "Новый код отправлен.",
    fallbackError: "Не удалось подтвердить email",
    loginLink: "Назад ко входу",
    success: "Email подтверждён. Входим в аккаунт...",
  },
  en: {
    title: "Verify email",
    subtitle: "Enter the 6-digit code we sent to your email address.",
    emailPlaceholder: "Email",
    codePlaceholder: "6-digit code",
    submit: "Verify email",
    loading: "Verifying...",
    resend: "Send code again",
    resendLoading: "Sending...",
    resendSuccess: "A new code was sent.",
    fallbackError: "Could not verify email",
    loginLink: "Back to login",
    success: "Email verified. Signing you in...",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function VerifyEmailPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const emailFromQuery = (qs.get("email") || "").trim().toLowerCase();
    if (emailFromQuery) setEmail(emailFromQuery);
  }, []);

  const normalizedCode = useMemo(() => code.replace(/\D/g, "").slice(0, 6), [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setLoading(true);

    try {
      const data = await apiFetch("/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code: normalizedCode, lang }),
      });

      saveAuth(data.auth.token, data.user);
      setSuccessText(t.success);
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErrorText("");
    setSuccessText("");
    setResendLoading(true);

    try {
      await apiFetch("/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email, lang }),
      });
      setSuccessText(t.resendSuccess);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setResendLoading(false);
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

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t.codePlaceholder}
            value={normalizedCode}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
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

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || !email.trim()}
          className="mt-4 w-full rounded-xl border border-[#374151] bg-transparent px-4 py-3 font-semibold text-white transition hover:bg-white/5 disabled:cursor-default disabled:opacity-60"
        >
          {resendLoading ? t.resendLoading : t.resend}
        </button>

        <a href="/login" className="mt-5 inline-block text-sm text-[#60a5fa] no-underline hover:text-blue-300">
          {t.loginLink}
        </a>
      </div>
    </main>
  );
}
