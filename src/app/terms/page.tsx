"use client";

import { useEffect, useState } from "react";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_OPERATOR_ADDRESS,
  LEGAL_OPERATOR_ID,
  LEGAL_OPERATOR_NAME,
  PAYMENT_TERMS_VERSION,
} from "@/lib/legal";

type Lang = "ru" | "en" | "kz";

type LegalText = {
  title: string;
  updated: string;
  version: string;
  intro: string;
  highlights: readonly { label: string; value: string }[];
  sections: readonly LegalSection[];
  notice: string;
  relatedLabel: string;
  relatedText: string;
  operator: string;
  contact: string;
};

const TEXT: Record<Lang, LegalText> = {
  ru: {
    title: "Пользовательское соглашение и условия подписки",
    updated: "Действует с",
    version: "Версия документа",
    intro:
      "Настоящее соглашение регулирует использование PocketGPT, покупку цифрового доступа и оформление ежемесячных подписок. Подтверждая согласие на странице оплаты, пользователь заключает соглашение с оператором PocketGPT и отдельно разрешает PayPal выполнять регулярные списания до отмены подписки.",
    highlights: [
      { label: "Период", value: "Ежемесячно" },
      { label: "Продление", value: "Автоматическое" },
      { label: "Отмена", value: "В любое время" },
      { label: "После отмены", value: "Доступ до конца периода" },
    ],
    sections: [
      {
        title: "1. Принятие соглашения",
        paragraphs: [
          "Соглашение принимается при регистрации, использовании сервиса либо установке обязательной галочки перед оплатой. Если пользователь не согласен с условиями, он не должен оформлять подписку или использовать платные функции.",
          "Согласие с подпиской является отдельным осознанным действием: галочка не устанавливается заранее, а оформление продолжается только после явного подтверждения пользователя.",
        ],
      },
      {
        title: "2. Сервис, аккаунт и устройство",
        paragraphs: [
          "PocketGPT предоставляет цифровой доступ к облачным функциям устройства, обработке запросов, истории, Connect и другим возможностям выбранного тарифа. Подписка привязывается к конкретному аккаунту, устройству и тарифному плану.",
          "Пользователь обязан проверить выбранное устройство и тариф до подтверждения PayPal. Передача устройства или доступа к аккаунту третьему лицу не переносит автоматически права и обязанности по подписке.",
        ],
      },
      {
        title: "3. Тарифы, лимиты и расчётный период",
        paragraphs: [
          "Цена, лимит запросов, наличие Connect, расчётный период и точная сумма списания отображаются до подтверждения платежа. Если в тарифе предусмотрен лимит, он применяется к каждому оплаченному периоду.",
          "Неиспользованные запросы не переносятся на следующий период, если на странице тарифа прямо не указано иное. Промокоды и бесплатные начисления не являются автоматически продлеваемой подпиской и учитываются отдельно.",
        ],
      },
      {
        title: "4. Ежемесячное автоматическое продление",
        paragraphs: [
          "Оформляя подписку, пользователь поручает PayPal автоматически списывать стоимость выбранного тарифа каждый месяц до отмены. Повторное ручное подтверждение каждого списания не требуется.",
          "Дата первого и следующего списания отображается в разделе оплаты и может зависеть от уже действующего оплаченного или пробного периода. При наличии действующего доступа начало новой подписки может быть запланировано на дату его окончания.",
        ],
      },
      {
        title: "5. Платёжный провайдер, валюта и конвертация",
        paragraphs: [
          "Платёж и хранение платёжного разрешения выполняет PayPal. PocketGPT не получает полный номер банковской карты и не хранит карточные реквизиты пользователя.",
          "Цена тарифа показывается в тенге, а фактическое регулярное списание PayPal может проводиться в USD. Точная сумма в валюте PayPal отображается до подтверждения. Банк или PayPal могут применить собственный курс, комиссию или правила конвертации, которые не устанавливаются PocketGPT.",
        ],
      },
      {
        title: "6. Активация и начисление доступа",
        paragraphs: [
          "Доступ и лимиты начисляются после подтверждённого платежа и получения сервером достоверного уведомления PayPal. Статус интерфейса сам по себе не заменяет подтверждение платёжного провайдера.",
          "При технической задержке уведомления начисление может произойти позднее. Повторная доставка события PayPal не должна приводить к двойному начислению одного и того же платежа.",
        ],
      },
      {
        title: "7. Отмена автопродления",
        paragraphs: [
          "Пользователь может отключить автопродление в разделе «Оплата». Отмена прекращает будущие списания, но не аннулирует уже оплаченный период: доступ сохраняется до указанной даты окончания.",
          "После отмены подписка обычно не может быть возобновлена тем же платёжным соглашением; для продолжения может потребоваться оформить новую подписку. Отмена автопродления не означает автоматический возврат уже списанных средств.",
        ],
      },
      {
        title: "8. Неудачные списания, приостановка и возврат платежа",
        paragraphs: [
          "Если PayPal или банк отклоняет регулярный платёж, PayPal может повторить попытку в соответствии со своими правилами. PocketGPT вправе приостановить или не продлевать платный доступ до успешной оплаты.",
          "При возврате, отмене, reversal или обоснованном споре по платежу PocketGPT вправе скорректировать связанный доступ и лимиты с учётом уже использованного сервиса и требований применимого законодательства.",
        ],
      },
      {
        title: "9. Изменение тарифа, цены и условий",
        paragraphs: [
          "Изменения цены и состава тарифа применяются к будущим периодам. Если изменение требует нового согласия пользователя или нового плана PayPal, PocketGPT запросит повторное подтверждение до нового списания.",
          "Оплаченный период не сокращается задним числом. Существенные изменения условий публикуются на сайте с новой версией и датой вступления в силу.",
        ],
      },
      {
        title: "10. Доступность сервиса и обновления",
        paragraphs: [
          "PocketGPT стремится поддерживать работоспособность сервиса, но не гарантирует абсолютную непрерывность. Возможны технические работы, обновления, сбои сети, PayPal, хостинга, внешних AI-сервисов или интернет-провайдера.",
          "OTA-обновления и изменения программных функций могут устанавливаться для исправления ошибок, безопасности и совместимости. Обязательное обновление может быть необходимо для дальнейшей работы отдельных функций.",
        ],
      },
      {
        title: "11. Безопасность и допустимое использование",
        paragraphs: [
          "Пользователь отвечает за сохранность аккаунта, пароля, устройства и доступа к электронной почте. О подозрительной активности необходимо сообщить через опубликованный канал поддержки.",
        ],
        bullets: [
          "нельзя обходить лимиты, защиту, авторизацию или ограничения подписки;",
          "нельзя использовать сервис для незаконных действий, атак, мошенничества или нарушения прав третьих лиц;",
          "нельзя перепродавать цифровой доступ без письменного разрешения оператора.",
        ],
      },
      {
        title: "12. Возвраты и права потребителя",
        paragraphs: [
          "Порядок возврата регулируется отдельной Политикой возврата. Никакое положение настоящего соглашения не исключает права потребителя, которые нельзя ограничить соглашением по законодательству Республики Казахстан.",
          "Если условие соглашения противоречит обязательной норме закона, применяется обязательная норма, а остальные положения продолжают действовать в допустимой части.",
        ],
      },
      {
        title: "13. Ответственность",
        paragraphs: [
          "Оператор отвечает за сервис в пределах, установленных применимым законодательством. Ограничения ответственности не применяются к случаям, когда ответственность нельзя исключить или ограничить законом.",
          "Оператор не отвечает за решения, принятые пользователем исключительно на основании AI-ответа, а также за последствия неверных исходных данных, отсутствия интернета, действий банка, PayPal или иных независимых третьих лиц.",
        ],
      },
      {
        title: "14. Претензии, доказательства согласия и применимое право",
        paragraphs: [
          "Для подтверждения операции PocketGPT может хранить дату согласия, версию документов, язык, аккаунт, устройство, тариф, сумму, идентификатор PayPal и статус подписки. Эти сведения используются для исполнения договора, поддержки и разрешения споров.",
          "Претензия должна содержать email аккаунта, UID устройства, тариф, дату операции, идентификатор PayPal и описание проблемы. Ответ предоставляется в срок, установленный законодательством Республики Казахстан.",
          "К отношениям применяется законодательство Республики Казахстан. До обращения в суд стороны стремятся урегулировать спор путём претензии и обмена подтверждающими материалами.",
        ],
      },
    ],
    notice:
      "Важно: подписка продлевается и оплачивается автоматически каждый месяц, пока пользователь не отключит автопродление. Отмена прекращает будущие списания, но не отменяет уже оплаченный период.",
    relatedLabel: "Связанный документ",
    relatedText: "Политика возврата",
    operator: "Оператор сервиса",
    contact: "Контакт для претензий",
  },
  en: {
    title: "User Agreement and Subscription Terms",
    updated: "Effective from",
    version: "Document version",
    intro:
      "This agreement governs the use of PocketGPT, purchases of digital access, and monthly subscriptions. By confirming consent on the billing page, the user enters into an agreement with the PocketGPT operator and separately authorizes PayPal to make recurring charges until cancellation.",
    highlights: [
      { label: "Billing period", value: "Monthly" },
      { label: "Renewal", value: "Automatic" },
      { label: "Cancellation", value: "At any time" },
      { label: "After cancellation", value: "Access through paid period" },
    ],
    sections: [
      {
        title: "1. Acceptance",
        paragraphs: [
          "This agreement is accepted when the user registers, uses the service, or checks the mandatory consent box before payment. A user who does not agree must not start a subscription or use paid features.",
          "Subscription consent is a separate affirmative action: the box is not pre-selected and checkout proceeds only after explicit confirmation.",
        ],
      },
      {
        title: "2. Service, account, and device",
        paragraphs: [
          "PocketGPT provides digital access to device cloud functions, request processing, history, Connect, and other features included in the selected plan. A subscription is linked to a specific account, device, and plan.",
          "The user must verify the selected device and plan before PayPal approval. Transferring the device or sharing an account does not automatically transfer the subscription agreement.",
        ],
      },
      {
        title: "3. Plans, limits, and billing period",
        paragraphs: [
          "The price, request limit, Connect inclusion, billing period, and exact provider charge are displayed before approval. Plan limits apply to each paid period.",
          "Unused requests do not roll over unless the plan page expressly says otherwise. Promo codes and complimentary credits are not recurring subscriptions and are tracked separately.",
        ],
      },
      {
        title: "4. Monthly automatic renewal",
        paragraphs: [
          "By subscribing, the user authorizes PayPal to charge the selected plan every month until cancellation. No separate manual approval is required for each renewal charge.",
          "The first and next billing dates are displayed in Billing and may account for an existing trial or paid period. A new subscription may be scheduled to start after current access ends.",
        ],
      },
      {
        title: "5. Payment provider, currency, and conversion",
        paragraphs: [
          "PayPal processes payments and stores the recurring payment authorization. PocketGPT does not receive or store the full bank card number.",
          "Plan prices are displayed in KZT, while the recurring PayPal charge may be processed in USD. The exact provider amount is shown before approval. PayPal or the user’s bank may apply its own exchange rate, fee, or conversion rules.",
        ],
      },
      {
        title: "6. Activation and access allocation",
        paragraphs: [
          "Access and quotas are allocated after a confirmed payment and a valid PayPal notification reaches the server. A visual checkout status alone is not a substitute for provider confirmation.",
          "If provider notification is delayed, allocation may occur later. Re-delivery of the same PayPal event must not produce duplicate credit for the same payment.",
        ],
      },
      {
        title: "7. Cancelling automatic renewal",
        paragraphs: [
          "The user may disable automatic renewal in Billing. Cancellation stops future charges but does not void the already paid period; access remains available until the displayed end date.",
          "A cancelled PayPal subscription generally cannot be reactivated under the same billing agreement, so a new subscription may be required. Cancelling renewal does not automatically refund an earlier charge.",
        ],
      },
      {
        title: "8. Failed charges, suspension, and reversals",
        paragraphs: [
          "If PayPal or the issuing bank declines a recurring charge, PayPal may retry under its rules. PocketGPT may suspend or decline to renew paid access until payment succeeds.",
          "If a payment is refunded, reversed, cancelled, or validly disputed, PocketGPT may adjust the related access and quotas, considering prior use and mandatory law.",
        ],
      },
      {
        title: "9. Plan, price, and terms changes",
        paragraphs: [
          "Changes to price or plan contents apply to future periods. Where a change requires fresh consent or a new PayPal plan, PocketGPT will request confirmation before a new charge.",
          "An already paid period is not shortened retroactively. Material terms updates are published with a new version and effective date.",
        ],
      },
      {
        title: "10. Availability and updates",
        paragraphs: [
          "PocketGPT aims to maintain service availability but does not promise uninterrupted operation. Maintenance and outages may involve networks, PayPal, hosting, external AI providers, or internet providers.",
          "OTA updates and software changes may be delivered for bug fixes, security, and compatibility. A mandatory update may be required for certain functions to continue operating.",
        ],
      },
      {
        title: "11. Security and acceptable use",
        paragraphs: [
          "The user is responsible for account credentials, the device, and access to the registered email. Suspicious activity should be reported through the published support channel.",
        ],
        bullets: [
          "do not bypass quotas, security, authorization, or subscription restrictions;",
          "do not use the service for illegal activity, attacks, fraud, or infringement of third-party rights;",
          "do not resell digital access without written authorization.",
        ],
      },
      {
        title: "12. Refunds and consumer rights",
        paragraphs: [
          "Refunds are governed by the separate Refund Policy. Nothing in this agreement excludes consumer rights that cannot legally be waived under the laws of the Republic of Kazakhstan.",
          "If any term conflicts with mandatory law, the mandatory rule prevails and the remaining terms continue to apply to the extent permitted.",
        ],
      },
      {
        title: "13. Liability",
        paragraphs: [
          "The operator is liable within the limits required by applicable law. No limitation applies where liability cannot legally be excluded or limited.",
          "The operator is not responsible for decisions made solely from AI output, incorrect user input, lack of internet access, or actions of banks, PayPal, and other independent third parties.",
        ],
      },
      {
        title: "14. Claims, consent evidence, and governing law",
        paragraphs: [
          "PocketGPT may retain the consent date, document versions, language, account, device, plan, amount, PayPal identifier, and subscription status to perform the agreement, provide support, and resolve disputes.",
          "A claim should include the account email, device UID, plan, transaction date, PayPal identifier, and description. A response is provided within the period required by Kazakhstan law.",
          "The laws of the Republic of Kazakhstan govern the relationship. Before court proceedings, the parties should attempt to resolve the dispute through a written claim and supporting records.",
        ],
      },
    ],
    notice:
      "Important: the subscription renews and is charged automatically every month until the user disables automatic renewal. Cancellation stops future charges but does not cancel an already paid period.",
    relatedLabel: "Related document",
    relatedText: "Refund Policy",
    operator: "Service operator",
    contact: "Claims contact",
  },
  kz: {
    title: "Пайдаланушы келісімі және жазылым шарттары",
    updated: "Күшіне енген күні",
    version: "Құжат нұсқасы",
    intro:
      "Бұл келісім PocketGPT сервисін пайдалануды, цифрлық қолжетімділікті сатып алуды және ай сайынғы жазылымдарды рәсімдеуді реттейді. Төлем бетінде келісімді растау арқылы пайдаланушы PocketGPT операторымен келісім жасайды және PayPal-ға жазылым тоқтатылғанға дейін тұрақты төлем алуға жеке рұқсат береді.",
    highlights: [
      { label: "Төлем кезеңі", value: "Ай сайын" },
      { label: "Ұзарту", value: "Автоматты" },
      { label: "Бас тарту", value: "Кез келген уақытта" },
      { label: "Бас тартқаннан кейін", value: "Төленген кезең соңына дейін" },
    ],
    sections: [
      {
        title: "1. Келісімді қабылдау",
        paragraphs: [
          "Келісім тіркелу, сервисті пайдалану немесе төлем алдында міндетті белгіні қою арқылы қабылданады. Шарттармен келіспейтін пайдаланушы жазылым рәсімдемеуі және ақылы функцияларды пайдаланбауы тиіс.",
          "Жазылымға келісім — жеке саналы әрекет: белгі алдын ала қойылмайды, төлем тек пайдаланушының нақты растауынан кейін жалғасады.",
        ],
      },
      {
        title: "2. Сервис, аккаунт және құрылғы",
        paragraphs: [
          "PocketGPT құрылғының бұлттық функцияларына, сұрауларды өңдеуге, тарихқа, Connect мүмкіндігіне және таңдалған тарифтің өзге функцияларына цифрлық қолжетімділік береді. Жазылым нақты аккаунтқа, құрылғыға және тарифке байланысады.",
          "PayPal растауына дейін пайдаланушы құрылғы мен тарифті тексеруі тиіс. Құрылғыны беру немесе аккаунтты бөлісу жазылым бойынша құқықтар мен міндеттерді автоматты түрде ауыстырмайды.",
        ],
      },
      {
        title: "3. Тарифтер, лимиттер және төлем кезеңі",
        paragraphs: [
          "Баға, сұрау лимиті, Connect-тің болуы, төлем кезеңі және провайдердің нақты алатын сомасы растауға дейін көрсетіледі. Лимит әр төленген кезеңге қолданылады.",
          "Тариф бетінде өзгеше көрсетілмесе, пайдаланылмаған сұраулар келесі кезеңге өтпейді. Промокодтар мен тегін берілген сұраулар автоматты жазылым болып саналмайды және бөлек есептеледі.",
        ],
      },
      {
        title: "4. Ай сайынғы автоматты ұзарту",
        paragraphs: [
          "Жазылым рәсімдеу арқылы пайдаланушы PayPal-ға таңдалған тариф құнын бас тартқанға дейін ай сайын автоматты түрде алуға рұқсат береді. Әр төлемді қайта қолмен растау талап етілмейді.",
          "Алғашқы және келесі төлем күні «Төлем» бөлімінде көрсетіледі және қолданыстағы сынақ немесе төленген кезеңді ескеруі мүмкін. Жаңа жазылым ағымдағы қолжетімділік аяқталғаннан кейін басталуы мүмкін.",
        ],
      },
      {
        title: "5. Төлем провайдері, валюта және айырбастау",
        paragraphs: [
          "Төлемді және тұрақты төлем рұқсатын PayPal өңдейді. PocketGPT банк картасының толық нөмірін алмайды және сақтамайды.",
          "Тариф бағасы теңгемен көрсетіледі, ал PayPal тұрақты төлемді USD валютасында жүргізуі мүмкін. Нақты сома растауға дейін көрсетіледі. PayPal немесе банк өзінің айырбас бағамын, комиссиясын және конвертация ережесін қолдануы мүмкін.",
        ],
      },
      {
        title: "6. Қолжетімділікті іске қосу және есептеу",
        paragraphs: [
          "Қолжетімділік пен лимиттер расталған төлемнен және серверге PayPal-дың дұрыс хабарламасы келгеннен кейін беріледі. Интерфейстегі төлем статусы провайдердің растауын алмастырмайды.",
          "Хабарлама кешіксе, қолжетімділік кейінірек берілуі мүмкін. Бір PayPal оқиғасының қайта жеткізілуі бір төлемді екі рет есептеуге әкелмеуі тиіс.",
        ],
      },
      {
        title: "7. Автоматты ұзартудан бас тарту",
        paragraphs: [
          "Пайдаланушы «Төлем» бөлімінде автоматты ұзартуды өшіре алады. Бас тарту болашақ төлемдерді тоқтатады, бірақ төленген кезеңді жоймайды: қолжетімділік көрсетілген күнге дейін сақталады.",
          "PayPal-да тоқтатылған жазылым әдетте сол төлем келісімімен қайта қосылмайды, сондықтан жаңа жазылым рәсімдеу қажет болуы мүмкін. Ұзартудан бас тарту бұрын алынған төлемді автоматты түрде қайтармайды.",
        ],
      },
      {
        title: "8. Сәтсіз төлемдер, тоқтату және қайтару",
        paragraphs: [
          "PayPal немесе банк тұрақты төлемді қабылдамаса, PayPal өз ережелеріне сәйкес қайта әрекет етуі мүмкін. Сәтті төлемге дейін PocketGPT ақылы қолжетімділікті тоқтатуға немесе ұзартпауға құқылы.",
          "Төлем қайтарылса, кері қайтарылса, жойылса немесе негізді дауға айналса, PocketGPT қолданылған сервис пен міндетті заң талаптарын ескере отырып, байланысты қолжетімділік пен лимиттерді түзете алады.",
        ],
      },
      {
        title: "9. Тариф, баға және шарттардың өзгеруі",
        paragraphs: [
          "Баға мен тариф құрамының өзгерістері болашақ кезеңдерге қолданылады. Өзгеріс жаңа келісімді немесе жаңа PayPal жоспарын талап етсе, жаңа төлемге дейін пайдаланушыдан растау сұралады.",
          "Төленген кезең кері күшпен қысқартылмайды. Маңызды өзгерістер жаңа нұсқамен және күшіне ену күнімен жарияланады.",
        ],
      },
      {
        title: "10. Сервистің қолжетімділігі және жаңартулар",
        paragraphs: [
          "PocketGPT сервистің тұрақты жұмысын қамтамасыз етуге тырысады, бірақ үздіксіз жұмысқа абсолютті кепілдік бермейді. Техникалық қызмет, желі, PayPal, хостинг, сыртқы AI сервистері немесе интернет-провайдер ақаулары болуы мүмкін.",
          "Қателерді түзету, қауіпсіздік және үйлесімділік үшін OTA жаңартулары мен бағдарламалық өзгерістер жіберілуі мүмкін. Кейбір функциялардың жұмысы үшін міндетті жаңарту қажет болуы ықтимал.",
        ],
      },
      {
        title: "11. Қауіпсіздік және рұқсат етілген пайдалану",
        paragraphs: [
          "Пайдаланушы аккаунттың, парольдің, құрылғының және тіркелген email-ға қолжетімділіктің қауіпсіздігіне жауап береді. Күдікті әрекет туралы жарияланған қолдау арнасына хабарлау қажет.",
        ],
        bullets: [
          "лимиттерді, қауіпсіздікті, авторизацияны немесе жазылым шектеулерін айналып өтуге болмайды;",
          "сервисті заңсыз әрекет, шабуыл, алаяқтық немесе үшінші тұлғалардың құқықтарын бұзу үшін қолдануға болмайды;",
          "оператордың жазбаша рұқсатынсыз цифрлық қолжетімділікті қайта сатуға болмайды.",
        ],
      },
      {
        title: "12. Қайтару және тұтынушы құқықтары",
        paragraphs: [
          "Қайтару тәртібі бөлек Қайтару саясатымен реттеледі. Бұл келісім Қазақстан Республикасының заңнамасы бойынша шектеуге болмайтын тұтынушы құқықтарын алып тастамайды.",
          "Келісімнің қандай да бір шарты міндетті заң нормасына қайшы болса, міндетті норма қолданылады, ал қалған шарттар рұқсат етілген бөлігінде күшін сақтайды.",
        ],
      },
      {
        title: "13. Жауапкершілік",
        paragraphs: [
          "Оператор қолданылатын заң талап ететін шекте жауап береді. Заң бойынша жауапкершілікті алып тастауға немесе шектеуге болмайтын жағдайларға шектеу қолданылмайды.",
          "Оператор тек AI жауабына сүйеніп қабылданған шешімдерге, пайдаланушының қате деректеріне, интернеттің болмауына немесе банк, PayPal және тәуелсіз үшінші тұлғалардың әрекеттеріне жауап бермейді.",
        ],
      },
      {
        title: "14. Шағымдар, келісім дәлелі және қолданылатын құқық",
        paragraphs: [
          "PocketGPT келісім күні, құжат нұсқалары, тіл, аккаунт, құрылғы, тариф, сома, PayPal идентификаторы және жазылым статусын шартты орындау, қолдау және дауларды шешу үшін сақтай алады.",
          "Шағымда аккаунт email-ы, құрылғы UID-і, тариф, операция күні, PayPal идентификаторы және мәселе сипаттамасы болуы тиіс. Жауап Қазақстан заңнамасында белгіленген мерзімде беріледі.",
          "Қатынастарға Қазақстан Республикасының заңнамасы қолданылады. Сотқа дейін тараптар жазбаша шағым және дәлелдер арқылы дауды шешуге тырысады.",
        ],
      },
    ],
    notice:
      "Маңызды: пайдаланушы автоматты ұзартуды өшірмейінше, жазылым ай сайын автоматты түрде ұзартылып, төлем алынады. Бас тарту болашақ төлемдерді тоқтатады, бірақ төленген кезеңді жоймайды.",
    relatedLabel: "Байланысты құжат",
    relatedText: "Қайтару саясаты",
    operator: "Сервис операторы",
    contact: "Шағымдар үшін байланыс",
  },
};

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const saved = localStorage.getItem("site_lang") || localStorage.getItem("lang");
  if (saved === "en") return "en";
  if (saved === "kz" || saved === "kk") return "kz";
  return "ru";
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
    <LegalDocument
      title={t.title}
      updatedLabel={t.updated}
      effectiveDate={LEGAL_EFFECTIVE_DATE[lang]}
      versionLabel={t.version}
      version={PAYMENT_TERMS_VERSION}
      intro={t.intro}
      highlights={t.highlights}
      sections={t.sections}
      notice={t.notice}
      relatedLabel={t.relatedLabel}
      relatedHref="/refund-policy"
      relatedText={t.relatedText}
      operatorLabel={t.operator}
      operatorName={LEGAL_OPERATOR_NAME}
      contactLabel={t.contact}
      contactEmail={LEGAL_CONTACT_EMAIL}
      registrationLabel={lang === "ru" ? "Регистрационные данные" : lang === "en" ? "Registration details" : "Тіркеу деректері"}
      operatorId={LEGAL_OPERATOR_ID}
      addressLabel={lang === "ru" ? "Адрес" : lang === "en" ? "Address" : "Мекенжай"}
      operatorAddress={LEGAL_OPERATOR_ADDRESS}
    />
  );
}
