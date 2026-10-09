# handlers/profile.py
from telegram import Update
from telegram.ext import ContextTypes

async def handle_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    message = (
        f"🧕 *আপনার প্রোফাইল:*\n\n"
        f"👤 নাম: {user.full_name}\n"
        f"🆔 ইউজার আইডি: `{user.id}`\n"
        f"💰 ব্যালেন্স: ৳ ০.০০\n"
        f"📦 মোট অর্ডার: ০ টি"
    )
    await update.message.reply_text(text=message, parse_mode="Markdown")
