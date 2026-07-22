from pathlib import Path
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model

ROOT = Path(__file__).resolve().parent.parent

_model = None

def get_model():
    global _model
    if _model is None:
        _model = load_model(ROOT / "checkpoints" / "model.keras")
    return _model

def preprocess_image(image_file):
    img = Image.open(image_file).convert('L')  # grayscale
    img = img.resize((28, 28))
    arr = np.array(img).astype('float32') / 255.0

    # MNIST digits are white-on-black; invert if uploaded image is black-on-white
    if arr.mean() > 0.5:
        arr = 1.0 - arr

    arr = arr.reshape(1, 28, 28, 1)
    return arr

def predict_digit(image_file):
    model = get_model()
    processed = preprocess_image(image_file)
    probs = model.predict(processed, verbose=0)
    digit = int(np.argmax(probs))
    confidence = float(np.max(probs))
    return digit, confidence