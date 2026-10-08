# VIP Shop BD Bot

Clean Telegram Shop Bot using **aiogram 3**.

## Structure

- `keyboards.py` → সব বাটন ও রঙ
- `handlers.py` → বাটনের ভিতরের কাজ
- `main.py` → বট স্টার্ট

## ৪টি বাটন

| বাটন | কাজ |
|------|-----|
| 🟢 Shop | প্রোডাক্ট দেখাবে |
| 🔵 Profile | প্রোফাইল + ব্যালেন্স |
| 🟡 Deposit | ডিপোজিট সিস্টেম |
| 🔴 Support | সাপোর্ট |

## কিভাবে রান করবেন

1. BotFather থেকে টোকেন নিন
2. `main.py` তে `BOT_TOKEN` বসান অথবা Environment Variable সেট করুন
3. ইনস্টল করুন:

```bash
pip install -r requirements.txt
```

4. রান করুন:

```bash
python main.py
```
