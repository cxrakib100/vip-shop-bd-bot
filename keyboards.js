// সব ধরনের বাটন এবং রং (Button Styles) এই ফাইলে সংরক্ষিত থাকবে

// ১. মেইন মেনু কিবোর্ড (হুবহু স্ক্রিনশটের কালার সহ)
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      // ১ম সারি: সবুজ বাটন (success)
      [
        { text: '🤑 Buy Product', style: 'success' }
      ],
      // ২য় সারি: নীল বাটন (primary) এবং সবুজ বাটন (success)
      [
        { text: '👤 Profile', style: 'primary' },
        { text: '🏦 Deposit', style: 'success' }
      ],
      // ৩য় সারি: নীল বাটন (primary) এবং লাল বাটন (danger)
      [
        { text: '⌛ Order History', style: 'primary' },
        { text: '🛡️ Support', style: 'danger' }
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
