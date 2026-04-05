# Product Requirements Document — PantryScan Family Hub

> **What a PRD is:** A single source of truth that answers *what* you're building, *why*, *for whom*, and *what done looks like*. It is not a technical spec — that lives in separate docs. A PRD focuses on problems and goals; technical docs focus on solutions and implementation. You write this before you build so that every decision has a reference point to check against.

---

## 1. Overview

PantryScan is a private, family-facing web application for managing the home kitchen and shared household life. It starts as a pantry inventory tracker and grows into a full family hub: recipes, meal planning, grocery list generation, a shared calendar, and to-do lists. Each family member has their own login.

A secondary goal runs alongside the build: use this project as a hands-on learning environment for modern AI development — agents, tool use, MCP servers, automations,and multi-step workflows — by wiring real AI capabilities into the app at each phase.

---

## 2. Problem Statement

> **What a problem statement does:** Forces you to articulate the *real* problem before proposing solutions. A common PRD mistake is jumping straight to features. If you don't nail the problem first, you risk building the right thing for the wrong reason — or the wrong thing entirely.

Managing a household kitchen is surprisingly chaotic:

- You don't know what you have, so you buy things you already own and forget things you need.
- Meals don't get planned, leading to last-minute decisions, food waste, and expensive takeout.
- Shopping trips are inefficient — no shared list, no sense of what's already stocked.
- Family members have no shared visibility into what's happening in the kitchen (or the household).

Existing apps (AnyList, Paprika, Mealime) solve parts of this, but they're generic, not extensible, and don't integrate with the kinds of AI tools that could make them genuinely smart — like automatically generating a shopping list from this week's meal plan, or suggesting meals based on what's about to expire.

**Secondary problem:** AI agent development is an increasingly important skill. Learning it in isolation (tutorials, toy examples) is less effective than building something real where the stakes and feedback loops are genuine.

---

## 3. Goals

> **What goals do:** Define success. Goals should be outcomes, not features. "Users can add a pantry item" is a feature. "Family members stop buying duplicate groceries" is a goal. Both matter — goals tell you *why* the features exist.

### App Goals
1. Any family member can check the pantry from their phone in under 10 seconds.
2. Meal planning for the week takes under 5 minutes and produces a ready-to-use grocery list.
3. No family member ever shows up at the store without the shared shopping list.
4. Food waste decreases because expiring items surface before they go bad.
5. The app grows with the family — new members, new features — without a full rewrite.

### Learning Goals
1. Understand what an AI agent is and how it differs from a chatbot.
2. Build and use at least one real MCP server integration.
3. Design and execute a multi-step AI workflow against a live database.
4. Understand what makes an API "agent-safe" (idempotency, audit trails, confirmation policies).
5. Be able to explain these concepts clearly enough to use them at work.
6. Understand automation capabilities. 

---

## 4. Non-Goals

> **What non-goals do:** Prevent scope creep. Explicitly deciding what you're *not* building is just as important as deciding what you are. It also helps when someone asks "why doesn't it do X?" — you have an answer.

- **Not a commercial product.** No monetization, no scalability requirements beyond a single household until 2027.
- **Not a native mobile app.** The UI is a web app; mobile is handled by opening it in a phone browser.
- **Not a nutrition tracker.** Calories, macros, dietary analysis — out of scope for now.
- **Not building a general-purpose AI assistant.** Claude is used for specific, scoped operations — not open-ended chat embedded in the app.

---

## 5. Users

> **What user definitions do:** Keep you honest about whose problems you're solving. In a company PRD, you'd have user research here. For a personal project, this is still useful — your future self, your partner, and your kids have different needs and different tolerances for complexity.

| User | Role | Needs |
|------|------|-------|
| **Kodi** (you) | Owner / builder | Full access, admin tools, developer context |
| **Family members** | Members | Simple read/write access to pantry, planner, shopping, automations |
| **Claude (AI agent)** | Automated actor | Agent-safe API access, semantic vocabulary, audit trail |

Note: The AI agent is treated as a first-class user of the system. This is intentional — it forces good API design (clear contracts, safe defaults, no ambiguous operations) that benefits human users too.

---

## 6. Features & Build Phases

> **What phases do:** Break an overwhelming project into deliverable chunks, each with a clear goal. In a work PRD, phases are often tied to quarters or sprints. Here, each phase is also tied to a learning concept so the build and the education happen together.

---

### Phase 0 — Context Layer ✅ Done
**What you built:** A `GET /agent/context` endpoint that returns a machine-readable summary of the database state (counts, capabilities, storage mode).

**What you learned:** An agent needs more than raw data — it needs a summary it can reason from quickly. This endpoint is how Claude knows "there are 12 pantry items and 5 recipes" without reading every row.

---

### Phase 1 — Semantic Layer ✅ Done
**What you built:** `docs/semantic-layer.md` — a vocabulary document that defines every entity, field, valid value, and safety rule in plain terms.

**What you learned:** AI agents don't just need APIs — they need *meaning*. A semantic layer is the difference between an agent that blindly calls endpoints and one that understands your domain. This is a pattern used in real AI systems at companies like Stripe and Notion.

---

### Phase 2 — Slash Command Agents ✅ Done
**What you built:** Five slash commands in `.claude/commands/`: `/pantry-status`, `/suggest-recipe`, `/add-recipe`, `/grocery-list`, `/plan-week`.

**What you learned:** A slash command is a simple, single-purpose agent. It has a goal, a set of tools (your API), and a defined output. This is the atomic unit of agent design — before you build workflows, you build individual operations.

---

### Phase 3 — Shopping API Migration ✅ Done
**What you built:**
- `dbo.ShoppingItems` SQL table with clientId, name, qty, category, store, note, recipesJson, isChecked
- `GET /shopping`, `POST /shopping/items`, `PUT /shopping/items/{id}/check`, `DELETE /shopping/items/{id}`, `DELETE /shopping/checked`, `POST /shopping/bulk`
- Frontend migration: on boot, `shopping.html` migrates any localStorage data to the API, then loads from SQL as source of truth
- `/grocery-list` slash command writes directly to the shopping API

**What you learned:** Why data that lives only in the browser is invisible to agents. An agent can only work with data it can read and write — `localStorage` is a dead end. This phase makes shopping a real, shared, agent-accessible resource.

---

### Phase 4 — Idempotency & Audit Trail ✅ Done
**What you built:**
- All write endpoints accept an optional `idempotencyKey` (UUID) — duplicate keys return `{ idempotent: true }` instead of re-executing
- `dbo.AuditLog` table records every write: method, endpoint, actor, outcome, timestamp
- Confirmation policy: every `DELETE` endpoint requires `?confirm=true` — omitting it returns `400` with a clear error
- `GET /agent/schema` documents the `writeEnvelope` and new `confirmationPolicy` for agents

**What you learned:** What makes an API *safe for automation*. When a human makes a mistake, they notice. When an agent makes a mistake at 3am in a loop, it might make it 500 times. Idempotency and audit trails are how you build systems that are safe to automate.

---

### Phase 5 — Simple AI Meal Planner 🔲 Upcoming
**What you'll build:**
- Quick-action cards on the planner page: "Plan this week", "Plan breakfasts", "Plan dinners", etc.
- Clicking a card triggers an AI workflow that:
  1. Reads the selected date range
  2. Reads available recipes and pantry inventory
  3. Generates a draft meal plan using sensible defaults
  4. Gives the option to add items to shopping list that aren't in current inventory. 
  5. Presents the draft to the user — each slot can be accepted, rejected, or swapped
  6. Rejected slots trigger a new AI suggestion for that slot only
  7. Confirmed slots are written to the meal plan API
- Also builds the `/plan-and-shop` command:
  1. Reads the confirmed meal plan
  2. Extracts required ingredients from each recipe
  3. Compares against pantry stock
  4. Writes missing items directly to the shopping list API

**What you'll learn:** What a *workflow* is — a sequence of agent steps with conditional logic, data passing between steps, and human review before a side effect lands. The accept/reject/re-suggest loop is the core pattern behind AI copilots that assist without overriding.

---

### Phase 5.5 — Extended AI Planner UI 🔲 Upcoming
**What you'll build:**
- A dedicated planner page with:
  - **Date range picker** at the top (select any span of days to plan)
  - **Left sidebar** with searchable, filterable recipe attributes — course, cuisine, tags, cook time, servings, and any future recipe attributes automatically included (filters are 1:1 with recipe fields)
  - **Cook time preference** — user sets a max cook time ceiling per day or per meal slot
  - **AI action cards** below the calendar view: "Plan this range", "Plan breakfasts only", "Fill empty slots", etc.
- AI uses the full filter state when generating draft plans — only suggests recipes that match the active filters
- Draft review UI from Phase 5 carries forward: accept, reject, get replacement suggestion per slot

**What you'll learn:** How to pass rich user context into an AI workflow. The AI isn't just running a script — it's using your filter state as a constraint set. This is how real AI features work: structured user intent → constrained generation → human review → commit.

---

### Phase 6 — Multi-User Auth 🔲 Upcoming
**What you'll build:**
- Login page with session tokens
- `dbo.Users` table (email, password hash, role)
- All write endpoints require `X-Session-Token` header
- Each family member gets their own login

**What you'll learn:** How identity works in agent systems. When multiple users *and* an AI agent all write to the same database, you need to know who did what. The audit trail from Phase 4 becomes meaningful here — `actor: "agent"` vs `actor: "user:2"`.

---

### Phase 7 — Google Calendar Integration 🔲 Future
**Depends on:** Phase 6 (auth) — requires a Google OAuth login to exist before Google Calendar access is possible.

**What you'll build:**
- Google Calendar OAuth scope added to the login flow — users grant calendar read access when signing in
- A calendar overlay toggle on the planner page — shows the user's real Google Calendar events on top of the meal plan date range
- AI planner is calendar-aware:
  - Reads event density per day (busy = short cook time, free = anything goes)
  - Factors the user's cook time preference alongside actual calendar load
  - Automatically suggests quicker recipes on packed days without being asked
- Cook time is sourced from recipe attributes and matched against the day's available time budget

**What you'll learn:** External API integration inside an AI workflow. The AI isn't just reading your database anymore — it's reading a third-party service and combining two data sources to make a better decision. This is how real-world AI features work at scale.

---

### Phase 8 — MCP Server Integration 🔲 Future
**What you'll build:**
- A local MCP server for PantryScan that exposes pantry, recipe, and shopping data as MCP tools
- Connect it to Claude Code so Claude can read/write your app natively without HTTP calls

**What you'll learn:** What MCP actually is under the hood — a protocol for exposing tools to AI models. You've been *using* MCP (Figma). This phase is where you *build* one. Understanding both sides is what separates someone who uses AI tools from someone who builds them.

---

### Phase 9 — Calendar & Todos 🔲 Future
**What you'll build:**
- `dbo.CalendarEvents` and `dbo.TodoItems` tables
- Calendar UI and Todo UI
- Agent commands for creating/querying events and tasks

**What you'll learn:** How to extend an agent-ready system. By this phase, the patterns are established — you're practicing applying them to new domains.

---

### Phase 10 — Expiration-Aware AI Planning 🔲 Future
**What you'll build:**
- The AI planner gains awareness of expiring pantry items when generating meal plans
- AI builds an internal model of average shelf life per food category (e.g. fresh produce expires faster than canned goods)
- When generating a draft plan, expiring items are weighted higher — meals that use them are suggested earlier in the week
- Over time the system learns your household's actual consumption patterns and refines its expiration estimates

**What you'll learn:** What AI *memory* looks like in a real system — not just recalling conversation history, but maintaining structured, persistent knowledge that improves over time. This is adjacent to how recommendation systems and personalization engines work. The key challenge is: how do you store what the AI has "learned" so it survives between sessions?

**Why this is last:** It requires a stable pantry inventory (Phase 3), a confirmed meal planning workflow (Phase 5/5.5), and enough recipe + pantry data in the system to be meaningful. The learning layer should be built on top of a working foundation, not alongside it.

---

## 7. Technical Architecture

> **What this section does:** Records the *why* behind tech choices so future-you doesn't wonder "why didn't we just use React?" This isn't a full spec — just the key decisions and their rationale.

| Concern | Choice | Why |
|---------|--------|-----|
| Backend | .NET 10 minimal API | Fast to write, strongly typed, easy SQL integration |
| ORM | Dapper | Lightweight — just parameterized SQL, no magic |
| Database | SQL Server (local) | Familiar, reliable, good tooling |
| Frontend | Vanilla HTML/CSS/JS | No build step, no framework churn, easy to understand |
| AI runtime | Claude Code + slash commands | Agent logic lives in `.claude/commands/`, not in app code |
| API design | REST + JSON | Simple, debuggable, tool-friendly |

**Key constraint:** All API endpoints live in `Program.cs` until the file exceeds ~1200 lines. No premature abstraction.

---

## 8. Success Criteria

> **What success criteria do:** Give you a way to declare something *done*. Without these, projects either never finish (perfectionism) or ship incomplete (moving goalposts). Good criteria are observable — you can check them without debate.

### App Success
- [ ] Any family member can add/remove pantry items without help
- [ ] Weekly meal planning + grocery list generation works end-to-end via a single agent command
- [ ] Shopping list is shared and synced (not per-device)
- [ ] Expiring items surface before they're wasted
- [ ] All family members have their own login
- [ ] AI can generate a full week draft meal plan in one action, with per-slot accept/reject/swap
- [ ] Extended planner filters recipe suggestions by course, cuisine, tags, cook time, and servings
- [ ] On busy days, AI automatically suggests shorter recipes based on Google Calendar load
- [ ] AI prioritizes expiring pantry items when planning meals for the week

### Learning Success
- [ ] Can explain what an agent is to someone who hasn't heard the term
- [ ] Have built and used a real MCP server (not just consumed one)
- [ ] Have written a multi-step workflow that touches a real database
- [ ] Understand what idempotency means and why it matters for automation
- [ ] Could write a basic PRD for a work project without a template
- [ ] Can explain what a semantic layer is and why it matters for AI systems
- [ ] Understand how external API data (Google Calendar) is combined with local data in an AI workflow
- [ ] Can explain what AI memory means in a production context

---

## 9. Open Questions

> **What open questions do:** Capture decisions that aren't made yet so they don't get forgotten or silently decided by whoever writes the code. In a work PRD, you'd assign owners and due dates. Here, just tracking them is enough.

- **Barcode scanning:** `barcode_scanner_page.html` exists — does this need to integrate with the pantry inventory fully, or stay a standalone tool?
- **Walmart integration:** What does "Walmart-integrated" actually mean? Search links only, or attempting a real cart/order API?
- **Mobile UX:** The app opens in a phone browser — is the current layout actually usable on mobile, or does it need a responsive redesign pass?
- **Notification system:** Expiring items should surface somewhere — but where? In-app alert, text message, something else?
- **Recipe import URL:** The `/recipes/import` endpoint is referenced in `/add-recipe` — does this endpoint exist yet?
- **AI planner entry points:** The quick-action cards ("Plan this week", "Plan breakfasts") — do these live on the existing planner page, or does the extended planner UI replace it entirely?
- **Rejected slot behavior:** When a user rejects a suggested meal, should the AI explain why it suggested it and ask for feedback, or just silently offer a new option?
- **Google Calendar scope:** Read-only access to event titles/times is enough for busy-day detection — but do we want to write meal plan events back to Google Calendar as well?
- **Expiration memory storage:** When the AI builds a model of average shelf life per food type, where does that data live? A new SQL table? Embedded in the semantic layer? This needs a design decision before Phase 10.

---

## 10. Revision History

> **What revision history does:** In a real PRD, this tracks who changed what and when, so stakeholders know if the document they read last week is still current. For a solo project, it's lighter — just enough to know when the doc was last meaningful updated.

| Date | Change |
|------|--------|
| 2026-03-28 | Initial draft |
| 2026-03-28 | Added AI meal planner feature (Phase 5, 5.5, Google Calendar, expiration-aware planning); expanded success criteria and open questions |
