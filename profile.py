def register_profile_handlers(bot, get_db):

    # প্রোফাইল দেখা
    @bot.message_handler(func=lambda msg: msg.text == "👨‍💻 Profile")
    def show_profile(message):
        uid = message.from_user.id
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT balance FROM users WHERE user_id = %s;", (uid,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        balance = user['balance'] if user else "0.00"
        text = (
            f"👤 **আপনার প্রোফাইল তথ্য**\n\n"
            f"🆔 **ইউজার আইডি:** `{uid}`\n"
            f"👤 **নাম:** {message.from_user.first_name}\n"
            f"💰 **বর্তমান ব্যালেন্স:** **{balance} TK**\n"
        )
        bot.send_message(uid, text, parse_mode="Markdown")

    # অর্ডার হিস্টোরি দেখা
    @bot.message_handler(func=lambda msg: msg.text == "⌛ Order History")
    def show_order_history(message):
        uid = message.from_user.id
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT o.id, p.name, o.quantity, o.total_price, o.created_at 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            WHERE o.user_id = %s 
            ORDER BY o.created_at DESC LIMIT 5;
        """, (uid,))
        orders = cur.fetchall()
        cur.close()
        conn.close()

        if not orders:
            bot.send_message(uid, "📭 আপনি এখনো কোনো অর্ডার করেননি!")
            return

        text = "📜 **আপনার বিগত ৫টি অর্ডার:**\n\n"
        for o in orders:
            text += f"🔹 **প্রোডাক্ট:** {o['name']} ({o['quantity']} টি)\n💰 মোট: {o['total_price']} TK\n\n"

        bot.send_message(uid, text, parse_mode="Markdown")
