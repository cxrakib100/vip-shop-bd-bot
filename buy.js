// buyProduct.js - বাই প্রোডাক্ট ও ক্যাটাগরি মডিউল

module.exports = function(bot, ADMIN_ID) {
  // ১. ইউজার যখন "Buy Product" বাটনে চাপ দেবে
  bot.onText(/Buy Product|🤑 Buy Product|\/buy/i, async (msg) => {
    const chatId = msg.chat.id;

    const categoryText = `🤑 *কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:*`;

    const categoryKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: "🔑 ALL VPN", 
              callback_data: "cat_vpn",
              style: "primary" // নীল বাটন
            }
          ],
          [
            { 
              text: "✉️ Trusted Mail", 
              callback_data: "cat_mail",
              style: "danger" // লাল বাটন
            }
          ],
          [
            { 
              text: "📲 Proxy", 
              callback_data: "cat_proxy",
              style: "success" // সবুজ বাটন
            }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, categoryText, {
      parse_mode: "Markdown",
      ...categoryKeyboard
    });
  });

  // ২. বাটন কলব্যাক হ্যান্ডলার
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // ক্যাটাগরি ১: Trusted Mail (স্ক্রিনশটের হুবহু ৫টি প্রোডাক্ট সহ অপশন)
    if (data === "cat_mail") {
      bot.answerCallbackQuery(query.id);

      const mailText = `🛍️ *Trusted Mail প্রোডাক্ট সিলেক্ট করুন:*`;

      const mailKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "Outlook fr | 1.00 TK | Out of Stock", 
                callback_data: "prod_out_of_stock_outlook",
                style: "primary"
              }
            ],
            [
              { 
                text: "Hotmail | 1.00 TK | Out of Stock", 
                callback_data: "prod_out_of_stock_hotmail",
                style: "primary"
              }
            ],
            [
              { 
                text: "Meta AI ID | 0.50 TK | Out of Stock", 
                callback_data: "prod_out_of_stock_meta_ai",
                style: "primary"
              }
            ],
            [
              { 
                text: "Meta AI OTP access | 0.60 TK | Out of Stock", 
                callback_data: "prod_out_of_stock_meta_otp",
                style: "primary"
              }
            ],
            [
              { 
                text: "Meta Horizon | 0.60 TK | Out of Stock", 
                callback_data: "prod_out_of_stock_meta_horizon",
                style: "primary"
              }
            ],
            [
              { 
                text: "🔙 Back", 
                callback_data: "back_to_categories",
                style: "success" // সবুজ ব্যাক বাটন
              }
            ]
          ]
        }
      };

      await bot.editMessageText(mailText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...mailKeyboard
      });
    }

    // ক্যাটাগরি ২: ALL VPN (সোল্ড আউট)
    else if (data === "cat_vpn") {
      bot.answerCallbackQuery(query.id, { 
        text: "❌ দুঃখিত, ALL VPN বর্তমানে স্টক আউট (Sold Out)!", 
        show_alert: true 
      });

      const vpnText = `🔑 *ALL VPN ক্যাটাগরি:*
━━━━━━━━━━━━━━
❌ *স্টক স্ট্যাটাস: সোল্ড আউট (Sold Out / Out of Stock)*

বর্তমানে কোনো VPN স্টক এভেইলেবল নেই। নতুন স্টক আসলে আপডেট দেওয়া হবে।
━━━━━━━━━━━━━━`;

      const backKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 এডমিন হেল্পলাইন", url: `tg://user?id=${ADMIN_ID}` }
            ],
            [
              { text: "🔙 Back", callback_data: "back_to_categories", style: "success" }
            ]
          ]
        }
      };

      await bot.editMessageText(vpnText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...backKeyboard
      });
    }

    // ক্যাটাগরি ৩: Proxy (সোল্ড আউট)
    else if (data === "cat_proxy") {
      bot.answerCallbackQuery(query.id, { 
        text: "❌ দুঃখিত, Proxy বর্তমানে স্টক আউট (Sold Out)!", 
        show_alert: true 
      });

      const proxyText = `📲 *Proxy ক্যাটাগরি:*
━━━━━━━━━━━━━━
❌ *স্টক স্ট্যাটাস: সোল্ড আউট (Sold Out / Out of Stock)*

বর্তমানে কোনো Proxy স্টক এভেইলেবল নেই। নতুন স্টক আসলে আপডেট দেওয়া হবে।
━━━━━━━━━━━━━━`;

      const backKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 এডমিন হেল্পলাইন", url: `tg://user?id=${ADMIN_ID}` }
            ],
            [
              { text: "🔙 Back", callback_data: "back_to_categories", style: "success" }
            ]
          ]
        }
      };

      await bot.editMessageText(proxyText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...backKeyboard
      });
    }

    // ট্রাস্টেড মেইলের আউট অব স্টক প্রোডাক্টে ক্লিক করলে অ্যালার্ট পপআপ
    else if (data.startsWith("prod_out_of_stock_")) {
      bot.answerCallbackQuery(query.id, {
        text: "⚠️ দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট (Out of Stock)!",
        show_alert: true
      });
    }

    // 🔙 Back বাটন: আবার প্রধান ক্যাটাগরিতে ফিরে যাওয়া
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
};
