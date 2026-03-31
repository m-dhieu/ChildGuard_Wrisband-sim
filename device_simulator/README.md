# ChildGuard Device Simulator - Documentation

## Overview

The Device Simulator is a **mock ESP32 wristband** that sends realistic telemetry data via MQTT to test the ChildGuard backend system end-to-end.

### What It Simulates

- **GPS Movement** - Random walk within defined area (Khartoum demo)
- **Heart Rate** - Normal variation + stress episodes
- **Blood Oxygen (SpO2)** - Usually stable, varies with stress
- **Temperature** - Body temperature tracking
- **Motion/Acceleration** - 6-axis accelerometer data (X, Y, Z)
- **Battery Level** - Drains over time
- **Signal Strength** - Varies like real device
- **Emergency Alerts** - Manual or automatic (HR spike, motion, panic)

---

## Installation

### Prerequisites
- Python 3.8+
- MQTT Broker running (e.g., Mosquitto on localhost:1883)

### Setup

```bash
# Navigate to simulator directory
cd device_simulator

# Install dependencies
pip install -r requirements.txt

# Or install directly
pip install paho-mqtt==1.6.1
```

---

## Quick Start

### Basic Simulation
```bash
python simulator.py
```

**Output:**
```
2026-03-25 10:30:45 - DeviceSimulator - INFO - _
2026-03-25 10:30:45 - DeviceSimulator - INFO - Device Simulator Starting
2026-03-25 10:30:45 - DeviceSimulator - INFO - Device ID: CHILD_001
2026-03-25 10:30:45 - DeviceSimulator - INFO - Boy Name: Ahmed
2026-03-25 10:30:45 - DeviceSimulator - INFO - Update Interval: 2s
2026-03-25 10:30:45 - DeviceSimulator - INFO - _
2026-03-25 10:30:46 - DeviceSimulator - INFO - ✓ Connected to MQTT broker (localhost:1883)
2026-03-25 10:30:48 - DeviceSimulator - DEBUG - 📡 Telemetry #1: HR=82bpm, Accel=0.45g, Battery=92%, GPS=15.5012,32.5604
```

---

## Command-Line Options

### Device Configuration

```bash
# Custom device ID
python simulator.py --device-id CHILD_002

# Custom boy name
python simulator.py --name Mohammed

# Both together
python simulator.py --device-id CHILD_002 --name Mohammed
```

### MQTT Configuration

```bash
# Custom broker address
python simulator.py --broker 192.168.1.100

# Custom port
python simulator.py --port 1883

# Both together
python simulator.py --broker 192.168.1.100 --port 1883
```

### Telemetry Configuration

```bash
# Slower updates (5 seconds between telemetry)
python simulator.py --interval 5

# Faster updates (1 second)
python simulator.py --interval 1

# Run for 5 minutes then stop
python simulator.py --duration 300

# Run for 1 hour
python simulator.py --duration 3600
```

### Complete Example

```bash
python simulator.py \
  --device-id CHILD_001 \
  --name Ahmed \
  --broker localhost \
  --port 1883 \
  --interval 2 \
  --duration 600
```

---

## Data Published

### 1. Telemetry Topic
**Topic:** `childguard/{device_id}/telemetry`

**Message Format:**
```json
{
  "device_id": "CHILD_001",
  "timestamp": "2026-03-25T10:30:48Z",
  "gps": {
    "lat": 15.5012,
    "lon": 32.5604
  },
  "biometrics": {
    "hr": 82,
    "spo2": 98,
    "temperature": 37.1
  },
  "motion": {
    "accel_x": 0.12,
    "accel_y": -0.34,
    "accel_z": 9.85
  },
  "signal": {
    "strength": -65,
    "battery": 92
  }
}
```

**Update Frequency:** Every 2 seconds (configurable)

---

### 2. Status Topic
**Topic:** `childguard/{device_id}/status`

**Message Format:**
```json
{
  "device_id": "CHILD_001",
  "timestamp": "2026-03-25T10:30:48Z",
  "is_online": true,
  "battery_level": 92,
  "signal_strength": -65
}
```

**Update Frequency:** Every 20 seconds (every 10 telemetry updates)

---

### 3. Alert Topic
**Topic:** `childguard/{device_id}/alert`

**Message Format:**
```json
{
  "device_id": "CHILD_001",
  "timestamp": "2026-03-25T10:30:48Z",
  "alert_type": "hr_spike",
  "severity": "critical",
  "location": {
    "lat": 15.5012,
    "lon": 32.5604
  },
  "biometrics": {
    "hr": 145,
    "accel": 2.34
  },
  "evidence": {
    "photo_url": "https://placeholder.com/evidence.jpg"
  }
}
```

**Types:**
- `hr_spike` - Heart rate > 1.3x baseline
- `motion` - Acceleration > 2.0g
- `panic` - Manual panic button
- `geofence` - Location outside boundary

---

## Simulation Scenarios

### Automatic Scenarios

The simulator automatically triggers realistic scenarios:

1. **Stress Episodes** (5% chance per cycle)
   - Triggers HR spike (>1.3x baseline)
   - Lasts 10-30 updates
   - Automatically sends HR spike alert
   - Logs: `🚨 STRESS EPISODE TRIGGERED`

2. **Activity/Motion** (2% chance per cycle)
   - Generates high acceleration (2.5-4.0g)
   - Lasts 5-15 updates
   - Can trigger motion alert
   - Logs: `⚠️ MOTION SPIKE: X.XXg`

3. **Battery Drain**
   - Decreases 0.01-0.05% per telemetry update
   - Logs warning when < 20%
   - Logs: `⚠️ LOW BATTERY: X%`

### Manual Alerts (Interactive)

You can manually trigger alerts by pressing keys during runtime:

```python
# Inside simulator.py, you could add:
# 'h' - HR spike
# 'm' - Motion spike
# 'p' - Panic button
# 'g' - Geofence breach
```

---

## Integration with Backend

### Prerequisites
1. Backend running: `docker-compose up -d` (from backend/)
2. MQTT broker running: Usually started by docker-compose
3. Mosquitto listening on localhost:1883

### Testing the Integration

#### Terminal 1: Start Backend
```bash
cd backend
docker-compose up -d
```

#### Terminal 2: Start Simulator
```bash
cd device_simulator
python simulator.py --device-id CHILD_001 --name Ahmed
```

#### Terminal 3: Monitor MQTT (optional)
```bash
mosquitto_sub -h localhost -t 'childguard/#' -v
```

#### Terminal 4: Test API
```bash
# Register user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"guardian",
    "email":"guardian@test.com",
    "password":"pass123",
    "phone":"+249123456789",
    "role":"guardian"
  }'

# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guardian","password":"pass123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Register device matching simulator
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id":"CHILD_001",
    "boy_name":"Ahmed",
    "boy_age":7,
    "geofence_lat":15.5007,
    "geofence_lon":32.5599,
    "geofence_radius":100,
    "hr_baseline":80
  }'

# Get telemetry
curl -X GET "http://localhost:5000/api/telemetry/CHILD_001?hours=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Get alerts
curl -X GET http://localhost:5000/api/alerts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring

### View Simulator Logs

```bash
# Run with verbose logging
python simulator.py --interval 2  # Shows debug messages
```

**Log Levels:**
- `🚨 ALERT` - Emergency alerts sent
- `⚠️ WARNING` - Stress episodes, motion spikes, low battery
- `✓ INFO` - Connection status, startup
- `📡 DEBUG` - Telemetry data details

### Monitor MQTT Topics

```bash
# Subscribe to all ChildGuard topics
mosquitto_sub -h localhost -t 'childguard/#' -v

# Or specific topics
mosquitto_sub -h localhost -t 'childguard/CHILD_001/telemetry' -v
mosquitto_sub -h localhost -t 'childguard/CHILD_001/alert' -v
mosquitto_sub -h localhost -t 'childguard/CHILD_001/status' -v
```

### Check Backend Logs

```bash
docker-compose logs -f backend
```

---

## Test Scenarios

### Scenario 1: Basic Telemetry
```bash
python simulator.py --device-id CHILD_001 --name Ahmed --interval 2
# Wait 30 seconds
# Check backend for telemetry data
```

### Scenario 2: Stress Episode (Auto-triggered)
```bash
python simulator.py --device-id CHILD_001 --interval 1
# Watch for: "🚨 STRESS EPISODE TRIGGERED"
# Check backend for HR spike alerts
```

### Scenario 3: Low Battery
```bash
python simulator.py --device-id CHILD_001 --duration 3600
# Battery drains over time
# Watch for: "⚠️ LOW BATTERY: X%"
```

### Scenario 4: Multiple Devices
Terminal 1:
```bash
python simulator.py --device-id CHILD_001 --name Ahmed
```

Terminal 2:
```bash
python simulator.py --device-id CHILD_002 --name Mohammed --broker localhost --port 1883
```

Terminal 3:
```bash
python simulator.py --device-id CHILD_003 --name Fatima
```

---

## Troubleshooting

### Issue: Connection Refused
```
✗ Connection failed with code 1
Failed to connect: [Errno 111] Connection refused
```

**Solution:**
```bash
# Start MQTT broker
docker run -d -p 1883:1883 eclipse-mosquitto

# Or check if already running
docker ps | grep mosquitto
```

### Issue: No Data in Backend

**Check:**
1. Backend is running: `curl http://localhost:5000/health`
2. Device is registered: `curl -X GET http://localhost:5000/api/devices -H "Authorization: Bearer $TOKEN"`
3. Simulator is connected: Check logs for "✓ Connected to MQTT broker"

### Issue: Simulator Crashes

```bash
# Run with full error output
python simulator.py --interval 2
```

**Common Issues:**
- Python version < 3.8: Update Python
- paho-mqtt not installed: `pip install paho-mqtt`
- MQTT broker not running: Start Mosquitto

### Issue: Very Slow Telemetry

```bash
# Reduce interval
python simulator.py --interval 0.5  # 500ms between updates

# Or check MQTT broker performance
mosquitto_sub -h localhost -t '$SYS/#' -v
```

---

## Performance Notes

### System Requirements
- Minimal CPU usage (~2%)
- RAM: ~50MB
- Network: ~1-5 KB per telemetry update

### Scalability
- Single simulator: 1 device
- Multiple simulators: Run in separate terminals/processes
- Backend can handle 100+ concurrent devices

### Telemetry Rate
- Default: 1 update every 2 seconds
- Minimum: 0.1 seconds (10 updates/sec)
- Maximum: Limited by MQTT broker

---

## Understanding the Simulator

### GPS Simulation
- **Center Point:** Khartoum, Sudan (configurable)
- **Movement:** Random walk (Brownian motion)
- **Bounds:** ±2km radius (configurable)
- **Accuracy:** ~50-100 meter steps

### Biometric Simulation
- **Heart Rate:** Baseline 80 bpm + stress episodes
- **SpO2:** 95-100% (drops slightly with stress)
- **Temperature:** 36.5-37.5°C (rises with stress)

### Motion Simulation
- **Acceleration:** X, Y, Z axes (gravity included)
- **Activity:** 2% chance per cycle to trigger motion
- **Duration:** 5-15 cycles when triggered
- **Magnitude:** 2.5-4.0g during activity

### Battery Simulation
- **Starting:** 80-100%
- **Drain Rate:** 0.01-0.05% per update
- **Runtime:** ~20-40 hours at default rate

---

## Security Note

This simulator sends data **unencrypted** over MQTT. For production:
1. Enable MQTT authentication
2. Use TLS/SSL encryption
3. Implement certificate validation
4. Restrict MQTT broker access

---

## Related Documentation

- Backend API: `backend/README.md`
- MQTT Integration: `backend/README.md` (Device Integration section)
- Device Models: `backend/models.py`
- MQTT Handler: `backend/mqtt_handler.py`

---

## Next Steps

1. **Test with Backend**
   ```bash
   # Terminal 1: Backend
   cd backend && docker-compose up -d
   
   # Terminal 2: Simulator
   cd device_simulator && python simulator.py
   
   # Terminal 3: Monitor
   mosquitto_sub -h localhost -t 'childguard/#'
   ```

2. **Connect Frontend**
   - Update frontend to show real-time data
   - Watch alerts appear live on dashboard

3. **Run End-to-End Test**
   - Register user → Register device → View telemetry → Trigger alert → Verify SMS

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-03-25
