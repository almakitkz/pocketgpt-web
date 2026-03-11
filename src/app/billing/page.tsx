"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

type Lang = "ru" | "en";

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  createdAt: string | null;
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
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

type LocalUser = {
  id: string;
  email: string;
};

type PayPalButtonsInstance = {
  render: (container: HTMLElement) => Promise<void> | void;
  close?: () => Promise<void> | void;
  isEligible?: () => boolean;
};

type PayPalNamespace = {
  Buttons: (config: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID?: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
    style?: Record<string, unknown>;
  }) => PayPalButtonsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const TEXT = {
  ru: {
    loading: "Загрузка...",
    title: "Billing",
    subtitle: "Управляй планами и подписками для своих устройств PocketGPT.",
    currentUser: "Пользователь",
    currentPlan: "Текущий план",
    noPlan: "Нет активного плана",
    activeUntil: "Активно до",
    chooseDevice: "Выбери устройство",
    noDevices: "У тебя пока нет привязанных устройств.",
    yourDevices: "Твои устройства",
    availablePlans: "Доступные планы",
    selectDevice: "Сначала выбери устройство",
    selectedDevice: "Выбранное устройство",
    trial: "Триал",
    subscription: "Подписка",
    activeUntilSmall: "активен до",
    expiredAt: "истёк",
    inactive: "неактивна",
    notStarted: "не начат",
    planPrice: "Цена",
    duration: "Длительность",
    days: "дней",
    alreadyActive: "У устройства уже есть активная подписка.",
    choosePlanHint: "Выбери план справа, затем оплати через PayPal.",
    billingStubTitle: "Автоматическая активация",
    billingStubText:
      "После успешной оплаты backend автоматически создаст DeviceSubscription и устройство сразу получит доступ.",
    paypalLoading: "Загрузка PayPal...",
    paypalReady: "PayPal готов",
    paypalError: "Ошибка PayPal",
    paymentSuccess: "Оплата прошла успешно. Подписка активирована.",
    paymentCancelled: "Оплата отменена.",
    selectPlanFirst: "Сначала выбери план",
    selectedPlan: "Выбранный план",
    notPaired: "Устройство ещё не завершило pairing",
    accessNow: "Доступ сейчас",
    yes: "Да",
    no: "Нет",
    amountUsd: "Сумма в USD",
    refreshing: "Обновление...",
    loginRequired: "Нужна авторизация",
    noPlans: "Планы пока не найдены.",
    sdkMissing: "NEXT_PUBLIC_PAYPAL_CLIENT_ID не задан",
    cannotPayNow: "Сейчас оплата недоступна для этого устройства.",
  },
  en: {
    loading: "Loading...",
    title: "Billing",
    subtitle: "Manage plans and subscriptions for your PocketGPT devices.",
    currentUser: "User",
    currentPlan: "Current plan",
    noPlan: "No active plan",
    activeUntil: "Active until",
    chooseDevice: "Choose a device",
    noDevices: "You do not have any paired devices yet.",
    yourDevices: "Your devices",
    availablePlans: "Available plans",
    selectDevice: "Select a device first",
    selectedDevice: "Selected device",
    trial: "Trial",
    subscription: "Subscription",
    activeUntilSmall: "active until",
    expiredAt: "expired at",
    inactive: "inactive",
    notStarted: "not started",
    planPrice: "Price",
    duration: "Duration",
    days: "days",
    alreadyActive: "This device already has an active subscription.",
    choosePlanHint: "Choose a plan on the right, then pay with PayPal.",
    billingStubTitle: "Automatic activation",
    billingStubText:
      "After successful payment, the backend automatically creates a DeviceSubscription and the device gets access immediately.",
    paypalLoading: "Loading PayPal...",
    paypalReady: "PayPal ready",
    paypalError: "PayPal error",
    paymentSuccess: "Payment completed successfully. Subscription activated.",
    paymentCancelled: "Payment cancelled.",
    selectPlanFirst: "Select a plan first",
    selectedPlan: "Selected plan",
    notPaired: "The device has not completed pairing yet",
    accessNow: "Access now",
    yes: "Yes",
    no: "No",
    amountUsd: "Amount in USD",
    refreshing: "Refreshing...",
    loginRequired: "Authorization required",
    noPlans: "No plans found yet.",
    sdkMissing: "NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set",
    cannotPayNow: "Payment is not available for this device right now.",
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

function getPayPalClientId(): string {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function BillingPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paypalReady, setPaypalReady] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [capturingOrder, setCapturingOrder] = useState(false);
  const [previewAmountUsd, setPreviewAmountUsd] = useState<string>("");

  const paypalRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<PayPalButtonsInstance | null>(null);

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang as EventListener);
    return () => window.removeEventListener("site-language-change", updateLang as EventListener);
  }, []);

  async function loadData(initial = false) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorText("");

      const [devicesData, plansData] = await Promise.all([
        apiFetch("/v1/user/devices", { method: "GET" }),
        apiFetch("/v1/plans", { method: "GET" }),
      ]);

      const loadedDevices: DeviceItem[] = devicesData.devices || [];
      const loadedPlans: Plan[] = plansData.plans || [];

      setDevices(loadedDevices);
      setPlans(loadedPlans);

      setSelectedDeviceId((prev) => {
        if (prev && loadedDevices.some((item) => item.device.id === prev)) return prev;
        return loadedDevices[0]?.device.id || "";
      });

      setSelectedPlanId((prev) => {
        if (prev && loadedPlans.some((item) => item.id === prev)) return prev;
        return loadedPlans[0]?.id || "";
      });
    } catch (err) {
      setErrorText(extractErrorMessage(err, "Load failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    const localUser = getUser();

    if (!token) {
      setErrorText(t.loginRequired);
      window.location.href = "/login";
      return;
    }

    setUser(localUser);
    setReady(true);
    void loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDevice = useMemo(() => {
    return devices.find((item) => item.device.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  const selectedPlan = useMemo(() => {
    return plans.find((item) => item.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  const canRenderPayPal =
    !!selectedDevice &&
    !!selectedPlan &&
    selectedDevice.status.isPaired &&
    !selectedDevice.subscription.active &&
    !creatingOrder &&
    !capturingOrder;

  useEffect(() => {
    const clientId = getPayPalClientId();
    if (!clientId) {
      setErrorText(t.sdkMissing);
      return;
    }

    const existing = document.querySelector('script[data-paypal-sdk="true"]') as HTMLScriptElement | null;

    if (existing) {
      if (window.paypal) {
        setPaypalReady(true);
      } else {
        existing.addEventListener("load", () => setPaypalReady(true), { once: true });
        existing.addEventListener("error", () => setErrorText(t.paypalError), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.setAttribute("data-paypal-sdk", "true");

    script.onload = () => setPaypalReady(true);
    script.onerror = () => setErrorText(t.paypalError);

    document.body.appendChild(script);
  }, [t.paypalError, t.sdkMissing]);

  useEffect(() => {
    if (!paypalRef.current) return;
    paypalRef.current.innerHTML = "";

    if (buttonsRef.current?.close) {
      try {
        void buttonsRef.current.close();
      } catch {
        // ignore
      }
    }
    buttonsRef.current = null;

    if (!paypalReady || !window.paypal || !paypalRef.current) return;
    if (!canRenderPayPal || !selectedDevice || !selectedPlan) return;

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        shape: "rect",
        label: "paypal",
      },

      createOrder: async () => {
        setErrorText("");
        setInfoText("");
        setCreatingOrder(true);

        try {
          const data = await apiFetch("/v1/billing/create-order", {
            method: "POST",
            body: JSON.stringify({
              deviceId: selectedDevice.device.id,
              planId: selectedPlan.id,
              lang,
            }),
          });

          const orderId = String(data.orderId || "");
          if (!orderId) {
            throw new Error("Missing orderId from backend");
          }

          setPreviewAmountUsd(String(data.amountUsd || ""));
          return orderId;
        } catch (err) {
          const message = extractErrorMessage(err, t.paypalError);
          setErrorText(message);
          throw err;
        } finally {
          setCreatingOrder(false);
        }
      },

      onApprove: async (data) => {
        setErrorText("");
        setInfoText("");
        setCapturingOrder(true);

        try {
          const orderId = String(data.orderID || "");
          if (!orderId) {
            throw new Error("Missing PayPal orderID");
          }

          await apiFetch("/v1/billing/capture-order", {
            method: "POST",
            body: JSON.stringify({
              orderId,
              deviceId: selectedDevice.device.id,
              planId: selectedPlan.id,
              lang,
            }),
          });

          setInfoText(t.paymentSuccess);
          await loadData(false);
        } catch (err) {
          setErrorText(extractErrorMessage(err, t.paypalError));
        } finally {
          setCapturingOrder(false);
        }
      },

      onCancel: () => {
        setInfoText(t.paymentCancelled);
      },

      onError: (err) => {
        setErrorText(extractErrorMessage(err, t.paypalError));
      },
    });

    buttonsRef.current = buttons;

    if (typeof buttons.isEligible === "function" && !buttons.isEligible()) {
      setErrorText(t.paypalError);
      return;
    }

    void buttons.render(paypalRef.current);

    return () => {
      if (buttonsRef.current?.close) {
        try {
          void buttonsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [
    paypalReady,
    canRenderPayPal,
    selectedDevice,
    selectedPlan,
    lang,
    t.paypalError,
    t.paymentCancelled,
    t.paymentSuccess,
  ]);

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
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 20 }}>
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{t.title}</h1>
          <p style={{ color: "#a1a1aa", marginTop: 0 }}>{t.subtitle}</p>

          <div style={{ color: "#d4d4d8", lineHeight: 1.8, marginTop: 10 }}>
            <div>
              {t.currentUser}: {user?.email || "—"}
            </div>
            <div>
              {t.selectedDevice}: {selectedDevice?.device.name || "—"}
            </div>
            <div>
              {t.selectedPlan}: {selectedPlan?.name || "—"}
            </div>
            <div>
              {t.currentPlan}:{" "}
              {selectedDevice?.subscription.active
                ? selectedDevice.subscription.plan?.name || "—"
                : t.noPlan}
            </div>
            <div>
              {t.activeUntil}:{" "}
              {selectedDevice?.subscription.active
                ? formatDate(selectedDevice.subscription.currentPeriodEnd)
                : "—"}
            </div>
            {previewAmountUsd ? (
              <div>
                {t.amountUsd}: {previewAmountUsd} USD
              </div>
            ) : null}
          </div>
        </div>

        {(loading || refreshing) && (
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 20,
              padding: 24,
              color: "#a1a1aa",
            }}
          >
            {loading ? t.loading : t.refreshing}
          </div>
        )}

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

        {infoText ? (
          <div
            style={{
              background: "#0f172a",
              color: "#bfdbfe",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #1d4ed8",
            }}
          >
            {infoText}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 20,
          }}
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{t.yourDevices}</h2>

            {devices.length === 0 ? (
              <div style={{ color: "#a1a1aa" }}>{t.noDevices}</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ color: "#d1d5db", display: "grid", gap: 8 }}>
                  <span>{t.chooseDevice}</span>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setInfoText("");
                      setErrorText("");
                      setSelectedDeviceId(e.target.value);
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid #374151",
                      background: "#0b1220",
                      color: "white",
                    }}
                  >
                    {devices.map((item) => (
                      <option key={item.device.id} value={item.device.id}>
                        {item.device.name}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedDevice ? (
                  <div
                    style={{
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 16,
                      padding: 18,
                      color: "#d1d5db",
                      lineHeight: 1.8,
                    }}
                  >
                    <div>
                      <strong>{selectedDevice.device.name}</strong>
                    </div>
                    <div>UID: {selectedDevice.device.uid}</div>
                    <div>
                      Pairing: {selectedDevice.status.isPaired ? t.yes : t.no}
                    </div>
                    <div>
                      {t.accessNow}: {selectedDevice.status.hasAccess ? t.yes : t.no}
                    </div>
                    <div>
                      {t.trial}:{" "}
                      {selectedDevice.trial.exists
                        ? selectedDevice.trial.active
                          ? `${t.activeUntilSmall} ${formatDate(selectedDevice.trial.expiresAt)}`
                          : `${t.expiredAt} ${formatDate(selectedDevice.trial.expiresAt)}`
                        : t.notStarted}
                    </div>
                    <div>
                      {t.subscription}:{" "}
                      {selectedDevice.subscription.active
                        ? `${selectedDevice.subscription.plan?.name || "plan"}`
                        : t.inactive}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{t.availablePlans}</h2>

            {plans.length === 0 ? (
              <div style={{ color: "#a1a1aa" }}>{t.noPlans}</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setInfoText("");
                      setErrorText("");
                      setSelectedPlanId(plan.id);
                    }}
                    style={{
                      textAlign: "left",
                      background: selectedPlanId === plan.id ? "#13203a" : "#0b1220",
                      border:
                        selectedPlanId === plan.id
                          ? "1px solid #2563eb"
                          : "1px solid #1f2937",
                      borderRadius: 18,
                      padding: 18,
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
                      {plan.name}
                    </div>
                    <div style={{ color: "#d1d5db", lineHeight: 1.8 }}>
                      <div>
                        {t.planPrice}: {plan.priceKzt} KZT
                      </div>
                      <div>
                        {t.duration}: {plan.durationDays} {t.days}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, color: "#a1a1aa" }}>{t.choosePlanHint}</div>

            <div style={{ marginTop: 18 }}>
              {!paypalReady ? (
                <div style={{ color: "#a1a1aa" }}>{t.paypalLoading}</div>
              ) : (
                <div style={{ color: "#86efac", marginBottom: 12 }}>{t.paypalReady}</div>
              )}

              {selectedDevice && !selectedDevice.status.isPaired ? (
                <div
                  style={{
                    background: "#1f2937",
                    color: "#fca5a5",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #374151",
                    marginBottom: 12,
                  }}
                >
                  {t.notPaired}
                </div>
              ) : null}

              {selectedDevice?.subscription.active ? (
                <div
                  style={{
                    background: "#1f2937",
                    color: "#fde68a",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #374151",
                    marginBottom: 12,
                  }}
                >
                  {t.alreadyActive}
                </div>
              ) : null}

              {!selectedDevice || !selectedPlan ? (
                <div style={{ color: "#a1a1aa" }}>{t.selectDevice}</div>
              ) : null}

              {!canRenderPayPal && selectedDevice && selectedPlan && !selectedDevice.subscription.active && !selectedDevice.status.isPaired ? (
                <div style={{ color: "#a1a1aa" }}>{t.cannotPayNow}</div>
              ) : null}

              <div ref={paypalRef} />
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
          <h2 style={{ marginTop: 0 }}>{t.billingStubTitle}</h2>
          <p style={{ color: "#a1a1aa", marginBottom: 0 }}>{t.billingStubText}</p>
        </div>
      </div>
    </main>
  );
}