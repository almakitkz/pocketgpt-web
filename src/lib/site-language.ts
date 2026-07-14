export type SiteLanguage = "ru" | "en" | "kz";

export const SITE_LANGUAGE_EVENT = "site-language-change";

export function normalizeSiteLanguage(value: string | null | undefined): SiteLanguage {
  if (value === "en") return "en";
  if (value === "kz" || value === "kk") return "kz";
  return "ru";
}

export function getSiteLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "ru";

  return normalizeSiteLanguage(
    localStorage.getItem("site_lang") || localStorage.getItem("lang")
  );
}

export function saveSiteLanguage(language: SiteLanguage) {
  if (typeof window === "undefined") return;

  localStorage.setItem("site_lang", language);
  localStorage.setItem("lang", language);
  document.documentElement.lang = language === "kz" ? "kk" : language;
  window.dispatchEvent(new Event(SITE_LANGUAGE_EVENT));
}
