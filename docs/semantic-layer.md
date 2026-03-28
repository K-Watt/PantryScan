# Semantic Layer — PantryScan Family Hub

## What is the semantic layer?
The semantic layer is the vocabulary Claude uses to understand your data. It goes beyond "what endpoints exist" to define what entities mean, what values are valid, and what operations are safe vs. destructive. An agent that reads this file can reason about your data without you explaining it every time.

---

## Entities

### PantryItem
Represents a physical food or household item stored in the home.

| Field | Type | Rules |
|-------|------|-------|
| `itemId` | int | Auto-assigned. Read-only after creation. |
| `name` | string | Required. Trimmed. Case-preserved. Max 200 chars. |
| `quantity` | decimal | Required. Must be >= 0. Meaning depends on `unit`. |
| `unit` | string | Optional. Examples: `"oz"`, `"lbs"`, `"count"`, `"cups"`. Defaults to `"count"` if omitted. |
| `barcode` | string | Optional. UPC/EAN barcode string from scanner. |
| `expiresAt` | date | Optional. ISO 8601 `YYYY-MM-DD`. Alert when within 3 days. |
| `addedBy` | userId | Optional (required after Phase 3 auth). Who added the item. |
| `createdAt` | datetime | Auto-set on insert. |

**Business rules:**
- Quantity = 0 means "out of stock" — item stays in DB for history.
- Deleting an item is destructive — confirm before calling `DELETE /items/{id}`.
- When a recipe is cooked, reduce quantities of used ingredients (future automation).

**Safe operations:** `GET /items`, `PUT /items/{id}` (quantity update)
**Destructive operations:** `DELETE /items/{id}` — requires confirmation

---

### Recipe
A saved recipe with ingredients and steps.

| Field | Type | Rules |
|-------|------|-------|
| `recipeId` | int | Auto-assigned. |
| `name` | string | Required. |
| `course` | string | Optional. Allowed: `"Breakfast"`, `"Lunch"`, `"Dinner"`, `"Snack"`, `"Dessert"`, `"Side"`, `"Drink"`. |
| `cuisine` | string | Optional. Free text. Examples: `"Italian"`, `"Mexican"`. |
| `source` | string | Optional. URL or description of where recipe came from. |
| `tags` | string[] | Optional. Free-form array. Examples: `["Quick", "Vegetarian", "Kid-Friendly"]`. |
| `rating` | int | 0–5. 0 means unrated. |
| `servings` | int | Optional. Number of servings. |
| `ingredients` | object[] | Array of `{ name, quantity, unit }`. |
| `steps` | string[] | Ordered instructions. |
| `addedAtUnixMs` | long | Client-provided creation timestamp in milliseconds. |

**Business rules:**
- A recipe can exist without ingredients (e.g., saved as a stub first).
- `course` drives meal planner slot suggestions.
- `tags` are used for filtering and recommendation.
- If `recipeId` is provided in a meal plan entry, it links to this record.

**Safe operations:** `GET /recipes`
**Destructive operations:** `DELETE /recipes/{id}` — confirm if recipe is used in a meal plan.

---

### MealPlanEntry
A single slot in the meal planner — one meal on one day.

| Field | Type | Rules |
|-------|------|-------|
| `mealPlanEntryId` | int | Auto-assigned. |
| `planDate` | date | Required. Format: `YYYY-MM-DD`. |
| `mealType` | string | Required. Allowed: `"Breakfast"`, `"Lunch"`, `"Dinner"`, `"Snack"`, `"Notes"`. |
| `recipeId` | int? | Optional. Links to a Recipe. |
| `recipeName` | string | Required unless mealType = `"Notes"`. |
| `notes` | string | Required if mealType = `"Notes"`. Optional otherwise. |
| `idempotencyKey` | string | Optional UUID. Prevents duplicate writes. |

**Business rules:**
- One entry per `(planDate, mealType)` pair — upsert semantics on POST.
- `mealType = "Notes"` is a special slot for day-level notes, not a meal.
- Deleting a meal plan entry does NOT delete the associated recipe.

**Safe operations:** `GET /meal-plans`, `POST /meal-plans` (upsert)
**Destructive operations:** `DELETE /meal-plans` — confirm before calling.

---

### ShoppingItem
An item on the grocery shopping list.

| Field | Type | Rules |
|-------|------|-------|
| `shoppingItemId` | int | Auto-assigned. |
| `name` | string | Required. |
| `quantity` | string | Optional. Free text. Examples: `"2 lbs"`, `"1 box"`. |
| `category` | string | Optional. Examples: `"Produce"`, `"Dairy"`, `"Meat"`, `"Pantry"`. |
| `checked` | bool | Default false. True = item is in cart / purchased. |
| `addedBy` | userId | Optional (required after Phase 3 auth). |
| `createdAt` | datetime | Auto-set. |

**Business rules:**
- Checked items are hidden from the active list but kept for history.
- The grocery list agent compares meal plan ingredients to PantryItems to suggest what to add here.
- Walmart integration uses this list to generate search links.

---

### CalendarEvent (Phase 5)
A shared family calendar event.

| Field | Type | Rules |
|-------|------|-------|
| `eventId` | int | Auto-assigned. |
| `title` | string | Required. Max 200 chars. |
| `startAt` | datetime | Required. ISO 8601. |
| `endAt` | datetime | Optional. Must be >= `startAt` if provided. |
| `allDay` | bool | Default false. If true, ignore time component. |
| `userId` | int | Who created it. |
| `assignedTo` | int[] | User IDs who are participants. |
| `category` | string | Allowed: `"family"`, `"appointment"`, `"task"`, `"birthday"`, `"school"`. |
| `notes` | string | Optional. |
| `createdAt` | datetime | Auto-set. |

---

### TodoItem (Phase 5)
A task in a shared to-do list.

| Field | Type | Rules |
|-------|------|-------|
| `todoId` | int | Auto-assigned. |
| `title` | string | Required. |
| `listName` | string | Which list it belongs to. Examples: `"Household"`, `"Errands"`, `"School"`. Default `"General"`. |
| `dueDate` | date | Optional. `YYYY-MM-DD`. |
| `assignedToUserId` | int? | Optional. Who is responsible. |
| `completedAt` | datetime? | Null = not done. Set to complete. |
| `createdAt` | datetime | Auto-set. |

**Business rules:**
- Completing a todo sets `completedAt`; deleting removes it permanently.
- Lists are just a `listName` string — no separate list entity needed.

---

### User (Phase 3)
A person with a login.

| Field | Type | Rules |
|-------|------|-------|
| `userId` | int | Auto-assigned. |
| `displayName` | string | Required. Shown in UI. |
| `email` | string | Required. Unique. Used to log in. |
| `passwordHash` | string | Bcrypt hash. Never returned to client. |
| `role` | string | `"owner"` or `"member"`. First user = owner. |
| `createdAt` | datetime | Auto-set. |

**Session model:**
- Login returns a `sessionToken` (UUID).
- Token is stored in `localStorage` on the frontend.
- All write API calls send `X-Session-Token` header.
- Sessions expire after 30 days.

---

## Safety Classification

| Operation type | Examples | Agent behavior |
|---|---|---|
| **Safe reads** | Any GET | Call freely |
| **Safe writes (idempotent)** | POST /meal-plans, PUT /items | Call, include idempotencyKey |
| **Additive writes** | POST /items, POST /recipes | Call, but confirm if bulk |
| **Destructive** | DELETE any resource | Confirm with user first |
| **Auth-scoped** | Any write after Phase 3 | Include X-Session-Token |

---

## Allowed Values Reference

### mealType
`"Breakfast"` `"Lunch"` `"Dinner"` `"Snack"` `"Notes"`

### course (Recipe)
`"Breakfast"` `"Lunch"` `"Dinner"` `"Snack"` `"Dessert"` `"Side"` `"Drink"`

### category (CalendarEvent)
`"family"` `"appointment"` `"task"` `"birthday"` `"school"`

### role (User)
`"owner"` `"member"`

### ShoppingItem category suggestions
`"Produce"` `"Dairy"` `"Meat"` `"Seafood"` `"Bakery"` `"Frozen"` `"Pantry"` `"Beverages"` `"Snacks"` `"Household"` `"Personal Care"`
