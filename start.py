# handlers/start.py
from telegram import Update
from telegram.ext import ContextTypes
from keyboards.menu_keyboards import get_main_menu_keyboard
import config

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    # চ্যানেল জয়েন নোটিশ মেসেজ (স্ক্রিনশটের মতো)
    welcome_text = (
        f"👋 হ্যালো {user.first_name}!\n\n"
        f"🚀 To use this bot, you must join our channels:\n"
        f"1. {config.REQUIRED_CHANNELS[0]['url']}\n"
        f"2. {config.REQUIRED_CHANNELS[1]['url']}\n\n"
        f"নিচের মেনু থেকে আপনার কাঙ্ক্ষিত অপশন সিলেক্ট করুন:"
    )
    
    await update.message.reply_text(
        text=welcome_text,
        reply_markup=get_main_menu_keyboard()
  )
