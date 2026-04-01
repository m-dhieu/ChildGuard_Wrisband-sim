// VITALS DISPLAY ENHANCEMENT - REAL-TIME HR & MOVEMENT READOUT

const VitalsDisplay = {
    // Element references
    elements: {
        hrValue: null,
        hrStatus: null,
        accelValue: null,
        accelStatus: null,
        baselineHR: null,
        stressIndicator: null,
        motionIndicator: null
    },

    // Display state
    state: {
        lastHR: 0,
        lastAccel: 0,
        baselineHR: 70,
        hrTrend: '→', // ↑ increasing, ↓ decreasing, → stable
        isStressed: false,
        isMoving: false
    },

    /**
     * Initialize vitals display panel
     */
    init() {
        console.log('📊 Initializing Vitals Display...');
        this.createVitalsPanel();
        console.log('✅ Vitals Display initialized');
    },

    /**
     * Create vitals display panel in dashboard
     */
    createVitalsPanel() {
        // Check if card already exists
        if (document.getElementById('vitalsPanel')) {
            return; // Already created
        }

        // Find the vitalsChart card and add a detailed display above it
        const vitalsCard = document.querySelector('[role="region"][aria-label*="مخطط معدل القلب"]') ||
                          document.querySelector('[role="region"][aria-label*="Heart Rate"]');

        if (!vitalsCard) {
            console.warn('⚠️ Vitals card not found, skipping panel creation');
            return;
        }

        // Create the display panel
        const panel = document.createElement('div');
        panel.id = 'vitalsPanel';
        panel.style.cssText = `
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            border: 2px solid var(--border);
        `;

        panel.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <!-- Heart Rate Display -->
                <div style="background: var(--card-bg); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 4px solid #d32f2f;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
                        <div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">❤️ HEART RATE</div>
                            <div style="font-size: 2.2rem; font-weight: bold; color: #d32f2f;">
                                <span id="hrValueLarge">--</span> <span style="font-size: 1rem; color: var(--text-secondary);">BPM</span>
                            </div>
                        </div>
                        <div style="text-align: center; font-size: 1.5rem;" id="hrTrendIcon">→</div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">
                        Baseline: <strong id="baselineHRDisplay">70</strong> BPM
                    </div>
                    <div id="hrStatusBar" style="
                        width: 100%;
                        height: 8px;
                        background: var(--border);
                        border-radius: 4px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="hrStatusFill" style="
                            width: 0%;
                            height: 100%;
                            background: linear-gradient(90deg, #43a047, #ffd54f, #d32f2f);
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
                        <span id="hrStatus">Normal</span>
                        <span id="hrAlert" style="color: #d32f2f; font-weight: bold; display: none;">⚠️ ELEVATED</span>
                    </div>
                </div>

                <!-- Motion/Acceleration Display -->
                <div style="background: var(--card-bg); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 4px solid #1976d2;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
                        <div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px;">📡 MOTION (ACCEL)</div>
                            <div style="font-size: 2.2rem; font-weight: bold; color: #1976d2;">
                                <span id="accelValueLarge">--</span> <span style="font-size: 1rem; color: var(--text-secondary);">g</span>
                            </div>
                        </div>
                        <div style="text-align: center; font-size: 1.5rem;" id="accelIcon">•</div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">
                        Threshold: <strong>2.0g</strong>
                    </div>
                    <div id="accelStatusBar" style="
                        width: 100%;
                        height: 8px;
                        background: var(--border);
                        border-radius: 4px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="accelStatusFill" style="
                            width: 0%;
                            height: 100%;
                            background: linear-gradient(90deg, #43a047, #ffd54f, #d32f2f);
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
                        <span id="accelStatus">Calm</span>
                        <span id="accelAlert" style="color: #d32f2f; font-weight: bold; display: none;">🚨 VIOLENT MOTION!</span>
                    </div>
                </div>
            </div>

            <!-- Readings History -->
            <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border);">
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; font-weight: 600;">
                    📈 Live Readings
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                    <div style="background: var(--bg-secondary); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Last HR</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #d32f2f;" id="lastHRDisplay">--</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Max HR (20s)</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #FF6F00;" id="maxHRDisplay">--</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Accel Peak</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #1976d2;" id="maxAccelDisplay">--</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Status</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #43a047;" id="overallStatus">✓ SAFE</div>
                    </div>
                </div>
            </div>
        `;

        // Insert at the top of the card
        vitalsCard.insertBefore(panel, vitalsCard.querySelector('.card-header').nextElementSibling);

        // Cache element references
        this.elements.hrValue = document.getElementById('hrValueLarge');
        this.elements.accelValue = document.getElementById('accelValueLarge');
        this.elements.baselineHR = document.getElementById('baselineHRDisplay');
        this.elements.hrStatus = document.getElementById('hrStatus');
        this.elements.accelStatus = document.getElementById('accelStatus');
        this.elements.stressIndicator = document.getElementById('hrAlert');
        this.elements.motionIndicator = document.getElementById('accelAlert');

        console.log('✅ Vitals display panel created');
    },

    /**
     * Update vitals display with new readings
     */
    update(hr, accel, baselineHR = 70) {
        try {
            this.state.lastHR = hr;
            this.state.lastAccel = accel;
            this.state.baselineHR = baselineHR;

            // Update HR display
            if (this.elements.hrValue) {
                this.elements.hrValue.textContent = Math.round(hr);
                
                // Calculate HR as percentage of threshold (30% above baseline = 130%)
                const threshold = baselineHR * 1.3;
                const hrPercent = Math.min(100, (hr / threshold) * 100);
                const hrBar = document.getElementById('hrStatusFill');
                if (hrBar) hrBar.style.width = hrPercent + '%';

                // Determine HR status
                const isStressed = hr > threshold;
                this.state.isStressed = isStressed;
                
                if (this.elements.hrStatus) {
                    this.elements.hrStatus.textContent = isStressed ? 'ELEVATED' : 'Normal';
                    this.elements.hrStatus.style.color = isStressed ? '#d32f2f' : '#43a047';
                }
                
                if (this.elements.stressIndicator) {
                    this.elements.stressIndicator.style.display = isStressed ? 'inline' : 'none';
                }

                // HR trend
                this.updateHRTrend(hr);

                // Max HR tracking
                this.updateMaxHR(hr);
            }

            if (this.elements.baselineHR) {
                this.elements.baselineHR.textContent = Math.round(baselineHR);
            }

            // Update acceleration display
            if (this.elements.accelValue) {
                this.elements.accelValue.textContent = accel.toFixed(2);
                
                // Acceleration as percentage of threshold (2g = 100%)
                const accelPercent = Math.min(100, (accel / 2.0) * 100);
                const accelBar = document.getElementById('accelStatusFill');
                if (accelBar) accelBar.style.width = accelPercent + '%';

                // Determine motion status
                const isViolentMotion = accel > 2.0;
                this.state.isMoving = accel > 0.5;
                
                if (this.elements.accelStatus) {
                    this.elements.accelStatus.textContent = isViolentMotion ? 'VIOLENT!' : (this.state.isMoving ? 'Moving' : 'Calm');
                    this.elements.accelStatus.style.color = isViolentMotion ? '#d32f2f' : (this.state.isMoving ? '#FF9800' : '#43a047');
                }
                
                if (this.elements.motionIndicator) {
                    this.elements.motionIndicator.style.display = isViolentMotion ? 'inline' : 'none';
                }

                // Update motion icon
                const accelIcon = document.getElementById('accelIcon');
                if (accelIcon) {
                    if (isViolentMotion) {
                        accelIcon.textContent = '⚡';
                    } else if (this.state.isMoving) {
                        accelIcon.textContent = '↔️';
                    } else {
                        accelIcon.textContent = '•';
                    }
                }

                // Max accel tracking
                this.updateMaxAccel(accel);
            }

            // Update last HR display
            const lastHRDisplay = document.getElementById('lastHRDisplay');
            if (lastHRDisplay) {
                lastHRDisplay.textContent = Math.round(hr);
            }

            // Overall status
            const overallStatus = document.getElementById('overallStatus');
            if (overallStatus) {
                const isDanger = isStressed || (accel > 2.0);
                overallStatus.textContent = isDanger ? '⚠️ DANGER' : '✓ SAFE';
                overallStatus.style.color = isDanger ? '#d32f2f' : '#43a047';
            }

        } catch (error) {
            console.error('❌ Error updating vitals display:', error);
        }
    },

    /**
     * Track HR trend
     */
    updateHRTrend(hr) {
        const trendIcon = document.getElementById('hrTrendIcon');
        if (!trendIcon) return;

        if (hr > this.state.lastHR + 10) {
            trendIcon.textContent = '📈';
            this.state.hrTrend = 'up';
        } else if (hr < this.state.lastHR - 10) {
            trendIcon.textContent = '📉';
            this.state.hrTrend = 'down';
        } else {
            trendIcon.textContent = '→';
            this.state.hrTrend = 'stable';
        }
    },

    /**
     * Track maximum HR in last 20 seconds
     */
    updateMaxHR(hr) {
        if (!this.maxHRHistory) {
            this.maxHRHistory = [];
        }

        this.maxHRHistory.push(hr);

        // Keep only last 4 readings (20 seconds at 5-second intervals)
        if (this.maxHRHistory.length > 4) {
            this.maxHRHistory.shift();
        }

        const maxHR = Math.max(...this.maxHRHistory);
        const maxHRDisplay = document.getElementById('maxHRDisplay');
        if (maxHRDisplay) {
            maxHRDisplay.textContent = Math.round(maxHR);
        }
    },

    /**
     * Track maximum acceleration in last 20 seconds
     */
    updateMaxAccel(accel) {
        if (!this.maxAccelHistory) {
            this.maxAccelHistory = [];
        }

        this.maxAccelHistory.push(accel);

        // Keep only last 4 readings (20 seconds at 5-second intervals)
        if (this.maxAccelHistory.length > 4) {
            this.maxAccelHistory.shift();
        }

        const maxAccel = Math.max(...this.maxAccelHistory);
        const maxAccelDisplay = document.getElementById('maxAccelDisplay');
        if (maxAccelDisplay) {
            maxAccelDisplay.textContent = maxAccel.toFixed(2);
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        VitalsDisplay.init();
    }, 3000); // Wait for main script to load
});

// Export for global use
window.VitalsDisplay = VitalsDisplay;
