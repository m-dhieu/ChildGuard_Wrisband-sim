// ENHANCED CHILDGUARD DASHBOARD - SETTINGS, SOS, PHOTOS & ALERTS FIX

// IMPROVED CONFIG DIALOG WITH PROPER ERROR HANDLING

function showConfigDialog() {
    console.log('📋 Opening config dialog...');
    
    try {
        const dialog = document.createElement('div');
        dialog.className = 'photo-modal';
        dialog.id = 'configDialog';
        
        // Load current values or defaults
        const currentGeofence = state.geofenceRadius || 100;
        const currentContacts = state.emergencyContacts || [];
        
        dialog.innerHTML = `
            <div class="photo-modal-content" style="min-width: 400px;">
                <div class="photo-modal-header">
                    <h3>${i18n.t('config-title')}</h3>
                    <button type="button" class="photo-modal-close" aria-label="إغلاق">×</button>
                </div>
                
                <form id="configForm" class="config-form">
                    <!-- Geofence Radius Section -->
                    <div class="config-form-group">
                        <label for="geofenceInput">
                            ${i18n.t('config-geofence-radius')}
                        </label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input 
                                type="number" 
                                id="geofenceInput" 
                                value="${currentGeofence}" 
                                min="50" 
                                max="500"
                                step="10"
                                aria-label="${i18n.t('config-geofence-radius')}"
                                required
                            >
                            <span style="font-size: 0.9rem; color: var(--text-secondary);">متر</span>
                        </div>
                        <small style="color: var(--text-secondary); margin-top: 5px;">
                            يتم إرسال تنبيه عند مغادرة الطفل المنطقة الآمنة
                        </small>
                    </div>
                    
                    <!-- Emergency Contacts Section -->
                    <div class="config-form-group">
                        <label>
                            ${i18n.t('config-emergency-contacts')}
                        </label>
                        <div id="contactsList" class="contacts-list">
                            ${currentContacts.length > 0 
                                ? currentContacts.map((contact, i) => `
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input 
                                            type="tel" 
                                            value="${contact}" 
                                            class="contact-input"
                                            placeholder="الرقم أو البريد الإلكتروني"
                                            aria-label="جهة اتصال طارئة ${i + 1}"
                                        >
                                        <button 
                                            type="button" 
                                            class="remove-contact-btn"
                                            title="حذف جهة الاتصال"
                                            style="
                                                background: var(--danger);
                                                color: white;
                                                border: none;
                                                border-radius: 4px;
                                                padding: 8px 12px;
                                                cursor: pointer;
                                                font-weight: 600;
                                            "
                                        >
                                            ✕
                                        </button>
                                    </div>
                                `).join('')
                                : '<p style="color: var(--text-secondary); font-size: 0.9rem;">لا توجد جهات اتصال. أضف جهة اتصال طارئة.</p>'
                            }
                        </div>
                        <button 
                            type="button" 
                            id="addContactBtn"
                            class="add-contact-btn"
                            aria-label="${i18n.t('config-add-contact')}"
                        >
                            + ${i18n.t('config-add-contact')}
                        </button>
                    </div>
                    
                    <!-- Save/Cancel Buttons -->
                    <div class="config-buttons">
                        <button 
                            type="button" 
                            id="configSaveBtn"
                            class="btn-save"
                            aria-label="${i18n.t('config-save')}"
                        >
                            💾 ${i18n.t('config-save')}
                        </button>
                        <button 
                            type="button" 
                            id="configCancelBtn"
                            class="btn-cancel"
                            aria-label="${i18n.t('config-cancel')}"
                        >
                            ✕ ${i18n.t('config-cancel')}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event Listeners
        
        // Close button (X)
        dialog.querySelector('.photo-modal-close').addEventListener('click', () => {
            console.log('⬅️ Closing config dialog (close button)');
            dialog.remove();
        });
        
        // Background click to close
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                console.log('⬅️ Closing config dialog (background click)');
                dialog.remove();
            }
        });
        
        // Cancel button
        document.getElementById('configCancelBtn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('⬅️ Closing config dialog (cancel button)');
            dialog.remove();
        });
        
        // Add contact button
        document.getElementById('addContactBtn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('➕ Adding new contact input');
            const newContactDiv = document.createElement('div');
            newContactDiv.style.display = 'flex';
            newContactDiv.style.gap = '10px';
            newContactDiv.style.alignItems = 'center';
            newContactDiv.innerHTML = `
                <input 
                    type="tel" 
                    class="contact-input"
                    placeholder="الرقم أو البريد الإلكتروني"
                    aria-label="جهة اتصال طارئة جديدة"
                >
                <button 
                    type="button" 
                    class="remove-contact-btn"
                    title="حذف جهة الاتصال"
                    style="
                        background: var(--danger);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 12px;
                        cursor: pointer;
                        font-weight: 600;
                    "
                >
                    ✕
                </button>
            `;
            document.getElementById('contactsList').appendChild(newContactDiv);
            
            // Add listener for new remove button
            newContactDiv.querySelector('.remove-contact-btn').addEventListener('click', (e) => {
                e.preventDefault();
                console.log('➖ Removing contact');
                newContactDiv.remove();
            });
        });
        
        // Remove contact buttons
        dialog.querySelectorAll('.remove-contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('➖ Removing contact');
                btn.closest('div[style*="display: flex"]').remove();
            });
        });
        
        // Save button
        document.getElementById('configSaveBtn').addEventListener('click', (e) => {
            e.preventDefault();
            saveConfig(dialog);
        });
        
        console.log('✅ Config dialog opened successfully');
        
    } catch (error) {
        console.error('❌ Error opening config dialog:', error);
        alert('Error opening settings: ' + error.message);
    }
}

function saveConfig(dialogElement = null) {
    console.log('💾 Saving config...');
    
    try {
        // Get geofence value
        const geofenceInput = document.getElementById('geofenceInput');
        if (!geofenceInput) {
            throw new Error('Geofence input not found');
        }
        
        const geofence = parseInt(geofenceInput.value) || 100;
        
        // Validate geofence range
        if (geofence < 50 || geofence > 500) {
            throw new Error('Geofence must be between 50-500 meters');
        }
        
        // Get contacts
        const contactInputs = document.querySelectorAll('.contact-input');
        const contacts = Array.from(contactInputs)
            .map(input => input.value.trim())
            .filter(contact => contact.length > 0);
        
        console.log('📊 Config values:', { geofence, contacts });
        
        // Update state
        state.geofenceRadius = geofence;
        state.emergencyContacts = contacts;
        
        // Save to localStorage
        localStorage.setItem('geofence-radius', geofence.toString());
        localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
        
        console.log('✅ Config saved successfully');
        console.log('📍 Geofence radius:', geofence, 'meters');
        console.log('📞 Emergency contacts:', contacts);
        
        // Close dialog
        const dialog = dialogElement || document.getElementById('configDialog');
        if (dialog) {
            dialog.remove();
        }
        
        // Show success message
        const successMsg = i18n.t('config-save') + ' ✅';
        console.log('✅', successMsg);
        
        // Show toast notification
        showToast(successMsg, 'success');
        
        // Redraw geofence if it exists
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
            console.log('🗺️ Geofence redrawn on map');
        }
        
    } catch (error) {
        console.error('❌ Error saving config:', error);
        showToast('Error saving settings: ' + error.message, 'error');
    }
}

// EMERGENCY SOS BUTTON (PANIC BUTTON)

function triggerEmergencySOS() {
    console.log('🚨 EMERGENCY SOS TRIGGERED!');
    
    try {
        // Get current location or use default
        const lat = marker.getLatLng().lat || 15.5;
        const lon = marker.getLatLng().lng || 32.5;
        
        // Create SOS alert
        const sosAlert = {
            id: Date.now(),
            type: 'manual',
            severity: 'danger',
            msg: i18n.t('alert-manual') || '🚨 Manual SOS activated!',
            lat: lat,
            lon: lon,
            timestamp: new Date().toLocaleString(i18n.t('datetime-format')),
            hr: Math.floor(Math.random() * 50) + 120, // Higher HR for emergency
            device: state.currentDevice
        };
        
        console.log('📋 SOS Alert:', sosAlert);
        
        // Add to alerts list
        addAlertToList(sosAlert);
        
        // Show alert banner
        showAlertBanner(sosAlert);
        
        // Play emergency sound
        playEmergencySound();
        
        // Trigger haptic feedback
        triggerHapticFeedback();
        
        // Speak Arabic warning
        speakArabic(sosAlert.msg);
        
        // Emit to server via Socket.io
        if (socket && socket.emit) {
            socket.emit('panic', { 
                device: state.currentDevice, 
                timestamp: Date.now(),
                location: { lat, lon }
            });
            console.log('📡 SOS sent to server');
        }
        
        // Send to emergency contacts if available
        if (state.emergencyContacts && state.emergencyContacts.length > 0) {
            console.log('📞 Notifying emergency contacts:', state.emergencyContacts);
            notifyEmergencyContacts(sosAlert);
        }
        
        // Visual feedback
        const panicBtn = document.getElementById('panicBtn');
        if (panicBtn) {
            panicBtn.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                panicBtn.style.animation = '';
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Error triggering SOS:', error);
        showToast('Error triggering SOS: ' + error.message, 'error');
    }
}

function playEmergencySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Emergency siren pattern: high-low-high
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('🔊 Emergency sound played');
    } catch (error) {
        console.error('❌ Error playing emergency sound:', error);
    }
}

function notifyEmergencyContacts(sosAlert) {
    console.log('📞 Attempting to notify emergency contacts:', state.emergencyContacts);
    
    state.emergencyContacts.forEach((contact, index) => {
        setTimeout(() => {
            console.log(`✉️ Notification sent to ${contact}`);
            // In production, this would call:
            // fetch('/api/notify-emergency-contact', {...})
        }, index * 200); // Stagger notifications
    });
}

// PHOTO EVIDENCE CAPTURE

function showPhotoEvidence(urls, gps) {
    console.log('📸 Showing photo evidence...');
    
    try {
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.id = 'photoModal';
        
        const timestamp = new Date().toLocaleString(i18n.t('datetime-format'));
        
        modal.innerHTML = `
            <div class="photo-modal-content">
                <div class="photo-modal-header">
                    <h3>📸 ${i18n.t('photos-title')}</h3>
                    <button type="button" class="photo-modal-close" aria-label="إغلاق">×</button>
                </div>
                
                <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <p style="margin: 0.5rem 0; font-size: 0.95rem;">
                        <strong>📍 ${i18n.t('photo-location')}:</strong> 
                        <code style="background: var(--bg-primary); padding: 2px 6px; border-radius: 3px;">
                            ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}
                        </code>
                    </p>
                    <p style="margin: 0.5rem 0; font-size: 0.95rem;">
                        <strong>⏰ ${i18n.t('photo-time')}:</strong> ${timestamp}
                    </p>
                </div>
                
                <div class="photo-grid">
                    ${urls.map((url, i) => `
                        <div class="photo-item">
                            <img 
                                src="${url}" 
                                alt="${i18n.t('photo-attacker')} ${i + 1}"
                                loading="lazy"
                            >
                            <p>${i18n.t('photo-attacker')} ${i + 1}</p>
                            <small style="color: var(--text-secondary);">
                                ${(i + 1) * 100}ms after alert
                            </small>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">
                    <button 
                        type="button" 
                        id="downloadPhotosBtn"
                        style="
                            flex: 1;
                            padding: var(--spacing-md);
                            background: var(--info);
                            color: white;
                            border: none;
                            border-radius: var(--radius-md);
                            cursor: pointer;
                            font-weight: 600;
                        "
                    >
                        ⬇️ تحميل الصور
                    </button>
                    <button 
                        type="button" 
                        class="photo-modal-close"
                        style="
                            flex: 1;
                            padding: var(--spacing-md);
                            background: var(--border);
                            color: var(--text);
                            border: none;
                            border-radius: var(--radius-md);
                            cursor: pointer;
                            font-weight: 600;
                        "
                    >
                        ✕ إغلاق
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelectorAll('.photo-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('⬅️ Closing photo modal');
                modal.remove();
            });
        });
        
        // Background click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('⬅️ Closing photo modal (background)');
                modal.remove();
            }
        });
        
        // Download handler
        document.getElementById('downloadPhotosBtn').addEventListener('click', () => {
            console.log('⬇️ Downloading photos');
            urls.forEach((url, i) => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `photo-${i + 1}-${Date.now()}.jpg`;
                a.click();
            });
        });
        
        console.log('✅ Photo evidence modal opened');
        
    } catch (error) {
        console.error('❌ Error showing photo evidence:', error);
        showToast('Error showing photos: ' + error.message, 'error');
    }
}

// ALERT SYSTEM

function addAlertToList(data) {
    console.log('🔔 Adding alert to list:', data);
    
    try {
        const alertList = document.getElementById('alertList');
        const emptyState = alertList.querySelector('.empty-state');
        
        // Remove empty state if it exists
        if (emptyState) {
            emptyState.remove();
        }
        
        const item = document.createElement('div');
        item.className = `alert-item ${data.severity || (data.type === 'danger' ? 'danger' : data.type === 'geofence' ? 'geofence' : 'info')}`;
        item.setAttribute('role', 'listitem');
        item.setAttribute('tabindex', '0');
        
        const alertIcon = getAlertIcon(data.type);
        
        item.innerHTML = `
            <i class="fas fa-${alertIcon}" aria-hidden="true"></i>
            <div style="flex: 1;">
                <strong>${data.msg}</strong>
                <br>
                <small style="color: var(--text-secondary);">
                    ⏰ ${data.timestamp}
                    ${data.lat && data.lon ? ` | 📍 ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}` : ''}
                </small>
            </div>
            <button 
                class="alert-ack-btn" 
                title="تأكيد التنبيه"
                aria-label="تأكيد التنبيه"
                style="
                    background: none;
                    border: none;
                    color: var(--success);
                    cursor: pointer;
                    font-weight: 600;
                    padding: 5px 10px;
                "
            >
                ✓
            </button>
        `;
        
        // Add to top of list
        alertList.insertBefore(item, alertList.firstChild);
        
        // Update alert count
        const alertCount = alertList.querySelectorAll('.alert-item').length;
        const countBadge = document.getElementById('alertCount');
        if (countBadge) {
            countBadge.textContent = alertCount;
        }
        
        // Add acknowledgment listener
        item.querySelector('.alert-ack-btn').addEventListener('click', () => {
            console.log('✓ Alert acknowledged');
            item.classList.add('acked');
            item.style.opacity = '0.6';
        });
        
        // Add escalation timer (5 minutes)
        setTimeout(() => {
            if (!item.classList.contains('acked')) {
                console.log('⏰ Alert escalation triggered (5 min timeout)');
                triggerAlert(
                    'escalation', 
                    i18n.t('alert-escalation') || 'Escalation: Alert not acknowledged',
                    data,
                    'danger'
                );
            }
        }, 300000); // 5 minutes
        
        console.log('✅ Alert added to list');
        
    } catch (error) {
        console.error('❌ Error adding alert to list:', error);
    }
}

function getAlertIcon(type) {
    const icons = {
        'geofence': 'map-pin',
        'heart-rate': 'heartbeat',
        'motion': 'running',
        'manual': 'hand-paper',
        'escalation': 'ambulance',
        'panic': 'exclamation-circle'
    };
    return icons[type] || 'exclamation-triangle';
}

// UTILITY FUNCTIONS

function showToast(message, type = 'info') {
    console.log(`🔔 Toast [${type}]: ${message}`);
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--info)'};
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

// Export functions for global use
window.showConfigDialog = showConfigDialog;
window.saveConfig = saveConfig;
window.triggerEmergencySOS = triggerEmergencySOS;
window.showPhotoEvidence = showPhotoEvidence;
window.showToast = showToast;
