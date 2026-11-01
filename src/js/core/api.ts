import { API_BASE_URL, API_KEY } from "../shared/constants.js";
import type {
  Areas,
  Categories,
  FilterMeals,
  Meal,
  MealDetails,
  NutritionAnalysisResponse,
  ProductCategoriesResponse,
  ProductLookupResponse,
  ProductsResponse,
} from "../shared/types.js";

export class MealDBApi {
  private readonly baseUrl = API_BASE_URL;
  readonly #apiKey = API_KEY;

  private async request<T>(
    path: string,
    description: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new Error(
        `Failed to ${description}: HTTP ${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as T;
  }

  allAreas(): Promise<Areas> {
    return this.request<Areas>("/meals/areas", "fetch meal areas", {
      cache: "force-cache",
    });
  }

  allCategories(): Promise<Categories> {
    return this.request<Categories>("/meals/categories", "fetch meal categories", {
      cache: "force-cache",
    });
  }

  getMealsByFilter(category: string, page = 1, limit = 25): Promise<FilterMeals> {
    const params = new URLSearchParams({
      category,
      page: String(page),
      limit: String(limit),
    });
    return this.request<FilterMeals>(
      `/meals/filter?${params}`,
      "fetch meals by category",
      { cache: "force-cache" },
    );
  }

  getMealsByArea(area: string, page = 1, limit = 25): Promise<FilterMeals> {
    const params = new URLSearchParams({
      area,
      page: String(page),
      limit: String(limit),
    });
    return this.request<FilterMeals>(
      `/meals/filter?${params}`,
      "fetch meals by area",
      { cache: "force-cache" },
    );
  }

  getMealBySearch(query: string, page = 1, limit = 20): Promise<FilterMeals> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    return this.request<FilterMeals>(
      `/meals/search?${params}`,
      "search meals",
      { cache: "force-cache" },
    );
  }

  async getMealById(id: string): Promise<Meal> {
    const data = await this.request<MealDetails>(
      `/meals/${encodeURIComponent(id)}`,
      "fetch meal",
      { cache: "force-cache" },
    );
    return data.result;
  }

  async getNutritionFacts(
    mealName: string,
    ingredients: string[],
  ): Promise<NutritionAnalysisResponse> {
    const response = await this.request<NutritionAnalysisResponse>(
      "/nutrition/analyze",
      "analyze nutrition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.#apiKey,
        },
        body: JSON.stringify({ mealName, ingredients }),
      },
    );

    if (!response.success || !response.data) {
      throw new Error("Nutrition analysis returned no data.");
    }
    return response;
  }

  getProductCategories(): Promise<ProductCategoriesResponse> {
    return this.request<ProductCategoriesResponse>(
      "/products/categories",
      "fetch product categories",
      { cache: "force-cache" },
    );
  }

  getProductsByCategory(
    category: string,
    page = 1,
    limit = 24,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return this.request<ProductsResponse>(
      `/products/category/${encodeURIComponent(category)}?${params}`,
      "fetch products by category",
      { cache: "force-cache" },
    );
  }

  searchProducts(query: string, page = 1, limit = 24): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    return this.request<ProductsResponse>(
      `/products/search?${params}`,
      "search products",
      { cache: "force-cache" },
    );
  }

  getProductByBarcode(barcode: string): Promise<ProductLookupResponse> {
    return this.request<ProductLookupResponse>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
      "look up product barcode",
      { cache: "force-cache" },
    );
  }
}
