import pandas as pd
import numpy as np
import tensorflow as tf

def load_data(train_path="data/train.csv", test_path="data/test.csv", val_split=0.1, seed=42):
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    y = train_df["label"].values
    X = train_df.drop(columns=["label"]).values.astype("float32") / 255.0
    X_test = test_df.values.astype("float32") / 255.0

    X = X.reshape(-1, 28, 28, 1)
    X_test = X_test.reshape(-1, 28, 28, 1)

    n_val = int(len(X) * val_split)
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(X))
    val_idx, train_idx = idx[:n_val], idx[n_val:]

    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]

    return (X_train, y_train), (X_val, y_val), X_test

def make_tf_dataset(X, y=None, batch_size=64, shuffle=False):
    if y is not None:
        ds = tf.data.Dataset.from_tensor_slices((X, y))
    else:
        ds = tf.data.Dataset.from_tensor_slices(X)
    if shuffle:
        ds = ds.shuffle(buffer_size=len(X))
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)