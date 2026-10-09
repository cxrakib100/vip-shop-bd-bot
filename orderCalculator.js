// orderCalculator.js - অটোমেটিক ক্যালকুলেটর, নম্বর কিবোর্ড এবং লাইভ হিসাব সিস্টেম

// ১. ৫টি প্রোডাক্টের ডাটাবেজ (নাম, প্রাইস ও স্টক)
const PRODUCTS = {
  view_prod_outlook: { key: "view_prod_outlook", name: "Outlook fr", price: 1.00, stock: 0 },
  view_prod_hotmail: { key: "view_prod_hotmail", name: "Hotmail", price: 1.00, stock: 0 },
  view_prod_meta_ai: { key: "view_prod_meta_ai", name: "Meta AI ID", price: 0.50, stock: 0 },
  view_prod_meta_otp: { key: "view_prod_meta_otp", name: "Meta AI OTP access", price: 0.60, stock: 0 },
  view_prod_meta_horizon: { key: "view_prod_meta_horizon", name: "Meta Horizon", price: 0.60, stock: 0 }
};

// প্রোডাক্ট খুঁজে বের করার হেল্পার
function getProduct(key) {
  if (PRODUCTS[key]) return PRODUCTS[key];
  const matched = Object.values(PRODUCTS).find(p => p.key === key || key.includes(p.key.replace("view_prod_", "")));
  return matched || { key: key, name: "Product", price: 1.00, stock: 0 };
}

// বাংলা সংখ্যা থেকে ইংরেজি সংখ্যা রূপান্তর
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

// লাইভ প্রোডাক্ট কার্ড তৈরি
function formatOrderCard(product, quantity) {
  const qty = parseInt(quantity, 10) || 1;
  const unitPrice = parseFloat(product.price).toFixed(2);
  const totalCost = calculateTotal(unitPrice, qty);
  const stockText = product.stock > 0 ? `✅ In Stock (${product.stock})` : '❌ Out of Stock';

  return `🤑 *${product.name}*\n💰 *প্রাইস:* ${unitPrice} TK\n*স্টক:* ${stockText}\n\n*পরিমাণ:* ${qty}\n*মোট খরচ:* ${totalCost} TK`;
}

// সাধারণ প্লাস/মাইনাস কিবোর্ড
function getStandardKeyboard(prodKey, quantity) {
  const qty = parseInt(quantity, 10) || 1;

  return {
    inline_keyboard: [
      [
        { text: '➖', callback_data: `calc:dec:${prodKey}:${qty}` },
        { text: `${qty}`, callback_data: `calc:numpad:${prodKey}:${qty}` },
        { text: '➕', callback_data: `calc:inc:${prodKey}:${qty}` }
      ],
      [
        { text: '✏️ Custom Quantity (নম্বর কিবোর্ড)', callback_data: `calc:numpad:${prodKey}:${qty}` }
      ],
      [
        { text: 'Confirm Order', callback_data: `calc:confirm:${prodKey}:${qty}` },
        { text: 'Cancel', callback_data: 'cat:trusted_mail' }
      ],
      [
        { text: '🔙 Back', callback_data: 'cat:trusted_mail' }
      ]
    ]
  };
}

// সরাসরি স্ক্রিনে লাইভ নম্বর কিবোর্ড (অন-স্ক্রিন ডায়ালপ্যাড)
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
        { text: '✅ Done (হিসাব সম্পন্ন)', callback_data: `num:done:${prodKey}:${displayQty}` }
      ],
      [
        { text: '⌨️ চ্যাটে টাইপ করুন (Type in Chat)', callback_data: `num:chat:${prodKey}` }
      ],
      [
        { text: '🔙 Back', callback_data: `calc:back:${prodKey}:${displayQty}` }
      ]
    ]
  };
}

// ২. মূল হ্যান্ডলার যা buyProduct.js থেকে কল হবে
function handleOrderCalculator(bot, ADMIN_ID, getTrustedMailView) {
  // ডায়ালপ্যাড টাইপিং সেশন এবং চ্যাট ইনপুট ট্র্যাক করার জন্য মেমোরি
  const numpadSession = new Map();
  const chatInputSession = new Map();

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // ক) Trusted Mail-এর ৫টি প্রোডাক্টের যেকোনো একটিতে চাপ দিলে ক্যালকুলেটর ওপেন হবে
    if (data.startsWith('view_prod_')) {
      await bot.answerCallbackQuery(query.id);
      const product = getProduct(data);
      const initialQty = 1;

      try {
        await bot.editMessageText(formatOrderCard(product, initialQty), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getStandardKeyboard(product.key, initialQty)
        });
      } catch (err) {}
    }

    // খ) প্লাস (➕) বাটন
    else if (data.startsWith('calc:inc:')) {
      await bot.answerCallbackQuery(query.id);
      const [, , prodKey, qtyStr] = data.split(':');
      const product = getProduct(prodKey);
      const newQty = parseInt(qtyStr, 10) + 1;

      try {
        await bot.editMessageText(formatOrderCard(product, newQty), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getStandardKeyboard(prodKey, newQty)
        });
      } catch (err) {}
    }

    // গ) মাইনাস (➖) বাটন
    else if (data.startsWith('calc:dec:')) {
      const [, , prodKey, qtyStr] = data.split(':');
      const currentQty = parseInt(qtyStr, 10);

      if (currentQty <= 1) {
        await bot.answerCallbackQuery(query.id, { text: '⚠️ সর্বনিম্ন পরিমাণ ১ টি!' });
        return;
      }

      await bot.answerCallbackQuery(query.id);
      const product = getProduct(prodKey);
      const newQty = currentQty - 1;

      try {
        await bot.editMessageText(formatOrderCard(product, newQty), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getStandardKeyboard(prodKey, newQty)
        });
      } catch (err) {}
    }

    // ঘ) নম্বর কিবোর্ড বা ডায়ালপ্যাড ওপেন করা
    else if (data.startsWith('calc:numpad:')) {
      await bot.answerCallbackQuery(query.id);
      const [, , prodKey, qtyStr] = data.split(':');
      const product = getProduct(prodKey);

      numpadSession.set(chatId, { prodKey, typed: qtyStr || '1' });

      try {
        await bot.editMessageText(
          formatOrderCard(product, qtyStr) + '\n\n⌨️ *নিচের ডায়ালপ্যাড চেপে পরিমাণ নির্ধারণ করুন:*',
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getNumPadKeyboard(prodKey, qtyStr)
          }
        );
      } catch (err) {}
    }

    // ঙ) ডায়ালপ্যাডে নম্বর চাপলে (num:add)
    else if (data.startsWith('num:add:')) {
      await bot.answerCallbackQuery(query.id);
      const [, , prodKey, digit] = data.split(':');
      const product = getProduct(prodKey);

      let current = numpadSession.get(chatId)?.typed || '1';
      if (current === '1' || current === '0') {
        current = digit;
      } else {
        current = current + digit;
      }
      if (current.length > 5) current = current.slice(0, 5); // সর্বোচ্চ ৫ সংখ্যার সীমা

      numpadSession.set(chatId, { prodKey, typed: current });
      const qty = parseNumber(current);

      try {
        await bot.editMessageText(
          formatOrderCard(product, qty) + `\n\n⌨️ *টাইপকৃত পরিমাণ:* ${current}`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getNumPadKeyboard(prodKey, current)
          }
        );
      } catch (err) {}
    }

    // চ) ডায়ালপ্যাড ক্লিয়ার (num:clear)
    else if (data.startsWith('num:clear:')) {
      await bot.answerCallbackQuery(query.id);
      const [, , prodKey] = data.split(':');
      const product = getProduct(prodKey);

      let current = numpadSession.get(chatId)?.typed || '1';
      if (current.length > 1) {
        current = current.slice(0, -1);
      } else {
        current = '1';
      }

      numpadSession.set(chatId, { prodKey, typed: current });
      const qty = parseNumber(current);

      try {
        await bot.editMessageText(
          formatOrderCard(product, qty) + `\n\n⌨️ *টাইপকৃত পরিমাণ:* ${current}`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getNumPadKeyboard(prodKey, current)
          }
        );
      } catch (err) {}
    }

    // ছ) ডায়ালপ্যাড সম্পন্ন (num:done) অথবা ব্যাক (calc:back)
    else if (data.startsWith('num:done:') || data.startsWith('calc:back:')) {
      await bot.answerCallbackQuery(query.id);
      const parts = data.split(':');
      const prodKey = parts[2];
      const typed = numpadSession.get(chatId)?.typed || parts[3] || '1';
      const qty = parseNumber(typed);
      const product = getProduct(prodKey);

      numpadSession.delete(chatId);

      try {
        await bot.editMessageText(formatOrderCard(product, qty), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getStandardKeyboard(prodKey, qty)
        });
      } catch (err) {}
    }

    // জ) চ্যাটে টাইপ করে পরিমাণ দেওয়ার অপশন (num:chat)
    else if (data.startsWith('num:chat:')) {
      await bot.answerCallbackQuery(query.id);
      const [, , prodKey] = data.split(':');

      chatInputSession.set(chatId, { prodKey });
      await bot.sendMessage(chatId, '✍️ *আপনি কয়টি নিতে চান? সংখ্যাটি চ্যাটে লিখে সেন্ড করুন (যেমন: 5 বা 10):*', {
        parse_mode: 'Markdown'
      });
    }

    // ঝ) অর্ডার কনফার্ম বাটন
    else if (data.startsWith('calc:confirm:')) {
      const [, , prodKey, qtyStr] = data.split(':');
      const product = getProduct(prodKey);
      const qty = parseNumber(qtyStr);

      if (product.stock <= 0) {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ দুঃখিত, এই পণ্যটি বর্তমানে স্টক আউট (Out of Stock)!',
          show_alert: true
        });
        return;
      }

      await bot.answerCallbackQuery(query.id);
      const total = calculateTotal(product.price, qty);
      await bot.sendMessage(
        chatId,
        `✅ *অর্ডার গ্রহণ করা হয়েছে!*\n\n📦 *পণ্য:* ${product.name}\n🔢 *পরিমাণ:* ${qty}\n💰 *মোট বিল:* ${total} TK`,
        { parse_mode: 'Markdown' }
      );
    }

    // ঞ) Cancel অথবা Back চেপে Trusted Mail লিস্টে ফেরা
    else if (data === 'cat:trusted_mail') {
      await bot.answerCallbackQuery(query.id);
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
  });

  // চ্যাটে ইউজার সংখ্যা লিখে পাঠালে তা গ্রহণ করা
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text || msg.text.startsWith('/')) return;

    if (chatInputSession.has(chatId)) {
      const { prodKey } = chatInputSession.get(chatId);
      chatInputSession.delete(chatId);

      const qty = parseNumber(msg.text);
      const product = getProduct(prodKey);

      await bot.sendMessage(chatId, formatOrderCard(product, qty), {
        parse_mode: 'Markdown',
        reply_markup: getStandardKeyboard(prodKey, qty)
      });
    }
  });
}

module.exports = {
  parseNumber,
  calculateTotal,
  formatOrderCard,
  getStandardKeyboard,
  getNumPadKeyboard,
  handleOrderCalculator
};
