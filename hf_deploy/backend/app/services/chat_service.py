import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Global variable to cache the model in memory
_hf_pipeline = None

def get_hf_pipeline():
    global _hf_pipeline
    if _hf_pipeline is None:
        logger.info("Loading Hugging Face model... this may take a moment.")
        from transformers import pipeline
        # Use a lightweight conversational model
        _hf_pipeline = pipeline("text-generation", model="TinyLlama/TinyLlama-1.1B-Chat-v1.0", max_new_tokens=150)
        logger.info("Hugging Face model loaded successfully.")
    return _hf_pipeline

class ChatService:
    """
    Service for interacting with LLM for chat and insights.
    Uses a local Hugging Face model running directly in Python.
    """

    def __init__(self, forecast_data: Optional[Dict[str, Any]] = None):
        self.forecast_data = forecast_data

    def generate_response(self, message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        system_prompt = self._build_system_prompt()
        
        # Build prompt format for TinyLlama
        prompt = f"<|system|>\n{system_prompt}</s>\n"
        
        if history:
            for msg in history:
                if msg["role"] == "user":
                    prompt += f"<|user|>\n{msg['content']}</s>\n"
                elif msg["role"] == "assistant":
                    prompt += f"<|assistant|>\n{msg['content']}</s>\n"
        
        prompt += f"<|user|>\n{message}</s>\n<|assistant|>\n"

        try:
            generator = get_hf_pipeline()
            # Generate the response
            results = generator(prompt, do_sample=True, temperature=0.7, top_k=50, top_p=0.95)
            
            # Extract the new assistant part
            generated_text = results[0]["generated_text"]
            response_start = generated_text.rfind("<|assistant|>\n")
            if response_start != -1:
                ai_message = generated_text[response_start + len("<|assistant|>\n"):].strip()
            else:
                ai_message = generated_text.strip()
                
            return {"response": ai_message}

        except Exception as e:
            logger.exception("Error generating chat response with Hugging Face")
            return {"response": "An error occurred while running the local AI model. Please check the backend logs."}

    def _build_system_prompt(self) -> str:
        prompt = """You are a professional Sales Forecasting AI Assistant. 
        Your goal is to help business users understand their sales forecasts and provide actionable business advice.
        
        Guidelines:
        1. Be professional, concise, and data-driven.
        2. Use the Indian Rupee (₹) symbol for all currency values.
        3. If you don't know the answer based on the provided data, be honest about it.
        4. Focus on business strategy, inventory planning, and market trends.
        """

        if self.forecast_data:
            metrics = self.forecast_data.get('metrics', {})
            model_type = self.forecast_data.get('model_type', 'N/A')

            context = f"\n\nCURRENT FORECAST CONTEXT:\n"
            context += f"- Model Used: {model_type}\n"
            context += f"- Mean Absolute Error (MAE): ₹{metrics.get('mae', 0):,.2f}\n"
            context += f"- Mean Absolute Percentage Error (MAPE): {metrics.get('mape', 0):.2f}%\n"
            context += f"- Accuracy: {metrics.get('accuracy', 0):.2f}%\n"

            if 'total_projected_revenue' in metrics:
                context += f"- Total Projected Revenue: ₹{metrics.get('total_projected_revenue', 0):,.2f}\n"

            prompt += context

        return prompt

    def generate_insights_from_query(self, query: str) -> Dict[str, Any]:
        return self.generate_response(query)
