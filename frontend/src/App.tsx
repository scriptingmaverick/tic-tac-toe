import { useState, useEffect, useCallback, useRef } from "react";
import { Game, createGame, joinGame, makeMove, resetGame, getGame } from "./api";
import { getAIMove } from "./ai";
import "./styles.css";

type Difficulty = "easy" | "medium" | "hard";

function Confetti() {
  const colors = ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.3)", "rgba(200,200,220,0.6)", "rgba(180,180,210,0.5)", "rgba(220,220,240,0.4)"];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(null);
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");

  const [aiMode, setAiMode] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [popCells, setPopCells] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const prevBoardRef = useRef<(string | null)[]>([]);

  useEffect(() => {
    if (!game) return;
    const prev = prevBoardRef.current;
    const newPops = new Set<number>();
    game.board.forEach((cell, i) => {
      if (cell && cell !== prev[i]) newPops.add(i);
    });
    if (newPops.size > 0) {
      setPopCells((prev) => new Set([...prev, ...newPops]));
      setTimeout(() => {
        setPopCells((curr) => {
          const next = new Set(curr);
          newPops.forEach((i) => next.delete(i));
          return next;
        });
      }, 350);
    }
    prevBoardRef.current = [...game.board];
  }, [game?.board]);

  useEffect(() => {
    if (game?.status === "won" && game.winner === playerSymbol) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [game?.status, game?.winner, playerSymbol]);

  const fetchGame = useCallback(async (id: string) => {
    try {
      const updated = await getGame(id);
      setGame(updated);
    } catch {
      setError("Failed to fetch game");
    }
  }, []);

  useEffect(() => {
    if (!game || aiMode) return;
    const interval = setInterval(() => fetchGame(game.id), 1500);
    return () => clearInterval(interval);
  }, [game?.id, fetchGame, aiMode]);

  const startAIGame = () => {
    if (!playerName.trim()) return setError("Enter your name");
    setError("");
    const localGame: Game = {
      id: "local",
      board: [null, null, null, null, null, null, null, null, null],
      currentPlayer: "X",
      status: "playing",
      winner: null,
      players: { X: playerName.trim(), O: "Computer" },
    };
    setGame(localGame);
    setPlayerSymbol("X");
    setAiMode(true);
  };

  const handleCreate = async () => {
    if (!playerName.trim()) return setError("Enter your name");
    setError("");
    const newGame = await createGame();
    const joined = await joinGame(newGame.id, playerName.trim());
    setGame(joined);
    setPlayerSymbol("X");
    setAiMode(false);
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
      setAiMode(false);
    } catch {
      setError("Game not found");
    }
  };

  const checkWinnerLocal = (board: (string | null)[]): "X" | "O" | null => {
    const combos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of combos) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as "X" | "O";
      }
    }
    return null;
  };

  const handleCellClick = async (index: number) => {
    if (!game || !playerSymbol) return;
    if (game.status !== "playing") return;
    if (game.currentPlayer !== playerSymbol) return;
    if (game.board[index] !== null) return;

    if (aiMode) {
      // Player move
      const newBoard = [...game.board];
      newBoard[index] = playerSymbol;
      const winner = checkWinnerLocal(newBoard);
      const isDraw = newBoard.every((c) => c !== null);

      const updatedGame: Game = {
        ...game,
        board: newBoard,
        winner,
        status: winner ? "won" : isDraw ? "draw" : "playing",
        currentPlayer: winner || isDraw ? game.currentPlayer : game.currentPlayer === "X" ? "O" : "X",
      };
      setGame(updatedGame);

      // AI move after a short delay
      if (!winner && !isDraw) {
        setTimeout(() => {
          const aiMoveIdx = getAIMove(updatedGame.board as ("X" | "O" | null)[], difficulty);
          if (aiMoveIdx === -1) return;
          const aiBoard = [...updatedGame.board];
          aiBoard[aiMoveIdx] = "O";
          const aiWinner = checkWinnerLocal(aiBoard);
          const aiDraw = aiBoard.every((c) => c !== null);
          setGame((prev) => {
            if (!prev || prev.id !== "local") return prev;
            return {
              ...prev,
              board: aiBoard,
              winner: aiWinner,
              status: aiWinner ? "won" : aiDraw ? "draw" : "playing",
              currentPlayer: aiWinner || aiDraw ? prev.currentPlayer : "X",
            };
          });
        }, 400);
      }
      return;
    }

    // Online move
    try {
      const updated = await makeMove(game.id, index, playerSymbol);
      setGame(updated);
    } catch {
      setError("Invalid move");
    }
  };

  const handleReset = async () => {
    if (!game) return;
    if (aiMode) {
      setGame({
        ...game,
        board: [null, null, null, null, null, null, null, null, null],
        currentPlayer: "X",
        status: "playing",
        winner: null,
      });
      return;
    }
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

        <div className="divider">Single Player</div>
        <div className="ai-section">
          <div className="difficulty-row">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`diff-btn${difficulty === d ? " active" : ""}`}
                onClick={() => setDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={startAIGame}>Play vs Computer</button>
        </div>

        <div className="divider">Multiplayer</div>
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

  const statusText = (() => {
    if (game.status === "waiting") return "Waiting for opponent...";
    if (game.status === "won") {
      if (aiMode) return game.winner === playerSymbol ? "You won!" : "Computer wins!";
      return game.winner === playerSymbol ? "You won!" : "You lost!";
    }
    if (game.status === "draw") return "It's a draw!";
    if (game.currentPlayer === playerSymbol) return "Your turn!";
    return aiMode ? "Computer is thinking..." : "Opponent's turn...";
  })();

  return (
    <div className="container">
      {showConfetti && <Confetti />}
      <h1>Tic Tac Toe</h1>
      {!aiMode && (
        <p>
          Game ID: <span className="game-id">{game.id}</span>
        </p>
      )}
      {aiMode && (
        <p className="ai-badge">
          vs Computer ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
        </p>
      )}
      <div className="players">
        <span className={game.currentPlayer === "X" ? "active-player" : ""}>
          X: {game.players.X || "Waiting..."}
        </span>
        <span className={game.currentPlayer === "O" ? "active-player" : ""}>
          O: {game.players.O || "Waiting..."}
        </span>
      </div>
      <p className="status">{statusText}</p>
      <div className="board">
        {game.board.map((cell, i) => (
          <div
            key={i}
            className={`cell${cell ? " taken" : ""}${winCells.includes(i) ? " win" : ""}${popCells.has(i) ? " pop" : ""}`}
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
