# PocketGPT Web 2.1

Изменения:
- Kazakh (`kz`) добавлен на все основные страницы сайта, а не только на Billing/Connect.
- Улучшены KZ-переводы навигации, кабинета, оплаты, Connect, auth-страниц, условий оплаты и политики возврата.
- Никнейм устройства ограничен на frontend до 15 символов.
- Подсказки никнейма объясняют формат: латиница, цифры, дефис, точка или подчёркивание.
- Billing сохраняет две группы тарифов: пакеты запросов и Connect/комплекты.

Проверка:
- `npx tsc --noEmit` проходит без ошибок.
- `next build` в песочнице доходит до компиляции и TypeScript, но сборка зависает на этапе page data из-за лимитов среды; на Vercel должна пройти стандартно.

## Frontend polish — Phase 1

Изменения:
- Добавлена единая визуальная база в `src/app/globals.css`: цвета, поверхности, границы, кнопки, состояния фокуса, адаптивные правила и reduced motion.
- Верхняя панель заменена на минимальную: меню слева, фирменная метка по центру, выбор языка через глобус справа.
- Создано единое боковое меню для desktop/mobile с активным пунктом, защищёнными разделами для авторизованного пользователя и legal-ссылками.
- Главная страница полностью переработана в инженерном стиле с CSS-визуализацией PocketGPT, компактным текстом и RU/EN/KZ.
- Добавлен общий модуль языка `src/lib/site-language.ts` без изменения существующих API-контрактов.

Проверка:
- `npm run lint` — без ошибок; остаётся одно ранее существовавшее предупреждение `react-hooks/exhaustive-deps` в `src/app/connect/page.tsx`.
- `npx tsc --noEmit` — успешно.
- `npm run build` — успешно, все 13 пользовательских маршрутов собраны.

## Frontend polish — Phase 1.1

Изменения:
- С главной удалена декоративная телеметрия `ONLINE / RU / ENG / KZ / BUILD 231`.
- Удалён нижний блок `Голос / Ответ / Connect`, не добавлявший пользователю полезной информации.
- Центральный логотип `POCKETGPT` в верхней панели стал постоянной ссылкой на главную; декоративный индекс `02` удалён.
- Добавлен общий мягкий вход для всех маршрутов через `src/app/template.tsx`.
- Добавлены последовательное появление hero-контента, плавное появление визуализации устройства, медленное движение сетки, орбит и световых акцентов.
- Пункты бокового меню появляются каскадно; интерактивные элементы получили более плавные hover/active-состояния.
- Все анимации автоматически практически отключаются при системной настройке `prefers-reduced-motion`.

Проверка:
- `npm run lint` — без ошибок; сохраняется одно старое предупреждение в `src/app/connect/page.tsx`.
- `npx tsc --noEmit` — успешно.
- `npm run build` — успешно, все маршруты собраны.

## Frontend polish — Phase 5

Изменения:
- Удалены декоративные служебные подписи наподобие `ОПЛАТА / ДОСТУП` с главной, кабинета, привязки и оплаты.
- Увеличена базовая типографика и размеры вторичного текста на пользовательских страницах; сохранена мобильная адаптация без горизонтального скролла.
- Connect полностью переработан вокруг визуальной группы из трёх устройств: текущее устройство сверху, два компактных слота участников снизу.
- Добавление друга, поиск по никнейму и входящие приглашения перенесены в компактные модальные окна.
- Добавлены индикатор активности Connect, счётчик приглашений, меню участника, автоматическое обновление при возвращении на вкладку и понятные RU/EN/KZ-состояния ошибок.
- Редактирование никнейма в Connect отсутствует: никнейм только отображается, менять его можно только в кабинете.
- Для ошибок FastAPI API-клиент теперь учитывает поле `detail`.
- Для сборки ограничено число worker-процессов Next.js до двух, чтобы снизить потребление памяти без изменения runtime-поведения сайта.

API:
- Подтверждённые существующим frontend потоки Connect используют прежние маршруты просмотра группы, поиска, приглашения, принятия и отклонения.
- Интерфейс удаления участника и выхода из группы подготовлен для `POST /v1/user/connect/member/remove` и `POST /v1/user/connect/leave`. Если backend ещё не предоставляет эти маршруты, интерфейс покажет локализованное сообщение о необходимости обновления Connect API.

Проверка:
- `npx tsc --noEmit` — успешно.
- `npm run lint` — успешно, без предупреждений.
- `npm run build` — успешно, все 15 маршрутов собраны.

## Backend compatibility update (17 July 2026)

- Billing sends `termsAccepted`, `termsVersion` and `refundPolicyVersion` to the backend.
- Connect group names are saved through `POST /v1/user/connect/group/name` instead of being local-only.
- Only the group owner can open free invitation slots.
- The visible design was not changed in this compatibility patch.

---

## PayPal recurring subscriptions

The billing page now uses PayPal Subscriptions rather than one-time Orders:

- JavaScript SDK is loaded with `vault=true` and `intent=subscription`;
- the selected backend-created PayPal plan is passed to `createSubscription`;
- the user must explicitly accept payment/refund terms and monthly automatic renewal;
- current recurring status, next charge date and auto-renewal state are displayed;
- the user can cancel automatic renewal while keeping access through the paid period;
- exact provider amount/currency is displayed after backend plan bootstrap;
- KZT remains the product price, while PayPal uses USD by default.

Required Vercel environment variable:

```text
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<same sandbox/live PayPal app used by backend>
```

Deploy the backend and bootstrap its PayPal plans before deploying this frontend release.
