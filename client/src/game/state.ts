// state.ts — Ultimate Tic Tac Toe game state and logic
// Pure TypeScript, zero React/DOM coupling.
// Art direction: dark neon theme, electric blue X, coral red O, golden active highlight.

export type Player = "X" | "O";
export type CellValue = Player | null;

export interface BoardCoord {
  outerRow: number;
  outerCol: number;
  innerRow: number;
  innerCol: number;
}

export interface GameState {
  // 4D board: board[outerRow][outerCol][innerRow][innerCol]
  board: CellValue[][][][];
  // Winner of each sub-board (null = not won yet)
  subBoardWinners: CellValue[][];
  // Whether each sub-board is full (drawn)
  subBoardDrawn: boolean[][];
  currentPlayer: Player;
  // Which sub-board must be played next (null = free choice)
  nextBoard: { row: number; col: number } | null;
  gameWinner: Player | null;
  isDraw: boolean;
  scores: { X: number; O: number };
  moveHistory: BoardCoord[];
  lastMove: BoardCoord | null;
}

export function createInitialState(): GameState {
  return {
    board: Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => Array(3).fill(null))
          )
      ),
    subBoardWinners: Array(3)
      .fill(null)
      .map(() => Array(3).fill(null)),
    subBoardDrawn: Array(3)
      .fill(null)
      .map(() => Array(3).fill(false)),
    currentPlayer: "X",
    nextBoard: null,
    gameWinner: null,
    isDraw: false,
    scores: { X: 0, O: 0 },
    moveHistory: [],
    lastMove: null,
  };
}

// Check winner of a flat 3x3 board represented as a 2D array
export function checkWinner(cells: CellValue[][]): Player | null {
  const lines = [
    // rows
    [cells[0][0], cells[0][1], cells[0][2]],
    [cells[1][0], cells[1][1], cells[1][2]],
    [cells[2][0], cells[2][1], cells[2][2]],
    // cols
    [cells[0][0], cells[1][0], cells[2][0]],
    [cells[0][1], cells[1][1], cells[2][1]],
    [cells[0][2], cells[1][2], cells[2][2]],
    // diagonals
    [cells[0][0], cells[1][1], cells[2][2]],
    [cells[0][2], cells[1][1], cells[2][0]],
  ];
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[1] === line[2]) {
      return line[0] as Player;
    }
  }
  return null;
}

function isBoardFull(cells: CellValue[][]): boolean {
  return cells.every((row) => row.every((cell) => cell !== null));
}

export function isSubBoardPlayable(state: GameState, outerRow: number, outerCol: number): boolean {
  return (
    state.subBoardWinners[outerRow][outerCol] === null &&
    !state.subBoardDrawn[outerRow][outerCol]
  );
}

export function isValidMove(state: GameState, coord: BoardCoord): boolean {
  const { outerRow, outerCol, innerRow, innerCol } = coord;
  if (state.gameWinner || state.isDraw) return false;

  // Check if this sub-board is the required one (or free choice)
  if (state.nextBoard !== null) {
    if (outerRow !== state.nextBoard.row || outerCol !== state.nextBoard.col) return false;
  }

  // Sub-board must be playable
  if (!isSubBoardPlayable(state, outerRow, outerCol)) return false;

  // Cell must be empty
  if (state.board[outerRow][outerCol][innerRow][innerCol] !== null) return false;

  return true;
}

export function makeMove(state: GameState, coord: BoardCoord): GameState {
  if (!isValidMove(state, coord)) return state;

  const { outerRow, outerCol, innerRow, innerCol } = coord;

  // Deep clone the state
  const newBoard = state.board.map((or) =>
    or.map((oc) => oc.map((ir) => [...ir]))
  );
  const newSubBoardWinners = state.subBoardWinners.map((row) => [...row]);
  const newSubBoardDrawn = state.subBoardDrawn.map((row) => [...row]);

  // Place the piece
  newBoard[outerRow][outerCol][innerRow][innerCol] = state.currentPlayer;

  // Check if this sub-board is now won
  const subBoardWinner = checkWinner(newBoard[outerRow][outerCol]);
  if (subBoardWinner) {
    newSubBoardWinners[outerRow][outerCol] = subBoardWinner;
  } else if (isBoardFull(newBoard[outerRow][outerCol])) {
    newSubBoardDrawn[outerRow][outerCol] = true;
  }

  // Check if the game is won (use sub-board winners as a 3x3 board)
  const globalWinner = checkWinner(newSubBoardWinners);

  // Check if game is a draw (all sub-boards won or drawn)
  const allDone = newSubBoardWinners.every((row, r) =>
    row.every((w, c) => w !== null || newSubBoardDrawn[r][c])
  );

  // Determine next board: the inner cell position determines the next sub-board
  let nextBoard: { row: number; col: number } | null = { row: innerRow, col: innerCol };
  // If that sub-board is already done, free choice
  if (
    newSubBoardWinners[innerRow][innerCol] !== null ||
    newSubBoardDrawn[innerRow][innerCol]
  ) {
    nextBoard = null;
  }

  const nextPlayer: Player = state.currentPlayer === "X" ? "O" : "X";
  const newScores = { ...state.scores };
  if (globalWinner) {
    newScores[globalWinner] = (newScores[globalWinner] || 0) + 1;
  }

  return {
    board: newBoard,
    subBoardWinners: newSubBoardWinners,
    subBoardDrawn: newSubBoardDrawn,
    currentPlayer: globalWinner || (allDone && !globalWinner) ? state.currentPlayer : nextPlayer,
    nextBoard: globalWinner || allDone ? null : nextBoard,
    gameWinner: globalWinner,
    isDraw: !globalWinner && allDone,
    scores: newScores,
    moveHistory: [...state.moveHistory, coord],
    lastMove: coord,
  };
}

export function getValidMoves(state: GameState): BoardCoord[] {
  const moves: BoardCoord[] = [];
  if (state.gameWinner || state.isDraw) return moves;

  for (let or = 0; or < 3; or++) {
    for (let oc = 0; oc < 3; oc++) {
      if (!isSubBoardPlayable(state, or, oc)) continue;
      if (state.nextBoard && (or !== state.nextBoard.row || oc !== state.nextBoard.col)) continue;
      for (let ir = 0; ir < 3; ir++) {
        for (let ic = 0; ic < 3; ic++) {
          if (state.board[or][oc][ir][ic] === null) {
            moves.push({ outerRow: or, outerCol: oc, innerRow: ir, innerCol: ic });
          }
        }
      }
    }
  }
  return moves;
}

export function resetGame(state: GameState): GameState {
  const fresh = createInitialState();
  return { ...fresh, scores: { ...state.scores } };
}
