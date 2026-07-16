# Ultimate Tic Tac Toe

## Runtime

- HTML5 Canvas 2D API (no Babylon.js — 2D board game)
- React 19 + TypeScript + Vite
- Browser URL: `http://localhost:3000`
- Dimension: 2D

## App Entry

- `client/index.html` → `client/src/main.tsx`
- `client/src/main.tsx` → renders `<App />`
- `client/src/App.tsx` → renders `<GameCanvas />` as full-screen sole content
- `client/src/components/GameCanvas.tsx` → owns canvas lifecycle, resize, render loop

## Game Modules

- `client/src/game/state.ts` → GameState class: 4D board, move validation, win detection, routing logic
- `client/src/game/renderer.ts` → Renderer class: draws board, symbols, highlights, overlays on Canvas 2D
- `client/src/game/input.ts` → InputHandler: maps canvas click → (outerRow, outerCol, innerRow, innerCol)
- `client/src/game/ai.ts` → SimpleAI: random valid move picker for single-player mode

## React Components

- `client/src/components/GameCanvas.tsx` → canvas wrapper + HUD overlay
- `client/src/pages/Home.tsx` → renders `<GameCanvas />` full-screen

## Assets

- Generated PNGs stored in `/home/ubuntu/webdev-static-assets/`
- Referenced via `/manus-storage/...` URLs
- Asset manifest in `ASSETS.md`

## Verification

- `pnpm check` (TypeScript)
- `pnpm build`
- `pnpm dev`
- Visual screenshots via `webdev_take_screenshot`
