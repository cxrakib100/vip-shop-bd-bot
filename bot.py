import os
import telebot
from telebot import types
import psycopg2
from psycopg2.extras import RealDictCursor

# === আপনার তথ্যগুলো এখানে বসান ===
BOT_TOKEN = "এখানে_আপনার_BOT_TOKEN_বসাবেন"
ADMIN_ID = 123456789  # এখানে আপনার userinfobot থেকে পাওয়া সংখ্যা আইডি বসাবেন (উদ্ধৃতি চিহ্ন ছাড়া)
DATABASE_URL = "postgresql://postgres.qbkzinaypjnkanrwsbpc:Zxcv%40123%40123%401233@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# আপনার বিকাশ, নগদ ও রকেট নাম্বার
BKASH_NUMBER = "01XXXXXXXXX (Personal Send Money)"
NAGAD_NUMBER = "01XXXXXXXXX (Personal Send Money)"
ROCKET_NUMBER = "01XXXXXXXXX (Personal Send Money)"
# =================================

bot = telebot.TeleBot(BOT_TOKEN)

def get_db():
    return psycopg2.connect(DATABASE_URL)

def get_or_create_user(user_id, username):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                cur.execute("INSERT INTO users (user_id, username, balance) VALUES (%s, %s, 0.00) RETURNING *", (user_id, username))
                user = cur.fetchone()
                conn.commit()
            return user

def main_menu():
    markup = types.ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    markup.add(types.KeyboardButton("💵 Buy Product"))
    markup.add(types.KeyboardButton("👤 Profile"), types.KeyboardButton("🏦 Deposit"))
    markup.add(types.KeyboardButton("⌛ Order History"), types.KeyboardButton("☎️ Support"))
    return markup

@bot.message_handler(commands=['start'])
def start_cmd(message):
    get_or_create_user(message.from_user.id, message.from_user.username)
    text = f"👋 স্বাগতম **{message.from_user.first_name}**!\n\nআমাদের অটো শপে আপনাকে স্বাগতম। নিচের মেনু থেকে অপশন বেছে নিন 👇"
    bot.send_message(message.chat.id, text, parse_mode="Markdown", reply_markup=main_menu())

@bot.message_handler(func=lambda m: m.text == "👤 Profile")
def profile_cmd(message):
    user = get_or_create_user(message.from_user.id, message.from_user.username)
    text = (
        f"👤 **আপনার প্রোফাইল:**\n\n"
        f"🆔 ইউজার আইডি: `{user['user_id']}`\n"
        f"💰 ব্যালেন্স: **{user['balance']} TK**\n"
    )
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

@bot.message_handler(func=lambda m: m.text == "☎️ Support")
def support_cmd(message):
    bot.send_message(message.chat.id, f"যেকোনো সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন: [Admin Chat](tg://user?id={ADMIN_ID})", parse_mode="Markdown")

# ----------------- ডিপোজিট সিস্টেম -----------------
deposit_state = {}

@bot.message_handler(func=lambda m: m.text == "🏦 Deposit")
def deposit_menu(message):
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("বিকাশ (bKash)", callback_data="dep_bkash"),
        types.InlineKeyboardButton("নগদ (Nagad)", callback_data="dep_nagad"),
        types.InlineKeyboardButton("রকেট (Rocket)", callback_data="dep_rocket")
    )
    bot.send_message(message.chat.id, "💳 আপনি কোন মাধ্যমে টাকা ডিপোজিট করতে চান তা সিলেক্ট করুন:", reply_markup=markup)

@bot.callback_query_handler(func=lambda c: c.data.startswith("dep_"))
def deposit_method(call):
    method = call.data.split("_")[1].capitalize()
    num = BKASH_NUMBER if method == "Bkash" else (NAGAD_NUMBER if method == "Nagad" else ROCKET_NUMBER)
    text = (
        f"🏦 **{method} ডিপোজিট নির্দেশিকা:**\n\n"
        f"১. নিচে দেওয়া নাম্বারে Send Money করুন:\n`{num}`\n\n"
        f"২. টাকা পাঠিয়ে TrxID এবং টাকার পরিমাণ নিচের নিয়মে সেন্ড করুন:\n"
        f"ফরম্যাট: `TRXID AMOUNT`\n"
        f"উদাহরণ: `BL829371 100`"
    )
    deposit_state[call.from_user.id] = method
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, parse_mode="Markdown")

@bot.message_handler(func=lambda m: m.from_user.id in deposit_state)
def process_deposit(message):
    method = deposit_state.pop(message.from_user.id)
    parts = message.text.strip().split()
    if len(parts) != 2:
        bot.send_message(message.chat.id, "❌ ভুল ফরম্যাট! দয়া করে সঠিক নিয়মে লিখুন: `TRXID AMOUNT` (যেমন: `BL923849 50`)", parse_mode="Markdown")
        return
    
    trx_id = parts[0].upper()
    try:
        amount = float(parts[1])
        if amount <= 0:
            raise ValueError()
    except ValueError:
        bot.send_message(message.chat.id, "❌ টাকার পরিমাণ সঠিক সংখ্যায় লিখুন!")
        return

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO deposits (user_id, method, amount, trx_id) VALUES (%s, %s, %s, %s) RETURNING id",
                            (message.from_user.id, method, amount, trx_id))
                dep_id = cur.fetchone()[0]
                conn.commit()
    except psycopg2.IntegrityError:
        bot.send_message(message.chat.id, "⚠️ এই TrxID টি ইতিমধ্যে একবার ব্যবহার করা হয়েছে!")
        return

    bot.send_message(message.chat.id, "✅ আপনার ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করে খুব শীঘ্রই ব্যালেন্স যুক্ত করে দেবে।")

    # অ্যাডমিনকে নোটিফিকেশন পাঠানো
    admin_markup = types.InlineKeyboardMarkup()
    admin_markup.add(
        types.InlineKeyboardButton("✅ Approve", callback_data=f"app_{dep_id}"),
        types.InlineKeyboardButton("❌ Reject", callback_data=f"rej_{dep_id}")
    )
    admin_text = (
        f"🔔 **নতুন ডিপোজিট রিকোয়েস্ট!**\n\n"
        f"👤 ইউজার: @{message.from_user.username} (`{message.from_user.id}`)\n"
        f"🏦 মেথড: {method}\n"
        f"💰 পরিমাণ: {amount} TK\n"
        f"🆔 TrxID: `{trx_id}`"
    )
    bot.send_message(ADMIN_ID, admin_text, parse_mode="Markdown", reply_markup=admin_markup)

@bot.callback_query_handler(func=lambda c: c.data.startswith("app_") or c.data.startswith("rej_"))
def admin_deposit_action(call):
    if call.from_user.id != ADMIN_ID:
        return bot.answer_callback_query(call.id, "অনুমতি নেই!")

    action, dep_id = call.data.split("_")
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM deposits WHERE id = %s", (dep_id,))
            dep = cur.fetchone()
            if not dep or dep['status'] != 'pending':
                return bot.answer_callback_query(call.id, "ইতিমধ্যে অ্যাকশন নেওয়া হয়েছে!")

            if action == "app":
                cur.execute("UPDATE deposits SET status = 'approved' WHERE id = %s", (dep_id,))
                cur.execute("UPDATE users SET balance = balance + %s WHERE user_id = %s", (dep['amount'], dep['user_id']))
                conn.commit()
                bot.send_message(dep['user_id'], f"🎉 অভিনন্দন! আপনার **{dep['amount']} TK** ডিপোজিট অনুমোদিত হয়েছে।", parse_mode="Markdown")
                bot.edit_message_text(f"✅ ডিপোজিট Approved! (ID: {dep_id})", call.message.chat.id, call.message.message_id)
            else:
                cur.execute("UPDATE deposits SET status = 'rejected' WHERE id = %s", (dep_id,))
                conn.commit()
                bot.send_message(dep['user_id'], f"❌ দুঃখিত, আপনার `{dep['trx_id']}` TrxID ডিপোজিট বাতিল করা হয়েছে।", parse_mode="Markdown")
                bot.edit_message_text(f"❌ ডিপোজিট Rejected! (ID: {dep_id})", call.message.chat.id, call.message.message_id)

# ----------------- বাই এবং স্টক সিস্টেম -----------------
@bot.message_handler(func=lambda m: m.text == "💵 Buy Product")
def buy_categories(message):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT category FROM products")
            cats = cur.fetchall()

    if not cats:
        bot.send_message(message.chat.id, "বর্তমানে কোনো ক্যাটাগরি নেই।")
        return

    markup = types.InlineKeyboardMarkup()
    for cat in cats:
        markup.add(types.InlineKeyboardButton(f"📁 {cat[0]}", callback_data=f"cat_{cat[0]}"))
    bot.send_message(message.chat.id, "🛍️ **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", parse_mode="Markdown", reply_markup=markup)

@bot.callback_query_handler(func=lambda c: c.data.startswith("cat_"))
def show_products_in_cat(call):
    cat_name = call.data.split("_", 1)[1]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT p.id, p.name, p.price, 
                COUNT(s.id) FILTER (WHERE s.is_sold = FALSE) AS stock_count
                FROM products p
                LEFT JOIN stocks s ON p.id = s.product_id
                WHERE p.category = %s
                GROUP BY p.id
            """, (cat_name,))
            products = cur.fetchall()

    markup = types.InlineKeyboardMarkup()
    for p in products:
        stock = p['stock_count']
        stock_text = f"Stock: {stock}" if stock > 0 else "Out of Stock"
        btn_text = f"{p['name']} | {p['price']} TK | {stock_text}"
        markup.add(types.InlineKeyboardButton(btn_text, callback_data=f"prod_{p['id']}"))
    
    markup.add(types.InlineKeyboardButton("🔙 Back", callback_data="back_to_cats"))
    bot.edit_message_text(f"🛍️ **{cat_name} প্রোডাক্ট সিলেক্ট করুন:**", call.message.chat.id, call.message.message_id, parse_mode="Markdown", reply_markup=markup)

@bot.callback_query_handler(func=lambda c: c.data == "back_to_cats")
def back_cats_handler(call):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT category FROM products")
            cats = cur.fetchall()
    markup = types.InlineKeyboardMarkup()
    for cat in cats:
        markup.add(types.InlineKeyboardButton(f"📁 {cat[0]}", callback_data=f"cat_{cat[0]}"))
    bot.edit_message_text("🛍️ **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", call.message.chat.id, call.message.message_id, parse_mode="Markdown", reply_markup=markup)

def quantity_keyboard(prod_id, qty):
    markup = types.InlineKeyboardMarkup()
    btn_minus = types.InlineKeyboardButton("➖", callback_data=f"qty_sub_{prod_id}_{qty}")
    btn_num = types.InlineKeyboardButton(f"{qty}", callback_data="noop")
    btn_plus = types.InlineKeyboardButton("➕", callback_data=f"qty_add_{prod_id}_{qty}")
    markup.row(btn_minus, btn_num, btn_plus)
    markup.row(
        types.InlineKeyboardButton("✅ Confirm Order", callback_data=f"order_confirm_{prod_id}_{qty}"),
        types.InlineKeyboardButton("❌ Cancel", callback_data="back_to_cats")
    )
    return markup

@bot.callback_query_handler(func=lambda c: c.data.startswith("prod_"))
def select_product(call):
    prod_id = int(call.data.split("_")[1])
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT p.*, COUNT(s.id) FILTER (WHERE s.is_sold = FALSE) AS stock_count
                FROM products p
                LEFT JOIN stocks s ON p.id = s.product_id
                WHERE p.id = %s GROUP BY p.id
            """, (prod_id,))
            prod = cur.fetchone()

    if prod['stock_count'] <= 0:
        return bot.answer_callback_query(call.id, "❌ দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট (Out of Stock)!", show_alert=True)

    qty = 1
    total = float(prod['price']) * qty
    text = (
        f"💲 **{prod['name']}**\n"
        f"💰 প্রাইস: {prod['price']} TK\n"
        f"স্টক: {prod['stock_count']}\n\n"
        f"পরিমাণ: {qty}\n"
        f"মোট খরচ: {total:.2f} TK"
    )
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, parse_mode="Markdown", reply_markup=quantity_keyboard(prod_id, qty))

@bot.callback_query_handler(func=lambda c: c.data.startswith("qty_add_") or c.data.startswith("qty_sub_"))
def update_quantity(call):
    parts = call.data.split("_")
    action = parts[1]
    prod_id = int(parts[2])
    qty = int(parts[3])

    if action == "add":
        qty += 1
    elif action == "sub" and qty > 1:
        qty -= 1

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT p.*, COUNT(s.id) FILTER (WHERE s.is_sold = FALSE) AS stock_count
                FROM products p
                LEFT JOIN stocks s ON p.id = s.product_id
                WHERE p.id = %s GROUP BY p.id
            """, (prod_id,))
            prod = cur.fetchone()

    if qty > prod['stock_count']:
        return bot.answer_callback_query(call.id, f"সর্বোচ্চ স্টক উপলব্ধ: {prod['stock_count']} টি", show_alert=True)

    total = float(prod['price']) * qty
    text = (
        f"💲 **{prod['name']}**\n"
        f"💰 প্রাইস: {prod['price']} TK\n"
        f"স্টক: {prod['stock_count']}\n\n"
        f"পরিমাণ: {qty}\n"
        f"মোট খরচ: {total:.2f} TK"
    )
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, parse_mode="Markdown", reply_markup=quantity_keyboard(prod_id, qty))

@bot.callback_query_handler(func=lambda c: c.data.startswith("order_confirm_"))
def confirm_order_handler(call):
    _, _, prod_id, qty = call.data.split("_")
    prod_id = int(prod_id)
    qty = int(qty)
    user_id = call.from_user.id

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM products WHERE id = %s", (prod_id,))
            prod = cur.fetchone()
            cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            user = cur.fetchone()

            total_cost = float(prod['price']) * qty

            if float(user['balance']) < total_cost:
                return bot.answer_callback_query(call.id, f"❌ আপনার ব্যালেন্স পর্যাপ্ত নয়! প্রয়োজন {total_cost:.2f} TK, আপনার আছে {user['balance']} TK।", show_alert=True)

            cur.execute("SELECT id, account_data FROM stocks WHERE product_id = %s AND is_sold = FALSE LIMIT %s FOR UPDATE", (prod_id, qty))
            stocks_to_deliver = cur.fetchall()

            if len(stocks_to_deliver) < qty:
                return bot.answer_callback_query(call.id, "❌ দুঃখিত, পর্যাপ্ত স্টক নেই বা স্টক আউট হয়ে গেছে!", show_alert=True)

            stock_ids = [s['id'] for s in stocks_to_deliver]
            delivered_text = "\n".join([s['account_data'] for s in stocks_to_deliver])

            cur.execute("UPDATE stocks SET is_sold = TRUE, sold_to = %s, sold_at = NOW() WHERE id = ANY(%s)", (user_id, stock_ids))
            cur.execute("UPDATE users SET balance = balance - %s WHERE user_id = %s", (total_cost, user_id))
            cur.execute("INSERT INTO orders (user_id, product_name, quantity, total_price, items_delivered) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, prod['name'], qty, total_cost, delivered_text))
            conn.commit()

    success_msg = (
        f"🎉 **অর্ডার সফল হয়েছে!**\n\n"
        f"📦 প্রোডাক্ট: **{prod['name']}**\n"
        f"🔢 পরিমাণ: {qty} টি\n"
        f"💰 মোট খরচ: {total_cost:.2f} TK\n\n"
        f"🔑 **আপনার অ্যাকাউন্ট সমূহ:**\n```\n{delivered_text}\n```\n"
        f"ধন্যবাদ আমাদের সেবা গ্রহণ করার জন্য!"
    )
    bot.edit_message_text(success_msg, call.message.chat.id, call.message.message_id, parse_mode="Markdown")

@bot.message_handler(func=lambda m: m.text == "⌛ Order History")
def history_cmd(message):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM orders WHERE user_id = %s ORDER BY id DESC LIMIT 5", (message.from_user.id,))
            orders = cur.fetchall()

    if not orders:
        bot.send_message(message.chat.id, "আপনার কোনো পূর্ববর্তী অর্ডার হিস্ট্রি পাওয়া যায়নি।")
        return

    text = "📜 **আপনার সাম্প্রতিক ৫টি অর্ডার:**\n\n"
    for o in orders:
        text += f"▪️ {o['product_name']} ({o['quantity']} টি) - {o['total_price']} TK\n"
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

@bot.callback_query_handler(func=lambda c: c.data == "noop")
def noop(call):
    bot.answer_callback_query(call.id)

print("বট সফলভাবে চালু হয়েছে...")
bot.infinity_polling()
