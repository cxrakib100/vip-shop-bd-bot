# handlers/order_history.py
from telegram import Update
from telegram.ext import ContextTypes

async def handle_order_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = (
        "⏳ *আপনার অর্ডার হিস্ট্রি:*\n\n"
        "এখন পর্যন্ত আপনার কোনো পূর্ববর্তী অর্ডার রেকর্ড পাওয়া যায়নি।"
    )
    await update.message.reply_text(text=message, parse_mode="Markdown")
