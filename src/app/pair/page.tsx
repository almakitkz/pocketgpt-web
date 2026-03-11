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
};

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
        }}
      >
        <h1 style={{ marginTop: 0 }}>{t.title}</h1>
        <p style={{ color: "#a1a1aa" }}>{t.subtitle}</p>

        <form
          onSubmit={handlePair}
          style={{ display: "grid", gap: 14, marginTop: 20 }}
        >
          <input
            type="text"
            placeholder={t.placeholder}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #374151",
              background: "#0b1220",
              color: "white",
            }}
          />

          {errorText ? (
            <div
              style={{
                background: "#3f1d1d",
                color: "#fecaca",
                padding: 12,
                borderRadius: 12,
              }}
            >
              {errorText}
            </div>
          ) : null}

          {successText ? (
            <div
              style={{
                background: "#12311e",
                color: "#bbf7d0",
                padding: 12,
                borderRadius: 12,
              }}
            >
              {successText}
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
              cursor: "pointer",
            }}
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}