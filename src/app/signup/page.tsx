"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Регистрация",
    subtitle: "Создай аккаунт PocketGPT и подтверди email кодом из письма.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Пароль минимум 8 символов",
    confirmPasswordPlaceholder: "Подтверди пароль",
    submit: "Создать аккаунт",
    loading: "Создание...",
    fallbackError: "Ошибка регистрации",
    loginHint: "Уже есть аккаунт?",
    loginLink: "Войти",
    mismatch: "Пароли не совпадают",
    verifyRedirect: "Аккаунт создан. Переходим к подтверждению email...",
    show: "Показать пароль",
    hide: "Скрыть пароль",
  },
  en: {
    title: "Signup",
    subtitle: "Create your PocketGPT account and verify your email with the code from your inbox.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password (minimum 8 characters)",
    confirmPasswordPlaceholder: "Confirm password",
    submit: "Create account",
    loading: "Creating...",
    fallbackError: "Signup failed",
    loginHint: "Already have an account?",
    loginLink: "Log in",
    mismatch: "Passwords do not match",
    verifyRedirect: "Account created. Redirecting to email verification...",
    show: "Show password",
    hide: "Hide password",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

function EyeButton({ shown, onClick, labelShow, labelHide }: {
  shown: boolean;
  onClick: () => void;
  labelShow: string;
  labelHide: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? labelHide : labelShow}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
    >
      {shown ? "🙈" : "👁"}
    </button>
  );
}

export default function SignupPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  const passwordsMismatch = useMemo(() => {
    return !!confirmPassword && password !== confirmPassword;
  }, [password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (password !== confirmPassword) {
      setErrorText(t.mismatch);
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, lang }),
      });

      const normalizedEmail = (data?.verification?.email || email || "").trim().toLowerCase();
      setSuccessText(t.verifyRedirect);
      window.location.href = `/verify-email?email=${encodeURIComponent(normalizedEmail)}`;
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full min-w-0 rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 pr-14 text-white outline-none placeholder:text-white/45"
            />
            <EyeButton
              shown={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              labelShow={t.show}
              labelHide={t.hide}
            />
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full min-w-0 rounded-xl border bg-[#0b1220] px-4 py-3 pr-14 text-white outline-none placeholder:text-white/45 ${
                passwordsMismatch ? "border-red-700" : "border-[#374151]"
              }`}
            />
            <EyeButton
              shown={showConfirmPassword}
              onClick={() => setShowConfirmPassword((v) => !v)}
              labelShow={t.show}
              labelHide={t.hide}
            />
          </div>

          {passwordsMismatch ? (
            <div className="break-anywhere rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {t.mismatch}
            </div>
          ) : null}

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

        <div className="mt-5 text-sm text-[#a1a1aa]">
          {t.loginHint}{" "}
          <a href="/login" className="text-[#60a5fa] no-underline hover:text-blue-300">
            {t.loginLink}
          </a>
        </div>
      </div>
    </main>
  );
}
