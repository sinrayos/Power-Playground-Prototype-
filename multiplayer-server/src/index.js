const MAX_PLAYERS = 8;
const ROOM_PATTERN = /^[A-Z0-9]{4,8}$/;
const ALLOWED_ORIGINS = new Set([
  "https://powerplayground.netlify.app",
]);

function isAllowedOrigin(origin) {
  if (!origin || ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  } catch {
    return false;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

function sanitizeRoomCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return ROOM_PATTERN.test(code) ? code : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "power-playground-multiplayer" });
    }

    const match = url.pathname.match(/^\/room\/([^/]+)$/);
    const roomCode = sanitizeRoomCode(match?.[1]);
    if (!roomCode) return json({ error: "Use /room/CODE with a 4-8 character room code." }, 404);

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ error: "This room endpoint requires a WebSocket connection." }, 426);
    }

    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin)) return json({ error: "Origin not allowed." }, 403);

    const room = env.GAME_ROOMS.getByName(roomCode);
    return room.fetch(request);
  },
};

export class GameRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.players = new Map();
    this.ready = this.restoreSessions();
  }

  async restoreSessions() {
    for (const socket of this.ctx.getWebSockets()) {
      const player = socket.deserializeAttachment();
      if (player?.id) this.players.set(player.id, { ...player, socket });
    }
  }

  async fetch(request) {
    await this.ready;
    if (this.players.size >= MAX_PLAYERS) return json({ error: "Room is full." }, 409);

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const id = crypto.randomUUID();
    const player = { id, power: "speed", map: "hub", state: null, joinedAt: Date.now() };

    server.serializeAttachment(player);
    this.ctx.acceptWebSocket(server);
    this.players.set(id, { ...player, socket: server });

    this.send(server, {
      type: "welcome",
      id,
      players: [...this.players.values()]
        .filter((entry) => entry.id !== id)
        .map(({ socket: _socket, ...entry }) => entry),
    });
    this.broadcast({ type: "player-joined", player }, id);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket, rawMessage) {
    let message;
    try {
      message = JSON.parse(typeof rawMessage === "string" ? rawMessage : new TextDecoder().decode(rawMessage));
    } catch {
      return this.send(socket, { type: "error", message: "Invalid message." });
    }

    const attached = socket.deserializeAttachment();
    const player = attached?.id ? this.players.get(attached.id) : null;
    if (!player) return socket.close(1011, "Session unavailable");

    if (message.type === "hello") {
      player.power = String(message.power || "speed").slice(0, 24);
      player.map = String(message.map || "hub").slice(0, 24);
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-updated", player: this.publicPlayer(player) }, player.id);
      return;
    }

    if (message.type === "state" && message.state && typeof message.state === "object") {
      player.state = message.state;
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-state", id: player.id, state: player.state }, player.id);
      return;
    }

    if (message.type === "action") {
      this.broadcast({ type: "player-action", id: player.id, action: message.action }, player.id);
    }
  }

  webSocketClose(socket) {
    this.removePlayer(socket);
  }

  webSocketError(socket) {
    this.removePlayer(socket);
  }

  savePlayer(socket, player) {
    const attachment = this.publicPlayer(player);
    socket.serializeAttachment(attachment);
    this.players.set(player.id, { ...attachment, socket });
  }

  removePlayer(socket) {
    const player = socket.deserializeAttachment();
    if (!player?.id || !this.players.delete(player.id)) return;
    this.broadcast({ type: "player-left", id: player.id });
  }

  publicPlayer(player) {
    const { socket: _socket, ...publicData } = player;
    return publicData;
  }

  send(socket, message) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A close callback will remove sockets that disappear between broadcasts.
    }
  }

  broadcast(message, exceptId = null) {
    const encoded = JSON.stringify(message);
    for (const player of this.players.values()) {
      if (player.id === exceptId) continue;
      try {
        player.socket.send(encoded);
      } catch {
        // The runtime will report the closed socket through webSocketClose/error.
      }
    }
  }
}
