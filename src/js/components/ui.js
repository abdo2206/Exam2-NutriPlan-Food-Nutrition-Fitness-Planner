import { MEAL_CATEGORY_ICONS } from "../shared/constants.js";
import { escapeHtml } from "../shared/utils.js";
function resolveContainer(target) {
    if (typeof target === "string") {
        return document.getElementById(target);
    }
    return target;
}
export function renderLoadingSpinner(target = "recipes-grid") {
    const el = resolveContainer(target);
    if (!el)
        return;
    el.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  `;
}
export function renderEmptyState(target = "recipes-grid", title = "No recipes found", description = "Try searching for something else") {
    const el = resolveContainer(target);
    if (!el)
        return;
    el.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${escapeHtml(title)}</p>
      <p class="text-gray-400 text-sm mt-2">${escapeHtml(description)}</p>
    </div>
  `;
}
export function areaButtonsRender(areas) {
    const container = document.getElementById("areaSection");
    if (!container)
        return;
    const allButton = createAreaButton("All Recipes", "all", true);
    container.replaceChildren(allButton);
    for (const area of areas.results) {
        container.append(createAreaButton(area.name, area.name, false));
    }
}
function createAreaButton(label, area, isActive) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.area = area;
    btn.className = [
        "area-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all",
        isActive
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    ].join(" ");
    btn.textContent = label;
    return btn;
}
export function categoriesRender(categories) {
    const grid = document.getElementById("categories-grid");
    if (!grid)
        return;
    grid.innerHTML = categories.results
        .map((cat) => {
        const icon = MEAL_CATEGORY_ICONS[cat.name.toLowerCase()] ?? "fa-utensils";
        return `
        <button
          class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200
                 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
          data-category="${escapeHtml(cat.name)}"
          type="button"
        >
          <div class="flex items-center gap-2.5">
            <div class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg
                        flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900">${escapeHtml(cat.name)}</h3>
            </div>
          </div>
        </button>
      `;
    })
        .join("");
}
export function renderMealCards(meals, target = "recipes-grid") {
    const grid = resolveContainer(target);
    if (!grid)
        return;
    if (meals.results.length === 0) {
        renderEmptyState(grid);
        return;
    }
    grid.innerHTML = meals.results.map(mealCardHtml).join("");
}
function mealCardHtml(meal) {
    const areaHidden = meal.area === null ? "hidden" : "";
    const area = meal.area ?? "";
    const firstInstruction = meal.instructions?.[0] ?? "No instructions available.";
    return `
    <div
      class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      data-meal-id="${escapeHtml(meal.id)}"
      role="button"
      tabindex="0"
      aria-label="View recipe: ${escapeHtml(meal.name)}"
    >
      <div class="relative h-48 overflow-hidden">
        <img
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          src="${escapeHtml(meal.thumbnail)}"
          alt="${escapeHtml(meal.name)}"
          loading="lazy"
        />
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            ${escapeHtml(meal.category)}
          </span>
          <span class="px-2 py-1 ${areaHidden} bg-emerald-500 text-xs font-semibold rounded-full text-white">
            ${escapeHtml(area)}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
          ${escapeHtml(meal.name)}
        </h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">
          ${escapeHtml(firstInstruction)}
        </p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900">
            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
            ${escapeHtml(meal.category)}
          </span>
          <span class="font-semibold text-gray-500 ${areaHidden}">
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
            ${escapeHtml(area)}
          </span>
        </div>
      </div>
    </div>
  `;
}
