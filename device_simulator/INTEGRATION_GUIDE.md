# ChildGuard Device Simulator - Integration Testing Guide

## Purpose

This guide walks you through testing the **complete ChildGuard system** end-to-end:
1. Backend server
2. MQTT broker
3. Device simulator
4. Frontend dashboard
5. Real-time alerts

---

## Checklist Before Starting

- [ ] Docker installed and running
- [ ] Python 3.8+ installed
- [ ] Terminal window(s) ready
- [ ] Backend directory available: `backend/`
- [ ] Device simulator directory available: `device_simulator/`
- [ ] Frontend directory available: `frontend/`

---

## Phase 1: Start the Backend Stack

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Start Docker Containers
```bash
docker-compose up -d
```

**Expected Output:**
```
Creating network "backend_default" with the default driver
Creating backend_db_1          ... done
Creating backend_mosquitto_1   ... done
Creating backend_backend_1     ... done
```

### Step 3: Verify Services
```bash
# Check Docker containers
docker-compose ps
```

**Expected Output:**
```
NAME                 STATUS              PORTS
backend_db_1         Up 2 minutes        5432/tcp
backend_mosquitto_1  Up 2 minutes        0.0.0.0:1883->1883/tcp
backend_backend_1    Up 2 minutes        0.0.0.0:5000->5000/tcp
```

### Step 4: Check Backend Health
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T10:30:45Z"
}
```

---

## Phase 2: Start the Device Simulator

### Step 1: Navigate to Simulator
```bash
cd device_simulator
```

### Step 2: Verify Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Start Simulator (Device 1)
```bash
python simulator.py --device-id CHILD_001 --name Ahmed --interval 2
```

**Expected Output:**
```
2026-03-25 10:30:45 - DeviceSimulator - INFO - Device Simulator Starting
2026-03-25 10:30:45 - DeviceSimulator - INFO - Device ID: CHILD_001
2026-03-25 10:30:45 - DeviceSimulator - INFO - ✓ Connected to MQTT broker (localhost:1883)
2026-03-25 10:30:48 - DeviceSimulator - DEBUG - 📡 Telemetry #1: HR=82bpm, Accel=0.45g, Battery=92%
```

---

## Phase 3: Register User and Device

### Step 1: Create User Account
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guardian",
    "email": "guardian@test.com",
    "password": "password123",
    "phone": "+249123456789",
    "role": "guardian"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user_id": "u_xyz123"
}
```

### Step 2: Login and Get Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guardian","password":"password123"}' \
  | jq -r '.access_token')

echo $TOKEN  # Verify token is set
```

**Expected Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Register Device (CHILD_001)
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "CHILD_001",
    "boy_name": "Ahmed",
    "boy_age": 7,
    "geofence_lat": 15.5007,
    "geofence_lon": 32.5599,
    "geofence_radius": 100,
    "hr_baseline": 80
  }'
```

**Expected Response:**
```json
{
  "message": "Device registered successfully",
  "device": {
    "device_id": "CHILD_001",
    "boy_name": "Ahmed",
    "hr_baseline": 80
  }
}
```

### Step 4: Verify Device is Registered
```bash
curl -X GET http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected Response:**
```json
{
  "devices": [
    {
      "device_id": "CHILD_001",
      "boy_name": "Ahmed",
      "is_online": true,
      "last_update": "2026-03-25T10:30:48Z"
    }
  ]
}
```

---

## Phase 4: Monitor Telemetry Data

### Step 1: Get Telemetry (API)
```bash
curl -X GET "http://localhost:5000/api/telemetry/CHILD_001?hours=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected Response:**
```json
{
  "telemetry": [
    {
      "id": "tel_123",
      "device_id": "CHILD_001",
      "timestamp": "2026-03-25T10:30:48Z",
      "location": {
        "latitude": 15.5012,
        "longitude": 32.5604
      },
      "biometrics": {
        "heart_rate": 82,
        "blood_oxygen": 98,
        "temperature": 37.1
      },
      "motion": {
        "acceleration": 0.45
      },
      "signal": {
        "battery_level": 92,
        "signal_strength": -65
      }
    }
  ]
}
```

### Step 2: Monitor MQTT Directly (Optional)
In a new terminal:
```bash
# Monitor all ChildGuard topics
mosquitto_sub -h localhost -t 'childguard/#' -v

# Or just telemetry
mosquitto_sub -h localhost -t 'childguard/CHILD_001/telemetry' -v
```

**Expected Output:**
```
childguard/CHILD_001/telemetry {"device_id":"CHILD_001","timestamp":"2026-03-25T10:30:48Z",...}
childguard/CHILD_001/telemetry {"device_id":"CHILD_001","timestamp":"2026-03-25T10:30:50Z",...}
```

---

## Phase 5: Test Stress Episode (HR Spike)

### Step 1: Watch for Auto-Triggered Stress Episode
Leave simulator running. Within 30 seconds, watch the logs:

**Simulator Output:**
```
🚨STRESS EPISODE TRIGGERED
⚠️ HR SPIKE: 145 > 104 (baseline 80 × 1.3)
📡 Publishing HR spike alert to MQTT
```

### Step 2: Check Alert in Backend
```bash
curl -X GET http://localhost:5000/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts[0]'
```

**Expected Response:**
```json
{
  "id": "alert_456",
  "device_id": "CHILD_001",
  "alert_type": "hr_spike",
  "severity": "critical",
  "timestamp": "2026-03-25T10:30:50Z",
  "status": "active",
  "biometrics": {
    "heart_rate": 145
  },
  "location": {
    "latitude": 15.5012,
    "longitude": 32.5604
  }
}
```

### Step 3: Verify Alert Escalation Timer
- Alert created at T=0
- Check status at T=2min: Should still be `active`
- Check status at T=5min+: Should escalate to `escalated` with SMS/email

```bash
# Check alert after 5 minutes
sleep 300
curl -X GET http://localhost:5000/api/alerts/alert_456 \
  -H "Authorization: Bearer $TOKEN" | jq '.alert.status'
```

---

## Phase 6: Test Motion Detection

### Step 1: Watch for Auto-Triggered Motion Spike
Motion triggers with 2% probability per cycle. Watch for:

**Simulator Output:**
```
⚠️ MOTION SPIKE: 2.8g (threshold 2.0g)
📡 Publishing motion alert to MQTT
```

### Step 2: Verify Motion Alert
```bash
curl -X GET http://localhost:5000/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts[] | select(.alert_type == "motion")'
```

---

## Phase 7: Test Battery Low Alert

### Step 1: Run Simulator for Extended Period
```bash
python simulator.py --device-id CHILD_001 --duration 3600  # 1 hour
```

### Step 2: Monitor Battery Drain
```bash
# Check battery every 30 seconds
watch -n 30 "curl -s -X GET http://localhost:5000/api/telemetry/CHILD_001?limit=1 \
  -H 'Authorization: Bearer \$TOKEN' | jq '.telemetry[0].signal.battery_level'"
```

### Step 3: Verify Low Battery Alert
When battery < 20%, check for alert:
```bash
curl -X GET http://localhost:5000/api/alerts \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts[] | select(.alert_type == "low_battery")'
```

---

## Phase 8: Test Multiple Devices

### Step 1: Register Second Device
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "CHILD_002",
    "boy_name": "Mohammed",
    "boy_age": 8,
    "geofence_lat": 15.5007,
    "geofence_lon": 32.5599,
    "geofence_radius": 100,
    "hr_baseline": 75
  }'
```

### Step 2: Start Second Simulator (New Terminal)
```bash
cd device_simulator
python simulator.py --device-id CHILD_002 --name Mohammed --interval 2
```

### Step 3: Get All Telemetry
```bash
curl -X GET "http://localhost:5000/api/telemetry?limit=50" \
  -H "Authorization: Bearer $TOKEN" | jq '.telemetry | length'
```

**Expected:** Multiple entries for both CHILD_001 and CHILD_002

---

## Phase 9: Test Frontend Integration

### Step 1: Open Frontend
```bash
# Navigate to frontend directory
cd frontend

# Open in browser
open index.html  # macOS
# or
firefox index.html  # Linux
# or
start index.html  # Windows
```

### Step 2: Update Backend URL (if needed)
Edit `frontend/js/config.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';
```

### Step 3: Login to Dashboard
- Username: `guardian`
- Password: `password123`

### Step 4: Verify Real-Time Updates
- Should see device(s) listed
- Map should show current GPS location
- Heart rate chart should update every 2 seconds
- Alerts should appear immediately

### Step 5: Test Live Alerts
- Trigger stress episode in simulator
- Watch alert appear on dashboard immediately
- Check alert color and details

---

## Phase 10: End-to-End SMS Test

### Step 1: Configure Twilio (if not already done)
Set environment variables in `backend/.env`:
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBERS=+249123456789
```

### Step 2: Restart Backend
```bash
cd backend
docker-compose restart backend
```

### Step 3: Trigger Alert
```bash
cd device_simulator
python simulator.py --device-id CHILD_001 --interval 1
```

Wait for stress episode or motion spike.

### Step 4: Verify SMS Sent
Check:
1. Backend logs: `docker-compose logs backend | grep -i sms`
2. Phone: Should receive SMS alert
3. Backend database: Alert marked as `escalated`

---

## Test Verification Checklist

Use this checklist to track all test phases:

```
Phase 1: Backend Stack
  [ ] Docker containers running (all 3)
  [ ] Health endpoint responds 200
  [ ] MQTT broker accessible on 1883
  [ ] PostgreSQL initialized

Phase 2: Device Simulator
  [ ] Simulator starts without errors
  [ ] Connects to MQTT broker
  [ ] Sends telemetry every N seconds
  [ ] Shows device info at startup

Phase 3: User & Device Setup
  [ ] User registered successfully
  [ ] Login returns valid JWT token
  [ ] Device registered successfully
  [ ] Device appears in device list
  [ ] Device shows as online

Phase 4: Telemetry
  [ ] Telemetry appears in API
  [ ] Telemetry format is correct
  [ ] Timestamps are accurate
  [ ] MQTT topics show data
  [ ] Battery level visible
  [ ] Heart rate values in expected range

Phase 5: HR Spike Alert
  [ ] Stress episode triggers automatically
  [ ] HR spike recorded
  [ ] Alert created with severity
  [ ] Alert timestamp correct
  [ ] Alert location accurate

Phase 6: Motion Detection
  [ ] Motion spike triggers automatically
  [ ] Acceleration > 2.0g detected
  [ ] Alert created for motion
  [ ] Alert type is "motion"

Phase 7: Battery Alert
  [ ] Battery drains over time
  [ ] Alert triggers when < 20%
  [ ] Battery status accurate

Phase 8: Multiple Devices
  [ ] Second device registers
  [ ] Second simulator runs independently
  [ ] Both devices send telemetry
  [ ] Alerts separate by device

Phase 9: Frontend
  [ ] Frontend loads successfully
  [ ] Login works with credentials
  [ ] Dashboard displays device
  [ ] Map shows location
  [ ] Charts update in real-time
  [ ] Alerts appear immediately

Phase 10: SMS Alerts
  [ ] SMS configuration set
  [ ] Backend logs show SMS sending
  [ ] SMS received on phone
  [ ] Alert escalated after 5 min
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port 5000 already in use
sudo lsof -i :5000
kill -9 <PID>

# 2. Database connection failed
docker-compose logs db

# 3. MQTT not ready
docker-compose logs mosquitto
```

### Simulator Can't Connect
```bash
# Check MQTT broker
docker-compose ps | grep mosquitto

# Test MQTT connection
telnet localhost 1883

# Restart MQTT
docker-compose restart mosquitto
```

### No Telemetry in Backend
```bash
# Check MQTT messages
mosquitto_sub -h localhost -t 'childguard/#'

# Check backend logs
docker-compose logs backend

# Verify device registration
curl http://localhost:5000/api/devices
```

### Frontend Not Updating
```bash
# Check browser console for errors
# Check API connectivity
curl http://localhost:5000/api/health

# Verify WebSocket connection
# Open DevTools → Network → WS
```

---

## Performance Metrics

After running tests, check performance:

```bash
# Backend response time
time curl http://localhost:5000/api/telemetry/CHILD_001

# MQTT message rate
mosquitto_sub -h localhost -t 'childguard/#' | wc -l

# Database query performance
# Check Docker logs for slow queries
docker-compose logs db | grep slow
```

---

## What Each Phase Tests

| Phase | Tests               | Success Criteria                      |
|-------|---------------------|---------------------------------------|
| 1     | Backend Stack       | All services healthy                  |
| 2     | Device Simulator    | Connects to MQTT, publishes telemetry |
| 3 	| User/Device Setup   | API responses correct format	      |
| 4 	| Telemetry Storage   | Data persists in database 	      |
| 5 	| HR Alert            | Alert created & escalated	      |
| 6 	| Motion Alert 	      | Motion detection works 		      |
| 7 	| Battery Alert       | Battery warning triggers	      |
| 8 	| Multi-Device 	      | Independent device operation 	      |
| 9 	| Frontend            | Real-time dashboard updates           |
| 10 	| Notifications       | SMS delivered successfully 	      |

---

## Success Criteria

**All Green = Complete Integration** 

- Backend healthy
- Simulator connected
- Telemetry flowing to database
- Alerts triggered automatically
- Frontend displaying data
- SMS/Email sent on escalation
- Multiple devices work independently
- Real-time updates < 500ms latency

---

## Documentation References

- Backend API: `backend/README.md`
- Simulator Guide: `device_simulator/README.md`
- MQTT Protocol: `backend/mqtt_handler.py`
- Frontend Guide: `frontend/FEATURES.md`

---

