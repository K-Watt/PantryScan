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

---

## 4) Calendar Contracts

### List events
`GET /calendar?from=2026-03-01&to=2026-03-31`

Response (200): array of event objects.

### Create event
`POST /calendar`

Request:
```json
{
  "title": "Doctor appointment",
  "startDate": "2026-03-15T10:00:00",
  "endDate": null,
  "allDay": false,
  "description": "Annual checkup",
  "category": "Medical",
  "color": null,
  "idempotencyKey": "cal-abc123",
  "audit": { "actor": "user", "source": "calendar-ui" }
}
```

Response (201):
```json
{ "eventId": 1, "title": "Doctor appointment" }
```

Validation:
- `title` required.
- `startDate` required, valid datetime.

### Update event
`PUT /calendar/{id}`

Request: any subset of create fields (all optional on update).

Response: `204` on success, `404` if not found.

### Delete event
`DELETE /calendar/{id}`

Response: `204` on success, `404` if not found.

---

## 5) Todos Contracts

### List todos
`GET /todos?list=General&completed=false`

- `list` (optional): filter by list name.
- `completed` (optional): `true` or `false`.

Response (200): array of todo objects.

### List names
`GET /todos/lists`

Response (200): string array of distinct list names.

### Create todo
`POST /todos`

Request:
```json
{
  "title": "Buy birthday cake",
  "notes": "Chocolate, 8-inch",
  "dueDate": "2026-03-20",
  "listName": "Family",
  "priority": 3,
  "idempotencyKey": "todo-xyz",
  "audit": { "actor": "user", "source": "todos-ui" }
}
```

Response (201):
```json
{ "todoId": 5, "title": "Buy birthday cake" }
```

Priority values: `1` = Low, `2` = Normal, `3` = High.

Validation:
- `title` required.

### Update todo
`PUT /todos/{id}`

Request: any subset of create fields (all optional on update).

Response: `204` on success, `404` if not found.

### Toggle complete
`PUT /todos/{id}/complete`

Request:
```json
{ "isCompleted": true }
```

Response: `204` on success, `404` if not found. Sets `completedAt` when marking done; clears it when reopening.

### Delete todo
`DELETE /todos/{id}`

Response: `204` on success, `404` if not found.

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
