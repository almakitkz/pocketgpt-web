"use client";

import Link from "next/link";
import { logout, getToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type Lang = "ru" | "en";

const NAV_TEXT = {
  ru: {
    home: "Главная",
    dashboard: "Кабинет",
    pair: "Привязка",
    billing: "Billing",
    login: "Войти",
    signup: "Регистрация",
    logout: "Выйти",
  },
  en: {
    home: "Home",
    dashboard: "Dashboard",
    pair: "Pair",
    billing: "Billing",
    login: "Login",
    signup: "Signup",
    logout: "Logout",
  },
};

function getSavedLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const saved = localStorage.getItem("site_lang");
  return saved === "en" ? "en" : "ru";
}

export default function NavBar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Lang>("ru");

  useEffect(() => {
    setIsAuthed(!!getToken());
    setLang(getSavedLang());
    setReady(true);
  }, []);

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  function changeLang(nextLang: Lang) {
    setLang(nextLang);
    localStorage.setItem("site_lang", nextLang);
    window.dispatchEvent(new Event("site-language-change"));
  }

  const t = NAV_TEXT[lang];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 32px",
        borderBottom: "1px solid #222",
        background: "#0b0b0f",
      }}
    >
      <Link
        href="/"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 22,
        }}
      >
        PocketGPT
      </Link>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #27272a",
            borderRadius: 999,
            overflow: "hidden",
            marginRight: 8,
          }}
        >
          <button
            onClick={() => changeLang("ru")}
            style={{
              background: lang === "ru" ? "#2563eb" : "transparent",
              color: "white",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            RU
          </button>

          <button
            onClick={() => changeLang("en")}
            style={{
              background: lang === "en" ? "#2563eb" : "transparent",
              color: "white",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ENG
          </button>
        </div>

        <Link href="/" style={{ color: "white", textDecoration: "none" }}>
          {t.home}
        </Link>

        {ready && isAuthed ? (
          <>
            <Link href="/dashboard" style={{ color: "white", textDecoration: "none" }}>
              {t.dashboard}
            </Link>

            <Link href="/pair" style={{ color: "white", textDecoration: "none" }}>
              {t.pair}
            </Link>

            <Link href="/billing" style={{ color: "white", textDecoration: "none" }}>
              {t.billing}
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              {t.logout}
            </button>
          </>
        ) : null}

        {ready && !isAuthed ? (
          <>
            <Link href="/login" style={{ color: "white", textDecoration: "none" }}>
              {t.login}
            </Link>
            <Link href="/signup" style={{ color: "white", textDecoration: "none" }}>
              {t.signup}
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}