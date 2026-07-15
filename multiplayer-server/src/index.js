const MAX_PLAYERS = 12;
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
  fire: { damage: 11, range: 3.2, knockback: 3.6, cone: 0.08, cooldown: 450 },
};
const APPROVED_POWERS = new Set([...Object.keys(ATTACKS), "training"]);
const TELEKINESIS_GRAB_COOLDOWN = 1500;
const STRENGTH_PLAYER_GRAB_COOLDOWN = 1500;
const ROBOT_SHIELD_DURATION = 5000;
const ROBOT_SHIELD_COOLDOWN = 5000;
const TELEPORT_BACKSTAB_COOLDOWN = 1500;
const PHASE_BOOTS_DURATION = 5000;
const PHASE_BOOTS_COOLDOWN = 10000;
const HOLD_ESCAPE_TAP_GAIN = 0.065;
const HOLD_ESCAPE_DECAY_PER_SECOND = 0.12;
const WEB_PULL_COOLDOWN = 1000;
const WEB_TRAP_COOLDOWN = 5000;
const PLAYER_ICON_PATTERN = /^(portrait|symbol)-(speed|strength|teleport|telekinesis|flight|jump|robot|webs|fire|training)$/;
const WEB_TRAP_DURATION = 3200;
const DEFEAT_RESPAWN_DELAY = 4400;
const FLIGHT_STRIKE_COOLDOWN = 12000;
const FIRE_PUNCH_COOLDOWN = 450;
const FIRE_COMBO_WINDOW = 1600;
const FIREBALL_MIN_CHARGE = 1000;
const FIREBALL_MAX_CHARGE = 2600;
const FIREBALL_COOLDOWN = 3000;
const FIRE_DASH_COOLDOWN = 3000;
const FIRE_DASH_DISTANCE = 18;
const FIRE_DASH_DURATION = 680;
const FIRE_UP_DASH_DURATION = 480;
const FIRE_DASH_TRAIL_DURATION = 2800;
const FIRE_RING_COOLDOWN = 8000;
const FIRE_RING_DURATION = 5000;
const FIRE_BURN_TICKS = 3;
const FIRE_BURN_TICK_MS = 600;
const FIRE_COMBO_RECOVERY = 2000;
const MAP_BOUNDS = {
  hub: [-23.6, 23.6, -23.6, 23.6], speedTrack: [-56.5, 56.5, 70.5, 161.5], minionArena: [-35.5, 35.5, 184.5, 253.5],
  strengthPit: [-35.5, 35.5, 282.5, 353.5], city: [-94, 94, 366, 554], pvpArena: [-38, 38, 612, 688], powerStation: [-43, 124, 724, 842],
};
const GAME_MAPS = ["hub", "speedTrack", "minionArena", "strengthPit", "city", "pvpArena", "powerStation"];
const ONLINE_MODES = new Set(["hangout", "pvp", "duels"]);
const DUEL_QUEUE_CONFIG = {
  "1v1": { required: 2, center: [-18, 930] },
  "2v2": { required: 4, center: [18, 930] },
  "3v3": { required: 6, center: [-18, 950] },
  "1v1v1": { required: 3, center: [18, 950] },
};
const DUEL_SPAWNS = {
  hub: { a: [[-19, 1.2, -18], [-15, 1.2, -18], [-11, 1.2, -18]], b: [[19, 1.2, 18], [15, 1.2, 18], [11, 1.2, 18]], ffa: [[-18, 1.2, -16], [18, 1.2, -16], [0, 1.2, 19]] },
  speedTrack: { a: [[-36, 1.2, 92], [-32, 1.2, 97], [-28, 1.2, 92]], b: [[36, 1.2, 140], [32, 1.2, 135], [28, 1.2, 140]], ffa: [[-36, 1.2, 96], [36, 1.2, 96], [0, 1.2, 145]] },
  minionArena: { a: [[-25, 1.2, 194], [-20, 1.2, 198], [-15, 1.2, 194]], b: [[25, 1.2, 244], [20, 1.2, 240], [15, 1.2, 244]], ffa: [[-26, 1.2, 196], [26, 1.2, 196], [0, 1.2, 245]] },
  strengthPit: { a: [[-25, 1.2, 294], [-20, 1.2, 298], [-15, 1.2, 294]], b: [[25, 1.2, 342], [20, 1.2, 338], [15, 1.2, 342]], ffa: [[-25, 1.2, 296], [25, 1.2, 296], [0, 1.2, 342]] },
  city: { a: [[-42, 1.2, 410], [-36, 1.2, 416], [-30, 1.2, 410]], b: [[42, 1.2, 510], [36, 1.2, 504], [30, 1.2, 510]], ffa: [[-44, 1.2, 416], [44, 1.2, 416], [0, 1.2, 512]] },
  pvpArena: { a: [[-31, 1.2, 632], [-25, 1.2, 636], [-19, 1.2, 632]], b: [[31, 1.2, 668], [25, 1.2, 664], [19, 1.2, 668]], ffa: [[-31, 1.2, 632], [31, 1.2, 632], [0, 1.2, 678]] },
  powerStation: { a: [[-34, 1.2, 746], [-27, 1.2, 750], [-20, 1.2, 746]], b: [[34, 1.2, 778], [27, 1.2, 774], [20, 1.2, 778]], ffa: [[-34, 1.2, 746], [34, 1.2, 746], [0, 1.2, 778]] },
};
const POWER_STATION_CENTER_Z = 786;
const TRAIN_PERIOD_MS = 45000;
const TRAIN_WARNING_MS = 6500;
const TRAIN_ACTIVE_MS = 3300;
const TRAIN_TRAVEL_X = 155;
const TRAIN_HALF_LENGTH = 21.5;
const TRAIN_HALF_WIDTH = 4.9;
const TRAIN_HEIGHT = 6.9;
function isCombatPlayer(player) {
  return player?.mode === "pvp" || (player?.mode === "duels" && Boolean(player.matchId));
}
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
    this.fireTrails = new Map();
    this.fireRings = new Map();
    this.fireProjectiles = new Map();
    this.lastHazardPhase = new Map();
    this.duelQueues = new Map(Object.keys(DUEL_QUEUE_CONFIG).map((mode) => [mode, new Set()]));
    this.duelQueueCountdowns = new Map();
    this.duelMatch = null;
    this.ready = this.restoreSessions();
  }

  async restoreSessions() {
    for (const socket of this.ctx.getWebSockets()) {
      const player = socket.deserializeAttachment();
      if (player?.id) {
        const restored = { mode: "hangout", damageSession: 0, damageRound: 0, damageMatch: 0, queueMode: null, matchId: null, teamId: null, spawnProtectedUntil: 0, ...player, socket };
        this.players.set(player.id, restored);
        if (restored.queueMode && this.duelQueues.has(restored.queueMode)) this.duelQueues.get(restored.queueMode).add(restored.id);
      }
    }
    this.hostId = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || null;
    const savedDuel = await this.ctx.storage.get("duelState");
    if (savedDuel?.match) {
      this.duelMatch = {
        ...savedDuel.match,
        votes: new Map(savedDuel.match.votes || []),
        powers: new Map(savedDuel.match.powers || []),
        eliminated: new Set(savedDuel.match.eliminated || []),
        rematchVotes: new Set(savedDuel.match.rematchVotes || []),
      };
    }
    this.duelQueueCountdowns = new Map(savedDuel?.queueCountdowns || []);
  }

  async fetch(request) {
    await this.ready;
    if (this.players.size >= MAX_PLAYERS) return json({ error: "Room is full." }, 409);

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const id = crypto.randomUUID();
    const player = { id, username: "Player", icon: "portrait-speed", power: "speed", map: "hub", mode: "hangout", state: null, health: 100, maxHealth: 100, pearls: 5, respawnAt: 0, defeatSequence: 0, activeDefeatId: null, grabbedBy: null, grabbedMode: null, holdEscapeProgress: 0, lastHoldEscapeTapAt: 0, webPulledBy: null, webPullEndsAt: 0, webTrappedBy: null, webTrappedUntil: 0, webTrapAnchor: null, lastAttackAt: 0, lastGrabAt: 0, lastTelekinesisGrabAt: 0, lastWebPullAt: 0, lastWebTrapAt: 0, lastFlightStrikeAt: 0, flightStrike: null, shieldActive: false, shieldEndsAt: 0, shieldCooldownUntil: 0, phaseBootsActive: false, phaseBootsEndsAt: 0, phaseBootsCooldownUntil: 0, fireChargeStartedAt: 0, lastFireballAt: 0, lastFireDashAt: 0, lastFireRingAt: 0, fireCombo: null, fireBurn: null, lastTrainHitId: null, damageSession: 0, damageRound: 0, damageMatch: 0, queueMode: null, matchId: null, teamId: null, spawnProtectedUntil: 0, joinedAt: Date.now() };

    server.serializeAttachment(player);
    this.ctx.acceptWebSocket(server);
    this.players.set(id, { ...player, socket: server });
    if (!this.hostId) this.hostId = id;

    this.send(server, {
      type: "welcome",
      id,
      hostId: this.hostId,
      entities: [...this.entitySnapshots.entries()].map(([map, snapshot]) => ({ map, snapshot })),
      hazards: [this.powerStationTrainState(Date.now())],
      duel: this.duelSnapshotFor(id),
      queues: this.duelQueueSnapshot(),
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
        player.phaseBootsActive = false;
        player.phaseBootsEndsAt = 0;
        this.clearFireEffectsBy(player.id);
      }
      const requestedMode = String(message.mode || player.mode || "hangout");
      if (ONLINE_MODES.has(requestedMode) && !player.matchId) player.mode = requestedMode;
      const requestedMap = String(message.map || "hub").slice(0, 24);
      const activeDuel = player.mode === "duels" && player.matchId === this.duelMatch?.id ? this.duelMatch : null;
      const nextMap = player.mode === "duels" && !player.matchId ? "duelLobby" : activeDuel?.map || requestedMap;
      const requestedPowerValue = String(message.power || "speed").slice(0, 24);
      const requestedPower = APPROVED_POWERS.has(requestedPowerValue) ? requestedPowerValue : "speed";
      const nextPower = player.mode === "duels" && !player.matchId ? "training" : activeDuel?.powers.get(player.id) || requestedPower;
      if (player.power !== nextPower || !player.maxHealth) {
        player.power = nextPower;
        player.maxHealth = maxHealthForPower(nextPower);
        player.health = player.maxHealth;
        player.pearls = nextPower === "speed" ? 5 : 0;
        player.shieldActive = false;
        player.shieldEndsAt = 0;
        player.shieldCooldownUntil = 0;
        player.phaseBootsActive = false;
        player.phaseBootsEndsAt = 0;
        player.phaseBootsCooldownUntil = 0;
        player.fireChargeStartedAt = 0;
        player.fireCombo = null;
        player.fireBurn = null;
        this.clearFireEffectsBy(player.id);
        this.clearWebStatus(player);
      }
      player.map = nextMap;
      if (player.mode === "pvp" && player.map !== "lobby") player.spawnProtectedUntil = Date.now() + 2000;
      player.username = sanitizeUsername(message.username);
      player.icon = sanitizePlayerIcon(message.icon);
      this.savePlayer(socket, player);
      this.broadcast({ type: "player-updated", player: this.publicPlayer(player) }, player.id);
      if (player.mode === "duels" && !player.matchId) this.send(socket, { type: "duel-lobby", queues: this.duelQueueSnapshot() });
      return;
    }

    if (message.type === "state" && message.state && typeof message.state === "object") {
      const now = Date.now();
      this.updateMapHazards(now);
      if (player.respawnAt && now >= player.respawnAt && player.mode !== "duels") {
        player.health = player.maxHealth || maxHealthForPower(player.power);
        player.respawnAt = 0;
        player.activeDefeatId = null;
        player.spawnProtectedUntil = now + 2000;
        player.fireBurn = null;
        this.broadcast({ type: "player-respawn", id: player.id, health: player.health });
        this.send(socket, { type: "player-respawn", id: player.id, health: player.health });
      }
      this.expireShield(player);
      this.expireWebStatus(player);
      this.expirePhaseBoots(player);
      this.processFireEffects(now);
      const holder = player.grabbedBy ? this.players.get(player.grabbedBy) : null;
      if (player.grabbedBy && !holder) {
        player.grabbedBy = null;
        player.grabbedMode = null;
        player.holdEscapeProgress = 0;
        player.lastHoldEscapeTapAt = 0;
      }
      const reportedPosition = safeVector(message.state.position);
      const previousPosition = safeVector(player.state?.position, reportedPosition);
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
        phaseBootsActive: this.isPhaseBootsActive(player),
        phaseBootsEndsAt: player.phaseBootsEndsAt || 0,
        phaseBootsCooldownUntil: player.phaseBootsCooldownUntil || 0,
      };
      this.savePlayer(socket, player);
      this.extendFireMovement(player, previousPosition, statePosition, now);
      this.processFireEffects(now);
      if (player.mode === "duels" && player.map === "duelLobby" && !player.matchId) this.updateDuelQueueFromPosition(player);
      if (this.checkPowerStationTrainHit(player, now)) return;
      this.checkWebTraps(player);
      this.broadcast({ type: "player-state", id: player.id, state: player.state }, player.id);
      return;
    }

    if (message.type === "action") {
      const action = message.action && typeof message.action === "object" ? message.action : {};
      if (action.kind === "duel-vote") return this.handleDuelVote(player, action);
      if (action.kind === "duel-select-power") return this.handleDuelPowerSelection(player, action);
      if (action.kind === "duel-rematch") return this.handleDuelRematch(player);
      if (action.kind === "duel-return") return this.returnPlayerToDuelLobby(player);
      if (player.health <= 0 || player.respawnAt) return;
      if (action.kind === "strength-grab-player") return this.handleStrengthGrab(player, action);
      if (action.kind === "strength-throw-player") return this.handleStrengthThrow(player, action);
      if (action.kind === "telekinesis-grab-player") return this.handleTelekinesisGrab(player, action);
      if (action.kind === "telekinesis-entity-grab") return this.handleTelekinesisEntityGrab(player, action);
      if (action.kind === "telekinesis-throw-player") return this.handleTelekinesisThrow(player, action);
      if (action.kind === "telekinesis-slam-player") return this.handleTelekinesisSlam(player, action);
      if (action.kind === "hold-escape-tap") return this.handleHoldEscapeTap(player);
      if (action.kind === "robot-shield-toggle") return this.handleRobotShieldToggle(player);
      if (action.kind === "phase-boots") return this.handlePhaseBoots(player);
      if (action.kind === "web-pull-player") return this.handleWebPull(player, action);
      if (action.kind === "web-pull-release") return this.handleWebPullRelease(player, action);
      if (action.kind === "web-trap-player") return this.handleWebTrapPlayer(player, action);
      if (action.kind === "web-trap-place") return this.handleWebTrapPlace(player, action);
      if (action.kind === "web-escape") return this.handleWebEscape(player, action);
      if (action.kind === "flight-strike-start") return this.handleFlightStrikeStart(player);
      if (action.kind === "flight-strike-impact") return this.handleFlightStrikeImpact(player, action);
      if (action.kind === "flight-strike-cancel") return this.handleFlightStrikeCancel(player);
      if (action.kind === "fire-primary-down") return this.handleFirePrimaryDown(player);
      if (action.kind === "fire-primary-release") return this.handleFirePrimaryRelease(player, action);
      if (action.kind === "fire-dash") return this.handleFireDash(player, action);
      if (action.kind === "fire-up-dash") return this.handleFireUpDash(player);
      if (action.kind === "fire-ring") return this.handleFireRing(player, action);
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

  duelQueueSnapshot() {
    return Object.fromEntries(Object.entries(DUEL_QUEUE_CONFIG).map(([mode, config]) => [mode, {
      required: config.required,
      playerIds: [...this.duelQueues.get(mode)].filter((id) => this.players.has(id)),
      countdownAt: this.duelQueueCountdowns.get(mode) || 0,
    }]));
  }

  duelSnapshotFor(playerId) {
    const match = this.duelMatch;
    if (!match || !match.playerIds.includes(playerId)) return null;
    return this.publicDuelMatch(match);
  }

  publicDuelMatch(match = this.duelMatch) {
    if (!match) return null;
    return {
      id: match.id,
      mode: match.mode,
      phase: match.phase,
      phaseEndsAt: match.phaseEndsAt,
      map: match.map,
      maps: GAME_MAPS,
      players: match.playerIds.map((id) => this.players.get(id)).filter(Boolean).map((player) => this.publicPlayer(player)),
      teams: match.teams,
      scores: match.scores,
      votes: Object.fromEntries(match.votes || []),
      probabilities: this.duelMapProbabilities(match),
      powers: Object.fromEntries(match.powers || []),
      round: match.round,
      rematchVotes: [...(match.rematchVotes || [])],
      winnerTeam: match.winnerTeam || null,
    };
  }

  sendToMatch(message, match = this.duelMatch) {
    if (!match) return;
    for (const id of match.playerIds) {
      const player = this.players.get(id);
      if (player) this.send(player.socket, message);
    }
  }

  updateDuelQueueFromPosition(player) {
    const [x, _y, z] = safeVector(player.state?.position);
    const nextMode = Object.entries(DUEL_QUEUE_CONFIG).find(([, config]) => Math.hypot(x - config.center[0], z - config.center[1]) <= 4)?.[0] || null;
    if (player.queueMode === nextMode) return;
    if (player.queueMode && this.duelQueues.has(player.queueMode)) {
      this.duelQueues.get(player.queueMode).delete(player.id);
      if (this.duelQueues.get(player.queueMode).size < DUEL_QUEUE_CONFIG[player.queueMode].required) this.duelQueueCountdowns.delete(player.queueMode);
    }
    player.queueMode = nextMode;
    if (nextMode) {
      for (const queue of this.duelQueues.values()) queue.delete(player.id);
      this.duelQueues.get(nextMode).add(player.id);
      const required = DUEL_QUEUE_CONFIG[nextMode].required;
      if (!this.duelMatch && this.duelQueues.get(nextMode).size >= required && !this.duelQueueCountdowns.has(nextMode)) this.duelQueueCountdowns.set(nextMode, Date.now() + 3000);
    }
    this.savePlayer(player.socket, player);
    this.broadcast({ type: "duel-queues", queues: this.duelQueueSnapshot() });
    this.scheduleDuelTick();
  }

  scheduleDuelTick() {
    this.persistDuelState();
    const candidates = [...this.duelQueueCountdowns.values()];
    if (this.duelMatch?.phaseEndsAt) candidates.push(this.duelMatch.phaseEndsAt);
    for (const player of this.players.values()) if (player.fireBurn?.nextTickAt) candidates.push(player.fireBurn.nextTickAt);
    for (const trail of this.fireTrails.values()) candidates.push(trail.nextProcessAt || trail.expiresAt);
    for (const ring of this.fireRings.values()) candidates.push(ring.nextProcessAt || ring.expiresAt);
    for (const projectile of this.fireProjectiles.values()) candidates.push(projectile.nextProcessAt || projectile.expiresAt);
    if (!candidates.length) return;
    const next = Math.max(Date.now() + 50, Math.min(...candidates));
    this.ctx.storage.setAlarm(next).catch(() => {});
  }

  persistDuelState() {
    const match = this.duelMatch ? {
      ...this.duelMatch,
      votes: [...this.duelMatch.votes],
      powers: [...this.duelMatch.powers],
      eliminated: [...this.duelMatch.eliminated],
      rematchVotes: [...this.duelMatch.rematchVotes],
    } : null;
    this.ctx.waitUntil(this.ctx.storage.put("duelState", { match, queueCountdowns: [...this.duelQueueCountdowns] }));
  }

  async alarm() {
    await this.ready;
    this.processFireEffects(Date.now());
    this.advanceDuelState();
  }

  advanceDuelState(now = Date.now()) {
    for (const [mode, countdownAt] of [...this.duelQueueCountdowns]) {
      const queue = this.duelQueues.get(mode);
      const required = DUEL_QUEUE_CONFIG[mode].required;
      for (const id of [...queue]) if (!this.players.has(id)) queue.delete(id);
      if (queue.size < required) {
        this.duelQueueCountdowns.delete(mode);
        continue;
      }
      if (countdownAt <= now && !this.duelMatch) {
        this.duelQueueCountdowns.delete(mode);
        this.createDuelMatch(mode, [...queue].slice(0, required), now);
        break;
      }
      if (countdownAt <= now && this.duelMatch) this.duelQueueCountdowns.delete(mode);
    }
    const match = this.duelMatch;
    if (match?.phaseEndsAt && match.phaseEndsAt <= now) {
      if (match.phase === "voting") this.beginDuelPowerSelection(match, now);
      else if (match.phase === "power-select" || match.phase === "intermission") this.startDuelRound(match, now);
      else if (match.phase === "victory") this.returnMatchPlayersToLobby("Rematch window closed");
    }
    this.broadcast({ type: "duel-queues", queues: this.duelQueueSnapshot() });
    this.scheduleDuelTick();
  }

  createDuelMatch(mode, playerIds, now = Date.now()) {
    const teams = {};
    const scores = {};
    if (mode === "1v1v1") {
      playerIds.forEach((id, index) => { teams[id] = `P${index + 1}`; scores[`P${index + 1}`] = 0; });
    } else {
      const half = playerIds.length / 2;
      playerIds.forEach((id, index) => { teams[id] = index < half ? "A" : "B"; });
      scores.A = 0;
      scores.B = 0;
    }
    const match = {
      id: crypto.randomUUID(), mode, playerIds, teams, scores, phase: "voting", phaseEndsAt: now + 10000,
      phaseStartedAt: now, map: null, votes: new Map(), powers: new Map(), round: 0, eliminated: new Set(),
      selectionShortened: false, rematchVotes: new Set(), winnerTeam: null,
    };
    this.duelMatch = match;
    for (const id of playerIds) {
      for (const queue of this.duelQueues.values()) queue.delete(id);
      const player = this.players.get(id);
      if (!player) continue;
      player.queueMode = null;
      player.matchId = match.id;
      player.teamId = teams[id];
      player.mode = "duels";
      player.damageMatch = 0;
      player.damageRound = 0;
      player.power = "training";
      player.map = "duelLobby";
      player.health = 100;
      player.maxHealth = 100;
      this.savePlayer(player.socket, player);
    }
    this.sendToMatch({ type: "duel-phase", duel: this.publicDuelMatch(match) }, match);
    this.broadcast({ type: "duel-queues", queues: this.duelQueueSnapshot() });
    this.scheduleDuelTick();
  }

  handleDuelVote(player, action) {
    const match = this.duelMatch;
    const map = String(action.map || "");
    if (!match || match.phase !== "voting" || !match.playerIds.includes(player.id) || !GAME_MAPS.includes(map) || match.votes.has(player.id)) return;
    match.votes.set(player.id, map);
    this.sendToMatch({ type: "duel-phase", duel: this.publicDuelMatch(match) }, match);
    this.persistDuelState();
  }

  duelMapProbabilities(match = this.duelMatch) {
    if (!match) return {};
    const voteCounts = Object.fromEntries(GAME_MAPS.map((map) => [map, 0]));
    for (const map of match.votes?.values?.() || []) if (map in voteCounts) voteCounts[map] += 1;
    const total = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
    if (!total) return Object.fromEntries(GAME_MAPS.map((map) => [map, 0]));
    return Object.fromEntries(GAME_MAPS.map((map) => [map, Math.round(voteCounts[map] / total * 1000) / 10]));
  }

  chooseDuelMap(match) {
    const votes = [...(match.votes?.values?.() || [])].filter((map) => GAME_MAPS.includes(map));
    if (!votes.length) return GAME_MAPS[crypto.getRandomValues(new Uint32Array(1))[0] % GAME_MAPS.length];
    return votes[crypto.getRandomValues(new Uint32Array(1))[0] % votes.length];
  }

  beginDuelPowerSelection(match, now = Date.now()) {
    if (this.duelMatch !== match) return;
    match.map = this.chooseDuelMap(match);
    match.phase = "power-select";
    match.phaseStartedAt = now;
    match.phaseEndsAt = now + 12000;
    match.selectionShortened = false;
    this.sendToMatch({ type: "duel-phase", duel: this.publicDuelMatch(match) }, match);
    this.scheduleDuelTick();
  }

  handleDuelPowerSelection(player, action) {
    const match = this.duelMatch;
    const power = String(action.power || "");
    if (!match || !match.playerIds.includes(player.id) || !["power-select", "intermission"].includes(match.phase) || !ATTACKS[power]) return;
    match.powers.set(player.id, power);
    if (match.phase === "intermission") player.power = power;
    this.savePlayer(player.socket, player);
    if (match.phase === "power-select" && !match.selectionShortened && match.playerIds.every((id) => match.powers.has(id))) {
      match.selectionShortened = true;
      if (match.phaseEndsAt - Date.now() > 2000) match.phaseEndsAt = Math.max(Date.now() + 2000, match.phaseEndsAt - 2000);
    }
    this.sendToMatch({ type: "duel-phase", duel: this.publicDuelMatch(match) }, match);
    this.scheduleDuelTick();
  }

  duelSpawnFor(match, playerId) {
    const config = DUEL_SPAWNS[match.map] || DUEL_SPAWNS.hub;
    if (match.mode === "1v1v1") return config.ffa[match.playerIds.indexOf(playerId) % config.ffa.length];
    const team = match.teams[playerId];
    const teammates = match.playerIds.filter((id) => match.teams[id] === team);
    return config[team === "A" ? "a" : "b"][teammates.indexOf(playerId) % 3];
  }

  startDuelRound(match, now = Date.now()) {
    if (this.duelMatch !== match) return;
    match.phase = "round";
    match.phaseEndsAt = 0;
    match.round += 1;
    match.eliminated = new Set();
    match.winnerTeam = null;
    for (const id of match.playerIds) {
      const player = this.players.get(id);
      if (!player) continue;
      const power = match.powers.get(id) || "speed";
      const spawn = this.duelSpawnFor(match, id);
      player.power = power;
      player.map = match.map;
      player.maxHealth = maxHealthForPower(power);
      player.health = player.maxHealth;
      player.respawnAt = 0;
      player.activeDefeatId = null;
      player.spawnProtectedUntil = now + 2500;
      player.fireChargeStartedAt = 0;
      player.fireCombo = null;
      player.fireBurn = null;
      this.clearFireEffectsBy(player.id);
      player.damageRound = 0;
      player.state = { ...(player.state || {}), position: spawn, health: player.health };
      this.clearWebStatus(player);
      this.savePlayer(player.socket, player);
    }
    const values = Object.values(match.scores);
    const maxScore = Math.max(...values);
    const announcement = maxScore === 4 && values.filter((score) => score === 4).length > 1 ? "SUDDEN DEATH" : maxScore === 4 ? "MATCH POINT" : `ROUND ${match.round}`;
    this.sendToMatch({ type: "duel-round-start", duel: this.publicDuelMatch(match), spawns: Object.fromEntries(match.playerIds.map((id) => [id, this.duelSpawnFor(match, id)])), announcement }, match);
    this.broadcastLeaderboard();
    this.persistDuelState();
  }

  handleDuelDefeat(target, attacker) {
    const match = this.duelMatch;
    if (!match || match.phase !== "round" || target.matchId !== match.id || match.eliminated.has(target.id)) return;
    match.eliminated.add(target.id);
    target.respawnAt = 0;
    const defeatedTeam = match.teams[target.id];
    if (match.mode === "1v1v1") {
      const hazardWinner = match.playerIds
        .map((id) => this.players.get(id))
        .filter((player) => player && player.id !== target.id && !match.eliminated.has(player.id))
        .sort((a, b) => (b.health || 0) - (a.health || 0) || a.joinedAt - b.joinedAt)[0];
      const scoringTeam = attacker && attacker.id !== target.id && attacker.matchId === match.id ? match.teams[attacker.id] : match.teams[hazardWinner?.id];
      if (scoringTeam) match.scores[scoringTeam] = (match.scores[scoringTeam] || 0) + 1;
      this.endDuelRound(match, scoringTeam);
      return;
    }
    const teamEliminated = match.playerIds.filter((id) => match.teams[id] === defeatedTeam).every((id) => match.eliminated.has(id));
    if (!teamEliminated) {
      this.sendToMatch({ type: "duel-score", duel: this.publicDuelMatch(match) }, match);
      this.persistDuelState();
      return;
    }
    const scoringTeam = defeatedTeam === "A" ? "B" : "A";
    match.scores[scoringTeam] += 1;
    this.endDuelRound(match, scoringTeam);
  }

  endDuelRound(match, scoringTeam) {
    match.playerIds.forEach((id) => this.clearFireEffectsBy(id));
    const winnerTeam = Object.keys(match.scores).find((team) => match.scores[team] >= 5) || null;
    if (winnerTeam) {
      match.phase = "victory";
      match.phaseStartedAt = Date.now();
      match.phaseEndsAt = Date.now() + 20000;
      match.winnerTeam = winnerTeam;
      match.rematchVotes = new Set();
      this.sendToMatch({ type: "duel-victory", duel: this.publicDuelMatch(match), winnerIds: match.playerIds.filter((id) => match.teams[id] === winnerTeam) }, match);
    } else {
      match.phase = "intermission";
      match.phaseStartedAt = Date.now();
      match.phaseEndsAt = Date.now() + 5000;
      this.sendToMatch({ type: "duel-intermission", duel: this.publicDuelMatch(match), scoringTeam }, match);
    }
    this.broadcastLeaderboard();
    this.scheduleDuelTick();
  }

  handleDuelRematch(player) {
    const match = this.duelMatch;
    if (!match || match.phase !== "victory" || !match.playerIds.includes(player.id)) return;
    match.rematchVotes.add(player.id);
    if (match.playerIds.every((id) => this.players.has(id) && match.rematchVotes.has(id))) {
      match.scores = Object.fromEntries(Object.keys(match.scores).map((team) => [team, 0]));
      match.votes = new Map();
      match.powers = new Map();
      match.round = 0;
      match.map = null;
      match.winnerTeam = null;
      match.phase = "voting";
      match.phaseStartedAt = Date.now();
      match.phaseEndsAt = Date.now() + 10000;
      match.playerIds.forEach((id) => {
        const member = this.players.get(id);
        if (member) { member.damageMatch = 0; member.damageRound = 0; this.savePlayer(member.socket, member); }
      });
    }
    this.sendToMatch({ type: "duel-phase", duel: this.publicDuelMatch(match) }, match);
    this.scheduleDuelTick();
  }

  returnPlayerToDuelLobby(player) {
    if (player.matchId && this.duelMatch?.playerIds.includes(player.id)) return this.returnMatchPlayersToLobby(`${player.username} returned to the lobby`);
    player.mode = "duels";
    player.map = "duelLobby";
    player.power = "training";
    player.matchId = null;
    player.teamId = null;
    player.queueMode = null;
    player.health = 100;
    player.maxHealth = 100;
    player.respawnAt = 0;
    player.activeDefeatId = null;
    player.fireChargeStartedAt = 0;
    player.fireCombo = null;
    player.fireBurn = null;
    this.clearFireEffectsBy(player.id);
    player.state = { ...(player.state || {}), position: [0, 1.2, 915], health: 100 };
    this.savePlayer(player.socket, player);
    this.send(player.socket, { type: "duel-lobby", queues: this.duelQueueSnapshot(), position: [0, 1.2, 915] });
  }

  returnMatchPlayersToLobby(reason = "Match complete") {
    const match = this.duelMatch;
    if (!match) return;
    for (const id of match.playerIds) {
      const player = this.players.get(id);
      if (!player) continue;
      player.matchId = null;
      player.teamId = null;
      player.damageMatch = 0;
      player.damageRound = 0;
      this.returnPlayerToDuelLobby(player);
    }
    this.sendToMatch({ type: "duel-cancelled", reason }, match);
    this.duelMatch = null;
    for (const [mode, queue] of this.duelQueues) {
      if (queue.size >= DUEL_QUEUE_CONFIG[mode].required) this.duelQueueCountdowns.set(mode, Date.now() + 3000);
    }
    this.scheduleDuelTick();
  }

  powerStationTrainState(now = Date.now()) {
    const cycle = Math.floor(now / TRAIN_PERIOD_MS);
    const periodStart = cycle * TRAIN_PERIOD_MS;
    const activeFrom = periodStart + TRAIN_PERIOD_MS - TRAIN_ACTIVE_MS;
    const activeUntil = periodStart + TRAIN_PERIOD_MS;
    const warningAt = activeFrom - TRAIN_WARNING_MS;
    const phase = now >= activeFrom && now < activeUntil
      ? "active"
      : now >= warningAt && now < activeFrom
        ? "warning"
        : "idle";
    return {
      map: "powerStation",
      eventId: `train:${cycle}`,
      phase,
      warningAt,
      activeFrom,
      activeUntil,
      nextArrivalAt: activeFrom,
      direction: cycle % 2 === 0 ? 1 : -1,
    };
  }

  updateMapHazards(now = Date.now()) {
    const train = this.powerStationTrainState(now);
    const key = `${train.eventId}:${train.phase}`;
    if (this.lastHazardPhase.get(train.map) === key) return;
    this.lastHazardPhase.set(train.map, key);
    this.broadcastToMap(train.map, { type: "map-hazard", ...train });
  }

  checkPowerStationTrainHit(player, now = Date.now()) {
    if (player.map !== "powerStation" || !isCombatPlayer(player) || player.health <= 0 || player.respawnAt || !player.state?.position) return false;
    const train = this.powerStationTrainState(now);
    if (train.phase !== "active" || player.lastTrainHitId === train.eventId) return false;
    const [x, y, z] = safeVector(player.state.position);
    const progress = Math.max(0, Math.min(1, (now - train.activeFrom) / Math.max(1, train.activeUntil - train.activeFrom)));
    const trainStartX = -TRAIN_TRAVEL_X * train.direction;
    const trainX = trainStartX + (TRAIN_TRAVEL_X * train.direction - trainStartX) * progress;
    if (Math.abs(x - trainX) > TRAIN_HALF_LENGTH || y < -1.2 || y > TRAIN_HEIGHT || Math.abs(z - (POWER_STATION_CENTER_Z + 20.5)) > TRAIN_HALF_WIDTH) return false;
    player.lastTrainHitId = train.eventId;
    player.health = 0;
    player.respawnAt = player.mode === "duels" ? 0 : now + DEFEAT_RESPAWN_DELAY;
    player.grabbedBy = null;
    player.grabbedMode = null;
    player.holdEscapeProgress = 0;
    player.lastHoldEscapeTapAt = 0;
    player.shieldActive = false;
    player.shieldEndsAt = 0;
    player.flightStrike = null;
    this.clearWebStatus(player);
    this.releaseVictimsHeldBy(player.id);
    this.releaseWebVictimsBy(player.id);
    this.savePlayer(player.socket, player);
    const impulseX = train.direction * 28;
    this.broadcastToMap(player.map, {
      type: "pvp-hit",
      attackerId: null,
      targetId: player.id,
      health: 0,
      damage: player.maxHealth || maxHealthForPower(player.power),
      impulse: [impulseX, 8, 0],
      defeated: true,
      respawnAt: player.respawnAt,
      power: "train",
      position: [x, y, z],
    });
    this.announceDefeat(player, null);
    return true;
  }

  handleStrengthGrab(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "strength") return;
    if (!this.canDamage(attacker, target) || attacker.health <= 0 || target.health <= 0) return;
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
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - 18);
    this.recordDamage(attacker, target, 18, previousHealth);
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
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
    if (!this.canDamage(attacker, target) || attacker.grabbedBy || target.grabbedBy || attacker.health <= 0 || target.health <= 0) return;
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
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - 9);
    this.recordDamage(attacker, target, 9, previousHealth);
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
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
    if (!this.canDamage(holder, target) || this.blockDamage(holder, target, "telekinesis")) return;
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - 5);
    this.recordDamage(holder, target, 5, previousHealth);
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? now + DEFEAT_RESPAWN_DELAY : 0;
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
    if (attacker.power !== throwPower || !isCombatPlayer(attacker) || attacker.health <= 0) return;
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
    if (!attacker || !this.canDamage(attacker, target) || target.health <= 0) return;
    thrown.hitIds.add(target.id);
    if (this.blockDamage(attacker, target, thrown.power)) return;
    const horizontalLength = Math.hypot(thrown.velocity[0], thrown.velocity[2]) || 1;
    const direction = [thrown.velocity[0] / horizontalLength, 0, thrown.velocity[2] / horizontalLength];
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - thrown.damage);
    this.recordDamage(attacker, target, thrown.damage, previousHealth);
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
    this.savePlayer(target.socket, target);
    this.broadcast({ type: "pvp-hit", attackerId: attacker.id, targetId: target.id, health: target.health, damage: thrown.damage, impulse: [direction[0] * 7, 3, direction[2] * 7], defeated: target.health <= 0, respawnAt: target.respawnAt, power: thrown.power });
    if (target.health <= 0) this.announceDefeat(target, attacker);
  }

  handleStrongSword(attacker) {
    if (attacker.power !== "strength" || !isCombatPlayer(attacker) || attacker.grabbedBy || !attacker.state?.position) return;
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
      if (!this.canDamage(attacker, target) || this.blockDamage(attacker, target, "strength")) continue;
      const previousHealth = target.health;
      target.health = Math.max(0, target.health - 14);
      this.recordDamage(attacker, target, 14, previousHealth);
      target.respawnAt = target.health <= 0 && target.mode !== "duels" ? now + DEFEAT_RESPAWN_DELAY : 0;
      this.savePlayer(target.socket, target);
      this.broadcast({ type: "pvp-hit", attackerId: attacker.id, targetId: target.id, health: target.health, damage: 14, impulse: [(dx / distance) * 4, 1.5, (dz / distance) * 4], defeated: target.health <= 0, respawnAt: target.respawnAt, power: "strength" });
      if (target.health <= 0) this.announceDefeat(target, attacker);
    }
  }

  handleTeleportBackstab(attacker, action) {
    const target = this.players.get(String(action.targetId || ""));
    if (!target || target.id === attacker.id || attacker.power !== "teleport" || !this.canDamage(attacker, target)) return;
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
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - 18);
    this.recordDamage(attacker, target, 18, previousHealth);
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? now + DEFEAT_RESPAWN_DELAY : 0;
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
    if (!this.canDamage(attacker, target) || attacker.health <= 0 || target.health <= 0) return null;
    if (attacker.grabbedBy || !attacker.state?.position || !target.state?.position) return null;
    const baseDx = target.state.position[0] - attacker.state.position[0];
    const baseDy = target.state.position[1] - attacker.state.position[1];
    const baseDz = target.state.position[2] - attacker.state.position[2];
    const distance = Math.hypot(baseDx, baseDy, baseDz);
    if (distance < 0.01 || distance > range) return null;
    const origin = safeVector(projectile.origin, attacker.state.position);
    const direction = safeVector(projectile.direction, attacker.state.forward || [0, 0, -1]);
    const directionLength = Math.hypot(...direction) || 1;
    const normalized = direction.map((value) => value / directionLength);
    const originLimit = projectile.mode === "pull" ? 16 : 2.8;
    if (Math.hypot(origin[0] - attacker.state.position[0], origin[1] - attacker.state.position[1], origin[2] - attacker.state.position[2]) > originLimit) return null;
    const bodyPoints = projectile.mode === "pull"
      ? [0.35, 0.82, 1.28, 1.72].map((height) => [target.state.position[0], target.state.position[1] + height, target.state.position[2]])
      : [target.state.position];
    let bestHit = null;
    for (const point of bodyPoints) {
      const dx = point[0] - origin[0];
      const dy = point[1] - origin[1];
      const dz = point[2] - origin[2];
      const along = dx * normalized[0] + dy * normalized[1] + dz * normalized[2];
      const missDistance = Math.hypot(dx - normalized[0] * along, dy - normalized[1] * along, dz - normalized[2] * along);
      if (along < 0 || along > range || (bestHit && missDistance >= bestHit.missDistance)) continue;
      bestHit = { point, along, missDistance };
    }
    if (!bestHit) return null;
    const flightMs = Number(projectile.flightMs);
    const expectedMs = Math.max(0, bestHit.along) / (projectile.mode === "pull" ? 48 : 38) * 1000;
    const hitRadius = projectile.mode === "pull" ? 1.7 : 1.15;
    if (bestHit.missDistance > hitRadius || !Number.isFinite(flightMs) || Math.abs(flightMs - expectedMs) > 380) return null;
    if (attacker.map === "pvpArena" && PVP_WEB_BLOCKERS.some((box) => segmentIntersectsAabb(origin, bestHit.point, box))) return null;
    return { target, distance };
  }

  handleWebPull(attacker, action) {
    const result = this.webTarget(attacker, action.targetId, 360, { ...action, mode: "pull" });
    if (!result) return;
    const now = Date.now();
    if (now - (attacker.lastWebPullAt || 0) < WEB_PULL_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "web-pull", cooldownUntil: (attacker.lastWebPullAt || 0) + WEB_PULL_COOLDOWN });
      return;
    }
    attacker.lastWebPullAt = now;
    this.savePlayer(attacker.socket, attacker);
    if (this.blockDamage(attacker, result.target, "webs")) return;
    const duration = Math.max(520, Math.min(2600, result.distance * 34));
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
    if (!this.canDamage(attacker, target) || this.blockDamage(attacker, target, "webs")) return false;
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
    if (!isCombatPlayer(player)) return;
    for (const target of this.players.values()) {
      if (target.id === player.id || target.map !== player.map || target.health <= 0 || !target.state?.position) continue;
      const dx = target.state.position[0] - point[0];
      const dz = target.state.position[2] - point[2];
      const distance = Math.hypot(dx, dz);
      if (distance > 10.5 || !this.canDamage(player, target) || this.blockDamage(player, target, "flight")) continue;
      const scale = Math.max(0.28, 1 - distance / 11);
      const damage = Math.round(28 * scale);
      const previousHealth = target.health;
      target.health = Math.max(0, target.health - damage);
      this.recordDamage(player, target, damage, previousHealth);
      target.respawnAt = target.health <= 0 && target.mode !== "duels" ? now + DEFEAT_RESPAWN_DELAY : 0;
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

  isPhaseBootsActive(player, now = Date.now()) {
    return player.power === "teleport" && Boolean(player.phaseBootsActive) && now < (player.phaseBootsEndsAt || 0);
  }

  handlePhaseBoots(player) {
    const now = Date.now();
    this.expirePhaseBoots(player, now);
    if (player.power !== "teleport" || player.health <= 0 || player.grabbedBy || player.webTrappedUntil > now) return;
    if (this.isPhaseBootsActive(player, now)) {
      this.send(player.socket, {
        type: "phase-boots-state",
        id: player.id,
        active: true,
        endsAt: player.phaseBootsEndsAt || 0,
        cooldownUntil: player.phaseBootsCooldownUntil || 0,
      });
      return;
    }
    if (now < (player.phaseBootsCooldownUntil || 0)) {
      this.send(player.socket, { type: "ability-cooldown", ability: "phase-boots", cooldownUntil: player.phaseBootsCooldownUntil });
      return;
    }
    player.phaseBootsActive = true;
    player.phaseBootsEndsAt = now + PHASE_BOOTS_DURATION;
    player.phaseBootsCooldownUntil = player.phaseBootsEndsAt + PHASE_BOOTS_COOLDOWN;
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, {
      type: "phase-boots-state",
      id: player.id,
      active: true,
      endsAt: player.phaseBootsEndsAt,
      cooldownUntil: player.phaseBootsCooldownUntil,
    });
  }

  expirePhaseBoots(player, now = Date.now()) {
    if (!player.phaseBootsActive || now < (player.phaseBootsEndsAt || 0)) return false;
    player.phaseBootsActive = false;
    player.phaseBootsEndsAt = 0;
    if (!player.phaseBootsCooldownUntil || player.phaseBootsCooldownUntil < now) player.phaseBootsCooldownUntil = now + PHASE_BOOTS_COOLDOWN;
    this.savePlayer(player.socket, player);
    this.broadcastToMap(player.map, {
      type: "phase-boots-state",
      id: player.id,
      active: false,
      endsAt: 0,
      cooldownUntil: player.phaseBootsCooldownUntil,
    });
    return true;
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

  fireDirection(player, requested) {
    const fallback = safeVector(player.state?.forward, [0, 0, -1]);
    const candidate = safeVector(requested, fallback);
    const normalize = (vector) => {
      const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
      return [vector[0] / length, vector[1] / length, vector[2] / length];
    };
    const forward = normalize(fallback);
    const direction = normalize(candidate);
    const alignment = forward[0] * direction[0] + forward[1] * direction[1] + forward[2] * direction[2];
    return alignment >= 0.35 ? direction : forward;
  }

  nearestFireTarget(attacker, origin, direction, range, radius) {
    let best = null;
    let bestAlong = Infinity;
    for (const target of this.players.values()) {
      if (!this.canDamage(attacker, target) || !target.state?.position) continue;
      const offset = [target.state.position[0] - origin[0], target.state.position[1] + 0.7 - origin[1], target.state.position[2] - origin[2]];
      const along = offset[0] * direction[0] + offset[1] * direction[1] + offset[2] * direction[2];
      if (along < 0 || along > range || along >= bestAlong) continue;
      const missX = offset[0] - direction[0] * along;
      const missY = offset[1] - direction[1] * along;
      const missZ = offset[2] - direction[2] * along;
      if (Math.hypot(missX, missY, missZ) > radius) continue;
      best = target;
      bestAlong = along;
    }
    return best;
  }

  applyFireDamage(attacker, target, damage, source, position = null, knockback = 0) {
    if (!attacker || attacker.power !== "fire" || attacker.health <= 0 || attacker.respawnAt || !this.canDamage(attacker, target)) return 0;
    if (this.blockDamage(attacker, target, "fire")) return 0;
    const previousHealth = target.health;
    target.health = Math.max(0, target.health - Math.max(0, Number(damage) || 0));
    const verified = this.recordDamage(attacker, target, damage, previousHealth);
    if (!verified) return 0;
    const dx = target.state.position[0] - attacker.state.position[0];
    const dz = target.state.position[2] - attacker.state.position[2];
    const length = Math.hypot(dx, dz) || 1;
    target.respawnAt = target.health <= 0 && target.mode !== "duels" ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
    if (target.health <= 0) {
      target.fireBurn = null;
      target.grabbedBy = null;
      target.grabbedMode = null;
    }
    this.savePlayer(target.socket, target);
    this.broadcast({
      type: "pvp-hit",
      attackerId: attacker.id,
      targetId: target.id,
      health: target.health,
      damage: verified,
      impulse: [dx / length * knockback, Math.min(2.5, knockback * 0.3), dz / length * knockback],
      defeated: target.health <= 0,
      respawnAt: target.respawnAt,
      power: "fire",
      fireSource: source,
      position: position || target.state.position,
    });
    if (target.health <= 0) this.announceDefeat(target, attacker);
    return verified;
  }

  applyFireBurn(attacker, target, source, now = Date.now()) {
    if (!this.canDamage(attacker, target) || attacker.power !== "fire" || target.health <= 0) return false;
    target.fireBurn = {
      id: crypto.randomUUID(),
      attackerId: attacker.id,
      source,
      ticksLeft: FIRE_BURN_TICKS,
      nextTickAt: now + FIRE_BURN_TICK_MS,
      endsAt: now + FIRE_BURN_TICK_MS * FIRE_BURN_TICKS + 150,
    };
    this.savePlayer(target.socket, target);
    this.broadcastToMap(target.map, { type: "fire-effect", effect: "burn", map: target.map, attackerId: attacker.id, targetId: target.id, source, endsAt: target.fireBurn.endsAt });
    this.scheduleDuelTick();
    return true;
  }

  handleFirePrimaryDown(player) {
    if (player.power !== "fire" || player.health <= 0 || player.respawnAt || player.grabbedBy || !player.state?.position) return;
    const now = Date.now();
    if (now < (player.lastAttackAt || 0) + FIRE_PUNCH_COOLDOWN) {
      player.fireChargeStartedAt = 0;
      this.send(player.socket, { type: "ability-cooldown", ability: "fire-punch", cooldownUntil: (player.lastAttackAt || 0) + FIRE_PUNCH_COOLDOWN });
      this.savePlayer(player.socket, player);
      return;
    }
    player.fireChargeStartedAt = now >= (player.lastFireballAt || 0) + FIREBALL_COOLDOWN ? now : 0;
    this.savePlayer(player.socket, player);
  }

  handleFirePrimaryRelease(player, action) {
    if (player.power !== "fire" || player.health <= 0 || player.respawnAt || player.grabbedBy || !player.state?.position) return;
    const now = Date.now();
    const chargeStartedAt = Number(player.fireChargeStartedAt) || 0;
    const heldMs = chargeStartedAt ? Math.max(0, now - chargeStartedAt) : 0;
    player.fireChargeStartedAt = 0;
    this.savePlayer(player.socket, player);
    if (chargeStartedAt && heldMs >= FIREBALL_MIN_CHARGE && now >= (player.lastFireballAt || 0) + FIREBALL_COOLDOWN) {
      return this.handleFireball(player, action, heldMs, now);
    }
    return this.handleFlamePunch(player, action, now);
  }

  handleFlamePunch(attacker, action, now = Date.now()) {
    if (now - (attacker.lastAttackAt || 0) < FIRE_PUNCH_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-punch", cooldownUntil: (attacker.lastAttackAt || 0) + FIRE_PUNCH_COOLDOWN });
      return;
    }
    attacker.lastAttackAt = now;
    const origin = [attacker.state.position[0], attacker.state.position[1] + 0.72, attacker.state.position[2]];
    const direction = this.fireDirection(attacker, action.direction);
    const target = this.nearestFireTarget(attacker, origin, direction, 3.2, 1.2);
    const end = target ? [target.state.position[0], target.state.position[1] + 0.72, target.state.position[2]] : [origin[0] + direction[0] * 2.4, origin[1] + direction[1] * 2.4, origin[2] + direction[2] * 2.4];
    this.broadcastToMap(attacker.map, { type: "fire-effect", effect: "punch", map: attacker.map, attackerId: attacker.id, origin, end });
    this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-punch", cooldownUntil: now + FIRE_PUNCH_COOLDOWN });
    const hadCombo = Boolean(attacker.fireCombo?.count);
    const combo = attacker.fireCombo;
    const count = target && combo?.targetId === target.id && now <= (combo.expiresAt || 0) ? combo.count + 1 : 1;
    if (!target || !this.applyFireDamage(attacker, target, 11, "punch", end, count >= 3 ? 7 : 3.6)) {
      attacker.fireCombo = null;
      if (hadCombo) {
        attacker.lastAttackAt = now + (FIRE_COMBO_RECOVERY - FIRE_PUNCH_COOLDOWN);
        this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-punch", cooldownUntil: now + FIRE_COMBO_RECOVERY });
      }
      this.savePlayer(attacker.socket, attacker);
      this.send(attacker.socket, { type: "fire-combo", attackerId: attacker.id, count: 0, targetId: null, expiresAt: 0 });
      return;
    }
    attacker.fireCombo = { targetId: target.id, count, expiresAt: now + FIRE_COMBO_WINDOW };
    this.send(attacker.socket, { type: "fire-combo", attackerId: attacker.id, count, targetId: target.id, expiresAt: count >= 3 ? now + FIRE_COMBO_RECOVERY : attacker.fireCombo.expiresAt, triggered: count >= 3 });
    if (count >= 3) {
      attacker.fireCombo = null;
      attacker.lastAttackAt = now + (FIRE_COMBO_RECOVERY - FIRE_PUNCH_COOLDOWN);
      this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-punch", cooldownUntil: now + FIRE_COMBO_RECOVERY });
      this.applyFireBurn(attacker, target, "combo", now);
    }
    this.savePlayer(attacker.socket, attacker);
  }

  handleFireball(attacker, action, heldMs, now = Date.now()) {
    const charge = Math.max(0, Math.min(1, (Math.min(heldMs, FIREBALL_MAX_CHARGE) - FIREBALL_MIN_CHARGE) / (FIREBALL_MAX_CHARGE - FIREBALL_MIN_CHARGE)));
    const range = 24 + charge * 22;
    const radius = 0.85 + charge * 0.95;
    const damage = Math.round(18 + charge * 16);
    const origin = [attacker.state.position[0], attacker.state.position[1] + 0.82, attacker.state.position[2]];
    const direction = this.fireDirection(attacker, action.direction);
    const end = [origin[0] + direction[0] * range, origin[1] + direction[1] * range, origin[2] + direction[2] * range];
    const duration = Math.round(Math.max(360, Math.min(760, range / 64 * 1000)));
    const projectileId = crypto.randomUUID();
    attacker.lastFireballAt = now;
    attacker.fireCombo = null;
    this.savePlayer(attacker.socket, attacker);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "fireball", cooldownUntil: now + FIREBALL_COOLDOWN });
    this.fireProjectiles.set(projectileId, { id: projectileId, attackerId: attacker.id, map: attacker.map, start: origin, lastPoint: origin, direction, range, radius, damage, charge, startedAt: now, expiresAt: now + duration, nextProcessAt: now + 35 });
    this.broadcastToMap(attacker.map, { type: "fire-effect", effect: "fireball", map: attacker.map, attackerId: attacker.id, projectileId, start: origin, end, charge, duration });
    this.scheduleDuelTick();
  }

  handleFireDash(attacker, action) {
    if (attacker.power !== "fire" || attacker.health <= 0 || attacker.respawnAt || attacker.grabbedBy || !attacker.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastFireDashAt || 0) < FIRE_DASH_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-dash", cooldownUntil: (attacker.lastFireDashAt || 0) + FIRE_DASH_COOLDOWN });
      return;
    }
    const direction = this.fireDirection(attacker, action.direction);
    const horizontalLength = Math.hypot(direction[0], direction[2]) || 1;
    direction[0] /= horizontalLength;
    direction[1] = 0;
    direction[2] /= horizontalLength;
    const origin = safeVector(attacker.state.position);
    const id = crypto.randomUUID();
    attacker.lastFireDashAt = now;
    this.fireTrails.set(id, { id, kind: "forward", attackerId: attacker.id, map: attacker.map, points: [origin], totalDistance: 0, maxDistance: FIRE_DASH_DISTANCE + 1.5, radius: 1.35, dashEndsAt: now + FIRE_DASH_DURATION, expiresAt: now + FIRE_DASH_TRAIL_DURATION, nextProcessAt: now + 50, hitIds: new Set() });
    this.savePlayer(attacker.socket, attacker);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-dash", cooldownUntil: now + FIRE_DASH_COOLDOWN });
    this.broadcastToMap(attacker.map, { type: "fire-effect", effect: "dash", map: attacker.map, attackerId: attacker.id, points: [origin], direction, dashEndsAt: now + FIRE_DASH_DURATION, expiresAt: now + FIRE_DASH_TRAIL_DURATION });
    this.scheduleDuelTick();
  }

  handleFireUpDash(attacker) {
    if (attacker.power !== "fire" || attacker.health <= 0 || attacker.respawnAt || attacker.grabbedBy || !attacker.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastFireUpDashAt || 0) < FIRE_DASH_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-up-dash", cooldownUntil: (attacker.lastFireUpDashAt || 0) + FIRE_DASH_COOLDOWN });
      return;
    }
    attacker.lastFireUpDashAt = now;
    const start = safeVector(attacker.state.position);
    const id = crypto.randomUUID();
    this.fireTrails.set(id, { id, kind: "up", attackerId: attacker.id, map: attacker.map, points: [start], totalDistance: 0, maxDistance: 11, radius: 1.25, dashEndsAt: now + FIRE_UP_DASH_DURATION, expiresAt: now + FIRE_UP_DASH_DURATION + 80, nextProcessAt: now + 35, hitIds: new Set() });
    this.savePlayer(attacker.socket, attacker);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-up-dash", cooldownUntil: now + FIRE_DASH_COOLDOWN });
    this.broadcastToMap(attacker.map, { type: "fire-effect", effect: "up-dash", map: attacker.map, attackerId: attacker.id, start, dashEndsAt: now + FIRE_UP_DASH_DURATION });
    this.scheduleDuelTick();
  }

  handleFireRing(attacker, action) {
    if (attacker.power !== "fire" || attacker.health <= 0 || attacker.respawnAt || attacker.grabbedBy || !attacker.state?.position) return;
    const now = Date.now();
    if (now - (attacker.lastFireRingAt || 0) < FIRE_RING_COOLDOWN) {
      this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-ring", cooldownUntil: (attacker.lastFireRingAt || 0) + FIRE_RING_COOLDOWN });
      return;
    }
    const point = safeVector(attacker.state.position);
    const bounds = MAP_BOUNDS[attacker.map];
    if (bounds) {
      point[0] = Math.max(bounds[0], Math.min(bounds[1], point[0]));
      point[2] = Math.max(bounds[2], Math.min(bounds[3], point[2]));
    }
    const id = crypto.randomUUID();
    attacker.lastFireRingAt = now;
    this.fireRings.set(id, { id, attackerId: attacker.id, map: attacker.map, point, radius: 5.5, expiresAt: now + FIRE_RING_DURATION, nextProcessAt: now + 100, nextTicks: new Map(), tickCounts: new Map(), burnedIds: new Set() });
    this.savePlayer(attacker.socket, attacker);
    this.send(attacker.socket, { type: "ability-cooldown", ability: "fire-ring", cooldownUntil: now + FIRE_RING_COOLDOWN });
    this.broadcastToMap(attacker.map, { type: "fire-effect", effect: "ring", map: attacker.map, attackerId: attacker.id, ringId: id, point, radius: 5.5, expiresAt: now + FIRE_RING_DURATION });
    this.scheduleDuelTick();
  }

  extendFireMovement(player, previousPosition, reportedPosition, now = Date.now()) {
    if (player.power !== "fire" || !Array.isArray(reportedPosition)) return;
    for (const trail of this.fireTrails.values()) {
      if (trail.attackerId !== player.id || now > trail.dashEndsAt || trail.totalDistance >= trail.maxDistance) continue;
      const last = trail.points.at(-1) || safeVector(previousPosition);
      let dx = reportedPosition[0] - last[0];
      let dy = reportedPosition[1] - last[1];
      let dz = reportedPosition[2] - last[2];
      if (trail.kind === "up") {
        if (dy <= 0) continue;
        const horizontal = Math.hypot(dx, dz);
        const horizontalLimit = Math.max(0.35, dy * 0.8);
        if (horizontal > horizontalLimit) {
          const scale = horizontalLimit / horizontal;
          dx *= scale;
          dz *= scale;
        }
      } else {
        dy = Math.max(-0.8, Math.min(0.8, dy));
      }
      const distance = Math.hypot(dx, dy, dz);
      if (distance < 0.04) continue;
      const acceptedDistance = Math.min(distance, 4.5, trail.maxDistance - trail.totalDistance);
      const scale = acceptedDistance / distance;
      const next = [last[0] + dx * scale, last[1] + dy * scale, last[2] + dz * scale];
      trail.points.push(next);
      trail.totalDistance += acceptedDistance;
      trail.nextProcessAt = now;
    }
  }

  pointToFireTrailDistance(point, points) {
    let best = Infinity;
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      const segment = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const lengthSq = segment[0] ** 2 + segment[1] ** 2 + segment[2] ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * segment[0] + (point[1] - a[1]) * segment[1] + (point[2] - a[2]) * segment[2]) / lengthSq));
      best = Math.min(best, Math.hypot(point[0] - (a[0] + segment[0] * t), point[1] - (a[1] + segment[1] * t), point[2] - (a[2] + segment[2] * t)));
    }
    return best;
  }

  processFireEffects(now = Date.now()) {
    for (const [id, projectile] of this.fireProjectiles) {
      const attacker = this.players.get(projectile.attackerId);
      if (!attacker || attacker.health <= 0 || attacker.respawnAt || attacker.map !== projectile.map) {
        this.fireProjectiles.delete(id);
        continue;
      }
      const duration = Math.max(1, projectile.expiresAt - projectile.startedAt);
      const progress = Math.max(0, Math.min(1, (now - projectile.startedAt) / duration));
      const current = [
        projectile.start[0] + projectile.direction[0] * projectile.range * progress,
        projectile.start[1] + projectile.direction[1] * projectile.range * progress,
        projectile.start[2] + projectile.direction[2] * projectile.range * progress,
      ];
      let hitTarget = null;
      let hitDistance = Infinity;
      for (const target of this.players.values()) {
        if (!this.canDamage(attacker, target) || !target.state?.position) continue;
        const targetPoint = [target.state.position[0], target.state.position[1] + 0.7, target.state.position[2]];
        const distance = this.pointToFireTrailDistance(targetPoint, [projectile.lastPoint, current]);
        if (distance > projectile.radius || distance >= hitDistance) continue;
        hitTarget = target;
        hitDistance = distance;
      }
      if (hitTarget) {
        const point = [hitTarget.state.position[0], hitTarget.state.position[1] + 0.7, hitTarget.state.position[2]];
        const verified = this.applyFireDamage(attacker, hitTarget, projectile.damage, "fireball", point, 4.5);
        if (verified) this.applyFireBurn(attacker, hitTarget, "fireball", now);
        this.broadcastToMap(projectile.map, { type: "fire-effect", effect: "fireball-hit", map: projectile.map, attackerId: attacker.id, projectileId: id, targetId: hitTarget.id, point, verified: Boolean(verified) });
        this.fireProjectiles.delete(id);
        continue;
      }
      projectile.lastPoint = current;
      projectile.nextProcessAt = Math.min(projectile.expiresAt, now + 35);
      if (progress >= 1) this.fireProjectiles.delete(id);
    }
    for (const target of this.players.values()) {
      const burn = target.fireBurn;
      if (!burn) continue;
      const attacker = this.players.get(burn.attackerId);
      if (!attacker || burn.ticksLeft <= 0 || now > burn.endsAt || !this.canDamage(attacker, target)) {
        target.fireBurn = null;
        this.savePlayer(target.socket, target);
        continue;
      }
      while (target.fireBurn && burn.ticksLeft > 0 && now >= burn.nextTickAt) {
        burn.nextTickAt += FIRE_BURN_TICK_MS;
        burn.ticksLeft -= 1;
        this.applyFireDamage(attacker, target, 2, "burn", target.state?.position, 0);
        if (target.health <= 0) target.fireBurn = null;
      }
      if (target.fireBurn && burn.ticksLeft <= 0) target.fireBurn = null;
      this.savePlayer(target.socket, target);
    }
    for (const [id, trail] of this.fireTrails) {
      if (now >= trail.expiresAt) {
        this.fireTrails.delete(id);
        continue;
      }
      const attacker = this.players.get(trail.attackerId);
      if (!attacker || attacker.health <= 0 || attacker.respawnAt || attacker.map !== trail.map) {
        this.fireTrails.delete(id);
        continue;
      }
      trail.nextProcessAt = Math.min(trail.expiresAt, now + 250);
      for (const target of this.players.values()) {
        if (trail.hitIds.has(target.id) || !this.canDamage(attacker, target) || !target.state?.position) continue;
        if (this.pointToFireTrailDistance(target.state.position, trail.points) > trail.radius) continue;
        trail.hitIds.add(target.id);
        const source = trail.kind === "up" ? "up-dash" : "dash-trail";
        if (this.applyFireDamage(attacker, target, 4, source, target.state.position, 1.4)) this.applyFireBurn(attacker, target, source, now);
      }
    }
    for (const [id, ring] of this.fireRings) {
      if (now >= ring.expiresAt) {
        this.fireRings.delete(id);
        continue;
      }
      const attacker = this.players.get(ring.attackerId);
      if (!attacker || attacker.health <= 0 || attacker.respawnAt || attacker.map !== ring.map) {
        this.fireRings.delete(id);
        continue;
      }
      ring.nextProcessAt = Math.min(ring.expiresAt, now + 250);
      for (const target of this.players.values()) {
        if (!this.canDamage(attacker, target) || !target.state?.position) continue;
        const count = ring.tickCounts.get(target.id) || 0;
        if (count >= 5 || now < (ring.nextTicks.get(target.id) || 0)) continue;
        if (Math.hypot(target.state.position[0] - ring.point[0], target.state.position[2] - ring.point[2]) > ring.radius || Math.abs(target.state.position[1] - ring.point[1]) > 2.8) continue;
        ring.nextTicks.set(target.id, now + 1000);
        const verified = this.applyFireDamage(attacker, target, 5, "fire-ring", target.state.position, 0.8);
        if (!verified) continue;
        ring.tickCounts.set(target.id, count + 1);
        if (!ring.burnedIds.has(target.id)) {
          ring.burnedIds.add(target.id);
          this.applyFireBurn(attacker, target, "fire-ring", now);
        }
      }
    }
  }

  clearFireEffectsBy(playerId) {
    for (const [id, projectile] of this.fireProjectiles) if (projectile.attackerId === playerId) this.fireProjectiles.delete(id);
    for (const [id, trail] of this.fireTrails) if (trail.attackerId === playerId) this.fireTrails.delete(id);
    for (const [id, ring] of this.fireRings) if (ring.attackerId === playerId) this.fireRings.delete(id);
    for (const target of this.players.values()) {
      if (target.fireBurn?.attackerId !== playerId && target.id !== playerId) continue;
      target.fireBurn = null;
      if (target.socket) this.savePlayer(target.socket, target);
    }
  }

  canDamage(attacker, target) {
    if (!attacker || !target || attacker.id === target.id || attacker.map !== target.map || !isCombatPlayer(attacker) || !isCombatPlayer(target)) return false;
    const now = Date.now();
    if (now < (target.spawnProtectedUntil || 0) || target.health <= 0 || target.respawnAt) return false;
    if (attacker.mode === "duels" || target.mode === "duels") {
      const match = this.duelMatch;
      if (!match || match.phase !== "round" || attacker.matchId !== match.id || target.matchId !== match.id || match.eliminated.has(attacker.id) || match.eliminated.has(target.id)) return false;
      if (match.mode !== "1v1v1" && match.teams[attacker.id] === match.teams[target.id]) return false;
    } else if (attacker.mode !== "pvp" || target.mode !== "pvp") {
      return false;
    }
    return true;
  }

  recordDamage(attacker, target, requestedDamage, previousHealth) {
    if (!attacker || !target || attacker.id === target.id) return 0;
    const verified = Math.max(0, Math.min(Number(requestedDamage) || 0, Number(previousHealth) || 0));
    if (!verified) return 0;
    attacker.damageSession = (Number(attacker.damageSession) || 0) + verified;
    if (attacker.mode === "duels" && attacker.matchId === this.duelMatch?.id) {
      attacker.damageRound = (Number(attacker.damageRound) || 0) + verified;
      attacker.damageMatch = (Number(attacker.damageMatch) || 0) + verified;
    }
    this.savePlayer(attacker.socket, attacker);
    this.broadcastLeaderboard();
    return verified;
  }

  broadcastLeaderboard() {
    this.broadcast({ type: "leaderboard", players: [...this.players.values()].map((player) => this.publicPlayer(player)), duel: this.duelMatch ? this.publicDuelMatch(this.duelMatch) : null });
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
    if (!isCombatPlayer(attacker) || attacker.health <= 0 || !attacker.state?.position) return false;
    if (attacker.power === "fire") return false;
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
      if (target.id === attacker.id || target.map !== attacker.map || target.health <= 0 || !target.state?.position) continue;
      const dx = target.state.position[0] - origin[0];
      const dz = target.state.position[2] - origin[2];
      const distance = Math.hypot(dx, dz);
      if (distance > spec.range || distance < 0.01) continue;
      const dot = (dx / distance) * forward[0] + (dz / distance) * forward[2];
      if (!spec.radial && dot < spec.cone) continue;
      if (!this.canDamage(attacker, target) || this.blockDamage(attacker, target, attacker.power)) continue;
      const previousHealth = target.health;
      target.health = Math.max(0, target.health - spec.damage);
      this.recordDamage(attacker, target, spec.damage, previousHealth);
      target.respawnAt = target.health <= 0 && target.mode !== "duels" ? Date.now() + DEFEAT_RESPAWN_DELAY : 0;
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
    target.respawnAt = target.mode === "duels" ? 0 : target.respawnAt || Date.now() + DEFEAT_RESPAWN_DELAY;
    target.grabbedBy = null;
    target.grabbedMode = null;
    target.holdEscapeProgress = 0;
    target.lastHoldEscapeTapAt = 0;
    target.shieldActive = false;
    target.shieldEndsAt = 0;
    target.flightStrike = null;
    target.fireChargeStartedAt = 0;
    target.fireCombo = null;
    target.fireBurn = null;
    this.clearFireEffectsBy(target.id);
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
    if (target.mode === "duels") this.handleDuelDefeat(target, attacker);
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
    for (const queue of this.duelQueues.values()) queue.delete(player.id);
    if (this.duelMatch?.playerIds.includes(player.id)) {
      this.returnMatchPlayersToLobby(`${player.username || "A player"} disconnected — duel cancelled`);
    }
    this.releaseVictimsHeldBy(player.id);
    this.releaseWebVictimsBy(player.id);
    this.clearFireEffectsBy(player.id);
    this.broadcast({ type: "player-left", id: player.id });
    if (this.hostId === player.id) {
      this.hostId = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || null;
      this.broadcast({ type: "host-changed", hostId: this.hostId });
    }
  }

  publicPlayer(player) {
    if (!player) return null;
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
