# Database Models

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """Guardian/Responder user model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='guardian')  # guardian, responder, admin
    phone = db.Column(db.String(20))
    language = db.Column(db.String(5), default='en')  # en, ar
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    devices = db.relationship('Device', backref='guardian', lazy='dynamic', cascade='all, delete-orphan')
    emergency_contacts = db.relationship('EmergencyContact', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'language': self.language,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Device(db.Model):
    """Wristband device model"""
    __tablename__ = 'devices'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    boy_name = db.Column(db.String(100))
    boy_age = db.Column(db.Integer)
    guardian_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Status tracking
    battery_level = db.Column(db.Float, default=100.0)
    last_seen = db.Column(db.DateTime)
    is_online = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Geofence settings
    geofence_lat = db.Column(db.Float, default=15.5)  # Sudan default
    geofence_lon = db.Column(db.Float, default=32.5)
    geofence_radius = db.Column(db.Float, default=100)  # meters
    
    # Baseline health metrics
    hr_baseline = db.Column(db.Integer, default=80)  # beats per minute
    spo2_baseline = db.Column(db.Float, default=98.0)  # blood oxygen %
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    telemetry = db.relationship('Telemetry', backref='device', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='device', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'device_id': self.device_id,
            'boy_name': self.boy_name,
            'boy_age': self.boy_age,
            'battery_level': self.battery_level,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'is_online': self.is_online,
            'is_active': self.is_active,
            'geofence': {
                'lat': self.geofence_lat,
                'lon': self.geofence_lon,
                'radius': self.geofence_radius
            },
            'baselines': {
                'hr': self.hr_baseline,
                'spo2': self.spo2_baseline
            },
            'created_at': self.created_at.isoformat()
        }

class Telemetry(db.Model):
    """Real-time device telemetry data"""
    __tablename__ = 'telemetry'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.device_id'), nullable=False, index=True)
    
    # GPS location
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    altitude = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    
    # Biometrics
    hr = db.Column(db.Integer)  # Heart rate (BPM)
    spo2 = db.Column(db.Float)  # Blood oxygen (%)
    temperature = db.Column(db.Float)  # Body temperature (°C)
    
    # Motion data (6-axis accelerometer)
    accel_x = db.Column(db.Float)
    accel_y = db.Column(db.Float)
    accel_z = db.Column(db.Float)
    
    # Network
    signal_strength = db.Column(db.Integer)  # dBm
    connection_type = db.Column(db.String(20))  # '4G', '3G', '2G', 'LoRaWAN'
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        accel_magnitude = (self.accel_x**2 + self.accel_y**2 + self.accel_z**2)**0.5 if all([self.accel_x, self.accel_y, self.accel_z]) else 0
        
        return {
            'device_id': self.device_id,
            'gps': {
                'lat': self.lat,
                'lon': self.lon,
                'altitude': self.altitude,
                'accuracy': self.accuracy
            },
            'biometrics': {
                'hr': self.hr,
                'spo2': self.spo2,
                'temperature': self.temperature
            },
            'motion': {
                'x': self.accel_x,
                'y': self.accel_y,
                'z': self.accel_z,
                'magnitude': accel_magnitude
            },
            'network': {
                'signal_strength': self.signal_strength,
                'connection_type': self.connection_type
            },
            'timestamp': self.timestamp.isoformat()
        }

class Alert(db.Model):
    """Emergency alerts from device"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()), index=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.device_id'), nullable=False, index=True)
    
    # Alert classification
    alert_type = db.Column(db.String(50), nullable=False)  # 'hr_spike', 'motion', 'geofence', 'panic', 'tamper', 'low_battery'
    severity = db.Column(db.String(20), default='warning')  # 'critical', 'warning', 'info'
    
    # Location at time of alert
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    
    # Biometric data at time of alert
    hr = db.Column(db.Integer)
    spo2 = db.Column(db.Float)
    temperature = db.Column(db.Float)
    accel_magnitude = db.Column(db.Float)
    
    # Evidence
    photo_url = db.Column(db.String(255))  # S3 URL for attacker photo
    description = db.Column(db.Text)
    
    # Alert status
    is_acknowledged = db.Column(db.Boolean, default=False, index=True)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    acknowledged_at = db.Column(db.DateTime)
    
    # Escalation
    escalated_to_responders = db.Column(db.Boolean, default=False)
    escalated_at = db.Column(db.DateTime)
    responder_assigned = db.Column(db.String(100))
    
    # CPIMS+ integration
    cpims_case_id = db.Column(db.String(100), unique=True)
    cpims_status = db.Column(db.String(50))  # 'pending', 'created', 'assigned', 'resolved'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'alert_id': self.alert_id,
            'device_id': self.device_id,
            'type': self.alert_type,
            'severity': self.severity,
            'location': {'lat': self.lat, 'lon': self.lon},
            'biometrics': {
                'hr': self.hr,
                'spo2': self.spo2,
                'temperature': self.temperature
            },
            'motion': self.accel_magnitude,
            'photo_url': self.photo_url,
            'description': self.description,
            'is_acknowledged': self.is_acknowledged,
            'escalated_to_responders': self.escalated_to_responders,
            'cpims_case_id': self.cpims_case_id,
            'created_at': self.created_at.isoformat()
        }

class EmergencyContact(db.Model):
    """Emergency contacts for guardians"""
    __tablename__ = 'emergency_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    contact_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    contact_type = db.Column(db.String(50))  # 'guardian', 'responder', 'police', 'hospital'
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.contact_name,
            'phone': self.phone,
            'email': self.email,
            'type': self.contact_type,
            'is_active': self.is_active
        }

class AuditLog(db.Model):
    """Audit trail for compliance"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    action = db.Column(db.String(100), nullable=False)  # 'login', 'create_device', 'acknowledge_alert', etc.
    resource_type = db.Column(db.String(50))  # 'device', 'alert', 'user'
    resource_id = db.Column(db.String(100))
    
    old_value = db.Column(db.JSON)
    new_value = db.Column(db.JSON)
    
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'created_at': self.created_at.isoformat()
        }
