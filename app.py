from flask import Flask, render_template, Response
from flask_cors import CORS, cross_origin
from camera import Video

app=Flask(__name__)
cors = CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

def gen(camera):
    while True:
        frame=camera.get_frame()
        yield(b'--frame\r\n'
       b'Content-Type:  image/jpeg\r\n\r\n' + frame +
         b'\r\n\r\n')

# Create a single camera instance
camera_instance = Video()

@app.route('/video')
def video():
    print("=========================================================")
    print("VIDEO called")
    return Response(gen(camera_instance),  # Use the global camera_instance instead of creating a new one
    mimetype='multipart/x-mixed-replace; boundary=frame')

# Add new endpoints

@app.route('/threshold/<float:value>', methods=['POST'])
def set_threshold(value):
    try:
        camera_instance.set_threshold(value)
        return {'success': True, 'message': f'Threshold set to {value}'}, 200
    except ValueError as e:
        return {'success': False, 'error': str(e)}, 400

@app.route('/predictions', methods=['GET'])
def get_predictions():
    predictions = camera_instance.get_predictions()
    if predictions:
        return predictions, 200
    return {'message': 'No predictions available yet'}, 204

@app.route('/zoom/<float:factor>', methods=['POST'])
def set_zoom(factor):
    try:
        camera_instance.set_zoom(factor)
        return {'success': True, 'message': f'Zoom factor set to {factor}'}, 200
    except ValueError as e:
        return {'success': False, 'error': str(e)}, 400

@app.route("/pause", methods=["GET"])
def pause():
    try:
        camera_instance.release()
        return {'success': True, 'message': 'Video paused'}, 200
    except Exception as e:
        return {'success': False, 'error': str(e)}, 400

@app.route("/resume", methods=["GET"])  # Add a resume endpoint
def resume():
    try:
        camera_instance.start()  # You'll need to add this method to Video class
        return {'success': True, 'message': 'Video resumed'}, 200
    except Exception as e:
        return {'success': False, 'error': str(e)}, 400

app.run(debug=True, port=8081)