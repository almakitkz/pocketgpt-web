"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  getSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";
import {
  PAYMENT_REFUND_POLICY_VERSION,
  PAYMENT_RECURRING_TERMS_VERSION,
  PAYMENT_TERMS_VERSION,
} from "@/lib/legal";

type PlanKind = "requests" | "connect" | "bundle" | string;
type PlanCategory = "requests" | "connect" | "bundle";

type Plan = {
  id: string;
  name: string;
  priceKzt: number;
  durationDays: number;
  requestLimit: number | null;
  kind?: PlanKind;
  connectIncluded?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  paypalAmount?: string | null;
  paypalCurrency?: string | null;
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
    nickname?: string | null;
  } | null;
  plan: Plan | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type RecurringSubscription = {
  id: string;
  deviceId: string;
  planId: string;
  plan: Plan | null;
  provider: string;
  providerSubscriptionId: string;
  providerPlanId: string;
  status: string;
  autoRenew: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextBillingAt: string | null;
  cancelledAt: string | null;
  suspendedAt: string | null;
  failedPaymentCount: number;
  payerEmail: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  refundPolicyVersion: string | null;
  recurringTermsVersion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type PrepareSubscriptionResponse = {
  paypalPlanId: string;
  customId: string;
  startTime: string | null;
  billingInterval: "MONTH";
  autoRenew: true;
  amountKzt: number;
  providerAmount: string;
  providerCurrency: string;
  plan: Plan;
};

const TEXT = {
  ru: {
    title: "Оплата",
    subtitle: "Выбери устройство и подходящий тариф.",
    device: "Устройство",
    selectDevice: "Выбери устройство",
    noDevices: "Нет привязанных устройств",
    pairDevice: "Привязать устройство",
    currentStatus: "Текущий статус",
    active: "Активен",
    inactive: "Неактивен",
    access: "Доступ",
    plan: "План",
    trial: "Пробный период",
    promo: "Промо",
    noPlan: "Нет активного плана",
    requestsLeft: "Осталось запросов",
    usedRequests: "Использовано",
    validUntil: "Действует до",
    noExpiry: "Без срока",
    unlimited: "Без лимита",
    connect: "Connect",
    plans: "Тарифы",
    regular: "Обычные",
    connectOnly: "Connect",
    bundles: "Комплекты",
    requests: "запросов",
    days: "дней",
    includesConnect: "Connect включён",
    requestsOnly: "Пакет запросов",
    choose: "Выбрать",
    selected: "Выбран",
    noPlans: "Тарифы пока недоступны",
    order: "К оплате",
    chosenDevice: "Устройство",
    chosenPlan: "Тариф",
    price: "Стоимость",
    pay: "Оплатить через PayPal",
    selectPlanFirst: "Выбери тариф",
    paypalMissing: "PayPal пока не настроен",
    acceptPrefix: "Я прочитал и принимаю",
    paymentTerms: "Пользовательское соглашение",
    and: "и",
    refundPolicy: "Политику возврата",
    termsRequired: "Подтверди согласие с условиями и ежемесячным автопродлением",
    recurringConsent: "Я оформляю ежемесячную подписку и разрешаю PayPal автоматически списывать показанную сумму каждый месяц до отмены. Галочка не установлена заранее. Я понимаю, что забытая отмена или отсутствие использования сами по себе не отменяют уже проведённый платёж; обязательные права по закону сохраняются.",
    monthly: "в месяц",
    paypalCharge: "Списание PayPal",
    paypalCurrencyNotice: "PayPal проводит регулярное списание в USD. Точная сумма показывается до подтверждения; банк может применить конвертацию.",
    autoRenewal: "Автопродление",
    nextCharge: "Следующее списание",
    startsAt: "Первое списание",
    cancelRenewal: "Отключить автопродление",
    cancelRenewalConfirm: "Отключить автоматическое продление этой подписки? Доступ сохранится до конца оплаченного периода.",
    renewalCancelled: "Автопродление отключено",
    renewalDisabledUntil: "Доступ сохранится до конца оплаченного периода",
    renewalActive: "Включено",
    renewalPending: "Ожидает начала",
    renewalApprovalPending: "Не завершена",
    renewalSuspended: "Приостановлено",
    subscriptionSuccess: "Подписка оформлена. Автопродление включено",
    subscriptionPending: "Подписка создана. Доступ активируется после первого списания",
    paymentSuccess: "Оплата подтверждена",
    paymentFailed: "Не удалось завершить оплату",
    promoCode: "Промокод",
    promoPlaceholder: "Введи код",
    activate: "Активировать",
    activating: "Проверяем…",
    promoSuccess: "Промокод активирован",
    promoEmpty: "Введи промокод",
    promoBalance: "Промо-баланс",
    promoCodes: "Активировано кодов",
    history: "История оплат",
    hideHistory: "Скрыть историю",
    emptyHistory: "Оплат пока нет",
    paid: "Оплачено",
    pending: "В обработке",
    failed: "Ошибка",
    refunded: "Возврат",
    loadFailed: "Не удалось загрузить данные",
    tryAgain: "Повторить",
    uid: "UID",
  },
  en: {
    title: "Billing",
    subtitle: "Choose a device and the right plan.",
    device: "Device",
    selectDevice: "Select a device",
    noDevices: "No paired devices",
    pairDevice: "Pair a device",
    currentStatus: "Current status",
    active: "Active",
    inactive: "Inactive",
    access: "Access",
    plan: "Plan",
    trial: "Trial period",
    promo: "Promo",
    noPlan: "No active plan",
    requestsLeft: "Requests left",
    usedRequests: "Used",
    validUntil: "Valid until",
    noExpiry: "No expiry",
    unlimited: "Unlimited",
    connect: "Connect",
    plans: "Plans",
    regular: "Regular",
    connectOnly: "Connect",
    bundles: "Bundles",
    requests: "requests",
    days: "days",
    includesConnect: "Connect included",
    requestsOnly: "Request package",
    choose: "Choose",
    selected: "Selected",
    noPlans: "Plans are not available yet",
    order: "Order",
    chosenDevice: "Device",
    chosenPlan: "Plan",
    price: "Price",
    pay: "Pay with PayPal",
    selectPlanFirst: "Select a plan",
    paypalMissing: "PayPal is not configured yet",
    acceptPrefix: "I have read and accept the",
    paymentTerms: "User Agreement and Subscription Terms",
    and: "and",
    refundPolicy: "Refund Policy",
    termsRequired: "Accept the terms and monthly automatic renewal",
    recurringConsent: "I understand that the subscription renews automatically every month until cancelled. PayPal will charge the displayed amount, and access remains available through the paid period after cancellation.",
    monthly: "per month",
    paypalCharge: "PayPal charge",
    paypalCurrencyNotice: "PayPal processes the recurring charge in USD. The exact amount is shown before approval; your bank may apply currency conversion.",
    autoRenewal: "Automatic renewal",
    nextCharge: "Next charge",
    startsAt: "First charge",
    cancelRenewal: "Cancel automatic renewal",
    cancelRenewalConfirm: "Cancel automatic renewal? Access remains available until the end of the paid period.",
    renewalCancelled: "Automatic renewal is off",
    renewalDisabledUntil: "Access remains until the end of the paid period",
    renewalActive: "Enabled",
    renewalPending: "Scheduled",
    renewalApprovalPending: "Not completed",
    renewalSuspended: "Suspended",
    subscriptionSuccess: "Subscription created. Automatic renewal is enabled",
    subscriptionPending: "Subscription created. Access activates after the first charge",
    paymentSuccess: "Payment confirmed",
    paymentFailed: "Could not complete the payment",
    promoCode: "Promo code",
    promoPlaceholder: "Enter code",
    activate: "Activate",
    activating: "Checking…",
    promoSuccess: "Promo code activated",
    promoEmpty: "Enter a promo code",
    promoBalance: "Promo balance",
    promoCodes: "Codes activated",
    history: "Payment history",
    hideHistory: "Hide history",
    emptyHistory: "No payments yet",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
    loadFailed: "Could not load data",
    tryAgain: "Try again",
    uid: "UID",
  },
  kz: {
    title: "Төлем",
    subtitle: "Құрылғы мен қолайлы тарифті таңда.",
    device: "Құрылғы",
    selectDevice: "Құрылғыны таңда",
    noDevices: "Байланыстырылған құрылғы жоқ",
    pairDevice: "Құрылғыны байланыстыру",
    currentStatus: "Қазіргі күй",
    active: "Белсенді",
    inactive: "Белсенді емес",
    access: "Қолжетім",
    plan: "Тариф",
    trial: "Сынақ мерзімі",
    promo: "Промо",
    noPlan: "Белсенді тариф жоқ",
    requestsLeft: "Қалған сұрау",
    usedRequests: "Қолданылды",
    validUntil: "Мерзімі",
    noExpiry: "Мерзімсіз",
    unlimited: "Шектеусіз",
    connect: "Connect",
    plans: "Тарифтер",
    regular: "Қалыпты",
    connectOnly: "Connect",
    bundles: "Жиынтықтар",
    requests: "сұрау",
    days: "күн",
    includesConnect: "Connect қосылған",
    requestsOnly: "Сұрау пакеті",
    choose: "Таңдау",
    selected: "Таңдалды",
    noPlans: "Тарифтер әзірге қолжетімсіз",
    order: "Төлем",
    chosenDevice: "Құрылғы",
    chosenPlan: "Тариф",
    price: "Бағасы",
    pay: "PayPal арқылы төлеу",
    selectPlanFirst: "Тарифті таңда",
    paypalMissing: "PayPal әзірге бапталмаған",
    acceptPrefix: "Мен оқып, қабылдаймын",
    paymentTerms: "Пайдаланушы келісімі мен жазылым шарттарын",
    and: "және",
    refundPolicy: "Қайтару саясатын",
    termsRequired: "Шарттар мен ай сайынғы автоматты ұзартуға келісуді раста",
    recurringConsent: "Мен жазылымның бас тартқанға дейін ай сайын автоматты түрде ұзартылатынын түсінемін. PayPal көрсетілген соманы алады, ал бас тартқаннан кейін қолжетімділік төленген кезең соңына дейін сақталады.",
    monthly: "айына",
    paypalCharge: "PayPal төлемі",
    paypalCurrencyNotice: "PayPal тұрақты төлемді USD валютасында жүргізеді. Нақты сома растау алдында көрсетіледі; банк валюта айырбастауды қолдануы мүмкін.",
    autoRenewal: "Автоматты ұзарту",
    nextCharge: "Келесі төлем",
    startsAt: "Алғашқы төлем",
    cancelRenewal: "Автоматты ұзартуды өшіру",
    cancelRenewalConfirm: "Автоматты ұзартуды өшіру керек пе? Қолжетім төленген мерзімнің соңына дейін сақталады.",
    renewalCancelled: "Автоматты ұзарту өшірілді",
    renewalDisabledUntil: "Қолжетімділік төленген кезең соңына дейін сақталады",
    renewalActive: "Қосулы",
    renewalPending: "Басталуын күтуде",
    renewalApprovalPending: "Аяқталмаған",
    renewalSuspended: "Тоқтатылды",
    subscriptionSuccess: "Жазылым рәсімделді. Автоматты ұзарту қосулы",
    subscriptionPending: "Жазылым құрылды. Қолжетім алғашқы төлемнен кейін іске қосылады",
    paymentSuccess: "Төлем расталды",
    paymentFailed: "Төлемді аяқтау мүмкін болмады",
    promoCode: "Промокод",
    promoPlaceholder: "Кодты енгіз",
    activate: "Қосу",
    activating: "Тексерілуде…",
    promoSuccess: "Промокод қосылды",
    promoEmpty: "Промокодты енгіз",
    promoBalance: "Промо-баланс",
    promoCodes: "Қосылған кодтар",
    history: "Төлем тарихы",
    hideHistory: "Тарихты жасыру",
    emptyHistory: "Төлемдер әлі жоқ",
    paid: "Төленді",
    pending: "Өңделуде",
    failed: "Қате",
    refunded: "Қайтарылды",
    loadFailed: "Деректерді жүктеу мүмкін болмады",
    tryAgain: "Қайталау",
    uid: "UID",
  },
} as const;

type BillingText = (typeof TEXT)[SiteLanguage];

function Spinner() {
  return <span className="pg-spinner" aria-hidden="true" />;
}

function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={open ? "is-open" : ""}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m7.5 9.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardCheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m6.5 12.5 3.2 3.2 7.8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function planKind(plan: Plan): PlanCategory {
  const kind = (plan.kind || "").toLowerCase();
  if (kind === "connect") return "connect";
  if (kind === "bundle") return "bundle";
  if (plan.connectIncluded) return "bundle";
  return "requests";
}

function localizedPlanName(name: string | null | undefined, lang: SiteLanguage) {
  if (!name) return "—";
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  const names: Record<string, Record<SiteLanguage, string>> = {
    basic: { ru: "Базовый", en: "Basic", kz: "Негізгі" },
    standard: { ru: "Стандарт", en: "Standard", kz: "Стандарт" },
    connect: { ru: "Connect", en: "Connect", kz: "Connect" },
    "basic + connect": {
      ru: "Базовый + Connect",
      en: "Basic + Connect",
      kz: "Негізгі + Connect",
    },
    "standard + connect": {
      ru: "Стандарт + Connect",
      en: "Standard + Connect",
      kz: "Стандарт + Connect",
    },
  };
  return names[normalized]?.[lang] || name;
}

function formatDate(value: string | null | undefined, lang: SiteLanguage) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number | null | undefined, lang: SiteLanguage) {
  if (value === null || value === undefined) return "—";
  const locale = lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU";
  return new Intl.NumberFormat(locale).format(value);
}

function deviceName(item: DeviceItem | null) {
  if (!item) return "—";
  return item.device.nickname || item.device.name || "PocketGPT";
}

function billingErrorMessage(error: unknown, lang: SiteLanguage) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const t = TEXT[lang];

  if (
    message.includes("promo") &&
    (message.includes("used") || message.includes("redeemed") || message.includes("already"))
  ) {
    return lang === "en"
      ? "This promo code has already been used"
      : lang === "kz"
        ? "Бұл промокод бұрын қолданылған"
        : "Этот промокод уже использован";
  }
  if (message.includes("promo") && (message.includes("not found") || message.includes("invalid"))) {
    return lang === "en"
      ? "Promo code not found"
      : lang === "kz"
        ? "Промокод табылмады"
        : "Промокод не найден";
  }
  if (message.includes("device") && message.includes("not found")) {
    return lang === "en"
      ? "Device not found"
      : lang === "kz"
        ? "Құрылғы табылмады"
        : "Устройство не найдено";
  }
  if (message.includes("автопрод") || message.includes("automatic-renewal") || message.includes("overlapping")) {
    return lang === "en"
      ? "Automatic renewal is already configured for this device"
      : lang === "kz"
        ? "Бұл құрылғы үшін автоматты ұзарту бұрын бапталған"
        : "Для этого устройства уже настроено автопродление";
  }
  if (message.includes("paypal") || message.includes("subscription") || message.includes("подпис")) {
    return message && !message.includes("request failed") ? (error as Error).message : t.paymentFailed;
  }
  return t.loadFailed;
}

function paymentStatus(status: string, t: BillingText) {
  const normalized = status.toLowerCase();
  if (["paid", "completed", "captured", "success", "succeeded"].includes(normalized)) {
    return { label: t.paid, kind: "success" };
  }
  if (["failed", "cancelled", "canceled", "denied"].includes(normalized)) {
    return { label: t.failed, kind: "danger" };
  }
  if (["refunded", "refund"].includes(normalized)) {
    return { label: t.refunded, kind: "neutral" };
  }
  return { label: t.pending, kind: "pending" };
}

export default function BillingPage() {
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const t = TEXT[lang];
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [recurringSubscriptions, setRecurringSubscriptions] = useState<RecurringSubscription[]>([]);
  const [cancellingSubscriptionId, setCancellingSubscriptionId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [category, setCategory] = useState<PlanCategory>("requests");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [captureMessage, setCaptureMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastLoadedAt = useRef(0);

  useEffect(() => {
    const updateLanguage = () => setLang(getSiteLanguage());
    updateLanguage();
    window.addEventListener(SITE_LANGUAGE_EVENT, updateLanguage);
    return () => window.removeEventListener(SITE_LANGUAGE_EVENT, updateLanguage);
  }, []);

  const pairedDevices = useMemo(
    () => devices.filter((item) => item.status.isPaired && !item.device.disabled),
    [devices]
  );

  const selectedDevice = useMemo(
    () => pairedDevices.find((item) => item.device.id === selectedDeviceId) || null,
    [pairedDevices, selectedDeviceId]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const selectedRecurringSubscriptions = useMemo(
    () => recurringSubscriptions.filter((subscription) => subscription.deviceId === selectedDeviceId),
    [recurringSubscriptions, selectedDeviceId]
  );

  const visibleRecurringSubscriptions = useMemo(() => {
    const rows = [...selectedRecurringSubscriptions].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const active = rows.filter((subscription) => {
      const status = subscription.status.toUpperCase();
      return subscription.autoRenew && ["ACTIVE", "APPROVED", "SUSPENDED"].includes(status);
    });

    if (active.length > 0) {
      const bundle = active.find((subscription) => subscription.plan && planKind(subscription.plan) === "bundle");
      if (bundle) return [bundle];

      const result: RecurringSubscription[] = [];
      for (const kind of ["requests", "connect"] as PlanCategory[]) {
        const match = active.find((subscription) => subscription.plan && planKind(subscription.plan) === kind);
        if (match) result.push(match);
      }
      return result;
    }

    const now = Date.now();
    const latestPaidCancellation = rows.find((subscription) => {
      if (subscription.autoRenew) return false;
      const status = subscription.status.toUpperCase();
      if (!["CANCELLED", "EXPIRED"].includes(status)) return false;
      const end = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : 0;
      return end > now;
    });

    return latestPaidCancellation ? [latestPaidCancellation] : [];
  }, [selectedRecurringSubscriptions]);

  const categorizedPlans = useMemo(() => {
    return plans
      .filter((plan) => plan.isActive !== false)
      .filter((plan) => planKind(plan) === category)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }, [plans, category]);

  const categoryCounts = useMemo(
    () => ({
      requests: plans.filter((plan) => plan.isActive !== false && planKind(plan) === "requests").length,
      connect: plans.filter((plan) => plan.isActive !== false && planKind(plan) === "connect").length,
      bundle: plans.filter((plan) => plan.isActive !== false && planKind(plan) === "bundle").length,
    }),
    [plans]
  );

  const loadData = useCallback(
    async (mode: "initial" | "soft" = "soft") => {
      if (mode === "initial") setLoading(true);
      else setSoftLoading(true);
      setErrorText("");

      try {
        const [devicesData, plansData, paymentsData, subscriptionsData] = await Promise.all([
          apiFetch("/v1/user/devices", { method: "GET" }),
          apiFetch("/v1/plans", { method: "GET" }),
          apiFetch("/v1/billing/history?limit=20", { method: "GET" }),
          apiFetch("/v1/billing/subscriptions", { method: "GET" }),
        ]);

        const nextDevices = (devicesData.devices || []) as DeviceItem[];
        const nextPlans = (plansData.plans || []) as Plan[];
        const activePlans = nextPlans.filter((plan) => plan.isActive !== false);

        setDevices(nextDevices);
        setPlans(activePlans);
        setPayments((paymentsData.payments || []) as PaymentItem[]);
        setRecurringSubscriptions((subscriptionsData.subscriptions || []) as RecurringSubscription[]);
        lastLoadedAt.current = Date.now();

        setSelectedDeviceId((current) => {
          if (
            current &&
            nextDevices.some(
              (item) =>
                item.device.id === current &&
                item.status.isPaired &&
                !item.device.disabled
            )
          ) {
            return current;
          }
          return (
            nextDevices.find(
              (item) => item.status.isPaired && !item.device.disabled
            )?.device.id || ""
          );
        });

        setSelectedPlanId((current) => {
          if (current && activePlans.some((plan) => plan.id === current)) return current;
          return "";
        });
      } catch (error) {
        setErrorText(billingErrorMessage(error, lang));
      } finally {
        setLoading(false);
        setSoftLoading(false);
      }
    },
    [lang]
  );

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }
    setReady(true);
    void loadData("initial");
  }, [loadData]);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastLoadedAt.current > 30_000) {
        void loadData("soft");
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleFocus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadData]);

  useEffect(() => {
    setPromoError("");
    setPromoMessage("");
    setPaypalError("");
    setCaptureMessage("");
    setTermsAccepted(false);
  }, [selectedDeviceId, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) return;
    setCategory(planKind(selectedPlan));
  }, [selectedPlan]);

  async function redeemPromo() {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError(t.promoEmpty);
      setPromoMessage("");
      return;
    }
    if (!selectedDeviceId) return;

    setRedeemingPromo(true);
    setPromoError("");
    setPromoMessage("");
    try {
      const response = await apiFetch("/v1/user/promo/redeem", {
        method: "POST",
        body: JSON.stringify({ code, deviceId: selectedDeviceId, lang }),
      });
      setPromoCode("");
      const remaining = response?.promo?.remainingRequests;
      setPromoMessage(
        remaining === null || remaining === undefined
          ? t.promoSuccess
          : `${t.promoSuccess} · ${formatNumber(remaining, lang)} ${t.requests}`
      );
      await loadData("soft");
    } catch (error) {
      setPromoError(billingErrorMessage(error, lang));
    } finally {
      setRedeemingPromo(false);
    }
  }

  async function cancelRecurringSubscription(subscription: RecurringSubscription) {
    if (!window.confirm(t.cancelRenewalConfirm)) return;
    setCancellingSubscriptionId(subscription.id);
    setPaypalError("");
    setCaptureMessage("");
    try {
      const response = await apiFetch(`/v1/billing/subscriptions/${subscription.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ lang, reason: "Cancelled by customer" }),
      });
      const updated = response?.subscription as RecurringSubscription | undefined;
      if (updated?.id) {
        setRecurringSubscriptions((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
      }
      setCaptureMessage(t.renewalCancelled);
      await loadData("soft");
    } catch (error) {
      setPaypalError(billingErrorMessage(error, lang));
    } finally {
      setCancellingSubscriptionId("");
    }
  }

  function chooseCategory(nextCategory: PlanCategory) {
    setCategory(nextCategory);
    if (selectedPlan && planKind(selectedPlan) !== nextCategory) {
      setSelectedPlanId("");
    }
  }

  const activePlanName = selectedDevice?.subscription.active
    ? localizedPlanName(selectedDevice.subscription.plan?.name, lang)
    : selectedDevice?.trial.active
      ? t.trial
      : selectedDevice?.promo?.active
        ? t.promo
        : t.noPlan;
  const activeUntil =
    selectedDevice?.subscription.currentPeriodEnd ||
    selectedDevice?.trial.expiresAt ||
    selectedDevice?.usage.periodEndsAt ||
    null;
  const remainingRequests = selectedDevice?.usage.remainingRequests;
  const connectActive = Boolean(selectedDevice?.connect?.active);
  const selectedAccessActive = Boolean(selectedDevice?.status.hasAccess);
  const connectOnlySubscription = Boolean(
    selectedDevice?.subscription.active &&
      selectedDevice.subscription.plan &&
      planKind(selectedDevice.subscription.plan) === "connect" &&
      !selectedDevice.trial.active &&
      !selectedDevice.promo?.active
  );

  if (!ready) {
    return <main className="pg-billing-page" aria-busy="true" />;
  }

  return (
    <main className="pg-billing-page">
      <div className="pg-billing-grid" aria-hidden="true" />
      <div className="pg-billing-glow" aria-hidden="true" />

      <div className="pg-billing-shell">
        <header className="pg-billing-head">
          <div>
<h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          {softLoading ? (
            <div className="pg-billing-sync" aria-label={t.currentStatus}>
              <Spinner />
            </div>
          ) : null}
        </header>

        {errorText ? (
          <div className="pg-billing-message is-error" role="alert">
            <span>{errorText}</span>
            <button type="button" onClick={() => void loadData("soft")}>
              {t.tryAgain}
            </button>
          </div>
        ) : null}

        {loading ? (
          <BillingSkeleton />
        ) : pairedDevices.length === 0 ? (
          <section className="pg-billing-empty">
            <div className="pg-billing-empty-icon" aria-hidden="true">
              <span />
            </div>
            <h2>{t.noDevices}</h2>
            <Link className="pg-button pg-button-primary" href="/pair">
              {t.pairDevice}
            </Link>
          </section>
        ) : (
          <>
            <section className="pg-billing-device-row">
              <label className="pg-billing-device-select">
                <span>{t.device}</span>
                <div>
                  <select
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                  >
                    {pairedDevices.map((item) => (
                      <option key={item.device.id} value={item.device.id}>
                        {deviceName(item)}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </label>

              <div className="pg-billing-device-meta">
                <span>{t.uid}</span>
                <strong>{selectedDevice?.device.uid || "—"}</strong>
              </div>
            </section>

            <section className="pg-billing-status" aria-label={t.currentStatus}>
              <div className="pg-billing-status-head">
                <h2>{t.currentStatus}</h2>
                <span className={`pg-status-pill is-${selectedAccessActive ? "active" : "inactive"}`}>
                  <i />
                  {selectedAccessActive ? t.active : t.inactive}
                </span>
              </div>

              <div className="pg-billing-metrics">
                <article>
                  <span>{t.plan}</span>
                  <strong>{activePlanName}</strong>
                </article>
                <article>
                  <span>{t.requestsLeft}</span>
                  <strong>
                    {remainingRequests === null || remainingRequests === undefined
                      ? connectOnlySubscription
                        ? "—"
                        : t.unlimited
                      : formatNumber(remainingRequests, lang)}
                  </strong>
                  {selectedDevice?.usage.usedRequests ? (
                    <small>
                      {t.usedRequests}: {formatNumber(selectedDevice.usage.usedRequests, lang)}
                    </small>
                  ) : null}
                </article>
                <article>
                  <span>{t.validUntil}</span>
                  <strong>{activeUntil ? formatDate(activeUntil, lang) : t.noExpiry}</strong>
                </article>
                <article>
                  <span>{t.connect}</span>
                  <strong className={connectActive ? "is-positive" : ""}>
                    {connectActive ? t.active : t.inactive}
                  </strong>
                </article>
              </div>
            </section>

            {visibleRecurringSubscriptions.length > 0 ? (
              <section className="pg-billing-renewals" aria-label={t.autoRenewal}>
                <div className="pg-billing-section-title">
                  <h2>{t.autoRenewal}</h2>
                </div>
                <div className="pg-billing-renewal-list">
                  {visibleRecurringSubscriptions.map((subscription) => {
                    const normalizedStatus = subscription.status.toUpperCase();
                    const statusLabel = !subscription.autoRenew || normalizedStatus === "CANCELLED"
                      ? t.renewalCancelled
                      : normalizedStatus === "SUSPENDED"
                        ? t.renewalSuspended
                        : normalizedStatus === "ACTIVE"
                          ? t.renewalActive
                          : normalizedStatus === "APPROVAL_PENDING"
                            ? t.renewalApprovalPending
                            : t.renewalPending;
                    return (
                      <article key={subscription.id} className={!subscription.autoRenew ? "is-cancelled" : ""}>
                        <div>
                          <span>{localizedPlanName(subscription.plan?.name, lang)}</span>
                          <strong>{statusLabel}</strong>
                          {!subscription.autoRenew ? <small>{t.renewalDisabledUntil}</small> : null}
                        </div>
                        <div>
                          <span>{subscription.autoRenew ? t.nextCharge : t.validUntil}</span>
                          <strong>{formatDate(subscription.nextBillingAt || subscription.currentPeriodEnd, lang)}</strong>
                        </div>
                        {subscription.autoRenew ? (
                          <button
                            type="button"
                            onClick={() => void cancelRecurringSubscription(subscription)}
                            disabled={cancellingSubscriptionId === subscription.id}
                          >
                            {cancellingSubscriptionId === subscription.id ? <Spinner /> : null}
                            {t.cancelRenewal}
                          </button>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="pg-billing-promo">
              <div className="pg-billing-promo-copy">
                <span>{t.promoCode}</span>
                <strong>
                  {selectedDevice?.promo?.active
                    ? `${t.promoBalance}: ${formatNumber(selectedDevice.promo.remainingRequests, lang)}`
                    : t.promoCode}
                </strong>
                {selectedDevice?.promo?.grantsCount ? (
                  <small>
                    {t.promoCodes}: {selectedDevice.promo.grantsCount}
                  </small>
                ) : null}
              </div>
              <div className="pg-billing-promo-form">
                <input
                  value={promoCode}
                  onChange={(event) => {
                    setPromoCode(event.target.value.toUpperCase());
                    setPromoError("");
                    setPromoMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void redeemPromo();
                  }}
                  placeholder={t.promoPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => void redeemPromo()}
                  disabled={redeemingPromo || !selectedDeviceId}
                >
                  {redeemingPromo ? <Spinner /> : null}
                  {redeemingPromo ? t.activating : t.activate}
                </button>
              </div>
              {promoMessage || promoError ? (
                <div
                  className={`pg-billing-inline-message ${promoError ? "is-error" : "is-success"}`}
                  role={promoError ? "alert" : "status"}
                >
                  {promoError || promoMessage}
                </div>
              ) : null}
            </section>

            <div className="pg-billing-commerce">
              <section className="pg-billing-plans">
                <div className="pg-billing-section-title">
                  <h2>{t.plans}</h2>
                </div>

                <div className="pg-billing-tabs" role="tablist" aria-label={t.plans}>
                  {([
                    ["requests", t.regular],
                    ["connect", t.connectOnly],
                    ["bundle", t.bundles],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={category === value}
                      className={category === value ? "is-active" : ""}
                      onClick={() => chooseCategory(value)}
                    >
                      <span>{label}</span>
                      <small>{categoryCounts[value]}</small>
                    </button>
                  ))}
                </div>

                {categorizedPlans.length === 0 ? (
                  <div className="pg-billing-no-plans">{t.noPlans}</div>
                ) : (
                  <div className="pg-billing-plan-list">
                    {categorizedPlans.map((plan, index) => {
                      const selected = selectedPlanId === plan.id;
                      const kind = planKind(plan);
                      return (
                        <button
                          type="button"
                          className={`pg-billing-plan ${selected ? "is-selected" : ""}`}
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          style={{ "--plan-index": index } as CSSProperties}
                        >
                          <div className="pg-billing-plan-radio">
                            {selected ? <CardCheckIcon /> : null}
                          </div>
                          <div className="pg-billing-plan-main">
                            <div className="pg-billing-plan-name">
                              <strong>{localizedPlanName(plan.name, lang)}</strong>
                              <span>
                                {kind === "connect"
                                  ? t.connectOnly
                                  : kind === "bundle"
                                    ? t.includesConnect
                                    : t.requestsOnly}
                              </span>
                            </div>
                            <div className="pg-billing-plan-details">
                              {kind !== "connect" ? (
                                <span>
                                  {plan.requestLimit && plan.requestLimit > 0
                                    ? `${formatNumber(plan.requestLimit, lang)} ${t.requests}`
                                    : t.unlimited}
                                </span>
                              ) : null}
                              <span>{t.monthly}</span>
                            </div>
                          </div>
                          <div className="pg-billing-plan-price">
                            <strong>{formatNumber(plan.priceKzt, lang)}</strong>
                            <span>₸</span>
                          </div>
                          <span className="pg-billing-plan-action">
                            {selected ? t.selected : t.choose}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="pg-billing-checkout">
                <div className="pg-billing-checkout-head">
                  <span>{t.order}</span>
                  <i aria-hidden="true" />
                </div>

                <dl>
                  <div>
                    <dt>{t.chosenDevice}</dt>
                    <dd>{deviceName(selectedDevice)}</dd>
                  </div>
                  <div>
                    <dt>{t.chosenPlan}</dt>
                    <dd>{localizedPlanName(selectedPlan?.name, lang)}</dd>
                  </div>
                  <div className="is-total">
                    <dt>{t.price}</dt>
                    <dd>
                      {selectedPlan ? `${formatNumber(selectedPlan.priceKzt, lang)} ₸ / ${t.monthly}` : "—"}
                    </dd>
                  </div>
                </dl>

                {selectedPlan ? (
                  <div className="pg-billing-provider-price">
                    <span>{t.paypalCharge}</span>
                    <strong>
                      {selectedPlan.paypalAmount && selectedPlan.paypalCurrency
                        ? `${selectedPlan.paypalAmount} ${selectedPlan.paypalCurrency} / ${t.monthly}`
                        : t.paypalCurrencyNotice}
                    </strong>
                  </div>
                ) : null}

                {paypalError ? (
                  <div className="pg-billing-checkout-message is-error" role="alert">
                    {paypalError}
                  </div>
                ) : null}
                {captureMessage ? (
                  <div className="pg-billing-checkout-message is-success" role="status">
                    {captureMessage}
                  </div>
                ) : null}

                {!selectedPlanId ? (
                  <div className="pg-billing-pay-placeholder">{t.selectPlanFirst}</div>
                ) : !paypalClientId ? (
                  <div className="pg-billing-pay-placeholder is-error">
                    {t.paypalMissing}
                  </div>
                ) : (
                  <>
                    <div className={`pg-billing-consent ${termsAccepted ? "is-accepted" : ""}`}>
                      <input
                        id="billing-terms-consent"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(event) => {
                          setTermsAccepted(event.target.checked);
                          if (event.target.checked) setPaypalError("");
                        }}
                      />
                      <div>
                        <label htmlFor="billing-terms-consent">{t.acceptPrefix}</label>{" "}
                        <Link href="/terms" target="_blank">{t.paymentTerms}</Link>{" "}
                        <span>{t.and}</span>{" "}
                        <Link href="/refund-policy" target="_blank">{t.refundPolicy}</Link>.
                        <p>{t.recurringConsent}</p>
                      </div>
                    </div>

                    {!termsAccepted ? (
                      <div className="pg-billing-pay-placeholder is-consent">
                        {t.termsRequired}
                      </div>
                    ) : (
                      <PayPalScriptProvider
                        options={{
                          clientId: paypalClientId,
                          currency: "USD",
                          intent: "subscription",
                          vault: true,
                          components: "buttons",
                        }}
                      >
                        <div className="pg-billing-paypal">
                          <PayPalButtons
                            forceReRender={[selectedDeviceId, selectedPlanId, lang, termsAccepted]}
                            style={{
                              layout: "vertical",
                              shape: "rect",
                              label: "subscribe",
                              height: 45,
                            }}
                            createSubscription={async (_data, actions) => {
                              setPaypalError("");
                              setCaptureMessage("");
                              if (!termsAccepted) {
                                setPaypalError(t.termsRequired);
                                throw new Error("terms_not_accepted");
                              }
                              try {
                                const prepared = (await apiFetch(
                                  "/v1/billing/subscription/prepare",
                                  {
                                    method: "POST",
                                    body: JSON.stringify({
                                      deviceId: selectedDeviceId,
                                      planId: selectedPlanId,
                                      lang,
                                      termsAccepted: true,
                                      recurringAccepted: true,
                                      termsVersion: PAYMENT_TERMS_VERSION,
                                      refundPolicyVersion: PAYMENT_REFUND_POLICY_VERSION,
                                      recurringTermsVersion: PAYMENT_RECURRING_TERMS_VERSION,
                                    }),
                                  }
                                )) as PrepareSubscriptionResponse;
                                if (!actions.subscription) throw new Error("paypal_subscription_unavailable");
                                return actions.subscription.create({
                                  plan_id: prepared.paypalPlanId,
                                  custom_id: prepared.customId,
                                  ...(prepared.startTime ? { start_time: prepared.startTime } : {}),
                                  application_context: {
                                    brand_name: "PocketGPT",
                                    shipping_preference: "NO_SHIPPING",
                                    user_action: "SUBSCRIBE_NOW",
                                    return_url: `${window.location.origin}/billing`,
                                    cancel_url: `${window.location.origin}/billing`,
                                  },
                                });
                              } catch (error) {
                                setPaypalError(billingErrorMessage(error, lang));
                                throw error;
                              }
                            }}
                            onApprove={async (data) => {
                              try {
                                setPaypalError("");
                                setCaptureMessage("");
                                const subscriptionId = data.subscriptionID;
                                if (!subscriptionId) throw new Error("subscription_id_missing");
                                const response = await apiFetch("/v1/billing/subscription/confirm", {
                                  method: "POST",
                                  body: JSON.stringify({ subscriptionId, lang }),
                                });
                                const activeNow = Boolean(response?.access?.hasAccess);
                                setCaptureMessage(activeNow ? t.subscriptionSuccess : t.subscriptionPending);
                                setTermsAccepted(false);
                                await loadData("soft");
                              } catch (error) {
                                setPaypalError(billingErrorMessage(error, lang));
                              }
                            }}
                            onError={(error) => setPaypalError(billingErrorMessage(error, lang))}
                            onCancel={() => setPaypalError("")}
                          />
                        </div>
                      </PayPalScriptProvider>
                    )}
                  </>
                )}
              </aside>
            </div>

            <section className={`pg-billing-history ${historyOpen ? "is-open" : ""}`}>
              <button
                className="pg-billing-history-toggle"
                type="button"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((current) => !current)}
              >
                <span>
                  <strong>{historyOpen ? t.hideHistory : t.history}</strong>
                  <small>{payments.length}</small>
                </span>
                <ChevronIcon open={historyOpen} />
              </button>

              {historyOpen ? (
                <div className="pg-billing-history-list">
                  {payments.length === 0 ? (
                    <div className="pg-billing-history-empty">{t.emptyHistory}</div>
                  ) : (
                    payments.map((payment, index) => {
                      const status = paymentStatus(payment.status, t);
                      return (
                        <article
                          key={payment.id}
                          style={{ "--payment-index": index } as CSSProperties}
                        >
                          <div>
                            <strong>{localizedPlanName(payment.plan?.name, lang)}</strong>
                            <span>{payment.device?.nickname || payment.device?.name || "PocketGPT"}</span>
                          </div>
                          <time>{formatDate(payment.createdAt, lang)}</time>
                          <b>{formatNumber(payment.amountKzt, lang)} ₸</b>
                          <em className={`is-${status.kind}`}>{status.label}</em>
                        </article>
                      );
                    })
                  )}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function BillingSkeleton() {
  return (
    <div className="pg-billing-skeleton" aria-hidden="true">
      <div className="pg-billing-skeleton-line is-device" />
      <div className="pg-billing-skeleton-status">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} />
        ))}
      </div>
      <div className="pg-billing-skeleton-commerce">
        <div>
          {[0, 1, 2].map((item) => (
            <span key={item} />
          ))}
        </div>
        <i />
      </div>
    </div>
  );
}
