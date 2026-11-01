import { API_BASE_URL, API_KEY } from "../shared/constants.js";
export class MealDBApi {
    baseUrl = API_BASE_URL;
    #apiKey = API_KEY;
    async request(path, description, init) {
        const response = await fetch(`${this.baseUrl}${path}`, init);
        if (!response.ok) {
            throw new Error(`Failed to ${description}: HTTP ${response.status} ${response.statusText}`);
        }
        return (await response.json());
    }
    allAreas() {
        return this.request("/meals/areas", "fetch meal areas", {
            cache: "force-cache",
        });
    }
    allCategories() {
        return this.request("/meals/categories", "fetch meal categories", {
            cache: "force-cache",
        });
    }
    getMealsByFilter(category, page = 1, limit = 25) {
        const params = new URLSearchParams({
            category,
            page: String(page),
            limit: String(limit),
        });
        return this.request(`/meals/filter?${params}`, "fetch meals by category", { cache: "force-cache" });
    }
    getMealsByArea(area, page = 1, limit = 25) {
        const params = new URLSearchParams({
            area,
            page: String(page),
            limit: String(limit),
        });
        return this.request(`/meals/filter?${params}`, "fetch meals by area", { cache: "force-cache" });
    }
    getMealBySearch(query, page = 1, limit = 20) {
        const params = new URLSearchParams({
            q: query,
            page: String(page),
            limit: String(limit),
        });
        return this.request(`/meals/search?${params}`, "search meals", { cache: "force-cache" });
    }
    async getMealById(id) {
        const data = await this.request(`/meals/${encodeURIComponent(id)}`, "fetch meal", { cache: "force-cache" });
        return data.result;
    }
    async getNutritionFacts(mealName, ingredients) {
        const response = await this.request("/nutrition/analyze", "analyze nutrition", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.#apiKey,
            },
            body: JSON.stringify({ mealName, ingredients }),
        });
        if (!response.success || !response.data) {
            throw new Error("Nutrition analysis returned no data.");
        }
        return response;
    }
    getProductCategories() {
        return this.request("/products/categories", "fetch product categories", { cache: "force-cache" });
    }
    getProductsByCategory(category, page = 1, limit = 24) {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });
        return this.request(`/products/category/${encodeURIComponent(category)}?${params}`, "fetch products by category", { cache: "force-cache" });
    }
    searchProducts(query, page = 1, limit = 24) {
        const params = new URLSearchParams({
            q: query,
            page: String(page),
            limit: String(limit),
        });
        return this.request(`/products/search?${params}`, "search products", { cache: "force-cache" });
    }
    getProductByBarcode(barcode) {
        return this.request(`/products/barcode/${encodeURIComponent(barcode)}`, "look up product barcode", { cache: "force-cache" });
    }
}
