/* ═══════════════════════════════════════════════════════════════════ */
/* CHILDGUARD DUMMY DATA SIMULATOR                                    */
/* For testing heart rate, motion, and all dashboard functionalities  */
/* ═══════════════════════════════════════════════════════════════════ */

class DummyDataSimulator {
    constructor() {
        this.hrBaseline = 70;
        this.currentHR = this.hrBaseline;
        this.inStressEvent = false;
        this.stressTimer = 0;
        this.stressIntensity = 0;
        
        this.inMotionEvent = false;
        this.motionTimer = 0;
        this.motionIntensity = 0;
        
        this.gpsLat = 15.5007;
        this.gpsLon = 32.5599;
        this.battery = 100;
        
        this.updateCount = 0;
        
        console.log('🎮 Dummy Data Simulator initialized');
    }
    
    // Get next heart rate value
    getHeartRate() {
        this.updateCount++;
        
        // 5% chance to trigger stress event
        if (!this.inStressEvent && Math.random() < 0.05) {
            this.inStressEvent = true;
            this.stressTimer = Math.random() * 30 + 20; // 20-50 updates
            this.stressIntensity = Math.random() * 0.5 + 0.3; // 1.3x - 1.8x baseline
            console.log(`🚨 Stress event triggered! Duration: ${this.stressTimer.toFixed(0)} updates, Intensity: ${(this.stressIntensity).toFixed(2)}x`);
        }
        
        if (this.inStressEvent) {
            this.stressTimer--;
            
            if (this.stressTimer <= 0) {
                this.inStressEvent = false;
                console.log('✓ Stress event ended');
            }
            
            // HR spike during stress (>1.3x baseline = danger)
            const baseSpikeHR = this.hrBaseline * (1 + this.stressIntensity * 0.8);
            this.currentHR = baseSpikeHR + (Math.random() - 0.5) * 20;
        } else {
            // Normal HR variation
            this.currentHR = this.hrBaseline + (Math.random() - 0.5) * 15;
        }
        
        // Keep in realistic range
        this.currentHR = Math.max(40, Math.min(200, this.currentHR));
        
        return Math.round(this.currentHR);
    }
    
    // Get next acceleration value
    getAcceleration() {
        // 3% chance to trigger motion event
        if (!this.inMotionEvent && Math.random() < 0.03) {
            this.inMotionEvent = true;
            this.motionTimer = Math.random() * 15 + 8; // 8-23 updates
            this.motionIntensity = Math.random() * 1.5 + 2.5; // 2.5g - 4.0g (danger zone)
            console.log(`⚡ Motion event triggered! Duration: ${this.motionTimer.toFixed(0)} updates, Intensity: ${this.motionIntensity.toFixed(1)}g`);
        }
        
        if (this.inMotionEvent) {
            this.motionTimer--;
            
            if (this.motionTimer <= 0) {
                this.inMotionEvent = false;
                console.log('✓ Motion event ended');
            }
            
            // High acceleration during activity (>2.0g triggers alert)
            const accel = this.motionIntensity + (Math.random() - 0.5) * 1;
            
            // Generate 3-axis data
            const x = (Math.random() - 0.5) * accel;
            const y = (Math.random() - 0.5) * accel;
            const z = 9.8 + (Math.random() - 0.5) * (accel / 2);
            
            const magnitude = Math.sqrt(x * x + y * y + z * z) / 9.8; // Normalize
            
            return {
                x: parseFloat(x.toFixed(2)),
                y: parseFloat(y.toFixed(2)),
                z: parseFloat(z.toFixed(2)),
                magnitude: parseFloat(magnitude.toFixed(2))
            };
        } else {
            // Normal movement
            const accel = Math.random() * 1.2;
            
            const x = (Math.random() - 0.5) * accel;
            const y = (Math.random() - 0.5) * accel;
            const z = 9.8 + (Math.random() - 0.5) * 0.3;
            
            const magnitude = Math.sqrt(x * x + y * y + z * z) / 9.8;
            
            return {
                x: parseFloat(x.toFixed(2)),
                y: parseFloat(y.toFixed(2)),
                z: parseFloat(z.toFixed(2)),
                magnitude: parseFloat(magnitude.toFixed(2))
            };
        }
    }
    
    // Get next GPS location (small random walk)
    getGPSLocation() {
        // Small random walk
        const step = 0.0005; // ~55 meters at equator
        this.gpsLat += (Math.random() - 0.5) * step;
        this.gpsLon += (Math.random() - 0.5) * step;
        
        // Keep within bounds (Khartoum area)
        const bounds = 0.05;
        this.gpsLat = Math.max(15.45, Math.min(15.55, this.gpsLat));
        this.gpsLon = Math.max(32.5, Math.min(32.65, this.gpsLon));
        
        return {
            lat: parseFloat(this.gpsLat.toFixed(6)),
            lon: parseFloat(this.gpsLon.toFixed(6)),
            accuracy: Math.random() * 5 + 5, // 5-10m accuracy
            altitude: 380 + (Math.random() - 0.5) * 20 // ~380m elevation in Khartoum
        };
    }
    
    // Get battery level
    getBattery() {
        // Slight decay
        if (this.updateCount % 100 === 0) {
            this.battery = Math.max(20, this.battery - (Math.random() * 2));
        }
        return Math.round(this.battery);
    }
    
    // Get complete telemetry packet
    getTelemetry(deviceId = 'device1') {
        const accelData = this.getAcceleration();
        return {
            device_id: deviceId,
            gps: this.getGPSLocation(),
            hr: this.getHeartRate(),
            spo2: 95 + Math.random() * 5,
            temperature: 36.5 + Math.random() * 1,
            accel: accelData.magnitude,  // Use magnitude as the main accel value for chart
            accel_full: accelData,        // Store full 3-axis data if needed
            battery: this.getBattery(),
            signal_strength: -80 + Math.random() * 40,
            connection_type: Math.random() > 0.9 ? '3G' : '4G',
            timestamp: new Date().toISOString()
        };
    }
}

// Create global instance
const dummySimulator = new DummyDataSimulator();

// ═══════════════════════════════════════════════════════════════════
/* AUTO-EMIT DUMMY DATA FUNCTION                                      */
/* ═══════════════════════════════════════════════════════════════════

/**
 * Start emitting dummy telemetry data
 * @param {number} intervalMs - Interval between emissions in milliseconds
 * @param {string} deviceId - Device to emit data for
 */
function startDummyDataEmitter(intervalMs = 2000, deviceId = 'device1') {
    console.log(`🎮 Starting dummy data emitter (${intervalMs}ms intervals, device: ${deviceId})`);
    
    // Immediately emit first data point
    const initialData = dummySimulator.getTelemetry(deviceId);
    console.log('📡 Emitting initial telemetry:', initialData);
    socket.emit('telemetry', initialData);
    
    // Set up recurring emissions
    window.dummyEmitterInterval = setInterval(() => {
        try {
            const telemetry = dummySimulator.getTelemetry(deviceId);
            socket.emit('telemetry', telemetry);
            
            // Log every 10th emission
            if (dummySimulator.updateCount % 10 === 0) {
                console.log(`📊 Emission #${dummySimulator.updateCount}: HR=${telemetry.hr}bpm, Accel=${telemetry.accel.magnitude.toFixed(1)}g, Battery=${telemetry.battery}%`);
            }
        } catch (error) {
            console.error('❌ Error emitting dummy data:', error);
        }
    }, intervalMs);
    
    console.log('✅ Dummy data emitter started');
}

/**
 * Stop emitting dummy data
 */
function stopDummyDataEmitter() {
    if (window.dummyEmitterInterval) {
        clearInterval(window.dummyEmitterInterval);
        window.dummyEmitterInterval = null;
        console.log('⏹️ Dummy data emitter stopped');
    }
}

/**
 * Manually trigger a stress event (HR spike)
 */
function triggerDummyStressEvent() {
    dummySimulator.inStressEvent = true;
    dummySimulator.stressTimer = 30;
    dummySimulator.stressIntensity = 0.6; // 1.6x baseline
    console.log('🚨 Manual stress event triggered');
}

/**
 * Manually trigger a motion event (acceleration spike)
 */
function triggerDummyMotionEvent() {
    dummySimulator.inMotionEvent = true;
    dummySimulator.motionTimer = 20;
    dummySimulator.motionIntensity = 3.5; // 3.5g
    console.log('⚡ Manual motion event triggered');
}

/**
 * Get current simulator state
 */
function getDummySimulatorState() {
    return {
        updateCount: dummySimulator.updateCount,
        currentHR: dummySimulator.currentHR,
        inStressEvent: dummySimulator.inStressEvent,
        stressTimer: dummySimulator.stressTimer,
        currentAcceleration: dummySimulator.getAcceleration(),
        inMotionEvent: dummySimulator.inMotionEvent,
        motionTimer: dummySimulator.motionTimer,
        battery: dummySimulator.battery,
        gps: { lat: dummySimulator.gpsLat, lon: dummySimulator.gpsLon },
        isRunning: !!window.dummyEmitterInterval
    };
}

// Export for global access
window.startDummyDataEmitter = startDummyDataEmitter;
window.stopDummyDataEmitter = stopDummyDataEmitter;
window.triggerDummyStressEvent = triggerDummyStressEvent;
window.triggerDummyMotionEvent = triggerDummyMotionEvent;
window.getDummySimulatorState = getDummySimulatorState;
window.dummySimulator = dummySimulator;

console.log('✅ Dummy Data Simulator module loaded');
console.log('📝 Available commands:');
console.log('  - startDummyDataEmitter(intervalMs, deviceId)  - Start emitting dummy data');
console.log('  - stopDummyDataEmitter()                       - Stop emitting dummy data');
console.log('  - triggerDummyStressEvent()                    - Trigger HR spike');
console.log('  - triggerDummyMotionEvent()                    - Trigger acceleration spike');
console.log('  - getDummySimulatorState()                     - View current state');
