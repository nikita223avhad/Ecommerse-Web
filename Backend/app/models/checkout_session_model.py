from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base

class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=True)

    step = Column(String(50))

    full_name = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)

    payment_method = Column(String(50))
    card_number = Column(String(50))

    created_at = Column(TIMESTAMP, server_default=func.now())