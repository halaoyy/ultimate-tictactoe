// online.ts — Socket.IO client for real-time multiplayer
// Replaces the localStorage-based room system with true WebSocket networking.

import { io, Socket } from "socket.io-client";
import type { BoardCoord, GameState } from "./state";

// ── Types ──────────────────────────────────────────────────────────────

export interface SerializedGameState {
  board: GameState["board"];
  subBoardWinners: GameState["subBoardWinners"];
  subBoardDrawn: GameState["subBoardDrawn"];
  currentPlayer: GameState["currentPlayer"];
  nextBoard: GameState["nextBoard"];
  gameWinner: GameState["gameWinner"];
  isDraw: GameState["isDraw"];
  scores: GameState["scores"];
  moveHistory: GameState["moveHistory"];
  lastMove: GameState["lastMove"];
}

type Callback<T = void> = T extends void ? () => void : (data: T) => void;

// ── Singleton socket ───────────────────────────────────────────────────

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  // In dev mode, Vite runs on :3000 and the Vite plugin attaches Socket.IO there.
  // In production, the Express server serves everything on the same port.
  const url = window.location.origin;

  socket = io(url, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("[online] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[online] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[online] connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// ── Room management ────────────────────────────────────────────────────

export function createRoom(callback: Callback<{ roomCode: string }>) {
  const s = connectSocket();
  s.emit("create_room");
  s.once("room_created", callback);
}

export function joinRoom(roomCode: string, callbacks: {
  onSuccess: Callback<{ piece: "X" | "O"; gameState: SerializedGameState }>;
  onError: Callback<{ message: string }>;
}) {
  const s = connectSocket();
  s.emit("join_room", { roomCode: roomCode.toUpperCase() });
  s.once("game_start", callbacks.onSuccess);
  s.once("error", callbacks.onError);
}

export function sendMove(roomCode: string, move: BoardCoord) {
  socket?.emit("make_move", { roomCode, move });
}

export function requestRematch(roomCode: string) {
  socket?.emit("request_rematch", { roomCode });
}

export function leaveRoom(roomCode: string) {
  socket?.emit("leave_room", { roomCode });
}

// ── Event listeners ────────────────────────────────────────────────────

export function onOpponentJoined(cb: Callback<{ piece: string }>) {
  connectSocket().on("opponent_joined", cb);
}

export function offOpponentJoined(cb: Callback<{ piece: string }>) {
  socket?.off("opponent_joined", cb);
}

export function onGameStart(cb: Callback<{ piece: "X" | "O"; gameState: SerializedGameState }>) {
  connectSocket().on("game_start", cb);
}

export function offGameStart(cb: Callback<{ piece: "X" | "O"; gameState: SerializedGameState }>) {
  socket?.off("game_start", cb);
}

export function onMoveMade(
  cb: Callback<{ move: BoardCoord; gameState: SerializedGameState }>
) {
  connectSocket().on("move_made", cb);
}

export function offMoveMade(cb: Callback<{ move: BoardCoord; gameState: SerializedGameState }>) {
  socket?.off("move_made", cb);
}

export function onOpponentLeft(cb: Callback<void>) {
  connectSocket().on("opponent_left", cb);
}

export function offOpponentLeft(cb: Callback<void>) {
  socket?.off("opponent_left", cb);
}

export function onRematchStart(
  cb: Callback<{ gameState: SerializedGameState }>
) {
  connectSocket().on("rematch_start", cb);
}

export function offRematchStart(cb: Callback<{ gameState: SerializedGameState }>) {
  socket?.off("rematch_start", cb);
}

export function onError(cb: Callback<{ message: string }>) {
  connectSocket().on("error", cb);
}

// ── URL helpers (unchanged from localStorage version) ──────────────────

export function getRoomShareLink(roomCode: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?room=${roomCode}`;
}

export function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}
