// buyProduct.js - বাই প্রোডাক্ট ও ৫টি মেইল ক্যাটাগরি ফাইল
const { handleOrderCalculator } = require("./orderCalculator");

// Trusted Mail-এর ৫টি প্রোডাক্টের মেনু
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
  // ১. "Buy Product" বাটনে চাপ দিলে ক্যাটাগরি মেনু
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

  // ২. ক্যাটাগরি কলব্যাক
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // Trusted Mail চাপলে ৫টি মেইল দেখানো
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

    // ALL VPN (সোল্ড আউট)
    else if (data === "cat_vpn") {
      bot.answerCallbackQuery(query.id, {
        text: "❌ দুঃখিত, ALL VPN বর্তমানে স্টক আউট (Sold Out)!",
        show_alert: true
      });
    }

    // Proxy (সোল্ড আউট)
    else if (data === "cat_proxy") {
      bot.answerCallbackQuery(query.id, {
        text: "❌ দুঃখিত, Proxy বর্তমানে স্টক আউট (Sold Out)!",
        show_alert: true
      });
    }

    // ব্যাক বাটন
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

  // ৩. আলাদা ক্যালকুলেটর ফাইল যুক্ত করা
  handleOrderCalculator(bot, ADMIN_ID, getTrustedMailView);
};
