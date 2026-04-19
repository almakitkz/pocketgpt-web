"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Сброс пароля",
    subtitle: "Введи код из письма и задай новый пароль для PocketGPT.",
    emailPlaceholder: "Email",
    codeLabel: "Код из письма",
    passwordPlaceholder: "Новый пароль минимум 8 символов",
    confirmPasswordPlaceholder: "Подтверди новый пароль",
    verifyCode: "Проверить код",
    verifying: "Проверяем...",
    submit: "Сохранить новый пароль",
    loading: "Сохраняем...",
    fallbackError: "Не удалось сбросить пароль",
    success: "Пароль изменён. Переходим ко входу...",
    mismatch: "Пароли не совпадают",
    invalidCode: "Введи все 6 цифр кода",
    show: "Показать пароль",
    hide: "Скрыть пароль",
    forgotLink: "Отправить код ещё раз",
    back: "Назад ко входу",
  },
  en: {
    title: "Reset password",
    subtitle: "Enter the code from your email and set a new password for PocketGPT.",
    emailPlaceholder: "Email",
    codeLabel: "Code from email",
    passwordPlaceholder: "New password (minimum 8 characters)",
    confirmPasswordPlaceholder: "Confirm new password",
    verifyCode: "Verify code",
    verifying: "Verifying...",
    submit: "Save new password",
    loading: "Saving...",
    fallbackError: "Failed to reset password",
    success: "Password changed. Redirecting to login...",
    mismatch: "Passwords do not match",
    invalidCode: "Enter all 6 digits of the code",
    show: "Show password",
    hide: "Hide password",
    forgotLink: "Send code again",
    back: "Back to login",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
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

export default function ResetPasswordPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
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

  const code = useMemo(() => codeDigits.join(""), [codeDigits]);
  const passwordsMismatch = useMemo(() => {
    return !!confirmPassword && password !== confirmPassword;
  }, [password, confirmPassword]);

  function updateDigit(index: number, rawValue: string) {
    const cleaned = rawValue.replace(/\D/g, "");
    if (!cleaned) {
      setCodeDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      setCodeVerified(false);
      return;
    }

    if (cleaned.length > 1) {
      const nextDigits = cleaned.slice(0, 6).split("");
      setCodeDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < 6; i += 1) {
          next[i] = nextDigits[i] || "";
        }
        return next;
      });
      setCodeVerified(false);
      const nextIndex = Math.min(cleaned.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    setCodeVerified(false);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    setCodeDigits([
      next[0] || "",
      next[1] || "",
      next[2] || "",
      next[3] || "",
      next[4] || "",
      next[5] || "",
    ]);
    setCodeVerified(false);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerifyCode() {
    setErrorText("");
    setSuccessText("");

    if (code.length !== 6) {
      setErrorText(t.invalidCode);
      return;
    }

    setVerifyingCode(true);
    try {
      await apiFetch("/v1/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ email, code, lang }),
      });
      setCodeVerified(true);
    } catch (err) {
      setCodeVerified(false);
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (code.length !== 6) {
      setErrorText(t.invalidCode);
      return;
    }
    if (password !== confirmPassword) {
      setErrorText(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, password, lang }),
      });
      setSuccessText(t.success);
      setTimeout(() => {
        window.location.href = `/login?email=${encodeURIComponent(email.trim().toLowerCase())}`;
      }, 900);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto mt-2 w-full max-w-[560px] rounded-3xl border border-[#1f2937] bg-[#111827] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:mt-6 sm:p-6">
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

          <div className="grid gap-3">
            <div className="text-sm text-[#a1a1aa]">{t.codeLabel}</div>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => updateDigit(index, e.target.value)}
                  onKeyDown={(e) => onKeyDown(index, e)}
                  onPaste={onPaste}
                  className={`h-12 min-w-0 rounded-xl border bg-[#0b1220] text-center text-lg font-semibold text-white outline-none sm:h-14 sm:text-xl ${
                    codeVerified ? "border-emerald-700" : "border-[#374151]"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifyingCode}
              className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 font-semibold text-white transition hover:bg-white/5 disabled:cursor-default disabled:opacity-80"
            >
              {verifyingCode ? t.verifying : t.verifyCode}
            </button>
          </div>

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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <a href="/login" className="text-[#60a5fa] no-underline hover:text-blue-300">
            {t.back}
          </a>
          <a
            href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
            className="text-[#60a5fa] no-underline hover:text-blue-300"
          >
            {t.forgotLink}
          </a>
        </div>
      </div>
    </main>
  );
}
