"use client";

import { useEffect, useState } from "react";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "PocketGPT",
    description:
      "Физическое AI-устройство с твоим личным кабинетом, trial-периодом и подписками.",
    signup: "Создать аккаунт",
    login: "Войти",
  },
  en: {
    title: "PocketGPT",
    description:
      "A physical AI device with your personal dashboard, trial period, and subscriptions.",
    signup: "Create account",
    login: "Log in",
  },
};

function getSavedLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const saved = localStorage.getItem("site_lang");
  return saved === "en" ? "en" : "ru";
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  useEffect(() => {
    const applyLang = () => {
      setLang(getSavedLang());
    };

    applyLang();
    window.addEventListener("site-language-change", applyLang);

    return () => {
      window.removeEventListener("site-language-change", applyLang);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "calc(100vh - 80px)",
        background: "#050816",
        color: "white",
        padding: "48px 32px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 56, marginBottom: 16 }}>{t.title}</h1>

        <p
          style={{
            fontSize: 20,
            color: "#a1a1aa",
            maxWidth: 760,
            lineHeight: 1.6,
          }}
        >
          {t.description}
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 28,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/signup"
            style={{
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 12,
            }}
          >
            {t.signup}
          </a>

          <a
            href="/login"
            style={{
              background: "#18181b",
              color: "white",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid #27272a",
            }}
          >
            {t.login}
          </a>
        </div>
      </div>
    </main>
  );
}