import { STORAGE_KEY, DAILY_TARGETS, GRADE_LABELS, GRADE_COLORS, NOVA_LABELS, } from "../shared/constants.js";
import { escapeHtml, formatGrams, formatCalories, getLocalDateKey, } from "../shared/utils.js";
function isFoodLogEntry(value) {
    if (!value || typeof value !== "object")
        return false;
    const e = value;
    const isNonNegativeFiniteNumber = (key) => typeof e[key] === "number" &&
        Number.isFinite(e[key]) &&
        e[key] >= 0;
    return (typeof e.id === "string" &&
        typeof e.name === "string" &&
        typeof e.date === "string" &&
        (e.mealId === null || e.mealId === undefined || typeof e.mealId === "string") &&
        (e.category === null || e.category === undefined || typeof e.category === "string") &&
        (e.thumbnail === null || e.thumbnail === undefined || typeof e.thumbnail === "string") &&
        (e.servings === undefined ||
            (typeof e.servings === "number" && Number.isFinite(e.servings) && e.servings > 0)) &&
        ["calories", "protein", "carbs", "fat"].every(isNonNegativeFiniteNumber));
}
export class FoodLogPage {
    section;
    api;
    navigateTo;
    entries;
    eventsBound = false;
    constructor(section, api, navigateTo) {
        this.section = section;
        this.api = api;
        this.navigateTo = navigateTo;
        this.entries = this.loadEntries();
    }
    initialize() {
        if (!this.eventsBound) {
            this.bindEvents();
            this.eventsBound = true;
        }
        this.render();
    }
    bindEvents() {
        this.section.addEventListener("click", (event) => {
            void this.handleSectionClick(event).catch((err) => {
                console.error("Food log click handler error:", err);
                this.showAlert("The food log could not be updated. Please try again.", "error");
            });
        });
        document.getElementById("log-meal-btn")?.addEventListener("click", (event) => {
            void this.handleLogMealClick(event).catch((err) => {
                console.error("Failed to log recipe:", err);
                this.showAlert("This recipe could not be added to your food log.", "error");
            });
        });
    }
    async logProduct(product) {
        const swal = this.requireSwal();
        const nutrients = product.nutrients;
        const grade = product.nutritionGrade?.toLowerCase() || "unknown";
        const gradeLabel = GRADE_LABELS[grade] ?? "Unavailable";
        const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS.unknown;
        const salt = nutrients?.salt ?? (nutrients?.sodium !== undefined ? nutrients.sodium * 2.5 : undefined);
        const imageHtml = product.image
            ? `<img class="mx-auto mb-3 block max-h-40 w-full rounded-xl bg-gray-50 object-contain"
              src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
            : "";
        const result = await swal.fire({
            title: escapeHtml(product.name),
            html: `
        <div class="text-left">
          ${imageHtml}
          <p class="mb-3 text-center text-sm text-gray-500">
            ${escapeHtml(product.brand || "Brand not provided")}
          </p>
          <div class="mb-4 flex flex-wrap justify-center gap-2">
            <span class="rounded-full px-2.5 py-1.5 text-xs font-bold text-white"
                  style="background:${gradeColor}">
              ${grade === "unknown" ? "Nutri-Score unavailable" : `${grade.toUpperCase()} Nutri-Score · ${gradeLabel}`}
            </span>
            <span class="rounded-full bg-lime-600 px-2.5 py-1.5 text-xs font-bold text-white">
              ${product.novaGroup
                ? `${product.novaGroup} NOVA · ${escapeHtml(NOVA_LABELS[product.novaGroup] ?? "Processed")}`
                : "NOVA unavailable"}
            </span>
          </div>
          <h3 class="mb-2.5 text-base font-bold text-gray-900">
            Nutrition Facts <span class="text-sm font-medium text-gray-500">(per 100g)</span>
          </h3>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            ${this.nutrientCell(formatCalories(nutrients?.calories), "Calories")}
            ${this.nutrientCell(formatGrams(nutrients?.protein), "Protein")}
            ${this.nutrientCell(formatGrams(nutrients?.carbs), "Carbs")}
            ${this.nutrientCell(formatGrams(nutrients?.fat), "Fat")}
            ${this.nutrientCell(formatGrams(nutrients?.sugar), "Sugar")}
            ${this.nutrientCell(formatGrams(nutrients?.saturatedFat), "Saturated Fat")}
            ${this.nutrientCell(formatGrams(nutrients?.fiber), "Fiber")}
            ${this.nutrientCell(formatGrams(salt, 2), "Salt")}
          </div>
        </div>
      `,
            showCancelButton: true,
            cancelButtonText: "Close",
            confirmButtonText: "Log This Food",
            confirmButtonColor: "#059669",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            focusConfirm: false,
            preConfirm: () => 1,
        });
        if (!result.isConfirmed)
            return;
        this.addEntry(product.name, {
            calories: nutrients?.calories ?? 0,
            protein: nutrients?.protein ?? 0,
            carbs: nutrients?.carbs ?? 0,
            fat: nutrients?.fat ?? 0,
        }, { category: "Product", thumbnail: product.image });
        this.showAlert(`${product.name} added to today's food log.`, "success", "Food Logged");
    }
    loadEntries() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.every(isFoodLogEntry)) {
            throw new Error("Saved food log data has an invalid format.");
        }
        return parsed.map((entry) => ({
            ...entry,
            mealId: entry.mealId ?? null,
            category: entry.category ?? null,
            thumbnail: entry.thumbnail ?? null,
            servings: entry.servings ?? 1,
        }));
    }
    saveEntries(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        this.entries = entries;
        this.render();
    }
    getTodayEntries() {
        const today = getLocalDateKey(new Date());
        return this.entries.filter((e) => e.date === today);
    }
    render() {
        this.renderDate();
        this.renderSummary();
        this.renderEntries();
        this.renderWeeklyChart();
    }
    renderDate() {
        const el = document.getElementById("foodlog-date");
        if (el) {
            el.textContent = new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
            }).format(new Date());
        }
    }
    renderSummary() {
        const todayEntries = this.getTodayEntries();
        const totals = todayEntries.reduce((sum, e) => ({
            calories: sum.calories + e.calories,
            protein: sum.protein + e.protein,
            carbs: sum.carbs + e.carbs,
            fat: sum.fat + e.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        const keys = ["calories", "protein", "carbs", "fat"];
        const cards = this.section.querySelectorAll("#foodlog-today-section > .grid > div");
        cards.forEach((card, i) => {
            const key = keys[i];
            if (!key)
                return;
            const valueEl = card.querySelector(".flex.items-center.justify-between span:last-child");
            const barEl = card.querySelector(".w-full > div");
            const amount = totals[key];
            const target = DAILY_TARGETS[key];
            const unit = key === "calories" ? " kcal" : " g";
            if (valueEl)
                valueEl.textContent = `${Math.round(amount)} / ${target}${unit}`;
            if (barEl)
                barEl.style.width = `${Math.min(100, (amount / target) * 100)}%`;
        });
    }
    renderEntries() {
        const list = document.getElementById("logged-items-list");
        if (!list)
            return;
        const todayEntries = this.getTodayEntries();
        const heading = this.section.querySelector("#foodlog-today-section h4");
        if (heading)
            heading.textContent = `Logged Items (${todayEntries.length})`;
        const clearBtn = document.getElementById("clear-foodlog");
        if (clearBtn)
            clearBtn.style.display = todayEntries.length ? "" : "none";
        list.replaceChildren();
        if (todayEntries.length === 0) {
            const empty = document.createElement("div");
            empty.className = "text-center py-8 text-gray-500";
            const msg = document.createElement("p");
            msg.className = "font-medium";
            msg.textContent = "No meals logged today";
            const hint = document.createElement("p");
            hint.className = "text-sm";
            hint.textContent = "Add meals from the Meals page or scan products";
            empty.append(msg, hint);
            list.append(empty);
            return;
        }
        for (const entry of todayEntries) {
            list.append(this.createEntryRow(entry));
        }
    }
    createEntryRow(entry) {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4";
        if (entry.thumbnail) {
            const img = document.createElement("img");
            img.src = entry.thumbnail;
            img.alt = "";
            img.className = "h-12 w-12 rounded-lg object-cover shrink-0";
            row.append(img);
        }
        const details = document.createElement("div");
        details.className = "flex-1 min-w-0";
        const name = document.createElement("p");
        name.className = "truncate font-semibold text-gray-900";
        name.textContent = entry.name;
        const nutrition = document.createElement("p");
        nutrition.className = "mt-1 text-sm text-gray-500";
        nutrition.textContent =
            `${entry.servings} serving${entry.servings === 1 ? "" : "s"} · ` +
                `${Math.round(entry.calories)} kcal · ` +
                `P ${entry.protein.toFixed(1)}g · ` +
                `C ${entry.carbs.toFixed(1)}g · F ${entry.fat.toFixed(1)}g`;
        details.append(name, nutrition);
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.dataset.entryId = entry.id;
        removeBtn.className = "shrink-0 text-sm font-medium text-red-500 hover:text-red-700";
        removeBtn.textContent = "Remove";
        removeBtn.setAttribute("aria-label", `Remove ${entry.name}`);
        row.append(details, removeBtn);
        return row;
    }
    renderWeeklyChart() {
        const chart = document.getElementById("weekly-chart");
        if (!chart)
            return;
        chart.className = "grid bg-transparent";
        chart.style.gridTemplateColumns = "repeat(auto-fit, minmax(100px, 1fr))";
        chart.style.gap = "0.5rem";
        chart.replaceChildren();
        const today = new Date();
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setHours(0, 0, 0, 0);
            d.setDate(today.getDate() - (6 - i));
            return d;
        });
        for (const date of weekDates) {
            const key = getLocalDateKey(date);
            const dayEntries = this.entries.filter((e) => e.date === key);
            const calories = dayEntries.reduce((sum, e) => sum + e.calories, 0);
            const isToday = key === getLocalDateKey(today);
            const hasEntries = dayEntries.length > 0;
            const card = document.createElement("div");
            card.className = [
                "flex min-h-36 flex-col items-center rounded-2xl px-2 py-3 text-center",
                hasEntries ? "bg-indigo-100" : "",
            ]
                .filter(Boolean)
                .join(" ");
            card.setAttribute("role", "group");
            card.setAttribute("aria-label", `${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}: ` +
                `${Math.round(calories)} calories, ${dayEntries.length} logged item${dayEntries.length === 1 ? "" : "s"}` +
                (isToday ? ", today" : ""));
            const weekday = document.createElement("span");
            weekday.className = "text-sm text-gray-500";
            weekday.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
            const dayNum = document.createElement("span");
            dayNum.className = "mt-1 text-base font-medium text-gray-900";
            dayNum.textContent = String(date.getDate());
            const calTotal = document.createElement("span");
            calTotal.className = [
                "mt-4 text-2xl font-bold",
                hasEntries ? "text-emerald-600" : "text-gray-300",
            ].join(" ");
            calTotal.textContent = String(Math.round(calories));
            const calUnit = document.createElement("span");
            calUnit.className = "text-sm text-gray-400";
            calUnit.textContent = "kcal";
            card.append(weekday, dayNum, calTotal, calUnit);
            if (hasEntries) {
                const itemCount = document.createElement("span");
                itemCount.className = "mt-1 text-sm text-gray-400";
                itemCount.textContent = `${dayEntries.length} item${dayEntries.length === 1 ? "" : "s"}`;
                card.append(itemCount);
            }
            chart.append(card);
        }
    }
    addEntry(name, nutrients, meal = null, servings = 1) {
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            mealId: meal?.id ?? null,
            name,
            category: meal?.category ?? null,
            thumbnail: meal?.thumbnail ?? null,
            servings,
            date: getLocalDateKey(new Date()),
            ...nutrients,
        };
        this.saveEntries([...this.entries, entry]);
    }
    async handleSectionClick(event) {
        if (!(event.target instanceof Element))
            return;
        if (event.target.closest("#clear-foodlog")) {
            const today = getLocalDateKey(new Date());
            this.saveEntries(this.entries.filter((e) => e.date !== today));
            return;
        }
        const removeBtn = event.target.closest("button[data-entry-id]");
        if (removeBtn?.dataset.entryId) {
            this.saveEntries(this.entries.filter((e) => e.id !== removeBtn.dataset.entryId));
            return;
        }
        const quickBtn = event.target.closest(".quick-log-btn");
        if (!quickBtn)
            return;
        const quickBtns = Array.from(this.section.querySelectorAll(".quick-log-btn"));
        const idx = quickBtns.indexOf(quickBtn);
        if (idx === 0) {
            this.navigateTo("");
        }
        else if (idx === 1) {
            this.navigateTo("products");
        }
        else if (idx === 2) {
            this.addCustomEntry();
        }
    }
    async handleLogMealClick(event) {
        const btn = event.currentTarget;
        if (!(btn instanceof HTMLButtonElement))
            return;
        const mealId = btn.dataset.mealId;
        if (!mealId) {
            this.showAlert("Open a recipe before logging it.", "error");
            return;
        }
        const swal = this.requireSwal();
        btn.disabled = true;
        try {
            const meal = await this.api.getMealById(mealId);
            const ingredientStrings = (meal.ingredients ?? []).map(({ measure, ingredient }) => [measure, ingredient].filter(Boolean).join(" "));
            const { data: facts } = await this.api.getNutritionFacts(meal.name, ingredientStrings);
            const { perServing } = facts;
            const result = await swal.fire({
                title: "Log This Meal",
                html: `
          <div class="text-left">
            <img src="${escapeHtml(meal.thumbnail)}" alt="${escapeHtml(meal.name)}"
                 class="mx-auto mb-4 block max-h-45 w-full rounded-xl object-cover">
            <h3 class="mb-4 text-lg font-bold text-gray-900">${escapeHtml(meal.name)}</h3>
            <label class="mb-1.5 block text-sm font-semibold text-gray-700"
                   for="foodlog-meal-servings">Number of Servings</label>
            <input id="foodlog-meal-servings"
                   class="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
                   type="number" min="1" step="1" value="1" inputmode="numeric">
            <p class="mb-2.5 mt-4 text-sm font-semibold text-gray-700">
              Estimated nutrition per serving:
            </p>
            <div class="grid grid-cols-2 gap-2">
              ${this.nutrientCell(String(Math.round(perServing.calories)), "Calories")}
              ${this.nutrientCell(`${Math.round(perServing.protein)}g`, "Protein")}
              ${this.nutrientCell(`${Math.round(perServing.carbs)}g`, "Carbs")}
              ${this.nutrientCell(`${Math.round(perServing.fat)}g`, "Fat")}
            </div>
          </div>
        `,
                showCancelButton: true,
                cancelButtonText: "Cancel",
                confirmButtonText: "Log Meal",
                confirmButtonColor: "#059669",
                cancelButtonColor: "#6b7280",
                reverseButtons: true,
                focusConfirm: false,
                preConfirm: () => {
                    const input = document.getElementById("foodlog-meal-servings");
                    const servings = Number(input?.value);
                    if (!Number.isInteger(servings) || servings < 1) {
                        swal.showValidationMessage("Enter a whole number of servings, at least 1.");
                        return false;
                    }
                    const safe = [perServing.calories, perServing.protein, perServing.carbs, perServing.fat];
                    if (!safe.every((v) => Number.isFinite(v * servings))) {
                        swal.showValidationMessage("That serving amount is too large to calculate.");
                        return false;
                    }
                    return servings;
                },
            });
            if (!result.isConfirmed || !result.value)
                return;
            const servings = result.value;
            this.addEntry(meal.name, {
                calories: perServing.calories * servings,
                protein: perServing.protein * servings,
                carbs: perServing.carbs * servings,
                fat: perServing.fat * servings,
            }, { id: meal.id, category: meal.category, thumbnail: meal.thumbnail }, servings);
            this.showAlert(`${meal.name} added to today's food log.`, "success");
        }
        finally {
            btn.disabled = false;
        }
    }
    addCustomEntry() {
        const name = window.prompt("Food name:");
        if (!name?.trim())
            return;
        const fields = [
            ["Calories", "calories"],
            ["Protein (g)", "protein"],
            ["Carbohydrates (g)", "carbs"],
            ["Fat (g)", "fat"],
        ];
        const nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        for (const [label, key] of fields) {
            const raw = window.prompt(`${label}:`, "0");
            if (raw === null)
                return;
            const amount = Number(raw);
            if (!Number.isFinite(amount) || amount < 0) {
                window.alert(`${label} must be a non-negative number.`);
                return;
            }
            nutrients[key] = amount;
        }
        this.addEntry(name.trim(), nutrients);
    }
    requireSwal() {
        if (!window.Swal) {
            throw new Error("SweetAlert2 (window.Swal) is not available on this page.");
        }
        return window.Swal;
    }
    showAlert(message, icon, title) {
        const defaultTitle = icon === "success" ? "Meal Logged" : "Unable to log meal";
        if (window.Swal) {
            void window.Swal.fire({
                title: title ?? defaultTitle,
                text: message,
                icon,
                showCancelButton: false,
                confirmButtonText: "OK",
                focusConfirm: true,
            });
        }
        else {
            window.alert(message);
        }
    }
    nutrientCell(value, label) {
        return `
      <div class="flex flex-col items-center gap-1 rounded-xl bg-gray-100 p-3 text-center">
        <strong class="text-lg text-gray-900">${escapeHtml(value)}</strong>
        <span class="text-xs text-gray-500">${escapeHtml(label)}</span>
      </div>
    `;
    }
}
