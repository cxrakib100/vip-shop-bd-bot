from keyboards import get_main_keyboard

# যখন ইউজার /start দিবে:
@bot.message_handler(commands=['start'])
def start_bot(message):
    bot.send_message(message.chat.id, "আমাদের শপে আপনাকে স্বাগতম!", reply_markup=get_main_keyboard())

# বাটন ক্লিকের হ্যান্ডলার (যাতে ইমোজি পরিবর্তন করলেও বট আটকে না যায়):
@bot.message_handler(func=lambda msg: "Buy Product" in msg.text)
def buy_click(message):
    # বাই প্রোডাক্টের কাজ

@bot.message_handler(func=lambda msg: "Profile" in msg.text)
def profile_click(message):
    # প্রোফাইলের কাজ

@bot.message_handler(func=lambda msg: "Deposit" in msg.text)
def deposit_click(message):
    # ডিপোজিটের কাজ

@bot.message_handler(func=lambda msg: "Order History" in msg.text)
def history_click(message):
    # হিস্টোরির কাজ

@bot.message_handler(func=lambda msg: "Support" in msg.text)
def support_click(message):
    # সাপোর্টের কাজ
