const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { mainKeyboard } = require('./keyboards');
const { setupDeposit } = require('./deposit');

// টোকেন ও এডমিন আইডি
const BOT_TOKEN = process.env.BOT_TOKEN || '8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo';
const ADMIN_ID = process.env.CHAT_ID || process.env.ADMIN_ID || '6640939571';

// টেলিগ্রাম বট ইনিশিয়ালাইজেশন
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// রেন্ডার ওয়েব সার্ভার (Render যেন কখনো স্লিপ বা অফ না হয়)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is actively running!'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// ডিপোজিট মডিউল যুক্ত করা
setupDeposit(bot, ADMIN_ID);

// চ্যাটের উপরের 📟 Proxy বাটন সেটআপ
bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '📟 Proxy',
    web_app: { url: 'https://telegram.org' }
  }
}).catch(() => {});

// /start কমান্ড - কোনো চ্যানেল জয়েনিং মেসেজ ছাড়াই সরাসরি বাটন চলে আসবে
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Customer';

  // ১ম মেসেজ: স্বাগতম ও রঙিন কিবোর্ড বাটন
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

// অন্যান্য বাটনগুলোর বেসিক রেসপন্স
bot.onText(/Buy Product/, async (msg) => {
  bot.sendMessage(msg.chat.id, '🛍️ প্রডাক্ট কিনতে বা স্টক দেখতে ডিপোজিট সম্পন্ন করুন অথবা সাপোর্টে যোগাযোগ করুন।');
});

bot.onText(/Profile/, async (msg) => {
  bot.sendMessage(msg.chat.id, `👤 <b>ইউজার প্রোফাইল</b>\n🆔 আইডি: <code>${msg.chat.id}</code>\n💰 ব্যালেন্স: 0.00 ৳`, { parse_mode: 'HTML' });
});

bot.onText(/Order History/, async (msg) => {
  bot.sendMessage(msg.chat.id, '⌛ আপনার পূর্বে কোনো অর্ডারের রেকর্ড পাওয়া যায়নি।');
});

bot.onText(/Support/, async (msg) => {
  bot.sendMessage(msg.chat.id, `🛡️ সরাসরি এডমিনের সাথে যোগাযোগ করুন: <a href="tg://user?id=${ADMIN_ID}">এডমিন চ্যাট</a>`, { parse_mode: 'HTML' });
});

// পোলিং এরর হ্যান্ডলার
bot.on('polling_error', (error) => console.log('Log:', error.message));

console.log('🚀 মেইন বট সফলভাবে চালু হয়েছে!');
