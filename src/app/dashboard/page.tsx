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
} as const;

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
      <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-[1100px]">{t.loading}</div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-5 rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
          <h1 className="mb-2 text-3xl font-bold">{t.dashboard}</h1>
          <p className="mt-0 text-sm text-[#a1a1aa] sm:text-base">{t.subtitle}</p>

          <div className="mt-4 space-y-2 text-sm leading-7 text-[#d4d4d8] sm:text-base">
            <div className="break-anywhere">
              {t.email}: {user?.email || "—"}
            </div>
            <div className="break-anywhere">
              {t.userId}: {user?.id || "—"}
            </div>
          </div>

          <a
            href="/billing"
            className="mt-4 inline-flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white no-underline hover:bg-blue-500 sm:w-auto"
          >
            {t.openBilling}
          </a>
        </div>

        <div className="mb-5 rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
          <h2 className="mb-3 text-2xl font-semibold">{t.myDevices}</h2>

          {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}

          {errorText ? (
            <div className="break-anywhere rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
              {errorText}
            </div>
          ) : null}

          {!loading && !errorText && devices.length === 0 ? (
            <div className="text-[#a1a1aa]">{t.noDevices}</div>
          ) : null}

          <div className="mt-4 grid gap-4">
            {devices.map((item) => {
              const badge = getAccessBadge(item.status.hasAccess, lang);

              return (
                <div
                  key={item.device.id}
                  className="min-w-0 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 sm:p-[18px]"
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="mb-2 break-anywhere text-xl font-semibold">
                        {item.device.name}
                      </h3>
                      <div className="break-anywhere text-sm text-[#94a3b8]">
                        UID: {item.device.uid}
                      </div>
                    </div>

                    <div
                      className="w-fit rounded-full px-3 py-2 text-sm font-semibold"
                      style={{
                        background: badge.background,
                        color: badge.color,
                        border: badge.border,
                      }}
                    >
                      {badge.text}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm leading-7 text-[#d1d5db] sm:text-base">
                    <div className="break-anywhere">
                      {t.deviceId}: {item.device.id}
                    </div>
                    <div>
                      {t.paired}: {item.status.isPaired ? t.yes : t.no}
                    </div>
                    <div>
                      {t.created}: {formatDate(item.device.createdAt, lang)}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#1f2937] pt-4 text-sm leading-7 text-[#d1d5db] sm:text-base">
                    <div className="break-anywhere">
                      {t.trial}:{" "}
                      {item.trial.exists
                        ? item.trial.active
                          ? `${t.activeUntil} ${formatDate(item.trial.expiresAt, lang)}`
                          : `${t.expiredAt} ${formatDate(item.trial.expiresAt, lang)}`
                        : t.notStarted}
                    </div>

                    <div className="break-anywhere">
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

                    <div className="break-anywhere">
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
                    <div className="break-anywhere">
                      {t.period}: {formatDate(item.usage.periodStartedAt, lang)} —{" "}
                      {formatDate(item.usage.periodEndsAt, lang)}
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

        <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
          <h2 className="mb-3 text-2xl font-semibold">{t.paymentHistory}</h2>

          {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}

          {!loading && !errorText && payments.length === 0 ? (
            <div className="text-[#a1a1aa]">{t.noPayments}</div>
          ) : null}

          <div className="grid gap-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="min-w-0 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4"
              >
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="break-anywhere font-bold">
                    {payment.plan?.name || "Plan"} — {payment.amountKzt} {payment.currency}
                  </div>
                  <div className="break-anywhere text-[#86efac]">{payment.status}</div>
                </div>

                <div className="space-y-1 text-sm leading-7 text-[#cbd5e1] sm:text-base">
                  <div className="break-anywhere">
                    {t.provider}: {payment.provider}
                  </div>
                  <div>
                    {t.amount}: {payment.amountKzt} {payment.currency}
                  </div>
                  <div className="break-anywhere">
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