import { useState, type ChangeEvent, type FormEvent } from "react";
import { predict, type PredictIn } from "./api";
import { cities } from "./cities";

import "./App.css";

const formatPrice = (value: number) =>
    new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value);

function App() {
  const [formData, setFormData] = useState<PredictIn>({
    bedrooms: 2,
    bathrooms: 1,
    sqm: 85,
    city: "",
  });

  const [result, setResult] = useState<{
    price: number;
    data: PredictIn;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
      event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "city" ? value : Number(value),
    }));

    setResult(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const submittedData = { ...formData };

    try {
      const response = await predict(submittedData);

      if (
          typeof response.priceAZN !== "number" ||
          !Number.isFinite(response.priceAZN) ||
          response.priceAZN < 0
      ) {
        throw new Error("Сервис вернул некорректную стоимость.");
      }

      setResult({
        price: response.priceAZN,
        data: submittedData,
      });
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Не удалось выполнить расчёт. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="estate-app">
        <header className="site-header">
          <a className="wordmark" href="./" aria-label="Məkan — главная">
            məkan<span>.</span>
          </a>

          <span className="header-caption">
                    Недвижимость в цифрах
                </span>

          <span className="edition">AZ / 01</span>
        </header>

        <main className="main-layout">
          <section className="calculator">
            <div className="eyebrow">
              <span className="accent-line" />
              ОЦЕНКА НЕДВИЖИМОСТИ
            </div>

            <h1>
              У каждого
              <br />
              пространства
              <br />
              <em>своя цена.</em>
            </h1>

            <p className="intro">
              Несколько деталей о вашем доме —
              и модель рассчитает его ориентировочную стоимость.
            </p>

            <form onSubmit={handleSubmit} aria-busy={loading}>
              <fieldset disabled={loading}>
                <legend className="sr-only">
                  Параметры недвижимости
                </legend>

                <div className="section-heading">
                  <span>01 — Параметры объекта</span>
                  <span>Все поля обязательны</span>
                </div>

                <div className="field city-field">
                  <label htmlFor="city">Город</label>

                  <div className="select-wrapper">
                    <select
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    >
                      <option value="" disabled>
                        Выберите расположение
                      </option>

                      {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                      ))}
                    </select>

                    <span
                        className="select-arrow"
                        aria-hidden="true"
                    >
                                        ↘
                                    </span>
                  </div>
                </div>

                <div className="numeric-fields">
                  <div className="field">
                    <label htmlFor="sqm">Площадь</label>

                    <div className="input-wrapper">
                      <input
                          id="sqm"
                          name="sqm"
                          type="number"
                          min="1"
                          step="0.01"
                          required
                          value={formData.sqm}
                          onChange={handleChange}
                      />
                      <span className="unit">м²</span>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="bedrooms">Спальни</label>
                    <input
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={formData.bedrooms}
                        onChange={handleChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="bathrooms">Ванные</label>
                    <input
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={formData.bathrooms}
                        onChange={handleChange}
                    />
                  </div>
                </div>

                <button className="submit-button" type="submit">
                                <span>
                                    {loading
                                        ? "Рассчитываем стоимость"
                                        : "Узнать стоимость"}
                                </span>

                  {loading ? (
                      <span
                          className="spinner"
                          aria-hidden="true"
                      />
                  ) : (
                      <span
                          className="button-arrow"
                          aria-hidden="true"
                      >
                                        ↗
                                    </span>
                  )}
                </button>
              </fieldset>

              {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
              )}
            </form>

            <p className="form-footnote">
              На основе площади, расположения и количества комнат.
            </p>
          </section>

          <aside className="property-panel" aria-label="Результат оценки">
            <div className="panel-topline">
              <span>ПРОСТРАНСТВО ДЛЯ ЖИЗНИ</span>
              <span>№ 001</span>
            </div>

            <div className="architecture" aria-hidden="true">
              <svg viewBox="0 0 520 390" fill="none">
                <defs>
                  <pattern
                      id="facade-lines"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                  >
                    <path
                        d="M0 0V10"
                        stroke="#b7b2a4"
                        strokeWidth="1"
                    />
                  </pattern>
                </defs>

                <circle cx="365" cy="110" r="65" fill="#c16a4b" />

                <path
                    d="M48 332H475M77 347H449"
                    stroke="#a5a293"
                />

                <path
                    d="M120 173L300 123L426 188L245 243Z"
                    fill="#f5f0e5"
                    stroke="#55594d"
                />

                <path
                    d="M120 173L245 243V332L120 261Z"
                    fill="#c5c6b6"
                    stroke="#55594d"
                />

                <path
                    d="M245 243L426 188V277L245 332Z"
                    fill="#e8e4d7"
                    stroke="#55594d"
                />

                <path
                    d="M269 251L404 211V264L269 305Z"
                    fill="#535e54"
                />

                <path
                    d="M304 241V295M339 231V285M374 220V274"
                    stroke="#d7d9c8"
                    strokeWidth="3"
                />

                <path
                    d="M140 203L222 249V296L140 250Z"
                    fill="url(#facade-lines)"
                    stroke="#777c6d"
                />

                <path
                    d="M171 160V105L287 72L287 126"
                    fill="#e7e2d5"
                    stroke="#55594d"
                />

                <path
                    d="M171 105L224 134L339 101L287 72Z"
                    fill="#faf6ec"
                    stroke="#55594d"
                />

                <path
                    d="M224 134V182L339 149V101Z"
                    fill="#d4d4c3"
                    stroke="#55594d"
                />

                <path
                    d="M240 142L320 119V143L240 166Z"
                    fill="#657164"
                />

                <path
                    d="M97 332V272M83 294L97 272L111 294"
                    stroke="#656f5b"
                />

                <path
                    d="M443 306V246M429 268L443 246L457 268"
                    stroke="#656f5b"
                />

                <path
                    d="M120 355H426M120 350V360M426 350V360"
                    stroke="#949889"
                />
              </svg>

              <span className="drawing-caption">
                            Форма. Функция. Ценность.
                        </span>
            </div>

            <div
                className="valuation"
                aria-live="polite"
                aria-atomic="true"
            >
              <div className="valuation-label">
                            <span
                                className={`status-dot ${loading ? "is-loading" : ""}`}
                            />
                {loading
                    ? "МОДЕЛЬ ВЫПОЛНЯЕТ РАСЧЁТ"
                    : result
                        ? "ОРИЕНТИРОВОЧНАЯ СТОИМОСТЬ"
                        : "ВАША БУДУЩАЯ ОЦЕНКА"}
              </div>

              {result ? (
                  <div className="result-content">
                    <div className="price">
                      {formatPrice(result.price)}
                      <span>₼</span>
                    </div>

                    <div className="result-details">
                                    <span>
                                        {result.data.city} · {result.data.sqm} м²
                                    </span>
                      <span>
                                        {formatPrice(
                                            result.price / result.data.sqm,
                                        )}{" "}
                        ₼ / м²
                                    </span>
                    </div>
                  </div>
              ) : (
                  <div className="empty-result">
                    <div className="placeholder-price">
                      — — —
                      <span>₼</span>
                    </div>
                    <p>
                      {loading
                          ? "Сопоставляем параметры вашего объекта…"
                          : "Заполните параметры — здесь появится результат."}
                    </p>
                  </div>
              )}
            </div>

            <div className="panel-bottomline">
              <span>Оценка модели, не цена сделки.</span>
              <span aria-hidden="true">↗</span>
            </div>
          </aside>
        </main>

        <footer className="site-footer">
          <span>MƏKAN — PROPERTY INTELLIGENCE</span>
          <span>Азербайджан / AZN</span>
        </footer>
      </div>
  );
}

export default App;