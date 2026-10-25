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