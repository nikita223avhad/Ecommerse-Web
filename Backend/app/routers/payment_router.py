from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.deps import get_db
from app.models.payment_model import Payment
from app.schemas.payment_schemas import PaymentCreate

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

# Create Payment
@router.post("/")
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):

    new_payment = Payment(
        order_id=payment.order_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        payment_status=payment.payment_status
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    return new_payment


# Get All Payments
@router.get("/")
def get_all_payments(
    db: Session = Depends(get_db)
):

    return db.query(Payment).all()


# Get Payment By ID
@router.get("/{payment_id}")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


# Update Payment
@router.put("/{payment_id}")
def update_payment(
    payment_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):

    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    payment.amount = payment_data.amount
    payment.payment_method = payment_data.payment_method
    payment.payment_status = payment_data.payment_status

    db.commit()
    db.refresh(payment)

    return payment


# Delete Payment
@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    db.delete(payment)
    db.commit()

    return {
        "message": "Payment deleted successfully"
    }