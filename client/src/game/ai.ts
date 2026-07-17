// ai.ts — AI opponent with three difficulty levels
// Easy: random valid moves
// Medium: heuristic-based with some strategy
// Hard: minimax with alpha-beta pruning

import { GameState, BoardCoord, getValidMoves, checkWinner, CellValue, Player } from "./state";

export type AIDifficulty = "easy" | "medium" | "hard";

// Evaluate a position score for a given player in a sub-board
function evaluateSubBoard(cells: CellValue[][], player: Player): number {
  const opponent: Player = player === "X" ? "O" : "X";
  const lines = [
    [cells[0][0], cells[0][1], cells[0][2]],
    [cells[1][0], cells[1][1], cells[1][2]],
    [cells[2][0], cells[2][1], cells[2][2]],
    [cells[0][0], cells[1][0], cells[2][0]],
    [cells[0][1], cells[1][1], cells[2][1]],
    [cells[0][2], cells[1][2], cells[2][2]],
    [cells[0][0], cells[1][1], cells[2][2]],
    [cells[0][2], cells[1][1], cells[2][0]],
  ];

  let score = 0;
  for (const line of lines) {
    const playerCount = line.filter((c) => c === player).length;
    const opponentCount = line.filter((c) => c === opponent).length;
    if (opponentCount === 0) {
      if (playerCount === 2) score += 10;
      else if (playerCount === 1) score += 1;
    }
    if (playerCount === 0) {
      if (opponentCount === 2) score -= 15;
      else if (opponentCount === 1) score -= 1;
    }
  }
  return score;
}

// Strategic position weights (center > corners > edges)
const POSITION_WEIGHTS = [
  [3, 2, 3],
  [2, 4, 2],
  [3, 2, 3],
];

// ────────────────────────────────────────────────────────────────────
// EASY: Random valid moves
// ────────────────────────────────────────────────────────────────────

export function getEasyMove(state: GameState): BoardCoord | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

// ────────────────────────────────────────────────────────────────────
// MEDIUM: Heuristic-based with strategy
// ────────────────────────────────────────────────────────────────────

export function getMediumMove(state: GameState): BoardCoord | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;

  const player = state.currentPlayer;
  const scored = moves.map((move) => {
    let score = 0;

    // Position weight for inner cell
    score += POSITION_WEIGHTS[move.innerRow][move.innerCol];
    // Position weight for outer board
    score += POSITION_WEIGHTS[move.outerRow][move.outerCol] * 0.5;

    // Check if this move wins the sub-board
    const subBoard = state.board[move.outerRow][move.outerCol].map((r) => [...r]);
    subBoard[move.innerRow][move.innerCol] = player;
    if (checkWinner(subBoard) === player) {
      score += 100;
    }

    // Check if opponent would win the sub-board without this move (block)
    const opponent: Player = player === "X" ? "O" : "X";
    const blockBoard = state.board[move.outerRow][move.outerCol].map((r) => [...r]);
    blockBoard[move.innerRow][move.innerCol] = opponent;
    if (checkWinner(blockBoard) === opponent) {
      score += 80;
    }

    // Evaluate sub-board position
    score += evaluateSubBoard(subBoard, player) * 0.5;

    // Prefer sending opponent to a won/full board
    const nextOr = move.innerRow;
    const nextOc = move.innerCol;
    if (
      state.subBoardWinners[nextOr][nextOc] !== null ||
      state.subBoardDrawn[nextOr][nextOc]
    ) {
      score += 20;
    }

    // Add small random noise
    score += Math.random() * 5;

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topN = Math.min(3, scored.length);
  const pick = scored[Math.floor(Math.random() * topN)];
  return pick.move;
}

// ────────────────────────────────────────────────────────────────────
// HARD: Minimax with alpha-beta pruning
// ────────────────────────────────────────────────────────────────────

interface MinimaxResult {
  score: number;
  move: BoardCoord | null;
}

function makeTestMove(state: GameState, move: BoardCoord): GameState {
  // Simplified version of makeMove for minimax evaluation
  const newBoard = state.board.map((or) =>
    or.map((oc) => oc.map((ir) => [...ir]))
  );
  const newSubBoardWinners = state.subBoardWinners.map((row) => [...row]);
  const newSubBoardDrawn = state.subBoardDrawn.map((row) => [...row]);

  newBoard[move.outerRow][move.outerCol][move.innerRow][move.innerCol] = state.currentPlayer;

  const subBoardWinner = checkWinner(newBoard[move.outerRow][move.outerCol]);
  if (subBoardWinner) {
    newSubBoardWinners[move.outerRow][move.outerCol] = subBoardWinner;
  } else {
    const isFull = newBoard[move.outerRow][move.outerCol].every((r) =>
      r.every((c) => c !== null)
    );
    if (isFull) {
      newSubBoardDrawn[move.outerRow][move.outerCol] = true;
    }
  }

  const globalWinner = checkWinner(newSubBoardWinners);
  const allDone = newSubBoardWinners.every((row, r) =>
    row.every((w, c) => w !== null || newSubBoardDrawn[r][c])
  );

  let nextBoard: { row: number; col: number } | null = { row: move.innerRow, col: move.innerCol };
  if (
    newSubBoardWinners[move.innerRow][move.innerCol] !== null ||
    newSubBoardDrawn[move.innerRow][move.innerCol]
  ) {
    nextBoard = null;
  }

  const nextPlayer: Player = state.currentPlayer === "X" ? "O" : "X";

  return {
    board: newBoard,
    subBoardWinners: newSubBoardWinners,
    subBoardDrawn: newSubBoardDrawn,
    currentPlayer: globalWinner || (allDone && !globalWinner) ? state.currentPlayer : nextPlayer,
    nextBoard: globalWinner || allDone ? null : nextBoard,
    gameWinner: globalWinner,
    isDraw: !globalWinner && allDone,
    scores: state.scores,
    moveHistory: [...state.moveHistory, move],
    lastMove: move,
  };
}

function evaluateTerminal(state: GameState, aiPlayer: Player): number {
  if (state.gameWinner === aiPlayer) return 1000;
  if (state.gameWinner && state.gameWinner !== aiPlayer) return -1000;
  if (state.isDraw) return 0;
  return 0;
}

function minimax(
  state: GameState,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
  isMaximizing: boolean
): number {
  // Terminal conditions
  if (state.gameWinner || state.isDraw || depth >= maxDepth) {
    return evaluateTerminal(state, aiPlayer);
  }

  const moves = getValidMoves(state);
  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newState = makeTestMove(state, move);
      const eval_ = minimax(newState, depth + 1, maxDepth, alpha, beta, aiPlayer, false);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newState = makeTestMove(state, move);
      const eval_ = minimax(newState, depth + 1, maxDepth, alpha, beta, aiPlayer, true);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getHardMove(state: GameState): BoardCoord | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;

  const aiPlayer = state.currentPlayer;
  const maxDepth = 5; // Adjust for performance

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const newState = makeTestMove(state, move);
    const score = minimax(newState, 0, maxDepth, -Infinity, Infinity, aiPlayer, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// ────────────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────────────

export function getAIMove(state: GameState, difficulty: AIDifficulty): BoardCoord | null {
  switch (difficulty) {
    case "easy":
      return getEasyMove(state);
    case "medium":
      return getMediumMove(state);
    case "hard":
      return getHardMove(state);
    default:
      return getMediumMove(state);
  }
}
