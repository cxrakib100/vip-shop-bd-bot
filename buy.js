// buyProduct.js - বাই প্রোডাক্ট ও ক্যাটাগরি মডিউল

module.exports = function(bot, ADMIN_ID) {
  // ১. ইউজার যখন "Buy Product" বাটনে চাপ দেবে
  bot.onText(/Buy Product|🤑 Buy Product|\/buy/i, async (msg) => {
    const chatId = msg.chat.id;

    // স্ক্রিনশটের মতো বোল্ড ডিজাইন মেসেজ
    const categoryText = `🤑 *কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:*`;

    // স্ক্রিনশটের হুবহু কালার ও বাটন
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

  // ২. ক্যাটাগরি বাটনে ক্লিক করার হ্যান্ডলার (যাতে পরবর্তীতে আপনি এর ভেতরে আরও প্রোডাক্ট যোগ করতে পারেন)
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // ক্যাটাগরি ১: ALL VPN
    if (data === "cat_vpn") {
      bot.answerCallbackQuery(query.id);
      const vpnText = `🔑 *ALL VPN ক্যাটাগরি:*
━━━━━━━━━━━━━━
বর্তমানে উপলব্ধ VPN সমূহ:
• *Nord VPN*
• *Express VPN*
• *Surfshark VPN*

*(এখানে আপনি পরবর্তীতে আপনার নির্দিষ্ট প্যাকেজ ও মূল্য যুক্ত করতে পারবেন)*
━━━━━━━━━━━━━━`;

      const actionKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 সরাসরি কিনতে এডমিন চ্যাট", url: `tg://user?id=${ADMIN_ID}` }
            ],
            [
              { text: "🔙 পেছনে যান (Back)", callback_data: "back_to_categories" }
            ]
          ]
        }
      };

      await bot.editMessageText(vpnText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...actionKeyboard
      });
    }

    // ক্যাটাগরি ২: Trusted Mail
    else if (data === "cat_mail") {
      bot.answerCallbackQuery(query.id);
      const mailText = `✉️ *Trusted Mail ক্যাটাগরি:*
━━━━━━━━━━━━━━
বর্তমানে উপলব্ধ মেইল সমূহ:
• *Gmail (Old / Fresh)*
• *Outlook / Hotmail*
• *Yahoo Mail*

*(এখানে আপনি পরবর্তীতে আপনার নির্দিষ্ট মেইল প্যাকেজ ও রেট যুক্ত করতে পারবেন)*
━━━━━━━━━━━━━━`;

      const actionKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 সরাসরি কিনতে এডমিন চ্যাট", url: `tg://user?id=${ADMIN_ID}` }
            ],
            [
              { text: "🔙 পেছনে যান (Back)", callback_data: "back_to_categories" }
            ]
          ]
        }
      };

      await bot.editMessageText(mailText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...actionKeyboard
      });
    }

    // ক্যাটাগরি ৩: Proxy
    else if (data === "cat_proxy") {
      bot.answerCallbackQuery(query.id);
      const proxyText = `📲 *Proxy ক্যাটাগরি:*
━━━━━━━━━━━━━━
বর্তমানে উপলব্ধ প্রক্সি সমূহ:
• *Residential Proxy*
• *Dedicated ISP Proxy*
• *Rotating Proxy*

*(এখানে আপনি পরবর্তীতে আপনার নির্দিষ্ট প্রক্সি প্যাকেজ ও রেট যুক্ত করতে পারবেন)*
━━━━━━━━━━━━━━`;

      const actionKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 সরাসরি কিনতে এডমিন চ্যাট", url: `tg://user?id=${ADMIN_ID}` }
            ],
            [
              { text: "🔙 পেছনে যান (Back)", callback_data: "back_to_categories" }
            ]
          ]
        }
      };

      await bot.editMessageText(proxyText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...actionKeyboard
      });
    }

    // পেছনের ক্যাটাগরিতে ফেরত আসা (Back Button)
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
