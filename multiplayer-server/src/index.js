const MAX_PLAYERS = 8;
const ROOM_PATTERN = /^[A-Z0-9]{4,8}$/;
const ATTACKS = {
  speed: { damage: 7, range: 3.8, knockback: 3.4, cone: -0.2, cooldown: 500 },
  strength: { damage: 20, range: 8, knockback: 7, radial: true, cooldown: 3400 },
  teleport: { damage: 6, range: 18, knockback: 2.5, cone: 0.1, cooldown: 1000 },
  telekinesis: { damage: 11, range: 15, knockback: 5, cone: 0.15, cooldown: 500 },
  flight: { damage: 15, range: 9, knockback: 6, radial: true, cooldown: 500 },
  robot: { damage: 8, range: 55, knockback: 2.4, cone: 0.9, cooldown: 850 },
  jump: { damage: 17, range: 8, knockback: 6, radial: true, cooldown: 450 },
  webs: { damage: 10, range: 8, knockback: 3, cone: 0.05, cooldown: 650 },
};
const TELEKINESIS_GRAB_COOLDOWN = 1500;
const STRENGTH_PLAYER_GRAB_COOLDOWN = 1500;
const ROBOT_SHIELD_DURATION = 5000;
const ROBOT_SHIELD_COOLDOWN = 5000;
const TELEPORT_BACKSTAB_COOLDOWN = 1500;
const HOLD_ESCAPE_TAP_GAIN = 0.065;
const HOLD_ESCAPE_DECAY_PER_SECOND = 0.12;
const WEB_PULL_COOLDOWN = 1000;
const WEB_TRAP_COOLDOWN = 5000;
const PLAYER_ICON_PATTERN = /^(portrait|symbol)-(speed|strength|teleport|telekinesis|flight|jump|robot|webs)$/;
const WEB_TRAP_DURATION = 3200;
const DEFEAT_RESPAWN_DELAY = 4400;
const FLIGHT_STRIKE_COOLDOWN = 12000;
const MAP_BOUNDS = {
  hub: [-23.6, 23.6, -23.6, 23.6], speedTrack: [-56.5, 56.5, 70.5, 161.5], minionArena: [-35.5, 35.5, 184.5, 253.5],
  strengthPit: [-35.5, 35.5, 282.5, 353.5], city: [-94, 94, 366, 554], pvpArena: [-38, 38, 612, 688],
};
const maxHealthForPower = (power) => power === "strength" ? 150 : 100;
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

function sanitizePlayerIcon(value) {
  const icon = String(value || "portrait-speed");
  return PLAYER_ICON_PATTERN.test(icon) ? icon : "portrait-speed";
}

function safeVector(value, fallback = [0, 0, 0]) {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return value.slice(0, 3).map((number, index) => Number.isFinite(Number(number)) ? Math.max(-1000, Math.min(1000, Number(number))) : fallback[index]);
}

function segmentIntersectsAabb(start, end, box) {
  let near = 0;
  let far = 1;
  for (let axis = 0; axis < 3; axis += 1) {
    const delta = end[axis] - start[axis];
    if (Math.abs(delta) < 1e-6) {
      if (start[axis] < box.min[axis] || start[axis] > box.max[axis]) return false;
      continue;
    }
    const a = (box.min[axis] - start[axis]) / delta;
    const b = (box.max[axis] - start[axis]) / delta;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return false;
  }
  return near > 0.025 && near < 0.96;
}

const PVP_WEB_BLOCKERS = [
  [-18, 2, 635, 9, 4, 3], [18, 2, 665, 9, 4, 3], [-18, 2, 665, 3, 4, 9], [18, 2, 635, 3, 4, 9],
  [0, 1.25, 650, 12, 2.5, 12], [0, 3.7, 650, 6, 2.4, 6],
].map(([x, y, z, sx, sy, sz]) => ({ min: [x - sx / 2, y - sy / 2, z - sz / 2], max: [x + sx / 2, y + sy / 2, z + sz / 2] }));

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
    this.thrownEntities = new Map();
    this.webTraps = new Map();
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
    const player = { id, username: "Player", icon: "portrait-speed", power: "speed", map: "hub", state: null, health: 100, maxHealth: 100, pearls: 5, respawnAt: 0, defeatSequence: 0, activeDefeatId: null, grabbedBy: null, grabbedMode: null, holdEscapeProgress: 0, lastHoldEscapeTapAt: 0, webPulledBy: null, webPullEndsAt: 0, webTrappedBy: null, webTrappedUntil: 0, webTrapAnchor: null, lastAttackAt: 0, lastGrabAt: 0, lastTelekinesisGrabAt: 0, lastWebPullAt: 0, lastWebTrapAt: 0, lastFlightStrikeAt: 0, flightStrike: null, shieldActive: false, shieldEndsAt: 0, shieldCooldownUntil: 0, joinedAt: Date.now() };

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
      if (player.map !== String(message.map || "hub")) {
        this.releaseVictimsHeldBy(player.id);
        this.releaseWebVictimsBy(player.id);
        player.flightStrike = null;
      }
      const nextPower = String(message.power || "speed").slice(0, 24);
      if (player.power !== nextPower || !player.maxHealth) {
        player.power = nextPower;
        player.maxHealth = maxHealthForPower(nextPower);
        player.health = player.maxHealth;
        player.pearls = nextPower === "speed" ? 5 : 0;
        player.shieldActive = false;
        player.shieldEndsAt = 0;
        player.shieldCooldownUntil = 0;
        this.clearWebStatus(player);
      }
      player.map = String(message.map || "hub").slice(0, 24);
      player.username = sanitizeUsername(message.username);
      player.icon = sanitizePlayerIcon(message.icon);
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-updated", player: this.publicPlayer(player) }, player.id);
      return;
    }

    if (message.type === "state" && message.state && typeof message.state === "object") {
      if (player.respawnAt && Date.now() >= player.respawnAt) {
        player.health = player.maxHealth || maxHealthForPower(player.power);
        player.respawnAt = 0;
        player.activeDefeatId = null;
        this.broadcast({ type: "player-respawn", id: player.id, health: player.health });
        this.send(socket, { type: "player-respawn", id: player.id, health: player.health });
      }
      this.expireShield(player);
      this.expireWebStatus(player);
      const holder = player.grabbedBy ? this.players.get(player.grabbedBy) : null;
      if (player.grabbedBy && !holder) {
        player.grabbedBy = null;
        player.grabbedMode = null;
        player.holdEscapeProgress = 0;
        player.lastHoldEscapeTapAt = 0;
      }
      const reportedPosition = safeVector(message.state.position);
      const statePosition = player.webTrappedUntil > Date.now() && Array.isArray(player.webTrapAnchor)
        ? player.webTrapAnchor
        : reportedPosition;
      player.state = {
        ...message.state,
        // The held player's Cannon body owns its collision-resolved position. Never
        // replace it with the holder's aim point or it can tunnel through geometry.
        position: statePosition,
        forward: safeVector(message.state.forward, [0, 0, -1]),
        health: player.health,
      };
      this.savePlayer(socket, player);
      this.checkWebTraps(player);
      this.broadcast({ type: "player-state", id: player.id, state: player.state }, player.id);
      return;
    }

    if (message.type === "action") {
      const action = message.action && typeof message.action === "object" ? message.action : {};
      if (player.health <= 0 || player.respawnAt) return;
      if (action.kind === "strength-grab-player") return this.handleStrengthGrab(player, action);
      if (action.kind === "strength-throw-player") return this.handleStrengthThrow(player, action);
      if (action.kind === "telekinesis-grab-player") return this.handleTelekinesisGrab(player, action);
      if (action.kind === "telekinesis-entity-grab") return this.handleTelekinesisEntityGrab(player, action);
      if (action.kind === "telekinesis-throw-player") return this.handleTelekinesisThrow(player, action);
      if (action.kind === "telekinesis-slam-player") return this.handleTelekinesisSlam(player, action);
      if (action.kind === "hold-escape-tap") return this.handleHoldEscapeTap(player);
      if (action.kind === "robot-shield-toggle") return this.handleRobotShieldToggle(player);
      if (action.kind === "web-pull-player") return this.handleWebPull(player, action);
      if (action.kind === "web-pull-release") return this.handleWebPullRelease(player, action);
      if (action.kind === "web-trap-player") return this.handleWebTrapPlayer(player, action);
      if (action.kind === "web-trap-place") return this.handleWebTrapPlace(player, action);
      if (action.kind === "web-escape") return this.handleWebEscape(player, action);
      if (action.kind === "flight-strike-start") return this.handleFlightStrikeStart(player);
      if (action.kind === "flight-strike-impact") return this.handleFlightStrikeImpact(player, action);
      if (action.kind === "flight-strike-cancel") return this.handleFlightStrikeCancel(player);
      if (action.kind === "strength-release-player") {
        this.releaseVictimsHeldBy(player.id);
        return;
      }
      if (player.grabbedBy) return;
      if (action.kind === "strength-entity-grab") return this.handleStrengthEntityGrab(player, action);
      if (action.kind === "strength-entity-throw") return this.handleStrengthEntityThrow(player, action);
      if (action.kind === "telekinesis-entity-throw") return this.handleStrengthEntityThrow(player, action);
      if (action.kind === "strength-entity-contact") return this.handleStrengthEntityContact(player, action);
      if (action.kind === "strong-sword") return this.handleStrongSword(player, action);
      if (action.kind === "teleport-backstab") return this.handleTeleportBackstab(player, action);
      if (action.kind === "attack") {
        if (this.resolvePvpAttack(player, action)) this.broadcast({ type: "player-action", id: player.id, action }, player.id);
        return;
      }
      this.broadcast({ type: "player-action", id: player.id, action }, player.id);
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

  handleStrengthGrab(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "strength") return;
    if (attacker.map !== "pvpArena" || target.map !== attacker.map || attacker.health <= 0 || target.health <= 0) return;
    if (attacker.grabbedBy || target.grabbedBy || !attacker.state?.position || !target.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastGrabAt || 0) < STRENGTH_PLAYER_GRAB_COOLDOWN) return;
    const distance = Math.hypot(
      target.state.position[0] - attacker.state.position[0],
      target.state.position[1] - attacker.state.position[1],
      target.state.position[2] - attacker.state.position[2]
    );
    if (distance > 4.75) return;
    attacker.lastGrabAt = now;
    this.savePlayer(attacker.socket, attacker);
    target.grabbedBy = attacker.id;
    target.grabbedMode = "strength";
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "player-grabbed", attackerId: attacker.id, targetId: target.id, mode: "strength", cooldownUntil: now + STRENGTH_PLAYER_GRAB_COOLDOWN });
  }

  handleStrengthThrow(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.grabbedBy !== attacker.id || attacker.power !== "strength") return;
    const direction = safeVector(action.forward, [0, 0, -1]);
    const length = Math.hypot(direction[0], direction[2]) || 1;
    const impulse = [(direction[0] / length) * 16, 1.5, (direction[2] / length) * 16];
    target.grabbedBy = null;
    target.grabbedMode = null;
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    if (this.blockDamage(attacker, target, "strength")) {
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "player-released", attackerId: attacker.id, targetId: target.id });
      return;
    }
    target.health = Math.max(0, target.health - 18);
    target.respawnAt = target.health <= 0 ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
    this.savePlayer(target.socket, target);
    this.broadcast({
      type: "player-thrown",
      attackerId: attacker.id,
      targetId: target.id,
      health: target.health,
      damage: 18,
      impulse,
      defeated: target.health <= 0,
      respawnAt: target.respawnAt,
      mode: "strength",
    });
    if (target.health <= 0) this.announceDefeat(target, attacker);
  }

  handleTelekinesisGrab(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "telekinesis") return;
    if (attacker.map !== "pvpArena" || target.map !== attacker.map || attacker.grabbedBy || target.grabbedBy || attacker.health <= 0 || target.health <= 0) return;
    if (!attacker.state?.position || !target.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastTelekinesisGrabAt || 0) < TELEKINESIS_GRAB_COOLDOWN) return;
    const distance = Math.hypot(
      target.state.position[0] - attacker.state.position[0],
      target.state.position[1] - attacker.state.position[1],
      target.state.position[2] - attacker.state.position[2]
    );
    if (distance > 46) return;
    attacker.lastTelekinesisGrabAt = now;
    target.grabbedBy = attacker.id;
    target.grabbedMode = "telekinesis";
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    this.savePlayer(attacker.socket, attacker);
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "player-grabbed", attackerId: attacker.id, targetId: target.id, mode: "telekinesis", cooldownUntil: now + TELEKINESIS_GRAB_COOLDOWN });
  }

  handleTelekinesisEntityGrab(attacker, action) {
    if (attacker.power !== "telekinesis" || attacker.health <= 0 || attacker.grabbedBy) return;
    if (!['box', 'dummy'].includes(String(action.entityType)) || !Number.isInteger(Number(action.entityId))) return;
    const now = Date.now();
    if (now - (attacker.lastTelekinesisGrabAt || 0) < TELEKINESIS_GRAB_COOLDOWN) return;
    attacker.lastTelekinesisGrabAt = now;
    this.savePlayer(attacker.socket, attacker);
    this.broadcast({ type: "player-action", id: attacker.id, action }, attacker.id);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "telekinesis-grab", cooldownUntil: now + TELEKINESIS_GRAB_COOLDOWN });
  }

  handleTelekinesisThrow(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.grabbedBy !== attacker.id || target.grabbedMode !== "telekinesis" || attacker.power !== "telekinesis") return;
    const direction = safeVector(action.forward, [0, 0, -1]);
    const length = Math.hypot(direction[0], direction[2]) || 1;
    const impulse = [(direction[0] / length) * 13, Math.max(2.5, direction[1] * 8 + 3), (direction[2] / length) * 13];
    target.grabbedBy = null;
    target.grabbedMode = null;
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    if (this.blockDamage(attacker, target, "telekinesis")) {
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "player-released", attackerId: attacker.id, targetId: target.id });
      return;
    }
    target.health = Math.max(0, target.health - 9);
    target.respawnAt = target.health <= 0 ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "player-thrown", attackerId: attacker.id, targetId: target.id, health: target.health, damage: 9, impulse, defeated: target.health <= 0, respawnAt: target.respawnAt, mode: "telekinesis" });
    if (target.health <= 0) this.announceDefeat(target, attacker);
  }

  handleTelekinesisSlam(target, action) {
    if (target.grabbedMode !== "telekinesis" || target.grabbedBy !== String(action.holderId || "")) return;
    const holder = this.players.get(target.grabbedBy);
    if (!holder || holder.power !== "telekinesis" || holder.map !== target.map) return;
    const now = Date.now();
    if (now - (target.lastTelekinesisSlamAt || 0) < 650) return;
    target.lastTelekinesisSlamAt = now;
    if (this.blockDamage(holder, target, "telekinesis")) return;
    target.health = Math.max(0, target.health - 5);
    target.respawnAt = target.health <= 0 ? now + DEFEAT_RESPAWN_DELAY : 0;
    if (target.health <= 0) {
      target.grabbedBy = null;
      target.grabbedMode = null;
      target.holdEscapeProgress = 0;
      target.lastHoldEscapeTapAt = 0;
    }
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "pvp-hit", attackerId: holder.id, targetId: target.id, health: target.health, damage: 5, impulse: [0, 0, 0], defeated: target.health <= 0, respawnAt: target.respawnAt, power: "telekinesis", slam: true, position: safeVector(action.position, target.state?.position || [0, 0, 0]) });
    if (target.health <= 0) this.announceDefeat(target, holder);
  }

  handleHoldEscapeTap(target) {
    const now = Date.now();
    if (!target.grabbedBy || !["strength", "telekinesis"].includes(target.grabbedMode) || target.health <= 0) return;
    const holder = this.players.get(target.grabbedBy);
    if (!holder || holder.map !== target.map || holder.health <= 0) {
      target.grabbedBy = null;
      target.grabbedMode = null;
      target.holdEscapeProgress = 0;
      target.lastHoldEscapeTapAt = 0;
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "player-released", attackerId: holder?.id || null, targetId: target.id, escaped: true });
      return;
    }
    if (now - (target.lastHoldEscapeTapAt || 0) < 75) return;
    const elapsed = Math.max(0, now - (target.lastHoldEscapeTapAt || now)) / 1000;
    target.holdEscapeProgress = Math.max(0, Number(target.holdEscapeProgress || 0) - elapsed * HOLD_ESCAPE_DECAY_PER_SECOND) + HOLD_ESCAPE_TAP_GAIN;
    target.lastHoldEscapeTapAt = now;
    if (target.holdEscapeProgress >= 1) {
      const attackerId = target.grabbedBy;
      target.grabbedBy = null;
      target.grabbedMode = null;
      target.holdEscapeProgress = 0;
      target.lastHoldEscapeTapAt = 0;
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "player-released", attackerId, targetId: target.id, escaped: true });
      return;
    }
    target.holdEscapeProgress = Math.min(0.99, target.holdEscapeProgress);
    this.savePlayer(target.socket, target);
    this.send(target.socket, { type: "hold-escape-progress", targetId: target.id, progress: target.holdEscapeProgress, mode: target.grabbedMode });
  }

  handleStrengthEntityThrow(attacker, action) {
    this.broadcast({ type: "player-action", id: attacker.id, action }, attacker.id);
    const throwPower = action.kind.startsWith("telekinesis") ? "telekinesis" : "strength";
    if (attacker.power !== throwPower || attacker.map !== "pvpArena" || attacker.health <= 0) return;
    const velocity = safeVector(action.velocity, [0, 0, -1]);
    const key = `${attacker.map}:${String(action.entityType)}:${Number(action.entityId)}`;
    this.thrownEntities.set(key, { attackerId: attacker.id, velocity, power: throwPower, damage: throwPower === "telekinesis" ? 8 : 12, expiresAt: Date.now() + 2200, hitIds: new Set() });
  }

  handleStrengthEntityGrab(attacker, action) {
    if (attacker.power !== "strength") return;
    const now = Date.now();
    if (now - (attacker.lastGrabAt || 0) < 1200) return;
    attacker.lastGrabAt = now;
    this.savePlayer(attacker.socket, attacker);
    this.broadcast({ type: "player-action", id: attacker.id, action }, attacker.id);
  }

  handleStrengthEntityContact(target, action) {
    const key = `${target.map}:${String(action.entityType)}:${Number(action.entityId)}`;
    const thrown = this.thrownEntities.get(key);
    if (!thrown || Date.now() > thrown.expiresAt || thrown.attackerId === target.id || thrown.hitIds.has(target.id)) return;
    const contact = safeVector(action.position);
    if (!target.state?.position || Math.hypot(contact[0] - target.state.position[0], contact[1] - target.state.position[1], contact[2] - target.state.position[2]) > 2.2) return;
    const attacker = this.players.get(thrown.attackerId);
    if (!attacker || attacker.map !== target.map || target.health <= 0) return;
    thrown.hitIds.add(target.id);
    if (this.blockDamage(attacker, target, thrown.power)) return;
    const horizontalLength = Math.hypot(thrown.velocity[0], thrown.velocity[2]) || 1;
    const direction = [thrown.velocity[0] / horizontalLength, 0, thrown.velocity[2] / horizontalLength];
    target.health = Math.max(0, target.health - thrown.damage);
    target.respawnAt = target.health <= 0 ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "pvp-hit", attackerId: attacker.id, targetId: target.id, health: target.health, damage: thrown.damage, impulse: [direction[0] * 7, 3, direction[2] * 7], defeated: target.health <= 0, respawnAt: target.respawnAt, power: thrown.power });
    if (target.health <= 0) this.announceDefeat(target, attacker);
  }

  handleStrongSword(attacker) {
    if (attacker.power !== "strength" || attacker.map !== "pvpArena" || attacker.grabbedBy || !attacker.state?.position) return;
    if ([...this.players.values()].some((player) => player.grabbedBy === attacker.id)) return;
    const now = Date.now();
    if (now - (attacker.lastSwordAt || 0) < 7000) return;
    attacker.lastSwordAt = now;
    this.savePlayer(attacker.socket, attacker);
    const origin = attacker.state.position;
    const forward = attacker.state.forward || [0, 0, -1];
    for (const target of this.players.values()) {
      if (target.id === attacker.id || target.map !== attacker.map || target.health <= 0 || !target.state?.position) continue;
      const dx = target.state.position[0] - origin[0];
      const dz = target.state.position[2] - origin[2];
      const distance = Math.hypot(dx, dz);
      if (distance < 0.01 || distance > 3.4) continue;
      if ((dx / distance) * forward[0] + (dz / distance) * forward[2] < 0.15) continue;
      if (this.blockDamage(attacker, target, "strength")) continue;
      target.health = Math.max(0, target.health - 14);
      target.respawnAt = target.health <= 0 ? now + DEFEAT_RESPAWN_DELAY : 0;
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "pvp-hit", attackerId: attacker.id, targetId: target.id, health: target.health, damage: 14, impulse: [(dx / distance) * 4, 1.5, (dz / distance) * 4], defeated: target.health <= 0, respawnAt: target.respawnAt, power: "strength" });
      if (target.health <= 0) this.announceDefeat(target, attacker);
    }
  }

  handleTeleportBackstab(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "teleport" || attacker.map !== "pvpArena") return;
    if (target.map !== attacker.map || attacker.grabbedBy || attacker.health <= 0 || target.health <= 0 || !attacker.state?.position || !target.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastBackstabAt || 0) < TELEPORT_BACKSTAB_COOLDOWN) return;
    const dx = target.state.position[0] - attacker.state.position[0];
    const dy = target.state.position[1] - attacker.state.position[1];
    const dz = target.state.position[2] - attacker.state.position[2];
    const distance = Math.hypot(dx, dz);
    if (distance > 58) return;
    const forward = Array.isArray(attacker.state.forward) ? attacker.state.forward : [0, 0, -1];
    const forwardLength = Math.hypot(...forward) || 1;
    const fx = forward[0] / forwardLength;
    const fy = forward[1] / forwardLength;
    const fz = forward[2] / forwardLength;
    const along = dx * fx + dy * fy + dz * fz;
    const miss = Math.hypot(dx - fx * along, dy - fy * along, dz - fz * along);
    if (along < 0 || along > 58 || miss > 1.25) return;
    attacker.lastBackstabAt = now;
    this.savePlayer(attacker.socket, attacker);
    if (this.blockDamage(attacker, target, "teleport")) return;
    target.health = Math.max(0, target.health - 18);
    target.respawnAt = target.health <= 0 ? now + DEFEAT_RESPAWN_DELAY : 0;
    this.savePlayer(target.socket, target);
    const length = distance || 1;
    this.broadcast({
      type: "pvp-hit",
      attackerId: attacker.id,
      targetId: target.id,
      health: target.health,
      damage: 18,
      impulse: [(dx / length) * 4, 1.5, (dz / length) * 4],
      defeated: target.health <= 0,
      respawnAt: target.respawnAt,
      power: "teleport",
    });
    if (target.health <= 0) this.announceDefeat(target, attacker);
  }

  webTarget(attacker, targetId, range, projectile = {}) {
    const target = this.players.get(String(targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "webs") return null;
    if (attacker.map !== "pvpArena" || target.map !== attacker.map || attacker.health <= 0 || target.health <= 0) return null;
    if (attacker.grabbedBy || !attacker.state?.position || !target.state?.position) return null;
    const dx = target.state.position[0] - attacker.state.position[0];
    const dy = target.state.position[1] - attacker.state.position[1];
    const dz = target.state.position[2] - attacker.state.position[2];
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.01 || distance > range) return null;
    const origin = safeVector(projectile.origin, attacker.state.position);
    const direction = safeVector(projectile.direction, attacker.state.forward || [0, 0, -1]);
    const directionLength = Math.hypot(...direction) || 1;
    const normalized = direction.map((value) => value / directionLength);
    if (Math.hypot(origin[0] - attacker.state.position[0], origin[1] - attacker.state.position[1], origin[2] - attacker.state.position[2]) > 2.8) return null;
    const along = dx * normalized[0] + dy * normalized[1] + dz * normalized[2];
    const missDistance = Math.hypot(dx - normalized[0] * along, dy - normalized[1] * along, dz - normalized[2] * along);
    const flightMs = Number(projectile.flightMs);
    const expectedMs = Math.max(0, along) / (projectile.mode === "pull" ? 48 : 38) * 1000;
    if (along < 0 || along > range || missDistance > 1.15 || !Number.isFinite(flightMs) || Math.abs(flightMs - expectedMs) > 380) return null;
    if (attacker.map === "pvpArena" && PVP_WEB_BLOCKERS.some((box) => segmentIntersectsAabb(origin, target.state.position, box))) return null;
    return { target, distance };
  }

  handleWebPull(attacker, action) {
    const result = this.webTarget(attacker, action.targetId, 52, { ...action, mode: "pull" });
    if (!result) return;
    const now = Date.now();
    if (now - (attacker.lastWebPullAt || 0) < WEB_PULL_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "web-pull", cooldownUntil: (attacker.lastWebPullAt || 0) + WEB_PULL_COOLDOWN });
      return;
    }
    attacker.lastWebPullAt = now;
    this.savePlayer(attacker.socket, attacker);
    if (this.blockDamage(attacker, result.target, "webs")) return;
    const duration = Math.max(520, Math.min(1150, result.distance * 34));
    result.target.webPulledBy = attacker.id;
    result.target.webPullEndsAt = now + duration;
    this.savePlayer(result.target.socket, result.target);
    this.broadcast({ type: "web-pull-start", attackerId: attacker.id, targetId: result.target.id, endsAt: now + duration, cooldownUntil: now + WEB_PULL_COOLDOWN });
  }

  handleWebPullRelease(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.webPulledBy !== attacker.id) return;
    target.webPulledBy = null;
    target.webPullEndsAt = 0;
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "web-pull-end", attackerId: attacker.id, targetId: target.id });
  }

  handleWebTrapPlayer(attacker, action) {
    const result = this.webTarget(attacker, action.targetId, 44, { ...action, mode: "trap" });
    if (!result) return;
    const now = Date.now();
    if (now - (attacker.lastWebTrapAt || 0) < WEB_TRAP_COOLDOWN) return;
    attacker.lastWebTrapAt = now;
    this.savePlayer(attacker.socket, attacker);
    this.applyWebTrap(attacker, result.target, now);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "web-trap", cooldownUntil: now + WEB_TRAP_COOLDOWN });
  }

  handleWebTrapPlace(attacker, action) {
    if (attacker.power !== "webs" || attacker.health <= 0 || attacker.grabbedBy || !attacker.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastWebTrapAt || 0) < WEB_TRAP_COOLDOWN) return;
    const point = safeVector(action.point);
    if (Math.hypot(point[0] - attacker.state.position[0], point[1] - attacker.state.position[1], point[2] - attacker.state.position[2]) > 44) return;
    attacker.lastWebTrapAt = now;
    this.savePlayer(attacker.socket, attacker);
    const trapId = crypto.randomUUID();
    this.webTraps.set(trapId, { id: trapId, attackerId: attacker.id, map: attacker.map, point, radius: 2.15, expiresAt: now + 15000 });
    this.broadcast({ type: "web-trap-placed", attackerId: attacker.id, trapId, point, expiresAt: now + 15000, cooldownUntil: now + WEB_TRAP_COOLDOWN });
  }

  checkWebTraps(player) {
    const now = Date.now();
    for (const [trapId, trap] of this.webTraps) {
      if (now >= trap.expiresAt) {
        this.webTraps.delete(trapId);
        this.broadcast({ type: "web-trap-removed", trapId });
        continue;
      }
      if (player.id === trap.attackerId || player.map !== trap.map || player.health <= 0 || player.webTrappedUntil > now) continue;
      const position = player.state?.position;
      if (!position || Math.hypot(position[0] - trap.point[0], position[2] - trap.point[2]) > trap.radius || Math.abs(position[1] - trap.point[1]) >= 2.2) continue;
      const attacker = this.players.get(trap.attackerId);
      this.webTraps.delete(trapId);
      this.broadcast({ type: "web-trap-removed", trapId });
      if (attacker) this.applyWebTrap(attacker, player, now);
      break;
    }
  }

  applyWebTrap(attacker, target, now = Date.now()) {
    if (this.blockDamage(attacker, target, "webs")) return false;
    target.webPulledBy = null;
    target.webPullEndsAt = 0;
    target.webTrappedBy = attacker.id;
    target.webTrappedUntil = now + WEB_TRAP_DURATION;
    target.webTrapAnchor = target.state?.position ? [...target.state.position] : [0, 0, 0];
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "web-trapped", attackerId: attacker.id, targetId: target.id, anchor: target.webTrapAnchor, endsAt: target.webTrappedUntil });
    return true;
  }

  handleWebEscape(player, action) {
    const now = Date.now();
    if (!player.webTrappedUntil || player.webTrappedUntil <= now || player.health <= 0) return;
    const method = String(action.method || "");
    if (player.power === "teleport" && method !== "teleport") return;
    if (player.power === "speed") {
      if (method !== "pearl" || (Number(player.pearls) || 0) <= 0) return;
      player.pearls -= 1;
    } else if (player.power !== "teleport") return;
    let escapePosition = player.state?.position || [0, 0, 0];
    if (method === "teleport") {
      const destination = safeVector(action.destination, escapePosition);
      const bounds = MAP_BOUNDS[player.map];
      if (!bounds || Math.hypot(destination[0] - escapePosition[0], destination[1] - escapePosition[1], destination[2] - escapePosition[2]) > 58 ||
          destination[0] < bounds[0] || destination[0] > bounds[1] || destination[2] < bounds[2] || destination[2] > bounds[3]) return;
      escapePosition = destination;
      if (player.state) player.state.position = destination;
    }
    const attackerId = player.webTrappedBy;
    player.webTrappedBy = null;
    player.webTrappedUntil = 0;
    player.webTrapAnchor = null;
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, { type: "web-escaped", id: player.id, attackerId, method, pearls: player.pearls, position: escapePosition });
  }

  handleFlightStrikeStart(player) {
    const now = Date.now();
    if (player.power !== "flight" || player.health <= 0 || player.grabbedBy || player.webTrappedUntil > now || player.flightStrike) return;
    if (now - (player.lastFlightStrikeAt || 0) < FLIGHT_STRIKE_COOLDOWN) {
      this.send(player.socket, { type: "ability-cooldown", ability: "flight-strike", cooldownUntil: (player.lastFlightStrikeAt || 0) + FLIGHT_STRIKE_COOLDOWN });
      return;
    }
    player.lastFlightStrikeAt = now;
    player.flightStrike = { startedAt: now, map: player.map };
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, { type: "flight-strike-started", id: player.id, map: player.map, startedAt: now, cooldownUntil: now + FLIGHT_STRIKE_COOLDOWN });
  }

  handleFlightStrikeImpact(player, action) {
    const now = Date.now();
    const strike = player.flightStrike;
    if (!strike || strike.map !== player.map || now - strike.startedAt < 500 || now - strike.startedAt > 16000) return;
    const point = safeVector(action.point);
    const bounds = MAP_BOUNDS[player.map];
    if (!bounds || point[0] < bounds[0] || point[0] > bounds[1] || point[2] < bounds[2] || point[2] > bounds[3]) return;
    player.flightStrike = null;
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, { type: "flight-strike-impact", id: player.id, map: player.map, point, seed: (strike.startedAt ^ point[0] * 997 ^ point[2] * 991) >>> 0 });
    if (player.map !== "pvpArena") return;
    for (const target of this.players.values()) {
      if (target.id === player.id || target.map !== player.map || target.health <= 0 || !target.state?.position) continue;
      const dx = target.state.position[0] - point[0];
      const dz = target.state.position[2] - point[2];
      const distance = Math.hypot(dx, dz);
      if (distance > 10.5 || this.blockDamage(player, target, "flight")) continue;
      const scale = Math.max(0.28, 1 - distance / 11);
      const damage = Math.round(28 * scale);
      target.health = Math.max(0, target.health - damage);
      target.respawnAt = target.health <= 0 ? now + DEFEAT_RESPAWN_DELAY : 0;
      this.savePlayer(target.socket, target);
      const safeDistance = distance > 0.1 ? distance : 1;
      const dirX = distance > 0.1 ? dx / safeDistance : 0;
      const dirZ = distance > 0.1 ? dz / safeDistance : 1;
      this.broadcast({ type: "pvp-hit", attackerId: player.id, targetId: target.id, health: target.health, damage, impulse: [dirX * 12 * scale, 6.5 * scale, dirZ * 12 * scale], defeated: target.health <= 0, respawnAt: target.respawnAt, power: "flight", position: point });
      if (target.health <= 0) this.announceDefeat(target, player);
    }
  }

  handleFlightStrikeCancel(player) {
    if (!player.flightStrike) return;
    player.flightStrike = null;
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, { type: "flight-strike-cancelled", id: player.id, map: player.map });
  }

  expireWebStatus(player, now = Date.now()) {
    let changed = false;
    if (player.webPullEndsAt && now >= player.webPullEndsAt) {
      const attackerId = player.webPulledBy;
      player.webPulledBy = null;
      player.webPullEndsAt = 0;
      this.broadcast({ type: "web-pull-end", attackerId, targetId: player.id });
      changed = true;
    }
    if (player.webTrappedUntil && now >= player.webTrappedUntil) {
      const attackerId = player.webTrappedBy;
      player.webTrappedBy = null;
      player.webTrappedUntil = 0;
      player.webTrapAnchor = null;
      this.broadcast({ type: "web-released", attackerId, targetId: player.id });
      changed = true;
    }
    if (changed) this.savePlayer(player.socket, player);
  }

  clearWebStatus(player) {
    player.webPulledBy = null;
    player.webPullEndsAt = 0;
    player.webTrappedBy = null;
    player.webTrappedUntil = 0;
    player.webTrapAnchor = null;
  }

  releaseWebVictimsBy(attackerId) {
    for (const target of this.players.values()) {
      let changed = false;
      if (target.webPulledBy === attackerId) {
        target.webPulledBy = null;
        target.webPullEndsAt = 0;
        this.broadcast({ type: "web-pull-end", attackerId, targetId: target.id });
        changed = true;
      }
      if (target.webTrappedBy === attackerId) {
        target.webTrappedBy = null;
        target.webTrappedUntil = 0;
        target.webTrapAnchor = null;
        this.broadcast({ type: "web-released", attackerId, targetId: target.id });
        changed = true;
      }
      if (changed) this.savePlayer(target.socket, target);
    }
    for (const [trapId, trap] of this.webTraps) {
      if (trap.attackerId !== attackerId) continue;
      this.webTraps.delete(trapId);
      this.broadcast({ type: "web-trap-removed", trapId });
    }
  }

  handleRobotShieldToggle(player) {
    if (player.power !== "robot" || player.health <= 0 || player.grabbedBy) return;
    const now = Date.now();
    this.expireShield(player, now);
    if (!player.shieldActive && now < (player.shieldCooldownUntil || 0)) {
      this.send(player.socket, { type: "ability-cooldown", ability: "robot-shield", cooldownUntil: player.shieldCooldownUntil });
      return;
    }
    player.shieldActive = !player.shieldActive;
    if (player.shieldActive) {
      player.shieldEndsAt = now + ROBOT_SHIELD_DURATION;
    } else {
      player.shieldEndsAt = 0;
      player.shieldCooldownUntil = now + ROBOT_SHIELD_COOLDOWN;
    }
    this.savePlayer(player.socket, player);
    this.broadcastShieldState(player);
  }

  expireShield(player, now = Date.now()) {
    if (!player.shieldActive || now < (player.shieldEndsAt || 0)) return false;
    player.shieldActive = false;
    player.shieldEndsAt = 0;
    player.shieldCooldownUntil = now + ROBOT_SHIELD_COOLDOWN;
    this.savePlayer(player.socket, player);
    this.broadcastShieldState(player);
    return true;
  }

  broadcastShieldState(player) {
    this.broadcast({
      type: "shield-state",
      id: player.id,
      active: Boolean(player.shieldActive),
      endsAt: player.shieldEndsAt || 0,
      cooldownUntil: player.shieldCooldownUntil || 0,
    });
  }

  blockDamage(attacker, target, power) {
    this.expireShield(target);
    if (target.power !== "robot" || !target.shieldActive) return false;
    this.broadcast({
      type: "shield-blocked",
      attackerId: attacker?.id || null,
      targetId: target.id,
      power,
      health: target.health,
      shieldEndsAt: target.shieldEndsAt,
      position: target.state?.position || [0, 0, 0],
    });
    return true;
  }

  releaseVictimsHeldBy(attackerId) {
    for (const target of this.players.values()) {
      if (target.grabbedBy !== attackerId) continue;
      target.grabbedBy = null;
      target.grabbedMode = null;
      target.holdEscapeProgress = 0;
      target.lastHoldEscapeTapAt = 0;
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "player-released", attackerId, targetId: target.id });
    }
  }

  resolvePvpAttack(attacker, action) {
    if (attacker.map !== "pvpArena" || attacker.health <= 0 || !attacker.state?.position) return false;
    const spec = ATTACKS[attacker.power];
    if (!spec) return false;
    const now = Date.now();
    if (now - (attacker.lastAttackAt || 0) < spec.cooldown) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: attacker.power === "robot" ? "robot-shot" : "primary", cooldownUntil: (attacker.lastAttackAt || 0) + spec.cooldown });
      return false;
    }
    attacker.lastAttackAt = now;
    this.savePlayer(attacker.socket, attacker);
    this.send(attacker.socket, { type: "ability-cooldown", ability: attacker.power === "robot" ? "robot-shot" : "primary", cooldownUntil: now + spec.cooldown });
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
      if (this.blockDamage(attacker, target, attacker.power)) continue;
      target.health = Math.max(0, target.health - spec.damage);
      target.respawnAt = target.health <= 0 ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
      if (target.health <= 0) {
        target.grabbedBy = null;
        target.grabbedMode = null;
        target.holdEscapeProgress = 0;
        target.lastHoldEscapeTapAt = 0;
      }
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
      if (target.health <= 0) this.announceDefeat(target, attacker);
    }
    return true;
  }

  announceDefeat(target, attacker) {
    if (target.activeDefeatId) return;
    target.defeatSequence = (Number(target.defeatSequence) || 0) + 1;
    target.activeDefeatId = `${target.id}:${target.defeatSequence}`;
    target.respawnAt = target.respawnAt || Date.now() + DEFEAT_RESPAWN_DELAY;
    target.grabbedBy = null;
    target.grabbedMode = null;
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    target.shieldActive = false;
    target.shieldEndsAt = 0;
    target.flightStrike = null;
    this.clearWebStatus(target);
    this.releaseVictimsHeldBy(target.id);
    this.releaseWebVictimsBy(target.id);
    this.savePlayer(target.socket, target);
    const forward = safeVector(target.state?.forward, [0, 0, -1]);
    const quaternion = Array.isArray(target.state?.quaternion)
      ? target.state.quaternion.slice(0, 4).map((value, index) => Number.isFinite(Number(value)) ? Number(value) : (index === 3 ? 1 : 0))
      : [0, 0, 0, 1];
    let seed = 2166136261;
    for (const char of target.activeDefeatId) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    this.broadcastToMap(target.map, {
      type: "player-defeated",
      defeatId: target.activeDefeatId,
      id: target.id,
      attackerId: attacker?.id || null,
      map: target.map,
      position: safeVector(target.state?.position),
      orientation: quaternion,
      forward,
      power: target.power,
      seed,
      defeatedAt: Date.now(),
      respawnAt: target.respawnAt,
    });
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
    this.releaseVictimsHeldBy(player.id);
    this.releaseWebVictimsBy(player.id);
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

  broadcastToMap(map, message) {
    const encoded = JSON.stringify(message);
    for (const player of this.players.values()) {
      if (player.map !== map) continue;
      try {
        player.socket.send(encoded);
      } catch {
        // Closed sockets are cleaned up by the runtime callbacks.
      }
    }
  }
}
