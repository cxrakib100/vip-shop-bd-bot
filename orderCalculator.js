// orderCalculator.js - অটোমেটিক ক্যালকুলেটর, নম্বর কিবোর্ড এবং লাইভ হিসাব সিস্টেম

// বাংলা সংখ্যা থেকে ইংরেজি সংখ্যা রূপান্তর
function parseNumber(input) {
  if (!input) return 1;
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const englishStr = input.toString().replace(/[০-৯]/g, (match) => banglaDigits[match]);
  const parsed = parseInt(englishStr, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

// মোট খরচ হিসাব
function calculateTotal(unitPrice, quantity) {
  const price = parseFloat(unitPrice) || 0;
  const qty = parseInt(quantity, 10) || 1;
  return (price * qty).toFixed(2);
}

// লাইভ প্রোডাক্ট কার্ড তৈরি (পণ্যের আসল নাম হুবহু থাকবে, কখনো পরিবর্তন হবে না)
function formatOrderCard(product, quantity) {
  const qty = parseInt(quantity, 10) || 1;
  const unitPrice = parseFloat(product.price).toFixed(2);
  const totalCost = calculateTotal(unitPrice, qty);
  const stockText = product.stock > 0 ? `✅ In Stock (${product.stock})` : '❌ Out of Stock';

  return `🤑 *${product.name}*\n💰 *প্রাইস:* ${unitPrice} TK\n*স্টক:* ${stockText}\n\n*পরিমাণ:* ${qty}\n*মোট খরচ:* ${totalCost} TK`;
}

// সাধারণ প্লাস/মাইনাস কিবোর্ড
function getStandardKeyboard(prodKey, quantity) {
  const qty = parseInt(quantity, 10) || 1;

  return {
    inline_keyboard: [
      [
        { text: '➖', callback_data: `calc:dec:${prodKey}:${qty}` },
        { text: `${qty}`, callback_data: `calc:numpad:${prodKey}:${qty}` },
        { text: '➕', callback_data: `calc:inc:${prodKey}:${qty}` }
      ],
      [
        { text: '✏️ Custom Quantity (নম্বর কিবোর্ড)', callback_data: `calc:numpad:${prodKey}:${qty}` }
      ],
      [
        { text: 'Confirm Order', callback_data: `calc:confirm:${prodKey}:${qty}` },
        { text: 'Cancel', callback_data: 'cat:trusted_mail' }
      ],
      [
        { text: '🔙 Back', callback_data: 'cat:trusted_mail' }
      ]
    ]
  };
}

// সরাসরি স্ক্রিনে লাইভ নম্বর কিবোর্ড (অন-স্ক্রিন ডায়ালপ্যাড)
function getNumPadKeyboard(prodKey, currentTyped) {
  const displayQty = currentTyped || '1';

  return {
    inline_keyboard: [
      [
        { text: '1', callback_data: `num:add:${prodKey}:1` },
        { text: '2', callback_data: `num:add:${prodKey}:2` },
        { text: '3', callback_data: `num:add:${prodKey}:3` }
      ],
      [
        { text: '4', callback_data: `num:add:${prodKey}:4` },
        { text: '5', callback_data: `num:add:${prodKey}:5` },
        { text: '6', callback_data: `num:add:${prodKey}:6` }
      ],
      [
        { text: '7', callback_data: `num:add:${prodKey}:7` },
        { text: '8', callback_data: `num:add:${prodKey}:8` },
        { text: '9', callback_data: `num:add:${prodKey}:9` }
      ],
      [
        { text: '⌫ Clear', callback_data: `num:clear:${prodKey}` },
        { text: '0', callback_data: `num:add:${prodKey}:0` },
        { text: '✅ Done (হিসাব সম্পন্ন)', callback_data: `num:done:${prodKey}:${displayQty}` }
      ],
      [
        { text: '⌨️ চ্যাটে টাইপ করুন (Type in Chat)', callback_data: `num:chat:${prodKey}` }
      ],
      [
        { text: '🔙 Back', callback_data: `calc:back:${prodKey}:${displayQty}` }
      ]
    ]
  };
}

module.exports = {
  parseNumber,
  calculateTotal,
  formatOrderCard,
  getStandardKeyboard,
  getNumPadKeyboard
};
