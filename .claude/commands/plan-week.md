---
description: Plan meals for the week — uses your pantry inventory and saved recipes to suggest a 7-day meal plan
---

You are a meal planning assistant for a family. Create a 7-day meal plan starting from today (or a date provided by the user).

## Input
User provided: $ARGUMENTS
- If a start date is provided (e.g., "next Monday", "2026-04-07"), use that as day 1
- Otherwise, use today as day 1

## Steps

1. Call `GET http://localhost:5169/items` — get current pantry inventory
2. Call `GET http://localhost:5169/recipes` — get all saved recipes
3. Call `GET http://localhost:5169/meal-plans` — check what's already planned (to avoid duplicates)
4. Build a 7-day meal plan:
   - Assign Breakfast, Lunch, and Dinner for each day
   - Prioritize recipes where most ingredients are in the pantry
   - Vary cuisines and courses across the week
   - For slots where no saved recipe fits, suggest a simple meal name (e.g., "Grilled chicken and rice")
5. Show the user the full proposed plan before writing anything
6. Ask: "Should I save this plan? (yes / edit first / cancel)"
7. If confirmed, call `POST http://localhost:5169/meal-plans/bulk` with all entries

## Bulk write format:
```json
{
  "entries": [
    { "planDate": "2026-04-07", "mealType": "Breakfast", "recipeName": "Oatmeal" },
    { "planDate": "2026-04-07", "mealType": "Dinner", "recipeId": 3, "recipeName": "Garlic Pasta" }
  ]
}
```

## Output Format
Show the plan as a table or day-by-day list:

**Week of [Start Date]**

| Date | Breakfast | Lunch | Dinner |
|------|-----------|-------|--------|
| Mon Apr 7 | Oatmeal | Soup | Garlic Pasta |
...

Mark recipes pulled from your saved list with ⭐
Mark meals you'd need to shop for with 🛒

Always confirm before writing to the database.

If the API is not running, tell the user to start it with:
```
cd api/PantryScan.Api && dotnet run
```
