module.exports = function (bot, ADMIN_ID) {
  bot.onText(/Buy Product/, async (msg) => {
    const chatId = msg.chat.id;

    const text = `🛍️ <b>পণ্য তালিকা ও স্টক (Products):</b>\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `🔹 <b>১. মেটা / ফেসবুক একাউন্ট</b>\n` +
                 `• কোয়ালিটি: ফুল ফ্রেশ গ্যারান্টি\n` +
                 `• স্টক: এভেইলেবল 🟢\n\n` +
                 `🔹 <b>২. প্রিমিয়াম প্রক্সি (Proxy)</b>\n` +
                 `• হাই-স্পিড ডেডিকেটেড আইপি\n` +
                 `• স্টক: এভেইলেবল 🟢\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `অর্ডার করতে বা বিস্তারিত জানতে নিচে ক্লিক করুন 👇`;

    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 সরাসরি অর্ডার করুন (Order Now)', url: `tg://user?id=${ADMIN_ID}` }]
        ]
      }
    });
  });
};
