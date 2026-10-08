from telebot import types

def get_main_keyboard():
    # resize_keyboard=True দিলে বাটনগুলো স্ক্রিনের সাথে সুন্দরভাবে ফিট হয়ে যায়
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    
    # ১. Buy Product (সবুজ ভাইব - ডলার ইমোজি দিয়ে পুরো লাইনে বড় বাটন)
    buy_btn = types.KeyboardButton("💵 Buy Product")
    
    # ২. প্রোফাইল (নীল ভাইব) এবং ডিপোজিট (সবুজ ভাইব)
    profile_btn = types.KeyboardButton("👤 Profile")      # নীলচে লুক
    deposit_btn = types.KeyboardButton("🏦 Deposit")      # সবুজ/ব্যাংক লুক
    
    # ৩. অর্ডার হিস্টোরি (নীল ভাইব) এবং সাপোর্ট (লাল ভাইব)
    history_btn = types.KeyboardButton("⌛ Order History") # নীলচে লুক
    support_btn = types.KeyboardButton("🛑 Support")       # লালচে লুক
    
    # স্ক্রিনশটের মতো রো (Row) অনুযায়ী সাজানো হলো:
    markup.row(buy_btn)                      # উপরে একা সবুজ বড় বাটন
    markup.row(profile_btn, deposit_btn)     # মাঝে নীল Profile আর সবুজ Deposit
    markup.row(history_btn, support_btn)     # নিচে নীল Order History আর লাল Support
    
    return markup
