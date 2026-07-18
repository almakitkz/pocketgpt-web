"use client";

import { useEffect, useState } from "react";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_SERVICE_NAME,
  PAYMENT_REFUND_POLICY_VERSION,
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
    title: "Политика отмены и возврата",
    updated: "Действует с",
    version: "Версия документа",
    intro:
      "Эта политика объясняет разницу между отключением автопродления и возвратом уже списанных средств. Она применяется к первой и последующим ежемесячным оплатам PocketGPT через PayPal и действует с учётом обязательных прав потребителя по законодательству Республики Казахстан.",
    highlights: [
      { label: "Отмена подписки", value: "Останавливает будущие списания" },
      { label: "Оплаченный период", value: "Сохраняется до даты окончания" },
      { label: "Возврат", value: "Рассматривается по обстоятельствам" },
      { label: "Ответ на претензию", value: "В установленный законом срок" },
    ],
    sections: [
      {
        title: "1. Отмена автопродления и возврат — разные действия",
        paragraphs: [
          "Отключение автопродления прекращает будущие ежемесячные списания. Уже оплаченный период продолжает действовать до даты окончания, указанной в разделе оплаты.",
          "Отмена подписки не создаёт автоматического права на возврат последнего платежа. Запрос на возврат рассматривается отдельно по этой политике и применимому законодательству.",
        ],
      },
      {
        title: "2. Цифровой характер услуги",
        paragraphs: [
          "PocketGPT предоставляет цифровой доступ, который обычно активируется сразу после подтверждения платежа: начисляются запросы, срок доступа и функции тарифа. После фактического предоставления и использования цифровой услуги возврат за уже начавшийся период не является автоматическим.",
          "При этом настоящая политика не ограничивает права пользователя, которые нельзя исключить соглашением по закону.",
        ],
      },
      {
        title: "3. Когда возврат может быть одобрен",
        paragraphs: [
          "Возврат полностью или частично может быть одобрен после проверки, если подтверждено одно из следующих обстоятельств:",
        ],
        bullets: [
          "один и тот же платёж был списан дважды по технической ошибке;",
          "платёж подтверждён, но доступ не был предоставлен по вине PocketGPT и проблема не устранена в разумный срок;",
          "списание признано несанкционированным после проверки аккаунта, PayPal и доступных технических данных;",
          "возврат прямо обязателен по применимому законодательству;",
          "оператор добровольно одобрил возврат с учётом обстоятельств и фактического использования сервиса.",
        ],
      },
      {
        title: "4. Случаи, которые обычно не являются основанием для возврата",
        bullets: [
          "пользователь забыл отключить автопродление до даты следующего списания;",
          "пользователь изменил решение после активации или не использовал уже доступный сервис;",
          "был выбран не тот тариф или не то устройство, хотя данные были показаны до подтверждения;",
          "неиспользованные запросы остались на конец оплаченного периода;",
          "банк или PayPal применил собственный курс, комиссию или конвертацию;",
          "сервис не работал из-за отсутствия интернета, ограничений банка, устройства пользователя или независимой третьей стороны;",
          "платёж относится к периоду, в котором доступ уже использовался, если закон не требует иного.",
        ],
      },
      {
        title: "5. Регулярные списания",
        paragraphs: [
          "Перед оформлением подписки пользователь видит, что оплата является ежемесячной и автоматически продлеваемой. Точная сумма PayPal, выбранный тариф и возможность отмены отображаются до подтверждения.",
          "Чтобы избежать следующего списания, автопродление нужно отключить до даты следующего платежа. Дата отображается в разделе оплаты, а фактическое время обработки может зависеть от PayPal и часового пояса провайдера.",
        ],
      },
      {
        title: "6. Неудачный платёж, reversal и chargeback",
        paragraphs: [
          "Отклонённая попытка списания сама по себе не создаёт платёж и не требует возврата. Если PayPal позже успешно проводит повторную попытку, она считается оплатой нового расчётного периода.",
          "Если пользователь открывает спор или chargeback, PocketGPT вправе временно ограничить связанный доступ до завершения проверки. При подтверждённом возврате или reversal доступ и лимиты могут быть скорректированы, чтобы исключить одновременное сохранение возвращённых средств и оплаченного цифрового доступа.",
        ],
      },
      {
        title: "7. Как подать запрос",
        paragraphs: [
          "Запрос направляется через опубликованный канал поддержки. Для быстрой проверки необходимо указать:",
        ],
        bullets: [
          "email аккаунта PocketGPT;",
          "UID устройства и название тарифа;",
          "дату и сумму платежа;",
          "PayPal Subscription ID, Transaction ID или Sale ID;",
          "причину запроса и описание технической проблемы;",
          "при необходимости — скриншоты или другие подтверждающие материалы.",
        ],
      },
      {
        title: "8. Проверка и срок ответа",
        paragraphs: [
          "Оператор проверяет данные PocketGPT, историю доступа, фактическое использование, статус PayPal и возможные повторные начисления. При необходимости у пользователя могут запросить дополнительные сведения.",
          "Письменный ответ на претензию предоставляется в срок, установленный законодательством Республики Казахстан. Отсчёт начинается после получения достаточных данных для идентификации операции и заявителя.",
        ],
      },
      {
        title: "9. Способ и срок возврата",
        paragraphs: [
          "Одобренный возврат обычно направляется через PayPal на исходный источник оплаты. Срок зачисления зависит от PayPal, банка, платёжной системы и валютной конвертации и может отличаться от даты принятия решения PocketGPT.",
          "PocketGPT не может гарантировать курс конвертации или возврат банковской комиссии, которая была удержана независимым банком или платёжным провайдером.",
        ],
      },
      {
        title: "10. Частичный возврат",
        paragraphs: [
          "Если возврат не обязателен по закону, но оператор принимает решение о частичном возврате, могут учитываться фактически использованные запросы, длительность предоставленного доступа, активность Connect и расходы платёжного провайдера.",
          "Частичный возврат не применяется автоматически и требует отдельного решения по конкретной операции.",
        ],
      },
      {
        title: "11. Злоупотребления",
        paragraphs: [
          "Предоставление ложных данных, повторные необоснованные споры, попытка сохранить доступ после полного возврата или использование нескольких аккаунтов для обхода правил может привести к отказу в добровольном возврате и ограничению аккаунта в пределах закона.",
        ],
      },
      {
        title: "12. Сохранение обязательных прав",
        paragraphs: [
          "Никакое положение этой политики не отменяет права потребителя, установленные законодательством Республики Казахстан. Если отдельное положение противоречит обязательной норме, применяется обязательная норма закона.",
          "Возвраты в электронной торговле осуществляются с учётом законодательства о защите прав потребителей и правил электронной торговли.",
        ],
      },
    ],
    notice:
      "Чтобы прекратить будущие платежи, отключи автопродление до следующей даты списания. Для возврата уже списанных средств необходимо отдельное обращение; отмена подписки и возврат не являются одним действием.",
    relatedLabel: "Связанный документ",
    relatedText: "Пользовательское соглашение и условия подписки",
    operator: "Сервис",
    contact: "Контакт для претензий",
  },
  en: {
    title: "Cancellation and Refund Policy",
    updated: "Effective from",
    version: "Document version",
    intro:
      "This policy explains the difference between disabling automatic renewal and refunding a completed charge. It applies to initial and recurring PocketGPT payments through PayPal and preserves mandatory consumer rights under the laws of the Republic of Kazakhstan.",
    highlights: [
      { label: "Subscription cancellation", value: "Stops future charges" },
      { label: "Paid period", value: "Continues through its end date" },
      { label: "Refund", value: "Reviewed on the facts" },
      { label: "Claim response", value: "Within the legally required period" },
    ],
    sections: [
      {
        title: "1. Cancellation and refund are different actions",
        paragraphs: [
          "Disabling automatic renewal stops future monthly charges. The current paid period remains available until the end date displayed in Billing.",
          "Cancelling a subscription does not automatically create a right to refund the latest payment. A refund request is reviewed separately under this policy and applicable law.",
        ],
      },
      {
        title: "2. Digital nature of the service",
        paragraphs: [
          "PocketGPT provides digital access that is normally activated immediately after payment confirmation, including requests, an access period, and plan features. Once digital access has been delivered and used, a refund for the started period is not automatic.",
          "This policy does not limit rights that cannot legally be waived.",
        ],
      },
      {
        title: "3. When a refund may be approved",
        paragraphs: [
          "A full or partial refund may be approved after review where one of the following is confirmed:",
        ],
        bullets: [
          "the same payment was charged twice due to a technical error;",
          "payment succeeded but access was not delivered because of a PocketGPT fault and was not restored within a reasonable time;",
          "the charge is found unauthorized after review of the account, PayPal records, and available technical data;",
          "a refund is required by applicable law;",
          "the operator voluntarily approves a refund considering the circumstances and actual service use.",
        ],
      },
      {
        title: "4. Situations that generally do not justify a refund",
        bullets: [
          "the user forgot to cancel renewal before the next billing date;",
          "the user changed their mind after activation or did not use an available service;",
          "the wrong plan or device was selected although the details were shown before approval;",
          "unused requests remained at the end of the paid period;",
          "PayPal or the bank applied its own exchange rate, fee, or conversion;",
          "the service was unavailable because of the user’s internet, bank restrictions, device, or an independent third party;",
          "the charge covers a period in which access was already used, unless law requires otherwise.",
        ],
      },
      {
        title: "5. Recurring charges",
        paragraphs: [
          "Before subscribing, the user is shown that billing is monthly and automatically renewing. The exact PayPal amount, selected plan, and cancellation option are displayed before approval.",
          "To avoid the next charge, automatic renewal must be disabled before the next billing date. The date is shown in Billing, while actual processing time may depend on PayPal and provider time zones. The recorded checkbox acceptance and PayPal approval are used as evidence of consent to recurring billing.",
        ],
      },
      {
        title: "6. Failed payment, reversal, and chargeback",
        paragraphs: [
          "A declined charge attempt is not a completed payment and does not require a refund. If PayPal later completes a retry, it is treated as payment for a new billing period.",
          "If the user opens a dispute or chargeback, PocketGPT may temporarily restrict related access while the case is reviewed. After a confirmed refund or reversal, access and quotas may be adjusted so that refunded funds and paid digital access are not retained at the same time.",
        ],
      },
      {
        title: "7. How to submit a request",
        paragraphs: [
          "A request should be sent through the published support channel and include:",
        ],
        bullets: [
          "the PocketGPT account email;",
          "device UID and plan name;",
          "payment date and amount;",
          "PayPal Subscription ID, Transaction ID, or Sale ID;",
          "the reason for the request and a description of any technical issue;",
          "screenshots or other supporting records when relevant.",
        ],
      },
      {
        title: "8. Review and response time",
        paragraphs: [
          "The operator reviews PocketGPT records, access history, actual use, PayPal status, and possible duplicate allocation. Additional information may be requested.",
          "A written response is provided within the period required by Kazakhstan law. The review starts once enough information is available to identify the transaction and claimant.",
        ],
      },
      {
        title: "9. Refund method and timing",
        paragraphs: [
          "An approved refund is normally sent through PayPal to the original payment source. Posting time depends on PayPal, the bank, the card network, and currency conversion and may differ from the PocketGPT decision date.",
          "PocketGPT cannot guarantee an exchange rate or reimbursement of a fee charged independently by a bank or payment provider.",
        ],
      },
      {
        title: "10. Partial refunds",
        paragraphs: [
          "Where a refund is not legally mandatory but the operator approves a partial refund, actual requests used, access duration, Connect activity, and payment-provider costs may be considered.",
          "A partial refund is not automatic and requires an individual decision for the transaction.",
        ],
      },
      {
        title: "11. Abuse",
        paragraphs: [
          "False information, repeated bad-faith disputes, attempts to retain access after a full refund, or multiple accounts used to evade rules may result in denial of a voluntary refund and account restrictions to the extent permitted by law.",
        ],
      },
      {
        title: "12. Mandatory rights preserved",
        paragraphs: [
          "Nothing in this policy removes consumer rights under the laws of the Republic of Kazakhstan. If a provision conflicts with mandatory law, the mandatory rule applies.",
          "Refunds in electronic commerce are handled with regard to consumer-protection legislation and electronic-commerce rules.",
        ],
      },
    ],
    notice:
      "To stop future payments, disable automatic renewal before the next billing date. A separate request is required for a completed charge; subscription cancellation and refund are not the same action.",
    relatedLabel: "Related document",
    relatedText: "User Agreement and Subscription Terms",
    operator: "Service",
    contact: "Claims contact",
  },
  kz: {
    title: "Бас тарту және қайтару саясаты",
    updated: "Күшіне енген күні",
    version: "Құжат нұсқасы",
    intro:
      "Бұл саясат автоматты ұзартуды өшіру мен алынған төлемді қайтарудың айырмашылығын түсіндіреді. Ол PayPal арқылы жасалған алғашқы және кейінгі ай сайынғы PocketGPT төлемдеріне қолданылады және Қазақстан Республикасының заңнамасындағы міндетті тұтынушы құқықтарын сақтайды.",
    highlights: [
      { label: "Жазылымнан бас тарту", value: "Болашақ төлемдерді тоқтатады" },
      { label: "Төленген кезең", value: "Аяқталу күніне дейін қалады" },
      { label: "Қайтару", value: "Жағдай бойынша қаралады" },
      { label: "Шағымға жауап", value: "Заңдағы мерзімде" },
    ],
    sections: [
      {
        title: "1. Бас тарту мен қайтару — әртүрлі әрекеттер",
        paragraphs: [
          "Автоматты ұзартуды өшіру болашақ ай сайынғы төлемдерді тоқтатады. Ағымдағы төленген кезең «Төлем» бөліміндегі аяқталу күніне дейін қолжетімді болып қалады.",
          "Жазылымнан бас тарту соңғы төлемді автоматты түрде қайтармайды. Қайтару өтініші осы саясат пен қолданылатын заң бойынша бөлек қаралады.",
        ],
      },
      {
        title: "2. Қызметтің цифрлық сипаты",
        paragraphs: [
          "PocketGPT төлем расталғаннан кейін әдетте бірден цифрлық қолжетімділік береді: сұраулар, қолжетімділік кезеңі және тариф функциялары қосылады. Цифрлық қызмет беріліп, қолданылғаннан кейін басталған кезең үшін қайтару автоматты болмайды.",
          "Бұл саясат заң бойынша бас тартуға болмайтын құқықтарды шектемейді.",
        ],
      },
      {
        title: "3. Қайтару мақұлдануы мүмкін жағдайлар",
        paragraphs: [
          "Тексеруден кейін мына жағдайлардың бірі расталса, толық немесе ішінара қайтару мақұлдануы мүмкін:",
        ],
        bullets: [
          "бір төлем техникалық қате салдарынан екі рет алынған;",
          "төлем сәтті болғанымен, PocketGPT кінәсінен қолжетімділік берілмеген және мәселе ақылға қонымды мерзімде түзетілмеген;",
          "аккаунт, PayPal деректері және техникалық ақпарат тексерілгеннен кейін төлем рұқсатсыз деп танылған;",
          "қайтару қолданылатын заң бойынша міндетті;",
          "оператор жағдай мен нақты пайдалануды ескеріп, өз еркімен қайтаруды мақұлдаған.",
        ],
      },
      {
        title: "4. Әдетте қайтаруға негіз болмайтын жағдайлар",
        bullets: [
          "пайдаланушы келесі төлемге дейін автоматты ұзартуды өшіруді ұмытқан;",
          "іске қосылғаннан кейін шешімін өзгерткен немесе қолжетімді сервисті қолданбаған;",
          "растауға дейін ақпарат көрсетілсе де, қате тариф немесе құрылғы таңдалған;",
          "төленген кезең соңында пайдаланылмаған сұраулар қалған;",
          "PayPal немесе банк өз бағамын, комиссиясын немесе конвертациясын қолданған;",
          "мәселе пайдаланушы интернеті, банк шектеуі, құрылғысы немесе тәуелсіз үшінші тараптан болған;",
          "заң өзгеше талап етпесе, төлем қолжетімділік қолданылған кезеңге қатысты болған.",
        ],
      },
      {
        title: "5. Тұрақты төлемдер",
        paragraphs: [
          "Жазылым алдында пайдаланушы төлемнің ай сайынғы және автоматты ұзартылатын екенін көреді. PayPal-дың нақты сомасы, тариф және бас тарту мүмкіндігі растауға дейін көрсетіледі.",
          "Келесі төлемді болдырмау үшін автоматты ұзартуды төлем күніне дейін өшіру керек. Күн «Төлем» бөлімінде көрсетіледі, ал нақты өңдеу уақыты PayPal мен уақыт белдеуіне тәуелді болуы мүмкін.",
        ],
      },
      {
        title: "6. Сәтсіз төлем, reversal және chargeback",
        paragraphs: [
          "Қабылданбаған төлем әрекеті аяқталған төлем емес және қайтаруды қажет етпейді. PayPal кейін қайталап, төлемді сәтті өткізсе, ол жаңа есептік кезеңнің төлемі болып саналады.",
          "Пайдаланушы дау немесе chargeback ашса, тексеру аяқталғанға дейін PocketGPT байланысты қолжетімділікті уақытша шектей алады. Расталған қайтарудан кейін қайтарылған ақша мен ақылы қолжетімділікті қатар сақтамау үшін лимиттер түзетілуі мүмкін.",
        ],
      },
      {
        title: "7. Өтініш беру тәртібі",
        paragraphs: [
          "Өтініш жарияланған қолдау арнасы арқылы жіберіліп, мыналарды қамтуы тиіс:",
        ],
        bullets: [
          "PocketGPT аккаунтының email-ы;",
          "құрылғы UID-і және тариф атауы;",
          "төлем күні мен сомасы;",
          "PayPal Subscription ID, Transaction ID немесе Sale ID;",
          "өтініш себебі және техникалық мәселе сипаттамасы;",
          "қажет болса скриншоттар мен басқа дәлелдер.",
        ],
      },
      {
        title: "8. Тексеру және жауап мерзімі",
        paragraphs: [
          "Оператор PocketGPT жазбаларын, қолжетімділік тарихын, нақты пайдалануды, PayPal статусын және ықтимал қайталанған есептеуді тексереді. Қосымша ақпарат сұралуы мүмкін.",
          "Жазбаша жауап Қазақстан заңнамасында белгіленген мерзімде беріледі. Тексеру операция мен өтініш берушіні анықтауға жеткілікті ақпарат алынғаннан кейін басталады.",
        ],
      },
      {
        title: "9. Қайтару тәсілі мен мерзімі",
        paragraphs: [
          "Мақұлданған қайтару әдетте PayPal арқылы бастапқы төлем көзіне жіберіледі. Қаражаттың түсу мерзімі PayPal, банк, карта жүйесі және валюта конвертациясына байланысты.",
          "PocketGPT банк немесе төлем провайдері жеке ұстаған комиссияны немесе айырбас бағамын кепілдендіре алмайды.",
        ],
      },
      {
        title: "10. Ішінара қайтару",
        paragraphs: [
          "Қайтару заң бойынша міндетті болмаса, бірақ оператор ішінара қайтаруды мақұлдаса, қолданылған сұраулар, қолжетімділік ұзақтығы, Connect белсенділігі және төлем провайдерінің шығындары ескерілуі мүмкін.",
          "Ішінара қайтару автоматты емес және нақты операция бойынша жеке шешімді талап етеді.",
        ],
      },
      {
        title: "11. Теріс пайдалану",
        paragraphs: [
          "Жалған ақпарат, негізсіз қайталанатын даулар, толық қайтарудан кейін қолжетімділікті сақтауға әрекет ету немесе ережені айналып өту үшін бірнеше аккаунт қолдану заң рұқсат еткен шекте ерікті қайтарудан бас тартуға және аккаунтты шектеуге әкелуі мүмкін.",
        ],
      },
      {
        title: "12. Міндетті құқықтардың сақталуы",
        paragraphs: [
          "Бұл саясат Қазақстан Республикасының заңнамасындағы тұтынушы құқықтарын жоймайды. Егер ереже міндетті заң нормасына қайшы болса, заң нормасы қолданылады.",
          "Электрондық саудадағы қайтарулар тұтынушылардың құқықтарын қорғау туралы заңнама мен электрондық сауда ережелерін ескере отырып жүргізіледі.",
        ],
      },
    ],
    notice:
      "Болашақ төлемдерді тоқтату үшін автоматты ұзартуды келесі төлем күніне дейін өшір. Алынған төлемді қайтару үшін бөлек өтініш керек; жазылымнан бас тарту мен қайтару бір әрекет емес.",
    relatedLabel: "Байланысты құжат",
    relatedText: "Пайдаланушы келісімі және жазылым шарттары",
    operator: "Сервис",
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
    <LegalDocument
      title={t.title}
      updatedLabel={t.updated}
      effectiveDate={LEGAL_EFFECTIVE_DATE[lang]}
      versionLabel={t.version}
      version={PAYMENT_REFUND_POLICY_VERSION}
      intro={t.intro}
      highlights={t.highlights}
      sections={t.sections}
      notice={t.notice}
      relatedLabel={t.relatedLabel}
      relatedHref="/terms"
      relatedText={t.relatedText}
      serviceLabel={t.operator}
      serviceName={LEGAL_SERVICE_NAME}
      contactLabel={t.contact}
      contactEmail={LEGAL_CONTACT_EMAIL}
    />
  );
}
