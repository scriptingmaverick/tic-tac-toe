type Cell = "X" | "O" | null;
type Board = Cell[];
type Difficulty = "easy" | "medium" | "hard";

const WINNING_COMBOS: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getEmptyCells(board: Board): number[] {
  return board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
}

function checkWinner(board: Board): Cell {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function minimax(board: Board, isMaximizing: boolean): number {
  const winner = checkWinner(board);
  if (winner === "O") return 1;
  if (winner === "X") return -1;
  if (getEmptyCells(board).length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of getEmptyCells(board)) {
      board[i] = "O";
      best = Math.max(best, minimax(board, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of getEmptyCells(board)) {
      board[i] = "X";
      best = Math.min(best, minimax(board, true));
      board[i] = null;
    }
    return best;
  }
}

function findBestMove(board: Board): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (const i of getEmptyCells(board)) {
    board[i] = "O";
    const score = minimax(board, false);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function findWinningOrBlocking(board: Board, player: Cell): number | null {
  for (const [a, b, c] of WINNING_COMBOS) {
    const cells = [board[a], board[b], board[c]];
    const filled = cells.filter((x) => x === player).length;
    const empty = cells.findIndex((x) => x === null);
    if (filled === 2 && empty !== -1) {
      return [a, b, c][empty];
    }
  }
  return null;
}

function getRandomEmpty(board: Board): number {
  const empty = getEmptyCells(board);
  return empty[Math.floor(Math.random() * empty.length)];
}

export function getAIMove(board: Board, difficulty: Difficulty): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  // Easy: 80% random, 20% smart
  if (difficulty === "easy") {
    if (Math.random() < 0.8) return getRandomEmpty(board);
    const winMove = findWinningOrBlocking(board, "O");
    if (winMove !== null) return winMove;
    const blockMove = findWinningOrBlocking(board, "X");
    if (blockMove !== null) return blockMove;
    return getRandomEmpty(board);
  }

  // Medium: 40% random, 60% smart
  if (difficulty === "medium") {
    if (Math.random() < 0.4) return getRandomEmpty(board);
    const winMove = findWinningOrBlocking(board, "O");
    if (winMove !== null) return winMove;
    const blockMove = findWinningOrBlocking(board, "X");
    if (blockMove !== null) return blockMove;
    // Prefer center
    if (board[4] === null) return 4;
    return getRandomEmpty(board);
  }

  // Hard: always optimal (minimax)
  return findBestMove(board);
}
