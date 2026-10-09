// orderCalculator.js - অটোমেটিক হিসাব, ফাস্ট নম্বর কিবোর্ড ও প্রোডাক্ট ক্যালকুলেটর

// ৫টি মেইল প্রোডাক্টের সঠিক তালিকা ও প্রাইস
const PRODUCTS = {
  outlook: {
    id: "outlook",
    name: "Outlook fr",
    price: 1.00,
    stock: 0
  },
  hotmail: {
    id: "hotmail",
    name: "Hotmail",
    price: 1.00,
    stock: 0
  },
  meta_ai: {
    id: "meta_ai",
    name: "Meta AI ID",
    price: 0.50,
    stock: 0
  },
  meta_otp: {
    id: "meta_otp",
    name: "Meta AI OTP access",
    price: 0.60,
    stock: 0
  },
  meta_horizon: {
    id: "meta_horizon",
    name: "Meta Horizon",
    price: 0.60,
    stock: 0
  }
};

// ইউজার স্টেট
const userOrders = {};

// বাংলা ও ইংরেজি উভয় সংখ্যা কনভার্ট করার ফাংশন
function parseNumberInput(input) {
  if (!input) return 1;
  const bnDigits = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
  const str = input.toString().replace(/[০-৯]/g, d => bnDigits[d]).replace(/[^0-9]/g, '').trim();
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

// সাধারণ অর্ডার ভিউ (স্ক্রিনশটের মতো)
function generateCalculatorView(productKey, qty = 1) {
  const prod = PRODUCTS[productKey] || { name: "Outlook fr", price: 1.00, stock: 0 };
  const currentQty = parseInt(qty) > 0 ? parseInt(qty) : 1;
  const totalCost = (prod.price * currentQty).toFixed(2);
  const stockText = prod.stock > 0 ? `🟢 ${prod.stock} pcs` : "❌ Out of Stock";

  const messageText = `🤑 *${prod.name}*
💰 *প্রাইস:* ${prod.price.toFixed(2)} TK
*স্টক:* ${stockText}

*পরিমাণ:* ${currentQty}
*মোট খরচ:* ${totalCost} TK`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `calc:dec:${productKey}:${currentQty}`, style: "danger" },
          { text: `${currentQty}`, callback_data: `calc:keypad:${productKey}:${currentQty}`, style: "primary" },
          { text: "➕", callback_data: `calc:inc:${productKey}:${currentQty}`, style: "success" }
        ],
        [
          { text: "✏️ Custom Quantity", callback_data: `calc:keypad:${productKey}:${currentQty}`, style: "success" }
        ],
        [
          { text: "Confirm Order", callback_data: `calc:confirm:${productKey}:${currentQty}`, style: "success" },
          { text: "Cancel", callback_data: "calc:cancel", style: "danger" }
        ]
      ]
    }
  };

  return { messageText, keyboard };
}

// বটের ভেতরেই লাইভ নম্বরিং কিবোর্ড ভিউ (Super Fast Live Calculator)
function generateKeypadView(productKey, currentInput = "1") {
  const prod = PRODUCTS[productKey] || { name: "Outlook fr", price: 1.00, stock: 0 };
  const qty = parseNumberInput(currentInput);
  const totalCost = (prod.price * qty).toFixed(2);
  const stockText = prod.stock > 0 ? `🟢 ${prod.stock} pcs` : "❌ Out of Stock";

  const messageText = `🤑 *${prod.name}*
💰 *প্রাইস:* ${prod.price.toFixed(2)} TK
*স্টক:* ${stockText}

⌨️ *লাইভ ক্যালকুলেটর:*
*পরিমাণ:* *${qty}* টি
*মোট খরচ:* *${totalCost} TK*
_(নিচের নম্বর চাপুন অথবা চ্যাটে বাংলায়/ইংরেজিতে লিখে পাঠান)_`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "1", callback_data: `pad:press:${productKey}:${currentInput}:1` },
          { text: "2", callback_data: `pad:press:${productKey}:${currentInput}:2` },
          { text: "3", callback_data: `pad:press:${productKey}:${currentInput}:3` }
        ],
        [
          { text: "4", callback_data: `pad:press:${productKey}:${currentInput}:4` },
          { text: "5", callback_data: `pad:press:${productKey}:${currentInput}:5` },
          { text: "6", callback_data: `pad:press:${productKey}:${currentInput}:6` }
        ],
        [
          { text: "7", callback_data: `pad:press:${productKey}:${currentInput}:7` },
          { text: "8", callback_data: `pad:press:${productKey}:${currentInput}:8` },
          { text: "9", callback_data: `pad:press:${productKey}:${currentInput}:9` }
        ],
        [
          { text: "⌫ মুছুন", callback_data: `pad:backspace:${productKey}:${currentInput}`, style: "danger" },
          { text: "0", callback_data: `pad:press:${productKey}:${currentInput}:0` },
          { text: "✅ Done", callback_data: `pad:done:${productKey}:${qty}`,
