const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ১. টোকেন ও এডমিন আইডি সেটআপ (Render Environment অথবা সরাসরি কোড থেকে কাজ করবে)
const BOT_TOKEN = process.env.BOT_TOKEN || '8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo';
const ADMIN_ID = process.env.CHAT_ID || process.env.ADMIN_ID || '6640939571';

// ২. টেলিগ্রাম বট ইনিশিয়ালাইজ (Polling মোডে)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ৩. রেন্ডার (Render) যেন বন্ধ না হয় সেজন্য Express ওয়েব সার্ভার
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('⚡ Telegram Bot is running live on Render!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is running on port ${PORT}`);
});

// ইউজার আইডি সংরক্ষণের জন্য সেট (ব্রডকাস্টের জন্য)
const activeUsers = new Set();

// ৪. হুবহু স্ক্রিনশটের মতো ৫টি রঙিন বাটন কিবোর্ড (Reply Keyboard)
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      // ১ম সারি: সবুজ বাটন (success)
      [
        { text: '🤑 Buy Product', style: 'success' }
      ],
      // ২য় সারি: নীল বাটন (primary) এবং সবুজ বাটন (success)
      [
        { text: '👤 Profile', style: 'primary' },
        { text: '🏦 Deposit', style: 'success' }
      ],
      // ৩য় সারি: হালকা নীল/নীল বাটন (primary) এবং লাল বাটন (danger)
      [
        { text: '⌛ Order History', style: 'primary' },
        { text: '🛡️ Support', style: 'danger' }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

// ৫. চ্যাট মেনু বাটন সেট করা (স্ক্রিনশটের উপরের '📟 Proxy' বাটন)
bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '📟 Proxy',
    web_app: { url: 'https://telegram.org' }
  }
}).catch((err) => {
  // যদি কোনো ক্লায়েন্টে ওয়েব অ্যাপ সাপোর্ট না থাকে তবে এরর হ্যান্ডেল
  console.log('ChatMenuButton info:', err.message);
});

// ৬. /start কমান্ড হ্যান্ডলার (স্ক্রিনশট ১-এর মতো হুবহু ইন্টারফেস)
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Customer';
  activeUsers.add(chatId);

  // ১ম মেসেজ: স্বাগতম মেসেজ + রঙিন কিবোর্ড বাটন
  const welcomeText = `🌸 <b>স্বাগতম ${firstName} !</b>\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⤵️`;
  
  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });

  // ২য় মেসেজ: হুবহু স্টক আপডেট ও কোটেশন ব্লক
  const stockText = `আমাদের স্টক এ ভালো পরিমাণ এ মেটা স্টক এ আছে যাদের লাগবে নিয়ে কাজ করতে পারেন ধন্যবাদ সবাইকে..! ‼️ ‼️\n\n<blockquote>ফুল ফ্রেশ গ্যারান্টি..! 🟢 ”</blockquote>`;
  
  await bot.sendMessage(chatId, stockText, {
    parse_mode: 'HTML'
  });
});

// ৭. বাটনগুলোর রেসপন্স হ্যান্ডলার

// (ক) 🤑 Buy Product
bot.onText(/Buy Product/, async (msg) => {
  const chatId = msg.chat.id;
  const text = `🛍️ <b>পণ্য তালিকা (Available Products):</b>\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `🔹 <b>১. মেটা / ফেসবুক একাউন্ট</b>\n` +
               `• কোয়ালিটি: ফুল ফ্রেশ গ্যারান্টি\n` +
               `• স্টক: পর্যাপ্ত আছে 🟢\n\n` +
               `🔹 <b>২. প্রিমিয়াম প্রক্সি (Proxy)</b>\n` +
               `• হাই স্পিড ডেডিকেটেড আইপি\n` +
               `• স্টক: এভেইলেবল 🟢\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `অর্ডার করতে নিচের বাটনে ক্লিক করে এডমিনের সাথে যোগাযোগ করুন:`;

  await bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 এডমিনকে মেসেজ দিন (Order Now)', url: `tg://user?id=${ADMIN_ID}` }]
      ]
    }
  });
});

// (খ) 👤 Profile
bot.onText(/Profile/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const username = msg.from.username ? `@${msg.from.username}` : 'নাই';

  const profileText = `👤 <b>আপনার প্রোফাইল তথ্য:</b>\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `🆔 <b>আইডি:</b> <code>${chatId}</code>\n` +
                      `📛 <b>নাম:</b> ${firstName}\n` +
                      `📱 <b>ইউজারনেম:</b> ${username}\n` +
                      `💰 <b>ব্যালেন্স:</b> 0.00 ৳ (BDT)\n` +
                      `📦 <b>মোট অর্ডার:</b> 0 টি\n` +
                      `━━━━━━━━━━━━━━━━━━`;

  await bot.sendMessage(chatId, profileText, { parse_mode: 'HTML' });
});

// (গ) 🏦 Deposit
bot.onText(/Deposit/, async (msg) => {
  const chatId = msg.chat.id;
  const depositText = `🏦 <b>টাকা ডিপোজিট করার উপায়:</b>\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `আপনার অ্যাকাউন্টে টাকা যোগ করতে নিচের নম্বরে সেন্ড মানি করুন:\n\n` +
                      `📱 <b>বিকাশ (Personal):</b> <code>017XXXXXXXX</code>\n` +
                      `📱 <b>নগদ (Personal):</b> <code>019XXXXXXXX</code>\n` +
                      `💵 <b>USDT (TRC20):</b> <code>TXxxxxxxxxxxxxxxxxxxx</code>\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `⚠️ টাকা পাঠানোর পর TrxID এবং স্ক্রিনশট সাপোর্টে পাঠিয়ে ব্যালেন্স যোগ করে নিন।`;

  await bot.sendMessage(chatId, depositText, { parse_mode: 'HTML' });
});

// (ঘ) ⌛ Order History
bot.onText(/Order History/, async (msg) => {
  const chatId = msg.chat.id;
  const historyText = `⌛ <b>অর্ডার হিস্টোরি:</b>\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `আপনার অ্যাকাউন্টে বর্তমানে কোনো অর্ডারের রেকর্ড নেই।\n` +
                      `নতুন পণ্য কিনতে <b>🤑 Buy Product</b> বাটনে চাপুন।`;

  await bot.sendMessage(chatId, historyText, { parse_mode: 'HTML' });
});

// (ঙ) 🛡️ Support
bot.onText(/Support/, async (msg) => {
  const chatId = msg.chat.id;
  const supportText = `🛡️ <b>কাস্টমার সাপোর্ট:</b>\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `যেকোনো প্রয়োজনে আমাদের অফিসিয়াল সাপোর্টে মেসেজ দিন:\n\n` +
                      `👨‍💻 <b>এডমিন আইডি:</b> <a href="tg://user?id=${ADMIN_ID}">সরাসরি চ্যাট করুন</a>\n` +
                      `📢 <b>অফিসিয়াল চ্যানেল:</b> https://t.me/A_ToolsX\n` +
                      `⏰ <b>সাপোর্ট সময়:</b> ২৪/৭ সক্রিয়`;

  await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML' });
});

// ৮. এডমিন ব্রডকাস্ট কমান্ড (এডমিন চ্যাট থেকে মেসেজ পাঠাতে: /broadcast <আপনার মেসেজ>)
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (msg.chat.id.toString() !== ADMIN_ID.toString()) return;
  const broadcastMsg = match[1];
  let count = 0;

  for (const user of activeUsers) {
    try {
      await bot.sendMessage(user, broadcastMsg, { parse_mode: 'HTML' });
      count++;
    } catch (e) {
      // ইউজার বট ব্লক করলে এরর এড়িয়ে যাবে
    }
  }

  await bot.sendMessage(ADMIN_ID, `✅ ব্রডকাস্ট সম্পন্ন হয়েছে! মোট ${count} জন ইউজারের কাছে পাঠানো হয়েছে।`);
});

// এরর লগিং যাতে বট কখনো ক্র্যাশ না করে
bot.on('polling_error', (error) => {
  console.log('Polling Error:', error.message);
});

console.log('🤖 বট সফলভাবে চালু হয়েছে!');
