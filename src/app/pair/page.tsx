"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  classifyDeviceNicknameError,
  DEVICE_NICKNAME_MAX_LENGTH,
  isValidDeviceNickname,
  sanitizeDeviceNickname,
} from "@/lib/device-nickname";
import {
  getSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";

type SetupStep = "code" | "nickname" | "done";

type PairedDevice = {
  id: string;
  uid: string;
  name: string;
  nickname?: string | null;
  createdAt?: string | null;
};

type UserDeviceItem = {
  device: PairedDevice;
  status?: {
    isPaired?: boolean;
  };
};

const PENDING_DEVICE_KEY = "pocketgpt_pending_nickname";

const TEXT = {
  ru: {
    title: "Подключи PocketGPT",
    subtitle: "Два коротких шага — код с экрана и уникальный никнейм.",
    codeStep: "Код",
    nicknameStep: "Никнейм",
    stepOf: "Шаг",
    codeTitle: "Код с устройства",
    codeText: "Введи 6 цифр, которые появились на экране PocketGPT.",
    codeLabel: "Код привязки",
    codePlaceholder: "000000",
    pair: "Продолжить",
    pairing: "Подключаем…",
    nicknameTitle: "Задай никнейм",
    nicknameText: "Он понадобится друзьям, чтобы найти устройство в Connect.",
    nicknameLabel: "Никнейм устройства",
    nicknamePlaceholder: "например alibek-pocket",
    nicknameHint: "До 15 символов: латиница, цифры, точка, дефис или подчёркивание.",
    saveNickname: "Сохранить никнейм",
    saving: "Проверяем…",
    readyTitle: "Устройство готово",
    readyText: "Привязка завершена. Никнейм сохранён и уже доступен в Connect.",
    dashboard: "Открыть кабинет",
    pairAnother: "Привязать ещё",
    device: "Устройство",
    uid: "UID",
    loginFirst: "Сначала войди в аккаунт",
    invalidCode: "Введи все 6 цифр кода",
    codeExpired: "Код недействителен или уже истёк",
    alreadyPaired: "Это устройство уже привязано",
    pairFailed: "Не удалось привязать устройство",
    resolveFailed: "Устройство привязано, но не удалось открыть настройку никнейма",
    nicknameTaken: "Этот никнейм уже занят",
    nicknameInvalid: "Проверь формат никнейма",
    deviceNotFound: "Устройство не найдено",
    nicknameFailed: "Не удалось сохранить никнейм",
  },
  en: {
    title: "Connect PocketGPT",
    subtitle: "Two quick steps — the on-screen code and a unique nickname.",
    codeStep: "Code",
    nicknameStep: "Nickname",
    stepOf: "Step",
    codeTitle: "Code from the device",
    codeText: "Enter the 6 digits shown on your PocketGPT screen.",
    codeLabel: "Pairing code",
    codePlaceholder: "000000",
    pair: "Continue",
    pairing: "Connecting…",
    nicknameTitle: "Choose a nickname",
    nicknameText: "Friends will use it to find this device in Connect.",
    nicknameLabel: "Device nickname",
    nicknamePlaceholder: "example alibek-pocket",
    nicknameHint: "Up to 15 characters: Latin letters, numbers, dot, dash, or underscore.",
    saveNickname: "Save nickname",
    saving: "Checking…",
    readyTitle: "Device is ready",
    readyText: "Pairing is complete. The nickname is saved and available in Connect.",
    dashboard: "Open dashboard",
    pairAnother: "Pair another",
    device: "Device",
    uid: "UID",
    loginFirst: "Please log in first",
    invalidCode: "Enter all 6 digits of the code",
    codeExpired: "The code is invalid or has expired",
    alreadyPaired: "This device is already paired",
    pairFailed: "Could not pair the device",
    resolveFailed: "The device was paired, but nickname setup could not be opened",
    nicknameTaken: "This nickname is already taken",
    nicknameInvalid: "Check the nickname format",
    deviceNotFound: "Device not found",
    nicknameFailed: "Could not save the nickname",
  },
  kz: {
    title: "PocketGPT құрылғысын қос",
    subtitle: "Екі қысқа қадам — экрандағы код және бірегей лақап ат.",
    codeStep: "Код",
    nicknameStep: "Лақап ат",
    stepOf: "Қадам",
    codeTitle: "Құрылғыдағы код",
    codeText: "PocketGPT экранында шыққан 6 санды енгіз.",
    codeLabel: "Байланыстыру коды",
    codePlaceholder: "000000",
    pair: "Жалғастыру",
    pairing: "Қосылып жатыр…",
    nicknameTitle: "Лақап ат қой",
    nicknameText: "Достарың құрылғыны Connect ішінде осы атпен табады.",
    nicknameLabel: "Құрылғының лақап аты",
    nicknamePlaceholder: "мысалы alibek-pocket",
    nicknameHint: "15 таңбаға дейін: латын әріптері, сандар, нүкте, дефис немесе төменгі сызық.",
    saveNickname: "Лақап атты сақтау",
    saving: "Тексеріліп жатыр…",
    readyTitle: "Құрылғы дайын",
    readyText: "Байланыстыру аяқталды. Лақап ат сақталды және Connect ішінде қолжетімді.",
    dashboard: "Кабинетті ашу",
    pairAnother: "Тағы біреуін қосу",
    device: "Құрылғы",
    uid: "UID",
    loginFirst: "Алдымен аккаунтқа кір",
    invalidCode: "Кодтың барлық 6 санын енгіз",
    codeExpired: "Код жарамсыз немесе мерзімі өтіп кеткен",
    alreadyPaired: "Бұл құрылғы бұрыннан байланыстырылған",
    pairFailed: "Құрылғыны байланыстыру мүмкін болмады",
    resolveFailed: "Құрылғы байланыстырылды, бірақ лақап ат баптауы ашылмады",
    nicknameTaken: "Бұл лақап ат бос емес",
    nicknameInvalid: "Лақап ат пішімін тексер",
    deviceNotFound: "Құрылғы табылмады",
    nicknameFailed: "Лақап атты сақтау мүмкін болмады",
  },
} as const;

function PairDeviceGlyph({ active = false }: { active?: boolean }) {
  return (
    <div className={`pg-pair-device ${active ? "is-active" : ""}`} aria-hidden="true">
      <div className="pg-pair-device-top">
        <span />
        <span />
      </div>
      <div className="pg-pair-device-screen">
        <div className="pg-pair-wave">
          {[0, 1, 2, 3, 4, 5, 6].map((bar) => <span key={bar} />)}
        </div>
      </div>
      <div className="pg-pair-device-control" />
      <i className="pg-pair-device-signal" />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="m6.5 12.4 3.4 3.4 7.7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return <span className="pg-spinner" aria-hidden="true" />;
}

function readPendingDevice(): PairedDevice | null {
  try {
    const raw = sessionStorage.getItem(PENDING_DEVICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PairedDevice>;
    if (!parsed.id) return null;
    return {
      id: parsed.id,
      uid: parsed.uid || "",
      name: parsed.name || "PocketGPT",
      nickname: parsed.nickname || null,
      createdAt: parsed.createdAt || null,
    };
  } catch {
    return null;
  }
}

function persistPendingDevice(device: PairedDevice | null) {
  if (!device) {
    sessionStorage.removeItem(PENDING_DEVICE_KEY);
    return;
  }
  sessionStorage.setItem(PENDING_DEVICE_KEY, JSON.stringify(device));
}

function pairErrorMessage(error: unknown, lang: SiteLanguage): string {
  const t = TEXT[lang];
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("expired") ||
    message.includes("invalid code") ||
    message.includes("code_not_found") ||
    message.includes("pair code") ||
    message.includes("not found")
  ) {
    return t.codeExpired;
  }

  if (
    message.includes("already paired") ||
    message.includes("already owned") ||
    message.includes("device_paired")
  ) {
    return t.alreadyPaired;
  }

  return t.pairFailed;
}

function nicknameErrorMessage(error: unknown, lang: SiteLanguage): string {
  const t = TEXT[lang];
  const kind = classifyDeviceNicknameError(error);
  if (kind === "taken") return t.nicknameTaken;
  if (kind === "invalid") return t.nicknameInvalid;
  if (kind === "device-not-found") return t.deviceNotFound;
  return t.nicknameFailed;
}

async function resolvePairedDevice(data: unknown): Promise<PairedDevice | null> {
  const payload = (data || {}) as Record<string, unknown>;
  const responseDevice = (
    (payload.device as Record<string, unknown> | undefined) ||
    (payload.pairedDevice as Record<string, unknown> | undefined) ||
    {}
  );

  const responseId = String(responseDevice.id || payload.deviceId || "");
  const responseUid = String(responseDevice.uid || payload.uid || "");
  const responseName = String(responseDevice.name || payload.deviceName || "PocketGPT");

  try {
    const devicesData = await apiFetch("/v1/user/devices", { method: "GET" });
    const items = ((devicesData?.devices || []) as UserDeviceItem[]).filter((item) => item?.device?.id);

    const exact = items.find((item) =>
      (responseId && item.device.id === responseId) ||
      (responseUid && item.device.uid === responseUid)
    );

    if (exact) return exact.device;

    const byName = responseName && responseName !== "PocketGPT"
      ? items.find((item) => item.device.name === responseName && item.status?.isPaired !== false)
      : null;
    if (byName) return byName.device;

    const newestWithoutNickname = [...items]
      .filter((item) => item.status?.isPaired !== false && !item.device.nickname)
      .sort((a, b) => {
        const left = a.device.createdAt ? new Date(a.device.createdAt).getTime() : 0;
        const right = b.device.createdAt ? new Date(b.device.createdAt).getTime() : 0;
        return right - left;
      })[0];

    if (newestWithoutNickname) return newestWithoutNickname.device;
  } catch {
    // The pair response itself may still contain everything required.
  }

  if (!responseId) return null;
  return {
    id: responseId,
    uid: responseUid,
    name: responseName,
    nickname: null,
  };
}

export default function PairPage() {
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<SetupStep>("code");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [device, setDevice] = useState<PairedDevice | null>(null);
  const [errorText, setErrorText] = useState("");
  const [pairing, setPairing] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const t = TEXT[lang];

  const currentStepNumber = step === "code" ? 1 : 2;
  const codeComplete = code.length === 6;
  const nicknameValid = useMemo(
    () => isValidDeviceNickname(nickname.trim()),
    [nickname]
  );

  useEffect(() => {
    const syncLanguage = () => setLang(getSiteLanguage());
    syncLanguage();
    window.addEventListener(SITE_LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(SITE_LANGUAGE_EVENT, syncLanguage);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      window.location.replace("/login");
      return;
    }

    const pending = readPendingDevice();
    if (pending) {
      setDevice(pending);
      setNickname(pending.nickname || "");
      setStep("nickname");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      if (step === "code") codeInputRef.current?.focus();
      if (step === "nickname") nicknameInputRef.current?.focus();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [ready, step]);

  async function handlePair(event: React.FormEvent) {
    event.preventDefault();
    setErrorText("");

    if (!getToken()) {
      setErrorText(t.loginFirst);
      return;
    }

    if (!codeComplete) {
      setErrorText(t.invalidCode);
      return;
    }

    try {
      setPairing(true);
      const data = await apiFetch("/v1/user/pair/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      const pairedDevice = await resolvePairedDevice(data);
      if (!pairedDevice) {
        setErrorText(t.resolveFailed);
        return;
      }

      setDevice(pairedDevice);
      setNickname(pairedDevice.nickname || "");
      persistPendingDevice(pairedDevice);
      setStep("nickname");
      setCode("");
    } catch (error) {
      setErrorText(pairErrorMessage(error, lang));
    } finally {
      setPairing(false);
    }
  }

  async function handleNickname(event: React.FormEvent) {
    event.preventDefault();
    setErrorText("");
    const normalized = nickname.trim().toLowerCase();

    if (!device) {
      setErrorText(t.deviceNotFound);
      return;
    }

    if (!isValidDeviceNickname(normalized)) {
      setErrorText(t.nicknameInvalid);
      return;
    }

    try {
      setSavingNickname(true);
      await apiFetch("/v1/user/device/nickname", {
        method: "POST",
        body: JSON.stringify({
          deviceId: device.id,
          nickname: normalized,
          lang,
        }),
      });

      setDevice((current) => current ? { ...current, nickname: normalized } : current);
      setNickname(normalized);
      persistPendingDevice(null);
      setStep("done");
    } catch (error) {
      setErrorText(nicknameErrorMessage(error, lang));
    } finally {
      setSavingNickname(false);
    }
  }

  function resetFlow() {
    persistPendingDevice(null);
    setStep("code");
    setCode("");
    setNickname("");
    setDevice(null);
    setErrorText("");
  }

  if (!ready) {
    return <main className="pg-pair-page" aria-busy="true" />;
  }

  return (
    <main className="pg-pair-page">
      <div className="pg-pair-grid" aria-hidden="true" />
      <div className="pg-pair-glow" aria-hidden="true" />

      <div className="pg-pair-shell">
        <aside className="pg-pair-visual" aria-hidden="true">
          <div className="pg-pair-visual-orbit pg-pair-visual-orbit-one" />
          <div className="pg-pair-visual-orbit pg-pair-visual-orbit-two" />
          <PairDeviceGlyph active={pairing || savingNickname || step === "done"} />
          <div className="pg-pair-visual-caption">
            <span>{step === "done" ? "READY" : "POCKETGPT"}</span>
            <i />
          </div>
        </aside>

        <section className="pg-pair-panel">
          <header className="pg-pair-head">
<h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </header>

          <div className="pg-pair-progress" aria-label={`${t.stepOf} ${currentStepNumber} / 2`}>
            <div className={`pg-pair-progress-item ${step !== "code" ? "is-complete" : "is-active"}`}>
              <span>{step !== "code" ? <CheckIcon /> : "01"}</span>
              <strong>{t.codeStep}</strong>
            </div>
            <i className={step !== "code" ? "is-complete" : ""} />
            <div className={`pg-pair-progress-item ${step === "nickname" ? "is-active" : step === "done" ? "is-complete" : ""}`}>
              <span>{step === "done" ? <CheckIcon /> : "02"}</span>
              <strong>{t.nicknameStep}</strong>
            </div>
          </div>

          <div className="pg-pair-stage" key={step}>
            {step === "code" ? (
              <form onSubmit={handlePair} className="pg-pair-form">
                <div className="pg-pair-stage-copy">
                  <span>{t.stepOf} 1 / 2</span>
                  <h2>{t.codeTitle}</h2>
                  <p>{t.codeText}</p>
                </div>

                <label className="pg-pair-field">
                  <span>{t.codeLabel}</span>
                  <input
                    ref={codeInputRef}
                    value={code}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    placeholder={t.codePlaceholder}
                    aria-invalid={Boolean(errorText)}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setErrorText("");
                    }}
                  />
                  <small>{code.length}/6</small>
                </label>

                {errorText ? <div className="pg-pair-message is-error" role="alert">{errorText}</div> : null}

                <button type="submit" className="pg-button pg-button-primary pg-pair-submit" disabled={pairing || !codeComplete}>
                  {pairing ? <><Spinner />{t.pairing}</> : t.pair}
                </button>
              </form>
            ) : null}

            {step === "nickname" ? (
              <form onSubmit={handleNickname} className="pg-pair-form">
                <div className="pg-pair-stage-copy">
                  <span>{t.stepOf} 2 / 2</span>
                  <h2>{t.nicknameTitle}</h2>
                  <p>{t.nicknameText}</p>
                </div>

                <div className="pg-pair-device-chip">
                  <span className="pg-pair-device-chip-icon" aria-hidden="true"><i /><i /><i /></span>
                  <span>
                    <strong>{device?.name || t.device}</strong>
                    <small>{device?.uid ? `${t.uid} ${device.uid}` : t.device}</small>
                  </span>
                  <i className="pg-pair-connected-dot" />
                </div>

                <label className="pg-pair-field pg-pair-nickname-field">
                  <span>{t.nicknameLabel}</span>
                  <input
                    ref={nicknameInputRef}
                    value={nickname}
                    maxLength={DEVICE_NICKNAME_MAX_LENGTH}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={t.nicknamePlaceholder}
                    aria-invalid={Boolean(errorText)}
                    onChange={(event) => {
                      setNickname(sanitizeDeviceNickname(event.target.value));
                      setErrorText("");
                    }}
                  />
                  <small>{nickname.length}/{DEVICE_NICKNAME_MAX_LENGTH}</small>
                  <em>{t.nicknameHint}</em>
                </label>

                {errorText ? <div className="pg-pair-message is-error" role="alert">{errorText}</div> : null}

                <button type="submit" className="pg-button pg-button-primary pg-pair-submit" disabled={savingNickname || !nicknameValid}>
                  {savingNickname ? <><Spinner />{t.saving}</> : t.saveNickname}
                </button>
              </form>
            ) : null}

            {step === "done" ? (
              <div className="pg-pair-complete">
                <div className="pg-pair-success-icon"><CheckIcon /></div>
                <div className="pg-pair-stage-copy">
                  <span>POCKETGPT</span>
                  <h2>{t.readyTitle}</h2>
                  <p>{t.readyText}</p>
                </div>

                <div className="pg-pair-ready-device">
                  <span>{device?.nickname || device?.name || t.device}</span>
                  <small>{device?.uid ? `${t.uid} ${device.uid}` : ""}</small>
                </div>

                <div className="pg-pair-complete-actions">
                  <Link href="/dashboard" className="pg-button pg-button-primary">{t.dashboard}</Link>
                  <button type="button" className="pg-button pg-button-secondary" onClick={resetFlow}>{t.pairAnother}</button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
