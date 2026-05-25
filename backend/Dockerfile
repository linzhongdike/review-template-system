FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libsqlite3-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy production env
COPY .env.production .env

# Create data directory
RUN mkdir -p /app/data /app/uploads

EXPOSE 8000

ENTRYPOINT ["python", "entrypoint.py"]
