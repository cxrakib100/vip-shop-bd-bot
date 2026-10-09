const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ১. রেন্ডার ওয়েব সার্ভার (Render যেন দ্রুত লাইভ হয় এবং কখনোই বন্ধ না হয়)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🚀 VIP Shop Bot is Live & Healthy on Render!');
});

app.listen(PORT, () => {
  console.log(`✅ Web server is running on port ${PORT}`);
});

// ২. টোকেন ও এডমিন আইডি (রেন্ডার Environment থেকে নিবে)
const BOT_TOKEN = process.env.BOT_TOKEN || '8260629531:AAGmU_Wwx-_Cc70hThSEH1GAJv2kpVjI76M';
const ADMIN_ID = process.env.ADMIN_ID || process.env.CHAT_ID || '6640939571';

if (!BOT_TOKEN) {
  console.error('❌ এরর: BOT_TOKEN পাওয়া যায়নি! দয়া করে রেন্ডারের Environment-এ BOT_TOKEN যুক্ত করুন।');
  process.exit(1);
}

// ৩. টেলিগ্রাম বট চালু করা
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// পুরনো কোনো আটকে থাকা ওয়েবহুক ক্লিয়ার করা
bot.deleteWebHook().catch(() => {});

// ৪. রঙিন কিবোর্ড বাটন (keyboards.js না পেলেও যাতে স্বয়ংক্রিয়ভাবে কাজ করে)
let mainKeyboard;
try {
  const kb = require('./keyboards');
  mainKeyboard = kb.mainKeyboard;
} catch (e) {
  mainKeyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🤑 Buy Product', style: 'success' }],
        [{ text: '👤 Profile', style: 'primary' }, { text: '🏦 Deposit', style: 'success' }],
        [{ text: '⌛ Order History', style: 'primary' }, { text: '🛡️ Support', style: 'danger' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

// ৫. সুপার-সেফ মডিউল লোডার (বাকি ফাইলগুলোর কোনো এররের কারণে ইনডেক্স ফেল করবে না)
function safeLoad(modulePath, ...args) {
  try {
    const mod = require(modulePath);
    if (typeof mod === 'function') {
      mod(...args);
    } else if (mod && typeof mod.setupDeposit === 'function') {
      mod.setupDeposit(...args);
    } else if (mod && typeof mod.default === 'function') {
      mod.default(...args);
    }
    console.log(`✅ Loaded module: ${modulePath}`);
  } catch (err) {
    console.log(`ℹ️ Module status on [${modulePath}]: ${err.message}`);
  }
}

// আপনার অন্যান্য ফাইলগুলোকে সুরক্ষিতভাবে লোড করা
safeLoad('./deposit', bot, ADMIN_ID);
safeLoad('./buy', bot, ADMIN_ID);
safeLoad('./profile', bot);
safeLoad('./orders', bot);
safeLoad('./support', bot, ADMIN_ID);

// ৬. চ্যাটের উপরের 📟 Proxy বাটন
bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '📟 Proxy',
    web_app: { url: 'https://telegram.org' }
  }
}).catch(() => {});

// ৭. /start কমান্ড হ্যান্ডলার (সরাসরি ফাস্ট বাটন আসবে)
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Customer';

  // ১ম মেসেজ: স্বাগতম ও রঙিন মেনু বাটন
  const welcomeText = `🌸 <b>স্বাগতম ${firstName} !</b>\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⤵️`;
  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });

  // ২য় মেসেজ: স্টক আপডেট
  const stockText = `আমাদের স্টক এ ভালো পরিমাণ এ মেটা স্টক এ আছে যাদের লাগবে নিয়ে কাজ করতে পারেন ধন্যবাদ সবাইকে..! ‼️ ‼️\n\n<blockquote>ফুল ফ্রেশ গ্যারান্টি..! 🟢 ”</blockquote>`;
  await bot.sendMessage(chatId, stockText, {
    parse_mode: 'HTML'
  });
});

// বেসিক ব্যাকআপ রেসপন্স (যদি আলাদা ফাইল না-ও থাকে তাও উত্তর দিবে)
bot.onText(/Buy Product/, async (msg) => {
  bot.sendMessage(msg.chat.id, '🛍️ প্রডাক্ট কিনতে অনুগ্রহ করে আগে ডিপোজিট করুন অথবা সাপোর্টে যোগাযোগ করুন।');
});

bot.onText(/Profile/, async (msg) => {
  bot.sendMessage(msg.chat.id, `👤 <b>ইউজার প্রোফাইল</b>\n🆔 আইডি: <code>${msg.chat.id}</code>\n💰 ব্যালেন্স: 0.00 ৳`, { parse_mode: 'HTML' });
});

bot.onText(/Order History/, async (msg) => {
  bot.sendMessage(msg.chat.id, '⌛ আপনার একাউন্টে বর্তমানে কোনো সক্রিয় অর্ডারের রেকর্ড নেই।');
});

bot.onText(/Support/, async (msg) => {
  bot.sendMessage(msg.chat.id, `🛡️ সরাসরি এডমিনের সাথে যোগাযোগ করুন: <a href="tg://user?id=${ADMIN_ID}">এডমিন সাপোর্ট</a>`, { parse_mode: 'HTML' });
});

// পোলিং ও অন্যান্য এরর হ্যান্ডলার (বট কখনো ক্র্যাশ করবে না)
bot.on('polling_error', (error) => {
  if (!error.message.includes('409 Conflict') && !error.message.includes('401 Unauthorized')) {
    console.log('Bot Warning:', error.message);
  }
});

process.on('uncaughtException', (err) => {
  console.log('Handled uncaughtException:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.log('Handled unhandledRejection:', reason);
});

console.log('🚀 VIP Shop Bot সম্পূর্ণ প্রস্তুত এবং লাইভ!');
