from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def detect_intent(question: str):

    prompt = f"""
Classify into ONLY ONE value:

add_to_cart
remove_from_cart
show_cart
checkout
track_order
search_product
user_preferences
database_query

RULES:
- only one word
- no explanation
- no uppercase
- no punctuation

User: {question}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    intent = response.choices[0].message.content.strip().lower()
    intent = intent.replace(" ", "_").replace("-", "_")

    allowed = {
        "add_to_cart",
        "remove_from_cart",
        "show_cart",
        "checkout",
        "track_order",
        "search_product",
        "user_preferences",
        "database_query"
    }

    return intent if intent in allowed else "database_query"