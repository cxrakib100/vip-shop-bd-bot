# keyboards/menu_keyboards.py
from telegram import ReplyKeyboardMarkup, KeyboardButton

def make_button(text: str, style: str) -> KeyboardButton:
    """
    টেলিগ্রামের অফিসিয়াল কালার স্টাইল (success=সবুজ, danger=লাল, primary=নীল)
    """
    try:
        return KeyboardButton(text=text, style=style)
    except TypeError:
        return KeyboardButton(text=text, api_kwargs={"style": style})

# বাটন টেক্সট ও কালার (সবুজ, লাল, নীল)
BTN_BUY_PRODUCT = "🟩 🤑 Buy Product"    # সবুজ
BTN_DEPOSIT     = "🟩 🏦 Deposit"        # সবুজ
BTN_SUPPORT     = "🟥 ✔ Support"         # লাল
BTN_PROFILE     = "🟦 🧕 Profile"         # নীল
BTN_HISTORY     = "🟦 ⏳ Order History"   # নীল

def get_main_menu_keyboard():
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
    
    # is_persistent=True এর কারণে বাটন সবসময় স্ক্রিনে ফিক্সড থাকবে, কখনো লুকাবে না
    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        is_persistent=True
    )
