const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { mainKeyboard } = require('./keyboards');

// ১. কনফিগারেশন
const BOT_TOKEN = process.env.BOT_TOKEN || '8260629531:AAGmU_Wwx-_Cc70hThSEH1GAJv2kpVjI76M';
const ADMIN_ID = process.env.CHAT_ID || process.env.ADMIN_ID || '6640939571';

// ২. বট চালু করা
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// পুরনো কোনো আটকে থাকা ওয়েবহুক মুছে ফেলা
bot.deleteWebHook().catch(() => {});

// ৩. রেন্ডার ওয়েব সার্ভার (Render যেন অফ না হয়)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🚀 VIP Shop Bot is Live and Healthy!'));
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// ৪. সবগুলো আলাদা আলাদা ফাইলকে মাথার সাথে যুক্ত করা (মডিউল লোডার)
require('./buy')(bot, ADMIN_ID);
require('./profile')(bot);
require('./deposit')(bot, ADMIN_ID);
require('./orders')(bot);
require('./support')(bot, ADMIN_ID);

// ৫. চ্যাটের উপরের 📟 Proxy বাটন
bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '📟 Proxy',
    web_app: { url: 'https://telegram.org' }
  }
}).catch(() => {});

// ৬. /start কমান্ড (সরাসরি দ্রুত বাটন আসবে, কোনো চ্যানেল মেসেজ ছাড়া)
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Customer';

  // ১ম মেসেজ: স্বাগতম ও রঙিন বাটন
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

// এরর হ্যান্ডলার
bot.on('polling_error', (error) => console.log('Log:', error.message));

console.log('⚡ বট সফলভাবে সম্পূর্ণ মডিউল সহ রানিং!');
