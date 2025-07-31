import cv2
import numpy as np
from ultralytics import YOLO
import logging
from typing import List, Dict, Any

app_logger = logging.getLogger('app')

class ASLDetector:
    def __init__(self, model_path: str = './models/asl_letter_yolo.pt'):
        """Initialize the ASL YOLO detector"""
        self.model = YOLO(model_path)
        self.asl_classes = [chr(i) for i in range(ord('A'), ord('Z') + 1)]  # A-Z
        app_logger.info("✅ YOLO ASL Letter model loaded successfully")
    
    def detect_letters(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Detect ASL letters in a frame
        
        Args:
            frame: Input image frame
            confidence_threshold: Minimum confidence for detections
            
        Returns:
            List of detection dictionaries with letter, confidence, and bbox
        """
        try:
            # YOLO inference
            results = self.model(frame, conf=confidence_threshold, verbose=False)
            
            detections = []
            
            # Process detections
            if len(results) > 0 and results[0].boxes is not None:
                boxes = results[0].boxes
                
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Get class name
                    if class_id < len(self.asl_classes):
                        letter = self.asl_classes[class_id]
                    else:
                        letter = f"Class_{class_id}"
                    
                    # Store detection
                    detections.append({
                        'letter': letter,
                        'confidence': confidence,
                        'bbox': [int(x1), int(y1), int(x2), int(y2)]
                    })
            
            return detections
            
        except Exception as e:
            app_logger.error(f"Error in YOLO detection: {str(e)}")
            return []
    
    def draw_detections(self, frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """
        Draw bounding boxes and labels on the frame
        
        Args:
            frame: Input image frame
            detections: List of detection dictionaries
            
        Returns:
            Annotated frame
        """
        annotated_frame = frame.copy()
        
        for detection in detections:
            letter = detection['letter']
            confidence = detection['confidence']
            x1, y1, x2, y2 = detection['bbox']
            
            # Draw bounding box
            color = (0, 255, 0)  # Green
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
            # Add label
            label = f"{letter} {confidence:.2f}"
            label_size, baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            
            # Draw label background
            label_y = max(y1 - 10, label_size[1])
            cv2.rectangle(
                annotated_frame,
                (x1, int(label_y - label_size[1])),
                (x1 + label_size[0], int(label_y + baseline)),
                color,
                cv2.FILLED
            )
            
            # Draw label text
            cv2.putText(
                annotated_frame,
                label,
                (x1, int(label_y)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2
            )
        
        return annotated_frame
    
    def apply_zoom(self, frame: np.ndarray, zoom_factor: float) -> np.ndarray:
        """
        Apply zoom to the frame
        
        Args:
            frame: Input image frame
            zoom_factor: Zoom level (1.0 = normal, >1.0 = zoom in, <1.0 = zoom out)
            
        Returns:
            Zoomed frame
        """
        if zoom_factor == 1.0:
            return frame
            
        h, w = frame.shape[:2]
        
        if zoom_factor > 1.0:
            # Zoom in - crop center and resize
            new_h, new_w = int(h / zoom_factor), int(w / zoom_factor)
            start_y = (h - new_h) // 2
            start_x = (w - new_w) // 2
            cropped = frame[start_y:start_y + new_h, start_x:start_x + new_w]
            zoomed = cv2.resize(cropped, (w, h))
        else:
            # Zoom out - resize smaller and pad
            new_h, new_w = int(h * zoom_factor), int(w * zoom_factor)
            resized = cv2.resize(frame, (new_w, new_h))
            
            # Create padded frame
            zoomed = np.zeros((h, w, 3), dtype=np.uint8)
            start_y = (h - new_h) // 2
            start_x = (w - new_w) // 2
            zoomed[start_y:start_y + new_h, start_x:start_x + new_w] = resized
            
        return zoomed
    
    def add_info_overlay(self, frame: np.ndarray, detections: List[Dict[str, Any]], confidence_threshold: float) -> np.ndarray:
        """
        Add information overlay to the frame
        
        Args:
            frame: Input image frame
            detections: List of current detections
            confidence_threshold: Current confidence threshold
            
        Returns:
            Frame with overlay
        """
        info_text = f"Detections: {len(detections)} | Confidence: {confidence_threshold:.2f} | Zoom: {getattr(self, '_last_zoom', 1.0):.1f}x"
        
        # Black background for text
        cv2.rectangle(frame, (10, 10), (600, 40), (0, 0, 0), -1)
        cv2.putText(frame, info_text, (15, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return frame
    
    def process_frame(self, frame: np.ndarray, confidence_threshold: float = 0.5, zoom_factor: float = 1.0) -> tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Complete frame processing pipeline
        
        Args:
            frame: Input image frame
            confidence_threshold: Minimum confidence for detections
            zoom_factor: Zoom level
            
        Returns:
            Tuple of (processed_frame, detections)
        """
        try:
            # Store zoom for overlay
            self._last_zoom = zoom_factor
            
            # Apply zoom first
            zoomed_frame = self.apply_zoom(frame, zoom_factor)
            
            # Detect letters
            detections = self.detect_letters(zoomed_frame, confidence_threshold)
            
            # Draw detections
            annotated_frame = self.draw_detections(zoomed_frame, detections)
            
            # Add info overlay
            final_frame = self.add_info_overlay(annotated_frame, detections, confidence_threshold)
            
            return final_frame, detections
            
        except Exception as e:
            app_logger.error(f"Error in frame processing: {str(e)}")
            return frame, [] 