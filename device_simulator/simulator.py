# Mock ESP32 Wristband
# Sends realistic telemetry and alert data via MQTT

import json
import time
import random
import math
import argparse
from datetime import datetime
import logging

import paho.mqtt.client as mqtt

# Configuration

MQTT_BROKER = 'localhost'
MQTT_PORT = 1883
MQTT_KEEPALIVE = 60

# Device Configuration
DEFAULT_DEVICE_ID = 'CHILD_001'
DEFAULT_BOY_NAME = 'Ahmed'

# GPS Bounds (Khartoum, Sudan area for demo)
GPS_CENTER_LAT = 15.5007
GPS_CENTER_LON = 32.5599
GPS_RADIUS_KM = 2.0  # 2km movement radius

# Biometric Ranges
HR_BASELINE = 80
HR_NORMAL_RANGE = (70, 90)
HR_STRESS_RANGE = (120, 150)
SPO2_NORMAL = (95, 100)

# Motion Thresholds
ACCEL_NORMAL = (0.0, 1.5)  # g
ACCEL_MOTION = (2.5, 4.0)  # g (danger detection)

# Temperature
TEMP_NORMAL = (36.5, 37.5)

# Battery
BATTERY_NORMAL = (80, 100)
BATTERY_LOW = 20

# Setup Logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DeviceSimulator')

# GPS Simulator

class GPSSimulator:
    """Simulate realistic GPS movement"""
    
    def __init__(self, center_lat=GPS_CENTER_LAT, center_lon=GPS_CENTER_LON, 
                 radius_km=GPS_RADIUS_KM):
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.radius_km = radius_km
        self.current_lat = center_lat
        self.current_lon = center_lon
        self.step = 0
    
    def km_to_degrees(self, km):
        """Convert kilometers to degrees (approximate)"""
        return km / 111.0
    
    def get_next_position(self):
        """Get next GPS position with random walk"""
        # Random walk with small steps
        step_size = self.km_to_degrees(0.05)  # 50 meter steps
        
        # Random direction
        angle = random.uniform(0, 2 * math.pi)
        lat_change = step_size * math.cos(angle)
        lon_change = step_size * math.sin(angle)
        
        # Update position
        new_lat = self.current_lat + lat_change
        new_lon = self.current_lon + lon_change
        
        # Keep within bounds (simple square boundary)
        degree_radius = self.km_to_degrees(self.radius_km)
        new_lat = max(self.center_lat - degree_radius, 
                      min(self.center_lat + degree_radius, new_lat))
        new_lon = max(self.center_lon - degree_radius, 
                      min(self.center_lon + degree_radius, new_lon))
        
        self.current_lat = new_lat
        self.current_lon = new_lon
        self.step += 1
        
        return round(new_lat, 6), round(new_lon, 6)

# Biometric Simulator

class BiometricSimulator:
    """Simulate realistic biometric data"""
    
    def __init__(self, hr_baseline=HR_BASELINE):
        self.hr_baseline = hr_baseline
        self.current_hr = hr_baseline
        self.stress_level = 0  # 0-100
        self.in_stress_episode = False
        self.stress_timer = 0
    
    def update_stress(self):
        """Randomly trigger stress episodes"""
        if not self.in_stress_episode:
            # 5% chance per cycle to enter stress
            if random.random() < 0.05:
                self.in_stress_episode = True
                self.stress_timer = random.randint(10, 30)  # 10-30 updates
                self.stress_level = random.uniform(40, 100)
                logger.warning(f"🚨 STRESS EPISODE TRIGGERED (duration: {self.stress_timer} updates)")
        else:
            self.stress_timer -= 1
            if self.stress_timer <= 0:
                self.in_stress_episode = False
                self.stress_level = 0
                logger.info("✓ Stress episode ended")
    
    def get_heart_rate(self):
        """Get heart rate (baseline + stress)"""
        self.update_stress()
        
        if self.in_stress_episode:
            # HR spike during stress (>1.3x baseline triggers alert)
            base_hr = self.hr_baseline * random.uniform(1.3, 1.8)
            variation = random.uniform(-5, 5)
        else:
            # Normal HR variation
            base_hr = self.hr_baseline
            variation = random.uniform(-10, 10)
        
        self.current_hr = max(40, min(200, base_hr + variation))
        return int(round(self.current_hr))
    
    def get_spo2(self):
        """Get SpO2 (blood oxygen) - usually stable"""
        base = random.uniform(95, 100)
        if self.in_stress_episode:
            # May drop slightly during stress
            base = random.uniform(92, 98)
        return int(round(base))
    
    def get_temperature(self):
        """Get body temperature"""
        if self.in_stress_episode:
            temp = random.uniform(37.5, 38.2)
        else:
            temp = random.uniform(36.5, 37.5)
        return round(temp, 1)

# Motion Simulator

class MotionSimulator:
    """Simulate realistic motion/acceleration data"""
    
    def __init__(self):
        self.in_activity = False
        self.activity_timer = 0
    
    def get_acceleration(self):
        """Get 6-axis acceleration in g"""
        # Trigger activity 2% of the time
        if not self.in_activity and random.random() < 0.02:
            self.in_activity = True
            self.activity_timer = random.randint(5, 15)
        
        if self.in_activity:
            self.activity_timer -= 1
            if self.activity_timer <= 0:
                self.in_activity = False
            
            # High acceleration during activity (>2.0g triggers alert)
            accel = random.uniform(2.5, 4.0)
        else:
            # Normal movement
            accel = random.uniform(0.0, 1.5)
        
        # Generate 3-axis data
        x = random.uniform(-accel, accel)
        y = random.uniform(-accel, accel)
        z = 9.8 + random.uniform(-accel/2, accel/2)  # Gravity + movement
        
        return round(x, 2), round(y, 2), round(z, 2)

# Device Simulator

class DeviceSimulator:
    """Complete device simulator"""
    
    def __init__(self, device_id=DEFAULT_DEVICE_ID, boy_name=DEFAULT_BOY_NAME,
                 mqtt_broker=MQTT_BROKER, mqtt_port=MQTT_PORT):
        self.device_id = device_id
        self.boy_name = boy_name
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        
        # Initialize simulators
        self.gps = GPSSimulator()
        self.biometrics = BiometricSimulator()
        self.motion = MotionSimulator()
        
        # Device state
        self.battery_level = random.randint(80, 100)
        self.signal_strength = random.randint(-80, -40)
        self.is_online = True
        self.update_count = 0
        
        # MQTT client
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_publish = self.on_publish
        
        # Scenario control
        self.trigger_hr_spike = False
        self.trigger_motion_spike = False
        self.trigger_geofence_breach = False
        self.trigger_panic = False
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            logger.info(f"✓ Connected to MQTT broker ({self.mqtt_broker}:{self.mqtt_port})")
        else:
            logger.error(f"✗ Connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT disconnection callback"""
        if rc != 0:
            logger.warning(f"⚠ Unexpected disconnection (code {rc})")
        else:
            logger.info("✓ Disconnected from MQTT broker")
    
    def on_publish(self, client, userdata, mid):
        """MQTT publish callback"""
        pass  # Silently acknowledge
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.mqtt_broker, self.mqtt_port, MQTT_KEEPALIVE)
            self.client.loop_start()
            logger.info(f"Connecting to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}...")
            time.sleep(1)  # Wait for connection
        except Exception as e:
            logger.error(f"Failed to connect: {str(e)}")
            return False
        return True
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
    
    def get_telemetry(self):
        """Generate telemetry data"""
        lat, lon = self.gps.get_next_position()
        hr = self.biometrics.get_heart_rate()
        spo2 = self.biometrics.get_spo2()
        accel_x, accel_y, accel_z = self.motion.get_acceleration()
        temp = self.biometrics.get_temperature()
        
        # Battery drain
        self.battery_level = max(0, self.battery_level - random.uniform(0.01, 0.05))
        
        # Signal varies
        self.signal_strength = random.randint(-80, -40)
        
        return {
            'device_id': self.device_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'gps': {
                'lat': lat,
                'lon': lon
            },
            'biometrics': {
                'hr': hr,
                'spo2': spo2,
                'temperature': temp
            },
            'motion': {
                'accel_x': accel_x,
                'accel_y': accel_y,
                'accel_z': accel_z
            },
            'signal': {
                'strength': self.signal_strength,
                'battery': int(round(self.battery_level))
            }
        }
    
    def get_status(self):
        """Generate device status"""
        return {
            'device_id': self.device_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'is_online': self.is_online,
            'battery_level': int(round(self.battery_level)),
            'signal_strength': self.signal_strength
        }
    
    def get_alert(self, alert_type='manual'):
        """Generate emergency alert"""
        lat, lon = self.gps.current_lat, self.gps.current_lon
        hr = self.biometrics.current_hr
        accel_x, accel_y, accel_z = self.motion.get_acceleration()
        accel = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        
        return {
            'device_id': self.device_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'alert_type': alert_type,  # hr_spike, motion, panic, geofence
            'severity': 'critical',
            'location': {
                'lat': lat,
                'lon': lon
            },
            'biometrics': {
                'hr': int(round(hr)),
                'accel': round(accel, 2)
            },
            'evidence': {
                'photo_url': 'https://placeholder.com/evidence.jpg'
            }
        }
    
    def publish_telemetry(self):
        """Publish telemetry data"""
        telemetry = self.get_telemetry()
        topic = f'childguard/{self.device_id}/telemetry'
        
        self.client.publish(
            topic,
            json.dumps(telemetry),
            qos=1
        )
        
        self.update_count += 1
        
        # Log interesting data
        hr = telemetry['biometrics']['hr']
        accel_x = telemetry['motion']['accel_x']
        accel_y = telemetry['motion']['accel_y']
        accel_z = telemetry['motion']['accel_z']
        accel = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        battery = telemetry['signal']['battery']
        
        # Check danger conditions
        if hr > self.biometrics.hr_baseline * 1.3:
            logger.warning(f"⚠️  HR SPIKE: {hr} bpm (baseline: {self.biometrics.hr_baseline})")
        
        if accel > 2.0:
            logger.warning(f"⚠️  MOTION SPIKE: {accel:.2f}g")
        
        if battery < 20:
            logger.warning(f"⚠️  LOW BATTERY: {battery}%")
        
        logger.debug(f"📡 Telemetry #{self.update_count}: HR={hr}bpm, "
                    f"Accel={accel:.2f}g, Battery={battery}%, "
                    f"GPS={telemetry['gps']['lat']:.4f},{telemetry['gps']['lon']:.4f}")
    
    def publish_status(self):
        """Publish device status"""
        status = self.get_status()
        topic = f'childguard/{self.device_id}/status'
        
        self.client.publish(
            topic,
            json.dumps(status),
            qos=1
        )
        
        logger.debug(f"📍 Status: Battery={status['battery_level']}%, "
                    f"Signal={status['signal_strength']}dBm")
    
    def publish_alert(self, alert_type='manual'):
        """Publish emergency alert"""
        alert = self.get_alert(alert_type)
        topic = f'childguard/{self.device_id}/alert'
        
        self.client.publish(
            topic,
            json.dumps(alert),
            qos=1
        )
        
        logger.error(f"🚨 ALERT SENT: {alert_type.upper()} - HR={alert['biometrics']['hr']}bpm")
    
    def run(self, interval=2, duration=None):
        """Run simulator
        
        Args:
            interval: Time between telemetry updates (seconds)
            duration: Run duration (seconds), None = infinite
        """
        logger.info("=" * 80)
        logger.info(f"Device Simulator Starting")
        logger.info(f"Device ID: {self.device_id}")
        logger.info(f"Boy Name: {self.boy_name}")
        logger.info(f"Update Interval: {interval}s")
        logger.info("=" * 80)
        
        start_time = time.time()
        
        try:
            while True:
                # Check duration
                if duration and (time.time() - start_time) > duration:
                    logger.info("Duration limit reached, stopping...")
                    break
                
                # Publish data
                self.publish_telemetry()
                
                # Publish status occasionally (every 10 updates)
                if self.update_count % 10 == 0:
                    self.publish_status()
                
                # Check for scenario triggers
                if self.trigger_hr_spike:
                    logger.info("⚡ Triggering HR spike scenario...")
                    self.biometrics.in_stress_episode = True
                    self.biometrics.stress_timer = 5
                    self.biometrics.stress_level = 100
                    self.publish_alert('hr_spike')
                    self.trigger_hr_spike = False
                
                if self.trigger_motion_spike:
                    logger.info("⚡ Triggering motion spike scenario...")
                    self.publish_alert('motion')
                    self.trigger_motion_spike = False
                
                if self.trigger_panic:
                    logger.info("⚡ Triggering panic button...")
                    self.publish_alert('panic')
                    self.trigger_panic = False
                
                # Wait before next update
                time.sleep(interval)
        
        except KeyboardInterrupt:
            logger.info("\n⏹ Simulator stopped by user")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
        finally:
            self.disconnect()
            logger.info("✓ Simulator shutdown complete")

# CLI Interface

def main():
    parser = argparse.ArgumentParser(
        description='ChildGuard Device Simulator - Mock ESP32 Wristband',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic simulation
  python simulator.py
  
  # Custom device ID
  python simulator.py --device-id CHILD_002 --name Mohammed
  
  # Different MQTT broker
  python simulator.py --broker 192.168.1.100 --port 1883
  
  # Slower telemetry (5 seconds between updates)
  python simulator.py --interval 5
  
  # Run for 5 minutes then stop
  python simulator.py --duration 300
        """)
    
    parser.add_argument('--device-id', default=DEFAULT_DEVICE_ID,
                       help=f'Device ID (default: {DEFAULT_DEVICE_ID})')
    parser.add_argument('--name', default=DEFAULT_BOY_NAME,
                       help=f'Boy name (default: {DEFAULT_BOY_NAME})')
    parser.add_argument('--broker', default=MQTT_BROKER,
                       help=f'MQTT broker address (default: {MQTT_BROKER})')
    parser.add_argument('--port', type=int, default=MQTT_PORT,
                       help=f'MQTT broker port (default: {MQTT_PORT})')
    parser.add_argument('--interval', type=float, default=2,
                       help='Telemetry update interval in seconds (default: 2)')
    parser.add_argument('--duration', type=int, default=None,
                       help='Run duration in seconds (default: infinite)')
    
    args = parser.parse_args()
    
    # Create simulator
    simulator = DeviceSimulator(
        device_id=args.device_id,
        boy_name=args.name,
        mqtt_broker=args.broker,
        mqtt_port=args.port
    )
    
    # Connect
    if not simulator.connect():
        logger.error("Failed to connect to MQTT broker")
        return 1
    
    # Run
    simulator.run(interval=args.interval, duration=args.duration)
    
    return 0

if __name__ == '__main__':
    exit(main())
