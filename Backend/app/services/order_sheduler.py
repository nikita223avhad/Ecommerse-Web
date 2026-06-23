from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionaLocal
from app.models.order_model import Order


def update_order_statuses():
    db = SessionaLocal()

    try:
        orders = db.query(Order).all()

        for order in orders:
            elapsed = datetime.utcnow() - order.status_updated_at

            if order.status == "Placed" and elapsed >= timedelta(minutes=30):
                order.status = "Confirmed"

            elif order.status == "Confirmed" and elapsed >= timedelta(minutes=90):
                order.status = "Processing"

            elif order.status == "Processing" and elapsed >= timedelta(minutes=120):
                order.status = "Packed"

            elif order.status == "Packed" and elapsed >= timedelta(minutes=150):
                order.status = "Shipped"

            elif order.status == "Shipped" and elapsed >= timedelta(minutes=180):
                order.status = "Out for Delivery"

            elif order.status == "Out for Delivery" and elapsed >= timedelta(minutes=200):
                order.status = "Delivered"

            else:
                continue

            order.status_updated_at = datetime.utcnow()

        db.commit()

    finally:
        db.close()


scheduler = BackgroundScheduler()

scheduler.add_job(
    update_order_statuses,
    "interval",
    minutes=1
)