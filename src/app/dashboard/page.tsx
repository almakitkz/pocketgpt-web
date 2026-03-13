"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

type Lang = "ru" | "en";

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  requestLimit: number | null;
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
};

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
    plan: Plan | null;
    status: string | null;
    trialEnd: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd: string | null;
  };
  usage: UsageState;
};

type PaymentItem = {
  id: string;
  provider: string;
  status: string;
  amountKzt: number;
  currency: string;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  subscriptionId: string | null;
  note: string | null;
  device: {
    id: string;
    uid: string;
    name: string;
  } | null;
  plan: Plan | null;
  createdAt: string | null;
  updatedAt: string | null;
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
    paymentHistory: "История оплат",
    noPayments: "История оплат пока пуста.",
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
    requestLimit: "Лимит",
    usedRequests: "Использовано",
    remainingRequests: "Осталось",
    period: "Период",
    days: "дней",
    requests: "запросов",
    amount: "Сумма",
    provider: "Провайдер",
    paidAt: "Оплачено",
    currentPlan: "Текущий план",
    openBilling: "Открыть billing",
    unlimited: "без лимита",
  },
  en: {
    loading: "Loading...",
    dashboard: "Dashboard",
    subtitle: "Manage your PocketGPT devices.",
    email: "Email",
    userId: "User ID",
    myDevices: "My devices",
    noDevices: "You do not have any paired devices yet.",
    paymentHistory: "Payment history",
    noPayments: "Payment history is empty.",
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
    requestLimit: "Request limit",
    usedRequests: "Used",
    remainingRequests: "Remaining",
    period: "Period",
    days: "days",
    requests: "requests",
    amount: "Amount",
    provider: "Provider",
    paidAt: "Paid at",
    currentPlan: "Current plan",
    openBilling: "Open billing",
    unlimited: "unlimited",
  },
};

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const v = localStorage.getItem("site_lang") || localStorage.getItem("lang") || "ru";
  return v === "en" ? "en" : "ru";
}

function formatDate(value: string | null, lang: Lang): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
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

function formatRequestLimit(value: number | null | undefined, lang: Lang): string {
  const t = TEXT[lang];
  if (value === null || value === undefined || value <= 0) return t.unlimited;
  return `${value} ${t.requests}`;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
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

    async function loadData() {
      try {
        const [devicesData, paymentsData] = await Promise.all([
          apiFetch("/v1/user/devices", { method: "GET" }),
          apiFetch("/v1/billing/history?limit=10", { method: "GET" }),
        ]);

        setDevices(devicesData.devices || []);
        setPayments(paymentsData.payments || []);
      } catch (err) {
        setErrorText(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
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

          <a
            href="/billing"
            style={{
              display: "inline-block",
              marginTop: 16,
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            {t.openBilling}
          </a>
        </div>

        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
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
                      {t.created}: {formatDate(item.device.createdAt, lang)}
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
                          ? `${t.activeUntil} ${formatDate(item.trial.expiresAt, lang)}`
                          : `${t.expiredAt} ${formatDate(item.trial.expiresAt, lang)}`
                        : t.notStarted}
                    </div>

                    <div>
                      {t.subscription}:{" "}
                      {item.subscription.active
                        ? `${item.subscription.plan?.name || "plan"} ${t.until} ${formatDate(
                            item.subscription.currentPeriodEnd,
                            lang
                          )}`
                        : item.subscription.plan
                        ? `${item.subscription.plan.name} ${t.inactiveSub}`
                        : t.inactiveSub}
                    </div>

                    <div>
                      {t.currentPlan}: {item.subscription.plan?.name || "—"}
                    </div>

                    <div>
                      {t.requestLimit}: {formatRequestLimit(item.usage.requestLimit, lang)}
                    </div>
                    <div>
                      {t.usedRequests}: {item.usage.usedRequests}
                    </div>
                    <div>
                      {t.remainingRequests}: {item.usage.remainingRequests ?? "—"}
                    </div>
                    <div>
                      {t.period}: {formatDate(item.usage.periodStartedAt, lang)} — {formatDate(item.usage.periodEndsAt, lang)}
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

        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>{t.paymentHistory}</h2>

          {loading ? <div style={{ color: "#a1a1aa" }}>{t.loading}</div> : null}

          {!loading && !errorText && payments.length === 0 ? (
            <div style={{ color: "#a1a1aa" }}>{t.noPayments}</div>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {payment.plan?.name || "Plan"} — {payment.amountKzt} {payment.currency}
                  </div>
                  <div style={{ color: "#86efac" }}>{payment.status}</div>
                </div>
                <div style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
                  <div>
                    {t.provider}: {payment.provider}
                  </div>
                  <div>
                    {t.amount}: {payment.amountKzt} {payment.currency}
                  </div>
                  <div>
                    {t.paidAt}: {formatDate(payment.createdAt, lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
