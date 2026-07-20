from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.model import build_model
from src.dataset import load_data

(X_train, y_train), (X_val, y_val), X_test = load_data()

model = build_model()

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history = model.fit(
    X_train, y_train, 
    validation_data=(X_val,y_val),
    epochs=10,
    batch_size = 32
)