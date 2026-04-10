# Use official Python slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY server.py .
COPY index.html .
COPY css/ css/
COPY js/ js/

# Cloud Run listens on PORT env var (default 8080)
ENV PORT=8080

# Run the server
CMD ["python", "server.py"]
