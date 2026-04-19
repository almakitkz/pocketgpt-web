"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

type Lang = "ru" | "en";

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  requestLimit: number | null;
  createdAt: string | null;
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
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
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
  plan: {
    id: string;
    name: string;
    priceKzt: number;
    durationDays: number;
    requestLimit: number | null;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CreateOrderResponse = {
  ok: true;
  orderId: string;
  approveUrl?: string | null;
  currency: string;
  amountUsd: string;
  device: {
    id: string;
    uid: string;
    name: string;
  };
  plan: Plan;
};

type CaptureOrderResponse = {
  ok: true;
  device: {
    id: string;
    uid: string;
    name: string;
    ownerId: string | null;
    disabled: boolean;
    createdAt: string | null;
  };
  subscription: {
    id: string;
    deviceId: string;
    planId: string;
    plan: Plan | null;
    status: string;
    trialEnd: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  paypal: {
    orderId: string;
    captureId: string;
    status: string;
    idempotentReplay?: boolean;
  };
  access: {
    hasAccess: boolean;
    trial: DeviceItem["trial"];
    subscription: DeviceItem["subscription"];
    usage: UsageState;
  };
};

type ApiErrorPayload = {
  ok?: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://pocketgpt-server.onrender.com";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

const TEXT = {
  ru: {
    title: "Billing",
    subtitle:
      "Выбери устройство и один из тарифов. Перед оплатой нужно согласиться с условиями оплаты и политикой возврата.",
    authRequired: "Нужна авторизация. Войди в аккаунт заново.",
    loading: "Загрузка...",
    loadingDevices: "Загружаем устройства...",
    loadingPlans: "Загружаем планы...",
    loadingPayments: "Загружаем историю оплат...",
    noDevices: "У тебя пока нет устройств.",
    noPlans: "Планы пока не найдены.",
    noPayments: "История оплат пока пуста.",
    myDevices: "Твои устройства",
    plans: "Доступные планы",
    selectedDevice: "Выбранное устройство",
    selectedPlan: "Выбранный план",
    paymentHistory: "История оплат",
    selected: "Выбрано",
    chooseDevice: "Сначала выбери устройство.",
    choosePlan: "Теперь выбери план.",
    paypalReady: "PayPal готов",
    paypalNotReady:
      "PayPal Client ID не найден. Проверь NEXT_PUBLIC_PAYPAL_CLIENT_ID в Vercel.",
    paymentHint:
      "После выбора устройства и плана можно оплатить через PayPal. Доступ активируется автоматически после успешной оплаты.",
    creatingOrder: "Создаём заказ PayPal...",
    capturingOrder: "Подтверждаем оплату...",
    paymentSuccess: "Оплата прошла успешно. Подписка активирована.",
    paymentCancelled: "Оплата отменена.",
    paymentError: "Не удалось начать оплату.",
    refresh: "Обновить",
    paired: "Привязка",
    accessNow: "Доступ сейчас",
    trial: "Триал",
    subscription: "Подписка",
    usage: "Лимит",
    used: "Использовано",
    remaining: "Осталось",
    active: "Активно",
    inactive: "Неактивно",
    yes: "Да",
    no: "Нет",
    notStarted: "не начат",
    expiredAt: "истёк",
    activeUntil: "активен до",
    price: "Цена",
    duration: "Длительность",
    requests: "запросов",
    days: "дней",
    currentPlan: "Текущий план",
    currentUsage: "Текущий расход",
    status: "Статус",
    provider: "Провайдер",
    amount: "Сумма",
    device: "Устройство",
    createdAt: "Дата",
    unlimited: "без лимита",
    termsLabelStart: "Я согласен(на) с ",
    termsLabelMiddle: "условиями оплаты",
    termsLabelAnd: " и ",
    termsLabelEnd: "политикой возврата",
    termsRequired:
      "Чтобы оплатить, нужно согласиться с условиями оплаты и политикой возврата.",
    digitalService: "Цифровой сервис",
    noInstantRefund: "Без мгновенного возврата",
  },
  en: {
    title: "Billing",
    subtitle:
      "Choose a device and a plan. Before payment, you must agree to the payment terms and refund policy.",
    authRequired: "Authorization required. Please sign in again.",
    loading: "Loading...",
    loadingDevices: "Loading devices...",
    loadingPlans: "Loading plans...",
    loadingPayments: "Loading payment history...",
    noDevices: "You do not have any devices yet.",
    noPlans: "No plans found.",
    noPayments: "Payment history is empty.",
    myDevices: "Your devices",
    plans: "Available plans",
    selectedDevice: "Selected device",
    selectedPlan: "Selected plan",
    paymentHistory: "Payment history",
    selected: "Selected",
    chooseDevice: "First choose a device.",
    choosePlan: "Now choose a plan.",
    paypalReady: "PayPal is ready",
    paypalNotReady:
      "PayPal Client ID is missing. Check NEXT_PUBLIC_PAYPAL_CLIENT_ID in Vercel.",
    paymentHint:
      "After selecting a device and a plan, you can pay with PayPal. Access is activated automatically after successful payment.",
    creatingOrder: "Creating PayPal order...",
    capturingOrder: "Capturing payment...",
    paymentSuccess: "Payment completed successfully. Subscription activated.",
    paymentCancelled: "Payment was cancelled.",
    paymentError: "Failed to start payment.",
    refresh: "Refresh",
    paired: "Pairing",
    accessNow: "Access now",
    trial: "Trial",
    subscription: "Subscription",
    usage: "Usage",
    used: "Used",
    remaining: "Remaining",
    active: "Active",
    inactive: "Inactive",
    yes: "Yes",
    no: "No",
    notStarted: "not started",
    expiredAt: "expired",
    activeUntil: "active until",
    price: "Price",
    duration: "Duration",
    requests: "requests",
    days: "days",
    currentPlan: "Current plan",
    currentUsage: "Current usage",
    status: "Status",
    provider: "Provider",
    amount: "Amount",
    device: "Device",
    createdAt: "Date",
    unlimited: "unlimited",
    termsLabelStart: "I agree to the ",
    termsLabelMiddle: "payment terms",
    termsLabelAnd: " and ",
    termsLabelEnd: "refund policy",
    termsRequired:
      "You must agree to the payment terms and refund policy before paying.",
    digitalService: "Digital service",
    noInstantRefund: "No instant refund",
  },
} as const;

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  const keys = [
    "authToken",
    "token",
    "jwt",
    "pocketgpt_token",
    "pocketgpt_auth_token",
  ];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

function formatDate(value: string | null, lang: Lang) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildErrorMessage(fallback: string, error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const payload = error as ApiErrorPayload | null;
  return payload?.error?.message || fallback;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw data || new Error(`Request failed: ${response.status}`);
  }
  return data as T;
}

export default function BillingPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>("ru");
  const [token, setToken] = useState("");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [agreed, setAgreed] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    setMounted(true);
    setLang(getStoredLang());
    setToken(getStoredToken());

    const updateLang = () => setLang(getStoredLang());
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  const loadDevices = useCallback(async (authToken: string) => {
    setLoadingDevices(true);
    try {
      const data = await apiRequest<{ ok: true; devices: DeviceItem[] }>(
        "/v1/user/devices",
        { method: "GET" },
        authToken
      );
      setDevices(data.devices || []);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const data = await apiRequest<{ ok: true; plans: Plan[] }>("/v1/plans", {
        method: "GET",
      });
      const normalized = (data.plans || []).sort((a, b) => a.priceKzt - b.priceKzt);
      setPlans(normalized);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadPayments = useCallback(async (authToken: string, deviceId?: string) => {
    setLoadingPayments(true);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "20");
      if (deviceId) qs.set("deviceId", deviceId);

      const data = await apiRequest<{ ok: true; payments: PaymentItem[] }>(
        `/v1/billing/history?${qs.toString()}`,
        { method: "GET" },
        authToken
      );
      setPayments(data.payments || []);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      setLoadingDevices(false);
      setLoadingPlans(false);
      setLoadingPayments(false);
      return;
    }

    void Promise.all([loadDevices(token), loadPlans(), loadPayments(token)]);
  }, [mounted, token, loadDevices, loadPlans, loadPayments]);

  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].device.id);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    if (!token || !selectedDeviceId) return;
    void loadPayments(token, selectedDeviceId);
  }, [selectedDeviceId, token, loadPayments]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.device.id === selectedDeviceId) || null,
    [devices, selectedDeviceId]
  );

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const paypalEnabled =
    !!PAYPAL_CLIENT_ID && !!token && !!selectedDevice && !!selectedPlan && agreed;

  const refreshAll = useCallback(async () => {
    if (!token) return;
    await Promise.all([
      loadDevices(token),
      loadPlans(),
      loadPayments(token, selectedDeviceId || undefined),
    ]);
  }, [token, loadDevices, loadPlans, loadPayments, selectedDeviceId]);

  const trialText = (item: DeviceItem) => {
    if (!item.trial.exists) return t.notStarted;
    if (item.trial.active && item.trial.expiresAt) {
      return `${t.activeUntil} ${formatDate(item.trial.expiresAt, lang)}`;
    }
    if (item.trial.expiresAt) {
      return `${t.expiredAt} ${formatDate(item.trial.expiresAt, lang)}`;
    }
    return t.notStarted;
  };

  const subscriptionText = (item: DeviceItem) => {
    if (item.subscription.active && item.subscription.currentPeriodEnd) {
      return `${t.activeUntil} ${formatDate(item.subscription.currentPeriodEnd, lang)}`;
    }
    return t.inactive;
  };

  if (!mounted) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
          {TEXT.ru.loading}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
              {t.digitalService}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
              {t.noInstantRefund}
            </span>
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="rounded-full border border-blue-700/40 bg-blue-600/10 px-4 py-2 text-sm text-white transition hover:bg-blue-600/20"
            >
              {t.refresh}
            </button>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm sm:text-base ${
              messageType === "success"
                ? "border-green-700/40 bg-green-950/30 text-green-300"
                : messageType === "error"
                ? "border-red-700/40 bg-red-950/30 text-red-300"
                : "border-blue-700/40 bg-blue-950/30 text-blue-300"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
              <div className="mb-4 text-xl font-semibold sm:text-2xl">{t.myDevices}</div>

              {loadingDevices ? (
                <div className="text-white/70">{t.loadingDevices}</div>
              ) : devices.length === 0 ? (
                <div className="text-white/70">{t.noDevices}</div>
              ) : (
                <div className="space-y-4">
                  {devices.map((item) => {
                    const selected = item.device.id === selectedDeviceId;
                    return (
                      <button
                        key={item.device.id}
                        type="button"
                        onClick={() => setSelectedDeviceId(item.device.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-600/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-semibold sm:text-lg">
                              {item.device.name}
                            </div>
                            <div className="break-anywhere mt-1 text-xs text-white/45 sm:text-sm">
                              {item.device.uid}
                            </div>
                          </div>
                          {selected ? (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium">
                              {t.selected}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/75 sm:grid-cols-4 sm:text-sm">
                          <div>
                            <div className="text-white/45">{t.paired}</div>
                            <div>{item.status.isPaired ? t.yes : t.no}</div>
                          </div>
                          <div>
                            <div className="text-white/45">{t.accessNow}</div>
                            <div>{item.status.hasAccess ? t.active : t.inactive}</div>
                          </div>
                          <div>
                            <div className="text-white/45">{t.trial}</div>
                            <div>{trialText(item)}</div>
                          </div>
                          <div>
                            <div className="text-white/45">{t.subscription}</div>
                            <div>{subscriptionText(item)}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
              <div className="mb-4 text-xl font-semibold sm:text-2xl">{t.paymentHistory}</div>

              {loadingPayments ? (
                <div className="text-white/70">{t.loadingPayments}</div>
              ) : payments.length === 0 ? (
                <div className="text-white/70">{t.noPayments}</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium sm:text-base">
                          {item.plan?.name || "—"} · {item.amountKzt} KZT
                        </div>
                        <div className="text-xs text-white/50 sm:text-sm">
                          {formatDate(item.createdAt, lang)}
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-white/65 sm:grid-cols-3 sm:text-sm">
                        <div>
                          <span className="text-white/45">{t.provider}: </span>
                          {item.provider}
                        </div>
                        <div className="break-anywhere">
                          <span className="text-white/45">{t.device}: </span>
                          {item.device?.name || "—"}
                        </div>
                        <div>
                          <span className="text-white/45">{t.status}: </span>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
              <div className="mb-4 text-xl font-semibold sm:text-2xl">{t.plans}</div>

              {loadingPlans ? (
                <div className="text-white/70">{t.loadingPlans}</div>
              ) : plans.length === 0 ? (
                <div className="text-white/70">{t.noPlans}</div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const selected = plan.id === selectedPlanId;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-600/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold">{plan.name}</div>
                            <div className="mt-1 text-sm text-white/55">
                              {plan.durationDays} {t.days}
                            </div>
                          </div>
                          {selected ? (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium">
                              {t.selected}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-4 text-2xl font-semibold">{plan.priceKzt} KZT</div>
                        <div className="mt-2 text-sm text-white/65">
                          {plan.requestLimit === null
                            ? t.unlimited
                            : `${plan.requestLimit} ${t.requests}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
              <div className="mb-4 text-xl font-semibold sm:text-2xl">{t.title}</div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm uppercase tracking-[0.2em] text-white/35">
                  {t.selectedDevice}
                </div>
                <div className="break-anywhere text-sm text-white/85 sm:text-base">
                  {selectedDevice
                    ? `${selectedDevice.device.name} (${selectedDevice.device.uid})`
                    : t.chooseDevice}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm uppercase tracking-[0.2em] text-white/35">
                  {t.selectedPlan}
                </div>
                <div className="break-anywhere text-sm text-white/85 sm:text-base">
                  {selectedPlan
                    ? `${selectedPlan.name} — ${selectedPlan.priceKzt} KZT / ${selectedPlan.durationDays} ${t.days}`
                    : t.choosePlan}
                </div>

                {selectedDevice ? (
                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    <div className="break-anywhere">
                      {t.currentPlan}: {selectedDevice.subscription.plan?.name || t.inactive}
                    </div>
                    <div>
                      {t.currentUsage}: {selectedDevice.usage.usedRequests} /{" "}
                      {selectedDevice.usage.requestLimit ?? "∞"}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-700/40 bg-amber-950/30 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-blue-600"
                  />
                  <span className="text-sm leading-6 text-white/85">
                    {t.termsLabelStart}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
                    >
                      {t.termsLabelMiddle}
                    </a>
                    {t.termsLabelAnd}
                    <a
                      href="/refund-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
                    >
                      {t.termsLabelEnd}
                    </a>
                  </span>
                </label>

                {!agreed ? (
                  <div className="mt-3 text-xs text-amber-200/90">{t.termsRequired}</div>
                ) : null}
              </div>

              <div className="mt-4 text-sm text-white/70 sm:text-base">{t.paymentHint}</div>

              {!PAYPAL_CLIENT_ID ? (
                <div className="mt-4 break-anywhere rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-sm text-red-300 sm:text-base">
                  {t.paypalNotReady}
                </div>
              ) : (
                <div className="mt-4 min-w-0">
                  <div className="mb-3 text-sm text-green-400 sm:text-base">{t.paypalReady}</div>

                  <PayPalScriptProvider
                    options={{
                      clientId: PAYPAL_CLIENT_ID,
                      intent: "capture",
                      currency: "USD",
                      components: "buttons",
                    }}
                  >
                    <div className="min-w-0">
                      <PayPalButtons
                        key={`${selectedDeviceId}-${selectedPlanId}-${agreed ? "agree" : "noagree"}`}
                        style={{
                          layout: "vertical",
                          shape: "rect",
                          label: "paypal",
                        }}
                        disabled={!paypalEnabled || isCapturing}
                        forceReRender={[selectedDeviceId, selectedPlanId, agreed]}
                        createOrder={async () => {
                          if (!agreed) {
                            const msg = t.termsRequired;
                            setMessageType("error");
                            setMessage(msg);
                            throw new Error(msg);
                          }

                          if (!token || !selectedDevice || !selectedPlan) {
                            const msg = !token ? t.authRequired : t.paymentError;
                            setMessageType("error");
                            setMessage(msg);
                            throw new Error(msg);
                          }

                          setMessageType("idle");
                          setMessage(t.creatingOrder);

                          try {
                            const data = await apiRequest<CreateOrderResponse>(
                              "/v1/billing/create-order",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  deviceId: selectedDevice.device.id,
                                  planId: selectedPlan.id,
                                  lang,
                                }),
                              },
                              token
                            );

                            if (!data.orderId) {
                              throw new Error("Missing orderId");
                            }

                            return data.orderId;
                          } catch (error) {
                            const msg = buildErrorMessage(t.paymentError, error);
                            setMessageType("error");
                            setMessage(msg);
                            throw new Error(msg);
                          }
                        }}
                        onApprove={async (data) => {
                          if (!token || !selectedDevice || !selectedPlan || !data.orderID) {
                            const msg = t.paymentError;
                            setMessageType("error");
                            setMessage(msg);
                            throw new Error(msg);
                          }

                          setIsCapturing(true);
                          setMessageType("idle");
                          setMessage(t.capturingOrder);

                          try {
                            await apiRequest<CaptureOrderResponse>(
                              "/v1/billing/capture-order",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  orderId: data.orderID,
                                  deviceId: selectedDevice.device.id,
                                  planId: selectedPlan.id,
                                  lang,
                                }),
                              },
                              token
                            );

                            await Promise.all([
                              loadDevices(token),
                              loadPayments(token, selectedDevice.device.id),
                            ]);

                            setMessageType("success");
                            setMessage(t.paymentSuccess);
                          } catch (error) {
                            const msg = buildErrorMessage(t.paymentError, error);
                            setMessageType("error");
                            setMessage(msg);
                            throw new Error(msg);
                          } finally {
                            setIsCapturing(false);
                          }
                        }}
                        onCancel={() => {
                          setIsCapturing(false);
                          setMessageType("error");
                          setMessage(t.paymentCancelled);
                        }}
                        onError={(error) => {
                          console.error("PayPal button error:", error);
                          setIsCapturing(false);
                          setMessageType("error");
                          setMessage(t.paymentError);
                        }}
                      />
                    </div>
                  </PayPalScriptProvider>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
