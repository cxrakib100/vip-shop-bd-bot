# handlers/deposit.py
from telegram import Update
from telegram.ext import ContextTypes

async def handle_deposit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ডিপোজিটের যাবতীয় লজিক এখানে লিখবেন
    message = (
        "🏦 *ডিপোজিট অপশন:*\n\n"
        "🔹 বিকাশ (Personal): `017XXXXXXXX`\n"
        "🔹 নগদ (Personal): `018XXXXXXXX`\n"
        "🔹 Binance Pay ID: `12345678`\n\n"
        "টাকা পাঠানোর পর ট্রানজেকশন আইডি (TrxID) এবং স্ক্রিনশট সাপোর্টে পাঠান।"
    )
    await update.message.reply_text(text=message, parse_mode="Markdown")
