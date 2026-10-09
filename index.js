const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Render web server
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🚀 VIP Shop Bot is Live & Healthy on Render!');
});

app.listen(PORT, () => {
  console.log(`✅ Web server is running on port ${PORT}`);
});

// Secrets must come from the hosting environment only.
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID || process.env.CHAT_ID;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN পাওয়া যায়নি। Render Environment-এ BOT_TOKEN যুক্ত করুন।');
  process.exit(1);
}

if (!ADMIN_ID) {
  console.error('❌ ADMIN_ID পাওয়া যায়নি। Render Environment-এ ADMIN_ID যুক্ত করুন।');
  process.exit(1);
}

// Telegram bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Clear any previously configured webhook before polling.
bot.deleteWebHook().catch((err) => {
  console.warn('Webhook clear warning:', err.message);
});

// Main keyboard
let mainKeyboard;
try {
  const kb = require('./keyboards');
  mainKeyboard = kb.mainKeyboard;
} catch (err) {
  console.error('❌ keyboards.js লোড করা যায়নি:', err.message);
  process.exit(1);
}

// Load each feature module without merging the files.
function safeLoad(modulePath, ...args) {
  try {
    const mod = require(modulePath);
    const setup = typeof mod === 'function'
      ? mod
      : mod && typeof mod.setupDeposit === 'function'
        ? mod.setupDeposit
        : mod && typeof mod.default === 'function'
          ? mod.default
          : null;

    if (!setup) {
      throw new Error('কোনো setup function পাওয়া যায়নি');
    }

    setup(...args);
    console.log(`✅ Loaded module: ${modulePath}`);
  } catch (err) {
    console.error(`❌ Module load failed [${modulePath}]:`, err.message);
    process.exit(1);
  }
}

safeLoad('./deposit', bot, ADMIN_ID);
safeLoad('./buy', bot, ADMIN_ID);
safeLoad('./profile', bot);
safeLoad('./orders', bot);
safeLoad('./support', bot, ADMIN_ID);

bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '📟 Proxy',
    web_app: { url: 'https://telegram.org' }
  }
}).catch((err) => {
  console.warn('Menu button warning:', err.message);
});

bot.onText(/^\/start(?:\s|$)/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Customer';

  const welcomeText = `🌸 <b>স্বাগতম ${firstName} !</b>\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⤵️`;
  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });

  const stockText = `আমাদের স্টক এ ভালো পরিমাণ এ মেটা স্টক এ আছে যাদের লাগবে নিয়ে কাজ করতে পারেন ধন্যবাদ সবাইকে..! ‼️ ‼️\n\n<blockquote>ফুল ফ্রেশ গ্যারান্টি..! 🟢 ”</blockquote>`;
  await bot.sendMessage(chatId, stockText, {
    parse_mode: 'HTML'
  });
});

// Feature modules own their buttons; do not register duplicate fallback handlers here.
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

console.log('🚀 VIP Shop Bot সম্পূর্ণ প্রস্তুত এবং লাইভ!');
