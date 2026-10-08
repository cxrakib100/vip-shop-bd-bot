// keyboards.js - সব বাটন ডিজাইন

function getMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        // ১. Buy Product (বড় সবুজ বাটন)
        [{ text: "💵 Buy Product" }],
        // ২. প্রোফাইল ও ডিপোজিট (পাশাপাশি)
        [{ text: "👤 Profile" }, { text: "🏦 Deposit" }],
        // ৩. অর্ডার হিস্টোরি ও সাপোর্ট (পাশাপাশি)
        [{ text: "⌛ Order History" }, { text: "🛑 Support" }]
      ],
      resize_keyboard: true
    }
  };
}

module.exports = { getMainKeyboard };
