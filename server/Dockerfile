FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for uWSGI and Pillow
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# Install uwsgi for production use
RUN pip install --no-cache-dir uwsgi

COPY . .

# Expose port for dev and prod (8000)
EXPOSE 8000

# Default command for development; will be overridden in docker-compose
CMD ["python", "server.py"]
