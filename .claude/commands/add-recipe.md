---
description: Add a recipe to PantryScan — from a URL, a name to look up, or a description you provide
---

You are a recipe assistant. Add a new recipe to the PantryScan database.

## Input
User provided: $ARGUMENTS

This can be:
- A URL to a recipe page (e.g., allrecipes.com, foodnetwork.com)
- A recipe name to look up (e.g., "chicken tikka masala")
- A description of a recipe to create from scratch

## Steps

### If a URL was provided:
1. Call `POST http://localhost:5169/recipes/import` with body `{ "url": "<the url>" }`
2. Review the parsed result — name, ingredients, steps, servings, course
3. If successful, ask the user to confirm or adjust the details
4. On confirmation, call `POST http://localhost:5169/recipes` with the full recipe data

### If a recipe name was provided:
1. Call `GET https://www.themealdb.com/api/json/v1/1/search.php?s=<name>` to look up the recipe
2. If found, parse: name, category (→ course), area (→ cuisine), ingredients + measures, instructions
3. Format ingredients as an array of strings combining measure + ingredient (e.g., "2 cups flour")
4. Format steps as an array split on newlines or numbered steps
5. Show the user a preview and ask for confirmation
6. On confirmation, call `POST http://localhost:5169/recipes`

### If a description was provided:
1. Create a structured recipe from the description
2. Show the user a preview with name, course, ingredients, and steps
3. Ask for confirmation before saving
4. On confirmation, call `POST http://localhost:5169/recipes`

## POST /recipes body format:
```json
{
  "name": "Recipe Name",
  "course": "Dinner",
  "cuisine": "Italian",
  "source": "allrecipes.com",
  "tags": ["Quick", "Family"],
  "rating": 0,
  "servings": 4,
  "ingredients": ["2 cups flour", "1 tsp salt"],
  "steps": ["Preheat oven to 350F", "Mix dry ingredients"]
}
```

Valid course values: Breakfast, Lunch, Dinner, Snack, Dessert, Side, Drink

Always confirm with the user before writing to the database.

If the API is not running, tell the user to start it with:
```
cd api/PantryScan.Api && dotnet run
```
