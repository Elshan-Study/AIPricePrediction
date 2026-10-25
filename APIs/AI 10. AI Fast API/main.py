import traceback
from pathlib import Path
import pandas as pd


import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Price Prediction AI Service")

MODEL_PATH = Path("../../models/models_az.pkl")

try:
    loaded = joblib.load(MODEL_PATH)

    if isinstance(loaded, dict) and 'pipeline' in loaded:
        BUNDLE = loaded
        PIPELINE = BUNDLE['pipeline']
        FEATURES = BUNDLE.get('featured_order', ['Bedrooms', 'Bathrooms', 'Sqm', 'City'])
    print(f'Model loaded from {MODEL_PATH}')
except Exception as e:
    print(f'Failed to load model from {MODEL_PATH} - {e}')
    traceback.print_exc()
    BUNDLE = None
    PIPELINE = None
    FEATURES = ['Bedrooms', 'Bathrooms', 'Sqm', 'City']

class PredictIn(BaseModel):
    bedrooms: float
    bathrooms: float
    sqm:float
    city:str


@app.post("/predict")
async def predict(request: PredictIn):
    print(PIPELINE)
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="No Model loaded")

    try:
        features = {
            'Bedrooms': [request.bedrooms],
            'Bathrooms': [request.bathrooms],
            'City': [request.city]
        }
        if 'Sqm' in FEATURES:
            features['Sqm'] = [request.sqm]
        features_data = pd.DataFrame(features, columns=FEATURES)
        prediction = PIPELINE.predict(features_data)[0]
        return {'priceAZN': float(prediction)}
    except Exception as e:
        print(f'Error predicting {e}')
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.post('/retrain')
async def retrain():
    pass




