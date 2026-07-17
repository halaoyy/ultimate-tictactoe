// Simple online room management using localStorage and URL parameters
// In production, this would use WebSocket/Firebase for real-time sync

export interface OnlineRoom {
  roomCode: string;
  createdAt: number;
  playerX: string | null;
  playerO: string | null;
  gameState: string | null;
}

const ROOM_PREFIX = "utt_room_";
const ROOM_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(): string {
  const roomCode = generateRoomCode();
  const room: OnlineRoom = {
    roomCode,
    createdAt: Date.now(),
    playerX: generatePlayerId(),
    playerO: null,
    gameState: null,
  };
  localStorage.setItem(ROOM_PREFIX + roomCode, JSON.stringify(room));
  return roomCode;
}

export function joinRoom(roomCode: string): boolean {
  const key = ROOM_PREFIX + roomCode;
  const data = localStorage.getItem(key);
  
  if (!data) return false;
  
  const room: OnlineRoom = JSON.parse(data);
  
  // Check if room is expired
  if (Date.now() - room.createdAt > ROOM_EXPIRY) {
    localStorage.removeItem(key);
    return false;
  }
  
  // Check if room is full
  if (room.playerX && room.playerO) return false;
  
  // Assign player O if not assigned
  if (!room.playerO) {
    room.playerO = generatePlayerId();
    localStorage.setItem(key, JSON.stringify(room));
  }
  
  return true;
}

export function getRoom(roomCode: string): OnlineRoom | null {
  const key = ROOM_PREFIX + roomCode;
  const data = localStorage.getItem(key);
  
  if (!data) return null;
  
  const room: OnlineRoom = JSON.parse(data);
  
  // Check if room is expired
  if (Date.now() - room.createdAt > ROOM_EXPIRY) {
    localStorage.removeItem(key);
    return null;
  }
  
  return room;
}

export function updateRoomGameState(roomCode: string, gameState: string): void {
  const key = ROOM_PREFIX + roomCode;
  const data = localStorage.getItem(key);
  
  if (!data) return;
  
  const room: OnlineRoom = JSON.parse(data);
  room.gameState = gameState;
  localStorage.setItem(key, JSON.stringify(room));
}

export function generatePlayerId(): string {
  return "player_" + Math.random().toString(36).substring(2, 10);
}

export function getRoomShareLink(roomCode: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?room=${roomCode}`;
}

export function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}
