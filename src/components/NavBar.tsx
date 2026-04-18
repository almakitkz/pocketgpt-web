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
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-white sm:text-2xl"
          onClick={() => setMenuOpen(false)}
        >
          PocketGPT
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center overflow-hidden rounded-full border border-zinc-800">
            <button
              onClick={() => changeLang("ru")}
              className={`px-3 py-2 text-sm font-medium transition ${
                lang === "ru" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
              }`}
              type="button"
            >
              RU
            </button>
            <button
              onClick={() => changeLang("en")}
              className={`px-3 py-2 text-sm font-medium transition ${
                lang === "en" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
              }`}
              type="button"
            >
              ENG
            </button>
          </div>

          <Link href="/" className="text-sm text-white/90 transition hover:text-white">
            {t.home}
          </Link>

          {ready && isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/90 transition hover:text-white"
              >
                {t.dashboard}
              </Link>

              <Link href="/pair" className="text-sm text-white/90 transition hover:text-white">
                {t.pair}
              </Link>

              <Link
                href="/billing"
                className="text-sm text-white/90 transition hover:text-white"
              >
                {t.billing}
              </Link>

              <button
                onClick={handleLogout}
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t.logout}
              </button>
            </>
          ) : null}

          {ready && !isAuthed ? (
            <>
              <Link
                href="/login"
                className="text-sm text-white/90 transition hover:text-white"
              >
                {t.login}
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t.signup}
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/5 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t.close : t.menu}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#0b0b0f] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
            <div className="flex w-full items-center overflow-hidden rounded-full border border-zinc-800">
              <button
                onClick={() => changeLang("ru")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  lang === "ru" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
                }`}
                type="button"
              >
                RU
              </button>
              <button
                onClick={() => changeLang("en")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  lang === "en" ? "bg-blue-600 text-white" : "text-white hover:bg-white/5"
                }`}
                type="button"
              >
                ENG
              </button>
            </div>

            <Link
              href="/"
              className="rounded-xl px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              {t.home}
            </Link>

            {ready && isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.dashboard}
                </Link>

                <Link
                  href="/pair"
                  className="rounded-xl px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.pair}
                </Link>

                <Link
                  href="/billing"
                  className="rounded-xl px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.billing}
                </Link>

                <button
                  onClick={handleLogout}
                  type="button"
                  className="mt-1 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {t.logout}
                </button>
              </>
            ) : null}

            {ready && !isAuthed ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.login}
                </Link>

                <Link
                  href="/signup"
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
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