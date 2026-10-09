# keyboards/menu_keyboards.py
from telegram import ReplyKeyboardMarkup, KeyboardButton

# বাটন টেক্সট ও কালার কোডিং ডিফাইন (যাতে বারবার টাইপ করতে না হয়)
BTN_BUY_PRODUCT = "🟢 🤑 Buy Product"
BTN_PROFILE     = "🔵 🧕 Profile"
BTN_DEPOSIT     = "🟢 🏦 Deposit"
BTN_HISTORY     = "🔵 ⏳ Order History"
BTN_SUPPORT     = "🔴 ✔ Support"

def get_main_menu_keyboard():
    """
    স্ক্রিনশটের মতো লেআউট:
    Row 1: Buy Product
    Row 2: Profile | Deposit
    Row 3: Order History | Support
    """
    keyboard = [
        [KeyboardButton(BTN_BUY_PRODUCT)],
        [KeyboardButton(BTN_PROFILE), KeyboardButton(BTN_DEPOSIT)],
        [KeyboardButton(BTN_HISTORY), KeyboardButton(BTN_SUPPORT)]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
