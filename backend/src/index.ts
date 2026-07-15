import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { Game, GameState, Player } from "./types.js";
import { createEmptyBoard, checkWinner, isBoardFull, makeMove } from "./game-logic.js";

const app = new Hono();
app.use("*", cors());

const state: GameState = {
  games: new Map(),
};

function createGame(): Game {
  const id = Math.random().toString(36).substring(2, 9);
  const game: Game = {
    id,
    board: createEmptyBoard(),
    currentPlayer: "X",
    status: "waiting",
    winner: null,
    players: { X: null, O: null },
  };
  state.games.set(id, game);
  return game;
}

// Create a new game
app.post("/api/games", (c) => {
  const game = createGame();
  return c.json(game);
});

// Get game state
app.get("/api/games/:id", (c) => {
  const game = state.games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);
  return c.json(game);
});

// Join a game
app.post("/api/games/:id/join", async (c) => {
  const game = state.games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);
  if (game.players.X && game.players.O) return c.json({ error: "Game is full" }, 400);

  const body = await c.req.json<{ playerName: string }>();
  const playerName = body.playerName || "Player";

  if (!game.players.X) {
    game.players.X = playerName;
  } else {
    game.players.O = playerName;
  }

  if (game.players.X && game.players.O) {
    game.status = "playing";
  }

  return c.json(game);
});

// Make a move
app.post("/api/games/:id/move", async (c) => {
  const game = state.games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);
  if (game.status !== "playing") return c.json({ error: "Game is not active" }, 400);

  const { index, player } = await c.req.json<{ index: number; player: Player }>();

  if (player !== game.currentPlayer) return c.json({ error: "Not your turn" }, 400);

  const newBoard = makeMove(game.board, index, player);
  if (!newBoard) return c.json({ error: "Invalid move" }, 400);

  game.board = newBoard;

  const winner = checkWinner(newBoard);
  if (winner) {
    game.winner = winner;
    game.status = "won";
  } else if (isBoardFull(newBoard)) {
    game.status = "draw";
  } else {
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
  }

  return c.json(game);
});

// Reset game
app.post("/api/games/:id/reset", (c) => {
  const game = state.games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);

  game.board = createEmptyBoard();
  game.currentPlayer = "X";
  game.status = "playing";
  game.winner = null;

  return c.json(game);
});

// List all games
app.get("/api/games", (c) => {
  const games = Array.from(state.games.values());
  return c.json(games);
});

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
