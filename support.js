module.exports = function (bot, ADMIN_ID) {
  bot.onText(/Support/, async (msg) => {
    const chatId = msg.chat.id;
    const text = `🛡️ <b>কাস্টমার সাপোর্ট:</b>\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `যেকোনো সহায়তার জন্য সরাসরি যোগাযোগ করুন:\n\n` +
                 `👨‍💻 <b>এডমিন চ্যাট:</b> <a href="tg://user?id=${ADMIN_ID}">সরাসরি মেসেজ দিন</a>\n` +
                 `⏰ <b>সার্ভিস টাইম:</b> ২৪/৭ এক্টিভ`;

    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });
};
