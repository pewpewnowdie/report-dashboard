# Admin Dashboard

React frontend for the admin panel, built with Vite.

---

## Prerequisites

- Node.js >= 18
- Your FastAPI backend running (default: `http://localhost:8000`)

---

## Setup & Run

```bash
# 1. Go into the project folder
cd admin-dashboard

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

All `/admin/*` requests are automatically proxied to `http://localhost:8000` via Vite's dev proxy, so no CORS issues during development.

---

## Build for Production

```bash
npm run build
```

This outputs a static bundle to `dist/`. You can then serve it from your FastAPI app using `StaticFiles`, nginx, or any CDN.

### Serving from FastAPI (optional)

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="dist", html=True), name="frontend")
```

Make sure this mount comes **after** all your API routers.

---

## Configuring the Backend URL

The API base URL is set in `src/api/client.js`:

```js
const BASE_URL = "/admin";
```

In development, Vite proxies this to `http://localhost:8000/admin`.

To point at a different backend (e.g. staging), update `vite.config.js`:

```js
proxy: {
  "/admin": {
    target: "http://your-staging-server.com",
    changeOrigin: true,
  },
},
```

---

## Project Structure

```
admin-dashboard/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root: wires hooks → pages
    │
    ├── api/
    │   ├── client.js         # Base fetch wrapper
    │   └── index.js          # Domain-grouped API methods
    │
    ├── hooks/
    │   ├── useProjects.js    # Projects + project-user state
    │   ├── useUsers.js       # All users state
    │   ├── useReleases.js    # Releases state
    │   └── useToast.js       # Toast notification helper
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   ├── Toast.jsx
    │   │   └── ErrorBanner.jsx
    │   └── modals/
    │       ├── ModalPrimitives.jsx   # ModalShell, Field, ModalActions
    │       ├── CreateProjectModal.jsx
    │       ├── CreateReleaseModal.jsx
    │       └── AddUserModal.jsx
    │
    └── pages/
        ├── ProjectsPage.jsx  # Projects list + project detail
        ├── UsersPage.jsx     # Users list + user detail
        └── ReleasesPage.jsx  # All releases across projects
```
