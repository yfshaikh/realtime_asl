import cv2
import threading
import logging
from threading import Lock
from typing import Optional, Callable
import time

app_logger = logging.getLogger('app')

class CameraManager:
    def __init__(self):
        """Initialize the camera manager"""
        self.video_capture: Optional[cv2.VideoCapture] = None
        self.latest_frame: Optional[bytes] = None
        self.camera_running: bool = False
        self.frame_lock = Lock()
        self.camera_thread: Optional[threading.Thread] = None
        self.frame_processor: Optional[Callable] = None
        
    def set_frame_processor(self, processor: Callable):
        """Set the frame processing function"""
        self.frame_processor = processor
        
    def start_camera(self, camera_index: int = 0) -> bool:
        """
        Start the camera capture
        
        Args:
            camera_index: Camera device index (default: 0 for webcam)
            
        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            if self.camera_running:
                app_logger.warning("Camera is already running")
                return True
                
            # Initialize camera
            self.video_capture = cv2.VideoCapture(camera_index)
            if not self.video_capture.isOpened():
                app_logger.error(f"Could not open camera with index {camera_index}")
                return False
                
            # Start camera thread
            self.camera_running = True
            self.camera_thread = threading.Thread(target=self._capture_frames, daemon=True)
            self.camera_thread.start()
            
            app_logger.info("╔════════════════════════════════════")
            app_logger.info("║ Camera Thread Started")
            app_logger.info("╚════════════════════════════════════")
            
            return True
            
        except Exception as e:
            app_logger.error(f"Error starting camera: {str(e)}")
            return False
    
    def stop_camera(self) -> bool:
        """
        Stop the camera capture
        
        Returns:
            True if camera stopped successfully, False otherwise
        """
        try:
            if not self.camera_running:
                app_logger.warning("Camera is not running")
                return True
                
            app_logger.info("🛑 Stopping Camera")
            
            # Stop the thread
            self.camera_running = False
            
            if self.camera_thread and self.camera_thread.is_alive():
                self.camera_thread.join(timeout=2.0)
                
            # Release camera
            if self.video_capture:
                self.video_capture.release()
                self.video_capture = None
                
            # Clear latest frame
            with self.frame_lock:
                self.latest_frame = None
                
            app_logger.info("■ Camera Stopped")
            return True
            
        except Exception as e:
            app_logger.error(f"Error stopping camera: {str(e)}")
            return False
    
    def get_latest_frame(self) -> Optional[bytes]:
        """
        Get the latest processed frame
        
        Returns:
            Latest frame as JPEG bytes, or None if no frame available
        """
        with self.frame_lock:
            return self.latest_frame
    
    def is_running(self) -> bool:
        """Check if camera is currently running"""
        return self.camera_running
    
    def _capture_frames(self):
        """Internal method to capture and process frames in a separate thread"""
        current_thread = threading.current_thread()
        current_thread.name = "🎥 Camera Thread"
        
        try:
            frame_count = 0
            while self.camera_running:
                ret, frame = self.video_capture.read()
                if not ret:
                    app_logger.error("Failed to read frame from camera")
                    time.sleep(0.1)  # Brief pause before retry
                    continue

                try:
                    # Process frame if processor is set
                    if self.frame_processor:
                        processed_frame = self.frame_processor(frame)
                    else:
                        processed_frame = frame
                    
                    # Encode frame to JPEG
                    _, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    
                    # Store frame thread-safely
                    with self.frame_lock:
                        self.latest_frame = buffer.tobytes()
                        
                    frame_count += 1
                    if frame_count % 100 == 0:  # Log every 100 frames
                        app_logger.debug(f"Processed {frame_count} frames")
                        
                except Exception as e:
                    app_logger.error(f"Error processing frame: {str(e)}")
                    continue

        except Exception as e:
            app_logger.error(f"Error in camera capture thread: {str(e)}")
        finally:
            app_logger.info("╔════════════════════════════════════")
            app_logger.info("║ Camera Thread Stopped")
            app_logger.info("╚════════════════════════════════════")
    
    def get_camera_info(self) -> dict:
        """
        Get information about the camera
        
        Returns:
            Dictionary with camera information
        """
        info = {
            "running": self.camera_running,
            "has_frame": self.latest_frame is not None,
            "thread_alive": self.camera_thread.is_alive() if self.camera_thread else False
        }
        
        if self.video_capture and self.video_capture.isOpened():
            info.update({
                "width": int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                "fps": self.video_capture.get(cv2.CAP_PROP_FPS)
            })
            
        return info
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        if self.camera_running:
            self.stop_camera() 