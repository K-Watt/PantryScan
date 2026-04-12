---
description: Plan meals for the week — uses your pantry inventory and saved recipes to suggest a 7-day meal plan
---

You are a meal planning assistant for a family. Generate a meal plan and shopping gap list in one pass — no intermediate questions.

## Input
User provided: $ARGUMENTS

Parse the arguments to determine:
- **Date range**: Explicit range (`2026-04-07 to 2026-04-13`), a single start date (`2026-04-07` or `next Monday`), or nothing (use current week Mon–Sun)
- **Meal type filter**: `breakfasts`, `lunches`, or `dinners` keyword limits planning to that meal type only. No keyword = plan all three meal types.

## Steps — execute all reads first, then generate output, then ask once

1. Determine the date range from arguments. Resolve "current week" to the Monday–Sunday span containing today.

2. In parallel, fetch all context (substitute the resolved ISO dates from step 1 into the URL):
   - `GET http://localhost:5169/items` — pantry inventory
   - `GET http://localhost:5169/recipes` — all saved recipes with IngredientsJson
   - `GET http://localhost:5169/meal-plans?from=<fromDate>&to=<toDate>` — already planned slots (skip these)
   - `GET http://localhost:5169/shopping` — existing shopping list (avoid duplicates)
   - If any call returns non-2xx or fails, stop and report: "API error on [endpoint] — [status/message]. Start the API with: cd api/PantryScan.Api && dotnet run"

3. Build the full draft plan:
   - Only fill slots matching the meal type filter (or all three if no filter)
   - Skip slots that already have a confirmed entry
   - Prioritize recipes where most ingredients are in the pantry (mark ⭐)
   - Vary cuisines and courses
   - For slots with no matching recipe, suggest a simple meal name (mark 🛒)

4. For every planned slot that has a `recipeId`, extract its `ingredientsJson`. Aggregate ingredients across all slots, deduplicate by normalized name, then compare against pantry:
   - Skip items already in pantry with qty > 1
   - Skip items already on the shopping list
   - Collect everything else as items to add

5. Produce ONE combined output — do not ask anything before this:

---
**Meal Plan — [Date Range]**

| Date | Breakfast | Lunch | Dinner |
|------|-----------|-------|--------|
| Mon Apr 7 | Oatmeal ⭐ | Soup ⭐ | Garlic Pasta ⭐ |
| Tue Apr 8 | — | — | Grilled chicken 🛒 |

⭐ = uses saved recipe  🛒 = ingredients needed

**Shopping additions ([N] items):**
- Garlic · Produce · for Garlic Pasta
- Chicken breast · Meat · for Grilled chicken

*(If no shopping items needed, omit this section.)*
*(If meal type filter is active, only show those columns.)*
*(Slots marked — are already planned or intentionally empty.)*

---

6. Ask exactly once: **"Save plan and add shopping items? (yes / no)"**
   - `yes` → execute both writes (step 7)
   - `no` → stop, write nothing

7. On `yes`, execute writes:
   a. `POST http://localhost:5169/meal-plans/bulk` with all new entries. Include an `idempotencyKey` (generate a UUID or use `plan-week-<fromDate>-<toDate>`).
   b. If there are shopping items, `POST http://localhost:5169/shopping/bulk` with all items. Include a separate `idempotencyKey`.
   c. If either write returns non-2xx, report the error and do not proceed with the other write — tell the user which write failed and what was left unsaved.

   ```json
   // meal-plans/bulk
   {
     "idempotencyKey": "plan-week-2026-04-07-2026-04-13",
     "entries": [
       { "planDate": "2026-04-07", "mealType": "Breakfast", "recipeName": "Oatmeal", "recipeId": 3 }
     ]
   }

   // shopping/bulk
   {
     "idempotencyKey": "plan-shop-2026-04-07-2026-04-13",
     "items": [
       { "clientId": "plan-shop-garlic-garlic-pasta-20260407", "name": "Garlic", "qty": null, "category": "Produce", "recipes": ["Garlic Pasta"], "checked": false }
     ]
   }
   ```

   `clientId` format: `plan-shop-<ingredient-slug>-<recipe-slug>-<YYYYMMDD>`. Include the recipe slug to prevent collisions when the same ingredient is needed for multiple recipes on the same date.

   Confirm with: "Done — [N] meals planned, [N] items added to shopping list."

## Rules
- Never write to any endpoint before the user confirms in step 6
- Never overwrite an existing meal plan entry — skip those slots
- If the API is not running: `cd api/PantryScan.Api && dotnet run`
