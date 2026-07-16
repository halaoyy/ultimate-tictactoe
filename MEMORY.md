# Memory

## Key Decisions

- Chose HTML5 Canvas 2D over Babylon.js: Ultimate Tic Tac Toe is a 2D board game; Canvas 2D is simpler, faster, and more appropriate than a 3D engine.
- Dark neon theme: deep slate background, electric blue X, coral red O, golden active highlight.
- Pure TS game logic with zero React coupling — all in `client/src/game/`.
- HUD as React overlay (absolute positioned) on top of the canvas.
- AI opponent uses random valid moves for simplicity (can be upgraded to minimax).

## Quirks & Discoveries

- React 19 StrictMode double-mount: guard canvas init with a ref flag.
- Canvas resize: call `renderer.resize()` on window resize event.
- requestAnimationFrame loop: start after first render, cancel on unmount.

## What Worked

- (to be filled during implementation)

## What Failed

- (to be filled during implementation)
