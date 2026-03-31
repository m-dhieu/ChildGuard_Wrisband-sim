# Entry point for backend server with all integrations

import os
import logging
from datetime import datetime

from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager

# Import conf. and modules
from config import get_config
from models import db, User, Device, Telemetry, Alert, EmergencyContact, AuditLog
from mqtt_handler import init_mqtt_client
from routes import api

# Conf.

# Load env. var.
from dotenv import load_dotenv
load_dotenv()

# Get conf.
config = get_config()

# Setup logging
logging.basicConfig(
    level=config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# App factory

def create_app():
    """Create & configure Flask app"""
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config)
    
    logger.info(f"Creating Flask app with {config.__class__.__name__}")
    
    # Initialize Extensions
    
    # Database
    db.init_app(app)
    logger.info(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # CORS - Enhanced conf. for Chrome compatibility
    cors_config = {
        "origins": config.CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "X-Total-Count"],
        "supports_credentials": False,
        "max_age": 3600
    }
    CORS(app, resources={r"/api/*": cors_config})
    logger.info(f"CORS enabled with config: {cors_config}")
    
    # JWT
    jwt = JWTManager(app)
    logger.info("JWT authentication initialized")
    
    # SocketIO (for real-time updates)
    socketio = SocketIO(
        app,
        cors_allowed_origins=config.CORS_ORIGINS,
        async_mode=config.SOCKETIO_ASYNC_MODE,
        ping_timeout=config.SOCKETIO_PING_TIMEOUT,
        ping_interval=config.SOCKETIO_PING_INTERVAL,
        allow_upgrades=True,
        engineio_logger=False,
        socketio_logger=False
    )
    logger.info("SocketIO initialized for real-time updates")
    
    # DB Setup
    
    with app.app_context():
        # Create all db tables
        db.create_all()
        logger.info("Database tables created/verified")
        
        # Create default admin user if in dev.
        if app.config['DEBUG'] and not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@childguard.local',
                phone='+249123456789',
                role='admin',
                language='en'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            logger.info("Default admin user created (username: admin, password: admin123)")
    
    # Register Blueprint
    
    app.register_blueprint(api)
    logger.info("API routes registered")
    
    # SocketIO Event Handlers
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        logger.info(f"Client connected: {request.sid}")
        emit('connection_response', {'data': 'Connected to ChildGuard backend'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        logger.info(f"Client disconnected: {request.sid}")
    
    @socketio.on('subscribe_device')
    def handle_subscribe_device(data):
        """Subscribe to device updates"""
        device_id = data.get('device_id')
        if device_id:
            logger.debug(f"Client subscribed to device: {device_id}")
            emit('subscription_confirmation', {
                'device_id': device_id,
                'status': 'subscribed'
            })
    
    @socketio.on('unsubscribe_device')
    def handle_unsubscribe_device(data):
        """Unsubscribe from device updates"""
        device_id = data.get('device_id')
        if device_id:
            logger.debug(f"Client unsubscribed from device: {device_id}")
            emit('subscription_confirmation', {
                'device_id': device_id,
                'status': 'unsubscribed'
            })
    
    # App Context & Shell
    
    @app.shell_context_processor
    def make_shell_context():
        """Make useful objects available in Flask shell"""
        return {
            'db': db,
            'User': User,
            'Device': Device,
            'Telemetry': Telemetry,
            'Alert': Alert,
            'EmergencyContact': EmergencyContact,
            'CPIMSCase': CPIMSCase
        }
    
    # Health Check Endpoint
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """System health check endpoint"""
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        }, 200
    
    @app.route('/', methods=['GET'])
    def index():
        """API root endpoint"""
        return {
            'name': 'ChildGuard Backend API',
            'version': '1.0.0',
            'status': 'running',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoints': {
                'health': '/health',
                'api': '/api',
                'docs': '/api/docs'
            }
        }, 200
    
    # Error Handlers
    
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors"""
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(e):
        """Handle 500 errors"""
        logger.error(f"Internal server error: {str(e)}")
        return {'error': 'Internal server error'}, 500    
    # Startup Tasks
    
    @app.before_request
    def log_request():
        """Log incoming requests"""
        logger.debug(f"{request.method} {request.path}")
    
    # Store references for access in other modules
        
    app.socketio = socketio
    app.mqtt_client = None
    
    return app, socketio

# App initialization

# Create app and socketio
app, socketio = create_app()

# Entry Point

if __name__ == '__main__':
    logger.info("=" * 80)
    logger.info("ChildGuard Backend Server Starting")
    logger.info("=" * 80)
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    logger.info(f"Debug Mode: {app.config['DEBUG']}")
    logger.info(f"Server: {app.config['SERVER_HOST']}:{app.config['SERVER_PORT']}")
    logger.info(f"MQTT Broker: {app.config['MQTT_BROKER']}:{app.config['MQTT_PORT']}")
    logger.info("=" * 80)
    
    try:
        # Initialize MQTT client
        logger.info("Initializing MQTT client...")
        app.mqtt_client = init_mqtt_client(app, socketio)
        logger.info("MQTT client initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize MQTT: {str(e)}")
        logger.warning("Continuing without MQTT - device telemetry will not be received")
    
    # Start server
    socketio.run(
        app,
        host=app.config['SERVER_HOST'],
        port=app.config['SERVER_PORT'],
        debug=app.config['DEBUG'],
        use_reloader=app.config['DEBUG'],
        allow_unsafe_werkzeug=True
    )

