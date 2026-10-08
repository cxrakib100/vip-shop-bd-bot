from telebot import types

# মেইন মেনুর বাটন ডিজাইন (হুবহু স্ক্রিনশটের মতো সাজানো)
def get_main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    
    # ১. Buy Product (পুরো লাইন জুড়ে বড় বাটন)
    buy_btn = types.KeyboardButton("🤑 Buy Product")
    
    # ২. প্রোফাইল ও ডিপোজিট (পাশাপাশি দুইটা)
    profile_btn = types.KeyboardButton("👨‍💻 Profile")
    deposit_btn = types.KeyboardButton("🏦 Deposit")
    
    # ৩. অর্ডার হিস্টোরি ও সাপোর্ট (পাশাপাশি দুইটা)
    history_btn = types.KeyboardButton("⌛ Order History")
    support_btn = types.KeyboardButton("✔ Support")
    
    # বাটনগুলো সাজিয়ে দেওয়া হলো
    markup.row(buy_btn)
    markup.row(profile_btn, deposit_btn)
    markup.row(history_btn, support_btn)
    
    # [টিপস]: ভবিষ্যতে নতুন বাটন যোগ করতে চাইলে নিচের মতো করে নিচে লিখে দিবেন:
    # new_btn = types.KeyboardButton("🎁 নতুন অফার")
    # markup.row(new_btn)
    
    return markup
