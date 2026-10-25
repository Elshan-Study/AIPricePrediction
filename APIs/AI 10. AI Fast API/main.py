import os
import threading
import traceback
from pathlib import Path
import pandas as pd


import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

import dataset
import training

app = FastAPI(title="Price Prediction AI Service")

# путь от расположения файла, а не от рабочей папки — так запуск работает из любой директории
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "models_az.pkl"

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
    pipeline = PIPELINE  # локальная ссылка: /retrain может заменить модель во время запроса
    if pipeline is None:
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
        prediction = pipeline.predict(features_data)[0]
        return {'priceAZN': float(prediction)}
    except Exception as e:
        print(f'Error predicting {e}')
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

class ApartmentIn(BaseModel):
    bedrooms: float
    bathrooms: float
    sqm: float
    city: str
    priceAZN: float


@app.post('/apartments')
def add_apartment(request: ApartmentIn):
    try:
        row = dataset.validate_row(request.priceAZN, request.bedrooms, request.bathrooms,
                                   request.sqm, request.city)
    except dataset.RowError as e:
        raise HTTPException(status_code=400, detail=str(e))

    total = dataset.append_rows([row])
    return {'message': 'Квартира добавлена', 'added': 1, 'totalRecords': total}


@app.post('/apartments/import')
def import_apartments(file: UploadFile = File(...)):
    try:
        rows = dataset.parse_import(file.file.read())
    except dataset.RowError as e:
        # весь импорт отклоняется, основной CSV не меняется
        raise HTTPException(status_code=400, detail=str(e))

    total = dataset.append_rows(rows)
    return {'message': 'Импорт выполнен', 'added': len(rows), 'totalRecords': total}


RETRAIN_LOCK = threading.Lock()


@app.post('/retrain')
def retrain():
    global BUNDLE, PIPELINE, FEATURES

    if not RETRAIN_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail='Переобучение уже выполняется')
    try:
        try:
            data = dataset.read_dataset()  # чтение под блокировкой CSV, обучение — уже без неё
            bundle, info = training.train(data)
            # сначала во временный файл, потом замена — старая модель не повредится при сбое записи
            tmp_path = MODEL_PATH.with_suffix('.pkl.tmp')
            joblib.dump(bundle, tmp_path)
            os.replace(tmp_path, MODEL_PATH)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500,
                                detail=f'Переобучение не удалось, используется прежняя модель: {e}')

        BUNDLE = bundle
        FEATURES = bundle['featured_order']
        PIPELINE = bundle['pipeline']
        return {'message': 'Модель переобучена', **info}
    finally:
        RETRAIN_LOCK.release()
