import os
import psycopg2
from psycopg2.extras import RealDictCursor
import telebot
from telebot import types

# আপনার দেওয়া ইনফরমেশন কনফিগারেশন
BOT_TOKEN = os.getenv("BOT_TOKEN", "8260629531:AAHeqwYHFsLb_oh_Lpir3k7BKapOG-bxhmo")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.qbkzinaypjnkanrwsbpc:Zxcv%40123%401233@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
ADMIN_ID = int(os.getenv("ADMIN_ID", "6640939571"))

bot = telebot.TeleBot(BOT_TOKEN)

# ডাটাবেজ কানেকশন ফাংশন
def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# ইউজার কার্টে কয়টা সিলেক্ট করছে তা সেভ রাখার জন্য ক্যাশ
user_cart = {}

# মেইন কিবোর্ড
def main_menu():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(
        types.KeyboardButton("💸 Buy Product"),
        types.KeyboardButton("👤 Profile"),
        types.KeyboardButton("🏦 Deposit"),
        types.KeyboardButton("⏳ Order History"),
        types.KeyboardButton("🛡 Support")
    )
    return markup

# ১. /start কমান্ড
@bot.message_handler(commands=['start'])
def send_welcome(message):
    uid = message.from_user.id
    uname = message.from_user.username or message.from_user.first_name

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (user_id, username, balance) 
            VALUES (%s, %s, 0.00) 
            ON CONFLICT (user_id) DO NOTHING;
        """, (uid, uname))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

    text = f"🌸 **ভেরিফিকেশন সফল হয়েছে {message.from_user.first_name} !**\n\nআমাদের শপে আপনাকে স্বাগতম। নিচের মেনু থেকে পছন্দ করুন ⬇️"
    bot.send_message(uid, text, reply_markup=main_menu(), parse_mode="Markdown")

# ২. Buy Product বাটন ক্লিক
@bot.message_handler(func=lambda msg: msg.text == "💸 Buy Product")
def show_categories(message):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT category FROM products;")
        categories = cur.fetchall()
        cur.close()
        conn.close()

        if not categories:
            bot.send_message(message.chat.id, "❌ কোনো ক্যাটাগরি পাওয়া যায়নি!")
            return

        markup = types.InlineKeyboardMarkup(row_width=1)
        for cat in categories:
            markup.add(types.InlineKeyboardButton(f"📁 {cat['category']}", callback_data=f"cat_{cat['category']}"))

        bot.send_message(message.chat.id, "💸 **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", reply_markup=markup, parse_mode="Markdown")
    except Exception as e:
        bot.send_message(message.chat.id, f"ত্রুটি: {e}")

# ৩. ক্যাটাগরি সিলেক্ট করলে প্রোডাক্ট দেখানো (স্টক সহ)
@bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
def show_products(call):
    cat_name = call.data.replace("cat_", "")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, price FROM products WHERE category = %s;", (cat_name,))
    products = cur.fetchall()

    markup = types.InlineKeyboardMarkup(row_width=1)
    for p in products:
        cur.execute("SELECT COUNT(*) as stock FROM stock_items WHERE product_id = %s AND is_sold = FALSE;", (p['id'],))
        stock = cur.fetchone()['stock']
        stock_text = f"Stock: {stock}" if stock > 0 else "Out of Stock"
        markup.add(types.InlineKeyboardButton(f"{p['name']} | {p['price']} TK | {stock_text}", callback_data=f"prod_{p['id']}"))

    markup.add(types.InlineKeyboardButton("🔙 Back", callback_data="back_cats"))
    cur.close()
    conn.close()

    bot.edit_message_text(f"🛍 **{cat_name} প্রোডাক্ট সিলেক্ট করুন:**", call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

@bot.callback_query_handler(func=lambda call: call.data == "back_cats")
def back_to_cats(call):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT category FROM products;")
    categories = cur.fetchall()
    cur.close()
    conn.close()

    markup = types.InlineKeyboardMarkup(row_width=1)
    for cat in categories:
        markup.add(types.InlineKeyboardButton(f"📁 {cat['category']}", callback_data=f"cat_{cat['category']}"))

    bot.edit_message_text("💸 **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# ৪. কোয়ান্টিটি ক্যালকুলেটর ভিউ (+ / - বাটন)
def build_buy_markup(prod_id, qty):
    markup = types.InlineKeyboardMarkup(row_width=3)
    markup.add(
        types.InlineKeyboardButton("➖", callback_data=f"dec_{prod_id}_{qty}"),
        types.InlineKeyboardButton(f"{qty}", callback_data="ignore"),
        types.InlineKeyboardButton("➕", callback_data=f"inc_{prod_id}_{qty}")
    )
    markup.add(
        types.InlineKeyboardButton("✅ Confirm Order", callback_data=f"confirm_{prod_id}_{qty}"),
        types.InlineKeyboardButton("❌ Cancel", callback_data="back_cats")
    )
    return markup

@bot.callback_query_handler(func=lambda call: call.data.startswith("prod_"))
def select_product(call):
    prod_id = int(call.data.split("_")[1])
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
    prod = cur.fetchone()

    cur.execute("SELECT COUNT(*) as stock FROM stock_items WHERE product_id = %s AND is_sold = FALSE;", (prod_id,))
    stock = cur.fetchone()['stock']
    cur.close()
    conn.close()

    if stock == 0:
        bot.answer_callback_query(call.id, "⚠️ দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট (Out of Stock)!", show_alert=True)
        return

    qty = 1
    total = float(prod['price']) * qty
    text = (f"💸 **{prod['name']}**\n"
            f"💰 **প্রাইস:** {prod['price']} TK\n"
            f"📦 **স্টক:** {stock}\n\n"
            f"পরিমাণ: {qty}\n"
            f"**মোট খরচ:** {total:.2f} TK")

    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=build_buy_markup(prod_id, qty), parse_mode="Markdown")

# কোয়ান্টিটি বাড়ানো বা কমানো
@bot.callback_query_handler(func=lambda call: call.data.startswith("inc_") or call.data.startswith("dec_"))
def change_qty(call):
    parts = call.data.split("_")
    action, prod_id, qty = parts[0], int(parts[1]), int(parts[2])

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
    prod = cur.fetchone()
    cur.execute("SELECT COUNT(*) as stock FROM stock_items WHERE product_id = %s AND is_sold = FALSE;", (prod_id,))
    stock = cur.fetchone()['stock']
    cur.close()
    conn.close()

    if action == "inc":
        if qty + 1 > stock:
            bot.answer_callback_query(call.id, "⚠️ স্টকে এর চেয়ে বেশি আর নেই!", show_alert=True)
            return
        qty += 1
    elif action == "dec":
        if qty - 1 < 1:
            return
        qty -= 1

    total = float(prod['price']) * qty
    text = (f"💸 **{prod['name']}**\n"
            f"💰 **প্রাইস:** {prod['price']} TK\n"
            f"📦 **স্টক:** {stock}\n\n"
            f"পরিমাণ: {qty}\n"
            f"**মোট খরচ:** {total:.2f} TK")

    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=build_buy_markup(prod_id, qty), parse_mode="Markdown")

# ৫. কনফার্ম অর্ডার ও অটোমেটিক অ্যাকাউন্ট ডেলিভারি
@bot.callback_query_handler(func=lambda call: call.data.startswith("confirm_"))
def confirm_purchase(call):
    _, prod_id, qty = call.data.split("_")
    prod_id, qty = int(prod_id), int(qty)
    uid = call.from_user.id

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT balance FROM users WHERE user_id = %s;", (uid,))
    user = cur.fetchone()
    cur.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
    prod = cur.fetchone()

    total_price = float(prod['price']) * qty

    if not user or float(user['balance']) < total_price:
        cur.close()
        conn.close()
        bot.answer_callback_query(call.id, "❌ আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ডিপোজিট করুন।", show_alert=True)
        return

    # স্টক চেক এবং অ্যাকাউন্ট তোলা
    cur.execute("SELECT id, account_data FROM stock_items WHERE product_id = %s AND is_sold = FALSE LIMIT %s;", (prod_id, qty))
    items = cur.fetchall()

    if len(items) < qty:
        cur.close()
        conn.close()
        bot.answer_callback_query(call.id, "⚠️ পর্যাপ্ত স্টক নেই!", show_alert=True)
        return

    # ব্যালেন্স কাটা
    cur.execute("UPDATE users SET balance = balance - %s WHERE user_id = %s;", (total_price, uid))

    # স্টক সেল আপডেট
    delivered_data = []
    for item in items:
        cur.execute("UPDATE stock_items SET is_sold = TRUE, sold_to = %s, sold_at = NOW() WHERE id = %s;", (uid, item['id']))
        delivered_data.append(item['account_data'])

    cur.execute("INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (%s, %s, %s, %s);", (uid, prod_id, qty, total_price))
    conn.commit()
    cur.close()
    conn.close()

    # ইউজারকে ডেলিভারি
    delivery_text = "🎉 **অর্ডার সফল হয়েছে! আপনার একাউন্টগুলো নিচে দেওয়া হলো:**\n\n" + "\n".join(delivered_data)
    bot.edit_message_text("✅ আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে!", call.message.chat.id, call.message.message_id)
    bot.send_message(uid, delivery_text)

# ৬. প্রোফাইল
@bot.message_handler(func=lambda msg: msg.text == "👤 Profile")
def profile_view(message):
    uid = message.from_user.id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT balance FROM users WHERE user_id = %s;", (uid,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    bal = user['balance'] if user else "0.00"
    bot.send_message(uid, f"👤 **আপনার প্রোফাইল**\n\n🆔 ইউজার আইডি: `{uid}`\n💰 বর্তমান ব্যালেন্স: **{bal} TK**", parse_mode="Markdown")

# ৭. ডিপোজিট সিস্টেম (বিকাশ, নগদ, রকেট)
@bot.message_handler(func=lambda msg: msg.text == "🏦 Deposit")
def deposit_menu(message):
    text = (
        "🏦 **অটো/ম্যানুয়াল ডিপোজিট সিস্টেম**\n\n"
        "টাকা পাঠানোর পার্সোনাল নাম্বার:\n"
        "🔹 **bKash (Personal):** `01XXXXXXXXX` (Send Money)\n"
        "🔸 **Nagad (Personal):** `01XXXXXXXXX` (Send Money)\n"
        "🚀 **Rocket (Personal):** `01XXXXXXXXX` (Send Money)\n\n"
        "টাকা পাঠিয়ে নিচের ফরম্যাটে লিখে এই মেসেজের রিপ্লাই দিন:\n"
        "👉 `TRX <মেথড> <টাকা> <TrxID>`\n"
        "উদাহরণ: `TRX bKash 100 9A7SD6F2`"
    )
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

# ডিপোজিট রিকোয়েস্ট রিসিভ ও অ্যাডমিনকে পাঠানো
@bot.message_handler(func=lambda msg: msg.text and msg.text.upper().startswith("TRX "))
def handle_trx(message):
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

        bot.send_message(uid, "✅ আপনার ডিপোজিট রিকোয়েস্ট গ্রহণ করা হয়েছে। অ্যাডমিন ভেরিফাই করলেই আপনার ব্যালেন্সে যোগ হয়ে যাবে।")

        # অ্যাডমিনকে পাঠানো এপ্রুভ বাটন সহ
        markup = types.InlineKeyboardMarkup(row_width=2)
        markup.add(
            types.InlineKeyboardButton("✅ Approve", callback_data=f"adm_app_{uid}_{amount}_{trx_id}"),
            types.InlineKeyboardButton("❌ Reject", callback_data=f"adm_rej_{uid}_{trx_id}")
        )
        bot.send_message(ADMIN_ID, f"🔔 **নতুন ডিপোজিট রিকোয়েস্ট!**\n\n👤 ইউজার: `{uid}`\n💳 মেথড: {method}\n💰 টাকা: {amount} TK\n🧾 TrxID: `{trx_id}`", reply_markup=markup, parse_mode="Markdown")

    except psycopg2.IntegrityError:
        bot.send_message(message.chat.id, "❌ এই TrxID টি ইতিমধ্যে একবার ব্যবহার করা হয়েছে!")
    except Exception as e:
        bot.send_message(message.chat.id, f"ত্রুটি: {e}")

# অ্যাডমিন এপ্রুভ/রিজেক্ট বাটন হ্যান্ডলার
@bot.callback_query_handler(func=lambda call: call.data.startswith("adm_"))
def admin_action(call):
    if call.from_user.id != ADMIN_ID:
        return

    data = call.data.split("_")
    action, uid, extra = data[1], int(data[2]), data[3]

    conn = get_db()
    cur = conn.cursor()

    if action == "app":
        amount, trx_id = float(extra), data[4]
        cur.execute("UPDATE users SET balance = balance + %s WHERE user_id = %s;", (amount, uid))
        cur.execute("UPDATE deposits SET status = 'approved' WHERE trx_id = %s;", (trx_id,))
        conn.commit()

        bot.edit_message_text(f"✅ ডিপোজিট অনুমোদিত হয়েছে ({amount} TK)", call.message.chat.id, call.message.message_id)
        bot.send_message(uid, f"🎉 আপনার {amount} TK ডিপোজিট সফল হয়েছে! ব্যালেন্সে যোগ করা হয়েছে।")

    elif action == "rej":
        trx_id = extra
        cur.execute("UPDATE deposits SET status = 'rejected' WHERE trx_id = %s;", (trx_id,))
        conn.commit()

        bot.edit_message_text(f"❌ ডিপোজিট বাতিল করা হয়েছে!", call.message.chat.id, call.message.message_id)
        bot.send_message(uid, "❌ আপনার ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে। সঠিক TrxID দিয়ে আবার চেষ্টা করুন।")

    cur.close()
    conn.close()

# ৮. সাপোর্ট
@bot.message_handler(func=lambda msg: msg.text == "🛡 Support")
def support_view(message):
    bot.send_message(message.chat.id, "📞 যেকোনো সমস্যায় যোগাযোগ করুন: @cxrakib100")

# বট রান
if __name__ == "__main__":
    print("Bot is successfully running...")
    bot.infinity_polling()
