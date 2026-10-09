// orderCalculator.js - সুপার আল্ট্রা ফাস্ট ক্যালকুলেটর, ডায়ালপ্যাড ও লাইভ ব্যালেন্স সিস্টেম
const fs = require('fs');
const path = require('path');

// ১. প্রোডাক্টের ডাটাবেজ (নাম, প্রাইস ও স্টক)
const PRODUCTS = {
  view_prod_outlook: { key: "view_prod_outlook", name: "Outlook fr", price: 1.00, stock: 0 },
  view_prod_hotmail: { key: "view_prod_hotmail", name: "Hotmail", price: 1.00, stock: 0 },
  view_prod_meta_ai: { key: "view_prod_meta_ai", name: "Meta AI ID", price: 0.50, stock: 0 },
  view_prod_meta_otp: { key: "view_prod_meta_otp", name: "Meta AI OTP access", price: 0.60, stock: 0 },
  view_prod_meta_horizon: { key: "view_prod_meta_horizon", name: "Meta Horizon", price: 0.60, stock: 0 }
};

// প্রোডাক্ট খুঁজে বের করার হেল্পার
function getProduct(key) {
  if (!key) return { key: "unknown", name: "Product", price: 1.00, stock: 0 };
  if (PRODUCTS[key]) return PRODUCTS[key];
  for (const k in PRODUCTS) {
    if (k.toLowerCase() === key.toLowerCase() ||
        k.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(k.toLowerCase().replace("view_prod_", ""))) {
      return PRODUCTS[k];
    }
  }
  return { key: key, name: key, price: 1.00, stock: 0 };
}

// ইউজারের লাইভ ব্যালেন্স পাওয়ার ফাংশন (users.json বা ডাটাবেজ ফাইল চেক করবে)
function getUserBalance(userId) {
  try {
    const files = ['users.json', 'data.json', 'database.json', 'db.json', 'userData.json'];
    for (const f of files) {
      const fullPath = path.resolve(process.cwd(), f);
      if (fs.existsSync(fullPath)) {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (data[userId] && data[userId].balance !== undefined) {
          return parseFloat(data[userId].balance).toFixed(2);
        }
        if (data.users && data.users[userId] && data.users[userId].balance !== undefined) {
          return parseFloat(data.users[userId].balance).toFixed(2);
        }
        if (Array.isArray(data)) {
          const u = data.find(x => x.id == userId || x.userId == userId || x.chatId == userId);
          if (u && u.balance !== undefined) return parseFloat(u.balance).toFixed(2);
        }
      }
    }
  } catch (e) {}
  return "0.00";
}

// বাংলা ও ইংরেজি উভয় সংখ্যা পার্স করার ফাংশন
function parseNumber(input) {
  if (!input) return 1;
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const englishStr = input.toString().replace(/[০-৯]/g, (match) => banglaDigits[match]);
  const parsed = parseInt(englishStr, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

// মোট খরচ হিসাব
function calculateTotal(unitPrice, quantity) {
  const price = parseFloat(unitPrice) || 0;
  const qty = parseInt(quantity, 10) || 1;
  return (price * qty).toFixed(2);
}

// লাইভ প্রোডাক্ট কার্ড তৈরি (ব্যালেন্স ও টাইপকৃত পরিমাণ সহ)
function formatOrderCard(product, quantity, balance, currentTyped = null) {
  const qty = parseInt(quantity, 10) || 1;
  const unitPrice = parseFloat(product.price).toFixed(2);
  const totalCost = calculateTotal(unitPrice, qty);
  const stockText = product.stock > 0 ? `✅ In Stock (${product.stock})` : '❌ Out of Stock';
  const userBalance = parseFloat(balance || 0).toFixed(2);

  let text = `🤑 *${product.name}*\n💰 *প্রাইস:* ${unitPrice} TK\n*স্টক:* ${stockText}\n\n*পরিমাণ:* ${qty}\n*মোট খরচ:* ${totalCost} TK\n💳 *Balance:* ${userBalance} TK`;

  if (currentTyped !== null) {
    text += `\n\n⌨️ *টাইপকৃত পরিমাণ:* ${currentTyped}`;
  }

  return text;
}

// সাধারণ প্লাস/মাইনাস কিবোর্ড
function getStandardKeyboard(prodKey, quantity) {
  const qty = parseInt(quantity, 10) || 1;

  return {
    inline_keyboard: [
      [
        { text: '➖', callback_data: `calc:dec:${prodKey}` },
        { text: `${qty}`, callback_data: `calc:numpad:${prodKey}` },
        { text: '➕', callback_data: `calc:inc:${prodKey}` }
      ],
      [
        { text: '✏️ Custom Quantity (নম্বর কিবোর্ড)', callback_data: `calc:numpad:${prodKey}` }
      ],
      [
        { text: 'Confirm Order', callback_data: `calc:confirm:${prodKey}` },
        { text: 'Cancel', callback_data: 'cat:trusted_mail' }
      ],
      [
        { text: '🔙 Back', callback_data: 'cat:trusted_mail' }
      ]
    ]
  };
}

// সরাসরি অন-স্ক্রিন নম্বর কিবোর্ড (ডায়ালপ্যাড)
function getNumPadKeyboard(prodKey, currentTyped) {
  const displayQty = currentTyped || '1';

  return {
    inline_keyboard: [
      [
        { text: '1', callback_data: `num:add:${prodKey}:1` },
        { text: '2', callback_data: `num:add:${prodKey}:2` },
        { text: '3', callback_data: `num:add:${prodKey}:3` }
      ],
      [
        { text: '4', callback_data: `num:add:${prodKey}:4` },
        { text: '5', callback_data: `num:add:${prodKey}:5` },
        { text: '6', callback_data: `num:add:${prodKey}:6` }
      ],
      [
        { text: '7', callback_data: `num:add:${prodKey}:7` },
        { text: '8', callback_data: `num:add:${prodKey}:8` },
        { text: '9', callback_data: `num:add:${prodKey}:9` }
      ],
      [
        { text: '⌫ Clear', callback_data: `num:clear:${prodKey}` },
        { text: '0', callback_data: `num:add:${prodKey}:0` },
        { text: '✅ Done (হিসাব সম্পন্ন)', callback_data: `num:done:${prodKey}` }
      ],
      [
        { text: '🔙 Back', callback_data: `calc:back:${prodKey}` }
      ]
    ]
  };
}

// ২. মেমোরিতে আল্ট্রা ফাস্ট রেন্ডারিং কিউ (Queue)
const userState = new Map();

async function enqueueUpdate(chatId, bot) {
  const state = userState.get(chatId);
  if (!state || !state.messageId) return;

  if (state.isUpdating) {
    state.hasPending = true;
    return;
  }

  state.isUpdating = true;
  state.hasPending = false;

  try {
    const product = getProduct(state.prodKey);
    const balance = getUserBalance(chatId);
    let text, reply_markup;

    if (state.mode === 'numpad') {
      text = formatOrderCard(product, state.qty, balance, state.typed);
      reply_markup = getNumPadKeyboard(state.prodKey, state.typed);
    } else {
      text = formatOrderCard(product, state.qty, balance, null);
      reply_markup = getStandardKeyboard(state.prodKey, state.qty);
    }

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: state.messageId,
      parse_mode: 'Markdown',
      reply_markup: reply_markup
    });
  } catch (err) {
    // একই মেসেজ রেন্ডার হলে টেলিগ্রামের এরর নীরব রাখা
  } finally {
    state.isUpdating = false;
    if (state.hasPending) {
      enqueueUpdate(chatId, bot);
    }
  }
}

// ৩. মূল হ্যান্ডলার ফাংশন
function handleOrderCalculator(bot, ADMIN_ID, getTrustedMailView) {

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // ক্লিকের উত্তর সাথে সাথে ব্যাকগ্রাউন্ডে নিশ্চিত করা (যাতে কোনো লোডিং/হ্যাং না হয়)
    bot.answerCallbackQuery(query.id).catch(() => {});

    // ক) প্রোডাক্টে চাপ দিলে ক্যালকুলেটর ওপেন
    if (data.startsWith('view_prod_')) {
      const product = getProduct(data);
      const balance = getUserBalance(chatId);

      userState.set(chatId, {
        prodKey: product.key,
        qty: 1,
        mode: 'standard',
        typed: '1',
        isNewInput: true,
        messageId: messageId,
        isUpdating: false,
        hasPending: false
      });

      try {
        await bot.editMessageText(formatOrderCard(product, 1, balance, null), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getStandardKeyboard(product.key, 1)
        });
      } catch (err) {}
    }

    // খ) প্লাস (➕) বাটন (টপাটপ ক্লিক করলেও সুপারফাস্ট কাজ করবে)
    else if (data.startsWith('calc:inc')) {
      let state = userState.get(chatId);
      if (!state) {
        const parts = data.split(':');
        state = { prodKey: parts[2] || 'view_prod_outlook', qty: 1, mode: 'standard', typed: '1', isNewInput: true, messageId: messageId };
        userState.set(chatId, state);
      }
      state.qty += 1;
      state.typed = state.qty.toString();
      state.mode = 'standard';
      state.messageId = messageId;
      enqueueUpdate(chatId, bot);
    }

    // গ) মাইনাস (➖) বাটন
    else if (data.startsWith('calc:dec')) {
      let state = userState.get(chatId);
      if (!state) {
        const parts = data.split(':');
        state = { prodKey: parts[2] || 'view_prod_outlook', qty: 1, mode: 'standard', typed: '1', isNewInput: true, messageId: messageId };
        userState.set(chatId, state);
      }
      if (state.qty > 1) {
        state.qty -= 1;
        state.typed = state.qty.toString();
        state.mode = 'standard';
        state.messageId = messageId;
        enqueueUpdate(chatId, bot);
      }
    }

    // ঘ) নম্বর কিবোর্ড বা ডায়ালপ্যাড ওপেন
    else if (data.startsWith('calc:numpad')) {
      const state = userState.get(chatId) || {
        prodKey: data.split(':')[2] || 'view_prod_outlook',
        qty: 1,
        messageId: messageId
      };
      state.mode = 'numpad';
      state.typed = state.qty.toString();
      state.isNewInput = true; // প্রথমবার টাইপের সময় নতুন ইনপুট ধরবে
      state.messageId = messageId;
      userState.set(chatId, state);
      enqueueUpdate(chatId, bot);
    }

    // ঙ) ডায়ালপ্যাডে সংখ্যা টাইপ করা (যেমন: ১০০, ৮০, ৫০ ইত্যাদি সহজে উঠবে)
    else if (data.startsWith('num:add:')) {
      const [, , prodKey, digit] = data.split(':');
      let state = userState.get(chatId);
      if (!state) {
        state = { prodKey, qty: 1, mode: 'numpad', typed: '1', isNewInput: true, messageId };
        userState.set(chatId, state);
      }

      state.mode = 'numpad';
      state.messageId = messageId;

      if (state.isNewInput || state.typed === '0') {
        state.typed = digit;
        state.isNewInput = false;
      } else {
        if (state.typed.length < 6) { // সর্বোচ্চ ৬ ডিজিট পর্যন্ত টাইপ করা যাবে
          state.typed = state.typed + digit;
        }
      }

      state.qty = parseNumber(state.typed);
      enqueueUpdate(chatId, bot);
    }

    // চ) ক্লিয়ার বাটন (⌫ Clear)
    else if (data.startsWith('num:clear:')) {
      let state = userState.get(chatId);
      if (state) {
        state.mode = 'numpad';
        state.messageId = messageId;
        if (state.typed.length > 1) {
          state.typed = state.typed.slice(0, -1);
        } else {
          state.typed = '1';
          state.isNewInput = true;
        }
        state.qty = parseNumber(state.typed);
        enqueueUpdate(chatId, bot);
      }
    }

    // ছ) ডায়ালপ্যাড সম্পন্ন (Done) বা ফিরে যাওয়া (Back)
    else if (data.startsWith('num:done') || data.startsWith('calc:back')) {
      let state = userState.get(chatId);
      if (state) {
        state.mode = 'standard';
        state.messageId = messageId;
        state.qty = parseNumber(state.typed);
        enqueueUpdate(chatId, bot);
      }
    }

    // জ) ব্যাক বা ক্যান্সেল বাটন (ক্যাটাগরি তালিকায় ফেরা)
    else if (data === 'cat:trusted_mail') {
      userState.delete(chatId);
      if (typeof getTrustedMailView === 'function') {
        const { mailText, mailKeyboard } = getTrustedMailView();
        try {
          await bot.editMessageText(mailText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            ...mailKeyboard
          });
        } catch (err) {}
      }
    }

    // ঝ) অর্ডার কনফার্ম
    else if (data.startsWith('calc:confirm')) {
      const state = userState.get(chatId);
      const prodKey = state?.prodKey || data.split(':')[2];
      const qty = state?.qty || 1;
      const product = getProduct(prodKey);
      const balance = getUserBalance(chatId);

      if (product.stock <= 0) {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ দুঃখিত, এই পণ্যটি বর্তমানে স্টক আউট (Out of Stock)!',
          show_alert: true
        });
        return;
      }

      const total = calculateTotal(product.price, qty);
      await bot.sendMessage(
        chatId,
        `✅ *অর্ডার গ্রহণ করা হয়েছে!*\n\n📦 *পণ্য:* ${product.name}\n🔢 *পরিমাণ:* ${qty}\n💰 *মোট বিল:* ${total} TK\n💳 *ব্যালেন্স:* ${balance} TK`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // চ্যাটে বাংলা বা ইংরেজি সংখ্যা লিখে পাঠালেও লাইভ আপডেট হবে
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text || msg.text.startsWith('/')) return;

    const state = userState.get(chatId);
    if (!state || !state.messageId) return;

    // মেসেজে বাংলা বা ইংরেজি সংখ্যা থাকলে
    if (/[0-9০-৯]/.test(msg.text)) {
      const parsed = parseNumber(msg.text);
      if (parsed >= 1) {
        state.qty = parsed;
        state.typed = parsed.toString();
        state.isNewInput = true;

        // চ্যাট পরিচ্ছন্ন রাখতে মেসেজটি মুছে ফেলা (যদি পারমিশন থাকে)
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});

        // স্ক্রিনে সাথে সাথে লাইভ সংখ্যা আপডেট
        enqueueUpdate(chatId, bot);
      }
    }
  });
}

module.exports = {
  parseNumber,
  calculateTotal,
  formatOrderCard,
  getStandardKeyboard,
  getNumPadKeyboard,
  getUserBalance,
  handleOrderCalculator
};
