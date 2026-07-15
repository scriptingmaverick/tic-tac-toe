import { useState, useEffect, useCallback } from "react";
import { Game, createGame, joinGame, makeMove, resetGame, getGame } from "./api";
import "./styles.css";

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(null);
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");

  const fetchGame = useCallback(async (id: string) => {
    try {
      const updated = await getGame(id);
      setGame(updated);
    } catch {
      setError("Failed to fetch game");
    }
  }, []);

  useEffect(() => {
    if (!game) return;
    const interval = setInterval(() => fetchGame(game.id), 1500);
    return () => clearInterval(interval);
  }, [game?.id, fetchGame]);

  const handleCreate = async () => {
    if (!playerName.trim()) return setError("Enter your name");
    setError("");
    const newGame = await createGame();
    const joined = await joinGame(newGame.id, playerName.trim());
    setGame(joined);
    setPlayerSymbol("X");
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError("Enter your name");
    if (!joinId.trim()) return setError("Enter a game ID");
    setError("");
    try {
      const joined = await joinGame(joinId.trim(), playerName.trim());
      if ("error" in joined) {
        setError((joined as unknown as { error: string }).error);
        return;
      }
      setGame(joined);
      setPlayerSymbol("O");
    } catch {
      setError("Game not found");
    }
  };

  const handleCellClick = async (index: number) => {
    if (!game || !playerSymbol) return;
    if (game.status !== "playing") return;
    if (game.currentPlayer !== playerSymbol) return;
    if (game.board[index] !== null) return;

    try {
      const updated = await makeMove(game.id, index, playerSymbol);
      setGame(updated);
    } catch {
      setError("Invalid move");
    }
  };

  const handleReset = async () => {
    if (!game) return;
    const updated = await resetGame(game.id);
    setGame(updated);
  };

  const getWinCells = (): number[] => {
    if (!game?.winner) return [];
    const combos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const combo of combos) {
      const [a, b, c] = combo;
      if (game.board[a] === game.winner && game.board[b] === game.winner && game.board[c] === game.winner) {
        return combo;
      }
    }
    return [];
  };

  if (!game) {
    return (
      <div className="container">
        <h1>Tic Tac Toe</h1>
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <button onClick={handleCreate}>Create Game</button>
        </div>
        <div className="join-section">
          <input
            placeholder="Game ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button onClick={handleJoin}>Join</button>
        </div>
        {error && <p style={{ color: "#e94560" }}>{error}</p>}
      </div>
    );
  }

  const winCells = getWinCells();

  return (
    <div className="container">
      <h1>Tic Tac Toe</h1>
      <p>
        Game ID: <span className="game-id">{game.id}</span>
      </p>
      <div className="players">
        <span className={game.currentPlayer === "X" ? "active-player" : ""}>
          X: {game.players.X || "Waiting..."}
        </span>
        <span className={game.currentPlayer === "O" ? "active-player" : ""}>
          O: {game.players.O || "Waiting..."}
        </span>
      </div>
      <p className="status">
        {game.status === "waiting" && "Waiting for opponent..."}
        {game.status === "playing" &&
          (game.currentPlayer === playerSymbol
            ? "Your turn!"
            : "Opponent's turn...")}
        {game.status === "won" &&
          (game.winner === playerSymbol ? "You won!" : "You lost!")}
        {game.status === "draw" && "It's a draw!"}
      </p>
      <div className="board">
        {game.board.map((cell, i) => (
          <div
            key={i}
            className={`cell${cell ? " taken" : ""}${winCells.includes(i) ? " win" : ""}`}
            onClick={() => handleCellClick(i)}
          >
            {cell}
          </div>
        ))}
      </div>
      {(game.status === "won" || game.status === "draw") && (
        <button onClick={handleReset}>Play Again</button>
      )}
      {error && <p style={{ color: "#e94560" }}>{error}</p>}
    </div>
  );
}

export default App;
