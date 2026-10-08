import os
import psycopg2
from psycopg2.extras import RealDictCursor
import telebot
from flask import Flask
from threading import Thread

# ফেক ওয়েব সার্ভার যাতে Render সাথে সাথে লাইভ দেখায় (১০-১৫ মিনিট ঝুলবে না)
app = Flask('')

@app.route('/')
def home():
    return "Bot is alive!"

def run_web():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def keep_alive():
    t = Thread(target=run_web)
    t.start()

# কনফিগারেশন
BOT_TOKEN = os.getenv("BOT_TOKEN", "8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.qbkzinaypjnkanrwsbpc:Zxcv%40123%401233@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
ADMIN_ID = int(os.getenv("ADMIN_ID", "6640939571"))

bot = telebot.TeleBot(BOT_TOKEN)

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

from keyboards import get_main_keyboard
from profile import register_profile_handlers
from deposit import register_deposit_handlers
from shop import register_shop_handlers

register_profile_handlers(bot, get_db)
register_deposit_handlers(bot, get_db, ADMIN_ID)
register_shop_handlers(bot, get_db)

@bot.message_handler(commands=['start'])
def start_bot(message):
    uid = message.from_user.id
    uname = message.from_user.username or message.from_user.first_name
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (user_id, username, balance) VALUES (%s, %s, 0.00) ON CONFLICT (user_id) DO NOTHING;", (uid, uname))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("DB Start Error:", e)

    welcome_text = f"🌸 **ভেরিফিকেশন সফল হয়েছে {message.from_user.first_name} !**\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⬇️"
    bot.send_message(uid, welcome_text, reply_markup=get_main_keyboard(), parse_mode="Markdown")

@bot.message_handler(func=lambda msg: msg.text == "✔ Support")
def handle_support(message):
    bot.send_message(message.chat.id, "📞 **যেকোনো সহায়তায় যোগাযোগ করুন:** @cxrakib100")

if __name__ == "__main__":
    print("🚀 Starting fake web server for instant Render deploy...")
    keep_alive()
    print("🚀 Shop Bot is running successfully!")
    bot.infinity_polling()
