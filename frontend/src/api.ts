export interface Game {
  id: string;
  board: (string | null)[];
  currentPlayer: "X" | "O";
  status: "waiting" | "playing" | "won" | "draw";
  winner: "X" | "O" | null;
  players: { X: string | null; O: string | null };
}

const API_BASE = "/api";

export async function createGame(): Promise<Game> {
  const res = await fetch(`${API_BASE}/games`, { method: "POST" });
  return res.json();
}

export async function getGame(id: string): Promise<Game> {
  const res = await fetch(`${API_BASE}/games/${id}`);
  return res.json();
}

export async function joinGame(id: string, playerName: string): Promise<Game> {
  const res = await fetch(`${API_BASE}/games/${id}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  return res.json();
}

export async function makeMove(id: string, index: number, player: "X" | "O"): Promise<Game> {
  const res = await fetch(`${API_BASE}/games/${id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, player }),
  });
  return res.json();
}

export async function resetGame(id: string): Promise<Game> {
  const res = await fetch(`${API_BASE}/games/${id}/reset`, { method: "POST" });
  return res.json();
}
