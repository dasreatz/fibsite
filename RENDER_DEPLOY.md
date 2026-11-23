# Публікація FIB Olymp на Render

## 1. Файли у GitHub

Весь ВМІСТ цього архіву розмістіть у КОРЕНІ репозиторію GitHub.
Коли відкриваєте репозиторій, `package.json`, `build.mjs`, `server.mjs`,
`render.yaml`, `app/` та `assets/` повинні бути видні одразу, без вкладеної
папки `fibsite-main/`. Сам ZIP не потрібно завантажувати як один файл.

Якщо GitHub вже має проєкт усередині `fibsite-main/`, перенесіть його в корінь,
або в Render -> Settings -> Build & Deploy задайте Root Directory = `fibsite-main`.
Не використовуйте одночасно обидва способи.

## 2. Render: існуючий Web Service

У Render Dashboard -> ваш сервіс -> Settings встановіть:

- Language / Runtime: Node
- Root Directory: порожньо, коли `package.json` у корені GitHub; або `fibsite-main`, коли всередині цієї папки
- Build Command: `npm run build`
- Start Command: `npm start`
- Node Version: 22.16.0 (через `.node-version`; `NODE_VERSION` у налаштуваннях має вищий пріоритет)
- Health Check Path: `/`

Збережіть зміни та виконайте Manual Deploy -> Deploy latest commit.
Файл `render.yaml` автоматично НЕ перепише налаштування звичайного існуючого
сервісу. Його можна використати для нового Render Blueprint.

Важливо: не задавайте `cargo build`, `pip install` чи команду для Python/Rust.
Цей проєкт на Node.js і не має залежностей, які треба встановлювати перед збіркою.

## 3. Якщо вибрали Static Site замість Web Service

- Build Command: `npm run build`
- Publish Directory: `dist`
- Root Directory: як описано вище

Статичний хостинг показує сторінки, але не підтримує серверне `/api/*`.

## 4. Діагностика невдалої публікації

Відкрийте Render -> ваш сервіс -> Events -> невдалий Deploy -> Logs
або вкладку Deploy Logs. Скопіюйте останні 30-50 рядків із першою
конкретною помилкою; код `101` без логу не дає точного діагнозу.

Після оновлення коду збірка локально перевіряється командами:

```sh
npm run build
npm test
npm start
```

### Дані заявок

На безкоштовному Web Service Render диск тимчасовий. Не вмикайте приймання
особистих заявок без налаштованого постійного приватного сховища.
За замовчуванням API заявок вимкнено; публічні сторінки працюють.
