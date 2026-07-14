"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  getSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";

const TEXT = {
  ru: {
    eyebrow: "ГОЛОСОВОЙ AI / КАРМАННЫЙ ФОРМАТ",
    titleStart: "AI, который",
    titleAccent: "всегда рядом.",
    description: "Компактное устройство: спроси голосом, получи точный ответ прямо на экране.",
    dashboard: "Открыть кабинет",
    signup: "Создать аккаунт",
    login: "Войти",
    displayQuestion: "Почему небо синее?",
    displayAnswer: "Свет рассеивается в атмосфере…",
    listening: "СЛУШАЮ",
    online: "ONLINE",
    revision: "REV. 02",
    deviceLabel: "POCKET VOICE TERMINAL",
  },
  en: {
    eyebrow: "VOICE AI / POCKET FORMAT",
    titleStart: "AI that stays",
    titleAccent: "close to you.",
    description: "A compact device: ask by voice and get a precise answer directly on the screen.",
    dashboard: "Open dashboard",
    signup: "Create account",
    login: "Log in",
    displayQuestion: "Why is the sky blue?",
    displayAnswer: "Light scatters in the atmosphere…",
    listening: "LISTENING",
    online: "ONLINE",
    revision: "REV. 02",
    deviceLabel: "POCKET VOICE TERMINAL",
  },
  kz: {
    eyebrow: "ДАУЫСТЫҚ AI / ҚАЛТАЛЫҚ ФОРМАТ",
    titleStart: "Әрдайым жаныңдағы",
    titleAccent: "жасанды интеллект.",
    description: "Ықшам құрылғы: дауыспен сұра да, нақты жауапты экраннан бірден ал.",
    dashboard: "Жеке кабинетті ашу",
    signup: "Аккаунт ашу",
    login: "Кіру",
    displayQuestion: "Аспан неге көк?",
    displayAnswer: "Жарық атмосферада шашырайды…",
    listening: "ТЫҢДАУДА",
    online: "ОНЛАЙН",
    revision: "REV. 02",
    deviceLabel: "ҚАЛТАЛЫҚ ДАУЫС ТЕРМИНАЛЫ",
  },
} as const;

function Waveform() {
  const bars = [12, 24, 16, 34, 46, 28, 56, 40, 24, 48, 32, 18, 38, 26, 14];

  return (
    <div className="pg-waveform" aria-hidden="true">
      {bars.map((height, index) => (
        <span key={`${height}-${index}`} style={{ height }} />
      ))}
    </div>
  );
}

function DeviceVisual({ t }: { t: (typeof TEXT)[SiteLanguage] }) {
  return (
    <div className="pg-device-stage" aria-label="PocketGPT device visualization">
      <div className="pg-orbit pg-orbit-one" />
      <div className="pg-orbit pg-orbit-two" />
      <div className="pg-device-wire pg-device-wire-left">
        <span />
      </div>
      <div className="pg-device-wire pg-device-wire-right">
        <span />
      </div>

      <div className="pg-device-shadow" />
      <div className="pg-device">
        <div className="pg-device-topline">
          <span>PG / S3</span>
          <span>{t.revision}</span>
        </div>

        <div className="pg-device-screen">
          <div className="pg-device-screen-head">
            <span className="pg-device-live"><i />{t.listening}</span>
            <span>{t.online}</span>
          </div>
          <Waveform />
          <div className="pg-device-question">{t.displayQuestion}</div>
          <div className="pg-device-answer">{t.displayAnswer}</div>
        </div>

        <div className="pg-device-controls">
          <div className="pg-device-mic" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="pg-device-control-center">
            <span className="pg-device-led" />
            <span>VOICE</span>
          </div>
          <div className="pg-device-button" aria-hidden="true"><span /></div>
        </div>

        <div className="pg-device-footer">
          <span>{t.deviceLabel}</span>
          <span>2026</span>
        </div>
      </div>

      <div className="pg-device-spec pg-device-spec-left">
        <span>01</span>
        <strong>WAV</strong>
        <small>16 kHz</small>
      </div>
      <div className="pg-device-spec pg-device-spec-right">
        <span>02</span>
        <strong>Wi-Fi</strong>
        <small>STREAM</small>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const t = TEXT[lang];

  useEffect(() => {
    const sync = () => {
      setLang(getSiteLanguage());
      setIsAuthed(Boolean(getToken()));
      setReady(true);
    };

    sync();
    window.addEventListener(SITE_LANGUAGE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SITE_LANGUAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <main className="pg-home">
      <div className="pg-grid-layer" aria-hidden="true" />
      <div className="pg-home-glow pg-home-glow-one" aria-hidden="true" />
      <div className="pg-home-glow pg-home-glow-two" aria-hidden="true" />

      <div className="pg-home-container">
        <section className="pg-hero">
          <div className="pg-hero-copy">
            <div className="pg-eyebrow">
              <span className="pg-eyebrow-mark" />
              {t.eyebrow}
            </div>

            <h1 className="pg-hero-title">
              <span>{t.titleStart}</span>
              <span className="pg-hero-title-accent">{t.titleAccent}</span>
            </h1>

            <p className="pg-hero-description">{t.description}</p>

            <div className="pg-hero-actions">
              {ready && isAuthed ? (
                <Link href="/dashboard" className="pg-button pg-button-primary">
                  {t.dashboard}
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="pg-button pg-button-primary">
                    {t.signup}
                    <span aria-hidden="true">↗</span>
                  </Link>
                  <Link href="/login" className="pg-button pg-button-secondary">
                    {t.login}
                  </Link>
                </>
              )}
            </div>

          </div>

          <DeviceVisual t={t} />
        </section>

      </div>
    </main>
  );
}
