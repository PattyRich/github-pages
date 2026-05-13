FROM python:3.13-slim

# Create a non-privileged user
RUN useradd -m -r appuser

WORKDIR /app

# Install system dependencies required for uWSGI and Pillow
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=appuser:appuser requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# Install uwsgi for production use
RUN pip install --no-cache-dir uwsgi

COPY --chown=appuser:appuser . .

# Switch to the non-root user
USER appuser

# Expose port for dev and prod (8000)
EXPOSE 8000

# Default command for development; will be overridden in docker-compose
CMD ["python", "server.py"]
