export const PAYMENT_TERMS_VERSION = "2026-07-19-v2";
export const PAYMENT_REFUND_POLICY_VERSION = "2026-07-19-v2";
export const PAYMENT_RECURRING_TERMS_VERSION = "2026-07-19-v2";

export const LEGAL_EFFECTIVE_DATE = {
  ru: "19 июля 2026 года",
  en: "July 19, 2026",
  kz: "2026 жылғы 19 шілде",
} as const;

export const LEGAL_SERVICE_NAME = "PocketGPT";
export const LEGAL_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || "almakitkz@gmail.com";
