// renderer.ts — Canvas 2D renderer for Ultimate Tic Tac Toe
// Art direction: dark neon theme
//   Background: #0f172a (deep slate)
//   Outer grid lines: #e2e8f0 (bright white) with glow
//   Inner grid lines: #475569 (slate)
//   X color: #38bdf8 (electric blue) with glow
//   O color: #f87171 (coral red) with glow
//   Active board highlight: #fbbf24 (gold) with glow
//   Won board overlay: semi-transparent fill of winner color

import { GameState, Player, CellValue } from "./state";

interface AnimatedPiece {
  outerRow: number;
  outerCol: number;
  innerRow: number;
  innerCol: number;
  player: Player;
  progress: number; // 0..1
  startTime: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animatedPieces: AnimatedPiece[] = [];
  private lastState: GameState | null = null;

  // Layout constants (computed on resize)
  private boardSize = 0;
  private offsetX = 0;
  private offsetY = 0;
  private outerCellSize = 0;
  private innerCellSize = 0;
  private innerBoardPadding = 6;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.computeLayout(w, h);
  }

  private computeLayout(w: number, h: number) {
    // Leave room for HUD (top 80px, bottom 20px)
    const availH = h - 100;
    const availW = w - 40;
    this.boardSize = Math.min(availW, availH);
    this.offsetX = (w - this.boardSize) / 2;
    this.offsetY = 80 + (availH - this.boardSize) / 2;
    this.outerCellSize = this.boardSize / 3;
    this.innerCellSize = (this.outerCellSize - this.innerBoardPadding * 2) / 3;
  }

  // Trigger animation for a newly placed piece
  animatePiece(outerRow: number, outerCol: number, innerRow: number, innerCol: number, player: Player) {
    this.animatedPieces.push({
      outerRow, outerCol, innerRow, innerCol, player,
      progress: 0,
      startTime: performance.now(),
    });
  }

  // Update animations, returns true if still animating
  updateAnimations(now: number): boolean {
    const duration = 300; // ms
    this.animatedPieces = this.animatedPieces.filter((a) => {
      a.progress = Math.min(1, (now - a.startTime) / duration);
      return a.progress < 1;
    });
    return this.animatedPieces.length > 0;
  }

  render(state: GameState, now: number) {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Draw subtle background grid pattern
    this.drawBackgroundPattern(w, h);

    // Draw outer board
    this.drawOuterGrid();

    // Draw each sub-board
    for (let or = 0; or < 3; or++) {
      for (let oc = 0; oc < 3; oc++) {
        this.drawSubBoard(state, or, oc, now);
      }
    }

    this.lastState = state;
  }

  private drawBackgroundPattern(w: number, h: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawOuterGrid() {
    const ctx = this.ctx;
    const { offsetX, offsetY, boardSize, outerCellSize } = this;

    ctx.save();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(226,232,240,0.6)";
    ctx.shadowBlur = 8;

    // Draw 2 vertical lines
    for (let i = 1; i < 3; i++) {
      const x = offsetX + i * outerCellSize;
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + boardSize);
      ctx.stroke();
    }
    // Draw 2 horizontal lines
    for (let i = 1; i < 3; i++) {
      const y = offsetY + i * outerCellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + boardSize, y);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeRect(offsetX, offsetY, boardSize, boardSize);

    ctx.restore();
  }

  private getSubBoardOrigin(outerRow: number, outerCol: number): { x: number; y: number } {
    return {
      x: this.offsetX + outerCol * this.outerCellSize + this.innerBoardPadding,
      y: this.offsetY + outerRow * this.outerCellSize + this.innerBoardPadding,
    };
  }

  private drawSubBoard(state: GameState, outerRow: number, outerCol: number, now: number) {
    const ctx = this.ctx;
    const { innerCellSize, innerBoardPadding, outerCellSize } = this;
    const { x: bx, y: by } = this.getSubBoardOrigin(outerRow, outerCol);
    const innerBoardSize = outerCellSize - innerBoardPadding * 2;

    const winner = state.subBoardWinners[outerRow][outerCol];
    const isDrawn = state.subBoardDrawn[outerRow][outerCol];
    // Only show active highlight when game has started (at least one move made)
    const gameStarted = state.moveHistory.length > 0;
    const isActive =
      gameStarted &&
      !state.gameWinner &&
      !state.isDraw &&
      (state.nextBoard === null
        ? !winner && !isDrawn
        : state.nextBoard.row === outerRow && state.nextBoard.col === outerCol);

    // Active board highlight
    if (isActive) {
      ctx.save();
      ctx.fillStyle = "rgba(251,191,36,0.08)";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(bx - 4, by - 4, innerBoardSize + 8, innerBoardSize + 8, 6);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Draw inner grid lines
    ctx.save();
    ctx.strokeStyle = isActive ? "#64748b" : "#334155";
    ctx.lineWidth = 1.5;

    for (let i = 1; i < 3; i++) {
      const x = bx + i * innerCellSize;
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x, by + innerBoardSize);
      ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      const y = by + i * innerCellSize;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + innerBoardSize, y);
      ctx.stroke();
    }
    ctx.restore();

    // Draw pieces
    for (let ir = 0; ir < 3; ir++) {
      for (let ic = 0; ic < 3; ic++) {
        const cell = state.board[outerRow][outerCol][ir][ic];
        if (cell) {
          const cx = bx + ic * innerCellSize + innerCellSize / 2;
          const cy = by + ir * innerCellSize + innerCellSize / 2;

          // Check if this piece is being animated
          const anim = this.animatedPieces.find(
            (a) =>
              a.outerRow === outerRow &&
              a.outerCol === outerCol &&
              a.innerRow === ir &&
              a.innerCol === ic
          );
          const scale = anim ? this.easeOutBack(anim.progress) : 1;

          this.drawPiece(ctx, cell, cx, cy, innerCellSize * 0.38, scale);
        }
      }
    }

    // Last move highlight
    if (
      state.lastMove &&
      state.lastMove.outerRow === outerRow &&
      state.lastMove.outerCol === outerCol
    ) {
      const { innerRow: lr, innerCol: lc } = state.lastMove;
      const cx = bx + lc * innerCellSize;
      const cy = by + lr * innerCellSize;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(cx, cy, innerCellSize, innerCellSize);
      ctx.restore();
    }

    // Won/drawn overlay
    if (winner) {
      this.drawSubBoardWinOverlay(ctx, bx, by, innerBoardSize, winner);
    } else if (isDrawn) {
      this.drawSubBoardDrawOverlay(ctx, bx, by, innerBoardSize);
    }
  }

  private drawPiece(
    ctx: CanvasRenderingContext2D,
    player: Player,
    cx: number,
    cy: number,
    radius: number,
    scale: number
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    if (player === "X") {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = radius * 0.35;
      ctx.lineCap = "round";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      const r = radius * 0.7;
      ctx.beginPath();
      ctx.moveTo(-r, -r);
      ctx.lineTo(r, r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r, -r);
      ctx.lineTo(-r, r);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = radius * 0.3;
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSubBoardWinOverlay(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    size: number,
    winner: Player
  ) {
    ctx.save();
    const color = winner === "X" ? "#38bdf8" : "#f87171";
    const fillColor = winner === "X" ? "rgba(56,189,248,0.15)" : "rgba(248,113,113,0.15)";

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, size, size, 4);
    ctx.fill();

    // Draw large winner symbol
    const cx = bx + size / 2;
    const cy = by + size / 2;
    const r = size * 0.35;

    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    if (winner === "X") {
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSubBoardDrawOverlay(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    size: number
  ) {
    ctx.save();
    ctx.fillStyle = "rgba(100,116,139,0.2)";
    ctx.beginPath();
    ctx.roundRect(bx, by, size, size, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(100,116,139,0.6)";
    ctx.font = `bold ${size * 0.18}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DRAW", bx + size / 2, by + size / 2);
    ctx.restore();
  }

  // Easing function for piece placement animation
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Convert canvas coordinates to board coordinates
  hitTest(
    state: GameState,
    clientX: number,
    clientY: number
  ): { outerRow: number; outerCol: number; innerRow: number; innerCol: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { offsetX, offsetY, outerCellSize, innerCellSize, innerBoardPadding } = this;

    // Check if within board bounds
    if (
      x < offsetX ||
      x > offsetX + this.boardSize ||
      y < offsetY ||
      y > offsetY + this.boardSize
    ) {
      return null;
    }

    const outerCol = Math.floor((x - offsetX) / outerCellSize);
    const outerRow = Math.floor((y - offsetY) / outerCellSize);

    if (outerRow < 0 || outerRow > 2 || outerCol < 0 || outerCol > 2) return null;

    const bx = offsetX + outerCol * outerCellSize + innerBoardPadding;
    const by = offsetY + outerRow * outerCellSize + innerBoardPadding;

    const innerX = x - bx;
    const innerY = y - by;

    if (innerX < 0 || innerY < 0) return null;

    const innerCol = Math.floor(innerX / innerCellSize);
    const innerRow = Math.floor(innerY / innerCellSize);

    if (innerRow < 0 || innerRow > 2 || innerCol < 0 || innerCol > 2) return null;

    return { outerRow, outerCol, innerRow, innerCol };
  }
}
