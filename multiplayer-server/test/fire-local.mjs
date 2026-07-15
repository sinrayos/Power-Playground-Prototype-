import assert from "node:assert/strict";

const server = process.env.POWER_PLAYGROUND_TEST_SERVER || "ws://127.0.0.1:8787";
const room = `F${Date.now().toString(36).toUpperCase().slice(-7)}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connect(username) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${server}/room/${room}`);
    const messages = [];
    const waiters = [];
    const timeout = setTimeout(() => reject(new Error(`${username} connection timed out`)), 8000);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      messages.push(message);
      for (let index = waiters.length - 1; index >= 0; index -= 1) {
        if (!waiters[index].predicate(message)) continue;
        const waiter = waiters.splice(index, 1)[0];
        clearTimeout(waiter.timer);
        waiter.resolve(message);
      }
      if (message.type !== "welcome") return;
      clearTimeout(timeout);
      resolve({
        id: message.id,
        socket,
        messages,
        send(value) { socket.send(JSON.stringify(value)); },
        waitFor(predicate, timeoutMs = 7000) {
          const existing = messages.find(predicate);
          if (existing) return Promise.resolve(existing);
          return new Promise((waitResolve, waitReject) => {
            const waiter = { predicate, resolve: waitResolve, timer: null };
            waiter.timer = setTimeout(() => {
              const at = waiters.indexOf(waiter);
              if (at >= 0) waiters.splice(at, 1);
              waitReject(new Error(`${username} timed out waiting for Fire event`));
            }, timeoutMs);
            waiters.push(waiter);
          });
        },
      });
    });
    socket.addEventListener("error", reject);
  });
}

function setPlayer(client, username, mode, power, position, forward) {
  client.send({ type: "hello", username, icon: power === "fire" ? "symbol-fire" : "portrait-robot", power, map: "hub", mode });
  client.send({ type: "state", state: { position, forward, quaternion: [0, 0, 0, 1] } });
}

function tapPunch(client) {
  client.send({ type: "action", action: { kind: "fire-primary-down" } });
  client.send({ type: "action", action: { kind: "fire-primary-release", direction: [0, 0, 1] } });
}

const [alpha, beta] = await Promise.all([connect("Alpha"), connect("Beta")]);
setPlayer(alpha, "Alpha", "hangout", "fire", [0, 1.2, 0], [0, 0, 1]);
setPlayer(beta, "Beta", "hangout", "fire", [0, 1.2, 2.4], [0, 0, -1]);
await wait(250);
tapPunch(alpha);
await wait(650);
assert.equal(alpha.messages.some((message) => message.type === "pvp-hit"), false, "Hangout must reject Fire damage");

setPlayer(alpha, "Alpha", "pvp", "fire", [0, 1.2, 0], [0, 0, 1]);
setPlayer(beta, "Beta", "pvp", "fire", [0, 1.2, 2.4], [0, 0, -1]);
await wait(2200);

let consumedHits = 0;
const nextHit = async (source) => {
  const hit = await alpha.waitFor((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === source && !message.__used);
  hit.__used = true;
  consumedHits += 1;
  return hit;
};

const comboPunches = [];
for (let index = 0; index < 3; index += 1) {
  tapPunch(alpha);
  comboPunches.push(await nextHit("punch"));
  await wait(470);
}
const punchImpulse = (hit) => Math.hypot(hit.impulse[0], hit.impulse[2]);
assert.ok(punchImpulse(comboPunches[2]) > punchImpulse(comboPunches[0]) * 1.8, "The verified combo finisher must have substantially stronger knockback");
const burnVisual = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "combo");
assert.equal(burnVisual.targetId, beta.id, "Three verified punches must apply burn to the verified target");
assert.ok(alpha.messages.some((message) => message.type === "fire-combo" && message.count === 1), "Worker must start the combo HUD from a verified first hit");
assert.ok(alpha.messages.some((message) => message.type === "fire-combo" && message.count === 3 && message.triggered), "Worker must confirm the completed burn combo");
await nextHit("burn");

const punchesBeforeComboLockout = alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === "punch").length;
tapPunch(alpha);
await wait(250);
assert.equal(alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === "punch").length, punchesBeforeComboLockout, "Completing the combo must enforce a two-second punch cooldown");
await wait(850);
tapPunch(alpha);
await wait(250);
assert.equal(alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === "punch").length, punchesBeforeComboLockout, "Combo recovery must still block punches after the old one-second window");
await wait(300);

alpha.send({ type: "action", action: { kind: "fire-primary-down" } });
await wait(1050);
alpha.send({ type: "action", action: { kind: "fire-primary-release", direction: [0, 0, 1] } });
const fireballFlight = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "fireball" && message.attackerId === alpha.id);
const fireball = await nextHit("fireball");
assert.ok(fireball.damage >= 18 && fireball.damage <= 34, "Worker must derive fireball damage from measured charge time");
const fireballImpact = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "fireball-hit" && message.projectileId === fireballFlight.projectileId);
assert.equal(fireballImpact.targetId, beta.id, "Fireball impact must identify the directly collided target");
assert.ok(alpha.messages.indexOf(fireballFlight) < alpha.messages.indexOf(fireball), "Fireball damage must occur after the projectile is released into flight");
const fireballBurn = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "fireball" && message.targetId === beta.id);
assert.equal(fireballBurn.targetId, beta.id, "Fireball burn must be emitted only for the Worker-verified hit target");

setPlayer(beta, "Beta", "pvp", "fire", [8, 1.2, 2.4], [0, 0, -1]);
await wait(3100);
const fireballBurnsBeforeMiss = alpha.messages.filter((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "fireball").length;
alpha.send({ type: "action", action: { kind: "fire-primary-down" } });
await wait(1050);
alpha.send({ type: "action", action: { kind: "fire-primary-release", direction: [0, 0, 1] } });
await wait(750);
assert.equal(alpha.messages.filter((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "fireball").length, fireballBurnsBeforeMiss, "A missed fireball must not create a burn effect");

setPlayer(beta, "Beta", "pvp", "fire", [0, 1.2, 2.4], [0, 0, -1]);
alpha.send({ type: "action", action: { kind: "fire-primary-down" } });
await wait(2200);
alpha.send({ type: "action", action: { kind: "fire-primary-release", direction: [0, 0, 1] } });
const fallback = await nextHit("punch");
assert.equal(fallback.damage, 11, "Holding during fireball cooldown must fall back to Flame Punch");

await wait(470);
beta.send({ type: "state", state: { position: [8, 1.2, 2.4], forward: [0, 0, -1], quaternion: [0, 0, 0, 1] } });
await wait(120);
tapPunch(alpha);
await wait(120);
beta.send({ type: "state", state: { position: [0, 1.2, 2.4], forward: [0, 0, -1], quaternion: [0, 0, 0, 1] } });
await wait(400);
const punchesBeforeMissRecovery = alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === "punch").length;
tapPunch(alpha);
await wait(500);
assert.equal(alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && message.fireSource === "punch").length, punchesBeforeMissRecovery, "Missing during an active combo must enforce the two-second recovery cooldown");
await wait(1600);

setPlayer(beta, "Beta", "pvp", "robot", [0, 1.2, 2.4], [0, 0, -1]);
await wait(2200);
beta.send({ type: "action", action: { kind: "robot-shield-toggle" } });
await beta.waitFor((message) => message.type === "shield-state" && message.id === beta.id && message.active);
await wait(500);
const beforeShield = alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id).length;
tapPunch(alpha);
const blocked = await alpha.waitFor((message) => message.type === "shield-blocked" && message.attackerId === alpha.id && message.targetId === beta.id);
assert.equal(blocked.power, "fire");
await wait(500);
assert.equal(alpha.messages.filter((message) => message.type === "pvp-hit" && message.attackerId === alpha.id).length, beforeShield, "Shielded Fire hits must not add damage");

beta.send({ type: "action", action: { kind: "robot-shield-toggle" } });
setPlayer(beta, "Beta", "pvp", "fire", [0, 1.2, 5], [0, 0, -1]);
await wait(2200);
alpha.send({ type: "action", action: { kind: "fire-dash", direction: [0, 0, 1] } });
const dashEffect = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "dash" && message.attackerId === alpha.id);
assert.equal(dashEffect.points.length, 1, "The Worker must not pre-damage along a planned dash path");
const dashHitsBeforeMovement = alpha.messages.filter((message) => message.type === "pvp-hit" && message.fireSource === "dash-trail").length;
await wait(80);
assert.equal(alpha.messages.filter((message) => message.type === "pvp-hit" && message.fireSource === "dash-trail").length, dashHitsBeforeMovement, "Dash must not burn before verified movement reaches a target");
alpha.send({ type: "state", state: { position: [0, 1.2, 4], forward: [0, 0, 1], quaternion: [0, 0, 0, 1] } });
await wait(60);
alpha.send({ type: "state", state: { position: [0, 1.2, 8], forward: [0, 0, 1], quaternion: [0, 0, 0, 1] } });
await nextHit("dash-trail");
const dashBurn = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "dash-trail" && message.targetId === beta.id);
assert.equal(dashBurn.targetId, beta.id, "Dash burn must be emitted only after the trail hits a Worker-verified target");

const upDashesBeforeCooldownTest = alpha.messages.filter((message) => message.type === "fire-effect" && message.effect === "up-dash" && message.attackerId === alpha.id).length;
beta.send({ type: "state", state: { position: [0, 5.2, 8], forward: [0, -1, 0], quaternion: [0, 0, 0, 1] } });
await wait(80);
alpha.send({ type: "action", action: { kind: "fire-up-dash" } });
const firstUpDash = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "up-dash" && message.attackerId === alpha.id);
firstUpDash.__used = true;
assert.equal(alpha.messages.filter((message) => message.type === "fire-effect" && message.effect === "up-dash" && message.attackerId === alpha.id).length, upDashesBeforeCooldownTest + 1, "Up-Dash must remain available immediately after a forward Flame Dash");
alpha.send({ type: "state", state: { position: [0, 5.2, 8], forward: [0, 1, 0], quaternion: [0, 0, 0, 1] } });
await nextHit("up-dash");
await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "burn" && message.source === "up-dash" && message.targetId === beta.id);
alpha.send({ type: "action", action: { kind: "fire-up-dash" } });
await wait(250);
assert.equal(alpha.messages.filter((message) => message.type === "fire-effect" && message.effect === "up-dash" && message.attackerId === alpha.id).length, upDashesBeforeCooldownTest + 1, "Up-Dash must enforce its own authoritative cooldown");
await wait(2850);
alpha.send({ type: "action", action: { kind: "fire-up-dash" } });
await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "up-dash" && message.attackerId === alpha.id && !message.__used);

beta.send({ type: "state", state: { position: [0, 5.2, 8.5], forward: [0, 0, -1], quaternion: [0, 0, 0, 1] } });
await wait(150);
alpha.send({ type: "action", action: { kind: "fire-ring", point: [30, 1.2, 30] } });
const ringEffect = await alpha.waitFor((message) => message.type === "fire-effect" && message.effect === "ring" && message.attackerId === alpha.id);
assert.ok(Math.abs(ringEffect.point[0]) < 0.1 && Math.abs(ringEffect.point[2] - 8) < 0.1, "Fire Ring must be centered on Fire Guy and ignore aimed placement");
await nextHit("fire-ring");

const leaderboard = await alpha.waitFor((message) => message.type === "leaderboard" && message.players?.some((player) => player.id === alpha.id && player.damageSession >= 70));
assert.ok(leaderboard.players.find((player) => player.id === alpha.id).damageSession >= 70, "Only Worker-verified Fire damage must reach the leaderboard");

alpha.socket.close(1000, "test complete");
beta.socket.close(1000, "test complete");
console.log(JSON.stringify({ room, comboBurn: true, fireballDamage: fireball.damage, cooldownFallback: fallback.damage, shieldBlocked: true, dashTrail: true, fireRing: true, verifiedHits: consumedHits }, null, 2));
