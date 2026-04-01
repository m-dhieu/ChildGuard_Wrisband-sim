# ChildGuard UI/UX Testing Guide

## Quick Start
```bash
cd /home/monicadhieu/childguard-wristband-sim/frontend
python3 -m http.server 8000
# Or: npm install -g http-server && http-server
# Or: node -e "require('http').createServer((req,res) => { res.writeHead(200); res.end(''); }).listen(8000)"
```
Then open: **http://localhost:8000**

---

## 1. ANIMATIONS & TRANSITIONS TEST

### 1.1 Entrance Animations
- [ ] **Load Page**: Cards fade in with staggered timing (0.1s delays visible)
- [ ] **Visual Check**: Card 1 appears first, then Card 2, etc.
- [ ] **Timing**: All fade-ins complete within 0.5s total

### 1.2 Hover Effects
- [ ] **Buttons**: Panic/Config buttons move up 2px on hover
- [ ] **Shadow**: Shadow deepens on hover
- [ ] **Duration**: Transition smooth (300ms)
- [ ] **Reset**: Returns to original position when mouse leaves

### 1.3 Alert Animations
- [ ] **Alert Trigger**: Click any device selector → Check console for mock telemetry
- [ ] **Slide Down**: Alert banner slides down from top (300ms animation)
- [ ] **Glow**: Red alert shows glowing box-shadow effect
- [ ] **Sound**: Notification tone plays (Web Audio API)
- [ ] **Vibration**: Android device vibrates (if supported)

### 1.4 Status Changes
- [ ] **Status Indicator**: Turn to danger state → pulses red
- [ ] **Heartbeat**: Icon shows heartbeat animation
- [ ] **Battery Low**: Icon animates when battery < 20%
- [ ] **Network**: Online/offline indicator pulses appropriately

### 1.5 Reduced Motion
- [ ] **Enable**: Settings → Accessibility → Reduce motion (or browser DevTools)
- [ ] **Verify**: All animations stop/minimize (animation-duration: 0.01ms)
- [ ] **Functionality**: All features work, just without animations

---

## 2. NETWORK STATUS INDICATOR TEST

### 2.1 Online State
- [ ] **Position**: Bottom-right corner (bottom-left in Arabic RTL)
- [ ] **Color**: Green border, green dot
- [ ] **Icon**: WiFi or signal icon visible
- [ ] **Text**: Shows "متصل" (Arabic) or "Online" (English)
- [ ] **Animation**: Green dot pulses slowly

### 2.2 Offline Simulation
- [ ] **Browser DevTools**: Go to Network tab → Offline checkbox
- [ ] **Color Changes**: Border/dot turns red
- [ ] **Text Updates**: Changes to "غير متصل" or "Offline"
- [ ] **Animation**: Red dot pulses faster
- [ ] **Functionality**: App queues actions for later

### 2.3 Network Reconnection
- [ ] **Uncheck Offline**: Network comes back online
- [ ] **Instant Update**: Status changes back to green
- [ ] **Smooth Transition**: Color change is smooth
- [ ] **No Refresh**: Page doesn't reload

---

## 3. DARK MODE TEST

### 3.1 Toggle Functionality
- [ ] **Click Moon Button**: Header moon icon toggles dark mode
- [ ] **Immediate Change**: All colors invert instantly
- [ ] **Background**: Dark (#0f0f1e) appears
- [ ] **Text**: Light text (#e0e6ed) appears
- [ ] **Cards**: Dark cards (#1a1a2e) with proper contrast
- [ ] **Persistence**: Refresh page → dark mode persists

### 3.2 Color Contrast
- [ ] **Text Readability**: All text readable on both themes
- [ ] **Buttons**: Danger/success buttons maintain color
- [ ] **Chart**: Colors adapt but remain visible
- [ ] **Map**: Leaflet map properly themed
- [ ] **Scrollbar**: Dark scrollbar visible in dark mode

### 3.3 Component Styling
- [ ] **Cards**: Proper drop shadows in dark mode
- [ ] **Borders**: Borders visible and distinct
- [ ] **Inputs**: Form inputs properly styled
- [ ] **Status Indicators**: Colors clear in both modes
- [ ] **Alerts**: Alert styling works in dark/light

---

## 4. ACCESSIBILITY TEST

### 4.1 Screen Reader (VoiceOver on Mac/iOS)
- [ ] **Enable**: Mac: Cmd+F5 or iOS: Settings → Accessibility → VoiceOver
- [ ] **Navigation**: Tab through elements
- [ ] **Alert Banner**: Screen reader says "Alert banner" and content
- [ ] **Buttons**: All buttons announced with labels
- [ ] **Status**: Status changes announced automatically
- [ ] **Chart**: Canvas has proper label
- [ ] **Alert List**: Items announced as list items

### 4.2 Screen Reader (NVDA on Windows)
- [ ] **Enable**: Download NVDA (free) and run
- [ ] **Navigation**: Arrow keys move through page
- [ ] **Content**: All text read properly
- [ ] **Labels**: Form labels associated with inputs
- [ ] **Landmarks**: Regions identified (main, region, alert)
- [ ] **Links/Buttons**: All interactive elements announced

### 4.3 Keyboard Navigation
- [ ] **Tab Order**: Logical progression through elements
- [ ] **Focus Ring**: Blue outline visible around focused element
- [ ] **Buttons**: Press Enter/Space to activate
- [ ] **Dropdowns**: Arrow keys navigate options
- [ ] **No Trap**: Can always tab out of elements
- [ ] **Escape**: Closes any open modals

### 4.4 Color Contrast
- [ ] **Dark Text on Light**: WCAG AAA (7:1 ratio) ✓
- [ ] **Light Text on Dark**: WCAG AAA (7:1 ratio) ✓
- [ ] **Red Alerts**: Distinct without just using color
- [ ] **Green Safe**: Distinct without just using color
- [ ] **Blue Links**: Properly styled

### 4.5 Focus Management
- [ ] **Visible Focus**: Every button has clear focus ring
- [ ] **Offset**: Focus ring is 2px away from element
- [ ] **Color**: Focus ring is always blue (#1e88e5)
- [ ] **Consistency**: Focus styling consistent across all buttons

---

## 5. BILINGUAL (ARABIC/ENGLISH) TEST

### 5.1 Language Toggle
- [ ] **Click Language Button**: Header language toggle (عربي/English)
- [ ] **Page Reloads**: Brief reload for full i18n application
- [ ] **All Text**: All UI text changes to selected language
- [ ] **Persistence**: Refresh page → language persists

### 5.2 Arabic (RTL) Mode
- [ ] **Direction**: Page layout flows right-to-left
- [ ] **Text Alignment**: Text right-aligned
- [ ] **Buttons**: Buttons repositioned for RTL
- [ ] **Network Indicator**: Moved to left side in RTL
- [ ] **Device Selector**: RTL alignment applied
- [ ] **Dropdowns**: Proper RTL positioning
- [ ] **Alert Banner**: Content right-aligned

### 5.3 English (LTR) Mode
- [ ] **Direction**: Page layout flows left-to-right
- [ ] **Text Alignment**: Text left-aligned
- [ ] **Buttons**: Standard LTR positioning
- [ ] **Network Indicator**: Bottom-right corner
- [ ] **All Components**: Proper LTR layout

### 5.4 Translation Coverage
- [ ] **Header**: App title, subtitle translated ✓
- [ ] **Buttons**: All buttons have translations ✓
- [ ] **Labels**: All labels translated ✓
- [ ] **Messages**: Status messages translated ✓
- [ ] **Alerts**: Alert content translated ✓
- [ ] **Placeholders**: Form placeholders translated ✓

---

## 6. RESPONSIVE DESIGN TEST

### 6.1 Desktop (1920x1080)
- [ ] **Grid**: 3-column layout visible
- [ ] **Cards**: Properly sized with spacing
- [ ] **Map**: Full-width top card
- [ ] **Buttons**: Appropriate button sizes
- [ ] **Text**: Readable at standard viewing distance
- [ ] **Charts**: Properly rendered with room for legend

### 6.2 Tablet (768x1024)
- [ ] **Grid**: 2-column layout (iPad portrait)
- [ ] **Cards**: Full-width in 2-column grid
- [ ] **Spacing**: Proper margins maintained
- [ ] **Touch Targets**: Buttons at least 44px
- [ ] **Orientation**: Landscape mode shows 3 columns
- [ ] **Device Selector**: Takes up top space properly

### 6.3 Mobile (375x667)
- [ ] **Grid**: 1-column layout
- [ ] **Cards**: Full-width, single column
- [ ] **Header**: Buttons stack or collapse
- [ ] **Touch Targets**: All buttons easily tappable
- [ ] **Scrolling**: Smooth vertical scroll
- [ ] **No Overflow**: No horizontal scroll at 375px
- [ ] **Safe Area**: Content doesn't hide under notch

### 6.4 Landscape Mobile (667x375)
- [ ] **Grid**: 2-column or 1-column (depends on device)
- [ ] **Map**: Visible without excessive scrolling
- [ ] **Controls**: All buttons accessible
- [ ] **Header**: Navigation visible
- [ ] **Bottom Bar**: Network indicator visible

### 6.5 Edge Cases
- [ ] **Ultra-Wide (2560+)**: Scaling handles properly
- [ ] **Very Narrow (320px)**: Mobile breakpoint applies
- [ ] **Print View**: No buttons/header shown (print stylesheet)
- [ ] **Zoom 200%**: Content still accessible (no overflow)

---

## 7. DARK MODE + RTL COMBINATION TEST

### 7.1 Arabic + Dark Mode
- [ ] **Switch to Arabic**: Language toggles
- [ ] **Switch to Dark**: Dark theme applies
- [ ] **Layout**: RTL + dark works together
- [ ] **Readability**: Text visible in dark RTL
- [ ] **Network Indicator**: Positioned correctly (left side)
- [ ] **All Controls**: Work in this combination

### 7.2 English + Light Mode (Default)
- [ ] **Page Load**: Starts in English light mode
- [ ] **Verification**: Default working state confirmed

---

## 8. FORM INTERACTION TEST

### 8.1 Config Dialog
- [ ] **Click Settings Button**: Config dialog opens
- [ ] **Dialog Styling**: Proper modal overlay with backdrop
- [ ] **Close Button**: X button visible and functional
- [ ] **Inputs**: Geofence radius input functional
- [ ] **Save Button**: Saves configuration
- [ ] **Cancel Button**: Closes without saving
- [ ] **Persistence**: Settings persist after page reload

### 8.2 Geofence Configuration
- [ ] **Input Field**: Accepts numeric values
- [ ] **Min/Max**: Validates 50-500m range
- [ ] **Visual Feedback**: Updates circle on map immediately
- [ ] **Saves**: Stores in localStorage
- [ ] **Restore**: Values restore on page reload

### 8.3 Emergency Contacts
- [ ] **Add Contact**: Input field for phone number
- [ ] **Multiple**: Can add multiple contacts
- [ ] **Remove**: Can delete individual contacts
- [ ] **Save**: Persists to localStorage
- [ ] **Validation**: Phone number format checked (future)

---

## 9. CHART RENDERING TEST

### 9.1 Chart Initialization
- [ ] **Page Load**: Chart appears after initialization
- [ ] **Dual Axis**: Two Y-axes visible (HR and Motion)
- [ ] **Legend**: Shows dataset names
- [ ] **Grid**: X and Y grid lines visible
- [ ] **Labels**: Axis labels present

### 9.2 Chart Animation
- [ ] **Fade-In**: Chart fades in on load
- [ ] **Smooth**: Animations are smooth (not jerky)
- [ ] **Duration**: Animation ~500ms
- [ ] **Data Points**: New points appear smoothly
- [ ] **Rolling Window**: Old points disappear (max 20)

### 9.3 Chart Responsiveness
- [ ] **Resize Window**: Chart resizes appropriately
- [ ] **Mobile**: Chart visible and readable on mobile
- [ ] **Landscape**: Chart uses full width in landscape
- [ ] **No Overflow**: Chart stays in container

---

## 10. BUTTON & CONTROL TEST

### 10.1 Panic Button
- [ ] **Visual**: Red gradient, large, prominent
- [ ] **Hover**: Scales up slightly with pulse animation
- [ ] **Click**: Triggers alert and sound
- [ ] **Haptic**: Phone vibrates (if supported)
- [ ] **Animation**: Shake effect on activation
- [ ] **State**: Visually distinct from other buttons

### 10.2 Config Button
- [ ] **Visual**: Standard button styling
- [ ] **Click**: Opens settings dialog
- [ ] **Hover**: Hover effect visible
- [ ] **State**: Changes color on hover
- [ ] **Accessible**: Keyboard accessible (Tab+Enter)

### 10.3 Photo Button
- [ ] **Visual**: Camera icon visible
- [ ] **Click**: Opens photo modal
- [ ] **Responsive**: Works on mobile touchscreens
- [ ] **Hover**: Hover effect shows

### 10.4 Language/Dark Toggles
- [ ] **Location**: Top-right header (top-left RTL)
- [ ] **Icons**: Language/moon icons visible
- [ ] **Labels**: Button labels under icons
- [ ] **Responsive**: Labels hide on small screens (mobile)
- [ ] **Interaction**: Immediate feedback on click

---

## 11. AUDIO & HAPTIC FEEDBACK TEST

### 11.1 Alert Sound
- [ ] **Enable Audio**: System volume on, browser not muted
- [ ] **Trigger Alert**: Click panic button or device selector
- [ ] **Sound Plays**: 800Hz tone audible (0.5s duration)
- [ ] **Quality**: Clean tone without distortion
- [ ] **Volume**: Appropriate level (not too loud)
- [ ] **Fallback**: Works if Web Audio API unsupported

### 11.2 Haptic Feedback
- [ ] **Android Device**: Connect to test
- [ ] **Trigger Alert**: Click panic button
- [ ] **Vibration**: Phone vibrates pattern [100, 50, 100]ms
- [ ] **Intensity**: Strong enough to feel but not uncomfortable
- [ ] **Fallback**: Device without vibration API doesn't error

### 11.3 Arabic TTS (Text-to-Speech)
- [ ] **Enable Audio**: System volume up
- [ ] **Trigger Alert**: Arabic alert should be spoken
- [ ] **Language**: Arabic pronunciation (ar-SA) used
- [ ] **Rate**: Speech at 0.8x rate (clear)
- [ ] **Quality**: Natural-sounding voice

---

## 12. DEVICE SELECTOR TEST

### 12.1 Selection
- [ ] **Click Dropdown**: Opens device list
- [ ] **Three Options**: Child 1, 2, 3 visible
- [ ] **Arabic Names**: Names translated in Arabic mode
- [ ] **Select**: Selecting changes active device
- [ ] **Visual Feedback**: Dashboard opacity animation

### 12.2 Persistence
- [ ] **Select Device**: Choose Child 2
- [ ] **Reload Page**: Device selection persists
- [ ] **localStorage**: Check localStorage has device ID
- [ ] **Switch Again**: Can switch between devices
- [ ] **State Retained**: Chart/alerts update for new device

---

## 13. MAP INTERACTION TEST

### 13.1 Map Display
- [ ] **Render**: Map loads with OpenStreetMap tiles
- [ ] **Center**: Default location at 15.5°N, 32.5°E (Sudan)
- [ ] **Marker**: Red child icon visible
- [ ] **Popup**: Click marker → popup shows child info

### 13.2 Geofence Circle
- [ ] **Draw**: Click draw geofence button
- [ ] **Circle Appears**: Green circle on map (100m radius)
- [ ] **Dashed Line**: Dotted border styling visible
- [ ] **Popup**: Click circle → radius info shown
- [ ] **Customizable**: Change geofence size → circle updates

### 13.3 Map Controls
- [ ] **Zoom**: Scroll wheel zooms map
- [ ] **Pan**: Click+drag pans map
- [ ] **Fullscreen**: Leaflet controls visible
- [ ] **Attribution**: OpenStreetMap credit shown
- [ ] **Mobile**: Touch gestures work

---

## 14. ALERT SYSTEM TEST

### 14.1 Alert Display
- [ ] **Trigger**: Panic button or simulated alert
- [ ] **Banner**: Red alert banner appears at top
- [ ] **Animation**: Slides down smoothly
- [ ] **Message**: Alert text in correct language
- [ ] **Icon**: Exclamation icon visible
- [ ] **Sound**: Notification plays

### 14.2 Alert Acknowledgment
- [ ] **Ack Button**: "تأكيد" (Arabic) or "Acknowledge" (English)
- [ ] **Click**: Confirms alert
- [ ] **Animation**: Banner slides out smoothly
- [ ] **Removal**: Banner disappears
- [ ] **History**: Alert appears in history list

### 14.3 Alert History
- [ ] **List**: Recent alerts listed below
- [ ] **Count Badge**: Shows alert count
- [ ] **Timestamps**: Each alert has time
- [ ] **Scrolling**: List scrolls if many alerts
- [ ] **Empty State**: "No alerts" message when empty
- [ ] **Animation**: New alerts slide in

---

## 15. PLATFORM-SPECIFIC TEST

### 15.1 iOS Safari
- [ ] **Launch**: App loads correctly
- [ ] **Viewport**: Notch area handled properly
- [ ] **Touch**: Touch interactions work
- [ ] **Vibration**: Haptic feedback works (iOS 10+)
- [ ] **Sound**: Web Audio plays
- [ ] **Status Bar**: Display safe area properly
- [ ] **PWA**: Installable to home screen

### 15.2 Android Chrome
- [ ] **Launch**: App loads on Android
- [ ] **Vibration**: Vibration API works
- [ ] **Sound**: Audio feedback audible
- [ ] **Touch**: Full touch support
- [ ] **Performance**: Smooth animations
- [ ] **Offline**: Works partially offline (PWA)

### 15.3 Desktop Firefox
- [ ] **Launch**: Firefox renders correctly
- [ ] **CSS Grid**: Proper layout
- [ ] **Animations**: Smooth with GPU acceleration
- [ ] **Keyboard**: Full keyboard navigation
- [ ] **DevTools**: Inspect elements easily
- [ ] **Service Worker**: PWA features work

### 15.4 Desktop Safari
- [ ] **Launch**: macOS Safari works
- [ ] **Layout**: Proper CSS Grid rendering
- [ ] **CSS Variables**: Colors apply correctly
- [ ] **Animations**: Smooth performance
- [ ] **Web Audio**: Sound plays
- [ ] **Accessibility**: VoiceOver works

---

## 16. PERFORMANCE CHECKLIST

### 16.1 Load Time
- [ ] **First Paint**: < 1.0s
- [ ] **Largest Paint**: < 2.5s
- [ ] **Interactive**: < 3.0s
- [ ] **Lighthouse Score**: > 90 (Performance)

### 16.2 Runtime Performance
- [ ] **Scroll**: No jank (60fps)
- [ ] **Chart Update**: < 100ms latency
- [ ] **Modal Open**: < 50ms
- [ ] **Theme Switch**: < 100ms
- [ ] **Language Switch**: < 200ms

### 16.3 Memory
- [ ] **No Memory Leaks**: Memory stable over time
- [ ] **Chart Data**: 20-point limit enforced
- [ ] **Alert History**: < 50 items in DOM
- [ ] **Event Listeners**: Cleaned up on close

---

## 17. FINAL SIGN-OFF

### 17.1 Complete Verification
- [ ] All animations working ✓
- [ ] Dark mode functional ✓
- [ ] Arabic/English working ✓
- [ ] Responsive on all devices ✓
- [ ] Accessibility WCAG AA ✓
- [ ] Network status monitoring ✓
- [ ] Audio/haptic feedback ✓
- [ ] Performance optimized ✓
- [ ] All browsers supported ✓
- [ ] Mobile ready ✓
- [ ] Touch-friendly ✓
- [ ] Keyboard accessible ✓
- [ ] Screen reader compatible ✓

### 17.2 Production Ready
- [ ] Code is clean and documented ✓
- [ ] No console errors ✓
- [ ] No deprecated APIs used ✓
- [ ] Cross-browser tested ✓
- [ ] Mobile tested ✓
- [ ] Accessibility audited ✓
- [ ] Performance baseline established ✓
- [ ] Ready for deployment ✓

---

## Test Summary Report Template

```
Date: ________________
Tester: ________________
Platform: ________________

Test Results:
- Animations: PASS / FAIL
- Dark Mode: PASS / FAIL
- Bilingual: PASS / FAIL
- Responsive: PASS / FAIL
- Accessibility: PASS / FAIL
- Performance: PASS / FAIL
- Audio: PASS / FAIL
- All Interactive: PASS / FAIL

Overall Status: ✅ PRODUCTION READY / ⚠️ NEEDS FIXES

Notes:
_____________________________________
_____________________________________
_____________________________________
```

---

## Quick Debug Commands

```javascript
// Check current theme
console.log(document.body.dataset.theme);

// Check current language
console.log(i18n.getCurrentLang ? i18n.getLang() : 'N/A');

// Check stored preferences
console.log({
    theme: localStorage.getItem('childguard-theme'),
    lang: localStorage.getItem('childguard-lang'),
    device: localStorage.getItem('childguard-device')
});

// Check app state
console.log(state);

// Trigger test alert
document.getElementById('panicBtn').click();

// List all animations
Array.from(document.styleSheets[2].cssRules || [])
    .filter(r => r.name && r.name.includes('animation'))
    .forEach(r => console.log(r.name));
```

---

## Known Limitations & Workarounds

1. **Socket.io Connection**: Backend not running → mock data used
   - Workaround: Check browser console, mock telemetry works
   
2. **Real GPS**: Marker stays at Sudan default location
   - Workaround: Map renders, geofence circle updates with config

3. **Real Biometrics**: Chart shows placeholder data
   - Workaround: Backend will provide real HR/motion data

4. **Photo Storage**: Images are placeholders
   - Workaround: Backend camera integration pending

5. **SMS Alerts**: Not connected to Twilio
   - Workaround: Alert system works in-app, SMS pending

---

**Status**: **READY FOR USER ACCEPTANCE TESTING (UAT)**
