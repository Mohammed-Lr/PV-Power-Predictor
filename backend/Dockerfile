# USE YOUR VERSION: Python 3.13 (matches your local environment)
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies (gcc is crucial for building some Python tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to the latest version
RUN pip install --upgrade pip

# Copy requirements file
COPY requirements.txt .

# 1. Install Catboost separately to cache this huge download
# We remove the specific version '==1.2.2' in this command to let it find the best match for Python 3.13
# It will still respect the version in requirements.txt if possible
RUN pip install --default-timeout=1000 --no-cache-dir catboost

# 2. Install the rest of the dependencies
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Copy the model file
COPY *.pkl .

# Expose port
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]