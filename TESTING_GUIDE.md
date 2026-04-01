# ChildGuard Dashboard Testing Guide

## Quick Start: Dummy Data Mode

When you open the dashboard in your browser, the dummy data emitter **automatically starts** and begins sending test telemetry every 2 seconds. This allows you to immediately test:

- Heart rate readings and chart visualization
- Motion/acceleration detection  
- Alert triggering (HR spike or motion detected)
- GPS location updates
- Battery level monitoring

## Browser Console Commands

Open the browser DevTools console (**F12** → **Console** tab) to access these testing commands:

### 1. **Start Dummy Data Emitter**
```javascript
startDummyDataEmitter(2000, 'device1')
```
- **Parameters:** 
  - `intervalMs` (default: 2000) - Milliseconds between telemetry emissions
  - `deviceId` (default: 'device1') - Device identifier
- **Example:** `startDummyDataEmitter(1000, 'wristband-001')` - emit every 1 second

### 2. **Stop Dummy Data Emitter**
```javascript
stopDummyDataEmitter()
```
- Stops all dummy data emissions
- Useful for pausing testing between scenarios

### 3. **Trigger Stress Event (Heart Rate Spike)**
```javascript
triggerDummyStressEvent()
```
- Manually spike heart rate to 1.3x-1.8x baseline (91-126 BPM for baseline 70)
- Duration: 8-12 seconds
- Triggers `isDanger = true` → Dashboard shows **⚠️ WARNING** status
- **Expected behavior:**
  - HR chart shows spike
  - Status indicator turns red/orange
  - Alert is created in alert history
  - Audio/haptic feedback triggered (if supported)

### 4. **Trigger Motion Event (Acceleration Spike)**
```javascript
triggerDummyMotionEvent()
```
- Manually spike acceleration to 2.5g-4.0g (danger zone > 2.0g)
- Duration: 5-8 seconds
- Triggers `isDanger = true` → Same alert flow as stress
- **Expected behavior:**
  - Motion/Acceleration chart shows spike
  - Status turns red
  - Alert created with "Motion Detected" message
  - Map may show updated location (if motion triggered geo-movement)

### 5. **View Simulator State**
```javascript
getDummySimulatorState()
```
- Returns object with current simulator values:
  ```javascript
  {
    hrBaseline: 70,
    currentHR: 72,
    inStressEvent: false,
    gpsLat: 15.5007,
    gpsLon: 32.5599,
    battery: 95,
    updateCount: 47
  }
  ```

### 6. **Disable/Enable Auto-Start**
```javascript
// Disable auto-start on next page reload
localStorage.setItem('childguard-test-mode', 'false')

// Re-enable auto-start on next page reload
localStorage.setItem('childguard-test-mode', 'true')
```

---

## Test Scenarios

### Scenario 1: Verify Heart Rate Display
**Objective:** Ensure HR chart updates with realistic data

1. Open dashboard in browser
2. Look for "Heart Rate (BPM)" label on chart
3. Verify chart shows green line starting at ~70 BPM
4. Open DevTools console and run:
   ```javascript
   triggerDummyStressEvent()
   ```
5. Watch chart spike to 90-120 BPM over 2-3 seconds
6. Verify alert appears in alert history: "Heart rate spike detected!"

**Expected Outcome:** ✅ Chart updates smoothly, alert appears, status indicator changes color

---

### Scenario 2: Verify Motion/Acceleration Display
**Objective:** Ensure motion chart updates with realistic data

1. Dashboard running with dummy data (auto-started)
2. Look for "Acceleration (g)" label on chart (right Y-axis, purple)
3. Verify chart shows acceleration readings 0-1g normally
4. Open DevTools console and run:
   ```javascript
   triggerDummyMotionEvent()
   ```
5. Watch acceleration chart spike to 2.5-4.0g
6. Verify alert appears: "Fall/Impact detected!" or "High acceleration detected!"

**Expected Outcome:** ✅ Acceleration chart updates, alert threshold detected, danger status triggered

---

### Scenario 3: Test Emergency SOS
**Objective:** Verify panic button flow works

1. Look for **RED BUTTON** labeled "SOS" or "🆘 Emergency"
2. Click the button
3. **Expected behavior:**
   - Audio alert plays (if browser has sound)
   - Dialog appears asking for confirmation
   - Location is locked
   - Alert is created with type "EMERGENCY_SOS"
   - Emergency contacts are notified
   - 5-minute escalation countdown starts

**Console verification:**
```javascript
// Check alert in console
socket.emit('acknowledge-alert', { alertId: '...', status: 'acknowledged' })
```

---

### Scenario 4: Test Settings Configuration
**Objective:** Verify settings dialog works

1. Click **⚙️ Settings** button (top toolbar)
2. Dialog appears with form fields:
   - Device Name
   - Alert Sensitivity (Low/Medium/High)
   - Emergency Contacts
   - Geofence Radius
3. Change any setting (e.g., set sensitivity to "High")
4. Click **Save**
5. **Expected behavior:**
   - Settings are saved to localStorage
   - Confirmation toast appears
   - Dashboard refreshes with new settings
   - High sensitivity makes alerts trigger earlier

---

### Scenario 5: Test Photo Evidence
**Objective:** Verify photo capture and display

1. Click **📷 Photo** button in toolbar
2. Dialog appears with camera placeholder
3. Click "Capture" or upload test image
4. Photo appears in modal with:
   - Timestamp
   - Device location (lat/lon)
   - Device battery %
5. Click "Add to Alert" to attach photo to current alert
6. Photo appears in alert history

---

### Scenario 6: Test Alert Acknowledgment
**Objective:** Verify alert escalation and acknowledgment

1. Trigger stress or motion event (see Scenario 1 or 2)
2. Alert appears in alert history with:
   - Time created
   - Alert type (HR spike / motion / etc.)
   - Status: "pending" (yellow)
   - **Acknowledge** button
3. Click **Acknowledge** button
4. **Expected behavior:**
   - Alert status changes to "acknowledged" (green)
   - Escalation timer resets (no notification to emergency contacts)
5. Wait 5+ minutes without acknowledging another alert
   - After 5 minutes: automatic escalation to emergency contacts

---

### Scenario 7: Continuous Stress Test (Endurance)
**Objective:** Verify dashboard stability with sustained data flow

1. Open DevTools → Performance tab
2. In console, run:
   ```javascript
   // Emit every 500ms for 2 minutes continuous stress
   startDummyDataEmitter(500, 'device1')
   ```
3. Watch for:
   - Memory usage (should not spike unbounded)
   - Frame rate (should stay 60fps)
   - CPU usage (should stay < 20%)
4. After 2 minutes, run:
   ```javascript
   stopDummyDataEmitter()
   ```
5. **Expected outcome:** ✅ Dashboard remains responsive, no memory leaks, smooth animations

---

## Real Telemetry Event Structure

The dummy data emitter sends Socket.io events with this structure:

```javascript
// Event: 'telemetry'
{
  deviceId: 'device1',
  gps: {
    latitude: 15.5007,
    longitude: 32.5599,
    accuracy: 10.0
  },
  biometrics: {
    heartRate: 72,
    spo2: 98,
    temperature: 36.5
  },
  motion: {
    accelerationX: 0.1,
    accelerationY: 0.2,
    accelerationZ: 0.3,
    magnitude: 0.37
  },
  battery: {
    level: 95,
    voltage: 4.2
  },
  timestamp: 1699564800000
}
```

### Danger Detection Logic
- **HR Danger:** `heartRate > baseline * 1.3` (default: > 91 BPM)
- **Motion Danger:** `acceleration.magnitude > 2.0g`
- **Either condition** triggers dashboard alert and status change

---

## Troubleshooting

### Problem: Chart not updating
**Solution:**
1. Open DevTools Console
2. Run: `getDummySimulatorState()` - Check if data is being generated
3. Check Network tab → WebSocket → Look for 'telemetry' events
4. If no events: Run `startDummyDataEmitter(2000, 'device1')` again
5. Refresh page and check auto-start logs

### Problem: Alerts not appearing
**Solution:**
1. Check if telemetry events are being received (see above)
2. Verify alert thresholds:
   ```javascript
   // In script.js line ~425, check danger detection
   const isDanger = hr > baseline * 1.3 || accel > 2.0
   ```
3. Check browser console for JavaScript errors (F12 → Console)
4. Try manually triggering: `triggerDummyStressEvent()`

### Problem: Settings not saving
**Solution:**
1. Check browser localStorage is enabled
2. Open DevTools → Application → Local Storage → Check `childguard-*` entries
3. Verify form validation passes (all required fields filled)
4. Try: `localStorage.setItem('test', 'value')` to confirm localStorage works

### Problem: GPS map not updating
**Solution:**
1. Verify Leaflet.js is loaded (check head for `leaflet.js` script)
2. Check DevTools Console for map-related errors
3. Verify GPS coordinates are valid (15.45-15.55°N, 32.5-32.65°E for Khartoum)
4. Try: `getDummySimulatorState()` to see current GPS location

### Problem: Battery level stuck at 100%
**Solution:**
1. Dummy battery decays by 1-2% per telemetry update
2. Run for 50-100 updates to see movement (100-200 seconds)
3. Check: `getDummySimulatorState()` after 60 seconds to verify decline
4. Battery is intentionally slow to decay (more realistic)

---

## Performance Metrics

| Metric                    | Expected | Notes                                                |
|---------------------------|----------|------------------------------------------------------|
| Telemetry send interval   | 2000ms   | Configurable via `startDummyDataEmitter(intervalMs)` |
| Chart update latency 	    | < 100ms  | From Socket.io event to chart visual update          |
| Alert creation latency    | < 200ms  | From danger detection to alert UI                    |
| Memory usage (5min) 	    | < 50MB   | Growth should plateau after chart fill               |
| CPU usage (idle) 	    | < 2%     | When no danger events                                |
| CPU usage (stress/motion) | 5-10%    | During active alert state                            |
| FPS (normal) 		    | 60       | Browser DevTools → Performance                       |
| FPS (stress) 		    | 55+      | Should stay above 55fps even during events           |

---

## Keyboard Shortcuts (When Implemented)

| Key       | Action                    |
|-----------|---------------------------|
| `Shift+D` | Toggle dummy data emitter |
| `Shift+S` | Trigger stress event  	|
| `Shift+M` | Trigger motion event 	|
| `Shift+C` | Clear all alerts 		|

*(Currently requires console commands - keyboard shortcuts can be added to script.js if needed)*

---

## Manual Backend Testing (When Backend is Complete)

### 1. Connect Real Device Simulator
```bash
cd device_simulator
python simulator.py --device-id device1 --backend-url http://localhost:5000
```

### 2. Verify MQTT Flow
```bash
# In another terminal
mosquitto_sub -h localhost -t 'devices/+/telemetry'
```

### 3. Check Database Storage
```bash
# Query telemetry table
sqlite3 childguard.db "SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 10;"
```

---

## Next Steps

After dummy data testing confirms all dashboard features work:
1. Heart rate display working
2. Motion detection working
3. Alert system working
4. Settings persisting
5. SOS button functional
6. Photos displaying

**Then transition to:**
- Backend API testing (REST endpoints)
- MQTT device simulator integration
- Real device testing with physical wristband
- End-to-end alert notification flow
- Emergency contact SMS/push notifications

---

## Support & Debug Info

**Include this info when reporting issues:**
```javascript
// Paste this in console to get diagnostics
{
  simulatorState: getDummySimulatorState(),
  serverConnected: socket?.connected,
  chartData: window.vitalsChart?.data?.labels?.length,
  alerts: document.querySelectorAll('[role="listitem"]').length,
  browserTime: new Date().toISOString()
}
```

Happy Testing! 🚀
