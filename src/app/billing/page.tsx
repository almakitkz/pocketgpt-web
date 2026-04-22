"use client";

import { useEffect, useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
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

type PromoState = {
  active: boolean;
  totalRequests: number;
  usedRequests: number;
  remainingRequests: number;
  activeCode: string | null;
  activeGrantId: string | null;
  grantsCount: number;
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
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  promo?: PromoState | null;
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

type LocalUser = {
  id: string;
  email: string;
};

const TEXT = {
  ru: {
    loading: "Загрузка...",
    title: "Billing",
    subtitle: "Выбери устройство, активируй промокод или оплати подписку через PayPal.",
    backDashboard: "Назад в кабинет",
    chooseDevice: "Устройство",
    choosePlan: "План",
    noDevices: "У тебя пока нет привязанных устройств.",
    noPlans: "Планы пока недоступны.",
    currentDevice: "Текущее устройство",
    currentPlan: "Текущий план",
    currentAccess: "Текущий доступ",
    noActivePlan: "Нет активного плана",
    activeUntil: "Активно до",
    requestLimit: "Лимит",
    requests: "запросов",
    unlimited: "без лимита",
    buyNow: "Оплата через PayPal",
    planSelected: "Выбранный план",
    deviceSelected: "Выбранное устройство",
    promoTitle: "Промокод",
    promoSubtitle: "Для конструкторов: один код даёт 500 запросов без срока действия.",
    promoPlaceholder: "Например: PKT-7F4K-92QM",
    redeemPromo: "Активировать промокод",
    redeeming: "Активация...",
    promoSuccess: "Промокод успешно активирован.",
    promoErrorNoDevice: "Сначала выбери устройство.",
    promoErrorEmpty: "Введи промокод.",
    promoBalance: "Промо-баланс",
    promoRemaining: "Осталось промо-запросов",
    promoUsed: "Потрачено промо-запросов",
    promoTotal: "Всего промо-запросов",
    promoActive: "Промо активно",
    promoInactive: "Промо неактивно",
    activeCode: "Активный код",
    grantsCount: "Активированных кодов",
    paymentHistory: "История оплат",
    noPayments: "История оплат пока пуста.",
    amount: "Сумма",
    provider: "Провайдер",
    paidAt: "Оплачено",
    status: "Статус",
    days: "дней",
    openPayPal: "Откроется кнопка PayPal ниже",
    paypalMissing: "NEXT_PUBLIC_PAYPAL_CLIENT_ID не настроен на фронтенде.",
    refreshing: "Обновление...",
    refresh: "Обновить",
    paired: "Привязано",
    yes: "Да",
    no: "Нет",
    hasAccess: "Есть доступ",
  },
  en: {
    loading: "Loading...",
    title: "Billing",
    subtitle: "Select a device, redeem a promo code, or pay for a subscription with PayPal.",
    backDashboard: "Back to dashboard",
    chooseDevice: "Device",
    choosePlan: "Plan",
    noDevices: "You do not have any paired devices yet.",
    noPlans: "No plans are available right now.",
    currentDevice: "Current device",
    currentPlan: "Current plan",
    currentAccess: "Current access",
    noActivePlan: "No active plan",
    activeUntil: "Active until",
    requestLimit: "Request limit",
    requests: "requests",
    unlimited: "unlimited",
    buyNow: "Pay with PayPal",
    planSelected: "Selected plan",
    deviceSelected: "Selected device",
    promoTitle: "Promo code",
    promoSubtitle: "For constructor kits: one code gives 500 requests with no expiration date.",
    promoPlaceholder: "Example: PKT-7F4K-92QM",
    redeemPromo: "Redeem promo code",
    redeeming: "Redeeming...",
    promoSuccess: "Promo code activated successfully.",
    promoErrorNoDevice: "Please select a device first.",
    promoErrorEmpty: "Please enter a promo code.",
    promoBalance: "Promo balance",
    promoRemaining: "Remaining promo requests",
    promoUsed: "Used promo requests",
    promoTotal: "Total promo requests",
    promoActive: "Promo active",
    promoInactive: "Promo inactive",
    activeCode: "Active code",
    grantsCount: "Redeemed codes",
    paymentHistory: "Payment history",
    noPayments: "Payment history is empty.",
    amount: "Amount",
    provider: "Provider",
    paidAt: "Paid at",
    status: "Status",
    days: "days",
    openPayPal: "The PayPal button will appear below",
    paypalMissing: "NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured on the frontend.",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    paired: "Paired",
    yes: "Yes",
    no: "No",
    hasAccess: "Has access",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const v = localStorage.getItem("site_lang") || localStorage.getItem("lang") || "ru";
  return v === "en" ? "en" : "ru";
}

function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
}

function formatRequestLimit(value: number | null | undefined, lang: Lang, t: (typeof TEXT)[Lang]) {
  if (value === null || value === undefined || value <= 0) return t.unlimited;
  return `${value} ${TEXT[lang].requests}`;
}

export default function BillingPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [captureMessage, setCaptureMessage] = useState("");

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  const pairedDevices = useMemo(
    () => devices.filter((item) => item.status.isPaired && !item.device.disabled),
    [devices]
  );

  const selectedDevice = useMemo(
    () => devices.find((item) => item.device.id === selectedDeviceId) || null,
    [devices, selectedDeviceId]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  async function loadData(showLoader = false) {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setErrorText("");

    try {
      const [devicesData, plansData, paymentsData] = await Promise.all([
        apiFetch("/v1/user/devices", { method: "GET" }),
        apiFetch("/v1/plans", { method: "GET" }),
        apiFetch("/v1/billing/history?limit=20", { method: "GET" }),
      ]);

      const nextDevices = (devicesData.devices || []) as DeviceItem[];
      const nextPlans = (plansData.plans || []) as Plan[];
      setDevices(nextDevices);
      setPlans(nextPlans);
      setPayments((paymentsData.payments || []) as PaymentItem[]);

      setSelectedDeviceId((prev) => {
        if (prev && nextDevices.some((item) => item.device.id === prev && item.status.isPaired)) {
          return prev;
        }
        return nextDevices.find((item) => item.status.isPaired && !item.device.disabled)?.device.id || "";
      });

      setSelectedPlanId((prev) => {
        if (prev && nextPlans.some((plan) => plan.id === prev)) return prev;
        return nextPlans[0]?.id || "";
      });
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    const localUser = getUser();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setUser(localUser as LocalUser | null);
    setReady(true);
    void loadData(true);
  }, []);

  async function handlePromoRedeem() {
    if (!selectedDeviceId) {
      setPromoError(t.promoErrorNoDevice);
      setPromoMessage("");
      return;
    }

    const normalizedCode = promoCode.trim().toUpperCase();
    if (!normalizedCode) {
      setPromoError(t.promoErrorEmpty);
      setPromoMessage("");
      return;
    }

    try {
      setRedeemingPromo(true);
      setPromoError("");
      setPromoMessage("");
      const response = await apiFetch("/v1/user/promo/redeem", {
        method: "POST",
        body: JSON.stringify({ code: normalizedCode, deviceId: selectedDeviceId, lang }),
      });
      setPromoCode("");
      setPromoMessage(`${t.promoSuccess} ${response?.promo?.remainingRequests ?? 0} ${t.requests}.`);
      await loadData(false);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Promo redeem failed");
    } finally {
      setRedeemingPromo(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-[1150px]">{t.loading}</div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[1150px] space-y-5">
        <section className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{t.title}</h1>
              <p className="text-sm text-[#a1a1aa] sm:text-base">{t.subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadData(false)}
                className="rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 font-semibold text-white transition hover:border-[#4b5563] hover:bg-[#0f172a]"
              >
                {refreshing ? t.refreshing : t.refresh}
              </button>
              <a
                href="/dashboard"
                className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white no-underline transition hover:bg-blue-500"
              >
                {t.backDashboard}
              </a>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
              <div className="mb-1 text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Email</div>
              <div className="break-anywhere">{user?.email || "—"}</div>
            </div>
            <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
              <div className="mb-1 text-xs uppercase tracking-[0.2em] text-[#94a3b8]">User ID</div>
              <div className="break-anywhere">{user?.id || "—"}</div>
            </div>
          </div>
        </section>

        {errorText ? (
          <div className="rounded-2xl border border-[#7f1d1d] bg-[#3f1d1d] p-4 text-sm text-[#fecaca]">
            {errorText}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-4 text-2xl font-semibold">{t.deviceSelected}</h2>

              {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}
              {!loading && pairedDevices.length === 0 ? <div className="text-[#a1a1aa]">{t.noDevices}</div> : null}

              <label className="block">
                <span className="mb-2 block text-sm text-[#cbd5e1]">{t.chooseDevice}</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="">{t.chooseDevice}</option>
                  {pairedDevices.map((item) => (
                    <option key={item.device.id} value={item.device.id}>
                      {item.device.name} · {item.device.uid}
                    </option>
                  ))}
                </select>
              </label>

              {selectedDevice ? (
                <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-sm leading-7 text-[#d1d5db] sm:text-base">
                  <div className="break-anywhere">UID: {selectedDevice.device.uid}</div>
                  <div>{t.paired}: {selectedDevice.status.isPaired ? t.yes : t.no}</div>
                  <div>{t.hasAccess}: {selectedDevice.status.hasAccess ? t.yes : t.no}</div>
                  <div>{t.currentPlan}: {selectedDevice.subscription.plan?.name || t.noActivePlan}</div>
                  <div>{t.requestLimit}: {formatRequestLimit(selectedDevice.usage.requestLimit, lang, t)}</div>
                  <div className="break-anywhere">{t.activeUntil}: {formatDate(selectedDevice.subscription.currentPeriodEnd || selectedDevice.trial.expiresAt, lang)}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.promoTitle}</h2>
              <p className="mb-4 text-sm text-[#a1a1aa] sm:text-base">{t.promoSubtitle}</p>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t.promoPlaceholder}
                  className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-[#6b7280] focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void handlePromoRedeem()}
                  disabled={redeemingPromo || !selectedDeviceId}
                  className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {redeemingPromo ? t.redeeming : t.redeemPromo}
                </button>
              </div>

              {promoMessage ? (
                <div className="mt-4 rounded-xl border border-[#14532d] bg-[#0f2f1d] p-3 text-sm text-[#bbf7d0]">
                  {promoMessage}
                </div>
              ) : null}
              {promoError ? (
                <div className="mt-4 rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
                  {promoError}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-sm leading-7 text-[#d1d5db] sm:text-base">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#94a3b8]">{t.promoBalance}</div>
                <div>{selectedDevice?.promo?.active ? t.promoActive : t.promoInactive}</div>
                <div>{t.promoTotal}: {selectedDevice?.promo?.totalRequests ?? 0}</div>
                <div>{t.promoUsed}: {selectedDevice?.promo?.usedRequests ?? 0}</div>
                <div>{t.promoRemaining}: {selectedDevice?.promo?.remainingRequests ?? 0}</div>
                <div>{t.grantsCount}: {selectedDevice?.promo?.grantsCount ?? 0}</div>
                <div className="break-anywhere">{t.activeCode}: {selectedDevice?.promo?.activeCode || "—"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-4 text-2xl font-semibold">{t.choosePlan}</h2>

              {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}
              {!loading && plans.length === 0 ? <div className="text-[#a1a1aa]">{t.noPlans}</div> : null}

              <div className="grid gap-3">
                {plans.map((plan) => {
                  const selected = plan.id === selectedPlanId;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-[#0b1220]"
                          : "border-[#1f2937] bg-[#0b1220] hover:border-[#374151]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold text-white">{plan.name}</div>
                        <div className="text-sm font-semibold text-blue-300">{plan.priceKzt} KZT</div>
                      </div>
                      <div className="text-sm leading-7 text-[#cbd5e1]">
                        <div>{plan.durationDays} {t.days}</div>
                        <div>{t.requestLimit}: {formatRequestLimit(plan.requestLimit, lang, t)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-sm leading-7 text-[#d1d5db] sm:text-base">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#94a3b8]">{t.planSelected}</div>
                <div>{selectedPlan?.name || "—"}</div>
                <div>{selectedPlan ? `${selectedPlan.priceKzt} KZT` : "—"}</div>
                <div>{t.requestLimit}: {formatRequestLimit(selectedPlan?.requestLimit, lang, t)}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.buyNow}</h2>
              <p className="mb-4 text-sm text-[#a1a1aa] sm:text-base">{t.openPayPal}</p>

              {paypalError ? (
                <div className="mb-4 rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
                  {paypalError}
                </div>
              ) : null}

              {captureMessage ? (
                <div className="mb-4 rounded-xl border border-[#14532d] bg-[#0f2f1d] p-3 text-sm text-[#bbf7d0]">
                  {captureMessage}
                </div>
              ) : null}

              {!paypalClientId ? (
                <div className="rounded-xl border border-[#7f1d1d] bg-[#3f1d1d] p-3 text-sm text-[#fecaca]">
                  {t.paypalMissing}
                </div>
              ) : selectedDeviceId && selectedPlanId ? (
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: "USD",
                    intent: "capture",
                    components: "buttons",
                  }}
                >
                  <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", label: "pay" }}
                      createOrder={async () => {
                        setPaypalError("");
                        setCaptureMessage("");
                        const response = (await apiFetch("/v1/billing/create-order", {
                          method: "POST",
                          body: JSON.stringify({
                            deviceId: selectedDeviceId,
                            planId: selectedPlanId,
                            lang,
                          }),
                        })) as CreateOrderResponse;
                        return response.orderId;
                      }}
                      onApprove={async (data) => {
                        try {
                          setPaypalError("");
                          setCaptureMessage("");
                          await apiFetch("/v1/billing/capture-order", {
                            method: "POST",
                            body: JSON.stringify({
                              orderId: data.orderID,
                              deviceId: selectedDeviceId,
                              planId: selectedPlanId,
                              lang,
                            }),
                          });
                          setCaptureMessage(lang === "ru" ? "Оплата успешно подтверждена." : "Payment captured successfully.");
                          await loadData(false);
                        } catch (err) {
                          setPaypalError(err instanceof Error ? err.message : "Capture failed");
                        }
                      }}
                      onError={(err) => {
                        const message = err instanceof Error ? err.message : "PayPal error";
                        setPaypalError(message);
                      }}
                    />
                  </div>
                </PayPalScriptProvider>
              ) : (
                <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-sm text-[#a1a1aa]">
                  {lang === "ru"
                    ? "Сначала выбери устройство и план."
                    : "Please select a device and a plan first."}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
          <h2 className="mb-3 text-2xl font-semibold">{t.paymentHistory}</h2>
          {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}
          {!loading && !errorText && payments.length === 0 ? (
            <div className="text-[#a1a1aa]">{t.noPayments}</div>
          ) : null}

          <div className="grid gap-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="break-anywhere font-bold">
                    {payment.plan?.name || "Plan"} — {payment.amountKzt} {payment.currency}
                  </div>
                  <div className="break-anywhere text-[#86efac]">{payment.status}</div>
                </div>
                <div className="space-y-1 text-sm leading-7 text-[#cbd5e1] sm:text-base">
                  <div className="break-anywhere">{t.provider}: {payment.provider}</div>
                  <div>{t.amount}: {payment.amountKzt} {payment.currency}</div>
                  <div className="break-anywhere">{t.paidAt}: {formatDate(payment.createdAt, lang)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
