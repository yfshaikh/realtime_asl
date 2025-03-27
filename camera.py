import cv2
import numpy as np
import os
from matplotlib import pyplot as plt
import time
import mediapipe as mp
from keras.models import load_model

# model = load_model("./models/action.h5")
model = load_model('/Users/yusufshaikh/action_v4.h5')


# Actions that we try to detect
actions = np.array(['hello', 'thanks', 'iloveyou'])

# Thirty videos worth of data
no_sequences = 30

# Videos are going to be 30 frames in length
sequence_length = 30

mp_holistic = mp.solutions.holistic # Holistic model
mp_drawing = mp.solutions.drawing_utils # Drawing utilities

def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) # COLOR CONVERSION BGR 2 RGB
    image.flags.writeable = False                  # Image is no longer writeable
    results = model.process(image)                 # Make prediction
    image.flags.writeable = True                   # Image is now writeable 
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) # COLOR COVERSION RGB 2 BGR
    return image, results

def draw_styled_landmarks(image, results):
    # Draw face connections
    mp_drawing.draw_landmarks(image, results.face_landmarks, mp_holistic.FACEMESH_TESSELATION, 
                             mp_drawing.DrawingSpec(color=(80,110,10), thickness=1, circle_radius=1), 
                             mp_drawing.DrawingSpec(color=(80,256,121), thickness=1, circle_radius=1)
                             ) 
    # Draw pose connections
    mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
                             mp_drawing.DrawingSpec(color=(80,22,10), thickness=2, circle_radius=4), 
                             mp_drawing.DrawingSpec(color=(80,44,121), thickness=2, circle_radius=2)
                             ) 
    # Draw left hand connections
    mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS, 
                             mp_drawing.DrawingSpec(color=(121,22,76), thickness=2, circle_radius=4), 
                             mp_drawing.DrawingSpec(color=(121,44,250), thickness=2, circle_radius=2)
                             ) 
    # Draw right hand connections  
    mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS, 
                             mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=4), 
                             mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2))


def extract_keypoints(results):
    """
    Extracts keypoints from pose, face, left-hand, and right-hand landmarks.
    If no landmarks are detected, returns zero-filled arrays of expected shape.
    
    Args:
        results: MediaPipe holistic detection results.

    Returns:
        A flattened NumPy array containing concatenated keypoints.
    """
    
    # Extract pose landmarks (x, y, z, visibility), or return zeros if not detected
    if results.pose_landmarks:
        pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten()
    else:
        pose = np.zeros(33 * 4)  # 33 landmarks * 4 values each (x, y, z, visibility)
    
    # Extract face landmarks (x, y, z), or return zeros if not detected
    if results.face_landmarks:
        face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten()
    else:
        face = np.zeros(468 * 3)  # 468 landmarks * 3 values each (x, y, z)
    
    # Extract left-hand landmarks (x, y, z), or return zeros if not detected
    if results.left_hand_landmarks:
        lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten()
    else:
        lh = np.zeros(21 * 3)  # 21 landmarks * 3 values each (x, y, z)
    
    # Extract right-hand landmarks (x, y, z), or return zeros if not detected
    if results.right_hand_landmarks:
        rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten()
    else:
        rh = np.zeros(21 * 3)  # 21 landmarks * 3 values each (x, y, z)

    # Concatenate all keypoints into a single array
    return np.concatenate([pose, face, lh, rh])

colors = [(245, 117, 16), (117, 245, 16), (16, 117, 245)]

def get_hand_bbox(results, frame):
    """Extracts a bounding box around detected keypoints (e.g., hands)."""
    h, w, _ = frame.shape
    keypoints = []

    if results.right_hand_landmarks:
        for lm in results.right_hand_landmarks.landmark:
            keypoints.append((int(lm.x * w), int(lm.y * h)))

    if results.left_hand_landmarks:
        for lm in results.left_hand_landmarks.landmark:
            keypoints.append((int(lm.x * w), int(lm.y * h)))

    if len(keypoints) == 0:
        return None  # No hand detected

    x_min, y_min = np.min(keypoints, axis=0)
    x_max, y_max = np.max(keypoints, axis=0)

    return (x_min - 20, y_min - 20, x_max + 20, y_max + 20)  # Add padding

def draw_bounding_box(action, input_frame, bbox, color):
    """Draws a labeled bounding box around the detected sign."""
    if bbox:
        x1, y1, x2, y2 = bbox
        cv2.rectangle(input_frame, (x1, y1), (x2, y2), color, 3)
        cv2.putText(input_frame, action, (x1, y1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2, cv2.LINE_AA)

    return input_frame


# ASL Detector Video Stream
class Video:
    def __init__(self):
        self.start()
        
    def start(self):
        self.cap = cv2.VideoCapture(0)
        self.holistic = mp.solutions.holistic.Holistic()
        self.mp_holistic = mp.solutions.holistic
        self.sequence = []
        self.predictions = []
        self.sentence = []
        self.threshold = 0.8  # Adjust as needed
        self.zoom_factor = 1.0  # Add zoom factor initialization

    def release(self):
        print("released")
        self.cap.release()
        self.cap.destroyAllWindows()

    def set_threshold(self, new_threshold):
        """
        Set the confidence threshold for sign detection.
        Args:
            new_threshold (float): Value between 0 and 1
        """
        if 0 <= new_threshold <= 1:
            self.threshold = new_threshold
        else:
            raise ValueError("Threshold must be between 0 and 1")

    def get_predictions(self):
        """
        Returns the current predictions and confidence scores.
        Returns:
            dict: Dictionary containing the predicted sign and its confidence score
        """
        if len(self.sequence) == 30:
            res = model.predict(np.expand_dims(self.sequence, axis=0))[0]
            predicted_sign = actions[np.argmax(res)]
            confidence = float(res[np.argmax(res)])
            return {
                'sign': predicted_sign,
                'confidence': confidence
            }
        return None

    def set_zoom(self, zoom_factor):
        """
        Set the zoom level of the camera view.
        Args:
            zoom_factor (float): Zoom level (1.0 is normal, >1.0 zooms in, <1.0 zooms out)
        """
        if zoom_factor > 0:
            self.zoom_factor = zoom_factor
        else:
            raise ValueError("Zoom factor must be greater than 0")

    def get_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            return None

        # Apply zoom if needed
        if self.zoom_factor != 1.0:
            h, w = frame.shape[:2]
            # Calculate new bounds for zoomed frame
            new_h, new_w = int(h/self.zoom_factor), int(w/self.zoom_factor)
            start_y = (h - new_h)//2
            start_x = (w - new_w)//2
            # Crop and resize
            frame = frame[start_y:start_y+new_h, start_x:start_x+new_w]
            frame = cv2.resize(frame, (w, h))

        # ASL detection pipeline
        image, results = mediapipe_detection(frame, self.holistic)
        draw_styled_landmarks(image, results)

        keypoints = extract_keypoints(results)
        self.sequence.append(keypoints)
        self.sequence = self.sequence[-30:]

        if len(self.sequence) == 30:
            res = model.predict(np.expand_dims(self.sequence, axis=0))[0]
            self.predictions.append(np.argmax(res))

            if np.unique(self.predictions[-10:])[0] == np.argmax(res): 
                if res[np.argmax(res)] > self.threshold:
                    if len(self.sentence) == 0 or actions[np.argmax(res)] != self.sentence[-1]:
                        self.sentence.append(actions[np.argmax(res)])

            if len(self.sentence) > 5:
                self.sentence = self.sentence[-5:]

            # Get bounding box and draw if confidence is high
            bbox = get_hand_bbox(results, image)
            if res[np.argmax(res)] > self.threshold and bbox:
                image = draw_bounding_box(actions[np.argmax(res)], image, bbox, (0, 255, 0))

        # Display recognized sentence
        cv2.rectangle(image, (0, 0), (640, 40), (245, 117, 16), -1)
        cv2.putText(image, ' '.join(self.sentence), (3, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        # Convert frame to JPEG for streaming
        ret, jpg = cv2.imencode('.jpg', image)
        return jpg.tobytes()