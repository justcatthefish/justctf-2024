# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
RUN pip install --no-cache-dir  requests
COPY solve.py .

ENTRYPOINT ["python", "solve.py"]