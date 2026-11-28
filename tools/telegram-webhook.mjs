// Set required environment variables locally; never put bot credentials in source.
const {TELEGRAM_BOT_TOKEN,TELEGRAM_WEBHOOK_SECRET,FIB_PUBLIC_URL}=process.env;
if(!TELEGRAM_BOT_TOKEN||!TELEGRAM_WEBHOOK_SECRET||!FIB_PUBLIC_URL?.startsWith('https://'))throw Error('Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and HTTPS FIB_PUBLIC_URL');
if(!/^[A-Za-z0-9_-]{16,256}$/.test(TELEGRAM_WEBHOOK_SECRET))throw Error('Invalid webhook secret');
const r=await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:FIB_PUBLIC_URL.replace(/\/$/,'')+'/api/telegram/webhook',secret_token:TELEGRAM_WEBHOOK_SECRET,allowed_updates:['message']})});
const j=await r.json();if(!r.ok||!j.ok)throw Error('Telegram rejected webhook configuration');console.log('Webhook configured');
