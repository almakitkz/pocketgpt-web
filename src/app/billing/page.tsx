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
      "Выбери устройство и один из двух тарифов. После успешной оплаты backend автоматически активирует подписку.",
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
    paymentHistory: "История оплат",
    selected: "Выбрано",
    chooseDevice: "Сначала выбери устройство слева.",
    choosePlan: "Теперь выбери план справа.",
    paypalReady: "PayPal готов",
    paypalNotReady:
      "PayPal Client ID не найден. Проверь NEXT_PUBLIC_PAYPAL_CLIENT_ID в Vercel.",
    paymentHint: "Выбери план справа, затем оплати через PayPal.",
    creatingOrder: "Создаём заказ PayPal...",
    capturingOrder: "Подтверждаем оплату...",
    paymentSuccess: "Оплата прошла успешно. Подписка активирована.",
    paymentCancelled: "Оплата отменена.",
    paymentError: "Не удалось начать оплату.",
    refresh: "Обновить",
    paired: "Pairing",
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
    selectedDevice: "Выбранное устройство",
    selectedPlan: "Выбранный план",
    status: "Статус",
    automaticActivation: "Автоматическая активация",
    automaticActivationText:
      "После успешной оплаты backend автоматически создаст DeviceSubscription и устройство сразу получит доступ.",
    processing: "Идёт обработка...",
    payFor: "Оплата для",
    planIncludes: "В тариф входит",
    currentPlan: "Текущий план",
    currentUsage: "Текущий расход",
    provider: "Провайдер",
    amount: "Сумма",
    device: "Устройство",
    createdAt: "Дата",
    unlimited: "без лимита",
  },
  en: {
    title: "Billing",
    subtitle:
      "Choose a device and one of the two plans. After successful payment, the backend will activate the subscription automatically.",
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
    paymentHistory: "Payment history",
    selected: "Selected",
    chooseDevice: "First choose a device on the left.",
    choosePlan: "Now choose a plan on the right.",
    paypalReady: "PayPal is ready",
    paypalNotReady:
      "PayPal Client ID is missing. Check NEXT_PUBLIC_PAYPAL_CLIENT_ID in Vercel.",
    paymentHint: "Choose a plan on the right, then pay with PayPal.",
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
    selectedDevice: "Selected device",
    selectedPlan: "Selected plan",
    status: "Status",
    automaticActivation: "Automatic activation",
    automaticActivationText:
      "After successful payment, the backend will automatically create DeviceSubscription and the device will get access immediately.",
    processing: "Processing...",
    payFor: "Payment for",
    planIncludes: "Plan includes",
    currentPlan: "Current plan",
    currentUsage: "Current usage",
    provider: "Provider",
    amount: "Amount",
    device: "Device",
    createdAt: "Date",
    unlimited: "unlimited",
  },
} as const;

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const raw =
    localStorage.getItem("lang") ||
    localStorage.getItem("locale") ||
    localStorage.getItem("language") ||
    localStorage.getItem("site_lang") ||
    "ru";
  return raw.toLowerCase().startsWith("en") ? "en" : "ru";
}

function formatDate(value: string | null, lang: Lang): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
}

function buildErrorMessage(
  fallback: string,
  payload?: ApiErrorPayload | null
): string {
  const serverMessage = payload?.error?.message?.trim();
  if (serverMessage) return serverMessage;
  return fallback;
}

function formatRequestLimit(value: number | null | undefined, t: (typeof TEXT)[Lang]) {
  if (value === null || value === undefined || value <= 0) return t.unlimited;
  return `${value} ${t.requests}`;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw data || { error: { message: `HTTP ${response.status}` } };
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

  const t = TEXT[lang];

  useEffect(() => {
    setMounted(true);
    setLang(getStoredLang());
    setToken(getStoredToken());
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

  const paypalEnabled = !!PAYPAL_CLIENT_ID && !!token && !!selectedDevice && !!selectedPlan;

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

  if (!token) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="rounded-3xl border border-red-900/40 bg-[#081226] p-5 text-red-300 sm:p-6">
          {t.authRequired}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mb-5 rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:mb-6 sm:p-6">
        <div className="mb-2 text-2xl font-bold sm:text-3xl">{t.title}</div>
        <div className="text-sm text-white/70 sm:text-base">{t.subtitle}</div>
      </div>

      {message ? (
        <div
          className={`mb-5 rounded-2xl border p-4 sm:mb-6 ${
            messageType === "success"
              ? "border-green-700/50 bg-green-950/30 text-green-300"
              : messageType === "error"
              ? "border-red-700/50 bg-red-950/30 text-red-300"
              : "border-blue-700/50 bg-blue-950/30 text-blue-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mb-5 flex justify-stretch sm:mb-6 sm:justify-end">
        <button
          onClick={() => void refreshAll()}
          className="w-full rounded-xl border border-blue-700/50 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 sm:w-auto sm:py-2"
        >
          {t.refresh}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{t.myDevices}</h2>

          {loadingDevices ? (
            <div className="text-white/70">{t.loadingDevices}</div>
          ) : devices.length === 0 ? (
            <div className="text-white/70">{t.noDevices}</div>
          ) : (
            <div className="space-y-4">
              {devices.map((item) => {
                const isSelected = item.device.id === selectedDeviceId;
                return (
                  <button
                    key={item.device.id}
                    type="button"
                    onClick={() => setSelectedDeviceId(item.device.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-blue-900/40 bg-[#07101f] hover:border-blue-700/60"
                    }`}
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-xl font-semibold break-words sm:text-2xl">
                        {item.device.name}
                      </div>
                      <div
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${
                          item.status.hasAccess
                            ? "bg-green-900/40 text-green-300"
                            : "bg-red-900/40 text-red-300"
                        }`}
                      >
                        {item.status.hasAccess ? t.active : t.inactive}
                      </div>
                    </div>

                    <div className="space-y-1 break-words text-sm text-white/85 sm:text-base">
                      <div className="break-all">UID: {item.device.uid}</div>
                      <div>
                        {t.paired}: {item.status.isPaired ? t.yes : t.no}
                      </div>
                      <div>
                        {t.accessNow}: {item.status.hasAccess ? t.yes : t.no}
                      </div>
                      <div>
                        {t.trial}: {trialText(item)}
                      </div>
                      <div>
                        {t.subscription}: {subscriptionText(item)}
                      </div>
                      <div>
                        {t.usage}: {formatRequestLimit(item.usage.requestLimit, t)}
                      </div>
                      <div>
                        {t.used}: {item.usage.usedRequests}
                      </div>
                      <div>
                        {t.remaining}: {item.usage.remainingRequests ?? "—"}
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="mt-4 text-sm font-medium text-blue-300">
                        {t.selected}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{t.plans}</h2>

          {loadingPlans ? (
            <div className="text-white/70">{t.loadingPlans}</div>
          ) : plans.length === 0 ? (
            <div className="text-white/70">{t.noPlans}</div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-blue-900/40 bg-[#07101f] hover:border-blue-700/60"
                    }`}
                  >
                    <div className="mb-2 break-words text-xl font-semibold sm:text-2xl">
                      {plan.name}
                    </div>
                    <div className="space-y-1 text-sm text-white/85 sm:text-base">
                      <div>
                        {t.price}: {plan.priceKzt} KZT
                      </div>
                      <div>
                        {t.duration}: {plan.durationDays} {t.days}
                      </div>
                      <div>
                        {t.planIncludes}: {formatRequestLimit(plan.requestLimit, t)}
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="mt-4 text-sm font-medium text-blue-300">
                        {t.selected}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-blue-900/40 bg-[#07101f] p-4 sm:p-5">
            <div className="mb-2 text-base font-semibold sm:text-lg">{t.selectedDevice}</div>
            <div className="mb-4 break-words text-sm text-white/80 sm:text-base">
              {selectedDevice
                ? `${selectedDevice.device.name} (${selectedDevice.device.uid})`
                : t.chooseDevice}
            </div>

            <div className="mb-2 text-base font-semibold sm:text-lg">{t.selectedPlan}</div>
            <div className="mb-4 break-words text-sm text-white/80 sm:text-base">
              {selectedPlan
                ? `${selectedPlan.name} — ${selectedPlan.priceKzt} KZT / ${selectedPlan.durationDays} ${t.days}`
                : t.choosePlan}
            </div>

            {selectedDevice ? (
              <div className="mb-4 space-y-1 text-sm text-white/70">
                <div>
                  {t.currentPlan}: {selectedDevice.subscription.plan?.name || t.inactive}
                </div>
                <div>
                  {t.currentUsage}: {selectedDevice.usage.usedRequests} /{" "}
                  {selectedDevice.usage.requestLimit ?? "∞"}
                </div>
              </div>
            ) : null}

            <div className="mb-3 text-sm text-white/70 sm:text-base">{t.paymentHint}</div>

            {!PAYPAL_CLIENT_ID ? (
              <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-sm text-red-300 sm:text-base">
                {t.paypalNotReady}
              </div>
            ) : (
              <div>
                <div className="mb-3 text-sm text-green-400 sm:text-base">{t.paypalReady}</div>

                <PayPalScriptProvider
                  options={{
                    clientId: PAYPAL_CLIENT_ID,
                    intent: "capture",
                    currency: "USD",
                    components: "buttons",
                  }}
                >
                  <div className="[&_.paypal-buttons]:w-full">
                    <PayPalButtons
                      key={`${selectedDeviceId}-${selectedPlanId}`}
                      style={{
                        layout: "vertical",
                        shape: "rect",
                        label: "paypal",
                      }}
                      disabled={!paypalEnabled || isCapturing}
                      forceReRender={[selectedDeviceId, selectedPlanId]}
                      createOrder={async () => {
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
                          const payload = error as ApiErrorPayload;
                          const msg = buildErrorMessage(t.paymentError, payload);
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
                          const payload = error as ApiErrorPayload;
                          const msg = buildErrorMessage(t.paymentError, payload);
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
          </div>
        </section>
      </div>

      <div className="mt-5 rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:mt-6 sm:p-6">
        <div className="mb-4 text-xl font-semibold sm:text-2xl">{t.paymentHistory}</div>

        {loadingPayments ? (
          <div className="text-white/70">{t.loadingPayments}</div>
        ) : payments.length === 0 ? (
          <div className="text-white/70">{t.noPayments}</div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-blue-900/40 bg-[#07101f] p-4"
              >
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                  <div className="break-words text-base font-semibold sm:text-lg">
                    {payment.plan?.name || "Plan"} — {payment.amountKzt} KZT
                  </div>
                  <div className="inline-flex w-fit rounded-full bg-green-900/30 px-3 py-1 text-sm text-green-300">
                    {payment.status}
                  </div>
                </div>
                <div className="space-y-1 break-words text-sm text-white/75">
                  <div>
                    {t.provider}: {payment.provider}
                  </div>
                  <div>
                    {t.device}: {payment.device?.name || "—"}
                  </div>
                  <div>
                    {t.amount}: {payment.amountKzt} {payment.currency}
                  </div>
                  <div>
                    {t.createdAt}: {formatDate(payment.createdAt, lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-3xl border border-blue-900/40 bg-[#081226] p-5 sm:mt-6 sm:p-6">
        <div className="mb-2 text-xl font-semibold sm:text-2xl">{t.automaticActivation}</div>
        <div className="text-sm text-white/70 sm:text-base">
          {isCapturing ? t.processing : t.automaticActivationText}
        </div>
      </div>
    </main>
  );
}