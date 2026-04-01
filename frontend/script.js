// Clean-up: Clear invalid/stale authentication data
(function() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    // If we have a token but it's malformed, clear everything
    if (token && (!token.includes('.') || token.length < 50)) {
        console.log('🧹 Cleared invalid auth token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }
    
    // Validate user data is valid JSON
    if (user) {
        try {
            const parsed = JSON.parse(user);
            if (!parsed.phone) throw new Error('Invalid user format');
        } catch (e) {
            console.log('🧹 Cleared corrupted user data');
            localStorage.removeItem('user_data');
            localStorage.removeItem('auth_token');
        }
    }
})();


/* AUTHENTICATION SYSTEM */

// Authentication state
let authState = {
    isAuthenticated: false,
    token: localStorage.getItem('auth_token') || null,
    user: JSON.parse(localStorage.getItem('user_data') || 'null'),
    apiBase: 'http://localhost:5000/api'
};

// Check if user is authenticated on load
function checkAuthentication() {
    if (authState.token && authState.user) {
        authState.isAuthenticated = true;
        document.getElementById('loginModal').style.display = 'none';
        document.querySelector('.dashboard-container').style.display = 'block';
        updateUserMenu();
        return true;
    } else {
        authState.isAuthenticated = false;
        document.getElementById('loginModal').style.display = 'flex';
        document.querySelector('.dashboard-container').style.display = 'none';
        return false;
    }
}

// Login function
async function login(phone, password) {
    try {
        console.log('🔐 Attempting login with phone:', phone);
        console.log('📡 API Base URL:', authState.apiBase);
        
        const requestBody = { phone, password };
        console.log('📦 Request body:', requestBody);
        
        const fetchOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            credentials: 'omit'  // Don't send cookies for this cross-origin request
        };
        
        console.log('🔧 Fetch options:', fetchOptions);
        
        const response = await fetch(`${authState.apiBase}/login`, fetchOptions);

        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);
        console.log('📨 Response headers:', {
            'content-type': response.headers.get('content-type'),
            'access-control-allow-origin': response.headers.get('access-control-allow-origin')
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('❌ Failed to parse response JSON:', parseError);
            throw new Error(`Invalid server response (${response.status}): ${response.statusText}`);
        }

        if (!response.ok) {
            console.error('❌ Error response:', data);
            throw new Error(data.error || data.message || `Login failed (${response.status})`);
        }

        console.log('✓ Response data received:', data);
        
        // Validate token format
        if (!data.access_token || !data.user) {
            console.error('❌ Invalid response format:', data);
            throw new Error('Invalid login response from server');
        }
        
        // Store token and user data
        authState.token = data.access_token;
        authState.user = data.user;
        authState.isAuthenticated = true;
        
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        console.log('✓ Login successful!');
        console.log('✓ Stored token:', data.access_token.substring(0, 20) + '...');
        
        // Hide modal and show dashboard
        document.getElementById('loginModal').style.display = 'none';
        document.querySelector('.dashboard-container').style.display = 'block';
        
        // Update UI
        updateUserMenu();
        
        return true;
    } catch (error) {
        console.error('✗ Login error:', error);
        console.error('✗ Error type:', error.constructor.name);
        console.error('✗ Error message:', error.message);
        console.error('✗ Error stack:', error.stack);
        
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = '❌ ' + error.message;
            errorDiv.style.display = 'block';
        }
        return false;
    }
}

// Logout function
function logout() {
    console.log('🔓 Logging out...');
    
    // Clear storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Reset auth state
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
    
    // Show login modal
    document.getElementById('loginModal').style.display = 'flex';
    document.querySelector('.dashboard-container').style.display = 'none';
    
    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
    
    console.log('✓ Logged out successfully');
}

// Update user menu
function updateUserMenu() {
    if (authState.user) {
        const userGreeting = document.querySelector('[data-i18n="user-greeting"]');
        if (userGreeting) {
            userGreeting.textContent = `مرحباً، ${authState.user.name || 'حارس'}`;
        }
    }
}

// Get authorization headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
    };
}

/* LOGIN MODAL STYLING */

// Add CSS for login modal
const style = document.createElement('style');
style.textContent = `
.modal-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    backdrop-filter: blur(5px);
}

.modal-dialog {
    background: var(--card-bg);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-xl);
    max-width: 400px;
    width: 90%;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    margin-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--border);
    padding-bottom: var(--spacing-md);
}

.modal-header h2 {
    color: var(--primary-dark);
    margin: 0;
    font-size: 1.5rem;
}

.modal-body {
    margin-top: var(--spacing-lg);
}

.form-group {
    margin-bottom: var(--spacing-md);
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: var(--spacing-sm);
    color: var(--text);
    font-weight: 600;
}

.form-control {
    padding: var(--spacing-md);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    background: var(--bg-secondary);
    color: var(--text);
    transition: border-color 0.2s;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-dark);
    box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}

.alert-danger {
    padding: var(--spacing-md);
    background: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    border-left: 4px solid #d32f2f;
}

.btn {
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.dashboard-container {
    display: block;
}
`;
document.head.appendChild(style);

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
    // TEMPORARILY DISABLED FOR TESTING - Uncomment to enable authentication
    // checkAuthentication();
    
    // Force show dashboard for testing
    document.getElementById('loginModal').style.display = 'none';
    document.querySelector('.dashboard-container').style.display = 'block';
    
    // Login form submit
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;
        await login(phone, password);
    });
    
    // Logout button
    document.querySelector('.logout-btn').addEventListener('click', logout);
});

/* MAIN DASHBOARD FUNCTIONALITY (Original) */

// Implements FR7: Guardian Dashboard functionality with real-time monitoring

const socket = io();
const map = L.map('map', { drawControl: true }).setView([15.5, 32.5], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap | ChildGuard v1.0'
}).addTo(map);

// Custom child marker (low-literacy icon design)
const childIcon = L.divIcon({
    className: 'child-marker',
    html: '<div style="background:#d32f2f;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;box-shadow:0 4px 12px rgba(211,47,47,0.4);border:3px solid white;"><i class="fas fa-child"></i></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const marker = L.marker([15.5, 32.5], { icon: childIcon }).addTo(map);

// State Management
let state = {
    currentDevice: localStorage.getItem('childguard-device') || 'device1',
    baselineHR: 70,
    alerts: [],
    geofenceLayer: L.layerGroup().addTo(map),
    vitalsChart: null,
    isAlertActive: false,
    emergencyContacts: JSON.parse(localStorage.getItem('emergency-contacts') || '[]'),
    geofenceRadius: parseInt(localStorage.getItem('geofence-radius') || '100'),
};

// Initialize Chart.js for Vitals
function initChart() {
    state.vitalsChart = new Chart(document.getElementById('vitalsChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: i18n.t('vitals-title') + ' - HR',
                    data: [],
                    borderColor: '#d32f2f',
                    backgroundColor: 'rgba(211,47,47,0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    borderWidth: 2,
                    pointRadius: 3,
                },
                {
                    label: i18n.t('vitals-title') + ' - Motion',
                    data: [],
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25,118,210,0.1)',
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true } },
                tooltip: { mode: 'index', intersect: false },
            },
            scales: {
                x: { display: true },
                y: {
                    position: 'left',
                    title: { display: true, text: i18n.t('vitals-title') },
                    suggestedMin: 50,
                    suggestedMax: 150,
                    ticks: { color: '#d32f2f' },
                },
                y1: {
                    position: 'right',
                    title: { display: true, text: 'Acceleration (g)' },
                    suggestedMin: 0,
                    suggestedMax: 5,
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#1976d2' },
                }
            }
        }
    });
}

// Socket Events
socket.on('connect', () => {
    console.log('✓ Connected to server');
});

socket.on('telemetry', (data) => {
    const { gps, hr, accel, battery, device_id, timestamp } = data;
    
    if (device_id !== state.currentDevice) return;
    
    // Update baseline HR (10-min moving average)
    state.baselineHR = (state.baselineHR * 9 + hr) / 10;
    
    // FR1.2: Live location streaming (30-second intervals)
    marker.setLatLng([gps.lat, gps.lon]);
    
    // FR7.1: Popup with child status
    const isDanger = hr > state.baselineHR * 1.3 || accel > 2;
    marker.bindPopup(`
        <div style="min-width:250px;text-align:center;font-family:sans-serif;">
            <strong>${i18n.t(state.currentDevice === 'device1' ? 'child-1' : state.currentDevice === 'device2' ? 'child-2' : 'child-3')}</strong><br>
            <span style="color:${isDanger ? '#d32f2f' : '#43a047'};font-weight:bold;">
                ${isDanger ? i18n.t('status-danger') : i18n.t('status-safe')}
            </span><br>
            <hr style="margin:10px 0;border:none;border-top:1px solid #ddd;">
            ❤️ HR: ${hr}bpm (baseline: ${state.baselineHR.toFixed(0)})<br>
            📡 Accel: ${accel.toFixed(1)}g<br>
            🔋 Battery: ${battery}%<br>
            ⏰ ${new Date(timestamp).toLocaleString(i18n.t('datetime-format'))}
        </div>
    `).openPopup();
    
    // Update map view to follow child
    map.panTo([gps.lat, gps.lon], { animate: true });
    
    // Update UI elements
    updateBatteryStatus(battery);
    updateStatusIndicator(isDanger);
    
    // Update Chart
    updateVitalsChart(hr, accel);
    
    // FR1.1: Geofence check (100m default)
    const distance = getDistance(gps.lat, gps.lon, 15.5, 32.5);
    if (distance > state.geofenceRadius) {
        triggerAlert('geofence', i18n.t('alert-geofence'), gps, 'warning');
    }
    
    // FR2: Danger Detection (HR>30% baseline + accel>2g)
    if (hr > state.baselineHR * 1.3) {
        triggerAlert('heart-rate', i18n.t('alert-heart-rate'), gps, 'danger');
    }
    
    if (accel > 2) {
        triggerAlert('motion', i18n.t('alert-motion'), gps, 'danger');
    }
});

// Socket: Receive alerts from backend
socket.on('alert', (alertData) => {
    showAlertBanner(alertData);
    addAlertToList(alertData);
    speakArabic(alertData.msg || i18n.t('alert-manual'));
});

// UI Event Handlers

// FR6.1: Manual Panic Button
document.getElementById('panicBtn').addEventListener('click', () => {
    socket.emit('panic', { device: state.currentDevice, timestamp: Date.now() });
    triggerAlert('manual', i18n.t('alert-manual'), { lat: 15.5, lon: 32.5 }, 'danger');
});

// FR3.2: Manual Photo Trigger
document.getElementById('photoBtn').addEventListener('click', () => {
    showPhotoEvidence([
        'https://via.placeholder.com/320x240/d32f2f/ffffff?text=' + i18n.t('photo-attacker') + '+1',
        'https://via.placeholder.com/320x240/d32f2f/ffffff?text=' + i18n.t('photo-attacker') + '+2',
        'https://via.placeholder.com/320x240/d32f2f/ffffff?text=' + i18n.t('photo-attacker') + '+3'
    ], { lat: 15.5, lon: 32.5 });
});

// FR7.4: Zone Drawing
document.getElementById('drawGeofence').addEventListener('click', () => {
    if (!state.geofenceLayer) {
        state.geofenceLayer = L.layerGroup().addTo(map);
    } else {
        state.geofenceLayer.clearLayers();
    }
    
    // Mock safe zone circle
    const safeZone = L.circle([15.5, 32.5], {
        radius: state.geofenceRadius,
        color: '#43a047',
        fill: true,
        fillOpacity: 0.2,
        weight: 3,
        dashArray: '5, 5'
    }).bindPopup(`<div style="text-align:center;"><strong>${i18n.t('config-geofence-radius')}</strong><br>${state.geofenceRadius}m</div>`);
    
    state.geofenceLayer.addLayer(safeZone);
});

// Config Button
document.getElementById('configBtn').addEventListener('click', showConfigDialog);

// FR1.2: Device selector
document.getElementById('deviceSelect').addEventListener('change', (e) => {
    state.currentDevice = e.target.value;
    localStorage.setItem('childguard-device', state.currentDevice);
    socket.emit('switch_device', state.currentDevice);
});

// FR4.2: Alert Acknowledgment
document.getElementById('ackAlert').addEventListener('click', () => {
    document.getElementById('alertBanner').classList.add('hidden');
    const firstAlert = document.querySelector('.alert-item:first-child');
    if (firstAlert) {
        firstAlert.classList.add('acked');
    }
    state.isAlertActive = false;
});

// Utility Functions

function updateBatteryStatus(battery) {
    document.getElementById('battery').textContent = `${battery}%`;
    const icon = document.getElementById('batteryIcon');
    if (battery > 75) {
        icon.className = 'fas fa-battery-full';
    } else if (battery > 25) {
        icon.className = 'fas fa-battery-half';
    } else {
        icon.className = 'fas fa-battery-empty';
    }
}

function updateStatusIndicator(isDanger) {
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = isDanger ? i18n.t('status-danger') : i18n.t('status-safe');
    statusEl.style.color = isDanger ? '#d32f2f' : '#43a047';
}

function updateVitalsChart(hr, accel) {
    if (!state.vitalsChart) return;
    
    const time = new Date().toLocaleTimeString(i18n.t('datetime-format'));
    state.vitalsChart.data.labels.push(time);
    state.vitalsChart.data.datasets[0].data.push(hr);
    state.vitalsChart.data.datasets[1].data.push(accel);
    
    // Keep last 20 points
    if (state.vitalsChart.data.labels.length > 20) {
        state.vitalsChart.data.labels.shift();
        state.vitalsChart.data.datasets[0].data.shift();
        state.vitalsChart.data.datasets[1].data.shift();
    }
    
    state.vitalsChart.update('none');
}

function triggerAlert(type, msg, gps, severity = 'warning') {
    const alertData = {
        id: Date.now(),
        type,
        msg,
        lat: gps.lat,
        lon: gps.lon,
        hr: Math.floor(Math.random() * 50) + 90,
        timestamp: new Date().toLocaleString(i18n.t('datetime-format')),
        severity
    };
    
    // Avoid duplicate alerts
    if (!state.isAlertActive || state.alerts.length === 0) {
        socket.emit('alert', alertData);
        state.isAlertActive = true;
    }
}

function showAlertBanner(data) {
    const banner = document.getElementById('alertBanner');
    document.getElementById('alertMsg').innerHTML = `
        <strong>${data.msg}</strong><br>
        <small>📍 ${data.lat?.toFixed(4)}, ${data.lon?.toFixed(4)} | ⏰ ${data.timestamp}</small>
    `;
    banner.classList.remove('hidden');
}

function addAlertToList(data) {
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    const item = document.createElement('div');
    item.className = `alert-item ${data.severity || data.type === 'danger' ? 'danger' : data.type === 'geofence' ? 'geofence' : 'info'}`;
    item.innerHTML = `
        <i class="fas fa-${getAlertIcon(data.type)}"></i>
        <div>
            <strong>${data.msg}</strong>
            <br><small>${data.timestamp}</small>
        </div>
    `;
    
    document.getElementById('alertList').prepend(item);
    const count = ++state.alerts.length;
    document.getElementById('alertCount').textContent = count;
    
    // FR4.2: Escalation - unacknowledged alerts after 5 minutes
    setTimeout(() => {
        if (!item.classList.contains('acked')) {
            triggerAlert('escalation', i18n.t('alert-escalation'), { lat: data.lat, lon: data.lon }, 'danger');
        }
    }, 300000); // 5 minutes
}

function getAlertIcon(type) {
    const icons = {
        'geofence': 'map-pin',
        'heart-rate': 'heartbeat',
        'motion': 'running',
        'manual': 'hand-paper',
        'escalation': 'ambulance',
    };
    return icons[type] || 'exclamation-triangle';
}

function showPhotoEvidence(urls, gps) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    
    modal.innerHTML = `
        <div class="photo-modal-content">
            <div class="photo-modal-header">
                <h3>${i18n.t('photos-title')}</h3>
                <button class="photo-modal-close">×</button>
            </div>
            <p style="color:var(--text-secondary);margin-bottom:1rem;">
                ${i18n.t('photo-location')}: ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)} | 
                ${i18n.t('photo-time')}: ${new Date().toLocaleString(i18n.t('datetime-format'))}
            </p>
            <div class="photo-grid">
                ${urls.map((url, i) => `
                    <div class="photo-item">
                        <img src="${url}" alt="${i18n.t('photo-attacker')} ${i + 1}">
                        <p>${i18n.t('photo-attacker')} ${i + 1}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.photo-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function showConfigDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'photo-modal'; // Reuse modal styling
    
    dialog.innerHTML = `
        <div class="photo-modal-content" style="min-width:400px;">
            <div class="photo-modal-header">
                <h3>${i18n.t('config-title')}</h3>
                <button class="photo-modal-close">×</button>
            </div>
            
            <form style="display:flex;flex-direction:column;gap:1rem;">
                <div>
                    <label style="display:block;margin-bottom:0.5rem;font-weight:600;">
                        ${i18n.t('config-geofence-radius')}
                    </label>
                    <input 
                        type="number" 
                        id="geofenceInput" 
                        value="${state.geofenceRadius}" 
                        min="50" 
                        max="500"
                        style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-md);"
                    >
                </div>
                
                <div>
                    <label style="display:block;margin-bottom:0.5rem;font-weight:600;">
                        ${i18n.t('config-emergency-contacts')}
                    </label>
                    <div id="contactsList" style="display:flex;flex-direction:column;gap:0.5rem;">
                        ${state.emergencyContacts.map((contact, i) => `
                            <input 
                                type="text" 
                                value="${contact}" 
                                class="contact-input"
                                style="padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-md);"
                            >
                        `).join('')}
                    </div>
                    <button 
                        type="button" 
                        onclick="document.getElementById('contactsList').innerHTML += '<input type=\"text\" class=\"contact-input\" style=\"padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-md);\">' "
                        style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--info);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;"
                    >
                        ${i18n.t('config-add-contact')}
                    </button>
                </div>
                
                <div style="display:flex;gap:1rem;margin-top:1rem;">
                    <button 
                        type="button" 
                        onclick="saveConfig()" 
                        style="flex:1;padding:0.75rem;background:var(--success);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:600;"
                    >
                        ${i18n.t('config-save')}
                    </button>
                    <button 
                        type="button" 
                        onclick="this.closest('.photo-modal').remove()" 
                        style="flex:1;padding:0.75rem;background:var(--border);color:var(--text);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:600;"
                    >
                        ${i18n.t('config-cancel')}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.querySelector('.photo-modal-close').addEventListener('click', () => dialog.remove());
}

function saveConfig() {
    const geofence = parseInt(document.getElementById('geofenceInput').value) || 100;
    const contacts = Array.from(document.querySelectorAll('.contact-input')).map(i => i.value).filter(v => v);
    
    state.geofenceRadius = geofence;
    state.emergencyContacts = contacts;
    
    localStorage.setItem('geofence-radius', geofence);
    localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
    
    document.querySelector('.photo-modal').remove();
    alert(i18n.t('config-save') + '! ✓');
}

// Arabic TTS for low-literacy support (NFR4)
function speakArabic(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// Haversine distance calculation
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Initialize on page load
window.addEventListener('load', () => {
    initChart();
    setupNetworkStatus();
    setupEventDelegation();
    setupPerformanceOptimizations();
    console.log('✓ ChildGuard Dashboard initialized');
});

/* PERFORMANCE OPTIMIZATIONS */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for animations
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Setup performance optimizations
function setupPerformanceOptimizations() {
    // Debounce chart updates (50ms)
    const debouncedChartUpdate = debounce(updateVitalsChart, 50);
    
    // Throttle map pan (100ms)
    const throttledMapPan = throttle((lat, lon) => {
        map.panTo([lat, lon], { animate: true, duration: 0.5 });
    }, 100);
}

/* NETWORK STATUS MONITORING */

function setupNetworkStatus() {
    const networkStatus = document.getElementById('networkStatus');
    const networkStatusText = document.getElementById('networkStatusText');
    
    // Check online status
    window.addEventListener('online', () => {
        networkStatus.classList.remove('offline');
        networkStatus.classList.add('online');
        networkStatusText.textContent = i18n.t('network-online');
        console.log('✓ Network status: Online');
    });
    
    window.addEventListener('offline', () => {
        networkStatus.classList.remove('online');
        networkStatus.classList.add('offline');
        networkStatusText.textContent = i18n.t('network-offline');
        console.log('⚠ Network status: Offline');
    });
    
    // Set initial status
    if (!navigator.onLine) {
        networkStatus.classList.add('offline');
        networkStatusText.textContent = i18n.t('network-offline');
    }
}

/* ENHANCED EVENT DELEGATION */

function setupEventDelegation() {
    // Device selector change with smooth transition
    document.getElementById('deviceSelect').addEventListener('change', (e) => {
        state.currentDevice = e.target.value;
        localStorage.setItem('childguard-device', state.currentDevice);
        
        // Animate the transition
        document.querySelector('.dashboard-grid').style.opacity = '0.5';
        setTimeout(() => {
            document.querySelector('.dashboard-grid').style.opacity = '1';
        }, 200);
        
        console.log(`📱 Switched to device: ${state.currentDevice}`);
    });
    
    // Alert acknowledgment with animation
    document.getElementById('ackAlert').addEventListener('click', (e) => {
        const banner = document.getElementById('alertBanner');
        banner.style.animation = 'slideInDown 0.3s ease-out reverse';
        setTimeout(() => {
            banner.classList.add('hidden');
            banner.style.animation = '';
        }, 300);
    });
    
    // Panic button with feedback animations
    document.getElementById('panicBtn').addEventListener('mousedown', () => {
        document.getElementById('panicBtn').classList.add('triggered');
    });
    
    document.getElementById('panicBtn').addEventListener('mouseup', () => {
        document.getElementById('panicBtn').classList.remove('triggered');
    });
    
    // User menu toggle (optional)
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', () => {
            document.querySelector('.user-dropdown').style.display = 
                document.querySelector('.user-dropdown').style.display === 'none' ? 'block' : 'none';
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                document.querySelector('.user-dropdown').style.display = 'none';
            }
        });
    }
}

/* ENHANCED AUDIO FEEDBACK */

// Play notification sound (system alert)
function playNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Haptic feedback for mobile devices
function triggerHapticFeedback() {
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

/* ENHANCED ALERT SYSTEM WITH ANIMATION */

// Enhanced showAlertBanner with sound and haptics
const originalShowAlertBanner = showAlertBanner;
function showAlertBanner(alertData) {
    originalShowAlertBanner(alertData);
    
    // Add sound and haptic feedback for danger alerts
    if (alertData.type === 'danger' || alertData.type === 'manual') {
        playNotificationSound();
        triggerHapticFeedback();
        document.getElementById('alertBanner').classList.add('danger');
    }
}


/* ENHANCED SETTINGS, SOS, PHOTOS & ALERTS - VERSION 2.0 */

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    console.log(`🔔 Toast [${type}]: ${message}`);
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#43a047' : '#1976d2'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
        font-weight: 600;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// REPLACE showConfigDialog - Enhanced version
function showConfigDialog() {
    console.log('📋 Opening settings dialog...');
    
    try {
        // Remove existing dialog if any
        const existingDialog = document.getElementById('configDialog');
        if (existingDialog) existingDialog.remove();
        
        const dialog = document.createElement('div');
        dialog.className = 'photo-modal';
        dialog.id = 'configDialog';
        
        const currentGeofence = state.geofenceRadius || 100;
        const currentContacts = state.emergencyContacts || [];
        
        dialog.innerHTML = `
            <div class="photo-modal-content" style="min-width: 400px;">
                <div class="photo-modal-header">
                    <h3>⚙️ ${i18n.t('config-title')}</h3>
                    <button type="button" class="photo-modal-close" aria-label="إغلاق">×</button>
                </div>
                
                <form id="configForm" class="config-form">
                    <!-- Geofence -->
                    <div class="config-form-group">
                        <label for="geofenceInput">📍 ${i18n.t('config-geofence-radius')}</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input 
                                type="number" 
                                id="geofenceInput" 
                                value="${currentGeofence}" 
                                min="50" 
                                max="500"
                                step="10"
                                required
                            >
                            <span style="font-size: 0.9rem; color: var(--text-secondary);">متر</span>
                        </div>
                    </div>
                    
                    <!-- Emergency Contacts -->
                    <div class="config-form-group">
                        <label>📞 ${i18n.t('config-emergency-contacts')}</label>
                        <div id="contactsList" class="contacts-list">
                            ${currentContacts.length > 0 
                                ? currentContacts.map((contact, i) => `
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input 
                                            type="tel" 
                                            value="${contact}" 
                                            class="contact-input"
                                            placeholder="الرقم أو البريد"
                                        >
                                        <button 
                                            type="button" 
                                            class="remove-contact-btn"
                                            style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                `).join('')
                                : '<p style="color: var(--text-secondary);">لا توجد جهات اتصال</p>'
                            }
                        </div>
                        <button 
                            type="button" 
                            id="addContactBtn"
                            class="add-contact-btn"
                        >
                            + ${i18n.t('config-add-contact')}
                        </button>
                    </div>
                    
                    <!-- Buttons -->
                    <div class="config-buttons">
                        <button 
                            type="button" 
                            id="configSaveBtn"
                            class="btn-save"
                        >
                            💾 ${i18n.t('config-save')}
                        </button>
                        <button 
                            type="button" 
                            id="configCancelBtn"
                            class="btn-cancel"
                        >
                            ✕ ${i18n.t('config-cancel')}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Close button
        dialog.querySelector('.photo-modal-close').addEventListener('click', () => {
            console.log('⬅️ Dialog closed');
            dialog.remove();
        });
        
        // Background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
        
        // Cancel button
        document.getElementById('configCancelBtn').addEventListener('click', (e) => {
            e.preventDefault();
            dialog.remove();
        });
        
        // Add contact button
        document.getElementById('addContactBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const newDiv = document.createElement('div');
            newDiv.style.display = 'flex';
            newDiv.style.gap = '10px';
            newDiv.style.alignItems = 'center';
            newDiv.innerHTML = `
                <input type="tel" class="contact-input" placeholder="الرقم أو البريد">
                <button type="button" class="remove-contact-btn" style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;">✕</button>
            `;
            document.getElementById('contactsList').appendChild(newDiv);
            newDiv.querySelector('.remove-contact-btn').addEventListener('click', (e) => {
                e.preventDefault();
                newDiv.remove();
            });
        });
        
        // Remove contact buttons
        dialog.querySelectorAll('.remove-contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btn.closest('div[style*="display: flex"]').remove();
            });
        });
        
        // Save button
        document.getElementById('configSaveBtn').addEventListener('click', (e) => {
            e.preventDefault();
            saveConfig(dialog);
        });
        
        console.log('✅ Settings dialog opened');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// REPLACE saveConfig - Enhanced version
function saveConfig(dialogElement = null) {
    console.log('💾 Saving settings...');
    
    try {
        const geofenceInput = document.getElementById('geofenceInput');
        if (!geofenceInput) throw new Error('Geofence input not found');
        
        const geofence = parseInt(geofenceInput.value) || 100;
        if (geofence < 50 || geofence > 500) throw new Error('Invalid geofence range');
        
        const contacts = Array.from(document.querySelectorAll('.contact-input'))
            .map(i => i.value.trim())
            .filter(v => v);
        
        // Update state
        state.geofenceRadius = geofence;
        state.emergencyContacts = contacts;
        
        // Save to localStorage
        localStorage.setItem('geofence-radius', geofence.toString());
        localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
        
        console.log('✅ Settings saved:', { geofence, contacts });
        
        // Close dialog
        const dialog = dialogElement || document.getElementById('configDialog');
        if (dialog) dialog.remove();
        
        showToast('✅ ' + i18n.t('config-save'), 'success');
        
        // Redraw geofence
        if (state.geofenceLayer) {
            state.geofenceLayer.clearLayers();
            const safeZone = L.circle([15.5, 32.5], {
                radius: geofence,
                color: '#43a047',
                fill: true,
                fillOpacity: 0.2,
                weight: 3,
                dashArray: '5, 5'
            }).bindPopup(`<div style="text-align:center;"><strong>${i18n.t('config-geofence-radius')}</strong><br>${geofence}m</div>`);
            
            state.geofenceLayer.addLayer(safeZone);
            console.log('🗺️ Geofence redrawn');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

// ENHANCED Emergency SOS Trigger
function triggerEmergencySOS() {
    console.log('🚨 EMERGENCY SOS!');
    
    try {
        const lat = marker.getLatLng().lat || 15.5;
        const lon = marker.getLatLng().lng || 32.5;
        
        const sosAlert = {
            id: Date.now(),
            type: 'manual',
            severity: 'danger',
            msg: i18n.t('alert-manual') || '🚨 SOS!',
            lat: lat,
            lon: lon,
            timestamp: new Date().toLocaleString(i18n.t('datetime-format')),
            hr: 130,
            device: state.currentDevice
        };
        
        // Add to list
        addAlertToList(sosAlert);
        showAlertBanner(sosAlert);
        
        // Audio & haptic
        playEmergencySound();
        triggerHapticFeedback();
        speakArabic(sosAlert.msg);
        
        // Emit to server
        if (socket && socket.emit) {
            socket.emit('panic', { device: state.currentDevice, timestamp: Date.now(), location: { lat, lon } });
        }
        
        console.log('✅ SOS triggered');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function playEmergencySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(1000, audioContext.currentTime);
        osc.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
        osc.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('❌ Sound error:', error);
    }
}

// ENHANCED Photo Evidence Display
function showPhotoEvidence(urls, gps) {
    console.log('📸 Showing photos...');
    
    try {
        const existingModal = document.getElementById('photoModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.id = 'photoModal';
        
        const timestamp = new Date().toLocaleString(i18n.t('datetime-format'));
        
        modal.innerHTML = `
            <div class="photo-modal-content">
                <div class="photo-modal-header">
                    <h3>📸 ${i18n.t('photos-title')}</h3>
                    <button type="button" class="photo-modal-close">×</button>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.9rem;">
                    <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}</p>
                    <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${timestamp}</p>
                </div>
                
                <div class="photo-grid">
                    ${urls.map((url, i) => `
                        <div class="photo-item">
                            <img src="${url}" alt="Photo ${i + 1}" loading="lazy">
                            <p>${i18n.t('photo-attacker')} ${i + 1}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button id="closePhotoBtn" style="flex: 1; padding: 10px; background: var(--border); border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">✕ Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelectorAll('.photo-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        document.getElementById('closePhotoBtn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        console.log('✅ Photo modal opened');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ENHANCED addAlertToList
function addAlertToList(data) {
    console.log('🔔 Adding alert:', data);
    
    try {
        const alertList = document.getElementById('alertList');
        const emptyState = alertList.querySelector('.empty-state');
        
        if (emptyState) emptyState.remove();
        
        const item = document.createElement('div');
        item.className = `alert-item ${data.severity || (data.type === 'danger' ? 'danger' : 'info')}`;
        item.role = 'listitem';
        
        const icon = getAlertIcon(data.type);
        
        item.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div style="flex: 1;">
                <strong>${data.msg}</strong>
                <br>
                <small style="color: var(--text-secondary);">
                    ⏰ ${data.timestamp}
                    ${data.lat && data.lon ? ` | 📍 ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}` : ''}
                </small>
            </div>
            <button class="alert-ack-btn" style="background: none; border: none; color: var(--success); cursor: pointer; padding: 5px 10px; font-weight: 600;">✓</button>
        `;
        
        alertList.insertBefore(item, alertList.firstChild);
        
        const count = alertList.querySelectorAll('.alert-item').length;
        const badge = document.getElementById('alertCount');
        if (badge) badge.textContent = count;
        
        // Ack listener
        item.querySelector('.alert-ack-btn').addEventListener('click', () => {
            console.log('✓ Alert acknowledged');
            item.classList.add('acked');
            item.style.opacity = '0.6';
        });
        
        // 5-min escalation
        setTimeout(() => {
            if (!item.classList.contains('acked')) {
                console.log('⏰ Escalation');
                triggerAlert('escalation', i18n.t('alert-escalation') || 'Escalated', data, 'danger');
            }
        }, 300000);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Keep getAlertIcon for reference
function getAlertIcon(type) {
    const icons = {
        'geofence': 'map-pin',
        'heart-rate': 'heartbeat',
        'motion': 'running',
        'manual': 'exclamation-circle',
        'escalation': 'ambulance'
    };
    return icons[type] || 'exclamation-triangle';
}

// Make functions globally available
window.showConfigDialog = showConfigDialog;
window.saveConfig = saveConfig;
window.triggerEmergencySOS = triggerEmergencySOS;
window.showPhotoEvidence = showPhotoEvidence;
window.addAlertToList = addAlertToList;
window.showToast = showToast;

/* ENHANCED SETTINGS, SOS, PHOTOS & ALERTS - VERSION 2.0 */

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    console.log(`🔔 Toast [${type}]: ${message}`);
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#43a047' : '#1976d2'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
        font-weight: 600;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// REPLACE showConfigDialog - Enhanced version
function showConfigDialog() {
    console.log('📋 Opening settings dialog...');
    
    try {
        // Remove existing dialog if any
        const existingDialog = document.getElementById('configDialog');
        if (existingDialog) existingDialog.remove();
        
        const dialog = document.createElement('div');
        dialog.className = 'photo-modal';
        dialog.id = 'configDialog';
        
        const currentGeofence = state.geofenceRadius || 100;
        const currentContacts = state.emergencyContacts || [];
        
        dialog.innerHTML = `
            <div class="photo-modal-content" style="min-width: 400px;">
                <div class="photo-modal-header">
                    <h3>⚙️ ${i18n.t('config-title')}</h3>
                    <button type="button" class="photo-modal-close" aria-label="إغلاق">×</button>
                </div>
                
                <form id="configForm" class="config-form">
                    <!-- Geofence -->
                    <div class="config-form-group">
                        <label for="geofenceInput">📍 ${i18n.t('config-geofence-radius')}</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input 
                                type="number" 
                                id="geofenceInput" 
                                value="${currentGeofence}" 
                                min="50" 
                                max="500"
                                step="10"
                                required
                            >
                            <span style="font-size: 0.9rem; color: var(--text-secondary);">متر</span>
                        </div>
                    </div>
                    
                    <!-- Emergency Contacts -->
                    <div class="config-form-group">
                        <label>📞 ${i18n.t('config-emergency-contacts')}</label>
                        <div id="contactsList" class="contacts-list">
                            ${currentContacts.length > 0 
                                ? currentContacts.map((contact, i) => `
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input 
                                            type="tel" 
                                            value="${contact}" 
                                            class="contact-input"
                                            placeholder="الرقم أو البريد"
                                        >
                                        <button 
                                            type="button" 
                                            class="remove-contact-btn"
                                            style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                `).join('')
                                : '<p style="color: var(--text-secondary);">لا توجد جهات اتصال</p>'
                            }
                        </div>
                        <button 
                            type="button" 
                            id="addContactBtn"
                            class="add-contact-btn"
                        >
                            + ${i18n.t('config-add-contact')}
                        </button>
                    </div>
                    
                    <!-- Buttons -->
                    <div class="config-buttons">
                        <button 
                            type="button" 
                            id="configSaveBtn"
                            class="btn-save"
                        >
                            💾 ${i18n.t('config-save')}
                        </button>
                        <button 
                            type="button" 
                            id="configCancelBtn"
                            class="btn-cancel"
                        >
                            ✕ ${i18n.t('config-cancel')}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Close button
        dialog.querySelector('.photo-modal-close').addEventListener('click', () => {
            console.log('⬅️ Dialog closed');
            dialog.remove();
        });
        
        // Background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
        
        // Cancel button
        document.getElementById('configCancelBtn').addEventListener('click', (e) => {
            e.preventDefault();
            dialog.remove();
        });
        
        // Add contact button
        document.getElementById('addContactBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const newDiv = document.createElement('div');
            newDiv.style.display = 'flex';
            newDiv.style.gap = '10px';
            newDiv.style.alignItems = 'center';
            newDiv.innerHTML = `
                <input type="tel" class="contact-input" placeholder="الرقم أو البريد">
                <button type="button" class="remove-contact-btn" style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;">✕</button>
            `;
            document.getElementById('contactsList').appendChild(newDiv);
            newDiv.querySelector('.remove-contact-btn').addEventListener('click', (e) => {
                e.preventDefault();
                newDiv.remove();
            });
        });
        
        // Remove contact buttons
        dialog.querySelectorAll('.remove-contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btn.closest('div[style*="display: flex"]').remove();
            });
        });
        
        // Save button
        document.getElementById('configSaveBtn').addEventListener('click', (e) => {
            e.preventDefault();
            saveConfig(dialog);
        });
        
        console.log('✅ Settings dialog opened');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// REPLACE saveConfig - Enhanced version
function saveConfig(dialogElement = null) {
    console.log('💾 Saving settings...');
    
    try {
        const geofenceInput = document.getElementById('geofenceInput');
        if (!geofenceInput) throw new Error('Geofence input not found');
        
        const geofence = parseInt(geofenceInput.value) || 100;
        if (geofence < 50 || geofence > 500) throw new Error('Invalid geofence range');
        
        const contacts = Array.from(document.querySelectorAll('.contact-input'))
            .map(i => i.value.trim())
            .filter(v => v);
        
        // Update state
        state.geofenceRadius = geofence;
        state.emergencyContacts = contacts;
        
        // Save to localStorage
        localStorage.setItem('geofence-radius', geofence.toString());
        localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
        
        console.log('✅ Settings saved:', { geofence, contacts });
        
        // Close dialog
        const dialog = dialogElement || document.getElementById('configDialog');
        if (dialog) dialog.remove();
        
        showToast('✅ ' + i18n.t('config-save'), 'success');
        
        // Redraw geofence
        if (state.geofenceLayer) {
            state.geofenceLayer.clearLayers();
            const safeZone = L.circle([15.5, 32.5], {
                radius: geofence,
                color: '#43a047',
                fill: true,
                fillOpacity: 0.2,
                weight: 3,
                dashArray: '5, 5'
            }).bindPopup(`<div style="text-align:center;"><strong>${i18n.t('config-geofence-radius')}</strong><br>${geofence}m</div>`);
            
            state.geofenceLayer.addLayer(safeZone);
            console.log('🗺️ Geofence redrawn');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

// ENHANCED Emergency SOS Trigger
function triggerEmergencySOS() {
    console.log('🚨 EMERGENCY SOS!');
    
    try {
        const lat = marker.getLatLng().lat || 15.5;
        const lon = marker.getLatLng().lng || 32.5;
        
        const sosAlert = {
            id: Date.now(),
            type: 'manual',
            severity: 'danger',
            msg: i18n.t('alert-manual') || '🚨 SOS!',
            lat: lat,
            lon: lon,
            timestamp: new Date().toLocaleString(i18n.t('datetime-format')),
            hr: 130,
            device: state.currentDevice
        };
        
        // Add to list
        addAlertToList(sosAlert);
        showAlertBanner(sosAlert);
        
        // Audio & haptic
        playEmergencySound();
        triggerHapticFeedback();
        speakArabic(sosAlert.msg);
        
        // Emit to server
        if (socket && socket.emit) {
            socket.emit('panic', { device: state.currentDevice, timestamp: Date.now(), location: { lat, lon } });
        }
        
        console.log('✅ SOS triggered');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function playEmergencySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(1000, audioContext.currentTime);
        osc.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
        osc.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('❌ Sound error:', error);
    }
}

// ENHANCED Photo Evidence Display
function showPhotoEvidence(urls, gps) {
    console.log('📸 Showing photos...');
    
    try {
        const existingModal = document.getElementById('photoModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.id = 'photoModal';
        
        const timestamp = new Date().toLocaleString(i18n.t('datetime-format'));
        
        modal.innerHTML = `
            <div class="photo-modal-content">
                <div class="photo-modal-header">
                    <h3>📸 ${i18n.t('photos-title')}</h3>
                    <button type="button" class="photo-modal-close">×</button>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.9rem;">
                    <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}</p>
                    <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${timestamp}</p>
                </div>
                
                <div class="photo-grid">
                    ${urls.map((url, i) => `
                        <div class="photo-item">
                            <img src="${url}" alt="Photo ${i + 1}" loading="lazy">
                            <p>${i18n.t('photo-attacker')} ${i + 1}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button id="closePhotoBtn" style="flex: 1; padding: 10px; background: var(--border); border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">✕ Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelectorAll('.photo-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        document.getElementById('closePhotoBtn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        console.log('✅ Photo modal opened');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ENHANCED addAlertToList
function addAlertToList(data) {
    console.log('🔔 Adding alert:', data);
    
    try {
        const alertList = document.getElementById('alertList');
        const emptyState = alertList.querySelector('.empty-state');
        
        if (emptyState) emptyState.remove();
        
        const item = document.createElement('div');
        item.className = `alert-item ${data.severity || (data.type === 'danger' ? 'danger' : 'info')}`;
        item.role = 'listitem';
        
        const icon = getAlertIcon(data.type);
        
        item.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div style="flex: 1;">
                <strong>${data.msg}</strong>
                <br>
                <small style="color: var(--text-secondary);">
                    ⏰ ${data.timestamp}
                    ${data.lat && data.lon ? ` | 📍 ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}` : ''}
                </small>
            </div>
            <button class="alert-ack-btn" style="background: none; border: none; color: var(--success); cursor: pointer; padding: 5px 10px; font-weight: 600;">✓</button>
        `;
        
        alertList.insertBefore(item, alertList.firstChild);
        
        const count = alertList.querySelectorAll('.alert-item').length;
        const badge = document.getElementById('alertCount');
        if (badge) badge.textContent = count;
        
        // Ack listener
        item.querySelector('.alert-ack-btn').addEventListener('click', () => {
            console.log('✓ Alert acknowledged');
            item.classList.add('acked');
            item.style.opacity = '0.6';
        });
        
        // 5-min escalation
        setTimeout(() => {
            if (!item.classList.contains('acked')) {
                console.log('⏰ Escalation');
                triggerAlert('escalation', i18n.t('alert-escalation') || 'Escalated', data, 'danger');
            }
        }, 300000);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Keep getAlertIcon for reference
function getAlertIcon(type) {
    const icons = {
        'geofence': 'map-pin',
        'heart-rate': 'heartbeat',
        'motion': 'running',
        'manual': 'exclamation-circle',
        'escalation': 'ambulance'
    };
    return icons[type] || 'exclamation-triangle';
}

// Make functions globally available
window.showConfigDialog = showConfigDialog;
window.saveConfig = saveConfig;
window.triggerEmergencySOS = triggerEmergencySOS;
window.showPhotoEvidence = showPhotoEvidence;
window.addAlertToList = addAlertToList;
window.showToast = showToast;

