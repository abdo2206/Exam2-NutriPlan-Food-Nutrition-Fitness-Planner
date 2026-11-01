import { PRODUCT_CATEGORY_ICONS, GRADE_STYLES } from "../shared/constants.js";
import { escapeHtml, formatGrams, formatCalories } from "../shared/utils.js";
import { renderEmptyState, renderLoadingSpinner } from "../components/ui.js";
export class ProductsPage {
    api;
    onLogProduct;
    categoriesContainer;
    productsContainer;
    productsCountEl;
    searchInput;
    barcodeInput;
    searchBtn;
    lookupBtn;
    nutriScoreFilters;
    currentProducts = [];
    currentTotal = 0;
    activeNutriScore = "";
    initialized = false;
    eventsBound = false;
    constructor(api, onLogProduct) {
        this.api = api;
        this.onLogProduct = onLogProduct;
        this.categoriesContainer = this.requireElement("product-categories");
        this.productsContainer = this.requireElement("products-grid");
        this.productsCountEl = this.requireElement("products-count");
        this.searchInput =
            document.getElementById("product-search-input");
        this.barcodeInput =
            document.getElementById("barcode-input");
        this.searchBtn = document.getElementById("search-product-btn");
        this.lookupBtn = document.getElementById("lookup-barcode-btn");
        this.nutriScoreFilters =
            document.querySelectorAll(".nutri-score-filter");
    }
    async initialize() {
        if (this.initialized)
            return;
        if (!this.eventsBound) {
            this.bindEvents();
            this.eventsBound = true;
        }
        this.setCount("Loading products…");
        renderLoadingSpinner(this.productsContainer);
        try {
            const categories = await this.api.getProductCategories();
            const defaultCat = categories.results.find((c) => c.id === "snacks") ?? categories.results[0];
            this.renderCategories(categories, defaultCat?.id ?? "");
            if (!defaultCat) {
                this.renderProducts([]);
                this.setCount("No product categories are available");
                this.initialized = true;
                return;
            }
            const response = await this.api.getProductsByCategory(defaultCat.id);
            this.updateProducts(response);
            this.setActiveNutriScore("");
            this.initialized = true;
        }
        catch (error) {
            this.showEmptyState("Products could not be loaded", "Check your connection and try opening the Product Scanner again.", "Unable to load products");
            throw error;
        }
    }
    bindEvents() {
        this.searchBtn?.addEventListener("click", () => {
            void this.searchProducts();
        });
        this.searchInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter")
                void this.searchProducts();
        });
        this.lookupBtn?.addEventListener("click", () => {
            void this.lookupBarcode();
        });
        this.barcodeInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter")
                void this.lookupBarcode();
        });
        this.categoriesContainer.addEventListener("click", (e) => {
            void this.handleCategoryClick(e);
        });
        this.productsContainer.addEventListener("click", (e) => {
            this.handleProductClick(e);
        });
        this.nutriScoreFilters.forEach((btn) => {
            btn.addEventListener("click", () => {
                this.setActiveNutriScore(btn.dataset.grade ?? "");
            });
        });
    }
    async handleCategoryClick(event) {
        const btn = event.target.closest(".product-category-btn");
        const category = btn?.dataset.category;
        if (!category)
            return;
        this.setSelectedCategory(category);
        this.setActiveNutriScore("");
        this.setCount("Loading products…");
        renderLoadingSpinner(this.productsContainer);
        try {
            const response = await this.api.getProductsByCategory(category);
            this.updateProducts(response);
        }
        catch (error) {
            console.error(`Failed to load products for category "${category}":`, error);
            this.showEmptyState("Category could not be loaded", "Check your connection and choose a category again.", "Unable to load products");
        }
    }
    async searchProducts() {
        const query = this.searchInput?.value.trim() ?? "";
        if (!query) {
            this.showEmptyState("Search for a product", "Enter a product name above to see matching results.", "Enter a product name to search");
            return;
        }
        this.setSelectedCategory("");
        this.setActiveNutriScore("");
        this.setCount("Searching products…");
        renderLoadingSpinner(this.productsContainer);
        try {
            const response = await this.api.searchProducts(query);
            this.updateProducts(response);
        }
        catch (error) {
            console.error(`Product search failed for "${query}":`, error);
            this.showEmptyState("Product search failed", "Check your connection and try searching again.", "Unable to search products");
        }
    }
    async lookupBarcode() {
        const barcode = this.barcodeInput?.value.trim() ?? "";
        if (!/^\d+$/.test(barcode)) {
            this.showEmptyState("Enter a valid barcode", "A barcode should contain digits only.", "Enter a numeric barcode");
            return;
        }
        this.setSelectedCategory("");
        this.setActiveNutriScore("");
        this.setCount("Looking up barcode…");
        renderLoadingSpinner(this.productsContainer);
        try {
            const response = await this.api.getProductByBarcode(barcode);
            this.currentProducts = [response.result];
            this.currentTotal = 1;
            this.renderProductResults();
        }
        catch (error) {
            console.error(`Barcode lookup failed for "${barcode}":`, error);
            this.showEmptyState("Product not found", "Check the barcode or search for the product by name.", "No product found for this barcode");
        }
    }
    handleProductClick(event) {
        const card = event.target.closest(".product-card");
        const product = this.currentProducts.find((p) => p.barcode === card?.dataset.barcode);
        if (!product)
            return;
        void this.onLogProduct(product).catch((err) => {
            console.error(`Failed to log product "${product.name}":`, err);
            window.alert(`${product.name} could not be added to your food log.`);
        });
    }
    setActiveNutriScore(grade) {
        this.activeNutriScore = grade;
        this.nutriScoreFilters.forEach((btn) => {
            const active = btn.dataset.grade === grade;
            btn.classList.toggle("ring-2", active);
            btn.classList.toggle("ring-offset-1", active);
            btn.classList.toggle("ring-emerald-500", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        this.renderProductResults();
    }
    updateProducts(response) {
        this.currentProducts = response.results;
        this.currentTotal = response.pagination.total;
        this.renderProductResults();
    }
    renderProductResults() {
        const filtered = this.activeNutriScore
            ? this.currentProducts.filter((p) => p.nutritionGrade?.toLowerCase() === this.activeNutriScore)
            : this.currentProducts;
        this.renderProducts(filtered);
        this.setCount(this.activeNutriScore
            ? `Showing ${filtered.length} of ${this.currentProducts.length} loaded products`
            : `Showing ${this.currentProducts.length} of ${this.currentTotal} products`);
    }
    renderCategories(categories, selectedId) {
        this.categoriesContainer.innerHTML = categories.results
            .map((cat) => {
            const isSelected = cat.id === selectedId;
            const icon = PRODUCT_CATEGORY_ICONS[cat.id.toLowerCase()] ?? "fa-box-open";
            const classes = isSelected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200";
            return `
          <button
            class="product-category-btn px-4 py-2 ${classes} rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            data-category="${escapeHtml(cat.id)}"
            type="button"
            aria-pressed="${isSelected}"
          >
            <i class="fa-solid ${icon} mr-1.5"></i>${escapeHtml(cat.name)}
          </button>
        `;
        })
            .join("");
    }
    setSelectedCategory(id) {
        this.categoriesContainer
            .querySelectorAll(".product-category-btn")
            .forEach((btn) => {
            const active = btn.dataset.category === id;
            btn.classList.toggle("bg-emerald-100", active);
            btn.classList.toggle("text-emerald-700", active);
            btn.classList.toggle("bg-gray-100", !active);
            btn.classList.toggle("text-gray-700", !active);
            btn.classList.toggle("hover:bg-gray-200", !active);
            btn.setAttribute("aria-pressed", String(active));
        });
    }
    renderProducts(products) {
        if (products.length === 0) {
            renderEmptyState(this.productsContainer, "No products found", "Try a different search, category, or Nutri-Score.");
            return;
        }
        this.productsContainer.innerHTML = products.map((p) => this.productCardHtml(p)).join("");
    }
    productCardHtml(product) {
        const grade = product.nutritionGrade?.toLowerCase() ?? "unknown";
        const gradeStyle = GRADE_STYLES[grade] ?? "bg-gray-500";
        const gradeLabel = grade === "unknown" ? "Nutri-Score unavailable" : `Nutri-Score ${grade.toUpperCase()}`;
        const imageHtml = product.image
            ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
               src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
            : `<div class="flex h-full items-center justify-center text-gray-400">
           <i class="fa-solid fa-image text-3xl"></i>
         </div>`;
        const novaHtml = product.novaGroup
            ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold
                    w-6 h-6 rounded-full flex items-center justify-center"
              title="NOVA ${product.novaGroup}">${product.novaGroup}</div>`
            : "";
        const { nutrients } = product;
        return `
      <article
        class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
        data-barcode="${escapeHtml(product.barcode)}"
      >
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          ${imageHtml}
          <div class="absolute top-2 left-2 ${gradeStyle} text-white text-xs font-bold px-2 py-1 rounded uppercase">
            ${escapeHtml(gradeLabel)}
          </div>
          ${novaHtml}
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">
            ${escapeHtml(product.brand || "Brand not provided")}
          </p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            ${escapeHtml(product.name)}
          </h3>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-barcode mr-1"></i>${escapeHtml(product.barcode)}</span>
            <span><i class="fa-solid fa-fire mr-1"></i>${formatCalories(nutrients?.calories)} kcal/100g</span>
          </div>
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="bg-emerald-50 rounded p-1.5">
              <p class="text-xs font-bold text-emerald-700">${formatGrams(nutrients?.protein)}</p>
              <p class="text-[10px] text-gray-500">Protein</p>
            </div>
            <div class="bg-blue-50 rounded p-1.5">
              <p class="text-xs font-bold text-blue-700">${formatGrams(nutrients?.carbs)}</p>
              <p class="text-[10px] text-gray-500">Carbs</p>
            </div>
            <div class="bg-purple-50 rounded p-1.5">
              <p class="text-xs font-bold text-purple-700">${formatGrams(nutrients?.fat)}</p>
              <p class="text-[10px] text-gray-500">Fat</p>
            </div>
            <div class="bg-orange-50 rounded p-1.5">
              <p class="text-xs font-bold text-orange-700">${formatGrams(nutrients?.sugar)}</p>
              <p class="text-[10px] text-gray-500">Sugar</p>
            </div>
          </div>
        </div>
      </article>
    `;
    }
    requireElement(id) {
        const el = document.getElementById(id);
        if (!el)
            throw new Error(`Could not find required element "#${id}".`);
        return el;
    }
    setCount(message) {
        this.productsCountEl.textContent = message;
    }
    showEmptyState(title, description, countMsg) {
        renderEmptyState(this.productsContainer, title, description);
        this.setCount(countMsg);
    }
}
