# PantryScan — React UI

React + TypeScript + Vite frontend for PantryScan Family Hub.
Replaces the original static HTML pages with a full single-page application.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for dev server and bundling
- **React Router v7** for client-side routing
- **PantryScan theme** (`src/theme.css`) — glassmorphism design system

## Getting Started

### Prerequisites

- Node.js 18+
- The .NET API running at `http://localhost:5169`
  (`cd api/PantryScan.Api && dotnet run`)

### Development

```bash
cd ui-react
npm install
npm run dev
```

Runs at `http://localhost:5173` by default.

### Build

```bash
npm run build
```

Output goes to `dist/`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5169` | Base URL of the .NET API |

Defined in `.env.development` for local development.

## Pages and Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `PantryPage` | Pantry inventory — add, view, remove items |
| `/recipes` | `RecipesPage` | Recipe list — create and delete recipes |
| `/planner` | `PlannerPage` | Weekly meal planner |
| `/shopping` | `ShoppingPage` | Shopping list |
| `/scan` | `BarcodePage` | Barcode scanner (manual entry + camera placeholder) |
| `/login` | `LoginPage` | Sign-in scaffold (Phase 3) |
| `/register` | `RegisterPage` | Registration scaffold (Phase 3) |

## Project Structure

```
src/
  services/
    api.ts          TypeScript API client — typed interfaces + fetch wrappers
  components/
    Sidebar.tsx     Glassmorphism sidebar with NavLink navigation
  pages/
    PantryPage.tsx
    RecipesPage.tsx
    PlannerPage.tsx
    ShoppingPage.tsx
    BarcodePage.tsx
    LoginPage.tsx
    RegisterPage.tsx
  App.tsx           BrowserRouter + layout shell
  main.tsx          React entry point
  index.css         Global styles (imports theme.css design tokens)
  theme.css         Design tokens and shared component styles
```

## Auth Status

Authentication is planned for Phase 3. The Login and Register pages are
scaffolded with form UI only and will be wired to the API in a future phase.
