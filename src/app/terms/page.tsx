"use client";

import { useEffect, useState } from "react";

type Lang = "ru" | "en";

const TEXT = {
  ru: {
    title: "Условия оплаты",
    updated: "Последнее обновление",
    date: "19 апреля 2026",
    intro:
      "Эти условия оплаты регулируют покупку цифрового доступа к сервису PocketGPT. Оплачивая подписку, пользователь подтверждает, что прочитал и принял данные условия.",
    sections: [
      {
        title: "1. Цифровой характер сервиса",
        body:
          "PocketGPT предоставляет цифровой доступ к программным функциям, облачным возможностям и связанным сервисам устройства. После успешной оплаты доступ может активироваться автоматически и считаться предоставленным сразу после активации подписки.",
      },
      {
        title: "2. Что покупает пользователь",
        body:
          "Пользователь оплачивает выбранный тарифный план с указанной ценой, сроком действия и лимитом использования, если лимит предусмотрен планом. Конкретные параметры отображаются на странице оплаты до завершения платежа.",
      },
      {
        title: "3. Подтверждение оплаты",
        body:
          "Платёж обрабатывается через стороннего платёжного провайдера. После успешного подтверждения платежа PocketGPT может автоматически активировать подписку для выбранного устройства без дополнительного ручного подтверждения.",
      },
      {
        title: "4. Ответственность пользователя",
        body:
          "Пользователь обязан перед оплатой убедиться, что выбирает правильное устройство, правильный тариф и понимает назначение сервиса. Пользователь также отвечает за сохранность доступа к своему аккаунту и за корректность введённых данных.",
      },
      {
        title: "5. Изменение цен и планов",
        body:
          "PocketGPT вправе в любое время изменять цены, состав тарифов, лимиты и срок действия будущих планов. Такие изменения не отменяют уже активированную подписку, если иное прямо не указано.",
      },
      {
        title: "6. Ограничение ответственности",
        body:
          "PocketGPT не несёт ответственности за задержки, вызванные сторонними платёжными системами, почтовыми сервисами, провайдерами хостинга, перебоями сети, действиями пользователя или несовместимостью устройства вне разумного контроля сервиса.",
      },
      {
        title: "7. Согласие перед оплатой",
        body:
          "Перед оплатой пользователь обязан подтвердить согласие с настоящими условиями оплаты и политикой возврата. Без такого подтверждения завершение оплаты не допускается.",
      },
    ],
    footer:
      "Если пользователь не согласен с этими условиями, он не должен завершать оплату.",
  },
  en: {
    title: "Payment Terms",
    updated: "Last updated",
    date: "April 19, 2026",
    intro:
      "These payment terms govern the purchase of digital access to the PocketGPT service. By paying for a subscription, the user confirms that they have read and accepted these terms.",
    sections: [
      {
        title: "1. Digital nature of the service",
        body:
          "PocketGPT provides digital access to software features, cloud functionality, and related device services. After successful payment, access may be activated automatically and considered delivered immediately upon subscription activation.",
      },
      {
        title: "2. What the user purchases",
        body:
          "The user purchases the selected plan with its displayed price, duration, and usage limit if a limit applies. The specific plan details are shown on the payment page before the payment is completed.",
      },
      {
        title: "3. Payment confirmation",
        body:
          "Payments are processed through a third-party payment provider. After successful confirmation, PocketGPT may automatically activate the subscription for the selected device without any additional manual confirmation.",
      },
      {
        title: "4. User responsibility",
        body:
          "Before paying, the user must make sure they selected the correct device, the correct plan, and understand the purpose of the service. The user is also responsible for keeping account access secure and for the accuracy of submitted information.",
      },
      {
        title: "5. Changes to prices and plans",
        body:
          "PocketGPT may change prices, plan contents, limits, and durations for future purchases at any time. Such changes do not cancel an already activated subscription unless explicitly stated otherwise.",
      },
      {
        title: "6. Limitation of liability",
        body:
          "PocketGPT is not responsible for delays caused by third-party payment systems, email services, hosting providers, network outages, user actions, or device incompatibility outside the reasonable control of the service.",
      },
      {
        title: "7. Agreement before payment",
        body:
          "Before making payment, the user must confirm agreement with these payment terms and the refund policy. Without such confirmation, payment must not be completed.",
      },
    ],
    footer:
      "If the user does not agree with these terms, they must not complete the payment.",
  },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return localStorage.getItem("site_lang") === "en" ? "en" : "ru";
}

export default function TermsPage() {
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
