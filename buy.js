// buyProduct.js - বাই প্রোডাক্ট, ক্যাটাগরি ও অর্ডার কাউন্টার মডিউল

// প্রোডাক্ট তালিকা ও প্রাইস ডেটাবেস
const PRODUCTS = {
  outlook: {
    id: "outlook",
    name: "Outlook fr",
    price: 1.00,
    stock: 0 // ০ থাকলে Out of Stock দেখাবে, স্টক থাকলে সংখ্যা বসাবেন
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

// ইউজারের সিলেক্ট করা পরিমাণ ও অর্ডার স্টেট
const userOrderState = {};

// স্ক্রিনশটের হুবহু অর্ডার ভিউ ও বাটন তৈরি করার ফাংশন
function renderOrderView(productKey, qty = 1) {
  const prod = PRODUCTS[productKey];
  const totalCost = (prod.price * qty).toFixed(2);
  const stockText = prod.stock > 0 ? `🟢 ${prod.stock} Available` : "❌ Out of Stock";

  const messageText = `🤑 *${prod.name}*
💰 *প্রাইস:* ${prod.price.toFixed(2)} TK
*স্টক:* ${stockText}

*পরিমাণ:* ${qty}
*মোট খরচ:* ${totalCost} TK`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `qty_dec_${productKey}_${qty}`, style: "danger" },
          { text: `${qty}`, callback_data: `qty_curr_${productKey}`, style: "primary" },
          { text: "➕", callback_data: `qty_inc_${productKey}_${qty}`, style: "success" }
        ],
        [
          { text: "✏️ Custom Quantity", callback_data: `qty_custom_${productKey}`, style: "success" }
        ],
        [
          { text: "Confirm Order", callback_data: `order_confirm_${productKey}_${qty}`, style: "success" },
          { text: "Cancel", callback_data: "cancel_order", style: "danger" }
        ]
      ]
    }
  };

  return { messageText, keyboard };
}

// Trusted Mail তালিকা ভিউ
function getTrustedMailView() {
  const mailText = `🛍️ *Trusted Mail প্রোডাক্ট সিলেক্ট করুন:*`;
  const mailKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Outlook fr | 1.00 TK | Out of Stock", callback_data: "view_prod_outlook", style: "primary" }
        ],
        [
          { text: "Hotmail | 1.00 TK | Out of Stock", callback_data: "view_prod_hotmail", style: "primary" }
        ],
        [
          { text: "Meta AI ID | 0.50 TK | Out of Stock", callback_data: "view_prod_meta_ai", style: "primary" }
        ],
        [
          { text: "Meta AI OTP access | 0.60 TK | Out of Stock", callback_data: "view_prod_meta_otp", style: "primary" }
        ],
        [
          { text: "Meta Horizon | 0.60 TK | Out of Stock", callback_data: "view_prod_meta_horizon", style: "primary" }
        ],
        [
          { text: "🔙 Back", callback_data: "back_to_categories", style: "success" }
        ]
      ]
    }
  };
  return { mailText, mailKeyboard };
}

module.exports = function(bot, ADMIN_ID) {
  // ১. ইউজার যখন "Buy Product" চাপবে
  bot.onText(/Buy Product|🤑 Buy Product|\/buy/i, async (msg) => {
    const chatId = msg.chat.id;

    const categoryText = `🤑 *কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:*`;
    const categoryKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔑 ALL VPN", callback_data: "cat_vpn", style: "primary" }
          ],
          [
            { text: "✉️ Trusted Mail", callback_data: "cat_mail", style: "danger" }
          ],
          [
            { text: "📲 Proxy", callback_data: "cat_proxy", style: "success" }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, categoryText, {
      parse_mode: "Markdown",
      ...categoryKeyboard
    });
  });

  // ২. ইনলাইন কলব্যাক হ্যান্ডলার
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // ক্যাটাগরি: Trusted Mail প্রোডাক্ট লিস্ট
    if (data === "cat_mail") {
      bot.answerCallbackQuery(query.id);
      const { mailText, mailKeyboard } = getTrustedMailView();
      await bot.editMessageText(mailText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...mailKeyboard
      });
    }

    // প্রোডাক্ট ভিউ স্ক্রিন (Outlook, Hotmail ইত্যাদি যেকোনো প্রোডাক্টের জন্য)
    else if (data.startsWith("view_prod_")) {
      bot.answerCallbackQuery(query.id);
      const productKey = data.replace("view_prod_", "");
      userOrderState[chatId] = { productKey, qty: 1 };

      const { messageText, keyboard } = renderOrderView(productKey, 1);
      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      });
    }

    // পরিমাণ বৃদ্ধি (➕ বাটন)
    else if (data.startsWith("qty_inc_")) {
      bot.answerCallbackQuery(query.id);
      const parts = data.split("_");
      const productKey = parts[2];
      const currentQty = parseInt(parts[3]) || 1;
      const newQty = currentQty + 1;

      userOrderState[chatId] = { productKey, qty: newQty };
      const { messageText, keyboard } = renderOrderView(productKey, newQty);

      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      }).catch(() => {});
    }

    // পরিমাণ হ্রাস (➖ বাটন)
    else if (data.startsWith("qty_dec_")) {
      const parts = data.split("_");
      const productKey = parts[2];
      const currentQty = parseInt(parts[3]) || 1;

      if (currentQty <= 1) {
        bot.answerCallbackQuery(query.id, { text: "সর্বনিম্ন পরিমাণ ১ টি!" });
        return;
      }

      bot.answerCallbackQuery(query.id);
      const newQty = currentQty - 1;

      userOrderState[chatId] = { productKey, qty: newQty };
      const { messageText, keyboard } = renderOrderView(productKey, newQty);

      await bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...keyboard
      }).catch(() => {});
    }

    // কাস্টম পরিমাণ টাইপ করার বাটন (✏️ Custom Quantity)
    else if (data.startsWith("qty_custom_")) {
      const productKey = data.replace("qty_custom_", "");
      userOrderState[chatId] = { productKey, awaitingCustom: true, messageId };

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(
        chatId,
        "✏️ *কত পিস নিতে চান?*\nশুধু সংখ্যাটি লিখে মেসেজ পাঠান (যেমন: 5 বা 10):",
        { parse_mode: "Markdown" }
      );
    }

    // অর্ডার কনফার্ম বাটন (Confirm Order)
    else if (data.startsWith("order_confirm_")) {
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

    // অর্ডার বাতিল করে মেইল তালিকায় ফেরা (Cancel)
    else if (data === "cancel_order") {
      bot.answerCallbackQuery(query.id, { text: "অর্ডার বাতিল করা হয়েছে" });
      delete userOrderState[chatId];

      const { mailText, mailKeyboard } = getTrustedMailView();
      await bot.editMessageText(mailText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...mailKeyboard
      });
    }

    // ক্যাটাগরি: ALL VPN (সোল্ড আউট)
    else if (data === "cat_vpn") {
      bot.answerCallbackQuery(query.id, {
        text: "❌ দুঃখিত, ALL VPN বর্তমানে স্টক আউট (Sold Out)!",
        show_alert: true
      });
    }

    // ক্যাটাগরি: Proxy (সোল্ড আউট)
    else if (data === "cat_proxy") {
      bot.answerCallbackQuery(query.id, {
        text: "❌ দুঃখিত, Proxy বর্তমানে স্টক আউট (Sold Out)!",
        show_alert: true
      });
    }

    // পেছনের প্রধান ক্যাটাগরিতে ফিরে যাওয়া (🔙 Back)
    else if (data === "back_to_categories") {
      bot.answerCallbackQuery(query.id);
      const categoryText = `🤑 *কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:*`;
      const categoryKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔑 ALL VPN", callback_data: "cat_vpn", style: "primary" }
            ],
            [
              { text: "✉️ Trusted Mail", callback_data: "cat_mail", style: "danger" }
            ],
            [
              { text: "📲 Proxy", callback_data: "cat_proxy", style: "success" }
            ]
          ]
        }
      };

      await bot.editMessageText(categoryText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...categoryKeyboard
      });
    }
  });

  // ৩. ইউজার যখন কাস্টম সংখ্যা লিখে পাঠাবে
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userOrderState[chatId] && userOrderState[chatId].awaitingCustom && text) {
      const qty = parseInt(text.trim());
      const { productKey } = userOrderState[chatId];

      if (isNaN(qty) || qty <= 0) {
        bot.sendMessage(chatId, "⚠️ অনুগ্রহ করে সঠিক সংখ্যা লিখুন (যেমন: 1, 5, 10)।");
        return;
      }

      userOrderState[chatId] = { productKey, qty };

      const { messageText, keyboard } = renderOrderView(productKey, qty);
      await bot.sendMessage(chatId, messageText, {
        parse_mode: "Markdown",
        ...keyboard
      });
    }
  });
};
