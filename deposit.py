from telebot import types
import psycopg2

def register_deposit_handlers(bot, get_db, admin_id):

    # ডিপোজিট অপশন ক্লিক
    @bot.message_handler(func=lambda msg: msg.text == "🏦 Deposit")
    def deposit_info(message):
        text = (
            "🏦 **ডিপোজিট সিস্টেম (অটো/ম্যানুয়াল)**\n\n"
            "টাকা পাঠানোর পার্সোনাল নাম্বার:\n"
            "💳 **bKash (Send Money):** `01XXXXXXXXX`\n"
            "🔸 **Nagad (Send Money):** `01XXXXXXXXX`\n"
            "🚀 **Rocket (Send Money):** `01XXXXXXXXX`\n\n"
            "⚠️ সর্বনিম্ন ডিপোজিট: ৫০ টাকা।\n\n"
            "টাকা পাঠিয়ে নিচের ফরম্যাটে লিখে পাঠিয়ে দিন:\n"
            "👉 `TRX <মেথড> <টাকা> <TrxID>`\n"
            "উদাহরণ: `TRX bKash 100 9A7SD6F2`"
        )
        bot.send_message(message.chat.id, text, parse_mode="Markdown")

    # TrxID চেক ও সাবমিট
    @bot.message_handler(func=lambda msg: msg.text and msg.text.upper().startswith("TRX "))
    def receive_trx(message):
        try:
            parts = message.text.split()
            if len(parts) != 4:
                bot.send_message(message.chat.id, "❌ ভুল ফরম্যাট! সঠিক ফরম্যাট: `TRX bKash 100 9A7SD6F2`", parse_mode="Markdown")
                return

            _, method, amount, trx_id = parts
            amount = float(amount)
            uid = message.from_user.id

            conn = get_db()
            cur = conn.cursor()
            cur.execute("INSERT INTO deposits (user_id, method, amount, trx_id, status) VALUES (%s, %s, %s, %s, 'pending');", 
                        (uid, method, amount, trx_id))
            conn.commit()
            cur.close()
            conn.close()

            bot.send_message(uid, "✅ আপনার ডিপোজিট রিকোয়েস্ট অ্যাডমিনের কাছে পাঠানো হয়েছে। যাচাই শেষে ব্যালেন্স যোগ হবে।")

            # অ্যাডমিনের কাছে নোটিফিকেশন পাঠানো
            markup = types.InlineKeyboardMarkup(row_width=2)
            markup.add(
                types.InlineKeyboardButton("✅ Approve", callback_data=f"adm_app_{uid}_{amount}_{trx_id}"),
                types.InlineKeyboardButton("❌ Reject", callback_data=f"adm_rej_{uid}_{trx_id}")
            )
            bot.send_message(admin_id, f"🔔 **নতুন ডিপোজিট রিকোয়েস্ট!**\n\n👤 ইউজার: `{uid}`\n💳 মেথড: {method}\n💰 টাকা: {amount} TK\n🧾 TrxID: `{trx_id}`", reply_markup=markup, parse_mode="Markdown")

        except psycopg2.IntegrityError:
            bot.send_message(message.chat.id, "❌ এই TrxID টি ইতিমধ্যে একবার ব্যবহার করা হয়েছে!")
        except Exception as e:
            bot.send_message(message.chat.id, f"ত্রুটি: {e}")

    # অ্যাডমিন এক ক্লিকে এপ্রুভ বা রিজেক্ট করবে
    @bot.callback_query_handler(func=lambda call: call.data.startswith("adm_"))
    def admin_approval(call):
        if call.from_user.id != admin_id:
            return

        data = call.data.split("_")
        action, uid = data[1], int(data[2])

        conn = get_db()
        cur = conn.cursor()

        if action == "app":
            amount, trx_id = float(data[3]), data[4]
            cur.execute("UPDATE users SET balance = balance + %s WHERE user_id = %s;", (amount, uid))
            cur.execute("UPDATE deposits SET status = 'approved' WHERE trx_id = %s;", (trx_id,))
            conn.commit()

            bot.edit_message_text(f"✅ ডিপোজিট অনুমোদিত হয়েছে ({amount} TK)", call.message.chat.id, call.message.message_id)
            bot.send_message(uid, f"🎉 আপনার {amount} TK ডিপোজিট সফল হয়েছে! ব্যালেন্সে টাকা যোগ করা হয়েছে।")

        elif action == "rej":
            trx_id = data[3]
            cur.execute("UPDATE deposits SET status = 'rejected' WHERE trx_id = %s;", (trx_id,))
            conn.commit()

            bot.edit_message_text("❌ ডিপোজিট বাতিল করা হয়েছে!", call.message.chat.id, call.message.message_id)
            bot.send_message(uid, "❌ আপনার ডিপোজিট বাতিল করা হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।")

        cur.close()
        conn.close()
