from telebot import types

def register_shop_handlers(bot, get_db):

    # ১. ক্যাটাগরি তালিকা দেখানো
    @bot.message_handler(func=lambda msg: msg.text == "🤑 Buy Product")
    def show_categories(message):
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("SELECT DISTINCT category FROM products;")
            categories = cur.fetchall()
            cur.close()
            conn.close()

            if not categories:
                bot.send_message(message.chat.id, "❌ বর্তমানে কোনো প্রোডাক্ট পাওয়া যায়নি!")
                return

            markup = types.InlineKeyboardMarkup(row_width=1)
            for cat in categories:
                markup.add(types.InlineKeyboardButton(f"📁 {cat['category']}", callback_data=f"cat_{cat['category']}"))

            bot.send_message(message.chat.id, "💸 **কী কিনতে চান? নিচের ক্যাটাগরি থেকে পছন্দ করুন:**", reply_markup=markup, parse_mode="Markdown")
        except Exception as e:
            bot.send_message(message.chat.id, f"ত্রুটি: {e}")

    # ২. প্রোডাক্ট ও স্টক তালিকা দেখানো
    @bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
    def list_products(call):
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
    def back_cats(call):
        show_categories(call.message)

    # ৩. প্লাস-মাইনাস কিবোর্ড মেকার
    def build_counter(prod_id, qty):
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

    # প্রোডাক্ট সিলেক্ট ভিউ
    @bot.callback_query_handler(func=lambda call: call.data.startswith("prod_"))
    def open_product(call):
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

        bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=build_counter(prod_id, qty), parse_mode="Markdown")

    # প্লাস / মাইনাস বাড়ানো বা কমানো
    @bot.callback_query_handler(func=lambda call: call.data.startswith("inc_") or call.data.startswith("dec_"))
    def update_quantity(call):
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

        bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=build_counter(prod_id, qty), parse_mode="Markdown")

    # কনফার্ম ও অ্যাকাউন্ট ডেলিভারি
    @bot.callback_query_handler(func=lambda call: call.data.startswith("confirm_"))
    def execute_order(call):
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
            bot.answer_callback_query(call.id, f"❌ অর্ডার ব্যর্থ! আপনার ব্যালেন্সে {total_price:.2f} TK নেই। দয়া করে ডিপোজিট করুন।", show_alert=True)
            return

        cur.execute("SELECT id, account_data FROM stock_items WHERE product_id = %s AND is_sold = FALSE LIMIT %s;", (prod_id, qty))
        items = cur.fetchall()

        if len(items) < qty:
            cur.close()
            conn.close()
            bot.answer_callback_query(call.id, "⚠️ স্টক শেষ হয়ে গেছে!", show_alert=True)
            return

        # ব্যালেন্স কাটা ও ডাটাবেজে স্টক আপডেট
        cur.execute("UPDATE users SET balance = balance - %s WHERE user_id = %s;", (total_price, uid))

        delivered = []
        for item in items:
            cur.execute("UPDATE stock_items SET is_sold = TRUE, sold_to = %s, sold_at = NOW() WHERE id = %s;", (uid, item['id']))
            delivered.append(item['account_data'])

        cur.execute("INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (%s, %s, %s, %s);", (uid, prod_id, qty, total_price))
        conn.commit()
        cur.close()
        conn.close()

        bot.edit_message_text("✅ আপনার অর্ডার সফল হয়েছে! নিচে একাউন্ট তথ্য চেক করুন।", call.message.chat.id, call.message.message_id)
        bot.send_message(uid, "📦 **আপনার ক্রয়কৃত একাউন্ট(গুলো):**\n\n" + "\n".join(delivered))
