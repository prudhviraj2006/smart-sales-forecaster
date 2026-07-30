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

# --- Fix M-9: Minimal permissions instead of chmod 777 ---
# Create directories for sqlite and uploads
RUN mkdir -p data uploads

# Hugging Face runs as user 1000
RUN useradd -m -u 1000 user

# Only grant write access to data and uploads directories
RUN chown -R user:user /app/data /app/uploads && \
    chmod -R 755 /app && \
    chmod -R 775 /app/data /app/uploads

USER user

# Expose port
EXPOSE 7860
EXPOSE 8000

# Run the API
CMD sh -c "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860} --limit-concurrency 20"
