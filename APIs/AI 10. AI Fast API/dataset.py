"""Работа с основным CSV: проверка строк и безопасное добавление записей."""
import csv
import io
import math
import threading
from pathlib import Path

import pandas as pd

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "housing_az_realistic.csv"

# Порядок столбцов в существующем датасете
CSV_COLUMNS = ["PriceAZN", "Bedrooms", "Bathrooms", "Sqm", "City"]

# Одна блокировка на все операции с CSV: запись (добавление/импорт) и чтение для обучения
# не пересекаются, поэтому никто не прочитает наполовину записанный файл.
CSV_LOCK = threading.Lock()


class RowError(ValueError):
    pass


def _positive_number(value, name: str) -> float:
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError):
        raise RowError(f"{name}: ожидается число, получено '{value}'")
    if not math.isfinite(number) or number <= 0:
        raise RowError(f"{name}: должно быть положительным числом, получено '{value}'")
    return number


def _positive_int(value, name: str) -> int:
    number = _positive_number(value, name)
    if not number.is_integer():
        raise RowError(f"{name}: должно быть целым числом, получено '{value}'")
    return int(number)


def validate_row(price, bedrooms, bathrooms, sqm, city) -> dict:
    """Возвращает проверенную строку с названиями столбцов CSV или бросает RowError."""
    city = "" if city is None else str(city).strip()
    if not city:
        raise RowError("City: город не может быть пустым")
    return {
        "PriceAZN": _positive_number(price, "PriceAZN"),
        "Bedrooms": _positive_int(bedrooms, "Bedrooms"),
        "Bathrooms": _positive_int(bathrooms, "Bathrooms"),
        "Sqm": _positive_number(sqm, "Sqm"),
        "City": city,
    }


def parse_import(content: bytes) -> list[dict]:
    """Проверяет загруженный CSV целиком. При первой ошибке бросает RowError с номером строки."""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise RowError("Файл должен быть в кодировке UTF-8")

    reader = csv.DictReader(io.StringIO(text))
    header = [h.strip() for h in (reader.fieldnames or [])]
    missing = [c for c in CSV_COLUMNS if c not in header]
    if missing:
        raise RowError(f"Не хватает столбцов: {', '.join(missing)}. Нужны: {','.join(CSV_COLUMNS)}")
    reader.fieldnames = header  # убираем пробелы вокруг названий столбцов

    rows = []
    for raw in reader:
        try:
            rows.append(validate_row(raw["PriceAZN"], raw["Bedrooms"], raw["Bathrooms"],
                                     raw["Sqm"], raw["City"]))
        except RowError as e:
            # line_num — номер строки в файле, заголовок = строка 1
            raise RowError(f"Строка {reader.line_num}: {e}")
    if not rows:
        raise RowError("В файле нет строк с данными")
    return rows


def _format(value) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _count_records() -> int:
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return sum(1 for line in f if line.strip()) - 1  # минус заголовок


def append_rows(rows: list[dict]) -> int:
    """Дописывает строки в конец основного CSV (без заголовка и индекса). Возвращает общее число записей."""
    with CSV_LOCK:
        # если файл не заканчивается переводом строки, первая новая запись склеилась бы с последней
        with DATA_PATH.open("rb") as f:
            f.seek(0, 2)
            needs_newline = False
            if f.tell() > 0:
                f.seek(-1, 2)
                needs_newline = f.read(1) != b"\n"

        with DATA_PATH.open("a", encoding="utf-8", newline="") as f:
            if needs_newline:
                f.write("\n")
            writer = csv.writer(f, lineterminator="\n")
            for row in rows:
                # площадь в датасете хранится как float (68.0), цена — как целое
                writer.writerow([_format(row["PriceAZN"]), row["Bedrooms"], row["Bathrooms"],
                                 row["Sqm"], row["City"]])
        return _count_records()


def count_records() -> int:
    with CSV_LOCK:
        return _count_records()


def read_dataset() -> pd.DataFrame:
    with CSV_LOCK:
        return pd.read_csv(DATA_PATH)
