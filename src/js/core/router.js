let activeRouter = null;
export function getCurrentRoute() {
    const { pathname } = window.location;
    const mealMatch = pathname.match(/^\/meal\/([^/]+)\/?$/);
    const mealId = mealMatch?.[1];
    if (mealId !== undefined) {
        return { page: "meal", mealId: decodeURIComponent(mealId) };
    }
    const page = pathname.replace(/^\/|\/$/g, "");
    if (page === "foodlog" || page === "products") {
        return { page };
    }
    return { page: "home" };
}
export function navigate(page) {
    if (activeRouter) {
        activeRouter.navigate(page);
    }
    else {
        history.pushState({}, "", `/${page}`);
    }
}
export class AppRouter {
    config;
    pageTitle = document.querySelector("#header h1");
    pageDesc = document.querySelector("#header p");
    mealCategoriesSection = document.getElementById("meal-categories-section");
    searchFiltersSection = document.getElementById("search-filters-section");
    allRecipesSection = document.getElementById("all-recipes-section");
    mealDetailsSection = document.getElementById("meal-details");
    foodlogSection = document.getElementById("foodlog-section");
    productsSection = document.getElementById("products-section");
    navLinks = document.querySelectorAll(".nav-link");
    backToMealsBtn = document.getElementById("back-to-meals-btn");
    constructor(config) {
        this.config = config;
        activeRouter = this;
    }
    init() {
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
    navigate(page) {
        history.pushState({}, "", `/${page}`);
        this.config.onNavigate?.();
        this.renderCurrentRoute();
    }
    renderCurrentRoute() {
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
            void this.config.homePage.initialize().catch((err) => {
                console.error("Failed to initialize Home Page:", err);
            });
        }
        if (isProducts) {
            void this.config.productsPage.initialize().catch((err) => {
                console.error("Failed to initialize Products Page:", err);
            });
        }
        if (isMeal) {
            const mealId = route.mealId;
            void this.config.mealPage.render(mealId).catch((err) => {
                console.error(`Failed to render meal details for ID "${mealId}":`, err);
            });
        }
        if (isFoodlog) {
            this.config.foodLogPage.render();
        }
    }
}
