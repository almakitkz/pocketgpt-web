"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getToken, logout } from "@/lib/auth";
import {
  getSiteLanguage,
  saveSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";

const NAV_TEXT = {
  ru: {
    home: "Главная",
    dashboard: "Кабинет",
    pair: "Привязка",
    billing: "Оплата",
    connect: "Connect",
    login: "Войти",
    signup: "Регистрация",
    logout: "Выйти из аккаунта",
    menu: "Открыть меню",
    close: "Закрыть меню",
    language: "Выбрать язык",
    navigation: "Навигация",
    account: "Аккаунт",
    legal: "Документы",
    terms: "Условия",
    refund: "Возврат",
  },
  en: {
    home: "Home",
    dashboard: "Dashboard",
    pair: "Pair device",
    billing: "Billing",
    connect: "Connect",
    login: "Log in",
    signup: "Create account",
    logout: "Log out",
    menu: "Open menu",
    close: "Close menu",
    language: "Choose language",
    navigation: "Navigation",
    account: "Account",
    legal: "Documents",
    terms: "Terms",
    refund: "Refunds",
  },
  kz: {
    home: "Басты бет",
    dashboard: "Жеке кабинет",
    pair: "Құрылғыны қосу",
    billing: "Төлем",
    connect: "Connect",
    login: "Кіру",
    signup: "Тіркелу",
    logout: "Аккаунттан шығу",
    menu: "Мәзірді ашу",
    close: "Мәзірді жабу",
    language: "Тілді таңдау",
    navigation: "Навигация",
    account: "Аккаунт",
    legal: "Құжаттар",
    terms: "Шарттар",
    refund: "Қайтару",
  },
} as const;

const LANGUAGES: { code: SiteLanguage; label: string; short: string }[] = [
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
  { code: "kz", label: "Қазақша", short: "KZ" },
];

type NavIconName = "home" | "dashboard" | "pair" | "billing" | "connect" | "login" | "signup";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

function MenuIcon({ open = false }: { open?: boolean }) {
  return open ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.9 12h16.2M12 3.75c2.2 2.25 3.3 5 3.3 8.25S14.2 18 12 20.25C9.8 18 8.7 15.25 8.7 12S9.8 6 12 3.75Z" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10M14.5 8l4 4-4 4M18.2 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {name === "home" ? <path d="m4.5 10 7.5-6 7.5 6v8.2a1.3 1.3 0 0 1-1.3 1.3H5.8a1.3 1.3 0 0 1-1.3-1.3V10ZM9.2 19.5v-5.7h5.6v5.7" {...common} /> : null}
      {name === "dashboard" ? <><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" {...common} /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" {...common} /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" {...common} /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" {...common} /></> : null}
      {name === "pair" ? <><path d="M8.3 15.7 6.6 17.4a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0" {...common} /><path d="m15.7 8.3 1.7-1.7a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0M8.5 15.5l7-7" {...common} /></> : null}
      {name === "billing" ? <><rect x="3.5" y="6" width="17" height="12" rx="2" {...common} /><path d="M3.5 10h17M7 14h3" {...common} /></> : null}
      {name === "connect" ? <><circle cx="12" cy="5.5" r="2.2" {...common} /><circle cx="5.5" cy="18" r="2.2" {...common} /><circle cx="18.5" cy="18" r="2.2" {...common} /><path d="m10.7 7.3-4 8.5M13.3 7.3l4 8.5M7.7 18h8.6" {...common} /></> : null}
      {name === "login" ? <><path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10M14.5 8l4 4-4 4M18.2 12H9" {...common} /></> : null}
      {name === "signup" ? <><circle cx="9" cy="8" r="3" {...common} /><path d="M3.8 19c.5-3.4 2.2-5.2 5.2-5.2s4.7 1.8 5.2 5.2M17.5 8v6M14.5 11h6" {...common} /></> : null}
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const languageRef = useRef<HTMLDivElement>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    const syncState = () => {
      setIsAuthed(Boolean(getToken()));
      setLang(getSiteLanguage());
      setReady(true);
    };

    syncState();
    window.addEventListener(SITE_LANGUAGE_EVENT, syncState);
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener(SITE_LANGUAGE_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setLanguageOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const t = NAV_TEXT[lang];

  const mainItems: NavItem[] = isAuthed
    ? [
        { href: "/", label: t.home, icon: "home" },
        { href: "/dashboard", label: t.dashboard, icon: "dashboard" },
        { href: "/pair", label: t.pair, icon: "pair" },
        { href: "/billing", label: t.billing, icon: "billing" },
        { href: "/connect", label: t.connect, icon: "connect" },
      ]
    : [
        { href: "/", label: t.home, icon: "home" },
        { href: "/login", label: t.login, icon: "login" },
        { href: "/signup", label: t.signup, icon: "signup" },
      ];

  function handleLogout() {
    logout();
    setMenuOpen(false);
    window.location.href = "/login";
  }

  function changeLanguage(nextLanguage: SiteLanguage) {
    saveSiteLanguage(nextLanguage);
    setLang(nextLanguage);
    setLanguageOpen(false);
  }

  return (
    <header className="pg-header">
      <div className="pg-header-inner">
        <button
          type="button"
          className="pg-icon-button"
          aria-label={menuOpen ? t.close : t.menu}
          aria-expanded={menuOpen}
          aria-controls="pocketgpt-navigation"
          onClick={() => {
            setMenuOpen((value) => !value);
            setLanguageOpen(false);
          }}
        >
          <MenuIcon open={menuOpen} />
        </button>

        <Link
          href="/"
          className="pg-header-mark"
          aria-label={t.home}
          onClick={() => {
            setMenuOpen(false);
            setLanguageOpen(false);
            if (pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <span className="pg-header-mark-dot" />
          <span>POCKETGPT</span>
        </Link>

        <div className="pg-language" ref={languageRef}>
          <button
            type="button"
            className="pg-icon-button"
            aria-label={t.language}
            aria-expanded={languageOpen}
            aria-controls="pocketgpt-language-menu"
            onClick={() => {
              setLanguageOpen((value) => !value);
              setMenuOpen(false);
            }}
          >
            <GlobeIcon />
          </button>

          {languageOpen ? (
            <div id="pocketgpt-language-menu" className="pg-language-menu" role="menu">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={lang === language.code}
                  className={`pg-language-option ${lang === language.code ? "is-active" : ""}`}
                  onClick={() => changeLanguage(language.code)}
                >
                  <span>{language.label}</span>
                  <span className="pg-language-code">{language.short}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`pg-drawer-overlay ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id="pocketgpt-navigation"
        className={`pg-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        aria-label={t.navigation}
      >
        <div className="pg-drawer-head">
          <div>
            <div className="pg-drawer-brand">PocketGPT</div>
            <div className="pg-drawer-caption">VOICE AI DEVICE / 2.0</div>
          </div>
          <button type="button" className="pg-icon-button pg-icon-button-quiet" aria-label={t.close} onClick={() => setMenuOpen(false)}>
            <MenuIcon open />
          </button>
        </div>

        <div className="pg-drawer-rule" />
        <div className="pg-drawer-section-label">{ready && isAuthed ? t.account : t.navigation}</div>

        <nav className="pg-drawer-nav">
          {ready
            ? mainItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`pg-drawer-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="pg-drawer-link-icon"><NavIcon name={item.icon} /></span>
                    <span>{item.label}</span>
                    <span className="pg-drawer-link-index">0{mainItems.indexOf(item) + 1}</span>
                  </Link>
                );
              })
            : <div className="pg-drawer-skeleton" />}
        </nav>

        <div className="pg-drawer-spacer" />

        {ready && isAuthed ? (
          <button type="button" className="pg-drawer-logout" onClick={handleLogout}>
            <span className="pg-drawer-link-icon"><LogoutIcon /></span>
            <span>{t.logout}</span>
          </button>
        ) : null}

        <div className="pg-drawer-footer">
          <span>{t.legal}</span>
          <div>
            <Link href="/terms" onClick={() => setMenuOpen(false)}>{t.terms}</Link>
            <Link href="/refund-policy" onClick={() => setMenuOpen(false)}>{t.refund}</Link>
          </div>
        </div>
      </aside>
    </header>
  );
}
