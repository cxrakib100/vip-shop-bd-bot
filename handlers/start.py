# handlers/start.py
from telegram import Update
from telegram.ext import ContextTypes
from keyboards.menu_keyboards import get_main_menu_keyboard
import config

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    channel_url = config.REQUIRED_CHANNELS[0]['url']
    
    # স্ক্রিনশট অনুযায়ী মেসেজ
    message_text = f"🚀 To use this bot, you must join our channel: {channel_url}"
    
    # reply_markup দিয়ে বাটন পাঠিয়ে দেওয়া হচ্ছে
    await update.message.reply_text(
        text=message_text,
        reply_markup=get_main_menu_keyboard()
    )
