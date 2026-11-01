export const API_BASE_URL = "https://nutriplan-api.vercel.app/api";
export const API_KEY = "pLD87HMQ9r7hQ7Jbw6chm8LkCbT6G9GtWnHfD6LB";
export const STORAGE_KEY = "nutriplan-food-log";
export const DAILY_TARGETS = {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
};
export const GRADE_LABELS = {
    a: "Excellent",
    b: "Good",
    c: "Fair",
    d: "Poor",
    e: "Bad",
    unknown: "Unavailable",
};
export const GRADE_COLORS = {
    a: "#16a34a",
    b: "#65a30d",
    c: "#ca8a04",
    d: "#ea580c",
    e: "#dc2626",
    unknown: "#6b7280",
};
export const GRADE_STYLES = {
    a: "bg-green-500",
    b: "bg-lime-500",
    c: "bg-yellow-500",
    d: "bg-orange-500",
    e: "bg-red-500",
};
export const NOVA_LABELS = {
    1: "Unprocessed / minimally processed",
    2: "Processed culinary ingredients",
    3: "Processed",
    4: "Ultra-processed",
};
export const MEAL_CATEGORY_ICONS = {
    beef: "fa-cow",
    chicken: "fa-drumstick-bite",
    dessert: "fa-cookie-bite",
    lamb: "fa-drumstick-bite",
    miscellaneous: "fa-utensils",
    pasta: "fa-bowl-food",
    pork: "fa-bacon",
    seafood: "fa-fish",
    side: "fa-carrot",
    starter: "fa-seedling",
    vegan: "fa-leaf",
    vegetarian: "fa-carrot",
    breakfast: "fa-egg",
    goat: "fa-paw",
};
export const PRODUCT_CATEGORY_ICONS = {
    beverages: "fa-glass-water",
    breakfast: "fa-bread-slice",
    "breakfast-cereals": "fa-bowl-food",
    dairy: "fa-cheese",
    dairies: "fa-cheese",
    desserts: "fa-ice-cream",
    snacks: "fa-cookie",
};
export const MACRO_DEFINITIONS = {
    Protein: { key: "protein", reference: 50, unit: "g" },
    Carbs: { key: "carbs", reference: 300, unit: "g" },
    Fat: { key: "fat", reference: 65, unit: "g" },
    Fiber: { key: "fiber", reference: 28, unit: "g" },
    Sugar: { key: "sugar", reference: 50, unit: "g" },
};
export const HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};
