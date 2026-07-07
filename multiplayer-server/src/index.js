const MAX_PLAYERS = 8;
const ROOM_PATTERN = /^[A-Z0-9]{4,8}$/;
const ATTACKS = {
  speed: { damage: 12, range: 3.8, knockback: 4.5, cone: -0.2 },
  strength: { damage: 34, range: 9.5, knockback: 10, radial: true },
  teleport: { damage: 24, range: 18, knockback: 5, cone: 0.1 },
  telekinesis: { damage: 20, range: 15, knockback: 8, cone: 0.15 },
  flight: { damage: 28, range: 9, knockback: 9, radial: true },
  robot: { damage: 16, range: 55, knockback: 3, cone: 0.9 },
  jump: { damage: 30, range: 8, knockback: 9, radial: true },
  webs: { damage: 18, range: 8, knockback: 4, cone: 0.05 },
};
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

function sanitizeUsername(value) {
  const name = String(value || "Player").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 18);
  return name || "Player";
}

function safeVector(value, fallback = [0, 0, 0]) {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return value.slice(0, 3).map((number, index) => Number.isFinite(Number(number)) ? Math.max(-1000, Math.min(1000, Number(number))) : fallback[index]);
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
    this.hostId = null;
    this.entitySnapshots = new Map();
    this.ready = this.restoreSessions();
  }

  async restoreSessions() {
    for (const socket of this.ctx.getWebSockets()) {
      const player = socket.deserializeAttachment();
      if (player?.id) this.players.set(player.id, { ...player, socket });
    }
    this.hostId = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || null;
  }

  async fetch(request) {
    await this.ready;
    if (this.players.size >= MAX_PLAYERS) return json({ error: "Room is full." }, 409);

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const id = crypto.randomUUID();
    const player = { id, username: "Player", power: "speed", map: "hub", state: null, health: 100, respawnAt: 0, joinedAt: Date.now() };

    server.serializeAttachment(player);
    this.ctx.acceptWebSocket(server);
    this.players.set(id, { ...player, socket: server });
    if (!this.hostId) this.hostId = id;

    this.send(server, {
      type: "welcome",
      id,
      hostId: this.hostId,
      entities: [...this.entitySnapshots.entries()].map(([map, snapshot]) => ({ map, snapshot })),
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
      player.username = sanitizeUsername(message.username);
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-updated", player: this.publicPlayer(player) }, player.id);
      return;
    }

    if (message.type === "state" && message.state && typeof message.state === "object") {
      if (player.respawnAt && Date.now() >= player.respawnAt) {
        player.health = 100;
        player.respawnAt = 0;
        this.broadcast({ type: "player-respawn", id: player.id, health: 100 });
        this.send(socket, { type: "player-respawn", id: player.id, health: 100 });
      }
      player.state = {
        ...message.state,
        position: safeVector(message.state.position),
        forward: safeVector(message.state.forward, [0, 0, -1]),
        health: player.health,
      };
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-state", id: player.id, state: player.state }, player.id);
      return;
    }

    if (message.type === "action") {
      const action = message.action && typeof message.action === "object" ? message.action : {};
      this.broadcast({ type: "player-action", id: player.id, action }, player.id);
      if (action.kind === "attack") this.resolvePvpAttack(player, action);
      return;
    }

    if (message.type === "entities" && message.map && message.snapshot) {
      const map = String(message.map).slice(0, 24);
      const snapshot = {
        dummies: Array.isArray(message.snapshot.dummies) ? message.snapshot.dummies.slice(0, 80) : [],
        objects: Array.isArray(message.snapshot.objects) ? message.snapshot.objects.slice(0, 120) : [],
      };
      this.entitySnapshots.set(map, snapshot);
      this.broadcast({ type: "entities", map, snapshot, senderId: player.id }, player.id);
    }
  }

  resolvePvpAttack(attacker, action) {
    if (attacker.map !== "pvpArena" || attacker.health <= 0 || !attacker.state?.position) return;
    const spec = ATTACKS[attacker.power];
    if (!spec) return;
    const origin = attacker.state.position;
    const forward = attacker.state.forward || [0, 0, -1];
    for (const target of this.players.values()) {
      if (target.id === attacker.id || target.map !== "pvpArena" || target.health <= 0 || !target.state?.position) continue;
      const dx = target.state.position[0] - origin[0];
      const dz = target.state.position[2] - origin[2];
      const distance = Math.hypot(dx, dz);
      if (distance > spec.range || distance < 0.01) continue;
      const dot = (dx / distance) * forward[0] + (dz / distance) * forward[2];
      if (!spec.radial && dot < spec.cone) continue;
      target.health = Math.max(0, target.health - spec.damage);
      target.respawnAt = target.health <= 0 ? Date.now() + 2500 : 0;
      this.savePlayer(target.socket, target);
      const hit = {
        type: "pvp-hit",
        attackerId: attacker.id,
        targetId: target.id,
        health: target.health,
        damage: spec.damage,
        impulse: [(dx / distance) * spec.knockback, Math.min(5, spec.knockback * 0.4), (dz / distance) * spec.knockback],
        defeated: target.health <= 0,
        respawnAt: target.respawnAt,
        power: attacker.power,
      };
      this.broadcast(hit);
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
    if (this.hostId === player.id) {
      this.hostId = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || null;
      this.broadcast({ type: "host-changed", hostId: this.hostId });
    }
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
