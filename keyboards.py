from aiogram.types import ReplyKeyboardMarkup, KeyboardButton


def main_keyboard() -> ReplyKeyboardMarkup:
    """
    সব বাটন ও রঙ এখানে থাকবে।
    বাটনের টেক্সট পরিবর্তন করলে handlers.py তেও মিলিয়ে দিতে হবে।
    """
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🟢 Shop"),
                KeyboardButton(text="🔵 Profile"),
            ],
            [
                KeyboardButton(text="🟡 Deposit"),
                KeyboardButton(text="🔴 Support"),
            ],
        ],
        resize_keyboard=True,
        input_field_placeholder="একটা অপশন সিলেক্ট করুন...",
    )
    return keyboard
