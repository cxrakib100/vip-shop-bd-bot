import logging
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

from keyboards.menu_keyboards import (
    BTN_BUY_PRODUCT,
    BTN_PROFILE,
    BTN_DEPOSIT,
    BTN_HISTORY,
    BTN_SUPPORT
)

from handlers.start import start_command
from handlers.buy_product import handle_buy_product
from handlers.deposit import handle_deposit
from handlers.profile import handle_profile
from handlers.order_history import handle_order_history
from handlers.support import handle_support

# ==================== BOT CONFIG ====================
BOT_TOKEN = "8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo"
ADMIN_CHAT_ID = 6640939571
# ====================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # /start কমান্ড
    app.add_handler(CommandHandler("start", start_command))

    # বাটন ক্লিক হ্যান্ডলার
    app.add_handler(MessageHandler(filters.Text(BTN_BUY_PRODUCT), handle_buy_product))
    app.add_handler(MessageHandler(filters.Text(BTN_DEPOSIT), handle_deposit))
    app.add_handler(MessageHandler(filters.Text(BTN_PROFILE), handle_profile))
    app.add_handler(MessageHandler(filters.Text(BTN_HISTORY), handle_order_history))
    app.add_handler(MessageHandler(filters.Text(BTN_SUPPORT), handle_support))

    print("🤖 Bot is running with Colored Buttons...")
    app.run_polling()

if __name__ == "__main__":
    main()
