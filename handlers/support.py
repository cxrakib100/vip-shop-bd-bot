# handlers/support.py
from telegram import Update
from telegram.ext import ContextTypes
import config

async def handle_support(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = (
        "✔ *হেল্প ও সাপোর্ট সেন্টারে স্বাগতম!*\n\n"
        f"যেকোনো সমস্যা বা প্রশ্নের জন্য সরাসরি যোগাযোগ করুন:\n"
        f"👉 Admin: {config.ADMIN_USERNAME}\n\n"
        "আমরা দ্রুততম সময়ে আপনার উত্তর দেব।"
    )
    await update.message.reply_text(text=message, parse_mode="Markdown")
