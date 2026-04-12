# Product Requirements Document — PantryScan Family Hub

> **What a PRD is:** A single source of truth that answers *what* you're building, *why*, *for whom*, and *what done looks like*. It is not a technical spec — that lives in separate docs. A PRD focuses on problems and goals; technical docs focus on solutions and implementation. You write this before you build so that every decision has a reference point to check against.

---

## 1. Overview

PantryScan is a private, family-facing web application for managing the home kitchen and shared household life. It starts as a pantry inventory tracker and grows into a full family hub: recipes, meal planning, grocery list generation, a shared calendar, and to-do lists. Each family member has their own login.

A secondary goal runs alongside the build: use this project as a hands-on learning environment for modern AI development — agents, tool use, MCP servers, Github Copilot skills, Claude skills,  automations,and multi-step workflows — by wiring real AI capabilities into the app at each phase.

> **Note on the home page:** The pantry inventory (`index.html`) is the current default landing page — a practical starting point, not the intended final experience. The long-term home page will be an AI-powered smart dashboard that greets the family with personalized meal suggestions based on pantry state, item freshness, cost, and a household preference profile. See Phase 12.

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

### Phase 5 — Simple AI Meal Planner ✅ Done
**What you built:**
- AI action bar on the planner page with quick-action cards: "Plan this week", "Plan breakfasts", "Plan dinners", "Plan & shop"
- Each card generates the corresponding slash command prefilled with the current week's date range and copies it to clipboard — the user pastes it into Claude Code to run the workflow
- `/plan-week` slash command: reads the date range, available recipes, and pantry inventory; generates a draft meal plan; presents it slot-by-slot for accept/reject/swap via Claude Code's conversational interface; writes confirmed slots to the meal plan API
- `/plan-and-shop` slash command: reads the confirmed meal plan, extracts required ingredients, compares against pantry stock, writes missing items to the shopping list API

**What you learned:** What a *workflow* is — a sequence of agent steps with conditional logic, data passing between steps, and human review before a side effect lands. The accept/reject/re-suggest loop is the core pattern behind AI copilots that assist without overriding. The "copy to Claude Code" pattern is a pragmatic bridge: the AI workflow lives in Claude Code, not in the browser.

---

### Phase 6 — Extended AI Planner UI 🔶 In Progress
**What's been built so far:**
- Left sidebar on the planner page with recipe list, search, and course grouping
- "Filters ≡" button exists in the sidebar (not yet wired up)

**What remains:**
- **Date range picker** at the top (currently only navigates by week/month, no custom range selection)
- **Full filter panel** — cuisine, tags, cook time, servings (button exists but has no behavior)
- **Cook time preference** — user sets a max cook time ceiling per day or per meal slot
- AI uses the full filter state when generating draft plans — only suggests recipes matching active filters

**What you'll learn:** How to pass rich user context into an AI workflow. The AI isn't just running a script — it's using your filter state as a constraint set. This is how real AI features work: structured user intent → constrained generation → human review → commit.

---

### Phase 7 — Multi-User Auth 🔶 In Progress
**What's been built:**
- `login.html` sign-in page
- `dbo.Users` table (display name, email, password hash, role)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` endpoints
- Session token generation and validation helpers in the API

**What remains:**
- Write endpoints don't yet enforce `X-Session-Token` — auth exists but isn't gated
- Each family member needs their own login provisioned

**What you'll learn:** How identity works in agent systems. When multiple users *and* an AI agent all write to the same database, you need to know who did what. The audit trail from Phase 4 becomes meaningful here — `actor: "agent"` vs `actor: "user:2"`.

---

### Phase 8 — Google Calendar Integration 🔲 Future
**Depends on:** Phase 7 (auth) — requires a Google OAuth login to exist before Google Calendar access is possible.

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

### Phase 9 — MCP Server Integration 🔲 Future
**What you'll build:**
- A local MCP server for PantryScan that exposes pantry, recipe, and shopping data as MCP tools
- Connect it to Claude Code so Claude can read/write your app natively without HTTP calls

**What you'll learn:** What MCP actually is under the hood — a protocol for exposing tools to AI models. You've been *using* MCP (Figma). This phase is where you *build* one. Understanding both sides is what separates someone who uses AI tools from someone who builds them.

---

### Phase 10 — Calendar & Todos ✅ Done
**What you built:**
- `dbo.CalendarEvents` and `dbo.Todos` tables (auto-created on startup)
- Full CRUD endpoints: `GET/POST/PUT/DELETE /calendar`, `GET/POST/PUT/DELETE /todos`, `PUT /todos/{id}/complete`, `GET /todos/lists`
- `calendar.html` — month-view grid calendar UI
- `todos.html` — list-based UI with priorities and due dates
- `agent-data-service.js` extended with event and todo read/write methods
- All page sidebars updated to include Calendar and Todos navigation links

**What you learned:** How to extend an agent-ready system. By this phase, the patterns are established — you're practicing applying them to new domains.

---

### Phase 11 — Expiration-Aware AI Planning 🔲 Future
**What you'll build:**
- The AI planner gains awareness of expiring pantry items when generating meal plans
- AI builds an internal model of average shelf life per food category (e.g. fresh produce expires faster than canned goods)
- When generating a draft plan, expiring items are weighted higher — meals that use them are suggested earlier in the week
- Over time the system learns your household's actual consumption patterns and refines its expiration estimates

**What you'll learn:** What AI *memory* looks like in a real system — not just recalling conversation history, but maintaining structured, persistent knowledge that improves over time. This is adjacent to how recommendation systems and personalization engines work. The key challenge is: how do you store what the AI has "learned" so it survives between sessions?

**Why this is last:** It requires a stable pantry inventory (Phase 3), a confirmed meal planning workflow (Phase 5/6), and enough recipe + pantry data in the system to be meaningful. The learning layer should be built on top of a working foundation, not alongside it.

---

### Phase 12 — Smart Home Dashboard 🔲 Future
**What you'll build:**
- A new `home.html` that becomes the app's default landing page, replacing the pantry page as the root
- On load, the page displays AI-generated meal suggestions personalized to the household's current state
- Suggestions factor in: pantry contents, items nearing expiration, ingredient cost/value, and a household preference profile (parameters TBD — see Open Questions)
- A custom AI instruction set — a "household preference profile" — shapes the suggestion logic: dietary preferences, budget targets, cuisine variety goals, cook time constraints, and more
- The pantry inventory page moves to a secondary nav item; it is no longer the root of the app

**What you'll learn:** What a truly personalized AI surface looks like — not just "generate something from data," but "generate something shaped by persistent, structured household preferences." The preference profile is your first real example of *instructable AI behavior*: changing what the model does without changing the model itself. This is the same pattern used in AI products that let users customize assistant tone, priorities, and constraints.

**Note:** The full set of parameters for the household preference profile is TBD. A dedicated scoping session (quiz) will define them before this phase begins.

---

## 7. Technical Architecture

> **What this section does:** Records the *why* behind tech choices so future-you doesn't wonder "why didn't we just use React?" This isn't a full spec — just the key decisions and their rationale.

| Concern | Choice | Why |
|---------|--------|-----|
| Backend | .NET 10 minimal API | Fast to write, strongly typed, easy SQL integration |
| ORM | Dapper | Lightweight — just parameterized SQL, no magic |
| Database | SQL Server (local) | Familiar, reliable, good tooling |
| Frontend | Vanilla HTML/CSS/JS | No build step, no framework churn, easy to understand |
| Frontend (planned) | React + TypeScript + Vite (`ui-react/`) | Planned migration to a component-based SPA; currently exploratory alongside the vanilla JS frontend |
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
- **Expiration memory storage:** When the AI builds a model of average shelf life per food type, where does that data live? A new SQL table? Embedded in the semantic layer? This needs a design decision before Phase 11.
- **Smart Home Dashboard parameters:** What signals should drive meal suggestions on the home page? Pantry contents and expiration are confirmed inputs; price/cost awareness, dietary preferences, cuisine variety targets, cook time ceilings, and others are TBD — to be explored in a dedicated scoping session before Phase 12 begins.
- **React migration:** `ui-react/` scaffolds the planned React/TypeScript/Vite frontend. When does exploration become a committed migration, and what triggers the cutover from vanilla HTML pages?

---

## 10. Revision History

> **What revision history does:** In a real PRD, this tracks who changed what and when, so stakeholders know if the document they read last week is still current. For a solo project, it's lighter — just enough to know when the doc was last meaningful updated.

| Date | Change |
|------|--------|
| 2026-03-28 | Initial draft |
| 2026-03-28 | Added AI meal planner feature (Phase 5, 5.5, Google Calendar, expiration-aware planning); expanded success criteria and open questions |
| 2026-04-05 | Added Smart Home Dashboard vision (Phase 11); noted pantry page as temporary home; added open question for home page parameters |
| 2026-04-11 | Renumbered phases sequentially (5.5→6, 6→7, 7→8, 8→9, 9→10, 10→11, 11→12) to reflect actual build order; added React/TypeScript/Vite planned migration to Technical Architecture; added React migration open question |
