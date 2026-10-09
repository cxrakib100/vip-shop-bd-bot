require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');

// আপনার টোকেন এবং অ্যাডমিন চ্যাট আইডি সরাসরি যুক্ত করা হয়েছে
const BOT_TOKEN = process.env.BOT_TOKEN || '8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo';
const ADMIN_ID = process.env.ADMIN_ID || '6640939571';

const bot = new Telegraf(BOT_TOKEN);

// ডাটা স্টোরেজ
const users = new Map();

function getUserData(userId, name) {
  if (!users.has(userId)) {
    users.set(userId, {
      name: name,
      balance: 0,
      orders: 0
    });
  }
  return users.get(userId);
}

/**
 * বাটন ও কালার স্টাইল (Telegram Bot API 9.4+):
 * - 'success' = সবুজ বাটন (#52b75a)
 * - 'primary' = নীল বাটন (#36a6e8)
 * - 'danger'  = লাল বাটন (#eb5757)
 */
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      // ১ম সারি: সবুজ বাটন
      [
        { text: "🤑 Buy Product", style: "success" }
      ],
      // ২য় সারি: নীল ও সবুজ বাটন
      [
        { text: "👤 Profile", style: "primary" },
        { text: "🏛️ Deposit", style: "success" }
      ],
      // ৩য় সারি: নীল ও লাল বাটন
      [
        { text: "⌛ Order History", style: "primary" },
        { text: "🛡️ Support", style: "danger" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

// ১. /start কমান্ড
bot.command('start', async (ctx) => {
  try {
    const user = ctx.from;
    const userName = user.first_name || 'User';
    getUserData(user.id, userName);

    const welcomeMessage = `স্বাগতম <b>${userName}</b> !\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন 📥`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      ...mainKeyboard
    });

    // নতুন ইউজার স্টার্ট করলে অ্যাডমিনকে নোটিফিকেশন পাঠানো
    if (ADMIN_ID && String(user.id) !== String(ADMIN_ID)) {
      bot.telegram.sendMessage(
        ADMIN_ID,
        `🔔 <b>নতুন ইউজার বট চালু করেছে!</b>\n\n👤 নাম: ${userName}\n🆔 আইডি: <code>${user.id}</code>\n🌐 ইউজারনেম: @${user.username || 'নাই'}`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }
  } catch (error) {
    console.error("Start error:", error);
  }
});

// ২. স্টক মেসেজ কমান্ড (/stock)
bot.command('stock', async (ctx) => {
  try {
    const stockMessage = 
`আমাদের স্টক এ ভালো পরিমাণ এ মেটা স্টক এ আছে যাদের লাগবে নিয়ে কাজ করতে পাড়েন ধন্যবাদ সবাইকে..! ‼️ ‼️

<blockquote>ফুল ফ্রেশ গেরান্টি..! 🟢 ”</blockquote>`;

    await ctx.reply(stockMessage, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error("Stock error:", error);
  }
});

// ৩. 🤑 Buy Product বাটন
bot.hears(['🤑 Buy Product', 'Buy Product'], async (ctx) => {
  const text = 
`🛒 <b>আমাদের শপের পণ্য তালিকা:</b>

1️⃣ <b>মেটা আইডি (Meta Old/Fresh)</b> - ৳১৫০
2️⃣ <b>টেলিগ্রাম প্রিমিয়াম (১ মাস)</b> - ৳৩৫০
3️⃣ <b>হাই স্পিড প্রক্সি (Proxy / VPN)</b> - ৳১০০

<blockquote>পণ্য কেনার আগে একাউন্টে পর্যাপ্ত ব্যালেন্স ডিপোজিট করুন।</blockquote>`;

  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "📦 মেটা স্টক কিনুন (৳১৫০)", callback_data: "buy_meta" }],
        [{ text: "⭐ টেলিগ্রাম প্রিমিয়াম (৳৩৫০)", callback_data: "buy_tg" }],
        [{ text: "🌐 প্রক্সি কানেক্ট করুন", url: "https://t.me/proxy" }]
      ]
    }
  });
});

// ৪. 👤 Profile বাটন
bot.hears(['👤 Profile', 'Profile'], async (ctx) => {
  const user = ctx.from;
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const username = user.username ? `@${user.username}` : 'নাই';
  const userData = getUserData(user.id, user.first_name);

  const profileText = 
`👤 <b>আপনার প্রোফাইল তথ্য:</b>

🆔 <b>ইউজার আইডি:</b> <code>${user.id}</code>
👤 <b>নাম:</b> ${fullName}
🌐 <b>ইউজারনেম:</b> ${username}
💰 <b>ব্যালেন্স:</b> ৳ ${userData.balance}.00 BDT
📦 <b>মোট অর্ডার:</b> ${userData.orders} টি`;

  await ctx.reply(profileText, { parse_mode: 'HTML' });
});

// ৫. 🏛️ Deposit বাটন
bot.hears(['🏛️ Deposit', 'Deposit'], async (ctx) => {
  const depositText = 
`🏛️ <b>ব্যালেন্স ডিপোজিট সিস্টেম:</b>

টাকা পাঠানোর নম্বরসমূহ (Personal / Send Money):
📱 <b>বিকাশ:</b> <code>01700000000</code>
📱 <b>নগদ:</b> <code>01800000000</code>
📱 <b>রকেট:</b> <code>01900000000</code>
🌐 <b>Binance Pay ID:</b> <code>${ADMIN_ID}</code>

<blockquote>টাকা সেন্ড মানি করে TrxID ও স্ক্রিনশট সহ নিচের বাটনে ক্লিক করে জানান। ১০-১৫ মিনিটের মধ্যে ব্যালেন্স যোগ হবে।</blockquote>`;

  await ctx.reply(depositText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "📩 ডিপোজিট রিকোয়েস্ট পাঠান", callback_data: "deposit_req" }]
      ]
    }
  });
});

// ৬. ⌛ Order History বাটন
bot.hears(['⌛ Order History', 'Order History'], async (ctx) => {
  const historyText = 
`⌛ <b>আপনার অর্ডার হিস্টোরি:</b>

বর্তমানে আপনার কোনো পূর্ববর্তী অর্ডার রেকর্ড নেই। নতুন পণ্য অর্ডার করতে 'Buy Product' মেনুতে যান।`;

  await ctx.reply(historyText, { parse_mode: 'HTML' });
});

// ৭. 🛡️ Support বাটন
bot.hears(['🛡️ Support', 'Support'], async (ctx) => {
  const supportText = 
`🛡️ <b>কাস্টমার সাপোর্ট:</b>

যেকোনো সমস্যা, পণ্য ক্রয় অথবা ডিপোজিটের সহায়তার জন্য সরাসরি যোগাযোগ করুন:
👨‍💻 <b>অ্যাডমিন আইডি:</b> <code>${ADMIN_ID}</code>
⏰ <b>সার্ভিস টাইম:</b> ২৪/৭ সর্বদা একটিভ।`;

  await ctx.reply(supportText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 অ্যাডমিনকে মেসেজ দিন", url: `tg://user?id=${ADMIN_ID}` }]
      ]
    }
  });
});

// ইনলাইন কলব্যাক অ্যাকশন
bot.action('buy_meta', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('⚠️ আপনার ব্যালেন্স অপর্যাপ্ত! প্রথমে 🏛️ Deposit মেনু থেকে ব্যালেন্স যোগ করুন।');
});

bot.action('buy_tg', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('⚠️ আপনার ব্যালেন্স অপর্যাপ্ত! প্রথমে 🏛️ Deposit মেনু থেকে ব্যালেন্স যোগ করুন।');
});

bot.action('deposit_req', async (ctx) => {
  await ctx.answerCbQuery();
  const user = ctx.from;
  await ctx.reply('✅ আপনার রিকোয়েস্ট গ্রহণ করা হয়েছে! অনুগ্রহ করে TrxID এবং স্ক্রিনশটটি চ্যাটে পাঠিয়ে দিন।');
  
  if (ADMIN_ID) {
    bot.telegram.sendMessage(
      ADMIN_ID,
      `📥 <b>নতুন ডিপোজিট রিকোয়েস্ট!</b>\n\n👤 ইউজার: ${user.first_name}\n🆔 আইডি: <code>${user.id}</code>\n🌐 ইউজারনেম: @${user.username || 'নাই'}`,
      { parse_mode: 'HTML' }
    ).catch(() => {});
  }
});

// ৮. অ্যাডমিন কমান্ড: সকল ইউজারকে নোটিশ পাঠাতে (/broadcast <মেসেজ>)
bot.command('broadcast', async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) {
    return ctx.reply('❌ এই কমান্ডটি কেবল অ্যাডমিনের জন্য!');
  }

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) {
    return ctx.reply('⚠️ ব্যবহারের নিয়ম: <code>/broadcast আপনার মেসেজ</code>', { parse_mode: 'HTML' });
  }

  let count = 0;
  for (const [userId] of users.entries()) {
    try {
      await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
      count++;
    } catch (e) {}
  }

  ctx.reply(`✅ মোট ${count} জন ইউজারের কাছে মেসেজ পাঠানো হয়েছে!`);
});

// এরর হ্যান্ডলার
bot.catch((err, ctx) => {
  console.error(`Error in ${ctx.updateType}:`, err);
});

// Render ফ্রি সার্ভারে বট চালু রাখতে লাইটওয়েট HTTP সার্ভার
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('বটটি সফলভাবে রেন্ডারে রান করছে!');
});

server.listen(PORT, () => {
  console.log(`Render Web Service listening on port ${PORT}`);
});

// বট রান করা
bot.launch()
  .then(() => console.log('Telegram Bot সফলভাবে চালু হয়েছে!'))
  .catch((err) => console.error('Bot launch failed:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
