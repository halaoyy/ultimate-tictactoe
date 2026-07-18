// socket-handler.ts — Socket.IO server-side room & game state management
// Server-authoritative: validates moves, stores canonical game state, broadcasts to clients.

import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import {
  createInitialState,
  makeMove,
  isValidMove,
  GameState,
  BoardCoord,
  Player,
} from "../client/src/game/state.js";

// ── Types ──────────────────────────────────────────────────────────────

interface Room {
  code: string;
  players: {
    X: string | null; // socket.id
    O: string | null;
  };
  gameState: GameState;
  createdAt: number;
}

type RoomCode = string;

// ── In-memory storage ──────────────────────────────────────────────────

const rooms = new Map<RoomCode, Room>();
const socketToRoom = new Map<string, RoomCode>(); // socket.id → room code

// ── Helpers ────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Avoid collisions
  if (rooms.has(code)) return generateCode();
  return code;
}

// Serialize game state to JSON-safe format (strip functions, keep data)
function serializeState(state: GameState) {
  return {
    board: state.board,
    subBoardWinners: state.subBoardWinners,
    subBoardDrawn: state.subBoardDrawn,
    currentPlayer: state.currentPlayer,
    nextBoard: state.nextBoard,
    gameWinner: state.gameWinner,
    isDraw: state.isDraw,
    scores: state.scores,
    moveHistory: state.moveHistory,
    lastMove: state.lastMove,
  };
}

function getRoomForSocket(socket: Socket): Room | null {
  const code = socketToRoom.get(socket.id);
  if (!code) return null;
  return rooms.get(code) || null;
}

function getPieceForSocket(socket: Socket): Player | null {
  const room = getRoomForSocket(socket);
  if (!room) return null;
  if (room.players.X === socket.id) return "X";
  if (room.players.O === socket.id) return "O";
  return null;
}

function cleanupRoom(code: string, io: Server) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit("opponent_left");
  // Leave all sockets in the room
  io.in(code).socketsLeave(code);
  rooms.delete(code);
  // Clean up socket→room mappings
  Array.from(socketToRoom.entries()).forEach(([sid, rid]) => {
    if (rid === code) socketToRoom.delete(sid);
  });
}

// ── Main setup ─────────────────────────────────────────────────────────

export function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── CREATE ROOM ────────────────────────────────────────────
    socket.on("create_room", () => {
      // Don't allow creating a room while already in one
      if (socketToRoom.has(socket.id)) {
        socket.emit("error", { message: "Already in a room" });
        return;
      }

      const code = generateCode();
      const gameState = createInitialState({ gameMode: "online" });

      const room: Room = {
        code,
        players: { X: socket.id, O: null },
        gameState,
        createdAt: Date.now(),
      };

      rooms.set(code, room);
      socketToRoom.set(socket.id, code);
      socket.join(code);

      console.log(`[room] created ${code} by ${socket.id}`);
      socket.emit("room_created", { roomCode: code });
    });

    // ── JOIN ROOM ──────────────────────────────────────────────
    socket.on("join_room", (data: { roomCode: string }) => {
      if (socketToRoom.has(socket.id)) {
        socket.emit("error", { message: "Already in a room" });
        return;
      }

      const code = data.roomCode?.toUpperCase();
      if (!code || code.length !== 6) {
        socket.emit("error", { message: "Invalid room code" });
        return;
      }

      const room = rooms.get(code);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // Check if room is full
      if (room.players.O) {
        // Check if this is the same player reconnecting
        if (room.players.X === socket.id || room.players.O === socket.id) {
          // Reconnection — rejoin the room
          socketToRoom.set(socket.id, code);
          socket.join(code);
          const piece = room.players.X === socket.id ? "X" : "O";
          socket.emit("game_start", {
            piece,
            gameState: serializeState(room.gameState),
          });
          return;
        }
        socket.emit("error", { message: "Room is full" });
        return;
      }

      // Assign player O
      room.players.O = socket.id;
      socketToRoom.set(socket.id, code);
      socket.join(code);

      // Notify host that opponent joined
      if (room.players.X) {
        io.to(room.players.X).emit("opponent_joined");
      }

      // Send game_start individually with correct piece for each player
      // Joiner (O) gets the state directly
      socket.emit("game_start", {
        piece: "O",
        gameState: serializeState(room.gameState),
      });

      // Host (X) gets the state with their own piece
      if (room.players.X) {
        io.to(room.players.X).emit("game_start", {
          piece: "X",
          gameState: serializeState(room.gameState),
        });
      }

      console.log(`[room] ${socket.id} joined ${code} as O`);
    });

    // ── MAKE MOVE ──────────────────────────────────────────────
    socket.on(
      "make_move",
      (data: { roomCode: string; move: BoardCoord }) => {
        const room = getRoomForSocket(socket);
        if (!room) {
          socket.emit("error", { message: "Not in a room" });
          return;
        }

        const piece = getPieceForSocket(socket);
        if (!piece) {
          socket.emit("error", { message: "Not a player in this room" });
          return;
        }

        // Validate it's this player's turn
        if (room.gameState.currentPlayer !== piece) {
          socket.emit("error", { message: "Not your turn" });
          return;
        }

        // Game already over
        if (room.gameState.gameWinner || room.gameState.isDraw) {
          socket.emit("error", { message: "Game is over" });
          return;
        }

        // Validate move
        if (!isValidMove(room.gameState, data.move)) {
          socket.emit("error", { message: "Invalid move" });
          return;
        }

        // Apply move
        room.gameState = makeMove(room.gameState, data.move);

        console.log(
          `[move] ${piece} → (${data.move.outerRow},${data.move.outerCol})[${data.move.innerRow},${data.move.innerCol}] in ${room.code} — broadcasting to ${Array.from(io.sockets.adapter.rooms.get(room.code) || []).length} clients`
        );

        // Broadcast to both players
        io.to(room.code).emit("move_made", {
          move: data.move,
          gameState: serializeState(room.gameState),
        });
        console.log(`[move] broadcast complete, moveHistory.length=${room.gameState.moveHistory.length}`);
      }
    );

    // ── REQUEST REMATCH ────────────────────────────────────────
    socket.on("request_rematch", (data: { roomCode: string }) => {
      const room = getRoomForSocket(socket);
      if (!room) return;

      // Only allow rematch when game is over
      if (!room.gameState.gameWinner && !room.gameState.isDraw) {
        socket.emit("error", { message: "Game is still in progress" });
        return;
      }

      // Reset game state, keep scores
      const scores = { ...room.gameState.scores };
      room.gameState = createInitialState({ gameMode: "online" });
      room.gameState.scores = scores;

      console.log(`[room] rematch in ${room.code}`);

      io.to(room.code).emit("rematch_start", {
        gameState: serializeState(room.gameState),
      });
    });

    // ── LEAVE ROOM ─────────────────────────────────────────────
    socket.on("leave_room", () => {
      const code = socketToRoom.get(socket.id);
      if (code) {
        console.log(`[room] ${socket.id} left ${code}`);
        socket.leave(code);
        socketToRoom.delete(socket.id);
        cleanupRoom(code, io);
      }
    });

    // ── DISCONNECT ─────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      const code = socketToRoom.get(socket.id);
      if (code) {
        socketToRoom.delete(socket.id);
        const room = rooms.get(code);
        if (room) {
          // Notify the remaining player
          socket.to(code).emit("opponent_left");
          // Clean up the room
          io.in(code).socketsLeave(code);
          rooms.delete(code);
          // Clean remaining socket→room mapping
          const otherPlayer = room.players.X === socket.id ? room.players.O : room.players.X;
          if (otherPlayer) socketToRoom.delete(otherPlayer);
        }
      }
    });
  });

  // Clean up stale rooms every 30 minutes
  setInterval(() => {
    const now = Date.now();
    const STALE_MS = 2 * 60 * 60 * 1000; // 2 hours
    Array.from(rooms.entries()).forEach(([code, room]) => {
      if (now - room.createdAt > STALE_MS) {
        io.to(code).emit("opponent_left");
        io.in(code).socketsLeave(code);
        Array.from(socketToRoom.entries()).forEach(([sid, rid]) => {
          if (rid === code) socketToRoom.delete(sid);
        });
        rooms.delete(code);
      }
    });
  }, 30 * 60 * 1000);

  return io;
}
