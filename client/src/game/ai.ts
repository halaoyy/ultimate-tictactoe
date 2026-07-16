// ai.ts — Simple AI opponent for Ultimate Tic Tac Toe
// Uses random valid moves with slight preference for strategic positions.

import { GameState, BoardCoord, getValidMoves, checkWinner, CellValue, Player } from "./state";

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
      if (opponentCount === 2) score -= 15; // Block opponent
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

export function getAIMove(state: GameState): BoardCoord | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;

  const player = state.currentPlayer;

  // Score each move
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
      score += 100; // Winning a sub-board is very good
    }

    // Check if opponent would win the sub-board without this move (block)
    const opponent: Player = player === "X" ? "O" : "X";
    const blockBoard = state.board[move.outerRow][move.outerCol].map((r) => [...r]);
    blockBoard[move.innerRow][move.innerCol] = opponent;
    if (checkWinner(blockBoard) === opponent) {
      score += 80; // Blocking opponent is important
    }

    // Evaluate sub-board position
    score += evaluateSubBoard(subBoard, player) * 0.5;

    // Prefer sending opponent to a won/full board (free choice for us)
    const nextOr = move.innerRow;
    const nextOc = move.innerCol;
    if (
      state.subBoardWinners[nextOr][nextOc] !== null ||
      state.subBoardDrawn[nextOr][nextOc]
    ) {
      score += 20; // Sending to a done board gives opponent free choice, but we avoid bad boards
    }

    // Add small random noise to avoid deterministic play
    score += Math.random() * 5;

    return { move, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick from top 3 to add variety
  const topN = Math.min(3, scored.length);
  const pick = scored[Math.floor(Math.random() * topN)];
  return pick.move;
}
