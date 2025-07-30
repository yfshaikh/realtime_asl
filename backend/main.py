import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Local imports
from detector import ASLDetector
from camera_manager import CameraManager
from config import (
    DEFAULT_MODEL_PATH, DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_ZOOM_FACTOR,
    DEFAULT_HOST, DEFAULT_PORT, CORS_ORIGINS, LOG_FORMAT, LOG_DATE_FORMAT
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=LOG_DATE_FORMAT
)
app_logger = logging.getLogger('app')

# Global instances
detector: ASLDetector = None
camera_manager: CameraManager = None
current_settings = {
    'confidence_threshold': DEFAULT_CONFIDENCE_THRESHOLD,
    'zoom_factor': DEFAULT_ZOOM_FACTOR,
}
current_detections: List[Dict[str, Any]] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global detector, camera_manager
    
    try:
        # Initialize detector
        detector = ASLDetector(DEFAULT_MODEL_PATH)
        
        # Initialize camera manager
        camera_manager = CameraManager()
        
        # Set up frame processing pipeline
        def process_frame(frame):
            global current_detections
            processed_frame, detections = detector.process_frame(
                frame, 
                current_settings['confidence_threshold'],
                current_settings['zoom_factor']
            )
            current_detections = detections
            return processed_frame
            
        camera_manager.set_frame_processor(process_frame)
        
        app_logger.info("🚀 Application initialized successfully")
        
    except Exception as e:
        app_logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    try:
        if camera_manager:
            camera_manager.stop_camera()
        app_logger.info("🛑 Application shutdown complete")
    except Exception as e:
        app_logger.error(f"Error during shutdown: {str(e)}")

# Create FastAPI app
app = FastAPI(title="ASL Letter Detection API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ThresholdRequest(BaseModel):
    threshold: float

class ZoomRequest(BaseModel):
    zoom_factor: float

# API Endpoints
@app.post("/start_stream")
async def start_stream():
    """Start the ASL detection camera stream"""
    try:
        if camera_manager.is_running():
            return {"message": "Stream already running"}
            
        success = camera_manager.start_camera()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to start camera")
            
        app_logger.info("► YOLO ASL Detection Stream Started")
        return {
            "message": "YOLO ASL detection stream started",
            "settings": current_settings
        }
        
    except Exception as e:
        app_logger.error(f"Error starting stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop_stream")
async def stop_stream():
    """Stop the ASL detection camera stream"""
    try:
        if not camera_manager.is_running():
            return {"message": "Stream not running"}
            
        success = camera_manager.stop_camera()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to stop camera")
            
        # Clear detections
        global current_detections
        current_detections = []
            
        app_logger.info("■ YOLO ASL Detection Stream Stopped")
        return {"message": "YOLO ASL detection stream stopped"}
        
    except Exception as e:
        app_logger.error(f"Error stopping stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video_feed")
async def get_video_feed():
    """Return the latest processed frame"""
    frame_data = camera_manager.get_latest_frame()
    
    if frame_data is None:
        raise HTTPException(status_code=404, detail="No frame available")
    
    return Response(content=frame_data, media_type="image/jpeg")

@app.get("/predictions")
async def get_predictions():
    """Get current YOLO ASL predictions"""
    try:
        if current_detections:
            # Return the highest confidence detection
            best_detection = max(current_detections, key=lambda x: x['confidence'])
            return {
                'sign': best_detection['letter'],
                'confidence': best_detection['confidence'],
                'all_detections': current_detections
            }
        else:
            return {'message': 'No detections available'}
    except Exception as e:
        app_logger.error(f"Error getting predictions: {str(e)}")
        return {'message': 'Error getting predictions'}

@app.post("/threshold")
async def set_threshold(request: ThresholdRequest):
    """Set the confidence threshold for YOLO detection"""
    try:
        if not (0 <= request.threshold <= 1):
            raise ValueError("Threshold must be between 0 and 1")
            
        current_settings['confidence_threshold'] = request.threshold
        app_logger.info(f"🎯 Confidence threshold updated to {request.threshold}")
        
        return {
            'success': True, 
            'message': f'Threshold set to {request.threshold}',
            'current_settings': current_settings
        }
    except ValueError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        app_logger.error(f"Error setting threshold: {str(e)}")
        return {'success': False, 'error': 'Internal server error'}

@app.post("/zoom")
async def set_zoom(request: ZoomRequest):
    """Set the zoom factor for the camera"""
    try:
        if request.zoom_factor <= 0:
            raise ValueError("Zoom factor must be greater than 0")
            
        current_settings['zoom_factor'] = request.zoom_factor
        app_logger.info(f"🔍 Zoom factor updated to {request.zoom_factor}")
        
        return {
            'success': True, 
            'message': f'Zoom factor set to {request.zoom_factor}',
            'current_settings': current_settings
        }
    except ValueError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        app_logger.error(f"Error setting zoom: {str(e)}")
        return {'success': False, 'error': 'Internal server error'}

@app.get("/status")
async def get_status():
    """Get current streaming status and settings"""
    camera_info = camera_manager.get_camera_info() if camera_manager else {}
    
    return {
        "streaming": camera_manager.is_running() if camera_manager else False,
        "current_detections": len(current_detections),
        "model_type": "YOLO ASL Letters",
        "settings": current_settings,
        "camera_info": camera_info
    }

@app.get("/camera/info")
async def get_camera_info():
    """Get detailed camera information"""
    if not camera_manager:
        raise HTTPException(status_code=500, detail="Camera manager not initialized")
        
    return camera_manager.get_camera_info()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "detector_loaded": detector is not None,
        "camera_available": camera_manager is not None,
        "streaming": camera_manager.is_running() if camera_manager else False
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=DEFAULT_HOST, port=DEFAULT_PORT) 