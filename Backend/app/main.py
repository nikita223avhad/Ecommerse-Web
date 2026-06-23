from fastapi import FastAPI
from app.routers import auth_router
from app.core.database import Base,engine
from app.models.user_model import User
from app.routers import Product_router
from app.routers import category_router
from app.routers import card_router
from app.routers import order_router
from app.routers import payment_router
from app.models.payment_model import Payment
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers.chatbot_router import router as chatbot_router
from app.models.checkout_session_model import CheckoutSession
from app.services.order_sheduler import scheduler


app = FastAPI()
@app.on_event("startup")
async def startup_event():
    scheduler.start()

app.mount(
    "/uploaded_images",
    StaticFiles(directory="uploaded_images"),
    name="uploaded_images"
)
# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router.router)
app.include_router(Product_router.router)
app.include_router(category_router.router)
app.include_router(card_router.router)
app.include_router(order_router.router)
app.include_router(payment_router.router)
app.include_router(chatbot_router)

Base.metadata.create_all(bind = engine)

@app.get("/")
def home():
    return {"message": "Ecommerce API"}