# MQTT Handler
# Handles real-time device telemetry and alert processing

import paho.mqtt.client as mqtt
import json
import logging
from datetime import datetime, timedelta
from flask import current_app
from models import db, Device, Telemetry, Alert
from math import sqrt

logger = logging.getLogger(__name__)

class MQTTClient:
    """MQTT client for device communication"""
    
    def __init__(self, app=None):
        self.client = None
        self.app = app
    
    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
        self.setup_client()
    
    def setup_client(self):
        """Setup MQTT client"""
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
    
    def connect(self):
        """Connect to MQTT broker"""
        if not self.app:
            logger.error("Flask app not initialized")
            return
        
        broker = self.app.config.get('MQTT_BROKER', 'localhost')
        port = self.app.config.get('MQTT_PORT', 1883)
        username = self.app.config.get('MQTT_USERNAME')
        password = self.app.config.get('MQTT_PASSWORD')
        
        try:
            if username and password:
                self.client.username_pw_set(username, password)
            
            self.client.connect(broker, port, 60)
            self.client.loop_start()
            logger.info(f"MQTT connected to {broker}:{port}")
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT disconnected")
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            logger.info("MQTT connected successfully")
            # Subscribe to device topics
            client.subscribe("childguard/+/telemetry")
            client.subscribe("childguard/+/alert")
            client.subscribe("childguard/+/status")
        else:
            logger.error(f"MQTT connection failed with code {rc}")
    
    def on_message(self, client, userdata, msg):
        """MQTT message handler"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            if 'telemetry' in topic:
                self.handle_telemetry(payload)
            elif 'alert' in topic:
                self.handle_alert(payload)
            elif 'status' in topic:
                self.handle_status(payload)
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT disconnection callback"""
        if rc != 0:
            logger.warning(f"MQTT disconnected unexpectedly with code {rc}")
    
    def handle_telemetry(self, data):
        """Process telemetry data from device"""
        device_id = data.get('device_id')
        
        if not device_id:
            logger.warning("Telemetry missing device_id")
            return
        
        try:
            # Create telemetry record
            telemetry = Telemetry(
                device_id=device_id,
                lat=data['gps']['lat'],
                lon=data['gps']['lon'],
                altitude=data['gps'].get('altitude'),
                accuracy=data['gps'].get('accuracy'),
                hr=data.get('hr'),
                spo2=data.get('spo2'),
                temperature=data.get('temperature'),
                accel_x=data.get('accel', {}).get('x'),
                accel_y=data.get('accel', {}).get('y'),
                accel_z=data.get('accel', {}).get('z'),
                signal_strength=data.get('signal_strength'),
                connection_type=data.get('connection_type')
            )
            
            db.session.add(telemetry)
            
            # Update device status
            device = Device.query.filter_by(device_id=device_id).first()
            if device:
                device.last_seen = datetime.utcnow()
                device.is_online = True
                device.battery_level = data.get('battery', device.battery_level)
            
            db.session.commit()
            
            logger.debug(f"Telemetry received from {device_id}")
            
            # Perform danger detection (SRS FR2)
            self.check_danger_thresholds(device, telemetry)
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error handling telemetry: {e}")
    
    def check_danger_thresholds(self, device, telemetry):
        """Check for danger conditions (SRS FR2.1)"""
        if not device:
            return
        
        hr_spike_detected = False
        motion_detected = False
        
        # Check heart rate (>30% baseline increase)
        if telemetry.hr:
            hr_threshold = device.hr_baseline * 1.3
            if telemetry.hr > hr_threshold:
                hr_spike_detected = True
                logger.warning(f"HR spike detected: {telemetry.hr} > {hr_threshold}")
        
        # Check motion (>2g acceleration)
        if all([telemetry.accel_x, telemetry.accel_y, telemetry.accel_z]):
            accel_magnitude = sqrt(
                telemetry.accel_x**2 + 
                telemetry.accel_y**2 + 
                telemetry.accel_z**2
            )
            if accel_magnitude > 2.0:
                motion_detected = True
                logger.warning(f"Motion detected: {accel_magnitude}g")
        
        # Create alert if danger detected
        if hr_spike_detected or motion_detected:
            alert_type = 'hr_spike' if hr_spike_detected else 'motion'
            self.create_alert(
                device_id=device.device_id,
                alert_type=alert_type,
                severity='warning',
                lat=telemetry.lat,
                lon=telemetry.lon,
                hr=telemetry.hr,
                spo2=telemetry.spo2,
                temperature=telemetry.temperature,
                accel_magnitude=accel_magnitude if motion_detected else None,
                description=f'Automatic {alert_type} detection'
            )
    
    def handle_alert(self, data):
        """Process emergency alert from device"""
        device_id = data.get('device_id')
        alert_type = data.get('type', 'panic')
        
        if not device_id:
            logger.warning("Alert missing device_id")
            return
        
        try:
            accel_magnitude = data.get('accel')
            self.create_alert(
                device_id=device_id,
                alert_type=alert_type,
                severity='critical',
                lat=data.get('lat'),
                lon=data.get('lon'),
                hr=data.get('hr'),
                spo2=data.get('spo2'),
                temperature=data.get('temperature'),
                accel_magnitude=accel_magnitude,
                photo_url=data.get('photo_url'),
                description=data.get('description', f'{alert_type} alert from device')
            )
        except Exception as e:
            logger.error(f"Error handling alert: {e}")
    
    def create_alert(self, device_id, alert_type, severity, lat, lon, hr=None, spo2=None, 
                    temperature=None, accel_magnitude=None, photo_url=None, description=None):
        """Create alert record (SRS FR6)"""
        try:
            alert = Alert(
                device_id=device_id,
                alert_type=alert_type,
                severity=severity,
                lat=lat,
                lon=lon,
                hr=hr,
                spo2=spo2,
                temperature=temperature,
                accel_magnitude=accel_magnitude,
                photo_url=photo_url,
                description=description
            )
            
            db.session.add(alert)
            db.session.commit()
            
            logger.info(f"Alert created: {alert.alert_id} - {alert_type}")
            
            # Schedule escalation if critical
            if severity == 'critical':
                self.schedule_escalation(alert.id)
            
            return alert
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating alert: {e}")
    
    def schedule_escalation(self, alert_id):
        """Schedule alert escalation after 5 minutes if not acknowledged"""
        from threading import Timer
        
        def escalate():
            try:
                alert = Alert.query.get(alert_id)
                if alert and not alert.is_acknowledged:
                    alert.escalated_to_responders = True
                    alert.escalated_at = datetime.utcnow()
                    db.session.commit()
                    logger.info(f"Alert {alert_id} escalated to responders")
            except Exception as e:
                logger.error(f"Error escalating alert: {e}")
        
        # Escalate after 5 minutes (300 seconds)
        timer = Timer(300, escalate)
        timer.daemon = True
        timer.start()
    
    def handle_status(self, data):
        """Process device status update"""
        device_id = data.get('device_id')
        
        if not device_id:
            logger.warning("Status update missing device_id")
            return
        
        try:
            device = Device.query.filter_by(device_id=device_id).first()
            if device:
                device.battery_level = data.get('battery', device.battery_level)
                device.is_online = data.get('online', True)
                device.last_seen = datetime.utcnow()
                db.session.commit()
                
                logger.debug(f"Device {device_id} status updated")
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error handling status: {e}")
    
    def publish(self, topic, payload):
        """Publish message to MQTT topic"""
        if self.client and self.client.is_connected():
            self.client.publish(topic, json.dumps(payload), qos=2)
        else:
            logger.warning(f"MQTT not connected, cannot publish to {topic}")


def init_mqtt_client(app, socketio):
    """Factory function to initialize MQTT client"""
    mqtt_client = MQTTClient(app)
    mqtt_client.init_app(app)
    mqtt_client.setup_client()
    mqtt_client.connect()
    return mqtt_client
