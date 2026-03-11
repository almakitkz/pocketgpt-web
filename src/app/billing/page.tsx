"use client";

import { useEffect, useMemo, useState } from "react";
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
  };
};

type LocalUser = {
  id: string;
  email: string;
};

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
    payButton: "Оплатить",
    paySoon: "Интеграция оплаты будет подключена следующим шагом.",
    selectedDevice: "Выбранное устройство",
    trial: "Триал",
    subscription: "Подписка",
    active: "активна",
    inactive: "неактивна",
    notStarted: "не начат",
    activeUntilSmall: "активен до",
    expiredAt: "истёк",
    planPrice: "Цена",
    duration: "Длительность",
    days: "дней",
    alreadyActive: "У устройства уже есть доступ",
    pairFirst: "Сначала привяжи устройство",
    choosePlan: "Выбери план",
    billingStubTitle: "Автоматическая оплата",
    billingStubText:
      "Позже эта кнопка будет открывать checkout, а backend через webhook будет сам создавать или продлевать подписку без ручного вмешательства.",
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
    payButton: "Pay",
    paySoon: "Payment integration will be connected in the next step.",
    selectedDevice: "Selected device",
    trial: "Trial",
    subscription: "Subscription",
    active: "active",
    inactive: "inactive",
    notStarted: "not started",
    activeUntilSmall: "active until",
    expiredAt: "expired at",
    planPrice: "Price",
    duration: "Duration",
    days: "days",
    alreadyActive: "This device already has access",
    pairFirst: "Pair a device first",
    choosePlan: "Choose a plan",
    billingStubTitle: "Automatic billing",
    billingStubText:
      "Later this button will open checkout, and the backend will create or extend the subscription automatically via webhook without manual work.",
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

export default function BillingPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
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
        setErrorText("");

        const [devicesData, plansData] = await Promise.all([
          apiFetch("/v1/user/devices", { method: "GET" }),
          apiFetch("/v1/plans", { method: "GET" }),
        ]);

        const loadedDevices = devicesData.devices || [];
        const loadedPlans = plansData.plans || [];

        setDevices(loadedDevices);
        setPlans(loadedPlans);

        if (loadedDevices.length > 0) {
          setSelectedDeviceId(loadedDevices[0].device.id);
        }
      } catch (err) {
        setErrorText(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const selectedDevice = useMemo(() => {
    return devices.find((item) => item.device.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  function handleFakePay(plan: Plan) {
    setErrorText("");

    if (!selectedDevice) {
      setInfoText(t.selectDevice);
      return;
    }

    if (selectedDevice.status.hasAccess) {
      setInfoText(t.alreadyActive);
      return;
    }

    setInfoText(`${t.paySoon} ${t.choosePlan}: ${plan.name}.`);
  }

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
          </div>
        </div>

        {loading ? (
          <div
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 20,
              padding: 24,
              color: "#a1a1aa",
            }}
          >
            {t.loading}
          </div>
        ) : null}

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
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
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

            <div style={{ display: "grid", gap: 16 }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 10 }}>{plan.name}</h3>

                  <div style={{ color: "#d1d5db", lineHeight: 1.8, marginBottom: 14 }}>
                    <div>
                      {t.planPrice}: {plan.priceKzt} KZT
                    </div>
                    <div>
                      {t.duration}: {plan.durationDays} {t.days}
                    </div>
                  </div>

                  <button
                    onClick={() => handleFakePay(plan)}
                    disabled={devices.length === 0}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 16px",
                      cursor: devices.length === 0 ? "default" : "pointer",
                      opacity: devices.length === 0 ? 0.6 : 1,
                    }}
                  >
                    {devices.length === 0 ? t.pairFirst : t.payButton}
                  </button>
                </div>
              ))}
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