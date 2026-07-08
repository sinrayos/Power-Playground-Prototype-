const server = process.env.MULTIPLAYER_URL || "wss://power-playground-multiplayer.algomezg29.workers.dev";
const room = `TEST${Date.now().toString(36).slice(-4).toUpperCase()}`;

function openClient() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${server}/room/${room}`);
    const messages = [];
    const timeout = setTimeout(() => reject(new Error("WebSocket smoke test timed out.")), 8000);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      messages.push(message);
      if (message.type === "welcome") {
        clearTimeout(timeout);
        resolve({ socket, messages, id: message.id });
      }
    });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed.")), { once: true });
  });
}

const first = await openClient();
first.socket.send(JSON.stringify({ type: "hello", username: "Alpha", power: "speed", map: "pvpArena" }));
const second = await openClient();
second.socket.send(JSON.stringify({ type: "hello", username: "Beta", icon: "symbol-webs", power: "webs", map: "lobby" }));
await new Promise((resolve) => setTimeout(resolve, 100));
second.socket.send(JSON.stringify({ type: "hello", username: "Beta", icon: "symbol-webs", power: "webs", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "state", state: { position: [0, 1, 650], forward: [1, 0, 0], yaw: 1, move: 1 } }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [2, 1, 650], forward: [-1, 0, 0], quaternion: [0, 0, 0, 1], pose: Array.from({ length: 19 }, () => [0, 1, 0, 0, 0, 0, 1, 1, 1, 1]), web: null } }));
first.socket.send(JSON.stringify({ type: "entities", map: "pvpArena", snapshot: { dummies: [], objects: [{ id: 0, p: [1, 1, 650], q: [0, 0, 0, 1], v: [1, 0, 0] }] } }));
second.socket.send(JSON.stringify({ type: "action", action: { kind: "visual-batch", events: [{ type: "sfx", name: "webPunch" }, { type: "beam", start: [2, 2, 650], end: [0, 2, 650], color: 16777215, radius: 0.03, life: 0.2 }] } }));
await new Promise((resolve) => setTimeout(resolve, 150));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "attack" } }));
await new Promise((resolve) => setTimeout(resolve, 500));

first.socket.send(JSON.stringify({ type: "hello", username: "Alpha", power: "strength", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "strength-grab-player", targetId: second.id } }));
await new Promise((resolve) => setTimeout(resolve, 120));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "strength-throw-player", targetId: second.id, forward: [1, 0, 0] } }));
await new Promise((resolve) => setTimeout(resolve, 180));
first.socket.send(JSON.stringify({ type: "action", action: {
  kind: "strength-entity-throw",
  map: "pvpArena",
  entityType: "box",
  entityId: 0,
  position: [0, 1, 650],
  quaternion: [0, 0, 0, 1],
  velocity: [22, 4, 0],
} }));
await new Promise((resolve) => setTimeout(resolve, 100));
second.socket.send(JSON.stringify({ type: "action", action: {
  kind: "strength-entity-contact",
  entityType: "box",
  entityId: 0,
  position: [2, 1, 650],
} }));
await new Promise((resolve) => setTimeout(resolve, 220));

if (!first.messages.some((message) => message.type === "player-state" && message.id === second.id)) {
  throw new Error("The first client did not receive the second client's state.");
}
if (!second.messages.some((message) => message.type === "pvp-hit" && message.targetId === second.id && message.health === 93)) {
  throw new Error("The server did not apply authoritative PvP damage.");
}
if (!second.messages.some((message) => message.type === "entities" && message.snapshot.objects.length === 1)) {
  throw new Error("The second client did not receive the shared object snapshot.");
}
if (!first.messages.some((message) => message.type === "player-updated" && message.player.username === "Beta" && message.player.icon === "symbol-webs" && message.player.map === "lobby") ||
    !first.messages.some((message) => message.type === "player-updated" && message.player.username === "Beta" && message.player.map === "pvpArena")) {
  throw new Error("Lobby-to-map presence updates were not relayed.");
}
if (!first.messages.some((message) => message.type === "player-action" && message.action.kind === "visual-batch")) {
  throw new Error("Exact visual and SFX batches were not relayed.");
}
if (!first.messages.some((message) => message.type === "player-grabbed" && message.targetId === second.id)) {
  throw new Error("The server did not authorize the Strength Guy player grab.");
}
if (!second.messages.some((message) => message.type === "player-thrown" && message.targetId === second.id && message.health === 75)) {
  throw new Error("The server did not apply the player throw damage.");
}
if (!second.messages.some((message) => message.type === "pvp-hit" && message.targetId === second.id && message.health === 63)) {
  throw new Error("The thrown entity did not damage the opposing player.");
}

// A telekinetically held player keeps reporting its collision-resolved Cannon
// position; the Worker must not replace it with the holder's aim point.
first.socket.send(JSON.stringify({ type: "hello", username: "Alpha", power: "telekinesis", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "state", state: { position: [0, 1, 650], forward: [1, 0, 0], telekinesisPoint: [20, 2, 650] } }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [2, 1, 650], forward: [-1, 0, 0] } }));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "telekinesis-grab-player", targetId: second.id } }));
await new Promise((resolve) => setTimeout(resolve, 120));
second.socket.send(JSON.stringify({ type: "state", state: { position: [3, 1, 650], forward: [-1, 0, 0] } }));
second.socket.send(JSON.stringify({ type: "action", action: { kind: "telekinesis-slam-player", holderId: first.id, position: [3, 1, 650], impactSpeed: 8 } }));
await new Promise((resolve) => setTimeout(resolve, 180));
if (!first.messages.some((message) => message.type === "player-state" && message.id === second.id && message.state.position[0] === 3)) {
  throw new Error("The Worker teleported a telekinetically held player instead of preserving its collision-resolved position.");
}
if (!second.messages.some((message) => message.type === "pvp-hit" && message.targetId === second.id && message.slam === true)) {
  throw new Error("Telekinetic wall-slam damage/effects were not synchronized.");
}

// Robot shield state is authoritative and the robot primary cooldown rejects a
// second shot, so only one blocked-hit event can be produced here.
first.socket.send(JSON.stringify({ type: "action", action: { kind: "telekinesis-throw-player", targetId: second.id, forward: [1, 0, 0] } }));
await new Promise((resolve) => setTimeout(resolve, 100));
first.socket.send(JSON.stringify({ type: "hello", username: "Alpha", power: "robot", map: "pvpArena" }));
second.socket.send(JSON.stringify({ type: "hello", username: "Beta", power: "robot", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "state", state: { position: [0, 1, 650], forward: [1, 0, 0] } }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [2, 1, 650], forward: [-1, 0, 0] } }));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "robot-shield-toggle" } }));
await new Promise((resolve) => setTimeout(resolve, 120));
second.socket.send(JSON.stringify({ type: "action", action: { kind: "attack" } }));
second.socket.send(JSON.stringify({ type: "action", action: { kind: "attack" } }));
await new Promise((resolve) => setTimeout(resolve, 220));
if (!first.messages.some((message) => message.type === "shield-state" && message.id === first.id && message.active === true)) {
  throw new Error("Defense Shield activation was not synchronized.");
}
const blockedShots = first.messages.filter((message) => message.type === "shield-blocked" && message.targetId === first.id);
if (blockedShots.length !== 1) {
  throw new Error(`Expected one authoritative blocked Energy Shot, received ${blockedShots.length}.`);
}
if (first.messages.some((message) => message.type === "pvp-hit" && message.targetId === first.id)) {
  throw new Error("Defense Shield did not block multiplayer damage.");
}

// Spider web pull, direct nets, and armed floor traps are all authorized by the
// Worker and synchronized to every client.
const third = await openClient();
third.socket.send(JSON.stringify({ type: "hello", username: "Gamma", power: "speed", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "hello", username: "Alpha", power: "webs", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "state", state: { position: [0, 1, 650], forward: [1, 0, 0] } }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [3, 1, 650], forward: [-1, 0, 0] } }));
third.socket.send(JSON.stringify({ type: "state", state: { position: [8, 1, 650], forward: [-1, 0, 0] } }));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "web-pull-player", targetId: second.id } }));
await new Promise((resolve) => setTimeout(resolve, 120));
if (!second.messages.some((message) => message.type === "web-pull-start" && message.targetId === second.id)) {
  throw new Error("Spider web pull was not synchronized to the target player.");
}
first.socket.send(JSON.stringify({ type: "action", action: { kind: "web-pull-release", targetId: second.id } }));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "web-trap-player", targetId: second.id } }));
await new Promise((resolve) => setTimeout(resolve, 150));
if (!second.messages.some((message) => message.type === "web-trapped" && message.targetId === second.id)) {
  throw new Error("A direct Spider net did not trap the target player.");
}
const trapCountDuringCooldown = third.messages.filter((message) => message.type === "web-trap-placed").length;
first.socket.send(JSON.stringify({ type: "action", action: { kind: "web-trap-place", point: [5, 1, 650] } }));
await new Promise((resolve) => setTimeout(resolve, 180));
if (third.messages.filter((message) => message.type === "web-trap-placed").length !== trapCountDuringCooldown) {
  throw new Error("The Worker accepted a floor trap during the five-second direct-net cooldown.");
}
await new Promise((resolve) => setTimeout(resolve, 4900));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "web-trap-place", point: [5, 1, 650] } }));
await new Promise((resolve) => setTimeout(resolve, 100));
third.socket.send(JSON.stringify({ type: "state", state: { position: [5, 1, 650], forward: [-1, 0, 0] } }));
await new Promise((resolve) => setTimeout(resolve, 180));
if (!third.messages.some((message) => message.type === "web-trap-placed")) {
  throw new Error("The armed floor web was not synchronized.");
}
if (!third.messages.some((message) => message.type === "web-trapped" && message.targetId === third.id)) {
  throw new Error("The armed floor web did not trap a player who entered it.");
}

first.socket.close();
second.socket.close();
third.socket.close();
console.log(`Remote room relay passed (${room}).`);
