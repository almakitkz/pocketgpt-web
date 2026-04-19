"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Вход",
    subtitle: "Войди в PocketGPT, чтобы управлять устройствами, подпиской и аккаунтом.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Пароль",
    submit: "Войти",
    loading: "Входим...",
    fallbackError: "Ошибка входа",
    signupHint: "Нет аккаунта?",
    signupLink: "Создать аккаунт",
    forgotLink: "Забыли пароль?",
    show: "Показать пароль",
    hide: "Скрыть пароль",
  },
  en: {
    title: "Login",
    subtitle: "Log in to PocketGPT to manage your devices, billing, and account.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    submit: "Log in",
    loading: "Logging in...",
    fallbackError: "Login failed",
    signupHint: "Don’t have an account?",
    signupLink: "Create account",
    forgotLink: "Forgot password?",
    show: "Show password",
    hide: "Hide password",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

function saveAuthFallback(token: string, user: unknown) {
  const userJson = JSON.stringify(user ?? null);
  const tokenKeys = [
    "authToken",
    "token",
    "jwt",
    "pocketgpt_token",
    "pocketgpt_auth_token",
  ];
  const userKeys = [
    "authUser",
    "user",
    "pocketgpt_user",
  ];

  for (const key of tokenKeys) {
    localStorage.setItem(key, token);
  }
  for (const key of userKeys) {
    localStorage.setItem(key, userJson);
  }
  window.dispatchEvent(new Event("storage"));
}

function EyeButton({
  shown,
  onClick,
  labelShow,
  labelHide,
}: {
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

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setLoading(true);

    try {
      const data = await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, lang }),
      });

      const token = data?.auth?.token;
      if (typeof token === "string" && token) {
        saveAuthFallback(token, data?.user ?? null);
      }

      window.location.href = "/dashboard";
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
              autoComplete="current-password"
              className="w-full min-w-0 rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 pr-14 text-white outline-none placeholder:text-white/45"
            />
            <EyeButton
              shown={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              labelShow={t.show}
              labelHide={t.hide}
            />
          </div>

          {errorText ? (
            <div className="break-anywhere rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#a1a1aa]">
          <div>
            {t.signupHint}{" "}
            <a href="/signup" className="text-[#60a5fa] no-underline hover:text-blue-300">
              {t.signupLink}
            </a>
          </div>
          <a href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="text-[#60a5fa] no-underline hover:text-blue-300">
            {t.forgotLink}
          </a>
        </div>
      </div>
    </main>
  );
}
