# keyboards/menu_keyboards.py
from telegram import ReplyKeyboardMarkup, KeyboardButton

def make_button(text: str, style: str) -> KeyboardButton:
    """
    টেলিগ্রামের নতুন কালার স্টাইল (success = সবুজ, danger = লাল, primary = নীল)
    যেকোনো পাইথন লাইব্রেরি ভার্সনে কাজ করার জন্য এই হেল্পার ফাংশন
    """
    try:
        # লেটেস্ট লাইব্রেরির জন্য সরাসরি style প্যারামিটার
        return KeyboardButton(text=text, style=style)
    except TypeError:
        # পূর্ববর্তী লাইব্রেরি ভার্সনের জন্য api_kwargs দিয়ে পাঠানো
        return KeyboardButton(text=text, api_kwargs={"style": style})

# বাটনগুলোর টেক্সট (স্ক্রিনশট অনুযায়ী)
BTN_BUY_PRODUCT = "🤑 Buy Product"
BTN_PROFILE     = "🧕 Profile"
BTN_DEPOSIT     = "🏦 Deposit"
BTN_HISTORY     = "⏳ Order History"
BTN_SUPPORT     = "✔ Support"

def get_main_menu_keyboard():
    """
    ১ম সারি: Buy Product (সবুজ)
    ২য় সারি: Profile (নীল) | Deposit (সবুজ)
    ৩য় সারি: Order History (নীল) | Support (লাল)
    """
    keyboard = [
        # ১. বাই প্রোডাক্ট (সবুজ)
        [make_button(BTN_BUY_PRODUCT, style="success")],
        
        # ২. প্রোফাইল (নীল) ও ডিপোজিট (সবুজ)
        [
            make_button(BTN_PROFILE, style="primary"),
            make_button(BTN_DEPOSIT, style="success")
        ],
        
        # ৩. অর্ডার হিস্ট্রি (নীল) ও সাপোর্ট (লাল)
        [
            make_button(BTN_HISTORY, style="primary"),
            make_button(BTN_SUPPORT, style="danger")
        ]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
