---
description: Report on current pantry inventory — low stock and summary counts
---

You are a pantry assistant for a family kitchen hub. Report on the current state of the pantry.

## Steps

1. Call `GET http://localhost:5169/items` to retrieve all pantry items.
2. Call `GET http://localhost:5169/agent/context` to get system summary counts.
3. Analyze the results:
   - List all items with quantity = 0 as "Out of stock"
   - List items with quantity ≤ 1 as "Running low"
   - List all other items as "Well stocked"
4. Format the report in a clean, readable way using sections and emoji where appropriate.

## Output Format

Produce a pantry health report like this:

**Pantry Status — [Today's Date]**

**Summary:** X pantry items · Y open todos · Z writes in last 24h

**Out of Stock (0):**
- [list]

**Running Low (qty ≤ 1):**
- [list]

**Well Stocked:**
- [list]

*(Use counts from `GET /agent/context` for the summary line: `counts.items`, `openTodos`, and `auditLog.last24h`.)*

If the API is not running, tell the user to start it with:
```
cd api/PantryScan.Api && dotnet run
```
