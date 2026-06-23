from fastapi import APIRouter
from app.schemas.chatbot_schemas import AIQuestion
from app.services.chatbot_service import process_chat

router = APIRouter(
    prefix="/chatbot",
    tags=["chatBot"]
)

@router.post("/ask")
def ask_ai(request: AIQuestion):


    return process_chat(
        request.question,
        request.user_id
    )