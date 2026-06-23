from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    category: str


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image_path: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image_path: Optional[str] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True