# handlers/buy_product.py
from telegram import Update
from telegram.ext import ContextTypes

async def handle_buy_product(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # বাই প্রোডাক্টের যাবতীয় লজিক এখানে লিখবেন
    message = (
        "🛒 *আমাদের প্রোডাক্ট লিস্ট:*\n\n"
        "১. Premium Tool A - ৳ ৫০০\n"
        "২. Premium Tool B - ৳ ১০০০\n"
        "৩. VIP Access - ৳ ১৫০০\n\n"
        "কেনার জন্য অনুগ্রহ করে আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স ডিপোজিট করুন।"
    )
    await update.message.reply_text(text=message, parse_mode="Markdown")
