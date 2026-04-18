"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Привязать устройство",
    subtitle: "Введи 6-значный код с экрана PocketGPT.",
    placeholder: "Например 123456",
    submit: "Привязать",
    loading: "Привязка...",
    loginFirst: "Сначала войди в аккаунт",
    failed: "Ошибка привязки",
    successPrefix: "Устройство",
    successSuffix: "успешно привязано",
  },
  en: {
    title: "Pair device",
    subtitle: "Enter the 6-digit code shown on your PocketGPT screen.",
    placeholder: "For example 123456",
    submit: "Pair device",
    loading: "Pairing...",
    loginFirst: "Please log in first",
    failed: "Pair failed",
    successPrefix: "Device",
    successSuffix: "paired successfully",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function PairPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  const [code, setCode] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error(t.loginFirst);
      }

      const data = await apiFetch("/v1/user/pair/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      setSuccessText(`${t.successPrefix} ${data.device.name} ${t.successSuffix}`);
      setCode("");
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[520px] rounded-3xl border border-[#1f2937] bg-[#111827] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:p-6">
        <h1 className="mb-2 text-3xl font-bold">{t.title}</h1>
        <p className="mt-0 text-sm text-[#a1a1aa] sm:text-base">{t.subtitle}</p>

        <form onSubmit={handlePair} className="mt-5 grid gap-4">
          <input
            type="text"
            placeholder={t.placeholder}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-blue-500"
          />

          {errorText ? (
            <div className="rounded-xl bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
              {errorText}
            </div>
          ) : null}

          {successText ? (
            <div className="rounded-xl bg-[#12311e] p-3 text-sm text-[#bbf7d0]">
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
      </div>
    </main>
  );
}