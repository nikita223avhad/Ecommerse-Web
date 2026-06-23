from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.deps import get_db
from app.models.cart_model import Cart
from app.schemas.card_schemas import CartCreate

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)

# Add Product To Cart
@router.post("/")
def add_to_cart(
    cart: CartCreate,
    db: Session = Depends(get_db)
):

    new_cart = Cart(
        user_id=cart.user_id,
        product_id=cart.product_id,
        quantity=cart.quantity
    )

    db.add(new_cart)
    db.commit()
    db.refresh(new_cart)

    return new_cart


# Get All Cart Items
@router.get("/")
def get_cart_items(
    db: Session = Depends(get_db)
):
    return db.query(Cart).all()

# Get Cart Items By User ID
@router.get("/user/{user_id}")
def get_user_cart(
    user_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Cart).filter(
        Cart.user_id == user_id
    ).all()

# Get Cart Item By ID
@router.get("/{cart_id}")
def get_cart_item(
    cart_id: int,
    db: Session = Depends(get_db)
):

    cart = db.query(Cart).filter(
        Cart.id == cart_id
    ).first()

    if not cart:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    return cart



# Update Quantity
@router.put("/{cart_id}")
def update_cart(
    cart_id: int,
    cart_data: CartCreate,
    db: Session = Depends(get_db)
):

    cart = db.query(Cart).filter(
        Cart.id == cart_id
    ).first()

    if not cart:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    cart.quantity = cart_data.quantity

    db.commit()
    db.refresh(cart)

    return cart


# Remove Item From Cart
@router.delete("/{cart_id}")
def delete_cart(
    cart_id: int,
    db: Session = Depends(get_db)
):

    cart = db.query(Cart).filter(
        Cart.id == cart_id
    ).first()

    if not cart:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(cart)
    db.commit()

    return {
        "message": "Cart item deleted successfully"
    }

    