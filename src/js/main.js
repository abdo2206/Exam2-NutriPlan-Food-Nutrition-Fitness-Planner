import { MealDBApi } from "./core/api.js";
import { AppRouter } from "./core/router.js";
import { SidebarController } from "./components/sidebar.js";
import { HomePage } from "./pages/homePage.js";
import { MealDetailsPage } from "./pages/mealDetailsPage.js";
import { FoodLogPage } from "./pages/foodLogPage.js";
import { ProductsPage } from "./pages/productsPage.js";
const foodlogSection = document.getElementById("foodlog-section");
const api = new MealDBApi();
const sidebar = new SidebarController();
sidebar.init();
let router;
const foodLogPage = new FoodLogPage(foodlogSection, api, (page) => {
    router.navigate(page);
});
foodLogPage.initialize();
const homePage = new HomePage(api, (mealId) => {
    router.navigate(`meal/${encodeURIComponent(mealId)}`);
});
const mealPage = new MealDetailsPage(api);
const productsPage = new ProductsPage(api, async (product) => {
    await foodLogPage.logProduct(product);
});
router = new AppRouter({
    homePage,
    mealPage,
    foodLogPage,
    productsPage,
    onNavigate: () => sidebar.close(),
});
router.init();
