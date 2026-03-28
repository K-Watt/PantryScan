# Agent Integration Contracts

## Contract Principles
- Transport: JSON over HTTP.
- Date format: `YYYY-MM-DD` for planner dates.
- Idempotency: clients should send `idempotencyKey` for write operations.
- Audit metadata: clients should send `audit` object (or headers) with operation context.

Recommended write envelope fields:
- `idempotencyKey`: string (UUID or deterministic hash)
- `audit`: `{ actionId, actor, source, requestedAtUtc }`

---

## 1) DB Review Response
### Endpoint
`GET /agent/context`

### Response (200)
```json
{
  "counts": {
    "items": 0,
    "recipes": 0,
    "mealPlanEntries": 0,
    "shoppingItems": 0
  },
  "capabilities": {
    "inventory": true,
    "recipes": true,
    "mealPlans": true,
    "shopping": true
  },
  "storage": {
    "planner": "sql",
    "recipes": "sql",
    "shopping": "sql"
  },
  "auditLog": {
    "total": 42,
    "last24h": 5
  }
}
```

`auditLog.total` is the all-time count of rows in `dbo.AuditLog`. `auditLog.last24h` is the count of rows created in the last 24 hours.

---

## 2) Planner Write Contracts

### Create/Upsert meal entry
`POST /meal-plans`

Request:
```json
{
  "planDate": "2026-03-01",
  "mealType": "Dinner",
  "recipeId": null,
  "recipeName": "Garlic Pasta",
  "notes": null,
  "idempotencyKey": "5b9d...",
  "audit": {
    "actionId": "act_123",
    "actor": "user-or-agent",
    "source": "planner-ui",
    "requestedAtUtc": "2026-02-28T18:40:00Z"
  }
}
```

Response (201):
```json
{ "mealPlanEntryId": 42 }
```

Validation:
- `planDate` required, valid date.
- `mealType` required.
- If `mealType != Notes`, `recipeName` required.
- If `mealType == Notes`, `notes` required.

### Bulk migration/upsert
`POST /meal-plans/bulk`

Request:
```json
{ "entries": [ { "planDate": "2026-03-01", "mealType": "Lunch", "recipeName": "Soup" } ] }
```

Response (200):
```json
{ "accepted": 1, "processed": 1 }
```

### Delete meal entry
`DELETE /meal-plans?planDate=2026-03-01&mealType=Lunch&recipeName=Soup`

Response:
- `204` on success
- `404` if entry not found

### Upsert day note
`PUT /meal-plans/note`

Request:
```json
{ "planDate": "2026-03-01", "notes": "Prep ingredients" }
```

Response:
- `204` on success

---

## 3) Recipe Create Contracts

### Create single recipe
`POST /recipes`

Request:
```json
{
  "name": "Garlic Pasta",
  "course": "Dinner",
  "cuisine": "Italian",
  "source": "allrecipes.com",
  "tags": ["Quick", "Pasta"],
  "rating": 0,
  "addedAtUnixMs": 1709164800000,
  "servings": null,
  "ingredients": [],
  "steps": [],
  "idempotencyKey": "b2ce...",
  "audit": {
    "actionId": "act_456",
    "actor": "user-or-agent",
    "source": "recipes-ui",
    "requestedAtUtc": "2026-02-28T18:42:00Z"
  }
}
```

Response (201):
```json
{ "recipeId": 7, "name": "Garlic Pasta", "servings": null }
```

Validation:
- `name` required.
- Other fields optional and normalized.

### Bulk recipe migration
`POST /recipes/bulk`

Request:
```json
{ "entries": [ { "name": "Garlic Pasta", "course": "Dinner" } ] }
```

Response (200):
```json
{ "accepted": 1, "processed": 1 }
```

---

## Error Shape
Current API responses use simple shape:
```json
{ "error": "Human-readable message" }
```

Recommended future standard:
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "RecipeName is required.",
    "details": ["recipeName missing"],
    "traceId": "..."
  }
}
```
