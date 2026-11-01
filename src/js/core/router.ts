import type { Route, RouterConfig } from "../shared/types.js";

let activeRouter: AppRouter | null = null;

export function getCurrentRoute(): Route {
  const { pathname } = window.location;

  const mealMatch = pathname.match(/^\/meal\/([^/]+)\/?$/);
  const mealId = mealMatch?.[1];
  if (mealId !== undefined) {
    return { page: "meal", mealId: decodeURIComponent(mealId) };
  }

  const page = pathname.replace(/^\/|\/$/g, "");
  if (page === "foodlog" || page === "products") {
    return { page } as Route;
  }

  return { page: "home" };
}

export function navigate(page: string): void {
  if (activeRouter) {
    activeRouter.navigate(page);
  } else {
    history.pushState({}, "", `/${page}`);
  }
}

export class AppRouter {
  private readonly pageTitle: HTMLElement | null =
    document.querySelector("#header h1");
  private readonly pageDesc: HTMLElement | null =
    document.querySelector("#header p");

  private readonly mealCategoriesSection = document.getElementById(
    "meal-categories-section",
  );
  private readonly searchFiltersSection = document.getElementById(
    "search-filters-section",
  );
  private readonly allRecipesSection = document.getElementById(
    "all-recipes-section",
  );
  private readonly mealDetailsSection = document.getElementById("meal-details");
  private readonly foodlogSection = document.getElementById("foodlog-section");
  private readonly productsSection = document.getElementById("products-section");

  private readonly navLinks =
    document.querySelectorAll<HTMLAnchorElement>(".nav-link");
  private readonly backToMealsBtn =
    document.getElementById("back-to-meals-btn");

  constructor(private readonly config: RouterConfig) {
    activeRouter = this;
  }

  init(): void {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page !== undefined) {
          this.navigate(page);
        }
      });
    });

    this.backToMealsBtn?.addEventListener("click", () => {
      this.navigate("");
    });

    window.addEventListener("popstate", () => {
      this.renderCurrentRoute();
      this.config.onNavigate?.();
    });

    this.renderCurrentRoute();
  }

  navigate(page: string): void {
    history.pushState({}, "", `/${page}`);
    this.config.onNavigate?.();
    this.renderCurrentRoute();
  }

  renderCurrentRoute(): void {
    const route = getCurrentRoute();
    const { page } = route;

    const isHome = page === "home";
    const isMeal = page === "meal";
    const isFoodlog = page === "foodlog";
    const isProducts = page === "products";

    if (this.pageTitle) {
      this.pageTitle.textContent =
        isMeal ? "Recipe Details"
        : isFoodlog ? "Food Log"
        : isProducts ? "Product Scanner"
        : "Meals & Recipes";
    }

    if (this.pageDesc) {
      this.pageDesc.textContent =
        isMeal ? "View full recipe information and nutrition facts"
        : isFoodlog ? "Track your daily nutrition and food intake"
        : isProducts ? "Search products and scan barcodes"
        : "Discover delicious and nutritious recipes tailored for you";
    }

    this.mealCategoriesSection?.classList.toggle("hidden", !isHome);
    this.searchFiltersSection?.classList.toggle("hidden", !isHome);
    this.allRecipesSection?.classList.toggle("hidden", !isHome);
    this.mealDetailsSection?.classList.toggle("hidden", !isMeal);
    this.foodlogSection?.classList.toggle("hidden", !isFoodlog);
    this.productsSection?.classList.toggle("hidden", !isProducts);

    const activePage = isMeal ? "home" : page;
    this.navLinks.forEach((link) => {
      const active = link.dataset.page === activePage;
      link.classList.toggle("bg-emerald-50", active);
      link.classList.toggle("text-emerald-700", active);
      link.classList.toggle("text-gray-600", !active);
    });

    if (isHome) {
      void this.config.homePage.initialize().catch((err: unknown) => {
        console.error("Failed to initialize Home Page:", err);
      });
    }

    if (isProducts) {
      void this.config.productsPage.initialize().catch((err: unknown) => {
        console.error("Failed to initialize Products Page:", err);
      });
    }

    if (isMeal) {
      const mealId = (route as { page: "meal"; mealId: string }).mealId;
      void this.config.mealPage.render(mealId).catch((err: unknown) => {
        console.error(`Failed to render meal details for ID "${mealId}":`, err);
      });
    }

    if (isFoodlog) {
      this.config.foodLogPage.render();
    }
  }
}
