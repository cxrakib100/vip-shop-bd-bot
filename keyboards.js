// সব ধরনের বাটন এবং লেআউট এই ফাইলে সংরক্ষিত থাকবে
// Telegram ReplyKeyboardButton-এ style/color property নেই; text ও layout অপরিবর্তিত রাখা হয়েছে।

// ১. মেইন মেনু কিবোর্ড
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [
        { text: '🤑 Buy Product' }
      ],
      [
        { text: '👤 Profile' },
        { text: '🏦 Deposit' }
      ],
      [
        { text: '⌛ Order History' },
        { text: '🛡️ Support' }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

// ২. ডিপোজিট পেমেন্ট মেথড বাছাইয়ের ইনলাইন কিবোর্ড
const depositMethodsKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📱 বিকাশ (bKash)', callback_data: 'dep_bkash' },
        { text: '📱 নগদ (Nagad)', callback_data: 'dep_nagad' }
      ],
      [
        { text: '📱 রকেট (Rocket)', callback_data: 'dep_rocket' },
        { text: '💎 Binance (USDT)', callback_data: 'dep_usdt' }
      ],
      [
        { text: '❌ বাতিল করুন', callback_data: 'dep_cancel' }
      ]
    ]
  }
};

// ৩. ট্রানজেকশন সাবমিট করার বাটন
const submitTrxKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📝 TrxID সাবমিট করুন', callback_data: 'dep_submit_trx' }
      ],
      [
        { text: '🔙 ব্যাকে যান', callback_data: 'dep_back' }
      ]
    ]
  }
};

module.exports = {
  mainKeyboard,
  depositMethodsKeyboard,
  submitTrxKeyboard
};
