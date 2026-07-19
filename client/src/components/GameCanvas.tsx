// GameCanvas.tsx — Main game component for Ultimate Tic Tac Toe
// Design: Dark Neon Tactical Arcade — midnight navy, HUD panels, electric accents.
// Color roles: cyan=#38bdf8 (X), coral=#f87171 (O), gold=#fbbf24 (active/decisive), white=structure.
// Typography: Space Mono / Courier New for titles, compact sans for HUD.

import { useEffect, useRef, useState, useCallback } from "react";
import {
  GameState,
  createInitialState,
  makeMove,
  isValidMove,
  resetGame,
  Player,
} from "@/game/state";
import { Renderer } from "@/game/renderer";
import { getAIMove } from "@/game/ai";
import { Language, t } from "@/i18n/translations";
import {
  connectSocket,
  disconnectSocket,
  createRoom,
  joinRoom,
  sendMove,
  requestRematch,
  leaveRoom,
  clearReconnectInfo,
  saveReconnectInfo,
  onOpponentJoined,
  onGameStart,
  onMoveMade,
  onOpponentLeft,
  onOpponentReconnecting,
  onOpponentReconnected,
  onRematchStart,
  offOpponentJoined,
  offGameStart,
  offMoveMade,
  offOpponentLeft,
  offOpponentReconnecting,
  offOpponentReconnected,
  offRematchStart,
  getRoomShareLink,
  getRoomCodeFromUrl,
  type SerializedGameState,
} from "@/game/online";

type GameMode = "pvp" | "pvc" | "online";
type AIDifficulty = "easy" | "medium" | "hard";
type OnlineMode = "menu" | "create" | "join" | "waiting" | "playing";


export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const startedRef = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [gameMode, setGameMode] = useState<GameMode>("pvp");
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("medium");
  const [showMenu, setShowMenu] = useState(true);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [onlineMode, setOnlineMode] = useState<OnlineMode>("menu");
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomCodeInput, setRoomCodeInput] = useState<string>("");
  const [playerPiece, setPlayerPiece] = useState<Player>("X");
  const [reconnectStatus, setReconnectStatus] = useState<string | null>(null);

  // Reconstruct GameState from serialized data received from server
  const deserializeState = (data: SerializedGameState): GameState => ({
    board: data.board,
    subBoardWinners: data.subBoardWinners,
    subBoardDrawn: data.subBoardDrawn,
    currentPlayer: data.currentPlayer,
    nextBoard: data.nextBoard,
    gameWinner: data.gameWinner,
    isDraw: data.isDraw,
    scores: data.scores,
    moveHistory: data.moveHistory,
    lastMove: data.lastMove,
    gameMode: "online",
    aiDifficulty: "medium",
  });

  const syncState = useCallback((newState: GameState) => {
    stateRef.current = newState;
    setGameState(newState);
  }, []);

  // Auto-join room when URL has ?room=CODE — skip the menu entirely
  useEffect(() => {
    const urlRoomCode = getRoomCodeFromUrl();
    if (!urlRoomCode) return;

    console.log("[online] auto-joining room from URL:", urlRoomCode);
    setGameMode("online");
    setShowMenu(false);
    connectSocket();

    joinRoom(urlRoomCode, {
      onSuccess: (data) => {
        console.log("[online] auto-join success:", data.piece);
        setRoomCode(urlRoomCode);
        setPlayerPiece(data.piece);
        setOnlineMode("playing");
        setShowMenu(false);
        setWinMessage(null);
        saveReconnectInfo(urlRoomCode, data.piece);
        syncState(deserializeState(data.gameState));
      },
      onError: (err) => {
        console.error("[online] auto-join error:", err.message);
        setShowMenu(true);
        setOnlineMode("menu");
        setGameMode("online");
        setWinMessage(err.message);
      },
    });
  }, []); // Run once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;

    let running = true;
    const loop = () => {
      if (!running) return;
      const now = performance.now();
      renderer.updateAnimations(now);
      renderer.render(stateRef.current, now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Debounced resize to prevent mobile address bar jitter
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderer.resize(), 150);
    };
    window.addEventListener("resize", onResize);
    // Also handle orientation change on mobile
    window.addEventListener("orientationchange", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      clearTimeout(resizeTimer);
      startedRef.current = false;
    };
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const state = stateRef.current;
      if (state.gameWinner || state.isDraw) return;
      if (gameMode === "pvc" && state.currentPlayer === "O") return;
      if (gameMode === "online" && state.currentPlayer !== playerPiece) return;
      if (isAIThinking) return;

      let clientX: number, clientY: number;
      if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      }

      const coord = renderer.hitTest(state, clientX, clientY);
      if (!coord) return;
      if (!isValidMove(state, coord)) return;

      renderer.animatePiece(coord.outerRow, coord.outerCol, coord.innerRow, coord.innerCol, state.currentPlayer);
      const newState = makeMove(state, coord);

      // In online mode: apply locally + send to server
      if (gameMode === "online" && roomCode) {
        console.log("[online] sending move:", coord, "as", state.currentPlayer);
        syncState(newState);
        sendMove(roomCode, coord);
        // Win/draw messages are set by the server's move_made broadcast
        return;
      }

      syncState(newState);

      if (newState.gameWinner) {
        setWinMessage(
          newState.gameWinner === "X"
            ? gameMode === "pvc" ? t("game.youWin", language) : t("game.playerXWins", language)
            : gameMode === "pvc" ? t("game.aiWins", language) : t("game.playerOWins", language)
        );
      } else if (newState.isDraw) {
        setWinMessage(t("game.draw", language));
      }
    },
    [gameMode, isAIThinking, syncState, language, roomCode, playerPiece]
  );

  useEffect(() => {
    if (gameMode !== "pvc") return;
    if (gameState.gameWinner || gameState.isDraw) return;
    if (gameState.currentPlayer !== "O") return;

    setIsAIThinking(true);
    aiTimeoutRef.current = setTimeout(() => {
      const move = getAIMove(stateRef.current, aiDifficulty);
      if (move) {
        const renderer = rendererRef.current;
        renderer?.animatePiece(move.outerRow, move.outerCol, move.innerRow, move.innerCol, "O");
        const newState = makeMove(stateRef.current, move);
        syncState(newState);
        if (newState.gameWinner) {
          setWinMessage(newState.gameWinner === "O" ? t("game.aiWins", language) : t("game.youWin", language));
        } else if (newState.isDraw) {
          setWinMessage(t("game.draw", language));
        }
      }
      setIsAIThinking(false);
    }, 700);

    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, [gameState.currentPlayer, gameState.gameWinner, gameState.isDraw, gameMode, aiDifficulty, language, syncState]);

  const handleNewGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAIThinking(false);
    setWinMessage(null);
    syncState(resetGame(stateRef.current));
  }, [syncState]);

  const handleStartGame = useCallback((mode: GameMode) => {
    if (mode === "pvc") {
      setShowDifficultySelect(true);
      return;
    }
    if (mode === "online") {
      setGameMode("online");
      setOnlineMode("menu");
      // Connect socket proactively
      connectSocket();
      const urlRoomCode = getRoomCodeFromUrl();
      if (urlRoomCode) {
        joinRoom(urlRoomCode, {
          onSuccess: (data) => {
            setRoomCode(urlRoomCode);
            setPlayerPiece(data.piece);
            setOnlineMode("playing");
            setShowMenu(false);
            setWinMessage(null);
            syncState(deserializeState(data.gameState));
          },
          onError: (err) => {
            setWinMessage(err.message);
          },
        });
      }
      return;
    }
    // pvp mode - start game immediately
    setGameMode(mode);
    setShowMenu(false);
    setWinMessage(null);
    syncState(createInitialState({ gameMode: mode, aiDifficulty }));
  }, [syncState, aiDifficulty, language]);

  const handleCreateRoom = useCallback(() => {
    connectSocket();
    console.log("[online] createRoom: sending create_room");
    createRoom((data) => {
      console.log("[online] room_created:", data.roomCode);
      setRoomCode(data.roomCode);
      setPlayerPiece("X");
      setOnlineMode("waiting");
      saveReconnectInfo(data.roomCode, "X");
    });
  }, []);

  const handleJoinRoom = useCallback(() => {
    const code = roomCodeInput.toUpperCase();
    if (code.length !== 6) {
      setWinMessage(t("online.invalidCode", language));
      return;
    }
    connectSocket();
    console.log("[online] joinRoom: sending join_room for", code);
    joinRoom(code, {
      onSuccess: (data) => {
        console.log("[online] joinRoom success:", data);
        setRoomCode(code);
        setPlayerPiece(data.piece);
        setOnlineMode("playing");
        setShowMenu(false);
        setWinMessage(null);
        saveReconnectInfo(code, data.piece);
        syncState(deserializeState(data.gameState));
      },
      onError: (err) => {
        console.error("[online] joinRoom error:", err.message);
        setWinMessage(err.message);
      },
    });
  }, [roomCodeInput, language]);

  const handleCopyLink = useCallback(() => {
    const link = getRoomShareLink(roomCode);
    navigator.clipboard.writeText(link).then(() => {
      setWinMessage(t("online.copyLink", language));
      setTimeout(() => setWinMessage(null), 2000);
    });
  }, [roomCode, language]);

  const handleSelectDifficulty = useCallback((difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    setGameMode("pvc");
    setShowDifficultySelect(false);
    setShowMenu(false);
    setWinMessage(null);
    syncState(createInitialState({ gameMode: "pvc", aiDifficulty: difficulty }));
  }, [syncState]);

  const handleBackToMenu = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAIThinking(false);
    setWinMessage(null);
    setShowDifficultySelect(false);
    setShowMenu(true);
    setGameMode("pvp");
    setOnlineMode("menu");
    setRoomCode("");
    setRoomCodeInput("");
    // Disconnect from online server and clear reconnect info
    clearReconnectInfo();
    disconnectSocket();
    syncState(createInitialState());
  }, [syncState]);

  // ── Socket.IO event listeners for online mode ──────────────────────

  // Listen for opponent joining (host side)
  useEffect(() => {
    if (gameMode !== "online" || onlineMode !== "waiting") return;

    const onJoined = () => {
      setOnlineMode("playing");
      setShowMenu(false);
      setWinMessage(null);
    };

    onOpponentJoined(onJoined);
    return () => { offOpponentJoined(onJoined); };
  }, [gameMode, onlineMode]);

  // Listen for game_start from server (after both players are in)
  useEffect(() => {
    if (gameMode !== "online") return;

    const onStart = (data: { piece: "X" | "O"; gameState: SerializedGameState }) => {
      console.log("[online] game_start received:", data.piece, "moves:", data.gameState.moveHistory.length);
      setPlayerPiece(data.piece);
      setOnlineMode("playing");
      setShowMenu(false);
      setWinMessage(null);
      syncState(deserializeState(data.gameState));
    };

    onGameStart(onStart);
    return () => { offGameStart(onStart); };
  }, [gameMode, syncState]);

  // Listen for opponent's moves
  useEffect(() => {
    if (gameMode !== "online" || onlineMode !== "playing") return;

    const onMove = (data: { move: { outerRow: number; outerCol: number; innerRow: number; innerCol: number }; gameState: SerializedGameState }) => {
      const local = stateRef.current;
      const remoteState = deserializeState(data.gameState);

      console.log("[online] move_made received:", {
        myPiece: playerPiece,
        localMoves: local.moveHistory.length,
        remoteMoves: remoteState.moveHistory.length,
        remoteCurrentPlayer: remoteState.currentPlayer,
        remoteMove: data.move,
      });

      // Only apply if the move is new (not our own move reflected back)
      if (remoteState.moveHistory.length > local.moveHistory.length) {
        console.log("[online] applying opponent move");
        const renderer = rendererRef.current;
        const lastMove = remoteState.lastMove;
        if (lastMove && renderer) {
          const opponentPiece: Player = playerPiece === "X" ? "O" : "X";
          renderer.animatePiece(lastMove.outerRow, lastMove.outerCol, lastMove.innerRow, lastMove.innerCol, opponentPiece);
        }

        stateRef.current = remoteState;
        setGameState(remoteState);

        if (remoteState.gameWinner) {
          setWinMessage(
            remoteState.gameWinner === "X"
              ? t("game.playerXWins", language)
              : t("game.playerOWins", language)
          );
        } else if (remoteState.isDraw) {
          setWinMessage(t("game.draw", language));
        }
      } else {
        console.log("[online] skipping own move echo");
      }
    };

    onMoveMade(onMove);
    return () => { offMoveMade(onMove); };
  }, [gameMode, onlineMode, language, playerPiece]);

  // Listen for opponent disconnect and reconnection
  useEffect(() => {
    if (gameMode !== "online") return;

    const onLeft = () => {
      clearReconnectInfo();
      setReconnectStatus(null);
      setWinMessage("Opponent left");
      setOnlineMode("menu");
    };
    const onReconnecting = () => {
      setReconnectStatus("Opponent reconnecting...");
    };
    const onReconnected = () => {
      setReconnectStatus(null);
    };

    onOpponentLeft(onLeft);
    onOpponentReconnecting(onReconnecting);
    onOpponentReconnected(onReconnected);
    return () => {
      offOpponentLeft(onLeft);
      offOpponentReconnecting(onReconnecting);
      offOpponentReconnected(onReconnected);
    };
  }, [gameMode]);

  // Listen for rematch
  useEffect(() => {
    if (gameMode !== "online") return;

    const onRematch = (data: { gameState: SerializedGameState }) => {
      setWinMessage(null);
      syncState(deserializeState(data.gameState));
    };

    onRematchStart(onRematch);
    return () => { offRematchStart(onRematch); };
  }, [gameMode, syncState]);

  const isXTurn = gameState.currentPlayer === "X";
  const gameActive = !gameState.gameWinner && !gameState.isDraw;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#0f172a" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none", cursor: showMenu ? "default" : "crosshair" }}
        onClick={showMenu ? undefined : handleCanvasClick}
        onTouchStart={showMenu ? undefined : handleCanvasClick}
      />

      {/* ── IN-GAME HUD ── */}
      {!showMenu && (
        <div className="absolute inset-0 pointer-events-none" style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}>

          {/* Top HUD bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 md:px-6"
            style={{ height: 68, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.85)", backdropFilter: "blur(12px)" }}
          >
            {/* X Player */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded pointer-events-auto"
              style={{
                border: `1px solid ${isXTurn && gameActive ? "#38bdf8" : "rgba(56,189,248,0.2)"}`,
                background: isXTurn && gameActive ? "rgba(56,189,248,0.08)" : "transparent",
                boxShadow: isXTurn && gameActive ? "0 0 16px rgba(56,189,248,0.25), inset 0 0 8px rgba(56,189,248,0.05)" : "none",
                transition: "all 0.25s ease",
                minWidth: 110,
              }}
            >
              <span style={{ color: "#38bdf8", fontSize: 20, textShadow: "0 0 10px #38bdf8", lineHeight: 1 }}>✕</span>
              <div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {gameMode === "pvc" ? t("game.you", language) : t("game.playerX", language)}
                </div>
                <div style={{ color: "#38bdf8", fontSize: 22, fontWeight: 700, lineHeight: 1, textShadow: "0 0 10px #38bdf8" }}>
                  {gameState.scores.X}
                </div>
              </div>
            </div>

            {/* Center status */}
            <div className="flex flex-col items-center" style={{ minWidth: 140 }}>
              {reconnectStatus ? (
                <div style={{
                  color: "#fbbf24",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textShadow: "0 0 10px #fbbf24",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  {reconnectStatus}
                </div>
              ) : gameActive ? (
                <>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 2 }}>
                    {t("game.turn", language)}
                  </div>
                  <div style={{
                    color: isXTurn ? "#38bdf8" : "#f87171",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textShadow: `0 0 10px ${isXTurn ? "#38bdf8" : "#f87171"}`,
                  }}>
                    {isAIThinking ? (
                      <span className="flex items-center gap-1">
                        {t("game.ai", language)}
                        {[0,1,2].map(i => (
                          <span key={i} style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "#f87171", animation: `blink 0.9s ease-in-out ${i*0.2}s infinite` }} />
                        ))}
                      </span>
                    ) : (
                      gameMode === "pvc"
                        ? (isXTurn ? t("game.yourMove", language) : t("game.aiMove", language))
                        : t("game.playerTurn", language).replace("{player}", gameState.currentPlayer)
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textShadow: "0 0 10px #fbbf24" }}>
                  {t("game.gameOver", language)}
                </div>
              )}
            </div>

            {/* O Player */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded pointer-events-auto"
              style={{
                border: `1px solid ${!isXTurn && gameActive ? "#f87171" : "rgba(248,113,113,0.2)"}`,
                background: !isXTurn && gameActive ? "rgba(248,113,113,0.08)" : "transparent",
                boxShadow: !isXTurn && gameActive ? "0 0 16px rgba(248,113,113,0.25), inset 0 0 8px rgba(248,113,113,0.05)" : "none",
                transition: "all 0.25s ease",
                minWidth: 110,
                flexDirection: "row-reverse",
              }}
            >
              <span style={{ color: "#f87171", fontSize: 20, textShadow: "0 0 10px #f87171", lineHeight: 1 }}>○</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {gameMode === "pvc" ? t("game.ai", language) : t("game.playerO", language)}
                </div>
                <div style={{ color: "#f87171", fontSize: 22, fontWeight: 700, lineHeight: 1, textShadow: "0 0 10px #f87171" }}>
                  {gameState.scores.O}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 md:px-6 pointer-events-auto"
            style={{ height: 52, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)" }}
          >
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: "0.1em" }} className="hidden md:block">
              {t("hud.goldBorder", language)}
            </div>
            <div className="flex gap-2 mx-auto md:mx-0">
              <button
                onClick={handleNewGame}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "transparent",
                  border: "1px solid rgba(251,191,36,0.4)",
                  color: "#fbbf24",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  padding: "6px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                  textShadow: "0 0 8px rgba(251,191,36,0.5)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(251,191,36,0.1)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}
              >
                {t("game.newGame", language)}
              </button>
              <button
                onClick={handleBackToMenu}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  padding: "6px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
              >
                {t("game.menu", language)}
              </button>
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: "0.1em" }} className="hidden md:block">
              {t("hud.sendOpponent", language)}
            </div>
          </div>
        </div>
      )}

      {/* ── WIN / DRAW OVERLAY ── */}
      {winMessage && !showMenu && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(6px)" }}
          onClick={handleNewGame}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(251,191,36,0.4)",
              boxShadow: "0 0 60px rgba(251,191,36,0.15), 0 0 120px rgba(0,0,0,0.6)",
              padding: "40px 56px",
              borderRadius: 8,
              textAlign: "center",
              maxWidth: 380,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.3em", marginBottom: 12 }}>
              {t("game.gameOver", language)}
            </div>
            <div style={{
              color: winMessage && winMessage !== t("game.draw", language) ? "#fbbf24" : "#94a3b8",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textShadow: winMessage && winMessage !== t("game.draw", language) ? "0 0 24px rgba(251,191,36,0.6)" : "none",
              marginBottom: 16,
            }}>
              {winMessage}
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 28 }}>
              <span style={{ color: "#38bdf8" }}>X</span>
              <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>—</span>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>{gameState.scores.X}</span>
              <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 16px" }}>·</span>
              <span style={{ color: "#f87171" }}>O</span>
              <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>—</span>
              <span style={{ color: "#f87171", fontWeight: 700 }}>{gameState.scores.O}</span>
            </div>
            <button
              style={{
                fontFamily: "'Space Mono', monospace",
                background: "rgba(251,191,36,0.12)",
                border: "1px solid #fbbf24",
                color: "#fbbf24",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "10px 32px",
                borderRadius: 4,
                cursor: "pointer",
                textShadow: "0 0 8px rgba(251,191,36,0.5)",
              }}
            >
              {t("game.playAgain", language)}
            </button>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 12, letterSpacing: "0.1em" }}>
              {t("game.clickToContinue", language)}
            </div>
          </div>
        </div>
      )}

      {/* ── DIFFICULTY SELECT ── */}
      {showDifficultySelect && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
              padding: "40px 40px 36px",
              borderRadius: 8,
              maxWidth: 400,
              width: "calc(100% - 32px)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 700, letterSpacing: "0.25em", textShadow: "0 0 12px rgba(251,191,36,0.5)", marginBottom: 12 }}>
                {t("difficulty.title", language)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.1em" }}>
                {t("difficulty.chooseDesc", language)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(["easy", "medium", "hard"] as AIDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => handleSelectDifficulty(diff)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    padding: "14px 20px",
                    borderRadius: 4,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(255,255,255,0.06)";
                    el.style.borderColor = "rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(255,255,255,0.03)";
                    el.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  {diff === "easy" && `🟢 ${t("difficulty.easy", language)}`}
                  {diff === "medium" && `🟡 ${t("difficulty.medium", language)}`}
                  {diff === "hard" && `🔴 ${t("difficulty.hard", language)}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDifficultySelect(false)}
              style={{
                fontFamily: "'Space Mono', monospace",
                width: "100%",
                marginTop: 16,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                padding: "10px 20px",
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.color = "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.color = "rgba(255,255,255,0.3)";
              }}
            >
              {t("online.back", language)}
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN MENU ── */}
      {showMenu && !showDifficultySelect && gameMode !== "online" && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
              padding: "40px 40px 36px",
              borderRadius: 8,
              maxWidth: 400,
              width: "calc(100% - 32px)",
            }}
          >
            {/* Wordmark */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 10 }}>
                <span style={{ color: "#38bdf8", fontSize: 44, fontWeight: 700, textShadow: "0 0 20px #38bdf8, 0 0 40px rgba(56,189,248,0.3)", lineHeight: 1 }}>✕</span>
                <span style={{ color: "#f87171", fontSize: 44, fontWeight: 700, textShadow: "0 0 20px #f87171, 0 0 40px rgba(248,113,113,0.3)", lineHeight: 1 }}>○</span>
              </div>
              <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", lineHeight: 1.1 }}>
                ULTIMATE
              </div>
              <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 700, letterSpacing: "0.25em", textShadow: "0 0 12px rgba(251,191,36,0.5)", marginTop: 2 }}>
                TIC TAC TOE
              </div>
            </div>

            {/* Tactical divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: "0.2em" }}>{t("menu.mission", language)}</div>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Rules */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4,
                padding: "14px 16px",
                marginBottom: 24,
                fontSize: 11,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>{t("menu.missionText", language)}</span>
            </div>

            {/* Mode selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => handleStartGame("pvp")}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#38bdf8", textShadow: "0 0 8px #38bdf8" }}>✕</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>VS</span>
                  <span style={{ color: "#f87171", textShadow: "0 0 8px #f87171" }}>○</span>
                </span>
                <span>{t("menu.2players", language)}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>›</span>
              </button>

              <button
                onClick={() => handleStartGame("pvc")}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(56,189,248,0.04)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.08)";
                  el.style.borderColor = "rgba(56,189,248,0.4)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.04)";
                  el.style.borderColor = "rgba(56,189,248,0.2)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#38bdf8", textShadow: "0 0 8px #38bdf8" }}>✕</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>VS</span>
                  <span style={{ fontSize: 16 }}>🤖</span>
                </span>
                <span>{t("menu.vsAI", language)}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>›</span>
              </button>

              <button
                onClick={() => handleStartGame("online")}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(248,113,113,0.04)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.08)";
                  el.style.borderColor = "rgba(248,113,113,0.4)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.04)";
                  el.style.borderColor = "rgba(248,113,113,0.2)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#38bdf8", textShadow: "0 0 8px #38bdf8" }}>✕</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>VS</span>
                  <span style={{ color: "#f87171", textShadow: "0 0 8px #f87171" }}>○</span>
                </span>
                <span>{t("menu.online", language)}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>›</span>
              </button>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.15)", fontSize: 9, letterSpacing: "0.2em" }}>
              {t("brand.footer", language)}
            </div>
          </div>
        </div>
      )}

      
      {/* ── ONLINE MODE ── */}
      {showMenu && gameMode === "online" && onlineMode === "menu" && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(248,113,113,0.2)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7)",
              padding: "40px 40px 36px",
              borderRadius: 8,
              maxWidth: 400,
              width: "calc(100% - 32px)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ color: "#f87171", fontSize: 16, fontWeight: 700, letterSpacing: "0.25em", textShadow: "0 0 12px rgba(248,113,113,0.5)", marginBottom: 12 }}>
                {t("online.title", language)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleCreateRoom}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.12)";
                  el.style.borderColor = "rgba(248,113,113,0.5)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.08)";
                  el.style.borderColor = "rgba(248,113,113,0.3)";
                }}
              >
                {t("online.createRoom", language)}
              </button>
              <button
                onClick={() => setOnlineMode("join")}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.3)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.12)";
                  el.style.borderColor = "rgba(56,189,248,0.5)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.08)";
                  el.style.borderColor = "rgba(56,189,248,0.3)";
                }}
              >
                {t("online.joinRoom", language)}
              </button>
              <button
                onClick={handleBackToMenu}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                }}
              >
                {t("online.back", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN ROOM ── */}
      {showMenu && gameMode === "online" && onlineMode === "join" && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(56,189,248,0.2)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7)",
              padding: "40px 40px 36px",
              borderRadius: 8,
              maxWidth: 400,
              width: "calc(100% - 32px)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ color: "#38bdf8", fontSize: 16, fontWeight: 700, letterSpacing: "0.25em", textShadow: "0 0 12px rgba(56,189,248,0.5)", marginBottom: 12 }}>
                {t("online.joinRoom", language)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.1em" }}>
                {t("online.enterCode", language)}
              </div>
            </div>

            <input
              type="text"
              maxLength={6}
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="000000"
              style={{
                fontFamily: "'Space Mono', monospace",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(56,189,248,0.3)",
                color: "#38bdf8",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "12px 16px",
                borderRadius: 4,
                textAlign: "center",
                marginBottom: 20,
                width: "100%",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleJoinRoom}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.4)",
                  color: "#38bdf8",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.16)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(56,189,248,0.12)";
                }}
              >
                {t("online.join", language)}
              </button>
              <button
                onClick={() => setOnlineMode("menu")}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                {t("online.back", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WAITING FOR OPPONENT ── */}
      {showMenu && gameMode === "online" && onlineMode === "waiting" && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(248,113,113,0.2)",
              boxShadow: "0 0 80px rgba(0,0,0,0.7)",
              padding: "40px 40px 36px",
              borderRadius: 8,
              maxWidth: 400,
              width: "calc(100% - 32px)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#f87171", fontSize: 16, fontWeight: 700, letterSpacing: "0.25em", textShadow: "0 0 12px rgba(248,113,113,0.5)", marginBottom: 24 }}>
              {t("online.roomCreated", language)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 32, fontWeight: 700, letterSpacing: "0.3em", fontFamily: "'Space Mono', monospace", marginBottom: 24 }}>
              {roomCode}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 24 }}>
              {t("online.shareCodeDesc", language)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleCopyLink}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.4)",
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.16)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(248,113,113,0.12)";
                }}
              >
                {t("online.copyLink", language)}
              </button>
              <button
                onClick={handleBackToMenu}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "14px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                }}
              >
                {t("online.cancel", language)}
              </button>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.1em", marginTop: 16 }}>
              {t("online.waitingForOpponent", language)}
            </div>
          </div>
        </div>
      )}

      {/* ── LANGUAGE SELECTOR ── */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: 8,
          zIndex: 1000,
        }}
      >
        {(["en", "zh", "fr"] as Language[]).map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              fontFamily: "'Space Mono', monospace",
              background: language === lang ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${language === lang ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: language === lang ? "#38bdf8" : "rgba(255,255,255,0.5)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              if (language !== lang) {
                el.style.background = "rgba(255,255,255,0.08)";
                el.style.borderColor = "rgba(255,255,255,0.2)";
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              if (language !== lang) {
                el.style.background = "rgba(255,255,255,0.05)";
                el.style.borderColor = "rgba(255,255,255,0.1)";
              }
            }}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
