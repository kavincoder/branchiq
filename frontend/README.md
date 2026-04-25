# BranchIQ — Frontend

React 19 + Vite 8 frontend for the BranchIQ banking management system.

## Stack

- **React 19** — component UI
- **Vite 8** — build tool and dev server
- **Recharts** — dashboard charts
- **SheetJS** — in-browser Excel export

## Development

```bash
npm install
npm run dev        # starts on http://localhost:5173
npm run build      # production build
npm test           # run Vitest unit tests
```

## Structure

```
src/
├── api/client.js          # Centralised HTTP client (all fetch calls go here)
├── context/AuthContext.jsx # Global auth state (current user, login/logout)
├── pages/                 # One component per screen
├── components/            # Shared UI (TopNav, icons)
└── styles/                # Per-page CSS modules
```

The frontend proxies all `/api/*` requests to the FastAPI backend at `http://localhost:8000` during development. See `vite.config.js` for proxy config.

See the [root README](../README.md) for full project documentation.
