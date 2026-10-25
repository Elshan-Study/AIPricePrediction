const API = "http://localhost:5032/api";

export type PredictIn = {
    bedrooms:number,
    bathrooms:number,
    sqm:number,
    city:string,
}

export async function predict(data:PredictIn) {
    const response =
        await fetch(`${API}/AI/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    if (!response.ok) {
        throw new Error(`HTTP status ${response.status} with status ${response.statusText}`);
    }
    return response.json() as Promise<{priceAZN:number}>;
}

export type ApartmentIn = PredictIn & {
    priceAZN: number,
}

export type ApartmentsOut = {
    message: string,
    added: number,
    totalRecords: number,
}

export type RetrainOut = {
    message: string,
    recordsUsed: number,
    metrics: { mae: number, mse: number, rmse: number, r2: number },
    finishedAt: string,
}

// Достаёт понятный текст ошибки из ответа FastAPI ({detail}) или ASP.NET (ProblemDetails)
async function readError(response: Response): Promise<string> {
    const text = await response.text();
    try {
        const body = JSON.parse(text);
        if (typeof body.detail === "string") return body.detail;
        if (Array.isArray(body.detail)) {
            return body.detail.map((d: { msg: string }) => d.msg).join("; ");
        }
        if (body.errors) {
            return Object.values(body.errors).flat().join("; ");
        }
        if (body.title) return body.title;
    } catch {
        // ответ не JSON — покажем как есть
    }
    return text || `HTTP ${response.status} ${response.statusText}`;
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(url, init);
    } catch {
        throw new Error("Сервер недоступен. Проверьте, что ASP.NET API запущен.");
    }
    if (!response.ok) {
        throw new Error(await readError(response));
    }
    return response.json() as Promise<T>;
}

export function addApartment(data: ApartmentIn) {
    return send<ApartmentsOut>(`${API}/AI/apartments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export function importApartments(file: File) {
    const form = new FormData();
    form.append("file", file);
    // Content-Type с boundary браузер выставит сам
    return send<ApartmentsOut>(`${API}/AI/apartments/import`, {
        method: "POST",
        body: form,
    });
}

export function retrain() {
    return send<RetrainOut>(`${API}/AI/retrain`, { method: "POST" });
}
