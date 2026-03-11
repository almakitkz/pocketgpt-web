"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

type Lang = "ru" | "en";

type DeviceItem = {
  device: {
    id: string;
    uid: string;
    name: string;
    ownerId: string;
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
    plan: {
      id: string;
      name: string;
      priceKzt: number;
      durationDays: number;
      createdAt: string | null;
    } | null;
    status: string | null;
    trialEnd: string | null;
    currentPeriodEnd: string | null;
  };
};

type LocalUser = {
  id: string;
  email: string;
};

const TEXT = {
  ru: {
    loading: "Загрузка...",
    dashboard: "Кабинет",
    subtitle: "Управляй своими устройствами PocketGPT.",
    email: "Email",
    userId: "User ID",
    myDevices: "Мои устройства",
    noDevices: "У тебя пока нет привязанных устройств.",
    active: "Активно",
    inactive: "Неактивно",
    deviceId: "Device ID",
    paired: "Привязано",
    yes: "Да",
    no: "Нет",
    created: "Создано",
    trial: "Триал",
    activeUntil: "активен до",
    expiredAt: "истёк",
    notStarted: "не начат",
    subscription: "Подписка",
    inactiveSub: "неактивна",
    until: "до",
    planPrice: "Цена плана",
    days: "дней",
  },
  en: {
    loading: "Loading...",
    dashboard: "Dashboard",
    subtitle: "Manage your PocketGPT devices.",
    email: "Email",
    userId: "User ID",
    myDevices: "My devices",
    noDevices: "You do not have any paired devices yet.",
    active: "Active",
    inactive: "Inactive",
    deviceId: "Device ID",
    paired: "Paired",
    yes: "Yes",
    no: "No",
    created: "Created",
    trial: "Trial",
    activeUntil: "active until",
    expiredAt: "expired at",
    notStarted: "not started",
    subscription: "Subscription",
    inactiveSub: "inactive",
    until: "until",
    planPrice: "Plan price",
    days: "days",
  },
};

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getAccessBadge(hasAccess: boolean, lang: Lang) {
  const t = TEXT[lang];

  return {
    text: hasAccess ? t.active : t.inactive,
    background: hasAccess ? "#0f2f1d" : "#3a1a1a",
    color: hasAccess ? "#86efac" : "#fca5a5",
    border: hasAccess ? "1px solid #14532d" : "1px solid #7f1d1d",
  };
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);

    return () => {
      window.removeEventListener("site-language-change", updateLang);
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    const localUser = getUser();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUser(localUser);
    setReady(true);

    async function loadDevices() {
      try {
        const data = await apiFetch("/v1/user/devices", {
          method: "GET",
        });

        setDevices(data.devices || []);
      } catch (err) {
        setErrorText(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }

    void loadDevices();
  }, []);

  if (!ready) {
    return (
      <main
        style={{
          minHeight: "calc(100vh - 80px)",
          background: "#050816",
          color: "white",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>{t.loading}</div>
      </main>
    );
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
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{t.dashboard}</h1>
          <p style={{ color: "#a1a1aa", marginTop: 0 }}>{t.subtitle}</p>

          <div style={{ color: "#d4d4d8", marginTop: 12, lineHeight: 1.8 }}>
            <div>
              {t.email}: {user?.email || "—"}
            </div>
            <div>
              {t.userId}: {user?.id || "—"}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>{t.myDevices}</h2>

          {loading ? <div style={{ color: "#a1a1aa" }}>{t.loading}</div> : null}

          {errorText ? (
            <div
              style={{
                background: "#3f1d1d",
                color: "#fecaca",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #7f1d1d",
              }}
            >
              {errorText}
            </div>
          ) : null}

          {!loading && !errorText && devices.length === 0 ? (
            <div style={{ color: "#a1a1aa" }}>{t.noDevices}</div>
          ) : null}

          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {devices.map((item) => {
              const badge = getAccessBadge(item.status.hasAccess, lang);

              return (
                <div
                  key={item.device.id}
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.device.name}</h3>
                      <div style={{ color: "#94a3b8", fontSize: 14 }}>
                        UID: {item.device.uid}
                      </div>
                    </div>

                    <div
                      style={{
                        ...badge,
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {badge.text}
                    </div>
                  </div>

                  <div style={{ color: "#d1d5db", lineHeight: 1.8 }}>
                    <div>
                      {t.deviceId}: {item.device.id}
                    </div>
                    <div>
                      {t.paired}: {item.status.isPaired ? t.yes : t.no}
                    </div>
                    <div>
                      {t.created}: {formatDate(item.device.createdAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #1f2937",
                      color: "#d1d5db",
                      lineHeight: 1.8,
                    }}
                  >
                    <div>
                      {t.trial}:{" "}
                      {item.trial.exists
                        ? item.trial.active
                          ? `${t.activeUntil} ${formatDate(item.trial.expiresAt)}`
                          : `${t.expiredAt} ${formatDate(item.trial.expiresAt)}`
                        : t.notStarted}
                    </div>

                    <div>
                      {t.subscription}:{" "}
                      {item.subscription.active
                        ? `${item.subscription.plan?.name || "plan"} ${t.until} ${formatDate(
                            item.subscription.currentPeriodEnd
                          )}`
                        : item.subscription.plan
                        ? `${item.subscription.plan.name} ${t.inactiveSub}`
                        : t.inactiveSub}
                    </div>

                    {item.subscription.plan ? (
                      <div>
                        {t.planPrice}: {item.subscription.plan.priceKzt} KZT /{" "}
                        {item.subscription.plan.durationDays} {t.days}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}