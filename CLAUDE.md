# CLAUDE.md — master-it App Guide

## Tech Stack
- Frontend: React 18+ with Vite (TypeScript)
- Styling: Tailwind CSS & shadcn/ui
- Mobile Packaging: Capacitor JS (for future Android/iOS build)
- Package Manager: npm (or pnpm)

## Build & Test Commands
- Run Dev Server: `npm run dev`
- Build Web App: `npm run build`
- Sync with Android: `npx cap sync android`
- Run Tests: `npm run test`
- Run Single Test: `npm run test -- <filename>`
- Linting: `npm run lint`

## Code Style & Architectural Rules
- Use TypeScript for all files.
- Write functional React components using Tailwind CSS for styling.
- Use arrow functions for all component definitions.
- Strictly enforce `strictNullChecks` in TypeScript.
- Keep components small and modular. Store reusable UI in `src/components/ui`.
- Do not write raw CSS or use alternative styling frameworks (like Bootstrap).
- Keep layout responsive and mobile-first, ensuring it looks great on portrait phone screens.


## Git & PR Conventions
- Never commit directly to `main`. Always create a feature branch.
- Branch naming convention: `feature/brief-description`.
