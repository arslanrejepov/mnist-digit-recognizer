from pathlib import Path
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

ROOT = Path(__file__).resolve().parent.parent

from src.dataset import load_data

(X_train, y_train), (X_val, y_val), X_test = load_data()

val_preds = np.load(ROOT / "results" / "val_preds.npy")

# Accuracy
acc = accuracy_score(y_val, val_preds)
print(f"Validation Accuracy: {acc:.4f}")

# Classification report
print(classification_report(y_val, val_preds))

# Confusion matrix
cm = confusion_matrix(y_val, val_preds)
plt.figure(figsize=(8,6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.savefig(ROOT / "results" / "confusion_matrix.png")
plt.show()