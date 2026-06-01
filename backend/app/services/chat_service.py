import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class ChatService:
    """
    Service for interacting with LLM for chat and insights.
    Uses OpenRouter for model access.
    """
    
    def __init__(self, forecast_data: Optional[Dict[str, Any]] = None):
        self.api_key = os.environ.get("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.forecast_data = forecast_data
        
    def generate_response(self, message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Generates a chat response based on user message and optional history.
        """
        if not self.api_key:
            return {"response": "I'm sorry, I'm not configured with an API key yet. Please add OPENROUTER_API_KEY to your environment."}
            
        system_prompt = self._build_system_prompt()
        
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})
        
        try:
            response = requests.post(
                url=f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                data=json.dumps({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": messages,
                })
            )
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.text}")
                return {"response": "I encountered an error communicating with the AI service. Please try again later."}
                
            data = response.json()
            ai_message = data['choices'][0]['message']['content']
            
            return {"response": ai_message}
            
        except Exception as e:
            logger.exception("Error generating chat response")
            return {"response": f"An error occurred: {str(e)}"}
            
    def _build_system_prompt(self) -> str:
        """
        Builds a context-aware system prompt for the LLM.
        """
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
        """
        Specific method to generate structured insights based on a specific query.
        """
        # For now, just use the general response method
        return self.generate_response(query)
