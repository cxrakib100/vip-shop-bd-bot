module.exports = function (bot) {
  bot.onText(/Profile/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'Customer';
    const username = msg.from.username ? `@${msg.from.username}` : 'নাই';

    const text = `👤 <b>আপনার প্রোফাইল তথ্য:</b>\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `🆔 <b>ইউজার আইডি:</b> <code>${chatId}</code>\n` +
                 `📛 <b>নাম:</b> ${name}\n` +
                 `📱 <b>ইউজারনেম:</b> ${username}\n` +
                 `💰 <b>ব্যালেন্স:</b> 0.00 ৳ (BDT)\n` +
                 `📦 <b>মোট অর্ডার:</b> 0 টি\n` +
                 `━━━━━━━━━━━━━━━━━━`;

    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });
};
