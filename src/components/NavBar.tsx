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
    menu: "Меню",
    close: "Закрыть",
  },
  en: {
    home: "Home",
    dashboard: "Dashboard",
    pair: "Pair",
    billing: "Billing",
    login: "Login",
    signup: "Signup",
    logout: "Logout",
    menu: "Menu",
    close: "Close",
  },
} as const;

function getSavedLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const saved = localStorage.getItem("site_lang");
  return saved === "en" ? "en" : "ru";
}

export default function NavBar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Lang>("ru");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthed(!!getToken());
    setLang(getSavedLang());
    setReady(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0f]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="min-w-0 shrink text-lg font-bold tracking-tight text-white sm:text-xl"
          onClick={() => setMenuOpen(false)}
        >
          PocketGPT
        </Link>

        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <div className="flex overflow-hidden rounded-full border border-zinc-800">
            <button
              type="button"
              onClick={() => changeLang("ru")}
              className={`px-3 py-2 text-sm ${
                lang === "ru" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => changeLang("en")}
              className={`px-3 py-2 text-sm ${
                lang === "en" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
              }`}
            >
              ENG
            </button>
          </div>

          <Link href="/" className="text-sm text-white/90 hover:text-white">
            {t.home}
          </Link>

          {ready && isAuthed ? (
            <>
              <Link href="/dashboard" className="text-sm text-white/90 hover:text-white">
                {t.dashboard}
              </Link>

              <Link href="/pair" className="text-sm text-white/90 hover:text-white">
                {t.pair}
              </Link>

              <Link href="/billing" className="text-sm text-white/90 hover:text-white">
                {t.billing}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {t.logout}
              </button>
            </>
          ) : null}

          {ready && !isAuthed ? (
            <>
              <Link href="/login" className="text-sm text-white/90 hover:text-white">
                {t.login}
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {t.signup}
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? t.close : t.menu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white md:hidden"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#0b0b0f] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
            <div className="flex w-full overflow-hidden rounded-full border border-zinc-800">
              <button
                type="button"
                onClick={() => changeLang("ru")}
                className={`flex-1 px-3 py-2 text-sm ${
                  lang === "ru" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => changeLang("en")}
                className={`flex-1 px-3 py-2 text-sm ${
                  lang === "en" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
                }`}
              >
                ENG
              </button>
            </div>

            <Link
              href="/"
              className="rounded-xl px-3 py-3 text-white/90 hover:bg-white/5 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              {t.home}
            </Link>

            {ready && isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-3 text-white/90 hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.dashboard}
                </Link>

                <Link
                  href="/pair"
                  className="rounded-xl px-3 py-3 text-white/90 hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.pair}
                </Link>

                <Link
                  href="/billing"
                  className="rounded-xl px-3 py-3 text-white/90 hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.billing}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {t.logout}
                </button>
              </>
            ) : null}

            {ready && !isAuthed ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3 text-white/90 hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.login}
                </Link>

                <Link
                  href="/signup"
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.signup}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}