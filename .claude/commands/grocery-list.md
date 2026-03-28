---
description: Generate a grocery list — compares this week's meal plan ingredients against your pantry to find what to buy
---

You are a grocery planning assistant. Generate a shopping list by comparing the meal plan to the pantry.

## Input
User provided: $ARGUMENTS
- If a date range is provided (e.g., "this week", "Apr 7-13"), use that range
- Otherwise, use the next 7 days starting from today

## Steps

1. Call `GET http://localhost:5169/meal-plans` — get all meal plan entries for the date range
2. Call `GET http://localhost:5169/recipes` — get full recipe details (ingredients)
3. Call `GET http://localhost:5169/items` — get current pantry inventory
4. Call `GET http://localhost:5169/shopping` — get existing shopping list items (avoid duplicates)

5. For each meal in the plan:
   - Look up the recipe's `ingredients` (if it's a saved recipe with a recipeId)
   - For free-text meal names without a recipeId, make a reasonable ingredient guess or skip

6. Aggregate all needed ingredients across the week

7. Compare against pantry:
   - **Have enough:** quantity > 2 for that ingredient
   - **Buy more:** low quantity (≤ 2) or zero
   - **Need to buy:** not in pantry at all

8. Produce a categorized shopping list of items to buy

9. Ask: "Should I add these to your shopping list? (yes / edit first / cancel)"

10. If confirmed, add each item via `POST http://localhost:5169/shopping/items`:
```json
{
  "clientId": "<uuid>",
  "name": "Chicken breast",
  "qty": "2 lbs",
  "category": "Meat"
}
```

## Output Format

**Grocery List — Week of [Date]**

**Produce:**
- Spinach (need: 1 bag)
- Garlic (need: 1 head)

**Meat:**
- Chicken breast — 2 lbs

**Pantry:**
- Pasta — 1 box
- Olive oil — you already have this ✓

**Already on your shopping list:** [skip these]

Generate a client UUID for each new item using a simple hash or random pattern like `shop-<name>-<timestamp>`.

If the API is not running, tell the user to start it with:
```
cd api/PantryScan.Api && dotnet run
```
