import type { MealDBApi } from "../core/api.js";
import type { FilterMeals } from "../shared/types.js";
import {
  areaButtonsRender,
  categoriesRender,
  renderEmptyState,
  renderLoadingSpinner,
  renderMealCards,
} from "../components/ui.js";

export class HomePage {
  private readonly recipesGrid = document.getElementById("recipes-grid");
  private readonly recipesCount = document.getElementById("recipes-count");
  private readonly categoriesGrid = document.getElementById("categories-grid");
  private readonly areaSection = document.getElementById("areaSection");
  private readonly searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement | null;
  private readonly gridViewBtn = document.getElementById("grid-view-btn");
  private readonly twoColViewBtn = document.getElementById("list-view-btn");

  private isInitialized = false;
  private eventsBound = false;

  constructor(
    private readonly api: MealDBApi,
    private readonly onSelectMeal: (mealId: string) => void,
  ) {}

  async initialize(): Promise<void> {
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }

    if (this.isInitialized) return;

    document.getElementById("app-loading-overlay")?.classList.add("loading");
    renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");

    try {
      const [areas, categories, defaultMeals] = await Promise.all([
        this.api.allAreas(),
        this.api.allCategories(),
        this.api.getMealsByFilter("Chicken", 1, 25),
      ]);

      areaButtonsRender(areas);
      categoriesRender(categories);
      this.showFilteredMeals(defaultMeals);
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to load initial home page data:", error);
      renderEmptyState(
        this.recipesGrid ?? "recipes-grid",
        "Could not load recipes",
        "Check your connection and refresh the page.",
      );
    }
  }

  private bindEvents(): void {
    this.recipesGrid?.addEventListener("click", (event: MouseEvent) => {
      const card = (event.target as Element).closest<HTMLElement>(".recipe-card");
      const mealId = card?.dataset.mealId;
      if (mealId) {
        this.onSelectMeal(mealId);
      }
    });

    this.areaSection?.addEventListener("click", (event: MouseEvent) => {
      void this.handleAreaClick(event);
    });

    this.categoriesGrid?.addEventListener("click", (event: MouseEvent) => {
      void this.handleCategoryClick(event);
    });

    this.searchInput?.addEventListener("input", () => {
      void this.handleSearch();
    });

    this.gridViewBtn?.addEventListener("click", () => this.setRecipeView("four-column"));
    this.twoColViewBtn?.addEventListener("click", () => this.setRecipeView("two-column"));
    this.setRecipeView("four-column");
  }

  private async handleAreaClick(event: MouseEvent): Promise<void> {
    const btn = (event.target as Element).closest<HTMLElement>(".area-btn");
    const area = btn?.dataset.area;
    if (!area) return;

    this.areaSection?.querySelectorAll<HTMLButtonElement>(".area-btn").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("bg-emerald-600", active);
      b.classList.toggle("text-white", active);
      b.classList.toggle("hover:bg-emerald-700", active);
      b.classList.toggle("bg-gray-100", !active);
      b.classList.toggle("text-gray-700", !active);
      b.classList.toggle("hover:bg-gray-200", !active);
    });

    renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");
    try {
      const result =
        area === "all"
          ? await this.api.getMealsByFilter("Chicken", 1, 25)
          : await this.api.getMealsByArea(area, 1, 25);
      this.showFilteredMeals(result);
    } catch (err) {
      renderEmptyState(this.recipesGrid ?? "recipes-grid");
      console.error(`Failed to load meals for area "${area}":`, err);
    }
  }

  private async handleCategoryClick(event: MouseEvent): Promise<void> {
    const card = (event.target as Element).closest<HTMLElement>(".category-card");
    const category = card?.dataset.category;
    if (!category) return;

    renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");
    try {
      const result = await this.api.getMealsByFilter(category, 1, 25);
      this.showFilteredMeals(result);
    } catch (err) {
      renderEmptyState(this.recipesGrid ?? "recipes-grid");
      console.error(`Failed to load meals for category "${category}":`, err);
    }
  }

  private async handleSearch(): Promise<void> {
    const query = this.searchInput?.value.trim() ?? "";
    if (!query) return;

    renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");
    try {
      const result = await this.api.getMealBySearch(query, 1, 20);
      this.showFilteredMeals(result);
    } catch (err) {
      renderEmptyState(this.recipesGrid ?? "recipes-grid");
      console.error(`Search failed for "${query}":`, err);
    }
  }

  setRecipeView(view: "four-column" | "two-column"): void {
    const isFour = view === "four-column";
    this.recipesGrid?.classList.toggle("recipe-grid-two", !isFour);

    const buttons: Array<[HTMLElement | null, boolean]> = [
      [this.gridViewBtn, isFour],
      [this.twoColViewBtn, !isFour],
    ];

    buttons.forEach(([btn, active]) => {
      if (!btn) return;
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("rounded-md", active);
      btn.classList.toggle("shadow-sm", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.querySelector("i")?.classList.toggle("text-gray-700", active);
      btn.querySelector("i")?.classList.toggle("text-gray-500", !active);
    });
  }

  private showFilteredMeals(result: FilterMeals): void {
    if (this.recipesCount) {
      this.recipesCount.textContent = `Showing ${result.results.length} recipes`;
    }
    if (result.results.length === 0) {
      renderEmptyState(this.recipesGrid ?? "recipes-grid");
    } else {
      renderMealCards(result, this.recipesGrid ?? "recipes-grid");
    }
  }
}
