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
} as const;

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
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t.title}
        </h1>

        <p className="max-w-3xl text-base leading-7 text-[#a1a1aa] sm:text-lg sm:leading-8">
          {t.description}
        </p>

        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <a
            href="/signup"
            className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-center text-white no-underline hover:bg-blue-500 sm:w-auto"
          >
            {t.signup}
          </a>

          <a
            href="/login"
            className="inline-flex w-full justify-center rounded-xl border border-[#27272a] bg-[#18181b] px-5 py-3 text-center text-white no-underline hover:bg-[#23232a] sm:w-auto"
          >
            {t.login}
          </a>
        </div>
      </div>
    </main>
  );
}