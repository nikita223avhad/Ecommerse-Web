from pydantic import BaseModel

class OrderCreate(BaseModel):

    user_id: int
    product_id: int
    total_price: float
    status: str


class OrderResponse(BaseModel):

    id: int
    user_id: int
    product_id: int
    total_price: float
    status: str

    class Config:
        from_attributes = True