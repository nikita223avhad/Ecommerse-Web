from groq import Groq
from sqlalchemy import text
from dotenv import load_dotenv
from app.core.database import engine
from app.services.intent_service import detect_intent
import os
import json

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

SCHEMA = """
TABLE users
(
id INTEGER PRIMARY KEY,
username VARCHAR,
email VARCHAR,
password VARCHAR
)

TABLE products
(
id INTEGER PRIMARY KEY,
name VARCHAR,
description TEXT,
price FLOAT,
category VARCHAR,
stock INTEGER,
image VARCHAR
)

TABLE cart
(
id INTEGER PRIMARY KEY,
user_id INTEGER,
product_id INTEGER,
quantity INTEGER,

FOREIGN KEY(user_id) REFERENCES users(id),
FOREIGN KEY(product_id) REFERENCES products(id)
)

TABLE orders
(
id INTEGER PRIMARY KEY,
user_id INTEGER,
product_id INTEGER,
total_price FLOAT,
status VARCHAR,

FOREIGN KEY(user_id) REFERENCES users(id),
FOREIGN KEY(product_id) REFERENCES products(id)
)

TABLE payments
(
id INTEGER PRIMARY KEY,
order_id INTEGER,
amount FLOAT,
payment_method VARCHAR,
payment_status VARCHAR,

FOREIGN KEY(order_id) REFERENCES orders(id)
)
"""


def generate_sql(question,user_id):

    prompt = f"""
You are a MySQL expert.

IMPORTANT RULES:

1. Use ONLY these tables:
   - users
   - products
   - cart
   - orders
   -spending
   -purchases


2. Never use tables that are not listed.

3. Never use columns that are not listed.

4. Return ONLY SQL.

5. Generate ONLY SELECT queries.
6. Do not use markdown or code blocks.

7. Use user_id = {user_id} ONLY for tables that contain a user_id column:
   - cart
   - orders

8. Never add user_id filters to the products table.

9. When users ask for brands or product names (for example: Dell, HP, Lenovo, iPhone, Samsung), search in product name and description using LIKE.

10. Use LOWER() for case-insensitive matching.


Database Schema:

{SCHEMA}

then always use:
    WHERE user_id = {user_id}

    Question:
    {question}

"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    sql = response.choices[0].message.content.strip()

    sql = sql.replace("```sql", "")
    sql = sql.replace("```", "")
    sql = sql.strip()

    return sql


def execute_sql(sql):

    try:

        with engine.connect() as conn:

            result = conn.execute(text(sql))

            return [
                dict(row._mapping)
                for row in result
            ]

    except Exception as e:

        return {
            "error": str(e)
        }


def generate_answer(question, data):

    prompt = f"""
Question:
{question}

Database Result:
{data}

Provide a short human-friendly answer.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()


def handle_add_to_cart(question, user_id):

    try:
        # STEP 1: extract data safely
        prompt = f"""
Extract product name and quantity from user message.

Return ONLY JSON:
{{
  "product_name": "",
  "quantity": 1
}}

User: {question}
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)

        product_name = data.get("product_name", "").strip()
        quantity = int(data.get("quantity", 1))

        if not product_name:
            return {"success": False, "message": "Product not found in request"}

        with engine.begin() as conn:

            # STEP 2: find product
            product = conn.execute(
                text("""
                    SELECT id, name, stock
                    FROM products
                    WHERE LOWER(name) LIKE LOWER(:name)
                       OR LOWER(description) LIKE LOWER(:name)
                    LIMIT 1
                """),
                {"name": f"%{product_name.lower()}%"}
            ).fetchone()

            if not product:
                return {"success": False, "message": f"{product_name} not found"}

            # STEP 3: insert cart
            result = conn.execute(
                text("""
                    INSERT INTO cart (user_id, product_id, quantity)
                    VALUES (:user_id, :product_id, :quantity)
                """),
                {
                    "user_id": user_id,
                    "product_id": product.id,
                    "quantity": quantity
                }
            )

        return {
            "success": True,
            "message": f"{product.name} added to cart successfully",
            "rows_affected": result.rowcount
        }

    except Exception as e:
        return {"success": False, "message": str(e)}
    

def handle_remove_from_cart(question, user_id):

    try:
        prompt = f"""
Extract the product name and quantity from the user request.

Return JSON only.

Examples:

Input: Remove iPhone 15 from my cart
Output:
{{"product_name": "iPhone 15", "quantity": 1}}

Input: Remove 2 Samsung Galaxy S24 from cart
Output:
{{"product_name": "Samsung Galaxy S24", "quantity": 2}}

User request:
{question}
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)

        product_name = data["product_name"]
        quantity = int(data.get("quantity", 1))

        with engine.begin() as conn:

            product = conn.execute(
                text("""
                    SELECT id, name
                    FROM products
                    WHERE LOWER(name) LIKE LOWER(:name)
                    LIMIT 1
                """),
                {"name": f"%{product_name}%"}
            ).fetchone()

            if not product:
                return {
                    "success": False,
                    "action": "remove_from_cart",
                    "message": f"Product '{product_name}' not found."
                }

            cart_item = conn.execute(
                text("""
                    SELECT id, quantity
                    FROM cart
                    WHERE user_id = :user_id
                    AND product_id = :product_id
                """),
                {
                    "user_id": user_id,
                    "product_id": product.id
                }
            ).fetchone()

            if not cart_item:
                return {
                    "success": False,
                    "action": "remove_from_cart",
                    "message": f"{product.name} is not in your cart."
                }

            new_quantity = cart_item.quantity - quantity

            if new_quantity <= 0:
                conn.execute(
                    text("""
                        DELETE FROM cart
                        WHERE id = :id
                    """),
                    {"id": cart_item.id}
                )
            else:
                conn.execute(
                    text("""
                        UPDATE cart
                        SET quantity = :quantity
                        WHERE id = :id
                    """),
                    {
                        "quantity": new_quantity,
                        "id": cart_item.id
                    }
                )

        return {
            "success": True,
            "action": "remove_from_cart",
            "message": f"{product.name} removed from cart."
        }

    except Exception as e:
        return {
            "success": False,
            "action": "remove_from_cart",
            "message": str(e)
        }

def get_checkout_session(user_id):

    with engine.connect() as conn:
        return conn.execute(
            text("""
                SELECT *
                FROM checkout_sessions
                WHERE user_id = :user_id
                LIMIT 1
            """),
            {"user_id": user_id}
        ).fetchone()
    
def start_checkout(question, user_id):

    with engine.begin() as conn:

        conn.execute(
            text("""
                INSERT INTO checkout_sessions
                (user_id, step)
                VALUES
                (:user_id, 'full_name')
            """),
            {"user_id": user_id}
        )

    return {
        "success": True,
        "answer": "Delivery and Payment\n\nPlease enter your Full Name:"
    }
def continue_checkout(question, user_id, session):

    with engine.begin() as conn:

        if session.step == "full_name":

            conn.execute(
                text("""
                    UPDATE checkout_sessions
                    SET full_name=:value,
                        step='phone'
                    WHERE id=:id
                """),
                {
                    "value": question,
                    "id": session.id
                }
            )

            return {
                "success": True,
                "answer": "Please enter your Phone Number:"
            }

        elif session.step == "phone":

            conn.execute(
                text("""
                    UPDATE checkout_sessions
                    SET phone=:value,
                        step='address'
                    WHERE id=:id
                """),
                {
                    "value": question,
                    "id": session.id
                }
            )

            return {
                "success": True,
                "answer": "Please enter your Address:"
            }

        elif session.step == "address":

            conn.execute(
                text("""
                    UPDATE checkout_sessions
                    SET address=:value,
                        step='payment'
                    WHERE id=:id
                """),
                {
                    "value": question,
                    "id": session.id
                }
            )

            return {
                "success": True,
                "answer": "Payment Method:\n1. Credit Card\n2. Cash on Delivery"
            }

        elif session.step == "payment":

            conn.execute(
                text("""
                    UPDATE checkout_sessions
                    SET payment_method=:value,
                        step='card'
                    WHERE id=:id
                """),
                {
                    "value": question,
                    "id": session.id
                }
            )

            return {
                "success": True,
                "answer": "Please enter Card Number:"
            }

        elif session.step == "card":

            conn.execute(
                text("""
                    UPDATE checkout_sessions
                    SET card_number=:value,
                        step='confirm'
                    WHERE id=:id
                """),
                {
                    "value": question,
                    "id": session.id
                }
            )

            return {
                "success": True,
                "answer": "Type YES to place the order."
            }

        elif session.step == "confirm":

            if question.lower() != "yes":
                return {
                    "success": False,
                    "answer": "Checkout cancelled."
                }

            return finalize_order(user_id)
def finalize_order(user_id):

    with engine.begin() as conn:

        conn.execute(
            text("""
                INSERT INTO orders
                (user_id, product_id, total_price, status)

                SELECT
                    c.user_id,
                    c.product_id,
                    c.quantity * p.price,
                    'Placed'

                FROM cart c
                JOIN products p
                    ON p.id = c.product_id

                WHERE c.user_id = :user_id
            """),
            {"user_id": user_id}
        )

        conn.execute(
            text("""
                DELETE FROM cart
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )

        conn.execute(
            text("""
                DELETE FROM checkout_sessions
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )

    return {
        "success": True,
        "answer": "Order placed successfully."
    }            
def handle_track_order(question, user_id):

    try:

        with engine.connect() as conn:

            orders = conn.execute(
                text("""
                    SELECT
                        o.id AS order_id,
                        p.name AS product_name,
                        o.total_price,
                        o.status
                    FROM orders o
                    JOIN products p
                        ON o.product_id = p.id
                    WHERE o.user_id = :user_id
                    ORDER BY o.id DESC
                """),
                {"user_id": user_id}
            ).fetchall()

            if not orders:
                return {
                    "success": False,
                    "action": "track_order",
                    "message": "You have no orders yet."
                }

            order_list = [
                {
                    "order_id": order.order_id,
                    "product_name": order.product_name,
                    "total_price": order.total_price,
                    "status": order.status
                }
                for order in orders
            ]

            summary = "\n".join(
                [
                    f"Order #{order.order_id}: {order.product_name} - {order.status}"
                    for order in orders
                ]
            )

            return {
                "success": True,
                "action": "track_order",
                "message": summary,
                "orders": order_list
            }

    except Exception as e:

        return {
            "success": False,
            "action": "track_order",
            "message": str(e)
        }


def ask_database(question, user_id):

    sql = generate_sql(question,user_id)

    print("Generated SQL:", sql)

    if not sql.upper().startswith("SELECT"):

        return {
            "success": False,
            "error": "Only SELECT queries are allowed"
        }

    result = execute_sql(sql)

    if isinstance(result, dict) and "error" in result:

        return {
            "success": False,
            "generated_sql": sql,
            "error": result["error"]
        }

    answer = generate_answer(
        question,
        result
    )

    return {
        "success": True,
        "intent": "database_query",
        "generated_sql": sql,
        "answer": answer,
        "data": result
    }

def handle_user_preferences(user_id):

    with engine.connect() as conn:

        result = conn.execute(
            text("""
                SELECT
                    p.category,
                    COUNT(*) AS total
                FROM orders o
                JOIN products p
                    ON o.product_id = p.id
                WHERE o.user_id = :user_id
                GROUP BY p.category
                ORDER BY total DESC
                LIMIT 3
            """),
            {"user_id": user_id}
        ).fetchall()

    if not result:
        return {
            "success": True,
            "message": (
                "I don't have enough information about your preferences yet. "
                "Place some orders and I'll be able to identify your favorite categories."
            )
        }

    categories = [row.category for row in result]

    return {
        "success": True,
        "categories": categories,
        "message": f"You seem interested in: {', '.join(categories)}."
    }

def process_chat(question, user_id):

    session = get_checkout_session(user_id)

    if session:
        return continue_checkout(question, user_id, session)

    intent = detect_intent(question)

    print("QUESTION:", question)
    print("INTENT:", intent)

    if intent == "add_to_cart":
        return handle_add_to_cart(question, user_id)

    if intent == "remove_from_cart":
        return handle_remove_from_cart(question, user_id)

    if intent == "checkout":
        return start_checkout(question, user_id)

    if intent == "track_order":
        return handle_track_order(question, user_id)

    if intent == "user_preferences":
        return handle_user_preferences(user_id)

    return ask_database(question, user_id)