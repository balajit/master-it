# AGENTS.md — master-it Frontend Configuration

## master-it-backend (Reference)
- ../master-it-backend provides the required server side functionality.  Use it only for reference. Never edit it.

## Workflow Tools
- API Client Generation: `npx openapi-typescript http://localhost:5000/api/spec --output src/api/v1.d.ts`

## Architectural Rules
- Do not write manual `fetch` calls or custom interface types for the backend API.
- Always run the openapi-typescript generator when backend endpoints change to ensure total synchronization.
