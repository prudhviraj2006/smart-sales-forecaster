from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import logging

from ..services.chat_service import ChatService
from ..auth import get_api_key

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_ROLES = {"user", "assistant"}


# --- Fix M-7 / M-8: Strict input validation on chat messages ---
class ChatMessage(BaseModel):
    role: str
    content: str = Field(max_length=5000)

class ChatRequest(BaseModel):
    job_id: Optional[str] = ""
    message: str = Field(max_length=5000)
    conversation_history: Optional[List[ChatMessage]] = Field(default=None, max_length=50)


class ChatResponse(BaseModel):
    success: bool
    response: str
    timestamp: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None


from ..models.database import get_job_with_forecast

@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, payload: ChatRequest, _key: str = Depends(get_api_key)):
    """
    Chat with AI about forecast insights

    Args:
        job_id: ID of the forecast job
        message: User's message
        conversation_history: Previous messages for context

    Returns:
        AI response with metadata
    """
    try:
        # Load context
        job_data = None
        if payload.job_id:
            try:
                job_data = get_job_with_forecast(payload.job_id)
            except Exception:
                pass

        forecast_context = job_data.get('forecast', {}) if job_data else None

        # Initialize chat service
        service = ChatService(forecast_data=forecast_context)

        # --- Fix M-7: Sanitize conversation history roles ---
        sanitized_history = []
        if payload.conversation_history:
            for msg in payload.conversation_history:
                if msg.role not in ALLOWED_ROLES:
                    continue  # Skip messages with invalid roles (e.g. "system")
                sanitized_history.append({"role": msg.role, "content": msg.content})

        # Get response
        result = service.generate_response(
            message=payload.message,
            history=sanitized_history
        )

        return ChatResponse(
            success=True,
            response=result.get('response', ''),
            timestamp=result.get('timestamp'),
            model=result.get('model'),
            error=result.get('error')
        )

    except Exception as e:
        # --- Fix H-4: Don't leak internal error details ---
        logger.error(f"Chat endpoint error: {str(e)}")
        return ChatResponse(
            success=False,
            response="Sorry, I encountered an error. Please try again.",
            error="Internal error"
        )
