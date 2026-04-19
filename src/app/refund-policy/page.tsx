"use client";

import { useEffect, useState } from "react";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Политика возврата",
    updated: "Последнее обновление",
    date: "19 апреля 2026",
    intro:
      "PocketGPT является цифровым сервисом. После успешной оплаты и активации доступа возврат средств не гарантируется автоматически.",
    sections: [
      {
        title: "1. Общий принцип",
        body:
          "Оплата PocketGPT относится к оплате цифрового доступа. После того как подписка активирована или доступ фактически предоставлен, платёж считается исполненным со стороны сервиса.",
      },
      {
        title: "2. Отсутствие автоматического возврата",
        body:
          "PocketGPT не предоставляет мгновенный или автоматический возврат средств только по причине того, что пользователь передумал, не ознакомился с описанием тарифа, ошибся при выборе плана или не использовал сервис после активации.",
      },
      {
        title: "3. Исключительные случаи",
        body:
          "Запрос на возврат может быть рассмотрен индивидуально, если пользователь столкнулся с подтверждённой технической проблемой, из-за которой цифровой доступ не был фактически предоставлен или не мог быть активирован по вине сервиса.",
      },
      {
        title: "4. Что не считается основанием для возврата",
        body:
          "Не считаются основанием для обязательного возврата: невнимательное чтение условий, выбор не того устройства, ожидание функций, которых сервис не обещал, изменение личного решения после оплаты, а также проблемы на стороне пользователя или стороннего провайдера вне контроля PocketGPT.",
      },
      {
        title: "5. Проверка обращения",
        body:
          "PocketGPT вправе запросить дополнительные данные для проверки обстоятельств платежа, статуса подписки, истории устройства и признаков злоупотребления. Решение по индивидуальному обращению принимается по усмотрению сервиса.",
      },
      {
        title: "6. Мошеннические и спорные операции",
        body:
          "PocketGPT вправе отклонять запросы, связанные с попытками злоупотребления, недобросовестными chargeback-спорами, многократными повторными требованиями возврата или предоставлением ложной информации.",
      },
    ],
    footer:
      "Завершая оплату, пользователь подтверждает, что понимает цифровой характер сервиса и принимает данную политику возврата.",
  },
  en: {
    title: "Refund Policy",
    updated: "Last updated",
    date: "April 19, 2026",
    intro:
      "PocketGPT is a digital service. After successful payment and activation of access, a refund is not guaranteed automatically.",
    sections: [
      {
        title: "1. General principle",
        body:
          "Payment for PocketGPT is a payment for digital access. Once the subscription is activated or access has effectively been delivered, the service is considered fulfilled on the PocketGPT side.",
      },
      {
        title: "2. No automatic refund",
        body:
          "PocketGPT does not provide instant or automatic refunds simply because the user changed their mind, did not read the plan description carefully, selected the wrong plan, or chose not to use the service after activation.",
      },
      {
        title: "3. Exceptional cases",
        body:
          "A refund request may be reviewed individually if the user experienced a confirmed technical problem that prevented digital access from being delivered or activated due to a fault on the service side.",
      },
      {
        title: "4. What is not a valid refund reason",
        body:
          "The following are not valid mandatory refund reasons: not reading the terms carefully, choosing the wrong device, expecting features not promised by the service, changing personal decisions after payment, or user-side / third-party issues outside the control of PocketGPT.",
      },
      {
        title: "5. Request review",
        body:
          "PocketGPT may request additional information to review the payment circumstances, subscription status, device history, and possible signs of abuse. Any decision on an individual request is made at the service’s discretion.",
      },
      {
        title: "6. Fraudulent and disputed operations",
        body:
          "PocketGPT may reject requests connected to abuse attempts, bad-faith chargeback disputes, repeated refund demands, or false information.",
      },
    ],
    footer:
      "By completing payment, the user confirms that they understand the digital nature of the service and accept this refund policy.",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function RefundPolicyPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-[#0b1220] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <h1 className="text-3xl font-semibold">{t.title}</h1>
        <div className="mt-2 text-sm text-white/55">
          {t.updated}: {t.date}
        </div>

        <p className="mt-6 text-sm leading-7 text-white/80 sm:text-base">{t.intro}</p>

        <div className="mt-8 space-y-6">
          {t.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-700/40 bg-amber-950/30 p-4 text-sm leading-7 text-amber-100/90">
          {t.footer}
        </div>
      </div>
    </main>
  );
}
