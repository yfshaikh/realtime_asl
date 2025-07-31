# Configuration settings for ASL Detection Application

# Model Configuration
DEFAULT_MODEL_PATH = './models/asl_letter_yolo.pt'
DEFAULT_CONFIDENCE_THRESHOLD = 0.5
DEFAULT_ZOOM_FACTOR = 1.0

# Camera Configuration
DEFAULT_CAMERA_INDEX = 0
JPEG_QUALITY = 85

# API Configuration
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000

# CORS Configuration
CORS_ORIGINS = [
    "https://realtime-asl.vercel.app",  # Production frontend
    "http://localhost:3000",            # Local development
    "http://localhost:5173",            # Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"  # Fallback for Vercel deployment issues
]

# Logging Configuration
LOG_FORMAT = '%(asctime)s - %(threadName)s - %(message)s'
LOG_DATE_FORMAT = '%H:%M:%S'

# Frame Processing
FRAME_LOG_INTERVAL = 100  # Log every N frames

# Thread Timeouts
THREAD_JOIN_TIMEOUT = 2.0  # seconds

# ASL Classes
ASL_CLASSES = [chr(i) for i in range(ord('A'), ord('Z') + 1)]  # A-Z

# UI Colors (BGR format for OpenCV)
COLORS = {
    'detection_box': (0, 255, 0),     # Green
    'text_background': (0, 0, 0),     # Black
    'text_color': (255, 255, 255),    # White
    'info_overlay': (0, 0, 0),        # Black
}

# Font Settings
FONT_FACE = 0  # cv2.FONT_HERSHEY_SIMPLEX
FONT_SCALE = 0.7
FONT_THICKNESS = 2

# Detection Display
MAX_HISTORY_LENGTH = 20 