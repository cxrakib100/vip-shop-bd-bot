import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from handlers import router

# ================== CONFIG ==================
BOT_TOKEN = os.getenv("BOT_TOKEN") or "8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo"
ADMIN_ID = int(os.getenv("ADMIN_ID") or "6640939571")


async def main():
    logging.basicConfig(level=logging.INFO)

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN),
    )
    dp = Dispatcher()

    # সব হ্যান্ডলার এখানে যোগ হচ্ছে
    dp.include_router(router)

    print("🚀 Bot is starting...")
    print(f"✅ Admin ID: {ADMIN_ID}")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
