FROM python:3.9-slim-bullseye AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.9-slim-bullseye

WORKDIR /app

# Create non-root user
RUN addgroup --system app && \
    adduser --system --group app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Add .dockerignore to prevent unnecessary files from being included
# Create a .dockerignore file in the root of your project if not exists

# Copy only necessary files
COPY alembic.ini .
COPY migrations ./migrations
COPY models.py schemas.py database.py crud.py main.py ./
COPY auth ./auth
COPY routers ./routers
COPY api ./api
COPY storage ./storage
COPY client_secret.json ./

# Change ownership
RUN chown -R app:app /app

# Use non-root user
USER app

# Define healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Create a startup script
COPY <<EOF /app/start.sh
#!/bin/sh
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000
EOF

RUN chmod +x /app/start.sh

# Run startup script
CMD ["./start.sh"]