#!/bin/bash

# Quick Start Script
# Usage: ./quickstart.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="../backend"
SIMULATOR_DIR="."
API_URL="http://localhost:5000"
MQTT_BROKER="localhost"
MQTT_PORT="1883"

# Parse arguments
DEVICE_ID=${1:-"CHILD_001"}
BOY_NAME=${2:-"Ahmed"}
INTERVAL=${3:-"2"}
DURATION=${4:-""}

# Functions
print_header() {
    echo -e "\n${BLUE}_____________________________${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}___________________________${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker installed"
    else
        print_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python $PYTHON_VERSION installed"
    else
        print_error "Python 3 not found. Please install Python 3.8+"
        exit 1
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        print_success "pip3 installed"
    else
        print_error "pip3 not found. Please install pip3."
        exit 1
    fi
    
    # Check mosquitto_sub (optional)
    if command -v mosquitto_sub &> /dev/null; then
        print_success "mosquitto-clients installed (optional)"
    else
        print_info "mosquitto-clients not found (optional for monitoring)"
    fi
}

start_backend() {
    print_header "Starting Backend Services"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $BACKEND_DIR"
        exit 1
    fi
    
    print_info "Starting containers with docker-compose..."
    docker-compose up -d
    
    print_info "Waiting for services to start (10 seconds)..."
    sleep 10
    
    # Check if backend is responding
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$API_URL/health" > /dev/null 2>&1; then
            print_success "Backend is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            print_info "Waiting for backend... ($attempt/$max_attempts)"
            sleep 2
        else
            print_error "Backend failed to start after ${max_attempts}0 seconds"
            docker-compose logs backend | tail -20
            exit 1
        fi
    done
    
    # Show container status
    echo ""
    docker-compose ps
    
    cd - > /dev/null
}

install_simulator_deps() {
    print_header "Installing Simulator Dependencies"
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found"
        exit 1
    fi
    
    print_info "Installing Python packages..."
    python3 -m pip install -q -r requirements.txt
    print_success "Dependencies installed"
}

register_user() {
    print_header "Registering Guardian User"
    
    print_info "Registering user 'guardian'..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "guardian",
            "email": "guardian@childguard.local",
            "password": "password123",
            "phone": "+249123456789",
            "role": "guardian"
        }')
    
    if echo "$RESPONSE" | grep -q "successfully\|already"; then
        print_success "User registered or already exists"
    else
        print_error "Failed to register user"
        echo "$RESPONSE"
        return 1
    fi
}

get_auth_token() {
    print_header "Getting Authorization Token"
    
    print_info "Logging in..."
    
    TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "guardian",
            "password": "password123"
        }')
    
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        print_error "Failed to get authentication token"
        echo "$TOKEN_RESPONSE"
        return 1
    fi
    
    print_success "Got authentication token"
    export AUTH_TOKEN="$TOKEN"
}

register_device() {
    print_header "Registering Device"
    
    if [ -z "$AUTH_TOKEN" ]; then
        print_error "Authentication token not available"
        return 1
    fi
    
    print_info "Registering device: $DEVICE_ID ($BOY_NAME)..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/devices" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"device_id\": \"$DEVICE_ID\",
            \"boy_name\": \"$BOY_NAME\",
            \"boy_age\": 7,
            \"geofence_lat\": 15.5007,
            \"geofence_lon\": 32.5599,
            \"geofence_radius\": 1000,
            \"hr_baseline\": 80
        }")
    
    if echo "$RESPONSE" | grep -q "successfully\|already"; then
        print_success "Device registered"
    else
        print_error "Failed to register device"
        echo "$RESPONSE"
        return 1
    fi
}

start_simulator() {
    print_header "Starting Device Simulator"
    
    print_info "Device ID: $DEVICE_ID"
    print_info "Boy Name: $BOY_NAME"
    print_info "Update Interval: ${INTERVAL}s"
    
    if [ -n "$DURATION" ]; then
        print_info "Duration: ${DURATION}s"
        print_info ""
        python3 simulator.py \
            --device-id "$DEVICE_ID" \
            --name "$BOY_NAME" \
            --broker "$MQTT_BROKER" \
            --port "$MQTT_PORT" \
            --interval "$INTERVAL" \
            --duration "$DURATION"
    else
        print_info "Duration: Unlimited (Ctrl+C to stop)"
        print_info ""
        python3 simulator.py \
            --device-id "$DEVICE_ID" \
            --name "$BOY_NAME" \
            --broker "$MQTT_BROKER" \
            --port "$MQTT_PORT" \
            --interval "$INTERVAL"
    fi
}

stop_backend() {
    print_header "Stopping Backend Services"
    
    cd "$BACKEND_DIR"
    print_info "Stopping Docker containers..."
    docker-compose down
    print_success "Backend stopped"
    cd - > /dev/null
}

show_help() {
    cat << EOF
${BLUE}ChildGuard Device Simulator - Quick Start${NC}

Usage: $0 [DEVICE_ID] [BOY_NAME] [INTERVAL] [DURATION]

Arguments:
  DEVICE_ID   Device identifier (default: CHILD_001)
  BOY_NAME    Boy's name (default: Ahmed)
  INTERVAL    Update interval in seconds (default: 2)
  DURATION    Run duration in seconds (default: unlimited)

Examples:
  # Start with defaults
  $0

  # Custom device
  $0 CHILD_002 Mohammed 2

  # Run for 5 minutes
  $0 CHILD_001 Ahmed 2 300

  # High frequency updates for 10 minutes
  $0 CHILD_001 Ahmed 1 600

Commands:
  start       Start full stack (backend + simulator)
  stop        Stop backend services
  monitor     Monitor MQTT messages
  status      Check service status
  help        Show this help message

Environment:
  API_URL           Backend API URL (default: http://localhost:5000)
  MQTT_BROKER       MQTT broker host (default: localhost)
  MQTT_PORT         MQTT broker port (default: 1883)

${YELLOW}Quick Start:${NC}
  1. $0 start              # Start backend and setup
  2. $0                    # Run simulator with defaults
  3. $0 stop               # Stop backend

${YELLOW}Testing:${NC}
  # Terminal 1: Backend
  $0 start

  # Terminal 2: Simulator
  $0

  # Terminal 3: Monitor (requires mosquitto-clients)
  $0 monitor

${YELLOW}Reference:${NC}
  Simulator README:     device_simulator/README.md
  Integration Guide:    device_simulator/INTEGRATION_GUIDE.md
  Test Scenarios:       device_simulator/TEST_SCENARIOS.md

EOF
}

show_status() {
    print_header "Service Status"
    
    # Check Docker containers
    print_info "Docker Containers:"
    docker-compose -f "$BACKEND_DIR/docker-compose.yml" ps 2>/dev/null || echo "  Not running"
    
    # Check API
    echo ""
    print_info "Backend API:"
    if curl -s "$API_URL/health" > /dev/null 2>&1; then
        print_success "Responding on $API_URL"
    else
        print_error "Not responding on $API_URL"
    fi
    
    # Check MQTT
    echo ""
    print_info "MQTT Broker:"
    if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$MQTT_BROKER/$MQTT_PORT" 2>/dev/null; then
        print_success "Responding on $MQTT_BROKER:$MQTT_PORT"
    else
        print_error "Not responding on $MQTT_BROKER:$MQTT_PORT"
    fi
}

monitor_mqtt() {
    print_header "Monitoring MQTT Messages"
    
    if ! command -v mosquitto_sub &> /dev/null; then
        print_error "mosquitto-clients not installed"
        print_info "Install with: apt-get install mosquitto-clients (Ubuntu/Debian)"
        print_info "             brew install mosquitto (macOS)"
        return 1
    fi
    
    print_info "Subscribing to: childguard/#"
    print_info "Press Ctrl+C to stop"
    echo ""
    
    mosquitto_sub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "childguard/#" -v
}

# Main execution
main() {
    case "${1:-}" in
        start)
            check_dependencies
            start_backend
            install_simulator_deps
            register_user
            get_auth_token
            register_device
            print_header "Setup Complete!"
            print_info "Run simulator with: $0"
            ;;
        stop)
            stop_backend
            ;;
        monitor)
            monitor_mqtt
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            # Run simulator
            check_dependencies
            install_simulator_deps
            start_simulator
            ;;
    esac
}

# Trap Ctrl+C
trap 'echo ""; print_info "Interrupted"; exit 0' INT TERM

# Run main
main "$@"
