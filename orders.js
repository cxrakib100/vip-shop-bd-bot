module.exports = function (bot) {
  bot.onText(/Order History/, async (msg) => {
    const chatId = msg.chat.id;
    const text = `⌛ <b>অর্ডার হিস্টোরি:</b>\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `আপনার একাউন্টে বর্তমানে কোনো অর্ডারের রেকর্ড নেই।\n` +
                 `নতুন পণ্য কিনতে <b>🤑 Buy Product</b> বাটনে ক্লিক করুন।`;

    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });
};
