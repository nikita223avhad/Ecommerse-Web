from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.dependencies.deps import get_db
from app.models.order_model import Order
from app.schemas.order_schemas import OrderCreate

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

# Create Order
@router.post("/")
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db)
):

    new_order = Order(
        user_id=order.user_id,
        product_id=order.product_id,
        total_price=order.total_price,
        status="Placed",
        status_updated_at=datetime.utcnow()
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


# Get All Orders
@router.get("/")
def get_orders(
    db: Session = Depends(get_db)
):

    return db.query(Order).all()


# Get Order By ID
@router.get("/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order


# Update Order Status
@router.put("/{order_id}/status")
def update_order(
    order_id: int,
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.total_price = order_data.total_price
    order.status = order_data.status
    order.status_updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    return order


# Delete Order
@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    db.delete(order)
    db.commit()

    return {
        "message": "Order deleted successfully"
    }