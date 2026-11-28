# FIB Olymp — підключення та розгортання

Не видаляйте чинну базу, репозиторій або Render Service. Перед заміною зробіть backup старого репозиторію, наявних заявок та локального кабінету. Новий SQL використовує таблиці з префіксом `fib_`; не видаляє наявні таблиці. Спочатку перевірте в окремому тестовому проєкті. Імпорту старих заявок немає.

## 1. Supabase
1. У проєкті відкрийте SQL Editor → New query. Вставте `supabase/001_portal.sql`, Run. Переконайтеся, що створено 5 таблиць `fib_...`, RLS увімкнено, немає публічних політик читання.
2. Authentication → конфігурація провайдера email: залиште email/password увімкненим, вимкніть вільну реєстрацію нових користувачів (Allow new users to sign up). Реєстрація здійснюється серверним admin API лише за одноразовим запрошенням. Не вимикайте підтвердження email для вільної реєстрації.
3. Authentication → Users: створіть свій власний обліковий запис, використайте власну підтверджену пошту та надійний пароль; скопіюйте UUID. У SQL Editor вставте `002_director.example.sql`, замініть нульовий UUID на свій. За замовчуванням: Kai Muerte, rank 12, ЦСО «А», Керівник. SQL для першого директора виконується один раз.
4. У налаштуваннях API проєкту знайдіть URL та ключі **legacy JWT anon / service_role** (код цього пакета використовує їх; не підставляйте ключі `sb_secret_...` у Bearer-заголовок). Якщо у проєкті legacy ключі вимкнено, адаптуйте сервер для нового типу ключів перед запуском. `service_role` виключно в Render Environment. Ніколи не вставляйте його у браузер, GitHub або чат.

Офіційні довідки: https://supabase.com/docs/guides/auth/general-configuration ; https://supabase.com/docs/reference/javascript/auth-admin-createuser ; https://supabase.com/docs/guides/security/production-checklist

## 2. Пошта через Resend
1. Підтвердьте домен, яким маєте право керувати, в Resend → Domains, додавши DNS-записи з панелі сервісу.
2. Створіть API key із правом Sending access; якщо можливо, обмежте його підтвердженим доменом.
3. Задайте `RESEND_API_KEY` та `FIB_EMAIL_FROM` (наприклад `FIB Olymp <notifications@ваш-підтверджений-домен>`). Домен Render зазвичай не є вашим поштовим доменом. Не використовуйте чужий домен або адресу.
4. Після перевірки рішення кандидат отримує HTML-лист із реквізитами та запрошенням (лише при схваленні). Це лист ігрової спільноти. Якщо пошта не прийнята сервісом, заявка залишиться зі статусом рішення та індикатором помилки. Для схваленої заявки можна перевидати запрошення; для відхиленої повторне надсилання поки не реалізоване.
Довідка: https://resend.com/docs ; https://resend.com/changelog/new-api-key-permissions

## 3. Telegram (необов’язково)
1. Створіть бота в BotFather згідно з правилами Telegram. Збережіть токен та username. Надавайте можливість підключення тільки за добровільною згодою. Бот не шукає chat ID за username: кандидат переходить за власним посиланням після подання заявки і натискає Start.
2. Створіть випадковий секрет webhook (наприклад локально `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Додайте `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` у Render Environment.
3. Після деплою з HTTPS, на власному комп'ютері в корені проєкту задайте ці змінні та `FIB_PUBLIC_URL` у приватному `.env` і виконайте `node --env-file=.env tools/telegram-webhook.mjs`. Не публікуйте `.env`. Скрипт встановить webhook `https://ваш-домен/api/telegram/webhook` із секретом. Бот надсилає тільки повідомлення щодо статусу, без приватних матеріалів чи запрошення; `/stop` відписує.
Довідка: https://core.telegram.org/bots/api#setwebhook

## 4. GitHub і Render
Розпакуйте ZIP у корінь репозиторію (після backup). `package.json`, `app/`, `assets/`, `cabinet/`, `lib/`, `supabase/` повинні лежати на одному рівні. Не завантажуйте `dist/` або `.env`; `offline/` не використовується build, її можна залишити локально. GitHub Pages/Static Site не підходить для цього API. Використовуйте Render Web Service.

Render → Settings: Node 22, Root Directory — корінь репозиторію, Build Command `npm run build`, Start Command `npm start`, Health Check `/`. Existing service не застосовує render.yaml автоматично — змініть параметри в панелі. У Environment заповніть:

| Ключ | Значення |
|---|---|
| SUPABASE_URL | URL вашого проєкту |
| SUPABASE_ANON_KEY | legacy anon JWT |
| SUPABASE_SERVICE_ROLE_KEY | legacy service_role JWT (приватний) |
| FIB_PUBLIC_URL | точна HTTPS-адреса сайту без кінцевого `/` |
| RESEND_API_KEY | sending key |
| FIB_EMAIL_FROM | підтверджена адреса відправника |
| TELEGRAM_BOT_TOKEN | токен, необов'язково |
| TELEGRAM_BOT_USERNAME | username бота без @, необов'язково |
| TELEGRAM_WEBHOOK_SECRET | випадковий секрет, необов'язково |
| FIB_APPLICATIONS_OPEN | `false` до завершення тестування; `true` для приймання заявок |

Старі `FIB_ADMIN_PASSWORD`, `FIB_SESSION_SECRET`, `FIB_DATA_DIR` новий API не використовує. Не відключайте старий deployment до резервного копіювання його даних.

Запустіть Manual Deploy → Deploy latest commit. Публічна головна `/`, вступ `/join/`, кабінет `/cabinet/` (український інтерфейс), `/staff/` перенаправляє в кабінет. До налаштування бази `/api/config` має показати `applicationsOpen:false`. Після успішної перевірки підключення і ввімкнення приймання — `true`.

## 5. Контрольна перевірка
- `npm run build && npm test` (локально 41 тест). Переконайтеся, що `/offline/FIB_Olymp.html`, `/.env`, `/supabase/001_portal.sql` не віддаються сервером (404).
- Увійдіть як Director. Під власною тестовою поштою подайте заявку, перевірте номер і статус. Якщо використовуєте Telegram, підключіть бота кнопкою на підтвердженні.
- Схваліть заявку. Перевірте фактичну доставку email і Telegram. Відкрийте email-посилання, створіть пароль, увійдіть кандидатом: Intern, Академія, немає доступу до заявок. Перевірте повторне відкриття посилання: реєстрація не повинна відбутися вдруге.
- Перевірте відмову з причиною та повторне запрошення. Перевірте, що рядовий учасник не може викликати адміністративні API, навіть якщо вводить URL вручну. Не зберігайте реальні заявки під час тестування. Видаліть тестові записи в Supabase у правильному порядку (progress/member → application → Auth user), не видаляйте Director.
- Якщо відсутні відповіді зовнішніх сервісів, залиште приймання заявок вимкненим. Новий повний кабінет потребує поступового перенесення решти модулів; опис обмежень у README.md.
