import { MACRO_DEFINITIONS } from "../shared/constants.js";
import type { MealDBApi } from "../core/api.js";
import type { Meal } from "../shared/types.js";

export class MealDetailsPage {
  private currentMealId = "";
  private mealPromise: Promise<Meal> | null = null;

  constructor(private readonly api: MealDBApi) {}

  async render(mealId: string): Promise<void> {
    this.currentMealId = mealId;
    this.mealPromise = this.api.getMealById(mealId);

    await Promise.all([
      this.renderThumbnail(),
      this.renderIngredients(),
      this.renderInstructions(),
      this.renderVideo(),
      this.renderNutritionFacts(),
    ]);
  }

  private getMeal(): Promise<Meal> {
    if (!this.mealPromise) {
      this.mealPromise = this.api.getMealById(this.currentMealId);
    }
    return this.mealPromise;
  }

  private getSection(): HTMLElement {
    const el = document.getElementById("meal-details");
    if (!el) throw new Error('Could not find "#meal-details" section.');
    return el;
  }

  private getCard(heading: string): HTMLElement {
    const section = this.getSection();
    const card = Array.from(section.querySelectorAll<HTMLElement>(".bg-white")).find(
      (el) => el.querySelector("h2")?.textContent?.trim().startsWith(heading),
    );
    if (!card) throw new Error(`Could not find detail card for "${heading}".`);
    return card;
  }

  private async renderThumbnail(): Promise<void> {
    const meal = await this.getMeal();
    const section = this.getSection();

    const hero = section.querySelector<HTMLElement>(".relative.h-80");
    const img = hero?.querySelector<HTMLImageElement>("img");
    const title = hero?.querySelector<HTMLElement>("h1");
    const badges = hero?.querySelector<HTMLElement>(".absolute.bottom-0 .flex");
    if (!img || !title || !badges) {
      throw new Error("Could not find hero elements in meal detail.");
    }

    img.src = meal.thumbnail;
    img.alt = meal.name;
    title.textContent = meal.name;
    badges.replaceChildren();

    const badgeDefs: Array<[string | null, string]> = [
      [meal.category, "bg-emerald-500"],
      [meal.area, "bg-blue-500"],
      ...(meal.tags ?? []).map<[string, string]>((tag) => [tag, "bg-purple-500"]),
    ];

    for (const [label, colorClass] of badgeDefs) {
      if (!label) continue;
      const badge = document.createElement("span");
      badge.className = `px-3 py-1 ${colorClass} text-white text-sm font-semibold rounded-full`;
      badge.textContent = label;
      badges.append(badge);
    }

    const logBtn = section.querySelector<HTMLButtonElement>("#log-meal-btn");
    if (logBtn) logBtn.dataset.mealId = meal.id;
  }

  private async renderIngredients(): Promise<void> {
    const meal = await this.getMeal();
    const card = this.getCard("Ingredients");
    const list = card.querySelector<HTMLElement>(".grid");
    if (!list) throw new Error("Could not find ingredients grid.");

    list.replaceChildren();
    for (const { ingredient, measure } of meal.ingredients ?? []) {
      const item = document.createElement("div");
      item.className =
        "flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className =
        "ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300";

      const label = document.createElement("span");
      label.className = "text-gray-700";

      const amount = document.createElement("span");
      amount.className = "font-medium text-gray-900";
      amount.textContent = measure;
      label.append(amount, document.createTextNode(` ${ingredient}`));

      item.append(checkbox, label);
      list.append(item);
    }

    const countSpan = card.querySelector("h2 span");
    if (countSpan) countSpan.textContent = `${meal.ingredients?.length ?? 0} items`;
  }

  private async renderInstructions(): Promise<void> {
    const meal = await this.getMeal();
    const card = this.getCard("Instructions");
    const list = card.querySelector<HTMLElement>(".space-y-4");
    if (!list) throw new Error("Could not find instructions list.");

    list.replaceChildren();
    (meal.instructions ?? []).forEach((instruction, index) => {
      const step = document.createElement("div");
      step.className = "flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors";

      const num = document.createElement("div");
      num.className =
        "w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0";
      num.textContent = String(index + 1);

      const text = document.createElement("p");
      text.className = "text-gray-700 leading-relaxed pt-2";
      text.textContent = instruction;

      step.append(num, text);
      list.append(step);
    });
  }

  private async renderVideo(): Promise<void> {
    const meal = await this.getMeal();
    const iframe = this.getSection().querySelector<HTMLIFrameElement>(
      ".aspect-video iframe",
    );
    if (!iframe) throw new Error("Could not find video iframe.");

    const videoId = meal.youtube.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&/]+)/i,
    )?.[1];

    if (videoId) {
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
      iframe.title = `${meal.name} video tutorial`;
      iframe.hidden = false;
    } else {
      iframe.removeAttribute("src");
      iframe.hidden = true;
    }
  }

  private async renderNutritionFacts(): Promise<void> {
    const meal = await this.getMeal();
    const section = this.getSection();
    const container = section.querySelector<HTMLElement>("#nutrition-facts-container");
    if (!container) throw new Error("Could not find #nutrition-facts-container.");

    const heroServings = section.querySelector<HTMLElement>("#hero-servings");
    const heroCalories = section.querySelector<HTMLElement>("#hero-calories");

    try {
      const ingredientStrings = (meal.ingredients ?? []).map(
        ({ measure, ingredient }) =>
          [measure, ingredient].filter(Boolean).join(" "),
      );
      const { data: facts, warnings } = await this.api.getNutritionFacts(
        meal.name,
        ingredientStrings,
      );

      if (warnings?.length) {
        console.warn(`Nutrition warnings for meal ${meal.id}:`, warnings);
      }

      const { perServing, totals, servings } = facts;

      if (heroServings) heroServings.textContent = `${servings} servings`;
      if (heroCalories) {
        heroCalories.textContent = `${Math.round(perServing.calories)} cal/serving`;
      }

      const calorieCard = container.querySelector(".text-center");
      const calorieParagraphs = calorieCard?.querySelectorAll("p");
      if (calorieParagraphs?.[1]) {
        calorieParagraphs[1].textContent = String(Math.round(perServing.calories));
      }
      if (calorieParagraphs?.[2]) {
        calorieParagraphs[2].textContent = `Total: ${Math.round(totals.calories)} cal`;
      }

      container
        .querySelectorAll(".space-y-4 > .flex.items-center.justify-between")
        .forEach((row) => {
          const label = row
            .querySelector(".flex.items-center.gap-2 span")
            ?.textContent?.trim() as keyof typeof MACRO_DEFINITIONS | undefined;
          const def = label ? MACRO_DEFINITIONS[label] : undefined;
          if (!def) return;

          const valueEl = row.querySelector(".font-bold");
          const barFill = row.nextElementSibling
            ?.firstElementChild as HTMLElement | null;

          const amount = perServing[def.key];
          if (valueEl) valueEl.textContent = `${Number(amount.toFixed(1))}${def.unit}`;
          if (barFill) {
            barFill.style.width = `${Math.min(100, Math.max(0, (amount / def.reference) * 100))}%`;
          }
        });

      container.querySelectorAll(".grid.grid-cols-2 > div span:last-child").forEach(
        (el) => { el.textContent = "—"; },
      );
    } catch (error) {
      console.error(`Failed to load nutrition for meal ${meal.id}:`, error);
      this.renderNutritionError(container, heroServings, heroCalories);
    }
  }

  private renderNutritionError(
    container: HTMLElement,
    heroServings: HTMLElement | null,
    heroCalories: HTMLElement | null,
  ): void {
    if (heroServings) heroServings.textContent = "Not available";
    if (heroCalories) heroCalories.textContent = "Not available";

    const calorieParagraphs = container.querySelector(".text-center")?.querySelectorAll("p");
    if (calorieParagraphs?.[1]) calorieParagraphs[1].textContent = "—";
    if (calorieParagraphs?.[2]) calorieParagraphs[2].textContent = "Total: —";

    container
      .querySelectorAll(".space-y-4 > .flex.items-center.justify-between")
      .forEach((row) => {
        const valueEl = row.querySelector(".font-bold");
        const barFill = row.nextElementSibling?.firstElementChild as HTMLElement | null;
        if (valueEl) valueEl.textContent = "—";
        if (barFill) barFill.style.width = "0%";
      });

    container
      .querySelectorAll(".grid.grid-cols-2 > div span:last-child")
      .forEach((el) => { el.textContent = "—"; });
  }
}
