import assert from "node:assert/strict";

const server = process.env.POWER_PLAYGROUND_TEST_SERVER || "ws://127.0.0.1:8787";
const room = `T${Date.now().toString(36).toUpperCase().slice(-7)}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connect(username) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${server}/room/${room}`);
    const messages = [];
    const timeout = setTimeout(() => reject(new Error(`${username} connection timed out`)), 8000);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      messages.push(message);
      if (message.type !== "welcome") return;
      clearTimeout(timeout);
      resolve({
        socket,
        id: message.id,
        welcome: message,
        messages,
        send(payload) { socket.send(JSON.stringify(payload)); },
        waitFor(predicate, waitMs = 5000) {
          return new Promise((resolveMessage, rejectMessage) => {
            const startedAt = Date.now();
            const poll = () => {
              const found = messages.find(predicate);
              if (found) return resolveMessage(found);
              if (Date.now() - startedAt >= waitMs) return rejectMessage(new Error(`${username} timed out waiting for message`));
              setTimeout(poll, 20);
            };
            poll();
          });
        },
      });
    });
    socket.addEventListener("error", reject, { once: true });
  });
}

const [phase, inactivePhase, shield, plain] = await Promise.all([connect("Phase"), connect("InactivePhase"), connect("Shield"), connect("Plain")]);
for (const [client, power] of [[phase, "teleport"], [inactivePhase, "teleport"], [shield, "robot"], [plain, "speed"]]) {
  client.send({ type: "hello", username: power, power, map: "powerStation", mode: "pvp" });
}

const initial = phase.welcome.hazards.find((hazard) => hazard.map === "powerStation");
let activeFrom = Number(initial.activeFrom);
let activeUntil = Number(initial.activeUntil);
let direction = Number(initial.direction) >= 0 ? 1 : -1;
if (Date.now() >= activeUntil - 900) {
  activeFrom += 45000;
  activeUntil += 45000;
  direction *= -1;
}
await wait(Math.max(0, activeFrom - Date.now() - 260));

phase.send({ type: "action", action: { kind: "phase-boots" } });
shield.send({ type: "action", action: { kind: "robot-shield-toggle" } });
await phase.waitFor((message) => message.type === "phase-boots-state" && message.id === phase.id && message.active);
await shield.waitFor((message) => message.type === "shield-state" && message.id === shield.id && message.active);
await wait(Math.max(0, activeFrom + 180 - Date.now()));

const startX = -155 * direction;
for (let sample = 0; sample < 12; sample += 1) {
  const progress = Math.max(0, Math.min(1, (Date.now() - activeFrom) / Math.max(1, activeUntil - activeFrom)));
  const trainX = startX + (155 * direction - startX) * progress;
  const state = { position: [trainX, 1.2, 806.5], forward: [direction, 0, 0], quaternion: [0, 0, 0, 1] };
  phase.send({ type: "state", state });
  inactivePhase.send({ type: "state", state });
  shield.send({ type: "state", state });
  plain.send({ type: "state", state });
  await wait(75);
}

const shieldBlock = await shield.waitFor((message) => message.type === "shield-blocked" && message.targetId === shield.id && message.power === "train");
assert.equal(shieldBlock.health, 100, "The train must not damage an active Defense Shield");
const shieldKnockback = await shield.waitFor((message) => message.type === "pvp-hit" && message.targetId === shield.id && message.trainBlocked);
assert.equal(shieldKnockback.defeated, false, "A shielded robot must survive the train");
assert.ok(Math.abs(shieldKnockback.impulse[0]) >= 28, "A shielded robot must still be knocked away by the train");

const defeat = await plain.waitFor((message) => message.type === "player-defeated" && message.id === plain.id && message.cause === "train");
assert.equal(defeat.cause, "train", "An unprotected Power Guy must collide with and be defeated by the train");
const inactivePhaseDefeat = await inactivePhase.waitFor((message) => message.type === "player-defeated" && message.id === inactivePhase.id && message.cause === "train");
assert.equal(inactivePhaseDefeat.cause, "train", "Equipping Phase Boots without activating them must not grant train immunity");
await wait(350);
assert.equal(phase.messages.some((message) => message.type === "pvp-hit" && message.targetId === phase.id), false, "Active Phase Boots must pass through the train without a hit");

[phase, inactivePhase, shield, plain].forEach((client) => client.socket.close(1000, "test complete"));
console.log(JSON.stringify({ room, activePhaseIgnored: true, inactivePhaseDefeated: true, shieldSurvived: true, shieldImpulse: shieldKnockback.impulse, unprotectedDefeated: true }, null, 2));
