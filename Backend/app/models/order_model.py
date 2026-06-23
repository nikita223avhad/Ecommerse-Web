from sqlalchemy import Column, Integer, Float, String, ForeignKey,DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Order(Base):

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id")
    )

    total_price = Column(Float)

    status = Column(
        String(50),
        default="Placed"
    )
    status_updated_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    #user = relationship("User")

    #product = relationship("Product")