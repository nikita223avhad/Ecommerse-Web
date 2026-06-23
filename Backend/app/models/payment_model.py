from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class Payment(Base):

    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id")
    )

    amount = Column(Float)

    payment_method = Column(
        String(50)
    )

    payment_status = Column(
        String(50),
        default="Pending"
    )

    order = relationship("Order")