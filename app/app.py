from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from flask import Flask, render_template, request, jsonify
from interface import predict_digit

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    digit, confidence = predict_digit(file)

    return jsonify({
        'digit': digit,
        'confidence': round(confidence * 100, 2)
    })

if __name__ == '__main__':
    app.run(debug=True)