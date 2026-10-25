import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
    addApartment,
    importApartments,
    retrain,
    type ApartmentsOut,
    type RetrainOut,
} from "./api";
import { cities } from "./cities";

type Status<T> = { loading: boolean; error: string | null; result: T | null };

const idle = { loading: false, error: null, result: null };

const errorText = (error: unknown) =>
    error instanceof Error ? error.message : "Неизвестная ошибка";

const formatNumber = (value: number, digits = 0) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(value);

const emptyForm = { bedrooms: "", bathrooms: "", sqm: "", city: "", priceAZN: "" };

function DataPage() {
    // значения формы храним строками, чтобы поле можно было очистить
    const [form, setForm] = useState(emptyForm);
    // вместе с ответом сохраняем, что именно отправили — чтобы это было видно после очистки формы
    const [addStatus, setAddStatus] = useState<Status<ApartmentsOut & { apartment: typeof emptyForm }>>(idle);

    const fileInput = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState<Status<ApartmentsOut & { fileName: string }>>(idle);

    const [retrainStatus, setRetrainStatus] = useState<Status<RetrainOut>>(idle);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (addStatus.loading) return;

        setAddStatus({ loading: true, error: null, result: null });
        try {
            const result = await addApartment({
                bedrooms: Number(form.bedrooms),
                bathrooms: Number(form.bathrooms),
                sqm: Number(form.sqm),
                city: form.city,
                priceAZN: Number(form.priceAZN),
            });
            setAddStatus({ loading: false, error: null, result: { ...result, apartment: form } });
            setForm(emptyForm);
        } catch (error) {
            setAddStatus({ loading: false, error: errorText(error), result: null });
        }
    };

    const handleImport = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file || importStatus.loading) return;

        setImportStatus({ loading: true, error: null, result: null });
        try {
            const result = await importApartments(file);
            setImportStatus({ loading: false, error: null, result: { ...result, fileName: file.name } });
            setFile(null);
            if (fileInput.current) fileInput.current.value = "";
        } catch (error) {
            setImportStatus({ loading: false, error: errorText(error), result: null });
        }
    };

    const handleRetrain = async () => {
        if (retrainStatus.loading) return;

        setRetrainStatus({ loading: true, error: null, result: null });
        try {
            const result = await retrain();
            setRetrainStatus({ loading: false, error: null, result });
        } catch (error) {
            setRetrainStatus({ loading: false, error: errorText(error), result: null });
        }
    };

    const metrics = retrainStatus.result?.metrics;

    return (
        <main className="main-layout">
            <section className="calculator">
                <div className="eyebrow">
                    <span className="accent-line" />
                    УПРАВЛЕНИЕ ДАННЫМИ
                </div>

                <h1>
                    Новые данные —
                    <br />
                    <em>точнее модель.</em>
                </h1>

                <p className="intro">
                    Добавьте квартиры с известной ценой сделки, затем
                    переобучите модель. Новые записи попадают в конец датасета.
                </p>

                <form onSubmit={handleAdd} aria-busy={addStatus.loading}>
                    <fieldset disabled={addStatus.loading}>
                        <legend className="sr-only">Добавить квартиру</legend>

                        <div className="section-heading">
                            <span>01 — Добавить квартиру</span>
                            <span>Все поля обязательны</span>
                        </div>

                        <div className="data-grid">
                            <div className="field">
                                <label htmlFor="add-city">Город</label>
                                <div className="select-wrapper">
                                    <select
                                        id="add-city"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>
                                            Выберите город
                                        </option>
                                        {cities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="select-arrow" aria-hidden="true">↘</span>
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="add-price">Известная цена</label>
                                <div className="input-wrapper">
                                    <input
                                        id="add-price"
                                        name="priceAZN"
                                        type="number"
                                        min="1"
                                        step="any"
                                        required
                                        value={form.priceAZN}
                                        onChange={handleChange}
                                    />
                                    <span className="unit">₼</span>
                                </div>
                            </div>
                        </div>

                        <div className="numeric-fields">
                            <div className="field">
                                <label htmlFor="add-sqm">Площадь</label>
                                <div className="input-wrapper">
                                    <input
                                        id="add-sqm"
                                        name="sqm"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={form.sqm}
                                        onChange={handleChange}
                                    />
                                    <span className="unit">м²</span>
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="add-bedrooms">Спальни</label>
                                <input
                                    id="add-bedrooms"
                                    name="bedrooms"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={form.bedrooms}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="add-bathrooms">Ванные</label>
                                <input
                                    id="add-bathrooms"
                                    name="bathrooms"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={form.bathrooms}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button className="submit-button" type="submit">
                            <span>{addStatus.loading ? "Сохраняем" : "Добавить квартиру"}</span>
                            {addStatus.loading ? (
                                <span className="spinner" aria-hidden="true" />
                            ) : (
                                <span className="button-arrow" aria-hidden="true">+</span>
                            )}
                        </button>
                    </fieldset>

                    {addStatus.error && (
                        <p className="error-message" role="alert">{addStatus.error}</p>
                    )}
                    {addStatus.result && (
                        <p className="success-message" role="status">
                            {addStatus.result.message}:{" "}
                            <strong>
                                {addStatus.result.apartment.city}, {addStatus.result.apartment.sqm} м²,
                                спален {addStatus.result.apartment.bedrooms}, ванных {addStatus.result.apartment.bathrooms},
                                {" "}{formatNumber(Number(addStatus.result.apartment.priceAZN))} ₼
                            </strong>
                            <br />
                            Всего записей в датасете: <strong>{addStatus.result.totalRecords}</strong>
                        </p>
                    )}
                </form>

                <form className="import-form" onSubmit={handleImport} aria-busy={importStatus.loading}>
                    <fieldset disabled={importStatus.loading}>
                        <legend className="sr-only">Импорт из CSV</legend>

                        <div className="section-heading">
                            <span>02 — Импорт из CSV</span>
                            <span>PriceAZN,Bedrooms,Bathrooms,Sqm,City</span>
                        </div>

                        <label className="file-picker">
                            <input
                                ref={fileInput}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(event) => {
                                    setFile(event.target.files?.[0] ?? null);
                                    setImportStatus(idle);
                                }}
                            />
                            <span className="file-name">{file ? file.name : "Выберите CSV-файл"}</span>
                            <span className="file-action">Обзор</span>
                        </label>

                        <button className="submit-button secondary" type="submit" disabled={!file}>
                            <span>{importStatus.loading ? "Импортируем" : "Импортировать"}</span>
                            {importStatus.loading ? (
                                <span className="spinner" aria-hidden="true" />
                            ) : (
                                <span className="button-arrow" aria-hidden="true">↑</span>
                            )}
                        </button>
                    </fieldset>

                    {importStatus.error && (
                        <p className="error-message" role="alert">
                            Импорт {file ? `файла ${file.name} ` : ""}отклонён. {importStatus.error}
                        </p>
                    )}
                    {importStatus.result && (
                        <p className="success-message" role="status">
                            Файл <strong>{importStatus.result.fileName}</strong> импортирован.
                            <br />
                            Добавлено строк: <strong>{importStatus.result.added}</strong>. Всего записей:{" "}
                            <strong>{importStatus.result.totalRecords}</strong>
                        </p>
                    )}
                </form>
            </section>

            <aside className="property-panel" aria-label="Переобучение модели">
                <div className="panel-topline">
                    <span>МОДЕЛЬ RANDOM FOREST</span>
                    <span>№ 002</span>
                </div>

                <div className="retrain-body">
                    <p className="retrain-note">
                        Добавление данных само по себе не меняет модель. Нажмите
                        кнопку, чтобы обучить её заново на актуальном датасете —
                        следующие прогнозы будут использовать новую модель.
                    </p>

                    <button
                        className="submit-button"
                        type="button"
                        onClick={handleRetrain}
                        disabled={retrainStatus.loading}
                        aria-busy={retrainStatus.loading}
                    >
                        <span>
                            {retrainStatus.loading
                                ? "Идёт переобучение…"
                                : "Retrain — переобучить модель"}
                        </span>
                        {retrainStatus.loading ? (
                            <span className="spinner" aria-hidden="true" />
                        ) : (
                            <span className="button-arrow" aria-hidden="true">↻</span>
                        )}
                    </button>

                    {retrainStatus.error && (
                        <p className="error-message" role="alert">{retrainStatus.error}</p>
                    )}
                </div>

                <div className="valuation" aria-live="polite" aria-atomic="true">
                    <div className="valuation-label">
                        <span className={`status-dot ${retrainStatus.loading ? "is-loading" : ""}`} />
                        {retrainStatus.loading
                            ? "МОДЕЛЬ ОБУЧАЕТСЯ"
                            : metrics
                                ? "МЕТРИКИ НА ТЕСТОВОЙ ВЫБОРКЕ"
                                : "РЕЗУЛЬТАТ ПЕРЕОБУЧЕНИЯ"}
                    </div>

                    {retrainStatus.result && metrics ? (
                        <div className="result-content">
                            <dl className="metrics">
                                <div><dt>MAE</dt><dd>{formatNumber(metrics.mae)} ₼</dd></div>
                                <div><dt>RMSE</dt><dd>{formatNumber(metrics.rmse)} ₼</dd></div>
                                <div><dt>MSE</dt><dd>{formatNumber(metrics.mse)}</dd></div>
                                <div><dt>R²</dt><dd>{formatNumber(metrics.r2, 4)}</dd></div>
                            </dl>
                            <div className="result-details">
                                <span>
                                    {retrainStatus.result.message} · записей: {retrainStatus.result.recordsUsed}
                                </span>
                                <span>
                                    {new Date(retrainStatus.result.finishedAt).toLocaleString("ru-RU")}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-result">
                            <p>
                                {retrainStatus.loading
                                    ? "Обучаем RandomForest на актуальных данных…"
                                    : "Здесь появятся MAE, MSE, RMSE и R²."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="panel-bottomline">
                    <span>Обучение: 80% данных, проверка: 20%.</span>
                    <span aria-hidden="true">↻</span>
                </div>
            </aside>
        </main>
    );
}

export default DataPage;
