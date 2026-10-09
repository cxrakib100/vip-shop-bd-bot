// ডিপোজিট সংক্রান্ত সকল কার্যাবলি এই ফাইলে পরিচালিত হবে
const { depositMethodsKeyboard, submitTrxKeyboard } = require('./keyboards');

// আপনার পেমেন্ট নম্বরসমূহ (প্রয়োজনে পরিবর্তন করে নিবেন)
const PAYMENT_INFO = {
  bkash: '017XXXXXXXX (Personal)',
  nagad: '019XXXXXXXX (Personal)',
  rocket: '018XXXXXXXX (Personal)',
  usdt: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx (TRC20)'
};

// ইউজারের ডিপোজিট সেশন ট্র্যাক করার অবজেক্ট
const userDepositState = {};

function setupDeposit(bot, ADMIN_ID) {

  // ১. ইউজার যখন 🏦 Deposit বাটনে ক্লিক করবে
  bot.onText(/Deposit/, async (msg) => {
    const chatId = msg.chat.id;
    userDepositState[chatId] = null; // রিসেট স্টেট

    const text = `🏦 <b>ব্যালেন্স ডিপোজিট সিস্টেম</b>\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `টাকা যুক্ত করার জন্য নিচের যেকোনো একটি মাধ্যমে পেমেন্ট নির্বাচন করুন:\n\n` +
                 `🔹 <b>মিনিমাম ডিপোজিট:</b> ৫০ টাকা\n` +
                 `⚡ <b>ভেরিফিকেশন:</b> ৫-১০ মিনিট\n` +
                 `━━━━━━━━━━━━━━━━━━`;

    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      ...depositMethodsKeyboard
    });
  });

  // ২. ইনলাইন বাটন ক্লিকের হ্যান্ডলার (কলব্যাক কুয়েরি)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // পেমেন্ট মেথড সিলেক্ট করলে
    if (data.startsWith('dep_') && data !== 'dep_cancel' && data !== 'dep_back' && data !== 'dep_submit_trx') {
      const method = data.replace('dep_', '');
      userDepositState[chatId] = { method: method.toUpperCase(), step: 'awaiting_payment' };

      let number = PAYMENT_INFO[method] || 'যোগাযোগ করুন';
      let title = method === 'usdt' ? 'USDT (TRC20)' : method.toUpperCase();

      const detailsText = `💳 <b>${title} ডিপোজিট তথ্য:</b>\n` +
                          `━━━━━━━━━━━━━━━━━━\n` +
                          `📌 <b>নম্বর/অ্যাড্রেস:</b> <code>${number}</code> (ক্লিক করলে কপি হবে)\n\n` +
                          `⚠️ <b>নিয়মাবলী:</b>\n` +
                          `১. উপরে দেওয়া নম্বরে <b>Send Money</b> করুন।\n` +
                          `২. টাকা পাঠানো সম্পন্ন হলে নিচে <b>"📝 TrxID সাবমিট করুন"</b> বাটনে চাপুন।\n` +
                          `━━━━━━━━━━━━━━━━━━`;

      await bot.editMessageText(detailsText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        ...submitTrxKeyboard
      });
      return;
    }

    // ট্রানজেকশন আইডি সাবমিট বাটনে চাপলে
    if (data === 'dep_submit_trx') {
      if (!userDepositState[chatId]) {
        userDepositState[chatId] = { method: 'MANUAL' };
      }
      userDepositState[chatId].step = 'awaiting_trx_input';

      await bot.sendMessage(chatId, `✍️ <b>অনুগ্রহ করে আপনার পাঠানো টাকার পরিমাণ এবং TrxID লিখে মেসেজ পাঠান।</b>\n\nউদাহরণ:\n<code>500 Tk, TrxID: 9J3K8L2M</code>`, {
        parse_mode: 'HTML'
      });
      return;
    }

    // ব্যাক বাটনে চাপলে
    if (data === 'dep_back') {
      userDepositState[chatId] = null;
      await bot.editMessageText(`🏦 <b>পেমেন্ট মেথড নির্বাচন করুন:</b>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        ...depositMethodsKeyboard
      });
      return;
    }

    // বাতিল করলে
    if (data === 'dep_cancel') {
      userDepositState[chatId] = null;
      await bot.deleteMessage(chatId, messageId).catch(() => {});
      await bot.sendMessage(chatId, `❌ ডিপোজিট প্রক্রিয়া বাতিল করা হয়েছে।`);
      return;
    }

    // এডমিন কর্তৃক ডিপোজিট এক্সেপ্ট বা রিজেক্ট
    if (data.startsWith('admin_accept_') || data.startsWith('admin_reject_')) {
      if (chatId.toString() !== ADMIN_ID.toString()) return;

      const isAccept = data.startsWith('admin_accept_');
      const targetUser = data.replace('admin_accept_', '').replace('admin_reject_', '');

      if (isAccept) {
        await bot.sendMessage(targetUser, `🎉 <b>আপনার ডিপোজিট সফলভাবে ভেরিফাই করা হয়েছে!</b>\nটাকা আপনার অ্যাকাউন্টে যোগ করা হয়েছে। ধন্যবাদ!`, { parse_mode: 'HTML' });
        await bot.editMessageText(query.message.text + `\n\n✅ <b>স্ট্যাটাস: অনুমোদিত (Accepted)</b>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
      } else {
        await bot.sendMessage(targetUser, `❌ <b>আপনার ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।</b>\nভুল TrxID বা কোনো সমস্যা থাকলে সাপোর্টে যোগাযোগ করুন।`, { parse_mode: 'HTML' });
        await bot.editMessageText(query.message.text + `\n\n❌ <b>স্ট্যাটাস: বাতিল (Rejected)</b>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
      }
    }
  });

  // ৩. ইউজার যখন TrxID লিখে সেন্ড করবে (মেসেজ হ্যান্ডলার)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // যদি কমান্ড বা বাটন টেক্সট হয় তবে ইগনোর করবে
    if (!text || text.startsWith('/') || text.includes('Deposit') || text.includes('Buy Product')) return;

    // ইউজার যদি TrxID সাবমিট করার স্টেপে থাকে
    if (userDepositState[chatId] && userDepositState[chatId].step === 'awaiting_trx_input') {
      const method = userDepositState[chatId].method || 'Not Specified';
      userDepositState[chatId] = null; // স্টেট ক্লিয়ার

      // ইউজারকে কনফার্মেশন পাঠানো
      await bot.sendMessage(chatId, `✅ <b>আপনার ডিপোজিট তথ্য জমা নেওয়া হয়েছে!</b>\n\nএডমিন তথ্যটি যাচাই করে শীঘ্রই আপনার একাউন্টে ব্যালেন্স যুক্ত করে দিবে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।`, {
        parse_mode: 'HTML'
      });

      // সরাসরি এডমিনকে (6640939571) রিকোয়েস্ট পাঠানো
      const adminNotice = `🔔 <b>নতুন ডিপোজিট রিকোয়েস্ট এসেছে!</b>\n` +
                          `━━━━━━━━━━━━━━━━━━\n` +
                          `👤 <b>ইউজার:</b> ${msg.from.first_name} ${msg.from.last_name || ''}\n` +
                          `🆔 <b>ইউজার আইডি:</b> <code>${chatId}</code>\n` +
                          `📱 <b>ইউজারনেম:</b> @${msg.from.username || 'নাই'}\n` +
                          `💳 <b>মেথড:</b> ${method}\n` +
                          `📝 <b>তথ্য/TrxID:</b>\n<code>${text}</code>\n` +
                          `━━━━━━━━━━━━━━━━━━`;

      await bot.sendMessage(ADMIN_ID, adminNotice, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ এক্সেপ্ট (Accept)', callback_data: `admin_accept_${chatId}` },
              { text: '❌ রিজেক্ট (Reject)', callback_data: `admin_reject_${chatId}` }
            ]
          ]
        }
      });
    }
  });
}

module.exports = { setupDeposit };
