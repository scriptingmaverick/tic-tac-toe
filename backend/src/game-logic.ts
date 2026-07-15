import { Board, Player, Cell } from "./types.js";

const WINNING_COMBOS: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

export function checkWinner(board: Board): Player | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function makeMove(board: Board, index: number, player: Player): Board | null {
  if (index < 0 || index > 8 || board[index] !== null) {
    return null;
  }
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}
