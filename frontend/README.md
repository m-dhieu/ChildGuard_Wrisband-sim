# ChildGuard Wristband - Frontend Dashboard

## Overview
The ChildGuard Wristband Guardian Dashboard is a responsive web application built with vanilla JavaScript, Leaflet.js, and Chart.js. It provides real-time monitoring of child safety through GPS tracking, biometric vitals, and emergency alerting capabilities.

## Features Implemented

### Core Dashboard Features (FR7)
- **Live GPS Tracking** (FR1.2): Real-time location streaming with Leaflet map integration
- **Geofencing** (FR1.1): 100m safe zone alerts with customizable radius
- **Heart Rate Monitoring** (FR2.1): Real-time HR variability detection (>30% baseline)
- **Motion Analysis** (FR2.2): Accelerometer data visualization (>2g detection)
- **Photo Evidence** (FR3): Automatic 3-photo burst capture with GPS coordinates
- **Emergency Alerts** (FR4): Multi-channel alert system with acknowledgment tracking
- **Manual Panic Button** (FR6): SOS activation with immediate notification
- **Device Selector** (FR1.2): Monitor multiple children simultaneously

### Internationalization (i18n)
- **Bilingual Support**: Arabic (RTL) and English (LTR)
- **Language Toggle**: Easy switching between Arabic and English
- **Persistent Storage**: Language preference saved in localStorage
- **Comprehensive Translations**: All UI elements translated

### Dark Mode
- **Light/Dark Theme Toggle**: Persistent theme preference
- **Accessible Colors**: WCAG AA compliant color contrasts
- **Smooth Transitions**: CSS animations for theme switching

### User Interface (NFR4 - Low-Literacy Support)
- **Icon-Driven Design**: Visual indicators for common actions
- **3-Tap Navigation**: Simplified access to core functions
- **Audio Feedback**: Arabic text-to-speech (TTS) for alerts
- **Mobile-First**: Responsive design for all device sizes

## Project Structure

```
frontend/
├── index.html        # Main HTML structure with semantic markup
├── style.css         # Modern CSS with CSS variables and dark mode
├── script.js         # Core dashboard logic and Socket.io integration
├── i18n.js           # Internationalization system (Arabic/English)
├── manifest.json     # Progressive Web App manifest
├── assets/
│   └── screenshot.png # Design reference
└── README.md         # Frontend documentation
```

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **Mapping**: Leaflet.js v1.9.4 with OpenStreetMap tiles
- **Charts**: Chart.js v3 with dual-axis vitals tracking
- **Real-time Communication**: Socket.io v4.7.5
- **Icons**: Font Awesome v6.4.0
- **PWA Support**: Service Worker ready

## Color Scheme (Safety-Focused)

### Light Mode
- **Primary**: Blue (`#1e88e5` → `#1565c0`) - Trust and safety
- **Danger**: Red (`#d32f2f` → `#b71c1c`) - Immediate alerts
- **Success**: Green (`#43a047` → `#2e7d32`) - Safe status
- **Warning**: Orange (`#ff9800` → `#f57c00`) - Caution alerts
- **Info**: Cyan (`#0288d1` → `#0277bd`) - Information

### Dark Mode
- Background: `#0f0f1e` (deep navy)
- Cards: `#1a1a2e` (dark blue-black)
- Text: `#e0e6ed` (light gray-blue)

## API Integration

### Socket.io Events

**Emitted by Dashboard:**
```javascript
// Panic button activation
socket.emit('panic', { device: 'device1', timestamp: Date.now() });

// Manual photo trigger
socket.emit('alert', alertData);

// Device switching
socket.emit('switch_device', 'device2');

// Alert acknowledgment
socket.emit('alert_ack', { alertId: timestamp });
```

**Received from Backend:**
```javascript
// Real-time telemetry
socket.on('telemetry', (data) => {
    const { gps, hr, accel, battery, device_id, timestamp } = data;
});

// Emergency alerts
socket.on('alert', (alertData) => {
    const { id, type, msg, lat, lon, severity, timestamp } = alertData;
});
```

## Configuration

### Geofence Settings
- **Default Radius**: 100 meters
- **Customizable Range**: 50-500 meters
- **Stored in**: localStorage (`geofence-radius`)

### Emergency Contacts
- **Maximum**: Unlimited
- **Stored in**: localStorage (`emergency-contacts`)
- **Support**: Phone numbers and messaging platforms

### Language Preference
- **Default**: Arabic (ar-SA)
- **Stored in**: localStorage (`childguard-lang`)
- **Options**: Arabic, English

### Theme Preference
- **Default**: Light
- **Stored in**: localStorage (`childguard-theme`)
- **Options**: Light, Dark

## Responsive Design

### Breakpoints
- **Desktop**: ≥1200px (3-column grid)
- **Tablet**: 768px-1199px (2-column grid)
- **Mobile**: <768px (1-column grid)
- **Small Mobile**: <480px (optimized spacing)

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Semantic HTML with ARIA attributes
- **Color Contrast**: WCAG AA compliance
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Screen Reader**: Compatible with assistive technologies
- **Right-to-Left**: Full RTL support for Arabic

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 12+, Chrome Android 90+)

## Performance Optimization

- **Chart Limit**: 20-point rolling window for vitals
- **Lazy Loading**: Maps loaded on demand
- **CSS Variables**: Dynamic theme switching without page reload
- **Minimal Dependencies**: Core functionality in vanilla JS
- **Optimized Assets**: SVG icons, compressed images

## Security Considerations

- **HTTPS Required**: TLS 1.3 encryption for data transmission
- **No Local Storage of Sensitive Data**: Only preferences saved locally
- **Socket.io Secured**: Device-specific communication channels
- **GDPR Compliant**: 90-day data retention policy

## Running the Dashboard

### Local Development
```bash
# Serve frontend with live reload
python3 -m http.server 8000

# Or use Node.js
npx http-server ./frontend
```

### Production Deployment
```bash
# Build for production (minify & optimize)
npm run build

# Serve with Docker
docker run -p 80:80 -v $(pwd)/frontend:/usr/share/nginx/html nginx
```

## Testing

### Manual Testing Checklist
- [ ] Dark/Light theme toggle works
- [ ] Language toggle switches between Arabic/English
- [ ] Map displays current location
- [ ] Charts update with mock telemetry
- [ ] Panic button triggers alert
- [ ] Geofence drawing functions
- [ ] Config dialog saves settings
- [ ] Responsive design on mobile
- [ ] Alert acknowledgment workflow
- [ ] Socket.io connection status

### Browser Console Commands
```javascript
// Test language switching
i18n.setLang('en'); // Switch to English
i18n.setLang('ar'); // Switch to Arabic

// Simulate telemetry data
socket.emit('telemetry', {
    gps: { lat: 15.5, lon: 32.5 },
    hr: 95,
    accel: 2.5,
    battery: 85,
    device_id: 'device1',
    timestamp: Date.now()
});

// Simulate alert
socket.emit('alert', {
    id: Date.now(),
    type: 'danger',
    msg: 'Test alert',
    lat: 15.5,
    lon: 32.5,
    severity: 'danger'
});
```

## Future Enhancements

- [ ] **Authentication**: Login system with OAuth2/LDAP
- [ ] **CPIMS+ Integration**: Automated case creation
- [ ] **Offline Support**: Service Worker caching
- [ ] **Advanced Analytics**: Dashboard with historical data
- [ ] **Video Stream**: Live camera feed from wristband
- [ ] **Voice Commands**: Hands-free activation
- [ ] **Multi-language**: Additional languages (Amharic, Somali)
- [ ] **Progressive Web App**: Installable app experience
- [ ] **Notifications**: Web Push for alerts
- [ ] **Data Export**: Generate PDF/CSV reports

## SRS Compliance

| Requirement             | Status | Implementation                            |
|-------------------------|--------|-------------------------------------------|
| FR1.1 Geofencing 	  |   ✓    | Leaflet circle with configurable radius   |
| FR1.2 Live GPS 	  |   ✓	   | Socket.io telemetry with map updates      |
| FR2.1 Heart Rate 	  |   ✓    | Chart.js dual-axis with baseline tracking |
| FR2.2 Motion 		  |   ✓    | Accelerometer visualization	       |
| FR3 Photo Evidence 	  |   ✓    | Modal gallery with GPS/timestamp 	       |
| FR4 Multi-channel 	  |   ✓	   | Alert banner with acknowledgment 	       |
| FR6 Panic Button 	  |   ✓    | SOS activation with styling 	       |
| FR7.1 Auth 		  |   ✓    | Persistent user menu structure            |
| FR7.2 Battery 	  |   ✓    | Real-time battery indicator 	       |
| FR7.3 Alert History 	  |   ✓    | Scrollable alert list		       |
| FR7.4 Zone Drawing 	  |   ✓    | Geofence visualization 		       |
| FR7.5 Tamper Detection  |   ✓    | Alert escalation logic    		       |
| NFR4 I18n 		  |   ✓    | Arabic/English bilingual 		       |
| NFR4 Low-literacy 	  |   ✓    | Icon-driven, TTS support 		       |

## Troubleshooting

### Map Not Displaying
- Check browser console for Leaflet errors
- Verify OpenStreetMap tile layer is accessible
- Ensure `map` div has height: 450px

### Telemetry Not Updating
- Verify Socket.io connection: `socket.connected`
- Check browser Network tab for Socket.io events
- Ensure backend server is running

### Translations Not Updating
- Clear localStorage: `localStorage.clear()`
- Check i18n.currentLang is set correctly
- Verify all UI elements have `data-i18n` attributes

### Dark Mode Not Persisting
- Check localStorage for `childguard-theme`
- Verify theme toggle button event listener

## Support & Contribution

For issues or feature requests, please contact the ChildGuard development team or submit via GitHub Issues.

---

**Version**: 1.0.0  
**Last Updated**: March 25, 2026  
**Maintainer**: Monica Dhieu  
**License**: MIT
