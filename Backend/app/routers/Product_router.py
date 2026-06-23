import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.dependencies.deps import get_db
from app.models.product_model import Product
from app.models.cart_model import Cart

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# CREATE PRODUCT
@router.post("/")
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"

    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        image_path=file_path,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product created successfully",
        "product": product
    }


# GET ALL PRODUCTS
@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


# GET PRODUCT BY ID
@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# UPDATE PRODUCT
@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    category: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = name
    product.description = description
    product.price = price
    product.stock = stock
    product.category = category

    if file:
        if product.image_path and os.path.exists(product.image_path):
            os.remove(product.image_path)

        extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{extension}"

        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        product.image_path = file_path

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": product
    }


# DELETE PRODUCT
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Delete cart records first
    cart_items = db.query(Cart).filter(
        Cart.product_id == product_id
    ).all()

    for item in cart_items:
        db.delete(item)

    # Delete image file
    if product.image_path and os.path.exists(product.image_path):
        os.remove(product.image_path)

    db.delete(product)

    db.commit()

    return {
        "message": "Product deleted successfully"
    }