"""Обучение модели — логика перенесена из AI 10. Train Model.ipynb."""
from datetime import datetime, timezone

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = ['Bedrooms', 'Bathrooms', 'Sqm']
CATEGORICAL_FEATURES = ['City']
FEATURES = ['Bedrooms', 'Bathrooms', 'Sqm', 'City']
TARGET = 'PriceAZN'


def build_pipeline() -> Pipeline:
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        # handle_unknown='ignore': город, которого не было в обучающей выборке, не ломает predict
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, NUMERIC_FEATURES),
        ('cat', categorical_transformer, CATEGORICAL_FEATURES)
    ])
    rf = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    return Pipeline(steps=[('preprocessor', preprocessor), ('model', rf)])


def train(data: pd.DataFrame) -> tuple[dict, dict]:
    """Обучает pipeline и возвращает (bundle для joblib, информация о результате)."""
    if len(data) < 10:
        raise ValueError(f"Слишком мало данных для обучения: {len(data)} записей")

    X = data[FEATURES]
    y = data[TARGET].astype(float)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)  # preprocessor обучается только на обучающей выборке

    y_pred = pipe.predict(X_test)
    metrics = {
        'mae': float(mean_absolute_error(y_test, y_pred)),
        'mse': float(mean_squared_error(y_test, y_pred)),
        'rmse': float(root_mean_squared_error(y_test, y_pred)),
        'r2': float(r2_score(y_test, y_pred)),
    }

    bundle = {
        'pipeline': pipe,
        'featured_order': FEATURES,
    }
    info = {
        'recordsUsed': len(data),
        'metrics': metrics,
        'finishedAt': datetime.now(timezone.utc).isoformat(),
    }
    return bundle, info
