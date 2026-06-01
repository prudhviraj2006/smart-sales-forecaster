FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Create directories for sqlite and uploads and set permissions
RUN mkdir -p data uploads && \
    chmod -R 777 /app

# Hugging Face runs as user 1000
RUN useradd -m -u 1000 user
USER user

# Expose port
EXPOSE 7860
EXPOSE 8000

# Run the API
CMD sh -c "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"
