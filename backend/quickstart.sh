#!/usr/bin/env bash
# This script sets up and runs the complete backend stack

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ChildGuard Backend - Quick Start Setup             ║"
echo "║              Production-Ready Version 1.0.0                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is required but not installed."
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is required but not installed."
    echo "Install from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "Docker and Docker Compose are installed"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    # Generate random secrets if not already in template
    SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || echo "dev-secret-key")
    JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || echo "dev-jwt-secret")
    
    cp .env .env.local
    sed -i "s/your-super-secret-key-change-in-production-12345/$SECRET_KEY/" .env.local 2>/dev/null || \
        sed -i '' "s/your-super-secret-key-change-in-production-12345/$SECRET_KEY/" .env.local
    
    echo ".env file created"
else
    echo ".env file exists"
fi

echo ""
echo "Starting ChildGuard Backend Stack..."
echo ""
echo "Services starting:"
echo "   • PostgreSQL Database (port 5432)"
echo "   • Mosquitto MQTT Broker (port 1883)"
echo "   • Flask Backend API (port 5000)"
echo ""

# Start services
echo "Building and starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check health
echo ""
echo "Checking service health..."

# Check backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "Backend API: http://localhost:5000"
else
    echo "Backend API: Still starting (http://localhost:5000)"
fi

# Check MQTT
if docker exec childguard-mqtt mosquitto_sub -h localhost -t '$SYS/#' -C 1 > /dev/null 2>&1; then
    echo "MQTT Broker: localhost:1883"
else
    echo "MQTT Broker: Still starting (localhost:1883)"
fi

# Check PostgreSQL
if docker exec childguard-db pg_isready -U childguard > /dev/null 2>&1; then
    echo "PostgreSQL: localhost:5432"
else
    echo "PostgreSQL: Still starting (localhost:5432)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   🎉 BACKEND READY! 🎉                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Service Endpoints:"
echo "   • API Root:     http://localhost:5000"
echo "   • Health Check: http://localhost:5000/health"
echo "   • API Base:     http://localhost:5000/api"
echo "   • MQTT Broker:  localhost:1883"
echo "   • Database:     localhost:5432 (user: childguard)"
echo ""

echo "Default Credentials:"
echo "   • Database: childguard / childguard_dev_password"
echo "   • Admin User: admin / admin123 (created on first run)"
echo ""

echo "Next Steps:"
echo "   1. Create a new user or login with admin credentials"
echo "   2. Register a device (wristband)"
echo "   3. Connect the frontend to http://localhost:5000"
echo "   4. Run device simulator or connect real wristband"
echo ""

echo "Documentation:"
echo "   • Full API Docs: cat README.md"
echo "   • Implementation: cat BACKEND_COMPLETE.md"
echo "   • Configuration: cat .env"
echo ""

echo "Useful Commands:"
echo "   • View logs:     docker-compose logs -f backend"
echo "   • Stop services: docker-compose down"
echo "   • Restart:       docker-compose restart"
echo "   • Database CLI:  docker exec -it childguard-db psql -U childguard -d childguard"
echo "   • MQTT test:     docker exec childguard-mqtt mosquitto_sub -h localhost -t 'childguard/#'"
echo ""

echo "Test the Backend:"
echo "   1. Register user:"
echo "      curl -X POST http://localhost:5000/api/register \\\\"
echo "        -H 'Content-Type: application/json' \\\\"
echo "        -d '{\"username\":\"test\",\"email\":\"test@test.com\",\"password\":\"pass123\",\"phone\":\"+249123456789\",\"role\":\"guardian\"}'"
echo ""
echo "   2. Login:"
echo "      curl -X POST http://localhost:5000/api/login \\\\"
echo "        -H 'Content-Type: application/json' \\\\"
echo "        -d '{\"username\":\"test\",\"password\":\"pass123\"}'"
echo ""

echo "To see full documentation, run:"
echo "   less README.md"
echo ""
