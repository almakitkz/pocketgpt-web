"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  classifyDeviceNicknameError,
  DEVICE_NICKNAME_MAX_LENGTH,
  isValidDeviceNickname,
  sanitizeDeviceNickname,
} from "@/lib/device-nickname";
import { getToken, getUser } from "@/lib/auth";
import {
  getSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  requestLimit: number | null;
  kind?: string;
  connectIncluded?: boolean;
  createdAt?: string | null;
};

type UsageState = {
  scope: string | null;
  scopeRefId: string | null;
  requestLimit: number | null;
  usedRequests: number;
  remainingRequests: number | null;
  periodStartedAt: string | null;
  periodEndsAt: string | null;
  trialActive: boolean;
  subscriptionActive: boolean;
  promoActive?: boolean;
  promoSummary?: {
    totalRequests: number;
    usedRequests: number;
    remainingRequests: number;
  } | null;
};

type PromoState = {
  active: boolean;
  totalRequests: number;
  usedRequests: number;
  remainingRequests: number;
  activeCode: string | null;
  activeGrantId: string | null;
  grantsCount: number;
};

type DeviceItem = {
  device: {
    id: string;
    uid: string;
    name: string;
    nickname?: string | null;
    ownerId: string | null;
    disabled: boolean;
    createdAt: string | null;
  };
  status: {
    isPaired: boolean;
    hasAccess: boolean;
  };
  trial: {
    exists: boolean;
    active: boolean;
    startedAt: string | null;
    expiresAt: string | null;
  };
  subscription: {
    active: boolean;
    id: string | null;
    planId: string | null;
    plan: Plan | null;
    status: string | null;
    trialEnd: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  promo?: PromoState | null;
  usage: UsageState;
  connect?: {
    active?: boolean;
    source?: string | null;
  } | null;
};

type LocalUser = {
  id: string;
  email: string;
};

const TEXT = {
  ru: {
    title: "Кабинет",
    subtitle: "Твои устройства PocketGPT в одном месте.",
    devices: "Устройства",
    oneDevice: "устройство",
    fewDevices: "устройства",
    manyDevices: "устройств",
    noDevices: "Пока нет привязанных устройств",
    pairDevice: "Привязать устройство",
    active: "Активно",
    inactive: "Неактивно",
    disabled: "Отключено",
    paired: "Привязано",
    notPaired: "Не привязано",
    remaining: "Осталось",
    requests: "запросов",
    unlimited: "Без лимита",
    plan: "План",
    noPlan: "Нет активного плана",
    validUntil: "До",
    noExpiry: "Без срока",
    info: "Информация об устройстве",
    editNickname: "Изменить никнейм",
    deviceDetails: "Устройство",
    close: "Закрыть",
    nickname: "Никнейм",
    nicknameHelp: "До 15 символов: латиница, цифры, точка, дефис или подчёркивание.",
    nicknamePlaceholder: "например alibek-pocket",
    save: "Сохранить",
    saving: "Сохранение…",
    nicknameSaved: "Никнейм сохранён",
    nicknameTaken: "Этот никнейм уже занят",
    nicknameInvalid: "Проверь формат никнейма",
    loadFailed: "Не удалось загрузить данные",
    retry: "Повторить",
    status: "Статус",
    uid: "UID",
    pairing: "Привязка",
    created: "Дата создания",
    trial: "Пробный период",
    trialActive: "Активен",
    trialEnded: "Завершён",
    trialNotStarted: "Не начат",
    subscription: "Обычная подписка",
    subscriptionActive: "Активна",
    subscriptionInactive: "Неактивна",
    subscriptionStatus: "Статус подписки",
    connect: "Connect",
    connectActive: "Активен",
    connectInactive: "Неактивен",
    source: "Источник",
    usage: "Запросы",
    limit: "Лимит",
    used: "Использовано",
    period: "Период",
    promo: "Промо-баланс",
    promoTotal: "Всего",
    promoUsed: "Использовано",
    promoRemaining: "Осталось",
    promoCodes: "Активировано кодов",
    technical: "Технические сведения",
    internalDeviceId: "Внутренний Device ID",
    ownerId: "Owner ID",
    accessScope: "Источник доступа",
    scopeReference: "ID источника",
    yes: "Да",
    no: "Нет",
    deviceFallback: "PocketGPT",
  },
  en: {
    title: "Dashboard",
    subtitle: "Your PocketGPT devices in one place.",
    devices: "Devices",
    oneDevice: "device",
    fewDevices: "devices",
    manyDevices: "devices",
    noDevices: "No paired devices yet",
    pairDevice: "Pair a device",
    active: "Active",
    inactive: "Inactive",
    disabled: "Disabled",
    paired: "Paired",
    notPaired: "Not paired",
    remaining: "Remaining",
    requests: "requests",
    unlimited: "Unlimited",
    plan: "Plan",
    noPlan: "No active plan",
    validUntil: "Until",
    noExpiry: "No expiry",
    info: "Device information",
    editNickname: "Edit nickname",
    deviceDetails: "Device",
    close: "Close",
    nickname: "Nickname",
    nicknameHelp: "Up to 15 characters: Latin letters, numbers, dot, dash, or underscore.",
    nicknamePlaceholder: "example alibek-pocket",
    save: "Save",
    saving: "Saving…",
    nicknameSaved: "Nickname saved",
    nicknameTaken: "This nickname is already taken",
    nicknameInvalid: "Check the nickname format",
    loadFailed: "Could not load data",
    retry: "Try again",
    status: "Status",
    uid: "UID",
    pairing: "Pairing",
    created: "Created",
    trial: "Trial period",
    trialActive: "Active",
    trialEnded: "Ended",
    trialNotStarted: "Not started",
    subscription: "Subscription",
    subscriptionActive: "Active",
    subscriptionInactive: "Inactive",
    subscriptionStatus: "Subscription status",
    connect: "Connect",
    connectActive: "Active",
    connectInactive: "Inactive",
    source: "Source",
    usage: "Requests",
    limit: "Limit",
    used: "Used",
    period: "Period",
    promo: "Promo balance",
    promoTotal: "Total",
    promoUsed: "Used",
    promoRemaining: "Remaining",
    promoCodes: "Redeemed codes",
    technical: "Technical details",
    internalDeviceId: "Internal Device ID",
    ownerId: "Owner ID",
    accessScope: "Access source",
    scopeReference: "Source ID",
    yes: "Yes",
    no: "No",
    deviceFallback: "PocketGPT",
  },
  kz: {
    title: "Жеке кабинет",
    subtitle: "PocketGPT құрылғыларың бір жерде.",
    devices: "Құрылғылар",
    oneDevice: "құрылғы",
    fewDevices: "құрылғы",
    manyDevices: "құрылғы",
    noDevices: "Әзірге байланыстырылған құрылғы жоқ",
    pairDevice: "Құрылғыны байланыстыру",
    active: "Белсенді",
    inactive: "Белсенді емес",
    disabled: "Өшірілген",
    paired: "Байланыстырылған",
    notPaired: "Байланыстырылмаған",
    remaining: "Қалды",
    requests: "сұрау",
    unlimited: "Лимитсіз",
    plan: "Жоспар",
    noPlan: "Белсенді жоспар жоқ",
    validUntil: "Мерзімі",
    noExpiry: "Мерзімсіз",
    info: "Құрылғы туралы ақпарат",
    editNickname: "Лақап атты өзгерту",
    deviceDetails: "Құрылғы",
    close: "Жабу",
    nickname: "Лақап аты",
    nicknameHelp: "15 таңбаға дейін: латын әріптері, сандар, нүкте, дефис немесе төменгі сызық.",
    nicknamePlaceholder: "мысалы alibek-pocket",
    save: "Сақтау",
    saving: "Сақталуда…",
    nicknameSaved: "Лақап ат сақталды",
    nicknameTaken: "Бұл лақап ат бос емес",
    nicknameInvalid: "Лақап ат пішімін тексер",
    loadFailed: "Деректер жүктелмеді",
    retry: "Қайталау",
    status: "Күйі",
    uid: "UID",
    pairing: "Байланыс",
    created: "Құрылған күні",
    trial: "Сынақ мерзімі",
    trialActive: "Белсенді",
    trialEnded: "Аяқталды",
    trialNotStarted: "Басталмаған",
    subscription: "Негізгі жазылым",
    subscriptionActive: "Белсенді",
    subscriptionInactive: "Белсенді емес",
    subscriptionStatus: "Жазылым күйі",
    connect: "Connect",
    connectActive: "Белсенді",
    connectInactive: "Белсенді емес",
    source: "Көзі",
    usage: "Сұраулар",
    limit: "Лимит",
    used: "Қолданылды",
    period: "Кезең",
    promo: "Промо-баланс",
    promoTotal: "Барлығы",
    promoUsed: "Қолданылды",
    promoRemaining: "Қалды",
    promoCodes: "Қосылған кодтар",
    technical: "Техникалық мәліметтер",
    internalDeviceId: "Ішкі Device ID",
    ownerId: "Owner ID",
    accessScope: "Қолжетім көзі",
    scopeReference: "Көз ID",
    yes: "Иә",
    no: "Жоқ",
    deviceFallback: "PocketGPT",
  },
} as const;

function formatDate(value: string | null | undefined, lang: SiteLanguage): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(
    lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU",
    { day: "2-digit", month: "short", year: "numeric" }
  ).format(date);
}

function formatDateTime(value: string | null | undefined, lang: SiteLanguage): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(
    lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU",
    { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
  ).format(date);
}

function nicknameErrorMessage(error: unknown, lang: SiteLanguage): string {
  const t = TEXT[lang];
  const kind = classifyDeviceNicknameError(error);
  if (kind === "taken") return t.nicknameTaken;
  if (kind === "invalid") return t.nicknameInvalid;
  return t.loadFailed;
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.6v5.2M12 7.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="m14.7 5.3 4 4M5 19l2.7-.55L18.1 8.05a1.5 1.5 0 0 0 0-2.12l-.03-.03a1.5 1.5 0 0 0-2.12 0L5.55 16.3 5 19Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DeviceGlyph() {
  return (
    <div className="pg-device-glyph" aria-hidden="true">
      <div className="pg-device-glyph-screen">
        <span />
        <span />
        <span />
      </div>
      <div className="pg-device-glyph-control" />
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="pg-detail-row">
      <dt>{label}</dt>
      <dd className={mono ? "is-mono" : undefined}>{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [detailsDevice, setDetailsDevice] = useState<DeviceItem | null>(null);
  const [renameDevice, setRenameDevice] = useState<DeviceItem | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const lastLoadedAt = useRef(0);
  const t = TEXT[lang];

  const activeDevices = useMemo(
    () => devices.filter((item) => item.status.isPaired && !item.device.disabled),
    [devices]
  );

  const loadData = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    setErrorText("");

    try {
      const devicesData = await apiFetch("/v1/user/devices", { method: "GET" });
      const nextDevices = (devicesData.devices || []) as DeviceItem[];
      setDevices(nextDevices);
      lastLoadedAt.current = Date.now();

      setDetailsDevice((current) =>
        current ? nextDevices.find((item) => item.device.id === current.device.id) || null : null
      );
      setRenameDevice((current) =>
        current ? nextDevices.find((item) => item.device.id === current.device.id) || null : null
      );
    } catch {
      setErrorText(TEXT[getSiteLanguage()].loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncLanguage = () => setLang(getSiteLanguage());
    syncLanguage();
    window.addEventListener(SITE_LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(SITE_LANGUAGE_EVENT, syncLanguage);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }

    setUser(getUser() as LocalUser | null);
    setReady(true);
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoadedAt.current > 30_000) {
        void loadData(false);
      }
    };

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [loadData]);

  useEffect(() => {
    const modalOpen = Boolean(detailsDevice || renameDevice);
    document.body.style.overflow = modalOpen ? "hidden" : "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailsDevice(null);
        setRenameDevice(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailsDevice, renameDevice]);

  function openRename(item: DeviceItem) {
    setRenameDevice(item);
    setNicknameValue(item.device.nickname || "");
    setNicknameMessage("");
    setNicknameError("");
  }

  async function saveNickname() {
    if (!renameDevice) return;
    const nickname = nicknameValue.trim().toLowerCase();

    if (!isValidDeviceNickname(nickname)) {
      setNicknameError(t.nicknameInvalid);
      return;
    }

    try {
      setSavingNickname(true);
      setNicknameError("");
      setNicknameMessage("");

      await apiFetch("/v1/user/device/nickname", {
        method: "POST",
        body: JSON.stringify({
          deviceId: renameDevice.device.id,
          nickname,
          lang,
        }),
      });

      setDevices((current) =>
        current.map((item) =>
          item.device.id === renameDevice.device.id
            ? { ...item, device: { ...item.device, nickname } }
            : item
        )
      );
      setRenameDevice((current) =>
        current ? { ...current, device: { ...current.device, nickname } } : current
      );
      setDetailsDevice((current) =>
        current?.device.id === renameDevice.device.id
          ? { ...current, device: { ...current.device, nickname } }
          : current
      );
      setNicknameMessage(t.nicknameSaved);
      lastLoadedAt.current = Date.now();
    } catch (error) {
      setNicknameError(nicknameErrorMessage(error, lang));
    } finally {
      setSavingNickname(false);
    }
  }

  function deviceCountLabel(count: number): string {
    if (lang !== "ru") return count === 1 ? t.oneDevice : t.manyDevices;
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return t.oneDevice;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return t.fewDevices;
    return t.manyDevices;
  }

  function deviceName(item: DeviceItem): string {
    return item.device.nickname || item.device.name || t.deviceFallback;
  }

  function accessLabel(item: DeviceItem): string {
    if (item.subscription.active) return item.subscription.plan?.name || t.subscription;
    if (item.trial.active) return t.trial;
    if (item.promo?.active) return t.promo;
    return t.noPlan;
  }

  function accessEnd(item: DeviceItem): string {
    if (item.subscription.active) return formatDate(item.subscription.currentPeriodEnd, lang);
    if (item.trial.active) return formatDate(item.trial.expiresAt, lang);
    if (item.promo?.active) return t.noExpiry;
    return "—";
  }

  function requestBalance(item: DeviceItem): string {
    if (item.usage.remainingRequests === null || item.usage.requestLimit === null) return t.unlimited;
    return new Intl.NumberFormat(lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU").format(item.usage.remainingRequests);
  }

  function trialStatus(item: DeviceItem): string {
    if (!item.trial.exists) return t.trialNotStarted;
    return item.trial.active ? t.trialActive : t.trialEnded;
  }

  if (!ready) {
    return <main className="pg-dashboard" aria-busy="true" />;
  }

  return (
    <main className="pg-dashboard">
      <div className="pg-dashboard-grid" aria-hidden="true" />
      <div className="pg-dashboard-inner">
        <header className="pg-dashboard-head">
          <div>
<h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="pg-account-chip">
            <span className="pg-account-avatar" aria-hidden="true">
              {(user?.email || "P").slice(0, 1).toUpperCase()}
            </span>
            <span className="pg-account-copy">
              <strong>{user?.email || "—"}</strong>
              <small>{activeDevices.length} {deviceCountLabel(activeDevices.length)}</small>
            </span>
          </div>
        </header>

        <section className="pg-devices-section" aria-labelledby="dashboard-devices-title">
          <div className="pg-section-heading">
            <h2 id="dashboard-devices-title">{t.devices}</h2>
            {!loading ? <span>{activeDevices.length}</span> : null}
          </div>

          {errorText ? (
            <div className="pg-inline-state pg-inline-state-error" role="alert">
              <span>{errorText}</span>
              <button type="button" onClick={() => void loadData(true)}>{t.retry}</button>
            </div>
          ) : null}

          {loading ? (
            <div className="pg-device-list" aria-label="Loading">
              {[0, 1].map((index) => <div className="pg-device-card pg-device-skeleton" key={index} />)}
            </div>
          ) : null}

          {!loading && !errorText && activeDevices.length === 0 ? (
            <div className="pg-empty-devices">
              <DeviceGlyph />
              <h3>{t.noDevices}</h3>
              <Link href="/pair" className="pg-button pg-button-primary">{t.pairDevice}</Link>
            </div>
          ) : null}

          {!loading && activeDevices.length > 0 ? (
            <div className="pg-device-list">
              {activeDevices.map((item, index) => {
                const limit = item.usage.requestLimit;
                const remaining = item.usage.remainingRequests;
                const progress = limit && limit > 0 && remaining !== null
                  ? Math.max(0, Math.min(100, (remaining / limit) * 100))
                  : 100;

                return (
                  <article className="pg-device-card" key={item.device.id} style={{ "--device-delay": `${120 + index * 65}ms` } as React.CSSProperties}>
                    <div className="pg-device-card-main">
                      <DeviceGlyph />
                      <div className="pg-device-card-identity">
                        <div className="pg-device-card-title-line">
                          <h3>{deviceName(item)}</h3>
                          <button
                            type="button"
                            className="pg-device-action"
                            aria-label={t.editNickname}
                            title={t.editNickname}
                            onClick={() => openRename(item)}
                          >
                            <PencilIcon />
                          </button>
                        </div>
                        <div className="pg-device-uid">UID {item.device.uid}</div>
                      </div>
                    </div>

                    <div className={`pg-status-pill ${item.status.hasAccess ? "is-active" : "is-inactive"}`}>
                      <span />
                      {item.status.hasAccess ? t.active : t.inactive}
                    </div>

                    <div className="pg-device-metrics">
                      <div className="pg-device-metric pg-device-balance">
                        <span>{t.remaining}</span>
                        <strong>{requestBalance(item)}</strong>
                        {requestBalance(item) !== t.unlimited ? <small>{t.requests}</small> : null}
                      </div>

                      <div className="pg-device-metric">
                        <span>{t.plan}</span>
                        <strong>{accessLabel(item)}</strong>
                        <small>{accessEnd(item) !== "—" ? `${t.validUntil} ${accessEnd(item)}` : "—"}</small>
                      </div>
                    </div>

                    <div className="pg-device-progress" aria-hidden="true">
                      <span style={{ width: `${progress}%` }} />
                    </div>

                    <button
                      type="button"
                      className="pg-device-info"
                      aria-label={t.info}
                      title={t.info}
                      onClick={() => setDetailsDevice(item)}
                    >
                      <InfoIcon />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>

      {detailsDevice ? (
        <div className="pg-modal-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailsDevice(null);
        }}>
          <section className="pg-modal pg-device-details-modal" role="dialog" aria-modal="true" aria-labelledby="device-details-title">
            <div className="pg-modal-head">
              <div>
                <div className="pg-modal-kicker">{t.deviceDetails}</div>
                <h2 id="device-details-title">{deviceName(detailsDevice)}</h2>
                <p>UID {detailsDevice.device.uid}</p>
              </div>
              <button type="button" className="pg-modal-close" aria-label={t.close} onClick={() => setDetailsDevice(null)}>
                <CloseIcon />
              </button>
            </div>

            <div className="pg-detail-sections">
              <section className="pg-detail-section">
                <h3>{t.status}</h3>
                <dl>
                  <DetailRow label={t.nickname} value={detailsDevice.device.nickname || "—"} />
                  <DetailRow label={t.uid} value={detailsDevice.device.uid} mono />
                  <DetailRow label={t.pairing} value={detailsDevice.status.isPaired ? t.paired : t.notPaired} />
                  <DetailRow label={t.status} value={detailsDevice.status.hasAccess ? t.active : t.inactive} />
                  <DetailRow label={t.created} value={formatDateTime(detailsDevice.device.createdAt, lang)} />
                </dl>
              </section>

              <section className="pg-detail-section">
                <h3>{t.trial}</h3>
                <dl>
                  <DetailRow label={t.status} value={trialStatus(detailsDevice)} />
                  <DetailRow label={t.period} value={`${formatDateTime(detailsDevice.trial.startedAt, lang)} — ${formatDateTime(detailsDevice.trial.expiresAt, lang)}`} />
                </dl>
              </section>

              <section className="pg-detail-section">
                <h3>{t.subscription}</h3>
                <dl>
                  <DetailRow label={t.status} value={detailsDevice.subscription.active ? t.subscriptionActive : t.subscriptionInactive} />
                  <DetailRow label={t.plan} value={detailsDevice.subscription.plan?.name || "—"} />
                  <DetailRow label={t.subscriptionStatus} value={detailsDevice.subscription.status || "—"} />
                  <DetailRow label={t.period} value={`${formatDateTime(detailsDevice.subscription.currentPeriodStart, lang)} — ${formatDateTime(detailsDevice.subscription.currentPeriodEnd, lang)}`} />
                </dl>
              </section>

              <section className="pg-detail-section">
                <h3>{t.connect}</h3>
                <dl>
                  <DetailRow label={t.status} value={detailsDevice.connect?.active ? t.connectActive : t.connectInactive} />
                  <DetailRow label={t.source} value={detailsDevice.connect?.source || "—"} />
                </dl>
              </section>

              <section className="pg-detail-section">
                <h3>{t.usage}</h3>
                <dl>
                  <DetailRow label={t.limit} value={detailsDevice.usage.requestLimit ?? t.unlimited} />
                  <DetailRow label={t.used} value={detailsDevice.usage.usedRequests} />
                  <DetailRow label={t.remaining} value={detailsDevice.usage.remainingRequests ?? t.unlimited} />
                  <DetailRow label={t.period} value={`${formatDateTime(detailsDevice.usage.periodStartedAt, lang)} — ${formatDateTime(detailsDevice.usage.periodEndsAt, lang)}`} />
                </dl>
              </section>

              {detailsDevice.promo && (detailsDevice.promo.active || detailsDevice.promo.grantsCount > 0) ? (
                <section className="pg-detail-section">
                  <h3>{t.promo}</h3>
                  <dl>
                    <DetailRow label={t.status} value={detailsDevice.promo.active ? t.active : t.inactive} />
                    <DetailRow label={t.promoTotal} value={detailsDevice.promo.totalRequests} />
                    <DetailRow label={t.promoUsed} value={detailsDevice.promo.usedRequests} />
                    <DetailRow label={t.promoRemaining} value={detailsDevice.promo.remainingRequests} />
                    <DetailRow label={t.promoCodes} value={detailsDevice.promo.grantsCount} />
                  </dl>
                </section>
              ) : null}

              <details className="pg-technical-details">
                <summary>{t.technical}</summary>
                <dl>
                  <DetailRow label={t.internalDeviceId} value={detailsDevice.device.id} mono />
                  <DetailRow label={t.ownerId} value={detailsDevice.device.ownerId || "—"} mono />
                  <DetailRow label={t.disabled} value={detailsDevice.device.disabled ? t.yes : t.no} />
                  <DetailRow label={t.accessScope} value={detailsDevice.usage.scope || "—"} mono />
                  <DetailRow label={t.scopeReference} value={detailsDevice.usage.scopeRefId || "—"} mono />
                </dl>
              </details>
            </div>
          </section>
        </div>
      ) : null}

      {renameDevice ? (
        <div className="pg-modal-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRenameDevice(null);
        }}>
          <section className="pg-modal pg-rename-modal" role="dialog" aria-modal="true" aria-labelledby="rename-device-title">
            <div className="pg-modal-head">
              <div>
                <div className="pg-modal-kicker">{renameDevice.device.uid}</div>
                <h2 id="rename-device-title">{t.nickname}</h2>
                <p>{t.nicknameHelp}</p>
              </div>
              <button type="button" className="pg-modal-close" aria-label={t.close} onClick={() => setRenameDevice(null)}>
                <CloseIcon />
              </button>
            </div>

            <label className="pg-field">
              <span>{t.nickname}</span>
              <input
                autoFocus
                value={nicknameValue}
                maxLength={DEVICE_NICKNAME_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={t.nicknamePlaceholder}
                onChange={(event) => {
                  setNicknameValue(sanitizeDeviceNickname(event.target.value));
                  setNicknameError("");
                  setNicknameMessage("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void saveNickname();
                }}
              />
              <small>{nicknameValue.length}/{DEVICE_NICKNAME_MAX_LENGTH}</small>
            </label>

            {nicknameMessage ? <div className="pg-form-message is-success" role="status">{nicknameMessage}</div> : null}
            {nicknameError ? <div className="pg-form-message is-error" role="alert">{nicknameError}</div> : null}

            <div className="pg-modal-actions">
              <button type="button" className="pg-button pg-button-secondary" onClick={() => setRenameDevice(null)}>{t.close}</button>
              <button
                type="button"
                className="pg-button pg-button-primary"
                disabled={savingNickname || !nicknameValue.trim()}
                onClick={() => void saveNickname()}
              >
                {savingNickname ? t.saving : t.save}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
