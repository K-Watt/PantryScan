// PantryScan API Service

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5169';

// ============================================================
// Domain Types
// ============================================================

export interface PantryItem {
  id: number;
  name: string;
  quantity: number;
  lowStockThreshold?: number;
  needsReview?: boolean;
  barcode?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  lastScannedAt?: string | null;
  createdAt?: string | null;
}

export interface RecentScansPage {
  items: PantryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Nutrition {
  servingSize?: string | null;
  nutriscoreGrade?: string | null; // "a".."e"
  novaGroup?: number | null;       // 1..4
  energyKcal100g?: number | null;
  fat100g?: number | null;
  saturatedFat100g?: number | null;
  carbohydrates100g?: number | null;
  sugars100g?: number | null;
  fiber100g?: number | null;
  proteins100g?: number | null;
  salt100g?: number | null;
  sodium100g?: number | null;
  nutrientLevels?: Record<string, string> | null;
}

export interface Product {
  barcode: string;
  name?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  categories?: string | null;
  packageSize?: string | null;
  source: string; // "cache" | "openfoodfacts"
  nutrition?: Nutrition | null;
}

export interface ScanResult {
  item: {
    itemId: number;
    name: string;
    quantity: number;
    barcode?: string | null;
    brand?: string | null;
    imageUrl?: string | null;
    needsReview: boolean;
  };
  product: Product | null;
  found: boolean;
}

export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  tags?: string[];
}

export interface MealPlanEntry {
  id?: number;
  planDate: string;       // ISO date string "YYYY-MM-DD"
  mealType: string;       // "breakfast" | "lunch" | "dinner" | "snack"
  recipeName: string;
  notes?: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity?: string;
  checked?: boolean;
}

export interface AgentContext {
  pantryCount: number;
  recipeCount: number;
  shoppingCount: number;
  mealPlanCount: number;
}

// ============================================================
// Helpers
// ============================================================

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  // Return null for 204 No Content
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}

// ============================================================
// Pantry
// ============================================================

export const pantryApi = {
  list(): Promise<PantryItem[]> {
    return request<PantryItem[]>('/items');
  },
  add(item: { name: string; quantity: number }): Promise<PantryItem> {
    return request<PantryItem>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  update(id: number, patch: { quantity?: number; lowStockThreshold?: number; name?: string }): Promise<void> {
    return request<void>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  },
  // Items scanned without a resolved name, awaiting a manual name.
  reviewQueue(): Promise<PantryItem[]> {
    return request<PantryItem[]>('/items/review');
  },
  // Paginated scan history, most-recently-scanned first.
  recentScans(page = 1, pageSize = 20): Promise<RecentScansPage> {
    return request<RecentScansPage>(`/items/recent?page=${page}&pageSize=${pageSize}`);
  },
  remove(id: number): Promise<void> {
    // Endpoint requires confirm=true for destructive operations.
    return request<void>(`/items/${id}?confirm=true`, { method: 'DELETE' });
  },
  // Look up product metadata for a barcode (local cache -> OpenFoodFacts).
  // Returns null if the barcode is unknown.
  async lookup(barcode: string): Promise<Product | null> {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(barcode)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Product>;
  },
  // Scan a barcode straight into the pantry (increments quantity if already present).
  scan(barcode: string, quantity = 1, name?: string): Promise<ScanResult> {
    return request<ScanResult>('/items/scan', {
      method: 'POST',
      body: JSON.stringify({ barcode, quantity, name }),
    });
  },
};

// ============================================================
// Recipes
// ============================================================

export const recipesApi = {
  list(): Promise<Recipe[]> {
    return request<Recipe[]>('/recipes');
  },
  create(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    return request<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },
  update(id: number, recipe: Partial<Omit<Recipe, 'id'>>): Promise<Recipe> {
    return request<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  },
  remove(id: number): Promise<void> {
    return request<void>(`/recipes/${id}`, { method: 'DELETE' });
  },
  bulkCreate(entries: Array<Omit<Recipe, 'id'>>): Promise<Recipe[]> {
    return request<Recipe[]>('/recipes/bulk', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  },
};

// ============================================================
// Meal Plans
// ============================================================

export const mealPlansApi = {
  list(from?: string, to?: string): Promise<MealPlanEntry[]> {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<MealPlanEntry[]>(`/meal-plans${query}`);
  },
  upsert(entry: MealPlanEntry): Promise<MealPlanEntry> {
    return request<MealPlanEntry>('/meal-plans', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  bulkUpsert(entries: MealPlanEntry[]): Promise<MealPlanEntry[]> {
    return request<MealPlanEntry[]>('/meal-plans/bulk', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  },
  remove(planDate: string, mealType: string, recipeName: string): Promise<void> {
    const qs = new URLSearchParams({ planDate, mealType, recipeName });
    return request<void>(`/meal-plans?${qs.toString()}`, { method: 'DELETE' });
  },
  upsertNote(planDate: string, notes: string | null): Promise<void> {
    return request<void>('/meal-plans/note', {
      method: 'PUT',
      body: JSON.stringify({ planDate, notes }),
    });
  },
};

// ============================================================
// Shopping
// ============================================================

export const shoppingApi = {
  list(): Promise<ShoppingItem[]> {
    return request<ShoppingItem[]>('/shopping');
  },
  add(item: { name: string; quantity?: string }): Promise<ShoppingItem> {
    return request<ShoppingItem>('/shopping', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  remove(id: number): Promise<void> {
    return request<void>(`/shopping/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// Agent / Meta
// ============================================================

export const agentApi = {
  context(): Promise<AgentContext> {
    return request<AgentContext>('/agent/context');
  },
};
