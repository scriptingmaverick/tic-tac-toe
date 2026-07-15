export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];
export type GameStatus = "waiting" | "playing" | "won" | "draw";

export interface Game {
  id: string;
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  players: { X: string | null; O: string | null };
}

export interface GameState {
  games: Map<string, Game>;
}
