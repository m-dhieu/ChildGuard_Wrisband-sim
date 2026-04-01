// CHILDGUARD DEVICE SIMULATOR - DUMMY DATA GENERATOR
// Simulates ESP32 wristband telemetry for testing dashboard functionality
// without physical hardware

const DeviceSimulator = {
    // Simulation state
    state: {
        device1: {
            active: true,
            gps: { lat: 15.5, lon: 32.5 },
            hr: 72,
            accel: 0.5,
            battery: 85,
            moving: false,
            stress: false
        },
        device2: {
            active: true,
            gps: { lat: 15.51, lon: 32.51 },
            hr: 68,
            accel: 0.3,
            battery: 92,
            moving: false,
            stress: false
        },
        device3: {
            active: true,
            gps: { lat: 15.49, lon: 32.49 },
            hr: 75,
            accel: 0.4,
            battery: 78,
            moving: false,
            stress: false
        }
    },

    // Configuration
    config: {
        updateInterval: 5000, // 5 seconds (real: 30 seconds)
        baselineHR: 70,
        stressThreshold: 1.3, // 30% above baseline
        motionThreshold: 2.0, // 2g acceleration
    },

    // Simulation scenarios
    scenarios: {
        normal: {
            name: 'Normal Activity',
            description: 'Child walking normally',
            duration: 30000,
            hrRange: [65, 85],
            accelRange: [0.2, 0.8],
            gpsMovement: 0.001,
            batteryDrain: 0.1
        },
        running: {
            name: 'Running/Exercise',
            description: 'Child running or playing',
            duration: 20000,
            hrRange: [120, 150],
            accelRange: [1.2, 1.8],
            gpsMovement: 0.005,
            batteryDrain: 0.3
        },
        danger: {
            name: 'Danger Detected',
            description: 'High HR + violent motion (attack simulation)',
            duration: 15000,
            hrRange: [140, 180],
            accelRange: [2.5, 4.0],
            gpsMovement: 0.002,
            batteryDrain: 0.5
        },
        sleeping: {
            name: 'Sleeping/Resting',
            description: 'Child sleeping or at rest',
            duration: 60000,
            hrRange: [50, 65],
            accelRange: [0.0, 0.2],
            gpsMovement: 0,
            batteryDrain: 0.05
        },
        geofenceViolation: {
            name: 'Geofence Violation',
            description: 'Child leaves safe zone',
            duration: 10000,
            hrRange: [85, 110],
            accelRange: [0.5, 1.5],
            gpsMovement: 0.01,
            batteryDrain: 0.2
        }
    },

    currentScenario: null,
    scenarioStartTime: null,
    intervalId: null,

    /**
     * Initialize the simulator
     */
    init() {
        console.log('Initializing Device Simulator...');
        console.log('Available scenarios:', Object.keys(this.scenarios));
        
        // Create UI controls
        this.createSimulatorUI();
        
        // Auto-start in normal mode
        this.startScenario('normal');
        
        console.log('Device Simulator initialized');
    },

    /**
     * Create simulator control panel UI
     */
    createSimulatorUI() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'simulatorPanel';
        controlPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: var(--card-bg);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 15px;
            z-index: 5000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: monospace;
        `;

        controlPanel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: var(--primary);">
                🎮 device Simulator
            </div>
            
            <div style="margin-bottom: 10px; font-size: 0.9rem; color: var(--text-secondary);">
                Current: <strong id="currentScenarioLabel">Normal</strong>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">
                <button onclick="DeviceSimulator.startScenario('normal')" 
                    style="padding: 8px; background: var(--success); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    ✓ Normal
                </button>
                <button onclick="DeviceSimulator.startScenario('running')"
                    style="padding: 8px; background: var(--info); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    🏃 Running
                </button>
                <button onclick="DeviceSimulator.startScenario('danger')"
                    style="padding: 8px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    🚨 Danger
                </button>
                <button onclick="DeviceSimulator.startScenario('sleeping')"
                    style="padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    😴 Sleep
                </button>
                <button onclick="DeviceSimulator.startScenario('geofenceViolation')"
                    style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    🚪 Geofence
                </button>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid var(--border); padding-top: 10px;">
                <div>📊 Live Readings:</div>
                <div>HR: <strong id="simHR">72</strong> bpm</div>
                <div>Accel: <strong id="simAccel">0.5</strong> g</div>
                <div>🔋 <strong id="simBattery">85</strong>%</div>
            </div>
        `;

        document.body.appendChild(controlPanel);
    },

    /**
     * Generate random value within range
     */
    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Start a simulation scenario
     */
    startScenario(scenarioName) {
        console.log(`🎬 Starting scenario: ${scenarioName}`);

        const scenario = this.scenarios[scenarioName];
        if (!scenario) {
            console.error('❌ Unknown scenario:', scenarioName);
            return;
        }

        this.currentScenario = scenario;
        this.scenarioStartTime = Date.now();

        // Clear existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Update UI label
        const label = document.getElementById('currentScenarioLabel');
        if (label) {
            label.textContent = scenario.name;
        }

        // Start sending telemetry
        this.intervalId = setInterval(() => {
            this.sendTelemetry();
        }, this.config.updateInterval);

        // Send first data immediately
        this.sendTelemetry();

        console.log(`✅ Scenario started: ${scenario.name}`);
        console.log(`⏱️ Duration: ${scenario.duration / 1000}s`);

        // Stop scenario after duration
        setTimeout(() => {
            console.log(`⏸️ Scenario ended: ${scenarioName}`);
            this.startScenario('normal'); // Return to normal
        }, scenario.duration);
    },

    /**
     * Generate and send telemetry data
     */
    sendTelemetry() {
        const scenario = this.currentScenario || this.scenarios.normal;

        // Update each device
        ['device1', 'device2', 'device3'].forEach((deviceId) => {
            const device = this.state[deviceId];

            // Generate realistic values
            device.hr = this.generateHeartRate(scenario);
            device.accel = this.generateAcceleration(scenario);
            device.gps = this.generateGPS(device.gps, scenario);
            device.battery = Math.max(0, device.battery - this.randomInRange(0, scenario.batteryDrain));

            // Create telemetry payload
            const telemetryData = {
                device_id: deviceId,
                gps: device.gps,
                hr: Math.round(device.hr),
                accel: parseFloat(device.accel.toFixed(2)),
                battery: Math.round(device.battery),
                timestamp: new Date().toISOString(),
                rssi: Math.round(this.randomInRange(-70, -40)) // Signal strength
            };

            console.log(`📡 [${deviceId}] HR: ${telemetryData.hr} bpm | Accel: ${telemetryData.accel}g | Battery: ${telemetryData.battery}%`);

            // Emit via Socket.io if available
            if (typeof socket !== 'undefined' && socket.emit) {
                socket.emit('telemetry', telemetryData);
            }

            // Also update UI panel
            if (deviceId === 'device1') {
                const hrLabel = document.getElementById('simHR');
                const accelLabel = document.getElementById('simAccel');
                const batteryLabel = document.getElementById('simBattery');
                
                if (hrLabel) hrLabel.textContent = telemetryData.hr;
                if (accelLabel) accelLabel.textContent = telemetryData.accel;
                if (batteryLabel) batteryLabel.textContent = telemetryData.battery;
            }
        });
    },

    /**
     * Generate realistic heart rate data
     */
    generateHeartRate(scenario) {
        const baseHR = this.randomInRange(scenario.hrRange[0], scenario.hrRange[1]);
        
        // Add some noise/variation
        const noise = this.randomInRange(-5, 5);
        return Math.max(40, Math.min(220, baseHR + noise)); // Physiological limits
    },

    /**
     * Generate realistic acceleration data (3-axis combined)
     */
    generateAcceleration(scenario) {
        const baseAccel = this.randomInRange(scenario.accelRange[0], scenario.accelRange[1]);
        
        // Add realistic fluctuation
        const noise = this.randomInRange(-0.2, 0.2);
        return Math.max(0, baseAccel + noise);
    },

    /**
     * Generate GPS movement
     */
    generateGPS(currentGPS, scenario) {
        const movement = scenario.gpsMovement;
        
        return {
            lat: currentGPS.lat + this.randomInRange(-movement, movement),
            lon: currentGPS.lon + this.randomInRange(-movement, movement)
        };
    },

    /**
     * Stop the simulator
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Device Simulator stopped');
        }
    },

    /**
     * Create a specific alert scenario
     */
    triggerAlert(alertType) {
        console.log(`🚨 Triggering alert: ${alertType}`);

        const alertScenarios = {
            highHR: () => {
                this.startScenario('running');
                setTimeout(() => this.startScenario('danger'), 3000);
            },
            motionDetected: () => {
                this.startScenario('running');
            },
            geofenceExceeded: () => {
                this.startScenario('geofenceViolation');
            },
            tamperDetected: () => {
                this.startScenario('danger');
            },
            lowBattery: () => {
                this.state.device1.battery = 5;
                this.sendTelemetry();
            }
        };

        if (alertScenarios[alertType]) {
            alertScenarios[alertType]();
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Give other scripts time to load
    setTimeout(() => {
        DeviceSimulator.init();
    }, 2000);
});

// Export for global use
window.DeviceSimulator = DeviceSimulator;
