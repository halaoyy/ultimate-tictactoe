# Game Plan: Ultimate Tic Tac Toe

## Game Rules Summary

Ultimate Tic Tac Toe is played on a 3×3 grid of smaller 3×3 tic-tac-toe boards (9 sub-boards total, 81 cells).

- Players alternate turns placing X or O.
- The cell you play in a sub-board determines which sub-board your opponent must play in next (e.g., playing in cell [row=1,col=2] of any sub-board sends the opponent to sub-board [row=1,col=2]).
- If the target sub-board is already won or full, the opponent may play in any open sub-board.
- Win a sub-board by getting 3 in a row in that local board.
- Win the game by winning 3 sub-boards in a row on the outer 3×3 grid.

## Risk Tasks

### 1. Board Routing Logic (Send-to-Sub-Board Mechanic)
- **Why isolated:** The core mechanic — mapping a local cell position to the next required sub-board — is easy to get wrong. Off-by-one errors in row/col indexing cause silent gameplay bugs where the wrong board is highlighted.
- **Approach:** Use a single `nextBoard: {row, col} | null` state variable. After each move, set `nextBoard` to the local cell coordinates just played. On the next turn, if `nextBoard` points to a won/full board, set it to `null` (free choice). Verify with unit-style console assertions.
- **Verify:** Play into cell (0,0) of sub-board (1,1) → opponent must play in sub-board (0,0). Play into cell (2,2) → opponent must play in sub-board (2,2). Play into a won sub-board's position → opponent gets free choice (all open boards highlighted).

### 2. Win Detection (Both Local and Global)
- **Why isolated:** Two-level win detection (local 3×3 and global 3×3) must be correct and efficient. Checking all 8 lines (3 rows, 3 cols, 2 diags) at both levels.
- **Approach:** Single `checkWinner(board: (Player|null)[][]): Player|null` function reused for both local and global boards. Call after every move on the affected sub-board, then call again on the global board using sub-board winners as cells.
- **Verify:** Fill 3 in a row in a sub-board → sub-board shows winner overlay. Win 3 sub-boards in a row → game-over screen shows winner.

## Main Build

### Systems to Build

1. **GameState module** (`client/src/game/state.ts`) — Pure TS, no DOM/Babylon dependency.
   - `board[3][3][3][3]`: 4D array representing all 81 cells.
   - `subBoardWinners[3][3]`: winner of each sub-board (X, O, or null).
   - `currentPlayer`: X or O.
   - `nextBoard: {row,col} | null`: which sub-board must be played next.
   - `gameWinner`: overall winner or null.
   - `makeMove(outerRow, outerCol, innerRow, innerCol)`: validates and applies a move.
   - `isValidMove(outerRow, outerCol, innerRow, innerCol)`: checks legality.

2. **Renderer** (`client/src/game/renderer.ts`) — Pure canvas 2D rendering (no Babylon needed for 2D board game).
   - Draws outer grid, inner grids, X/O symbols, highlights, win overlays.
   - Accepts GameState and renders to HTMLCanvasElement.
   - Highlight active sub-board(s) with golden glow.
   - Animate X/O placement with a brief scale-in effect.
   - Show sub-board winner overlay (large X or O with semi-transparent fill).

3. **InputHandler** (`client/src/game/input.ts`) — Maps canvas click coordinates to (outerRow, outerCol, innerRow, innerCol).

4. **AI Opponent** (`client/src/game/ai.ts`) — Optional simple AI using random valid moves (can be upgraded to minimax later).

5. **GameCanvas component** (`client/src/components/GameCanvas.tsx`) — React wrapper using HTML5 Canvas 2D (not Babylon, since this is a 2D board game).

6. **HUD** — React overlay on top of canvas: player turn indicator, scores, new game button, win announcement.

### Assets needed
- X symbol: electric blue glowing X icon (PNG, transparent bg, ~128×128)
- O symbol: coral red glowing O circle icon (PNG, transparent bg, ~128×128)
- Board background: subtle dark texture (optional)

### Verify
- Board routing: playing in cell (r,c) sends opponent to sub-board (r,c)
- Win detection: local and global wins correctly detected and displayed
- Free choice: when target sub-board is won/full, all open boards are highlighted
- Turn alternation: X and O alternate correctly
- Score tracking: wins accumulate across new games
- UI readable, no overflow or overlap
- Responsive: works on both desktop and mobile viewports
- No browser console errors during play
- Gameplay flow matches Ultimate Tic Tac Toe rules
- reference.png consistency: dark theme, neon colors, clean layout

## Implementation Notes

- Use HTML5 Canvas 2D API for rendering (simpler and more appropriate than Babylon.js for a 2D board game).
- GameCanvas.tsx wraps a `<canvas>` element, manages resize, and drives the render loop via `requestAnimationFrame`.
- All game logic in pure TS under `client/src/game/` — zero React coupling.
- HUD as React overlay positioned absolutely over the canvas.
- Dark theme: background `#0f172a`, board lines white with glow, X blue `#38bdf8`, O red `#f87171`, active board gold `#fbbf24`.
