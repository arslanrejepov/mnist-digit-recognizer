from pathlib import Path
import sys
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tensorflow.keras.models import load_model
from src.dataset import load_data

model = load_model(ROOT/ "checkpoints" / "model.keras")

(ROOT / "results").mkdir(exist_ok=True)

(X_train, y_train), (X_val, y_val), X_test = load_data()

val_probs = model.predict(X_val)
val_preds = np.argmax(val_probs, axis=1)

test_probs = model.predict(X_test)
test_preds = np.argmax(test_probs, axis=1)


np.save(ROOT / "results" / "val_preds.npy", val_preds)
np.save(ROOT / "results" / "test_preds.npy", test_preds)

print("Predictions saved.")
