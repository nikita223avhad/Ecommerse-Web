from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.deps import get_db
from app.models.category_model import Category
from app.schemas.category_schema import CategoryCreate

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

# Create Category
@router.post("/")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):

    existing_category = db.query(Category).filter(
        Category.name == category.name
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    new_category = Category(
        name=category.name,
        description=category.description
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


# Get All Categories
@router.get("/")
def get_categories(
    db: Session = Depends(get_db)
):
    return db.query(Category).all()


# Get Category By ID
@router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


# Update Category
@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = category_data.name
    category.description = category_data.description

    db.commit()
    db.refresh(category)

    return category


# Delete Category
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }