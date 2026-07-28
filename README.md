# master-it frontend

Frontend for the master-it learning platform.

This app is built with React + TypeScript + Vite and integrates with the backend API through generated OpenAPI types and `openapi-fetch`.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Vitest + Testing Library
- ESLint
- Capacitor (Android config present)

## Backend relationship

- Backend reference repo: `../master-it-backend`
- Do not edit the backend from this repository.

## Requirements

- Node.js 24+
- npm 10+

## Environment variables

Create a `.env.local` file in the project root:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
VITE_USE_MOCK_STUDY=false
VITE_USE_MOCK_DASHBOARD=false
```

Notes:

- Set `VITE_USE_MOCK_STUDY=true` to force mock study page data.
- Set `VITE_USE_MOCK_DASHBOARD=true` to force mock dashboard data.

## Install

```bash
npm ci
```

## Run locally

```bash
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## API type generation

Always generate API types from the backend spec instead of hand-writing API interfaces.

```bash
npx openapi-typescript http://localhost:5000/api/spec --output src/api/v1.d.ts
```

## Architectural rules

- Do not write manual `fetch` calls for backend endpoints.
- Do not hand-write backend contract interfaces.
- Use the typed API client in `src/api/client.ts` with generated types in `src/api/v1.d.ts`.

## Mobile / Capacitor

- Capacitor config is in `capacitor.config.ts`.
- Android project is under `android/`.

## Current status

- P0 and P1 hardening items are complete (lint/build clean, key architecture fixes applied).
- P2 focuses on docs, CI, and broader test coverage.
