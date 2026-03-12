"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

type Lang = "ru" | "en";

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
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
};

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  createdAt: string | null;
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
      "Выбери устройство и план. После успешной оплаты backend автоматически активирует подписку.",
    authRequired: "Нужна авторизация. Войди в аккаунт заново.",
    loading: "Загрузка...",
    loadingDevices: "Загружаем устройства...",
    loadingPlans: "Загружаем планы...",
    noDevices: "У тебя пока нет устройств.",
    noPlans: "Планы пока не найдены.",
    myDevices: "Мои устройства",
    plans: "Планы",
    selected: "Выбрано",
    chooseDevice: "Сначала выбери устройство слева.",
    choosePlan: "Теперь выбери план справа.",
    paypalReady: "PayPal готов",
    paypalNotReady:
      "PayPal Client ID не найден. Проверь NEXT_PUBLIC_PAYPAL_CLIENT_ID в Vercel.",
    paymentHint: "После оплаты доступ активируется автоматически.",
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
    active: "Активно",
    inactive: "Неактивно",
    yes: "Да",
    no: "Нет",
    notStarted: "не начат",
    expiredAt: "истёк",
    activeUntil: "активен до",
    price: "Цена",
    duration: "Длительность",
    days: "дней",
    selectedDevice: "Выбранное устройство",
    selectedPlan: "Выбранный план",
    status: "Статус",
  },
  en: {
    title: "Billing",
    subtitle:
      "Choose a device and a plan. After successful payment, the backend will activate the subscription automatically.",
    authRequired: "Authorization required. Please sign in again.",
    loading: "Loading...",
    loadingDevices: "Loading devices...",
    loadingPlans: "Loading plans...",
    noDevices: "You do not have any devices yet.",
    noPlans: "No plans found.",
    myDevices: "My devices",
    plans: "Plans",
    selected: "Selected",
    chooseDevice: "First choose a device on the left.",
    choosePlan: "Now choose a plan on the right.",
    paypalReady: "PayPal is ready",
    paypalNotReady:
      "PayPal Client ID is missing. Check NEXT_PUBLIC_PAYPAL_CLIENT_ID in Vercel.",
    paymentHint: "Access will be activated automatically after payment.",
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
    active: "Active",
    inactive: "Inactive",
    yes: "Yes",
    no: "No",
    notStarted: "not started",
    expiredAt: "expired",
    activeUntil: "active until",
    price: "Price",
    duration: "Duration",
    days: "days",
    selectedDevice: "Selected device",
    selectedPlan: "Selected plan",
    status: "Status",
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
  lang: Lang,
  fallback: string,
  payload?: ApiErrorPayload | null
): string {
  const serverMessage = payload?.error?.message?.trim();
  if (serverMessage) return serverMessage;
  return fallback;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
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
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [busy, setBusy] = useState(false);
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

  const loadDevices = useCallback(
    async (authToken: string) => {
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
    },
    []
  );

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const data = await apiRequest<{ ok: true; plans: Plan[] }>("/v1/plans", {
        method: "GET",
      });
      setPlans(data.plans || []);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      setLoadingDevices(false);
      setLoadingPlans(false);
      return;
    }

    void loadDevices(token);
    void loadPlans();
  }, [mounted, token, loadDevices, loadPlans]);

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
    await Promise.all([loadDevices(token), loadPlans()]);
  }, [token, loadDevices, loadPlans]);

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
      <main className="mx-auto max-w-6xl px-6 py-10 text-white">
        <div className="rounded-3xl border border-blue-900/40 bg-[#081226] p-6">
          {TEXT.ru.loading}
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 text-white">
        <div className="rounded-3xl border border-red-900/40 bg-[#081226] p-6 text-red-300">
          {t.authRequired}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-white">
      <div className="mb-6 rounded-3xl border border-blue-900/40 bg-[#081226] p-6">
        <div className="mb-2 text-3xl font-bold">{t.title}</div>
        <div className="text-white/70">{t.subtitle}</div>
      </div>

      {message ? (
        <div
          className={`mb-6 rounded-2xl border p-4 ${
            messageType === "success"
              ? "border-green-700/50 bg-green-950/30 text-green-300"
              : "border-red-700/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => void refreshAll()}
          className="rounded-xl border border-blue-700/50 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          {t.refresh}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-6">
          <h2 className="mb-4 text-2xl font-semibold">{t.myDevices}</h2>

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
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-blue-900/40 bg-[#07101f] hover:border-blue-700/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="text-2xl font-semibold">{item.device.name}</div>
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          item.status.hasAccess
                            ? "bg-green-900/40 text-green-300"
                            : "bg-red-900/40 text-red-300"
                        }`}
                      >
                        {item.status.hasAccess ? t.active : t.inactive}
                      </div>
                    </div>

                    <div className="space-y-1 text-base text-white/85">
                      <div>UID: {item.device.uid}</div>
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

        <section className="rounded-3xl border border-blue-900/40 bg-[#081226] p-6">
          <h2 className="mb-4 text-2xl font-semibold">{t.plans}</h2>

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
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-blue-900/40 bg-[#07101f] hover:border-blue-700/60"
                    }`}
                  >
                    <div className="mb-2 text-2xl font-semibold">{plan.name}</div>
                    <div className="space-y-1 text-base text-white/85">
                      <div>
                        {t.price}: {plan.priceKzt} KZT
                      </div>
                      <div>
                        {t.duration}: {plan.durationDays} {t.days}
                      </div>
                      <div>ID: {plan.id}</div>
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

          <div className="mt-6 rounded-2xl border border-blue-900/40 bg-[#07101f] p-5">
            <div className="mb-2 text-lg font-semibold">{t.selectedDevice}</div>
            <div className="mb-4 text-white/80">
              {selectedDevice ? `${selectedDevice.device.name} (${selectedDevice.device.uid})` : t.chooseDevice}
            </div>

            <div className="mb-2 text-lg font-semibold">{t.selectedPlan}</div>
            <div className="mb-4 text-white/80">
              {selectedPlan
                ? `${selectedPlan.name} — ${selectedPlan.priceKzt} KZT / ${selectedPlan.durationDays} ${t.days}`
                : t.choosePlan}
            </div>

            <div className="mb-3 text-white/70">{t.paymentHint}</div>

            {!PAYPAL_CLIENT_ID ? (
              <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-red-300">
                {t.paypalNotReady}
              </div>
            ) : (
              <div>
                <div className="mb-3 text-green-400">{t.paypalReady}</div>

                <PayPalScriptProvider
                  options={{
                    clientId: PAYPAL_CLIENT_ID,
                    intent: "capture",
                    currency: "USD",
                    components: "buttons",
                  }}
                >
                  <PayPalButtons
                    key={`${selectedDeviceId}-${selectedPlanId}`}
                    style={{
                      layout: "vertical",
                      shape: "rect",
                      label: "paypal",
                    }}
                    disabled={!paypalEnabled || busy}
                    forceReRender={[selectedDeviceId, selectedPlanId, busy]}
                    createOrder={async () => {
                      if (!token || !selectedDevice || !selectedPlan) {
                        const msg = !token ? t.authRequired : t.paymentError;
                        setMessageType("error");
                        setMessage(msg);
                        throw new Error(msg);
                      }

                      setBusy(true);
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
                        const msg = buildErrorMessage(lang, t.paymentError, payload);
                        setMessageType("error");
                        setMessage(msg);
                        setBusy(false);
                        throw new Error(msg);
                      }
                    }}
                    onApprove={async (data) => {
                      if (!token || !selectedDevice || !selectedPlan) {
                        const msg = t.paymentError;
                        setMessageType("error");
                        setMessage(msg);
                        setBusy(false);
                        throw new Error(msg);
                      }

                      if (!data.orderID) {
                        const msg = t.paymentError;
                        setMessageType("error");
                        setMessage(msg);
                        setBusy(false);
                        throw new Error(msg);
                      }

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

                        await loadDevices(token);
                        setMessageType("success");
                        setMessage(t.paymentSuccess);
                      } catch (error) {
                        const payload = error as ApiErrorPayload;
                        const msg = buildErrorMessage(lang, t.paymentError, payload);
                        setMessageType("error");
                        setMessage(msg);
                        throw new Error(msg);
                      } finally {
                        setBusy(false);
                      }
                    }}
                    onCancel={() => {
                      setBusy(false);
                      setMessageType("error");
                      setMessage(t.paymentCancelled);
                    }}
                    onError={(error) => {
                      console.error("PayPal button error:", error);
                      setBusy(false);
                      setMessageType("error");
                      setMessage(t.paymentError);
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}