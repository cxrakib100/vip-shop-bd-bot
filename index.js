const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
const express = require('express');
const { getMainKeyboard } = require('./keyboards');

// ১. Render পোর্ট ফিক্স (যাতে সাথে সাথে Live হয়)
const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is live and running!'));
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// ২. কনফিগারেশন
const BOT_TOKEN = process.env.BOT_TOKEN || "8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo";
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.qbkzinaypjnkanrwsbpc:Zxcv%40123%401233@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
const ADMIN_ID = parseInt(process.env.ADMIN_ID || "6640939571");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ৩. /start কমান্ড
bot.onText(/\/start/, async (msg) => {
  const uid = msg.from.id;
  const uname = msg.from.username || msg.from.first_name;

  try {
    await pool.query(
      `INSERT INTO users (user_id, username, balance) VALUES ($1, $2, 0.00) ON CONFLICT (user_id) DO NOTHING;`,
      [uid, uname]
    );
  } catch (err) {
    console.error("DB Start Error:", err);
  }

  const welcomeText = `🌸 **ভেরিফিকেশন সফল হয়েছে ${msg.from.first_name} !**\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⬇️`;
  bot.sendMessage(uid, welcomeText, { parse_mode: 'Markdown', ...getMainKeyboard() });
});

// ৪. Buy Product
bot.on('message', async (msg) => {
  const text = msg.text || '';
  const uid = msg.from.id;

  if (text.includes("Buy Product")) {
    try {
      const res = await pool.query('SELECT DISTINCT category FROM products;');
      if (res.rows.length === 0) {
        return bot.sendMessage(uid, "❌ বর্তমানে কোনো ক্যাটাগরি নেই!");
      }

      const inline_keyboard = res.rows.map(cat => [
        { text: `📁 ${cat.category}`, callback_data: `cat_${cat.category}` }
      ]);

      bot.sendMessage(uid, "💸 **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    } catch (err) {
      bot.sendMessage(uid, "ডাটাবেজ সমস্যা: " + err.message);
    }
  }

  // প্রোফাইল
  else if (text.includes("Profile")) {
    const res = await pool.query('SELECT balance FROM users WHERE user_id = $1;', [uid]);
    const balance = res.rows[0] ? res.rows[0].balance : '0.00';
    bot.sendMessage(uid, `👤 **প্রোফাইল**\n\n🆔 আইডি: \`${uid}\`\n💰 ব্যালেন্স: **${balance} TK**`, { parse_mode: 'Markdown' });
  }

  // অর্ডার হিস্টোরি
  else if (text.includes("Order History")) {
    const res = await pool.query(`
      SELECT p.name, o.quantity, o.total_price 
      FROM orders o JOIN products p ON o.product_id = p.id 
      WHERE o.user_id = $1 ORDER BY o.id DESC LIMIT 5;
    `, [uid]);

    if (res.rows.length === 0) return bot.sendMessage(uid, "📭 কোনো অর্ডার হিস্টোরি নেই!");
    let txt = "📜 **আপনার বিগত অর্ডারসমূহ:**\n\n";
    res.rows.forEach(o => {
      txt += `🔹 ${o.name} (${o.quantity} টি) - ${o.total_price} TK\n`;
    });
    bot.sendMessage(uid, txt, { parse_mode: 'Markdown' });
  }

  // ডিপোজিট
  else if (text.includes("Deposit")) {
    const depText = `🏦 **ডিপোজিট সিস্টেম**\n\n` +
      `💳 **bKash (Send Money):** \`01XXXXXXXXX\`\n` +
      `🔸 **Nagad (Send Money):** \`01XXXXXXXXX\`\n` +
      `🚀 **Rocket (Send Money):** \`01XXXXXXXXX\`\n\n` +
      `টাকা পাঠিয়ে নিচের নিয়মে মেসেজ দিন:\n` +
      `👉 \`TRX <মেথড> <টাকা> <TrxID>\`\n` +
      `উদাহরণ: \`TRX bKash 100 9A7SD6F2\``;
    bot.sendMessage(uid, depText, { parse_mode: 'Markdown' });
  }

  // সাপোর্ট
  else if (text.includes("Support")) {
    bot.sendMessage(uid, "📞 যেকোনো সমস্যায় যোগাযোগ করুন: @cxrakib100");
  }

  // TrxID সাবমিট
  else if (text.toUpperCase().startsWith("TRX ")) {
    const parts = text.split(' ');
    if (parts.length !== 4) return bot.sendMessage(uid, "❌ ভুল ফরম্যাট! সঠিক ফরম্যাট: `TRX bKash 100 9A7SD6F2`");

    const [_, method, amountStr, trx_id] = parts;
    const amount = parseFloat(amountStr);

    try {
      await pool.query(
        `INSERT INTO deposits (user_id, method, amount, trx_id, status) VALUES ($1, $2, $3, $4, 'pending');`,
        [uid, method, amount, trx_id]
      );

      bot.sendMessage(uid, "✅ আপনার ডিপোজিট রিকোয়েস্ট অ্যাডমিনের কাছে পাঠানো হয়েছে।");

      const adminKeyboard = {
        inline_keyboard: [[
          { text: "✅ Approve", callback_data: `adm_app_${uid}_${amount}_${trx_id}` },
          { text: "❌ Reject", callback_data: `adm_rej_${uid}_${trx_id}` }
        ]]
      };

      bot.sendMessage(
        ADMIN_ID,
        `🔔 **নতুন ডিপোজিট রিকোয়েস্ট!**\n\n👤 ইউজার: \`${uid}\`\n💳 মেথড: ${method}\n💰 টাকা: ${amount} TK\n🧾 TrxID: \`${trx_id}\``,
        { parse_mode: 'Markdown', reply_markup: adminKeyboard }
      );
    } catch (err) {
      if (err.code === '23505') bot.sendMessage(uid, "❌ এই TrxID টি ইতিমধ্যে ব্যবহার করা হয়েছে!");
      else bot.sendMessage(uid, "ত্রুটি: " + err.message);
    }
  }
});

// ৫. বাটন কলব্যাক হ্যান্ডলার (ক্যাটাগরি, প্রোডাক্ট ও প্লাস-মাইনাস বাটন)
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  // ক্যাটাগরি ক্লিক -> প্রোডাক্ট লিস্ট
  if (data.startsWith('cat_')) {
    const catName = data.replace('cat_', '');
    const prods = await pool.query('SELECT id, name, price FROM products WHERE category = $1;', [catName]);

    const inline_keyboard = [];
    for (const p of prods.rows) {
      const stockRes = await pool.query('SELECT COUNT(*) as stock FROM stock_items WHERE product_id = $1 AND is_sold = FALSE;', [p.id]);
      const stock = parseInt(stockRes.rows[0].stock);
      const stockText = stock > 0 ? `Stock: ${stock}` : 'Out of Stock';
      inline_keyboard.push([{ text: `${p.name} | ${p.price} TK | ${stockText}`, callback_data: `prod_${p.id}` }]);
    }
    inline_keyboard.push([{ text: "🔙 Back", callback_data: "back_cats" }]);

    bot.editMessageText(`🛍 **${catName} প্রোডাক্ট সিলেক্ট করুন:**`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  // প্রোডাক্ট সিলেক্ট -> প্লাস/মাইনাস কাউন্টার ভিউ
  else if (data.startsWith('prod_')) {
    const prodId = parseInt(data.split('_')[1]);
    const prodRes = await pool.query('SELECT * FROM products WHERE id = $1;', [prodId]);
    const prod = prodRes.rows[0];

    const stockRes = await pool.query('SELECT COUNT(*) as stock FROM stock_items WHERE product_id = $1 AND is_sold = FALSE;', [prodId]);
    const stock = parseInt(stockRes.rows[0].stock);

    if (stock === 0) return bot.answerCallbackQuery(query.id, { text: "⚠️ দুঃখিত, স্টক নেই!", show_alert: true });

    const qty = 1;
    const total = (parseFloat(prod.price) * qty).toFixed(2);
    const txt = `💸 **${prod.name}**\n💰 **প্রাইস:** ${prod.price} TK\n📦 **স্টক:** ${stock}\n\nপরিমাণ: ${qty}\n**মোট খরচ:** ${total} TK`;

    const inline_keyboard = [
      [
        { text: "➖", callback_data: `dec_${prodId}_${qty}` },
        { text: `${qty}`, callback_data: "ignore" },
        { text: "➕", callback_data: `inc_${prodId}_${qty}` }
      ],
      [
        { text: "✅ Confirm Order", callback_data: `confirm_${prodId}_${qty}` },
        { text: "❌ Cancel", callback_data: "back_cats" }
      ]
    ];

    bot.editMessageText(txt, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  // প্লাস/মাইনাস সংখ্যা আপডেট
  else if (data.startsWith('inc_') || data.startsWith('dec_')) {
    const [action, prodIdStr, qtyStr] = data.split('_');
    const prodId = parseInt(prodIdStr);
    let qty = parseInt(qtyStr);

    const prodRes = await pool.query('SELECT * FROM products WHERE id = $1;', [prodId]);
    const prod = prodRes.rows[0];
    const stockRes = await pool.query('SELECT COUNT(*) as stock FROM stock_items WHERE product_id = $1 AND is_sold = FALSE;', [prodId]);
    const stock = parseInt(stockRes.rows[0].stock);

    if (action === 'inc') {
      if (qty + 1 > stock) return bot.answerCallbackQuery(query.id, { text: "⚠️ স্টকে এর চেয়ে বেশি নেই!", show_alert: true });
      qty++;
    } else if (action === 'dec') {
      if (qty - 1 < 1) return;
      qty--;
    }

    const total = (parseFloat(prod.price) * qty).toFixed(2);
    const txt = `💸 **${prod.name}**\n💰 **প্রাইস:** ${prod.price} TK\n📦 **স্টক:** ${stock}\n\nপরিমাণ: ${qty}\n**মোট খরচ:** ${total} TK`;

    const inline_keyboard = [
      [
        { text: "➖", callback_data: `dec_${prodId}_${qty}` },
        { text: `${qty}`, callback_data: "ignore" },
        { text: "➕", callback_data: `inc_${prodId}_${qty}` }
      ],
      [
        { text: "✅ Confirm Order", callback_data: `confirm_${prodId}_${qty}` },
        { text: "❌ Cancel", callback_data: "back_cats" }
      ]
    ];

    bot.editMessageText(txt, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  // কনফার্ম অর্ডার ও ডেলিভারি
  else if (data.startsWith('confirm_')) {
    const [_, prodIdStr, qtyStr] = data.split('_');
    const prodId = parseInt(prodIdStr);
    const qty = parseInt(qtyStr);
    const uid = query.from.id;

    const userRes = await pool.query('SELECT balance FROM users WHERE user_id = $1;', [uid]);
    const user = userRes.rows[0];
    const prodRes = await pool.query('SELECT * FROM products WHERE id = $1;', [prodId]);
    const prod = prodRes.rows[0];

    const totalPrice = parseFloat(prod.price) * qty;

    if (!user || parseFloat(user.balance) < totalPrice) {
      return bot.answerCallbackQuery(query.id, { text: `❌ পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন ${totalPrice} TK`, show_alert: true });
    }

    const stockItems = await pool.query('SELECT id, account_data FROM stock_items WHERE product_id = $1 AND is_sold = FALSE LIMIT $2;', [prodId, qty]);
    if (stockItems.rows.length < qty) {
      return bot.answerCallbackQuery(query.id, { text: "⚠️ স্টক শেষ হয়ে গেছে!", show_alert: true });
    }

    await pool.query('UPDATE users SET balance = balance - $1 WHERE user_id = $2;', [totalPrice, uid]);
    const delivered = [];

    for (const item of stockItems.rows) {
      await pool.query('UPDATE stock_items SET is_sold = TRUE, sold_to = $1, sold_at = NOW() WHERE id = $2;', [uid, item.id]);
      delivered.push(item.account_data);
    }

    await pool.query('INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES ($1, $2, $3, $4);', [uid, prodId, qty, totalPrice]);

    bot.editMessageText("✅ আপনার অর্ডার সফল হয়েছে!", { chat_id: chatId, message_id: messageId });
    bot.sendMessage(uid, "📦 **আপনার ক্রয়কৃত অ্যাকাউন্ট(গুলো):**\n\n" + delivered.join('\n'));
  }

  // অ্যাডমিন এপ্রুভ বাটন
  else if (data.startsWith('adm_')) {
    if (query.from.id !== ADMIN_ID) return;
    const parts = data.split('_');
    const action = parts[1];
    const targetUid = parts[2];

    if (action === 'app') {
      const amount = parseFloat(parts[3]);
      const trx_id = parts[4];
      await pool.query('UPDATE users SET balance = balance + $1 WHERE user_id = $2;', [amount, targetUid]);
      await pool.query('UPDATE deposits SET status = $1 WHERE trx_id = $2;', ['approved', trx_id]);

      bot.editMessageText(`✅ ডিপোজিট অনুমোদিত (${amount} TK)`, { chat_id: chatId, message_id: messageId });
      bot.sendMessage(targetUid, `🎉 আপনার ${amount} TK ডিপোজিট সফল হয়েছে!`);
    } else if (action === 'rej') {
      const trx_id = parts[3];
      await pool.query('UPDATE deposits SET status = $1 WHERE trx_id = $2;', ['rejected', trx_id]);
      bot.editMessageText("❌ ডিপোজিট বাতিল করা হয়েছে!", { chat_id: chatId, message_id: messageId });
      bot.sendMessage(targetUid, "❌ আপনার ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।");
    }
  }
});

console.log("🚀 Node.js Telegram Bot is running...");
