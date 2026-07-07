# Use an official lightweight Python runtime
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose port 7860 (Hugging Face Spaces require apps to listen on port 7860)
EXPOSE 7860

# Run the application with Gunicorn binding to all interfaces on port 7860
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
