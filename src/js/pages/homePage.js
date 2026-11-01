import { areaButtonsRender, categoriesRender, renderEmptyState, renderLoadingSpinner, renderMealCards, } from "../components/ui.js";
export class HomePage {
    api;
    onSelectMeal;
    recipesGrid = document.getElementById("recipes-grid");
    recipesCount = document.getElementById("recipes-count");
    categoriesGrid = document.getElementById("categories-grid");
    areaSection = document.getElementById("areaSection");
    searchInput = document.getElementById("search-input");
    gridViewBtn = document.getElementById("grid-view-btn");
    twoColViewBtn = document.getElementById("list-view-btn");
    isInitialized = false;
    eventsBound = false;
    constructor(api, onSelectMeal) {
        this.api = api;
        this.onSelectMeal = onSelectMeal;
    }
    async initialize() {
        if (!this.eventsBound) {
            this.bindEvents();
            this.eventsBound = true;
        }
        if (this.isInitialized)
            return;
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
        }
        catch (error) {
            console.error("Failed to load initial home page data:", error);
            renderEmptyState(this.recipesGrid ?? "recipes-grid", "Could not load recipes", "Check your connection and refresh the page.");
        }
    }
    bindEvents() {
        this.recipesGrid?.addEventListener("click", (event) => {
            const card = event.target.closest(".recipe-card");
            const mealId = card?.dataset.mealId;
            if (mealId) {
                this.onSelectMeal(mealId);
            }
        });
        this.areaSection?.addEventListener("click", (event) => {
            void this.handleAreaClick(event);
        });
        this.categoriesGrid?.addEventListener("click", (event) => {
            void this.handleCategoryClick(event);
        });
        this.searchInput?.addEventListener("input", () => {
            void this.handleSearch();
        });
        this.gridViewBtn?.addEventListener("click", () => this.setRecipeView("four-column"));
        this.twoColViewBtn?.addEventListener("click", () => this.setRecipeView("two-column"));
        this.setRecipeView("four-column");
    }
    async handleAreaClick(event) {
        const btn = event.target.closest(".area-btn");
        const area = btn?.dataset.area;
        if (!area)
            return;
        this.areaSection?.querySelectorAll(".area-btn").forEach((b) => {
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
            const result = area === "all"
                ? await this.api.getMealsByFilter("Chicken", 1, 25)
                : await this.api.getMealsByArea(area, 1, 25);
            this.showFilteredMeals(result);
        }
        catch (err) {
            renderEmptyState(this.recipesGrid ?? "recipes-grid");
            console.error(`Failed to load meals for area "${area}":`, err);
        }
    }
    async handleCategoryClick(event) {
        const card = event.target.closest(".category-card");
        const category = card?.dataset.category;
        if (!category)
            return;
        renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");
        try {
            const result = await this.api.getMealsByFilter(category, 1, 25);
            this.showFilteredMeals(result);
        }
        catch (err) {
            renderEmptyState(this.recipesGrid ?? "recipes-grid");
            console.error(`Failed to load meals for category "${category}":`, err);
        }
    }
    async handleSearch() {
        const query = this.searchInput?.value.trim() ?? "";
        if (!query)
            return;
        renderLoadingSpinner(this.recipesGrid ?? "recipes-grid");
        try {
            const result = await this.api.getMealBySearch(query, 1, 20);
            this.showFilteredMeals(result);
        }
        catch (err) {
            renderEmptyState(this.recipesGrid ?? "recipes-grid");
            console.error(`Search failed for "${query}":`, err);
        }
    }
    setRecipeView(view) {
        const isFour = view === "four-column";
        this.recipesGrid?.classList.toggle("recipe-grid-two", !isFour);
        const buttons = [
            [this.gridViewBtn, isFour],
            [this.twoColViewBtn, !isFour],
        ];
        buttons.forEach(([btn, active]) => {
            if (!btn)
                return;
            btn.classList.toggle("bg-white", active);
            btn.classList.toggle("rounded-md", active);
            btn.classList.toggle("shadow-sm", active);
            btn.setAttribute("aria-pressed", String(active));
            btn.querySelector("i")?.classList.toggle("text-gray-700", active);
            btn.querySelector("i")?.classList.toggle("text-gray-500", !active);
        });
    }
    showFilteredMeals(result) {
        if (this.recipesCount) {
            this.recipesCount.textContent = `Showing ${result.results.length} recipes`;
        }
        if (result.results.length === 0) {
            renderEmptyState(this.recipesGrid ?? "recipes-grid");
        }
        else {
            renderMealCards(result, this.recipesGrid ?? "recipes-grid");
        }
    }
}
