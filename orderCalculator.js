// orderCalculator.js - অটোমেটিক হিসাব, প্লাস-মাইনাস ও অর্ডার ক্যালকুলেটর ফাইল

// ৫টি মেইল প্রোডাক্টের তালিকা ও মূল্য
const PRODUCTS = {
  outlook: {
    id: "outlook",
    name: "Outlook fr",
    price: 1.00,
    stock: 0
  },
  hotmail: {
    id: "hotmail",
    name: "Hotmail",
    price: 1.00,
    stock: 0
  },
  meta_ai: {
    id: "meta_ai",
    name: "Meta AI ID",
    price: 0.50,
    stock: 0
  },
  meta_otp: {
    id: "meta_otp",
    name: "Meta AI OTP access",
    price: 0.60,
    stock: 0
  },
  meta_horizon: {
    id: "meta_horizon",
    name: "Meta Horizon",
    price: 0.60,
    stock: 0
  }
};

// ইউজার প্রতি বর্তমান অর্ডার স্টেট
const userOrders = {};

// স্ক্রিনশটের হুবহু ক্যালকুলেটর ইন্টারফেস ও বাটন তৈরি করার ফাংশন
function generateCalculatorView(productKey, qty = 1) {
  const prod = PRODUCTS[productKey] || { name: "Product", price: 1.00, stock: 0 };
  const currentQty = parseInt(qty) > 0 ? parseInt(qty) : 1;
  const totalCost = (prod.price * currentQty).toFixed(2);
  const stockText = prod.stock > 0 ? `🟢 ${prod.stock} pcs` : "❌ Out of Stock";

  const messageText = `🤑 *${prod.name}*
💰 *প্রাইস:* ${prod.price.toFixed(2)} TK
*স্টক:* ${stockText}

*পরিমাণ:* ${currentQty}
*মোট খরচ:* ${totalCost} TK`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `calc_dec_${productKey}_${currentQty}`, style: "danger" },
          { text: `${currentQty}`, callback_data: `calc_qty_${productKey}`, style: "primary" },
          { text: "➕", callback_data: `calc_inc_${productKey}_${currentQty}`, style: "success" }
        ],
        [
          { text: "✏️ Custom Quantity", callback_data: `calc_custom_${productKey}`, style: "success" }
        ],
        [
          { text: "Confirm Order", callback_data: `calc_confirm_${productKey}_${currentQty}`, style: "success" },
          { text: "Cancel", callback_data: "calc_cancel", style: "danger" }
        ]
      ]
    }
  };

  return { messageText, keyboard };
}

// ক্যালকুলেটর এবং প্লাস/মাইনাস লজিক
function handleOrderCalculator(bot, ADMIN_ID, getTrustedMailView) {
  // ১. বাটন হ্যান্ডলার (প্লাস, মাইনাস, ক্যান্সেল ও কনফার্ম)
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // প্রোডাক্ট ওপেন করা (যেমন: Outlook, Hotmail, Meta AI ইত্যাদি)
    if (data.startsWith("view_prod_")) {
      bot.answerCallbackQuery(query.id);
      const productKey = data.replace("view_prod_", "");
      userOrders[chatId] = { productKey, qty: 1, messageId };

      const { messageText, keyboard } = generateCalculatorView(productKey, 1);
      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      }).catch(() => {});
    }

    // ➕ প্লাস বাটনে চাপ দিলে: পরিমাণ ১ বৃদ্ধি পাবে এবং মোট খরচ ক্যালকুলেট হবে
    else if (data.startsWith("calc_inc_")) {
      bot.answerCallbackQuery(query.id);
      const parts = data.split("_");
      const productKey = parts[2];
      const prevQty = parseInt(parts[3]) || 1;
      const newQty = prevQty + 1;

      userOrders[chatId] = { productKey, qty: newQty, messageId };
      const { messageText, keyboard } = generateCalculatorView(productKey, newQty);

      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      }).catch(() => {});
    }

    // ➖ মাইনাস বাটনে চাপ দিলে: পরিমাণ ১ হ্রাস পাবে এবং টাকা নতুন করে হিসাব হবে
    else if (data.startsWith("calc_dec_")) {
      const parts = data.split("_");
      const productKey = parts[2];
      const prevQty = parseInt(parts[3]) || 1;

      if (prevQty <= 1) {
        bot.answerCallbackQuery(query.id, { text: "সর্বনিম্ন পরিমাণ ১ টি!" });
        return;
      }

      bot.answerCallbackQuery(query.id);
      const newQty = prevQty - 1;

      userOrders[chatId] = { productKey, qty: newQty, messageId };
      const { messageText, keyboard } = generateCalculatorView(productKey, newQty);

      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      }).catch(() => {});
    }

    // ✏️ Custom Quantity: নিজের ইচ্ছামতো সংখ্যা লিখে পাঠানো
    else if (data.startsWith("calc_custom_")) {
      const productKey = data.replace("calc_custom_", "");
      userOrders[chatId] = { productKey, awaitingCustom: true, messageId };

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        "✏️ *আপনি কত পিস নিতে চান?*\nশুধু সংখ্যাটি লিখে পাঠান (যেমন: 5, 10, 50):",
        { parse_mode: "Markdown" }
      );
    }

    // Confirm Order বাটন
    else if (data.startsWith("calc_confirm_")) {
      const parts = data.split("_");
      const productKey = parts[2];
      const qty = parseInt(parts[3]) || 1;
      const prod = PRODUCTS[productKey];

      if (!prod || prod.stock <= 0) {
        bot.answerCallbackQuery(query.id, {
          text: `❌ দুঃখিত! ${prod ? prod.name : "প্রোডাক্ট"} বর্তমানে স্টক আউট (Out of Stock)!`,
          show_alert: true
        });
      } else {
        bot.answerCallbackQuery(query.id, {
          text: "⚠️ আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ডিপোজিট করুন।",
          show_alert: true
        });
      }
    }

    // Cancel বাটন: বাতিল করে আগের ৫টি মেইল প্রোডাক্টের লিস্টে ফেরা
    else if (data === "calc_cancel") {
      bot.answerCallbackQuery(query.id, { text: "বাতিল করা হয়েছে" });
      delete userOrders[chatId];

      if (typeof getTrustedMailView === "function") {
        const { mailText, mailKeyboard } = getTrustedMailView();
        await bot.editMessageText(mailText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...mailKeyboard
        }).catch(() => {});
      }
    }
  });

  // ২. ইউজার যখন মেসেজে সংখ্যা লিখে পাঠাবে (কাস্টম কোয়ান্টিটি অটো-হিসাব)
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userOrders[chatId] && userOrders[chatId].awaitingCustom && text) {
      const parsedQty = parseInt(text.trim());
      const { productKey, messageId } = userOrders[chatId];

      if (isNaN(parsedQty) || parsedQty <= 0) {
        bot.sendMessage(chatId, "⚠️ অনুগ্রহ করে সঠিক সংখ্যা লিখুন (যেমন: 1, 5, 10)।");
        return;
      }

      userOrders[chatId] = { productKey, qty: parsedQty, messageId };
      const { messageText, keyboard } = generateCalculatorView(productKey, parsedQty);

      if (messageId) {
        bot.editMessageText(messageText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...keyboard
        }).catch(async () => {
          await bot.sendMessage(chatId, messageText, {
            parse_mode: "Markdown",
            ...keyboard
          });
        });
      } else {
        await bot.sendMessage(chatId, messageText, {
          parse_mode: "Markdown",
          ...keyboard
        });
      }
    }
  });
}

module.exports = {
  PRODUCTS,
  handleOrderCalculator,
  generateCalculatorView
};
