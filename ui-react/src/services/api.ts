// PantryScan API Service

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5169';

// ============================================================
// Domain Types
// ============================================================

export interface PantryItem {
  id: number;
  name: string;
  quantity: number;
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
  update(id: number, quantity: number): Promise<PantryItem> {
    return request<PantryItem>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  remove(id: number): Promise<void> {
    return request<void>(`/items/${id}`, { method: 'DELETE' });
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
