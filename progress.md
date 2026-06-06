# Progress

## Status
Complete — All code review issues fixed (TypeScript compiles cleanly on both frontend and backend).

## Issues Fixed

### 🔴 Critical (C1, C2)
- **C1/C2: Hardcoded secrets** — Startup guards in `server.ts` crash in production if `JWT_SECRET`/`DATABASE_URI` missing; warnings issued in all environments for default values. `.env.example` created.
- **Shared config** — `backend/src/config/auth.ts` centralises `JWT_SECRET`, `SALT_ROUNDS`, `TOKEN_EXPIRY`, `MIN_PASSWORD_LENGTH`.

### 🟠 High (H1-H3)
- **H1: Rate limiting** — `express-rate-limit` added; 5 req/min on login, 3 req/min on password change.
- **H2: Token invalidation** — `tokenVersion` field on User model, incremented on password change, checked in `authMiddleware` and `verifyToken`.
- **H3: Password length** — Minimum raised to 8 characters across backend and frontend.

### 🟡 Medium (M1-M8)
- **M1: API_BASE_URL** — Shared `frontend/src/api/config.ts` imported by all 4 API modules.
- **M2: Context memoization** — `AuthContext` value wrapped in `useMemo`.
- **M3: CSS variables** — `--surface-color-hover`, `--border-color-hover`, `--focus-ring-color` added to `global.ts`.
- **M4: express-async-handler** — Removed from `package.json` and all route files (Express 5 native async handling).
- **M5: loadAppState double call** — Cached via `useState` in `App.tsx`.
- **M6: Error handler** — Created `backend/src/middleware/errorHandler.ts`, mounted in `server.ts`.
- **M7: Env validation** — Production startup guard + warnings for default values.
- **M8: auth.ts raw fetch** — `verifyToken` and `changePassword` now use `authFetch`; `login` kept as raw fetch (no auth header needed).

### 🔵 Minor/Observations (O1-O13)
- **O1**: JWT_SECRET deduplicated via shared config.
- **O2**: `@types/bcryptjs` removed (bcryptjs 3.x ships own types).
- **O3**: `getAuthHeader` alias removed from `auth-header.ts`.
- **O4**: English fallback `'Login failed'` → Catalan `'Error d\'inici de sessió'`.
- **O5**: Dead `publicPaths` array removed from `authMiddleware.ts`.
- **O6**: `.env.example` created.
- **O7**: Username case-insensitive — `lowercase: true` on User schema, `toLowerCase()` in seed/login.
- **O8**: Seed race condition — `findOneAndUpdate` with `upsert` replaces `create`.
- **O9**: DRY messages — `ErrorMessage`/`SuccessMessage` unified into `MessageBanner` component.
- **O10**: Inline styles in AuthGate replaced with `LoadingContainer` styled component.
- **O11**: Focus trap — Not addressed (requires deeper Modal refactor; existing ESC-to-close + overlay-click-to-close covers basic UX).
- **O12**: Close icon → native `<button>` with `type="button"`.
- **O13**: `TimerProvider` moved outside `AuthGate` (timers survive logout).

## Files Changed
**23 modified + 4 new = 27 files total**
- `backend/package.json`, `backend/pnpm-lock.yaml` — swapped `express-async-handler` for `express-rate-limit`, removed `@types/bcryptjs`
- `backend/src/config/auth.ts` — **NEW** shared auth config
- `backend/src/middleware/authMiddleware.ts` — shared config, user DB check, tokenVersion
- `backend/src/middleware/errorHandler.ts` — **NEW** centralized error handler
- `backend/src/models/User.ts` — tokenVersion, lowercase username, minlength, maxlength
- `backend/src/routes/authRoutes.ts` — rate limiting, removed asyncHandler
- `backend/src/routes/recipeRoutes.ts`, `defaultStepsRoutes.ts` — removed asyncHandler
- `backend/src/controllers/authController.ts` — password length 8
- `backend/src/server.ts` — env validation, CORS origins, error handler
- `backend/src/services/authService.ts` — shared config, tokenVersion, password≥8, race-free seed
- `backend/.env.example` — **NEW** env template
- `frontend/src/api/config.ts` — **NEW** shared API config
- `frontend/src/api/auth-header.ts` — removed alias, improved authFetch types
- `frontend/src/api/auth.ts` — use authFetch, shared config
- `frontend/src/api/defaultSteps.ts`, `ingredients.ts`, `recipes.ts` — shared config
- `frontend/src/components/auth/AuthGate.tsx` — styled loading container
- `frontend/src/components/auth/ChangePasswordModal.tsx` — unified MessageBanner, password 8
- `frontend/src/components/auth/LoginPage.tsx` — Catalan error
- `frontend/src/components/tabs/TabBar.tsx` — native close button
- `frontend/src/contexts/AuthContext.tsx` — useMemo, AbortController, exported AuthState
- `frontend/src/App.tsx` — loadAppState cached
- `frontend/src/main.tsx` — TimerProvider outside AuthGate
- `frontend/src/styles/global.ts` — missing CSS variables

## Remaining (Low Priority)
- O11: Focus trap in Modal (accessible focus management — existing ESC/overlay-close covers basic UX)
- H4: Add tests (no test framework exists yet; new effort)
