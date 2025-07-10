#!/bin/bash

# Create directories for file uploads if using local filesystem option
mkdir -p ./uploads/avatars
mkdir -p ./uploads/posts
mkdir -p ./uploads/general

echo "Created upload directories"

# Check if docker is installed
if command -v docker &> /dev/null; then
  # Check if MinIO container is running
  if ! docker ps | grep -q minio; then
    echo "Starting MinIO container..."
    docker run -d --name minio \
      -p 9000:9000 -p 9001:9001 \
      -e "MINIO_ROOT_USER=minioadmin" \
      -e "MINIO_ROOT_PASSWORD=minioadmin" \
      -v $PWD/minio-data:/data \
      minio/minio server /data --console-address ":9001"
    
    echo "MinIO is now running:"
    echo "- API: http://localhost:9000"
    echo "- Console: http://localhost:9001 (login with minioadmin/minioadmin)"
  else
    echo "MinIO is already running"
  fi
else
  echo "Docker not found. Please install Docker to run MinIO, or use the filesystem option."
fi
