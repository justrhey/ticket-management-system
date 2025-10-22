#!/bin/bash

# Ticket Management System - One-click Startup
set -e

echo "Ticket Management System Startup"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo " Docker is not installed. Please install Docker first."
    echo " Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo " Starting Docker daemon..."
    if command -v sudo &> /dev/null; then
        sudo systemctl start docker
    else
        echo " Please start Docker manually and run this script again"
        exit 1
    fi
    sleep 5
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Maven is not installed. Please install Maven first."
    echo " Visit: https://maven.apache.org/install.html"
    exit 1
fi

echo "Prerequisites check passed"
echo "Building application..."
mvn clean package -DskipTests

echo "Starting Docker containers..."
docker-compose down 2>/dev/null || true
docker-compose up --build -d

echo "Waiting for services to start (30 seconds)..."
for i in {1..30}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo " Application started successfully!"
        echo ""
        echo "Your Ticket Management System is ready!"
        echo "==========================================="
        echo "Application: http://localhost:8080"
        echo "API Docs:    http://localhost:8080/swagger-ui.html"
        echo "Health:      http://localhost:8080/actuator/health"
        echo ""
        echo "To stop:     ./stop-docker.sh"
        echo "View logs:   docker-compose logs -f app"
        exit 0
    fi
    printf "."
    sleep 1
done

echo " Application failed to start within 30 seconds"
echo " Check logs with: docker-compose logs app"
exit 1