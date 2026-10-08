from aiogram import Router, F
from aiogram.types import Message
from keyboards import main_keyboard

router = Router()


@router.message(F.text == "/start")
async def start_handler(message: Message):
    await message.answer(
        f"👋 স্বাগতম {message.from_user.first_name}!\n\n"
        "নিচের মেনু থেকে অপশন সিলেক্ট করুন ⬇️",
        reply_markup=main_keyboard(),
    )


@router.message(F.text == "🟢 Shop")
async def shop_handler(message: Message):
    await message.answer(
        "🛒 **Shop**\n\n"
        "এখানে প্রোডাক্ট লিস্ট দেখানো হবে...\n"
        "(পরে ক্যাটাগরি ও প্রোডাক্ট যোগ করা যাবে)",
        parse_mode="Markdown",
    )


@router.message(F.text == "🔵 Profile")
async def profile_handler(message: Message):
    user = message.from_user
    text = (
        f"👤 **আপনার প্রোফাইল**\n\n"
        f"🆔 আইডি: `{user.id}`\n"
        f"👤 নাম: {user.first_name}\n"
        f"💰 ব্যালেন্স: **0.00 TK**\n"
    )
    await message.answer(text, parse_mode="Markdown")


@router.message(F.text == "🟡 Deposit")
async def deposit_handler(message: Message):
    text = (
        "🟡 **ডিপোজিট**\n\n"
        "💳 bKash / Nagad / Rocket এ টাকা পাঠিয়ে\n"
        "নিচের ফরম্যাটে পাঠান:\n\n"
        "`TRX bKash 100 TrxID`\n\n"
        "উদাহরণ: `TRX bKash 100 9A7SD6F2`"
    )
    await message.answer(text, parse_mode="Markdown")


@router.message(F.text == "🔴 Support")
async def support_handler(message: Message):
    await message.answer(
        "🔴 **সাপোর্ট**\n\n"
        "যেকোনো সমস্যায় যোগাযোগ করুন:\n"
        "👉 @cxrakib100",
        parse_mode="Markdown",
    )
