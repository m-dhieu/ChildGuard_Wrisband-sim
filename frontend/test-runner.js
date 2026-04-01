/* CHILDGUARD TEST RUNNER - Automated Testing Suite                    */
/* Tests: SOS, Alerts, Dashboard Features, Dummy Data                  */

class TestRunner {
    constructor() {
        this.results = [];
        this.currentTest = 0;
        this.totalTests = 0;
        this.passed = 0;
        this.failed = 0;
        this.isRunning = false;
    }

    // Log test result
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = {
            'info': 'ℹ️',
            'pass': '✅',
            'fail': '❌',
            'warn': '⚠️',
            'test': '🧪',
            'step': '📍'
        }[type] || '•';

        const log = `[${timestamp}] ${emoji} ${message}`;
        console.log(log);
        this.results.push({ message, type, timestamp });
    }

    // Assert condition
    assert(condition, testName, expectedMsg, actualMsg) {
        if (condition) {
            this.log(`✓ ${testName}: ${expectedMsg}`, 'pass');
            this.passed++;
            return true;
        } else {
            this.log(`✗ ${testName}: Expected ${expectedMsg}, got ${actualMsg}`, 'fail');
            this.failed++;
            return false;
        }
    }

    // Wait helper
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // TEST SUITE 1: DUMMY DATA FUNCTIONALITY

    async testDummyDataSimulator() {
        this.log('=== TEST SUITE 1: DUMMY DATA SIMULATOR ===', 'test');

        // Test 1.1: Simulator exists
        this.assert(
            typeof window.dummySimulator !== 'undefined',
            'Test 1.1',
            'DummyDataSimulator exists',
            'DummyDataSimulator undefined'
        );

        // Test 1.2: Get telemetry
        const telemetry = window.dummySimulator.getTelemetry('device1');
        this.assert(
            telemetry && telemetry.hr && telemetry.accel,
            'Test 1.2',
            'getTelemetry returns valid data',
            'getTelemetry returned: ' + JSON.stringify(telemetry)
        );

        // Test 1.3: HR in valid range
        this.assert(
            telemetry.hr >= 50 && telemetry.hr <= 150,
            'Test 1.3',
            'HR in valid range (50-150 BPM)',
            'HR = ' + telemetry.hr
        );

        // Test 1.4: Acceleration in valid range
        this.assert(
            telemetry.accel >= 0 && telemetry.accel <= 5,
            'Test 1.4',
            'Acceleration in valid range (0-5g)',
            'Accel = ' + telemetry.accel.toFixed(2)
        );

        // Test 1.5: GPS coordinates valid
        this.assert(
            telemetry.gps.lat >= 15 && telemetry.gps.lat <= 16,
            'Test 1.5',
            'GPS latitude in Khartoum range',
            'Lat = ' + telemetry.gps.lat
        );

        // Test 1.6: Battery decreasing
        const battery1 = window.dummySimulator.battery;
        await this.wait(100);
        const battery2 = window.dummySimulator.battery;
        this.assert(
            battery1 >= battery2,
            'Test 1.6',
            'Battery level decreasing over time',
            'Battery: ' + battery1 + ' -> ' + battery2
        );

        this.log('✓ DUMMY DATA TESTS COMPLETE\n', 'pass');
    }

    // TEST SUITE 2: ALERT SYSTEM

    async testAlertSystem() {
        this.log('=== TEST SUITE 2: ALERT SYSTEM ===', 'test');

        // Test 2.1: Heart rate spike triggers alert
        this.log('📍 Triggering stress event...', 'step');
        triggerDummyStressEvent();
        await this.wait(500);

        const alertsBeforeStress = document.querySelectorAll('#alertList > div').length;
        this.log(`Found ${alertsBeforeStress} alerts after stress trigger`, 'info');

        // Wait for stress event to develop
        await this.wait(2000);
        const alertsAfterStress = document.querySelectorAll('#alertList > div').length;
        
        this.assert(
            alertsAfterStress > alertsBeforeStress,
            'Test 2.1',
            'HR spike triggers alert',
            `Alerts: ${alertsBeforeStress} → ${alertsAfterStress}`
        );

        // Test 2.2: Check alert content
        const latestAlert = document.querySelector('#alertList > div');
        if (latestAlert) {
            const hasAlertText = latestAlert.innerHTML.includes('HR Spike') || latestAlert.innerHTML.includes('Spike');
            this.assert(
                hasAlertText,
                'Test 2.2',
                'Alert contains HR Spike message',
                'Alert HTML: ' + latestAlert.textContent.substring(0, 50)
            );
        }

        // Test 2.3: Motion spike triggers alert
        this.log('📍 Triggering motion event...', 'step');
        const alertsBeforeMotion = document.querySelectorAll('#alertList > div').length;
        triggerDummyMotionEvent();
        await this.wait(2000);
        const alertsAfterMotion = document.querySelectorAll('#alertList > div').length;

        this.assert(
            alertsAfterMotion > alertsBeforeMotion,
            'Test 2.3',
            'Motion spike triggers alert',
            `Alerts: ${alertsBeforeMotion} → ${alertsAfterMotion}`
        );

        // Test 2.4: Alert acknowledge button exists
        const ackButtons = document.querySelectorAll('#alertList button');
        this.assert(
            ackButtons.length > 0,
            'Test 2.4',
            'Acknowledge buttons present on alerts',
            `Found ${ackButtons.length} acknowledge buttons`
        );

        this.log('✓ ALERT SYSTEM TESTS COMPLETE\n', 'pass');
    }

   // TEST SUITE 3: STATUS INDICATOR

    async testStatusIndicator() {
        this.log('=== TEST SUITE 3: STATUS INDICATOR ===', 'test');

        // Test 3.1: Status element exists
        const statusIndicator = document.getElementById('statusIndicator');
        this.assert(
            statusIndicator !== null,
            'Test 3.1',
            'Status indicator element exists',
            'Element not found'
        );

        // Test 3.2: Status shows SAFE or DANGER
        const statusText = document.getElementById('statusText');
        const hasStatusText = statusText && (statusText.textContent.includes('SAFE') || statusText.textContent.includes('DANGER'));
        this.assert(
            hasStatusText,
            'Test 3.2',
            'Status indicator shows SAFE or DANGER',
            'Status text: ' + statusText?.textContent
        );

        // Test 3.3: Initial status is SAFE
        const initialStatus = statusText?.textContent;
        this.assert(
            initialStatus?.includes('SAFE'),
            'Test 3.3',
            'Initial status is SAFE',
            'Status: ' + initialStatus
        );

        // Test 3.4: Status changes on event
        this.log('📍 Triggering event to change status...', 'step');
        triggerDummyStressEvent();
        await this.wait(1500);
        
        const changedStatus = statusText?.textContent;
        this.assert(
            changedStatus?.includes('DANGER'),
            'Test 3.4',
            'Status changes to DANGER on high HR',
            'Status: ' + changedStatus
        );

        this.log('✓ STATUS INDICATOR TESTS COMPLETE\n', 'pass');
    }

    // TEST SUITE 4: SOS/PANIC BUTTON

    async testSOSButton() {
        this.log('=== TEST SUITE 4: SOS/PANIC BUTTON ===', 'test');

        // Test 4.1: SOS button exists
        const sosBtn = document.getElementById('panicBtn');
        this.assert(
            sosBtn !== null,
            'Test 4.1',
            'SOS button exists',
            'Button not found'
        );

        // Test 4.2: Click SOS button
        this.log('📍 Clicking SOS button...', 'step');
        const alertsBeforeSOS = document.querySelectorAll('#alertList > div').length;
        sosBtn.click();
        await this.wait(500);
        const alertsAfterSOS = document.querySelectorAll('#alertList > div').length;

        this.assert(
            alertsAfterSOS > alertsBeforeSOS,
            'Test 4.2',
            'SOS button creates emergency alert',
            `Alerts: ${alertsBeforeSOS} → ${alertsAfterSOS}`
        );

        // Test 4.3: Check for EMERGENCY alert
        const latestAlert = document.querySelector('#alertList > div');
        const hasEmergency = latestAlert?.textContent.includes('EMERGENCY');
        this.assert(
            hasEmergency,
            'Test 4.3',
            'SOS creates EMERGENCY alert',
            'Alert: ' + latestAlert?.textContent.substring(0, 50)
        );

        // Test 4.4: SOS triggers DANGER status
        const currentStatus = document.getElementById('statusText')?.textContent;
        this.assert(
            currentStatus?.includes('DANGER'),
            'Test 4.4',
            'SOS triggers DANGER status',
            'Status: ' + currentStatus
        );

        this.log('✓ SOS BUTTON TESTS COMPLETE\n', 'pass');
    }

    // TEST SUITE 5: DASHBOARD UI ELEMENTS

    async testDashboardUI() {
        this.log('=== TEST SUITE 5: DASHBOARD UI ELEMENTS ===', 'test');

        // Test 5.1: Chart exists
        const chart = document.getElementById('vitalsChart');
        this.assert(
            chart !== null,
            'Test 5.1',
            'Vitals chart canvas exists',
            'Canvas not found'
        );

        // Test 5.2: Map exists
        const map = document.getElementById('map');
        this.assert(
            map !== null,
            'Test 5.2',
            'Map element exists',
            'Map not found'
        );

        // Test 5.3: Alert panel exists
        const alertPanel = document.getElementById('alertList');
        this.assert(
            alertPanel !== null,
            'Test 5.3',
            'Alert panel exists',
            'Alert panel not found'
        );

        // Test 5.4: Photo button exists
        const photoBtn = document.getElementById('photoBtn');
        this.assert(
            photoBtn !== null,
            'Test 5.4',
            'Photo button exists',
            'Photo button not found'
        );

        // Test 5.5: Settings button exists
        const settingsBtn = document.getElementById('configBtn');
        this.assert(
            settingsBtn !== null,
            'Test 5.5',
            'Settings button exists',
            'Settings button not found'
        );

        // Test 5.6: Test banner visible
        const banner = document.querySelector('.test-banner');
        this.assert(
            banner !== null,
            'Test 5.6',
            'Test mode banner visible',
            'Banner not found'
        );

        this.log('✓ DASHBOARD UI TESTS COMPLETE\n', 'pass');
    }

    // TEST SUITE 6: CHART DATA UPDATES

    async testChartUpdates() {
        this.log('=== TEST SUITE 6: CHART DATA UPDATES ===', 'test');

        // Test 6.1: Chart object exists in window
        this.assert(
            typeof window.state !== 'undefined' && window.state.vitalsChart,
            'Test 6.1',
            'Chart object initialized',
            'Chart not initialized'
        );

        // Test 6.2: Chart has data
        const chartData = window.state?.vitalsChart?.data?.datasets[0]?.data || [];
        this.assert(
            chartData.length > 0,
            'Test 6.2',
            'Chart has HR data points',
            `Data points: ${chartData.length}`
        );

        // Test 6.3: Chart has multiple datasets
        const datasets = window.state?.vitalsChart?.data?.datasets || [];
        this.assert(
            datasets.length >= 2,
            'Test 6.3',
            'Chart has HR and Acceleration datasets',
            `Datasets: ${datasets.length}`
        );

        // Test 6.4: Chart data updating
        const initialLength = chartData.length;
        await this.wait(2500);
        const updatedLength = window.state?.vitalsChart?.data?.datasets[0]?.data?.length || 0;

        this.assert(
            updatedLength > initialLength,
            'Test 6.4',
            'Chart data updating in real-time',
            `Data points: ${initialLength} → ${updatedLength}`
        );

        this.log('✓ CHART UPDATE TESTS COMPLETE\n', 'pass');
    }

    // TEST SUITE 7: BUTTON INTERACTIONS

    async testButtonInteractions() {
        this.log('=== TEST SUITE 7: BUTTON INTERACTIONS ===', 'test');

        // Test 7.1: Photo button clickable
        const photoBtn = document.getElementById('photoBtn');
        let photoClicked = false;
        const originalAlert = window.alert;
        window.alert = () => { photoClicked = true; };
        
        photoBtn.click();
        window.alert = originalAlert;

        this.assert(
            photoClicked,
            'Test 7.1',
            'Photo button triggers action',
            'Photo button did not trigger'
        );

        // Test 7.2: Settings button clickable
        const settingsBtn = document.getElementById('configBtn');
        let settingsClicked = false;
        window.alert = () => { settingsClicked = true; };
        
        settingsBtn.click();
        window.alert = originalAlert;

        this.assert(
            settingsClicked,
            'Test 7.2',
            'Settings button triggers action',
            'Settings button did not trigger'
        );

        this.log('✓ BUTTON INTERACTION TESTS COMPLETE\n', 'pass');
    }

    // MAIN TEST RUNNER

    async runAllTests() {
        if (this.isRunning) {
            this.log('Tests already running!', 'warn');
            return;
        }

        this.isRunning = true;
        this.log('🚀 STARTING CHILDGUARD TEST SUITE', 'test');
        this.log('Testing: SOS, Alerts, Dashboard Features, Dummy Data\n', 'info');

        try {
            // Run all test suites
            await this.testDummyDataSimulator();
            await this.wait(1000);

            await this.testAlertSystem();
            await this.wait(1000);

            await this.testStatusIndicator();
            await this.wait(1000);

            await this.testSOSButton();
            await this.wait(1000);

            await this.testDashboardUI();
            await this.wait(1000);

            await this.testChartUpdates();
            await this.wait(1000);

            await this.testButtonInteractions();

            // Print summary
            this.printSummary();

        } catch (error) {
            this.log(`FATAL ERROR: ${error.message}`, 'fail');
            console.error(error);
        } finally {
            this.isRunning = false;
        }
    }

    // Print test summary
    printSummary() {
        this.log('\n' + '═'.repeat(60), 'info');
        this.log('📊 TEST SUMMARY', 'test');
        this.log('═'.repeat(60), 'info');
        this.log(`Total Tests: ${this.passed + this.failed}`, 'info');
        this.log(`✅ Passed: ${this.passed}`, 'pass');
        this.log(`❌ Failed: ${this.failed}`, this.failed > 0 ? 'fail' : 'pass');
        
        const passRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
        this.log(`Pass Rate: ${passRate}%`, this.passed > this.failed ? 'pass' : 'warn');
        
        this.log('═'.repeat(60) + '\n', 'info');

        if (this.failed === 0) {
            this.log('🎉 ALL TESTS PASSED!', 'pass');
        } else {
            this.log(`⚠️  ${this.failed} tests failed - review console for details`, 'warn');
        }
    }

    // Export results
    getResults() {
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.passed + this.failed,
            results: this.results
        };
    }
}

// Create global test runner instance
window.testRunner = new TestRunner();

// Convenience function to run all tests
window.runTests = async function() {
    await window.testRunner.runAllTests();
};

// Log that test runner is ready
console.log('🧪 ChildGuard Test Runner loaded. Run: runTests()');
