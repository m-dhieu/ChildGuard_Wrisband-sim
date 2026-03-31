# REST API Routes for frontend communication

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
from sqlalchemy import desc, and_
import logging

from models import (
    db, User, Device, Telemetry, Alert, EmergencyContact, AuditLog
)

logger = logging.getLogger(__name__)
api = Blueprint('api', __name__, url_prefix='/api')

# Authentication Routes

@api.route('/register', methods=['POST'])
def register():
    """Register new user (guardian, responder, or admin)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['username', 'email', 'password', 'phone', 'role']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Validate role
        if data['role'] not in ['guardian', 'responder', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            phone=data['phone'],
            role=data['role'],
            language=data.get('language', 'en')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"New user registered: {user.username} ({user.role})")
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/login', methods=['POST'])
def login():
    """User login - returns JWT token"""
    try:
        data = request.get_json()
        
        # Accept either 'phone' or 'username' as login field
        login_field = data.get('phone') or data.get('username')
        password = data.get('password')
        
        if not login_field or not password:
            return jsonify({'error': 'Missing phone/username or password'}), 400
        
        # Try to find user by username first, then by phone
        user = User.query.filter_by(username=login_field).first()
        if not user:
            user = User.query.filter_by(phone=login_field).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        logger.info(f"User logged in: {user.username}")
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Device Routes

@api.route('/devices', methods=['GET'])
@jwt_required()
def get_devices():
    """Get all devices for current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Guardians see their devices, admins see all
        if user.role == 'guardian':
            devices = Device.query.filter_by(guardian_id=user_id).all()
        elif user.role == 'admin':
            devices = Device.query.all()
        else:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify([device.to_dict() for device in devices]), 200
        
    except Exception as e:
        logger.error(f"Get devices error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/devices', methods=['POST'])
@jwt_required()
def create_device():
    """Create new device (register wristband)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'guardian':
            return jsonify({'error': 'Only guardians can create devices'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required = ['device_id', 'boy_name', 'boy_age']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if device already exists
        if Device.query.filter_by(device_id=data['device_id']).first():
            return jsonify({'error': 'Device already registered'}), 409
        
        # Create device
        device = Device(
            device_id=data['device_id'],
            boy_name=data['boy_name'],
            boy_age=data['boy_age'],
            guardian_id=user_id,
            geofence_lat=data.get('geofence_lat'),
            geofence_lon=data.get('geofence_lon'),
            geofence_radius=data.get('geofence_radius', 100),
            hr_baseline=data.get('hr_baseline', 80)
        )
        
        db.session.add(device)
        db.session.commit()
        
        logger.info(f"New device registered: {device.device_id}")
        
        return jsonify({
            'message': 'Device created successfully',
            'device': device.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create device error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/devices/<device_id>', methods=['PUT'])
@jwt_required()
def update_device(device_id):
    """Update device configuration"""
    try:
        user_id = get_jwt_identity()
        device = Device.query.filter_by(device_id=device_id).first()
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        # Check authorization
        if device.guardian_id != user_id:
            user = User.query.get(user_id)
            if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'geofence_lat' in data:
            device.geofence_lat = data['geofence_lat']
        if 'geofence_lon' in data:
            device.geofence_lon = data['geofence_lon']
        if 'geofence_radius' in data:
            device.geofence_radius = max(50, min(500, data['geofence_radius']))  # 50-500m
        if 'hr_baseline' in data:
            device.hr_baseline = data['hr_baseline']
        if 'boy_name' in data:
            device.boy_name = data['boy_name']
        if 'boy_age' in data:
            device.boy_age = data['boy_age']
        
        db.session.commit()
        
        logger.info(f"Device updated: {device_id}")
        
        return jsonify({
            'message': 'Device updated successfully',
            'device': device.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update device error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/devices/<device_id>', methods=['GET'])
@jwt_required()
def get_device(device_id):
    """Get single device details"""
    try:
        device = Device.query.filter_by(device_id=device_id).first()
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        return jsonify(device.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Get device error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Telemetry Routes

@api.route('/telemetry/<device_id>', methods=['GET'])
@jwt_required()
def get_telemetry(device_id):
    """Get recent telemetry for device"""
    try:
        user_id = get_jwt_identity()
        device = Device.query.filter_by(device_id=device_id).first()
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        # Check authorization
        if device.guardian_id != user_id:
            user = User.query.get(user_id)
            if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
        hours = request.args.get('hours', default=1, type=int)
        limit = request.args.get('limit', default=100, type=int)
        
        # Query telemetry
        since = datetime.utcnow() - timedelta(hours=hours)
        telemetry = Telemetry.query.filter(
            and_(
                Telemetry.device_id == device_id,
                Telemetry.timestamp >= since
            )
        ).order_by(desc(Telemetry.timestamp)).limit(limit).all()
        
        return jsonify([
            {
                'id': t.id,
                'timestamp': t.timestamp.isoformat(),
                'lat': t.lat,
                'lon': t.lon,
                'hr': t.hr,
                'spo2': t.spo2,
                'accel_x': t.accel_x,
                'accel_y': t.accel_y,
                'accel_z': t.accel_z,
                'temperature': t.temperature,
                'signal_strength': t.signal_strength
            }
            for t in telemetry
        ]), 200
        
    except Exception as e:
        logger.error(f"Get telemetry error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/telemetry/<device_id>/latest', methods=['GET'])
@jwt_required()
def get_latest_telemetry(device_id):
    """Get latest telemetry point for device"""
    try:
        user_id = get_jwt_identity()
        device = Device.query.filter_by(device_id=device_id).first()
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        # Check authorization
        if device.guardian_id != user_id:
            user = User.query.get(user_id)
            if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403
        
        telemetry = Telemetry.query.filter_by(
            device_id=device_id
        ).order_by(desc(Telemetry.timestamp)).first()
        
        if not telemetry:
            return jsonify({'error': 'No telemetry data'}), 404
        
        return jsonify({
            'id': telemetry.id,
            'timestamp': telemetry.timestamp.isoformat(),
            'lat': telemetry.lat,
            'lon': telemetry.lon,
            'hr': telemetry.hr,
            'spo2': telemetry.spo2,
            'accel_x': telemetry.accel_x,
            'accel_y': telemetry.accel_y,
            'accel_z': telemetry.accel_z,
            'temperature': telemetry.temperature,
            'signal_strength': telemetry.signal_strength
        }), 200
        
    except Exception as e:
        logger.error(f"Get latest telemetry error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Alert Routes

@api.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get alerts for user's devices"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Guardians see their device alerts, admins see all
        if user.role == 'guardian':
            user_devices = Device.query.filter_by(guardian_id=user_id).all()
            device_ids = [d.device_id for d in user_devices]
            alerts = Alert.query.filter(Alert.device_id.in_(device_ids)).all()
        elif user.role == 'admin':
            alerts = Alert.query.all()
        else:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
        severity = request.args.get('severity')  # filter by severity
        acknowledged = request.args.get('acknowledged')  # filter by status
        limit = request.args.get('limit', default=50, type=int)
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        if acknowledged:
            is_ack = acknowledged.lower() == 'true'
            alerts = [a for a in alerts if a.is_acknowledged == is_ack]
        
        alerts = sorted(alerts, key=lambda x: x.created_at, reverse=True)[:limit]
        
        return jsonify([
            {
                'id': a.id,
                'device_id': a.device_id,
                'alert_type': a.alert_type,
                'severity': a.severity,
                'lat': a.lat,
                'lon': a.lon,
                'hr': a.hr,
                'accel': a.accel,
                'photo_url': a.photo_url,
                'is_acknowledged': a.is_acknowledged,
                'acknowledged_at': a.acknowledged_at.isoformat() if a.acknowledged_at else None,
                'escalated_to_responders': a.escalated_to_responders,
                'escalated_at': a.escalated_at.isoformat() if a.escalated_at else None,
                'created_at': a.created_at.isoformat()
            }
            for a in alerts
        ]), 200
        
    except Exception as e:
        logger.error(f"Get alerts error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/alerts/<int:alert_id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_alert(alert_id):
    """Acknowledge an alert (mark as handled)"""
    try:
        user_id = get_jwt_identity()
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Check authorization
        device = Device.query.filter_by(device_id=alert.device_id).first()
        if device.guardian_id != user_id:
            user = User.query.get(user_id)
            if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403
        
        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by = user_id
        
        db.session.commit()
        
        logger.info(f"Alert acknowledged: {alert_id}")
        
        return jsonify({
            'message': 'Alert acknowledged',
            'alert_id': alert_id,
            'acknowledged_at': alert.acknowledged_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Acknowledge alert error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/alerts/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    """Get single alert details"""
    try:
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        return jsonify({
            'id': alert.id,
            'device_id': alert.device_id,
            'alert_type': alert.alert_type,
            'severity': alert.severity,
            'lat': alert.lat,
            'lon': alert.lon,
            'hr': alert.hr,
            'accel': alert.accel,
            'photo_url': alert.photo_url,
            'is_acknowledged': alert.is_acknowledged,
            'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            'escalated_to_responders': alert.escalated_to_responders,
            'escalated_at': alert.escalated_at.isoformat() if alert.escalated_at else None,
            'created_at': alert.created_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Get alert error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Emergency Contact Routes

@api.route('/contacts', methods=['GET'])
@jwt_required()
def get_emergency_contacts():
    """Get emergency contacts for user"""
    try:
        user_id = get_jwt_identity()
        contacts = EmergencyContact.query.filter_by(user_id=user_id).all()
        
        return jsonify([
            {
                'id': c.id,
                'contact_name': c.contact_name,
                'phone': c.phone,
                'email': c.email,
                'contact_type': c.contact_type,
                'is_active': c.is_active
            }
            for c in contacts
        ]), 200
        
    except Exception as e:
        logger.error(f"Get contacts error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/contacts', methods=['POST'])
@jwt_required()
def create_emergency_contact():
    """Add emergency contact"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required = ['contact_name', 'phone', 'contact_type']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        contact = EmergencyContact(
            user_id=user_id,
            contact_name=data['contact_name'],
            phone=data['phone'],
            email=data.get('email'),
            contact_type=data['contact_type'],
            is_active=True
        )
        
        db.session.add(contact)
        db.session.commit()
        
        logger.info(f"Emergency contact added: {contact.contact_name}")
        
        return jsonify({
            'message': 'Contact added successfully',
            'id': contact.id
        }), 201
        
    except Exception as e:
        logger.error(f"Create contact error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/contacts/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_emergency_contact(contact_id):
    """Delete emergency contact"""
    try:
        user_id = get_jwt_identity()
        contact = EmergencyContact.query.get(contact_id)
        
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
        
        if contact.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(contact)
        db.session.commit()
        
        logger.info(f"Emergency contact deleted: {contact_id}")
        
        return jsonify({'message': 'Contact deleted'}), 200
        
    except Exception as e:
        logger.error(f"Delete contact error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Admin Routes

@api.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    """Get system statistics (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return jsonify({
            'total_users': User.query.count(),
            'total_devices': Device.query.count(),
            'total_alerts': Alert.query.count(),
            'critical_alerts': Alert.query.filter_by(severity='critical').count(),
            'unacknowledged_alerts': Alert.query.filter_by(is_acknowledged=False).count(),
            'online_devices': Device.query.filter_by(is_online=True).count(),
            'total_telemetry_records': Telemetry.query.count()
        }), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/admin/devices/status', methods=['GET'])
@jwt_required()
def get_all_devices_status():
    """Get status of all devices (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        devices = Device.query.all()
        
        return jsonify([
            {
                'device_id': d.device_id,
                'boy_name': d.boy_name,
                'is_online': d.is_online,
                'battery_level': d.battery_level,
                'last_seen': d.last_seen.isoformat() if d.last_seen else None,
                'guardian': d.guardian.username if d.guardian else None
            }
            for d in devices
        ]), 200
        
    except Exception as e:
        logger.error(f"Get devices status error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/admin/telemetry/purge', methods=['POST'])
@jwt_required()
def purge_old_telemetry():
    """Delete telemetry older than 30 days (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        deleted = Telemetry.query.filter(Telemetry.timestamp < cutoff_date).delete()
        db.session.commit()
        
        logger.info(f"Purged {deleted} old telemetry records")
        
        return jsonify({
            'message': 'Telemetry purged successfully',
            'records_deleted': deleted
        }), 200
        
    except Exception as e:
        logger.error(f"Purge telemetry error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Error Handlers

@api.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@api.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

@api.errorhandler(422)
def unprocessable(e):
    """Handle validation errors"""
    return jsonify({'error': 'Invalid request data'}), 422
