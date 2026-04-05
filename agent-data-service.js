(function () {
  const KEYS = {
    apiBase: 'pantryscan_api_base',
    recipes: 'pantryscan_recipes',
    plan: 'pantryscan_plan',
    shopping: 'pantryscan_shopping',
    planMigrated: 'pantryscan_plan_migrated_to_sql_v1',
    shoppingMigrated: 'pantryscan_shopping_migrated_to_sql_v1'
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getApiBase() {
    const stored = localStorage.getItem(KEYS.apiBase);
    // Auto-correct stale default port 5000 → 5169
    if (!stored || stored === 'http://localhost:5000') {
      localStorage.setItem(KEYS.apiBase, 'http://localhost:5169');
      return 'http://localhost:5169';
    }
    return stored.replace(/\/$/, '');
  }

  async function request(path, options) {
    const res = await fetch(`${getApiBase()}${path}`, options);
    return res;
  }

  const service = {
    keys: KEYS,
    loadJson,
    saveJson,
    getApiBase,

    loadLocalRecipes() {
      return loadJson(KEYS.recipes, []);
    },
    saveLocalRecipes(list) {
      saveJson(KEYS.recipes, list || []);
    },

    loadLocalPlan() {
      return loadJson(KEYS.plan, {});
    },
    saveLocalPlan(plan) {
      saveJson(KEYS.plan, plan || {});
    },

    loadShopping() {
      return loadJson(KEYS.shopping, { items: [], checked: {} });
    },
    saveShopping(shop) {
      saveJson(KEYS.shopping, shop || { items: [], checked: {} });
    },

    isPlanMigrated() {
      return localStorage.getItem(KEYS.planMigrated) === 'true';
    },
    markPlanMigrated() {
      localStorage.setItem(KEYS.planMigrated, 'true');
    },

    isRecipesMigrated() {
      return localStorage.getItem(KEYS.recipesMigrated) === 'true';
    },
    markRecipesMigrated() {
      localStorage.setItem(KEYS.recipesMigrated, 'true');
    },

    isShoppingMigrated() {
      return localStorage.getItem(KEYS.shoppingMigrated) === 'true';
    },
    markShoppingMigrated() {
      localStorage.setItem(KEYS.shoppingMigrated, 'true');
    },

    async fetchMealPlans() {
      const res = await request('/meal-plans');
      if (!res.ok) return null;
      return await res.json();
    },

    async upsertMealPlanEntry(entry) {
      const res = await request('/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return res;
    },

    async bulkUpsertMealPlans(entries) {
      const res = await request('/meal-plans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
      return res;
    },

    async deleteMealPlanEntry(planDate, mealType, recipeName) {
      const qs = new URLSearchParams({ planDate, mealType, recipeName, confirm: 'true' });
      return await request(`/meal-plans?${qs.toString()}`, { method: 'DELETE' });
    },

    async upsertMealPlanNote(planDate, notes) {
      return await request('/meal-plans/note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planDate, notes: notes || null })
      });
    },

    async fetchRecipes() {
      const res = await request('/recipes');
      if (!res.ok) return null;
      return await res.json();
    },

    async createRecipe(recipePayload) {
      return await request('/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload)
      });
    },

    async bulkCreateRecipes(entries) {
      return await request('/recipes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
    },

    async importRecipeUrl(url) {
      return await request('/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    },

    async fetchShopping() {
      const res = await request('/shopping');
      if (!res.ok) return null;
      return await res.json();
    },

    async addShoppingItem(item) {
      return await request('/shopping/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    },

    async checkShoppingItem(clientId, checked) {
      return await request(`/shopping/items/${encodeURIComponent(clientId)}/check`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked })
      });
    },

    async deleteShoppingItem(clientId) {
      return await request(`/shopping/items/${encodeURIComponent(clientId)}?confirm=true`, { method: 'DELETE' });
    },

    async clearCheckedShoppingItems() {
      return await request('/shopping/checked?confirm=true', { method: 'DELETE' });
    },

    async bulkCreateShoppingItems(items) {
      return await request('/shopping/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
    },

    // ── Calendar ──────────────────────────────────────────────────────────────

    async fetchEvents(from, to) {
      const qs = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
      const res = await request(`/calendar${qs}`);
      if (!res.ok) return null;
      return await res.json();
    },

    async createEvent(dto) {
      return await request('/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });
    },

    async updateEvent(id, dto) {
      return await request(`/calendar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });
    },

    async deleteEvent(id) {
      return await request(`/calendar/${id}?confirm=true`, { method: 'DELETE' });
    },

    // ── Todos ─────────────────────────────────────────────────────────────────

    async fetchTodos(list, completed) {
      const params = new URLSearchParams();
      if (list) params.set('list', list);
      if (completed !== undefined && completed !== null) params.set('completed', completed);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await request(`/todos${qs}`);
      if (!res.ok) return null;
      return await res.json();
    },

    async fetchTodoLists() {
      const res = await request('/todos/lists');
      if (!res.ok) return [];
      return await res.json();
    },

    async createTodo(dto) {
      return await request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });
    },

    async updateTodo(id, dto) {
      return await request(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });
    },

    async completeTodo(id, isCompleted) {
      return await request(`/todos/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted })
      });
    },

    async deleteTodo(id) {
      return await request(`/todos/${id}?confirm=true`, { method: 'DELETE' });
    }
  };

  window.AgentDataService = service;
})();
