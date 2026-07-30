FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

RUN mkdir -p data uploads

RUN useradd -m -u 1000 user || echo "User already exists"
RUN chown -R 1000:1000 /app && chmod -R 755 /app && chmod -R 777 /app/data /app/uploads

USER 1000

ENV PORT=7860
ENV DATABASE_PATH=data/forecaster.db
ENV UPLOAD_DIR=uploads
ENV ENVIRONMENT=production
ENV ALLOWED_ORIGINS=*

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
