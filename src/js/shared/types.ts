export interface Category {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
}

export interface Categories {
  message: string;
  results: Category[];
}

export interface Area {
  name: string;
}

export interface Areas {
  message: string;
  results: Area[];
}

export interface Ingredient {
  ingredient: string;
  measure: string;
}

export interface Meal {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string[];
  thumbnail: string;
  tags: string[];
  youtube: string;
  source: string | null;
  ingredients: Ingredient[];
}

export interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface FilterMeals {
  message: string;
  pagination: Pagination;
  results: Meal[];
}

export interface MealDetails {
  message: string;
  result: Meal;
}

export interface NutritionValues {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  cholesterol: number;
  sodium: number;
}

export interface ParsedNutritionIngredient {
  quantity: number;
  unit: string;
  foodName: string;
}

export interface MatchedNutritionIngredient {
  fdcId: number;
  description: string;
  dataType: string;
}

export interface AnalyzedNutritionIngredient {
  original: string;
  parsed: ParsedNutritionIngredient;
  matched: MatchedNutritionIngredient;
  grams: number;
  nutrition: NutritionValues;
}

export interface NutritionWarning {
  code: string;
  message: string;
  ingredient: string;
}

export interface NutritionAnalysisData {
  recipeName: string;
  servings: number;
  totalWeight: number;
  totals: NutritionValues;
  perServing: NutritionValues;
  ingredients: AnalyzedNutritionIngredient[];
}

export interface NutritionAnalysisResponse {
  success: boolean;
  data: NutritionAnalysisData;
  warnings?: NutritionWarning[];
}

export interface ProductNutrients {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  sugar: number;
  fiber?: number;
  sodium?: number;
  salt?: number;
  saturatedFat?: number;
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutritionGrade: string;
  novaGroup?: number;
  nutrients?: ProductNutrients;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductCategoriesResponse {
  message: string;
  pagination: Pagination;
  results: ProductCategory[];
}

export interface ProductsResponse {
  message: string;
  pagination: Pagination;
  results: Product[];
}

export interface ProductLookupResponse {
  message: string;
  result: Product;
}

export type FoodLogNutrients = Pick<
  NutritionValues,
  "calories" | "protein" | "carbs" | "fat"
>;

export interface FoodLogEntry extends FoodLogNutrients {
  id: string;
  mealId: string | null;
  name: string;
  category: string | null;
  thumbnail: string | null;
  servings: number;
  date: string;
}

export type Route =
  | { page: "home" }
  | { page: "meal"; mealId: string }
  | { page: "foodlog" }
  | { page: "products" };

export interface IHomePage {
  initialize(): Promise<void>;
}

export interface IMealDetailsPage {
  render(mealId: string): Promise<void>;
}

export interface IFoodLogPage {
  render(): void;
}

export interface IProductsPage {
  initialize(): Promise<void>;
}

export interface RouterConfig {
  homePage: IHomePage;
  mealPage: IMealDetailsPage;
  foodLogPage: IFoodLogPage;
  productsPage: IProductsPage;
  onNavigate?: () => void;
}

export interface SweetAlertFireOptions {
  title: string;
  html?: string;
  text?: string;
  icon?: "success" | "error" | "warning" | "info" | "question";
  showCancelButton?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  reverseButtons?: boolean;
  focusConfirm?: boolean;
  didOpen?: (popup: HTMLElement) => void;
  preConfirm?: () => unknown;
  inputAttributes?: Record<string, string>;
}

export interface SweetAlertResult<T = unknown> {
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
  value?: T;
}

export interface SweetAlert2 {
  fire<T = unknown>(
    options: SweetAlertFireOptions,
  ): Promise<SweetAlertResult<T>>;
  showValidationMessage(message: string): void;
}
