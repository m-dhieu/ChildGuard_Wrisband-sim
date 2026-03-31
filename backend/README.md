# ChildGuard Backend - Setup & API Documentation

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Running Locally](#running-locally)
7. [Docker Deployment](#docker-deployment)
8. [Device Integration](#device-integration)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL (production) or SQLite (development)
- MQTT Broker (Mosquitto)
- Node.js 14+ (for frontend)

### 5-Minute Setup

```bash
# 1. Clone repository
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment file
cp .env.example .env

# 4. Start MQTT broker
docker run -d -p 1883:1883 eclipse-mosquitto

# 5. Run backend
python app.py
```

Backend will start at `http://localhost:5000`

---

## Project Structure

```
backend/
├── app.py                # main Flask app entry point
├── config.py             # conf. (dev/prod/test)
├── models.py             # SQLAlchemy db models
├── routes.py             # REST API endpoints (20+ routes)
├── mqtt_handler.py       # MQTT device comms
├── requirements.txt      # Python dependencies
├── .env                  # env. variables (local)
├── .env.example          # env. template
├── Dockerfile            # Docker container conf.
├── docker-compose.yml    # Multi-container setup
├── mosquitto.conf        # MQTT broker conf.
└── logs/                 # Application logs
    └── childguard.log
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```ini
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=sqlite:///childguard.db

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Configuration Classes (config.py)

```python
# Development (SQLite, Debug=On, 30-day JWT)
FLASK_ENV=development

# Production (PostgreSQL, Debug=Off, Secure secrets)
FLASK_ENV=production

# Testing (In-memory database)
FLASK_ENV=testing
```

---

## API Endpoints

### Authentication (3 endpoints)

#### Register New User
```http
POST /api/register
Content-Type: application/json

{
  "username": "guardian_name",
  "email": "guardian@example.com",
  "password": "secure_password",
  "phone": "+249123456789",
  "role": "guardian",  // or "responder", "admin"
  "language": "en"     // or "ar"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "guardian_name",
    "email": "guardian@example.com",
    "role": "guardian",
    "language": "en"
  }
}
```

#### User Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "guardian_name",
  "password": "secure_password"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Get Current User
```http
GET /api/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "id": 1,
  "username": "guardian_name",
  "email": "guardian@example.com",
  "phone": "+249123456789",
  "role": "guardian",
  "language": "en"
}
```

---

### Device Management (4 endpoints)

#### List All Devices
```http
GET /api/devices
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "device_id": "CHILD_001",
    "boy_name": "Ahmed",
    "boy_age": 7,
    "is_online": true,
    "battery_level": 95,
    "geofence_lat": 15.5007,
    "geofence_lon": 32.5599,
    "geofence_radius": 100,
    "hr_baseline": 80,
    "last_seen": "2024-01-15T10:30:00Z"
  }
]
```

#### Register New Device (Wristband)
```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_id": "CHILD_001",
  "boy_name": "Ahmed",
  "boy_age": 7,
  "geofence_lat": 15.5007,
  "geofence_lon": 32.5599,
  "geofence_radius": 100,
  "hr_baseline": 80
}

Response: 201 Created
{
  "message": "Device created successfully",
  "device": { ... }
}
```

#### Update Device Configuration
```http
PUT /api/devices/CHILD_001
Authorization: Bearer <token>
Content-Type: application/json

{
  "geofence_lat": 15.5010,
  "geofence_lon": 32.5600,
  "geofence_radius": 150,
  "hr_baseline": 85
}

Response: 200 OK
{
  "message": "Device updated successfully",
  "device": { ... }
}
```

#### Get Single Device
```http
GET /api/devices/CHILD_001
Authorization: Bearer <token>

Response: 200 OK
{ ... device details ... }
```

---

### Telemetry Data (2 endpoints)

#### Get Telemetry History
```http
GET /api/telemetry/CHILD_001?hours=24&limit=100
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "timestamp": "2024-01-15T10:30:00Z",
    "lat": 15.5007,
    "lon": 32.5599,
    "hr": 85,
    "spo2": 98,
    "accel_x": 0.1,
    "accel_y": 0.2,
    "accel_z": 9.8,
    "temperature": 37.2,
    "signal_strength": -65
  }
]
```

#### Get Latest Telemetry
```http
GET /api/telemetry/CHILD_001/latest
Authorization: Bearer <token>

Response: 200 OK
{ ... latest telemetry point ... }
```

---

### Alerts (2 endpoints)

#### Get Alerts
```http
GET /api/alerts?severity=critical&acknowledged=false&limit=50
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "device_id": "CHILD_001",
    "alert_type": "hr_spike",     // or motion, geofence, panic, tamper
    "severity": "critical",        // or warning, info
    "lat": 15.5007,
    "lon": 32.5599,
    "hr": 120,
    "accel": 2.5,
    "photo_url": "https://...",
    "is_acknowledged": false,
    "acknowledged_at": null,
    "escalated_to_responders": false,
    "escalated_at": null,
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

#### Acknowledge Alert
```http
POST /api/alerts/1/acknowledge
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Alert acknowledged",
  "alert_id": 1,
  "acknowledged_at": "2024-01-15T10:36:00Z"
}
```

#### Get Single Alert
```http
GET /api/alerts/1
Authorization: Bearer <token>

Response: 200 OK
{ ... alert details ... }
```

---

### Emergency Contacts (3 endpoints)

#### List Emergency Contacts
```http
GET /api/contacts
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "contact_name": "Police",
    "phone": "+249187",
    "email": "police@example.com",
    "contact_type": "police",
    "is_active": true
  }
]
```

#### Add Emergency Contact
```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "contact_name": "Father",
  "phone": "+249912345678",
  "email": "father@example.com",
  "contact_type": "guardian"
}

Response: 201 Created
{
  "message": "Contact added successfully",
  "id": 2
}
```

#### Delete Emergency Contact
```http
DELETE /api/contacts/1
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Contact deleted"
}
```

---

### Admin Routes (3 endpoints)

#### Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_users": 15,
  "total_devices": 8,
  "total_alerts": 42,
  "critical_alerts": 3,
  "unacknowledged_alerts": 2,
  "online_devices": 7,
  "total_telemetry_records": 10234
}
```

#### Get All Devices Status
```http
GET /api/admin/devices/status
Authorization: Bearer <admin_token>

Response: 200 OK
[
  {
    "device_id": "CHILD_001",
    "boy_name": "Ahmed",
    "is_online": true,
    "battery_level": 95,
    "last_seen": "2024-01-15T10:35:00Z",
    "guardian": "username"
  }
]
```

#### Purge Old Telemetry
```http
POST /api/admin/telemetry/purge
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "message": "Telemetry purged successfully",
  "records_deleted": 5000
}
```

---

## WebSocket Events

### Real-time Updates (Socket.io)

#### Connection
```javascript
// Client connects
socket.on('connection_response', (data) => {
  console.log(data); // { data: "Connected to ChildGuard backend" }
});
```

#### Device Telemetry Update
```javascript
// Broadcast when new telemetry is received from device
socket.on('telemetry_update', (data) => {
  // {
  //   device_id: "CHILD_001",
  //   timestamp: "2024-01-15T10:30:00Z",
  //   lat: 15.5007,
  //   lon: 32.5599,
  //   hr: 85,
  //   spo2: 98,
  //   accel: 0.3,
  //   temperature: 37.2,
  //   battery_level: 95
  // }
});
```

#### Emergency Alert
```javascript
// Broadcast when alert is triggered
socket.on('emergency_alert', (data) => {
  // {
  //   alert_id: 1,
  //   device_id: "CHILD_001",
  //   alert_type: "hr_spike",
  //   severity: "critical",
  //   lat: 15.5007,
  //   lon: 32.5599,
  //   hr: 120,
  //   accel: 2.5,
  //   photo_url: "https://...",
  //   created_at: "2024-01-15T10:35:00Z"
  // }
});
```

#### Alert Escalated
```javascript
// Broadcast when alert escalates (5 min unacknowledged)
socket.on('alert_escalated', (data) => {
  // {
  //   alert_id: 1,
  //   escalated_at: "2024-01-15T10:40:00Z",
  //   message: "Alert escalated to responders"
  // }
});
```

#### Device Status Update
```javascript
// Broadcast when device status changes
socket.on('device_status', (data) => {
  // {
  //   device_id: "CHILD_001",
  //   is_online: true,
  //   battery_level: 85,
  //   last_seen: "2024-01-15T10:35:00Z"
  // }
});
```

#### Subscribe to Device
```javascript
// Request specific device updates
socket.emit('subscribe_device', { device_id: 'CHILD_001' });

socket.on('subscription_confirmation', (data) => {
  // { device_id: 'CHILD_001', status: 'subscribed' }
});
```

---

## Running Locally

### Development Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start MQTT broker (in separate terminal)
docker run -d -p 1883:1883 eclipse-mosquitto

# 4. Setup environment
cp .env.example .env
# Edit .env if needed (defaults should work for dev)

# 5. Run Flask development server
python app.py
```

Server runs at `http://localhost:5000`

### Using Flask CLI

```bash
# Create database tables
flask shell
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()

# Add test data
>>> from models import User, Device
>>> admin = User(username='admin', email='admin@test.com', role='admin', phone='+249123456789')
>>> admin.set_password('admin123')
>>> db.session.add(admin)
>>> db.session.commit()
```

### Testing the API

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"pass123","phone":"+249123456789","role":"guardian"}'

# 2. Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass123"}'

# 3. Get current user (use token from login)
curl -X GET http://localhost:5000/api/me \
  -H "Authorization: Bearer eyJhbGciOi..."
```

---

## Docker Deployment

### Docker Compose (Full Stack)

```bash
# 1. Build and start all services
docker-compose up -d

# 2. Verify services
docker-compose ps

# 3. View logs
docker-compose logs -f backend

# 4. Stop services
docker-compose down

# 5. Rebuild after code changes
docker-compose up -d --build
```

### Services Started

- **Backend** (Flask): `http://localhost:5000`
- **MQTT Broker**: `localhost:1883`
- **PostgreSQL**: `localhost:5432`
- **Health Check**: `http://localhost:5000/health`

### Production Deployment

```bash
# 1. Set production environment variables
export FLASK_ENV=production
export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
export JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')

# 2. Update .env for production
DATABASE_URL=postgresql://user:password@prod-db:5432/childguard
CORS_ORIGINS=https://your-domain.com

# 3. Deploy with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Device Integration

### MQTT Topics

Devices publish to these MQTT topics:

```
childguard/{device_id}/telemetry   - GPS, HR, motion data
childguard/{device_id}/alert       - Emergency alerts
childguard/{device_id}/status      - Battery, connection status
```

### Telemetry Message Format

```json
{
  "device_id": "CHILD_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "gps": {
    "lat": 15.5007,
    "lon": 32.5599
  },
  "biometrics": {
    "hr": 85,
    "spo2": 98,
    "temperature": 37.2
  },
  "motion": {
    "accel_x": 0.1,
    "accel_y": 0.2,
    "accel_z": 9.8
  },
  "signal": {
    "strength": -65,
    "battery": 95
  }
}
```

### Alert Message Format

```json
{
  "device_id": "CHILD_001",
  "alert_type": "panic_button",
  "severity": "critical",
  "timestamp": "2024-01-15T10:35:00Z",
  "location": {
    "lat": 15.5007,
    "lon": 32.5599
  },
  "biometrics": {
    "hr": 120,
    "spo2": 95
  },
  "evidence": {
    "photo_url": "s3://bucket/photo.jpg"
  }
}
```

---

## Troubleshooting

### Issue: Database Connection Error

```
Error: (psycopg2.OperationalError) could not connect to server
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check DATABASE_URL in .env
# For SQLite: sqlite:///childguard.db
# For PostgreSQL: postgresql://user:password@localhost:5432/childguard
```

### Issue: MQTT Connection Failed

```
Error: Connection refused on 1883
```

**Solution:**
```bash
# Start MQTT broker
docker run -d -p 1883:1883 eclipse-mosquitto

# Or check if Mosquitto container is running
docker ps | grep mosquitto
```

### Issue: JWT Token Invalid

```
Error: 401 Unauthorized
```

**Solution:**
```bash
# Re-login to get new token
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Use the returned access_token in Authorization header
```

### Issue: CORS Errors

```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
```bash
# Check CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Restart backend
docker-compose restart backend
```

### Issue: WebSocket Connection Failed

```
Error: WebSocket is closed before the connection is established
```

**Solution:**
```bash
# Ensure backend is running
curl http://localhost:5000/health

# Check browser console for detailed error
# Verify Socket.io version compatibility (frontend 4.7.5 = backend 5.3.4)
```

---

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Paho MQTT Client](https://github.com/eclipse/paho.mqtt.python)
- [JWT Authentication](https://flask-jwt-extended.readthedocs.io/)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `docker-compose logs backend`
3. Check database: `sqlite3 childguard.db` or `psql -U childguard -d childguard`
4. Test MQTT: `mosquitto_sub -h localhost -t 'childguard/#'`

---

**Backend Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Status:** Production Ready 
