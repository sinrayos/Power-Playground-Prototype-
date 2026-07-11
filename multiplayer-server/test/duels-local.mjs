import assert from "node:assert/strict";

const server = process.env.POWER_PLAYGROUND_TEST_SERVER || "ws://127.0.0.1:8787";
const room = `D${Date.now().toString(36).toUpperCase().slice(-7)}`;

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
      if (message.type === "welcome") {
        clearTimeout(timeout);
        const client = {
          id: message.id,
          socket,
          messages,
          send(messageToSend) { socket.send(JSON.stringify(messageToSend)); },
          waitFor(predicate, timeoutMs = 18000) {
            const existing = messages.find(predicate);
            if (existing) return Promise.resolve(existing);
            return new Promise((waitResolve, waitReject) => {
              const waiter = { predicate, resolve: waitResolve, timer: null };
              waiter.timer = setTimeout(() => {
                const at = waiters.indexOf(waiter);
                if (at >= 0) waiters.splice(at, 1);
                waitReject(new Error(`${username} timed out waiting for a message`));
              }, timeoutMs);
              waiters.push(waiter);
            });
          },
        };
        resolve(client);
      }
    });
    socket.addEventListener("error", reject);
  });
}

const [alpha, beta] = await Promise.all([connect("Alpha"), connect("Beta")]);
for (const [client, username] of [[alpha, "Alpha"], [beta, "Beta"]]) {
  client.send({ type: "hello", username, icon: "portrait-speed", power: "training", map: "duelLobby", mode: "duels" });
  client.send({ type: "state", state: { position: [-18, 1.2, 930], forward: [0, 0, 1], quaternion: [0, 0, 0, 1] } });
}

const voting = await alpha.waitFor((message) => message.type === "duel-phase" && message.duel?.phase === "voting", 10000);
assert.equal(voting.duel.mode, "1v1");
assert.deepEqual(new Set(voting.duel.maps), new Set(["hub", "speedTrack", "minionArena", "strengthPit", "city", "pvpArena", "powerStation"]));
assert.equal(voting.duel.players.length, 2);

alpha.send({ type: "action", action: { kind: "duel-vote", map: "hub" } });
beta.send({ type: "action", action: { kind: "duel-vote", map: "hub" } });
const voted = await alpha.waitFor((message) => message.type === "duel-phase" && message.duel?.votes?.[alpha.id] === "hub" && message.duel?.votes?.[beta.id] === "hub");
assert.ok(voted.duel.probabilities.hub > voted.duel.probabilities.city);

const selecting = await alpha.waitFor((message) => message.type === "duel-phase" && message.duel?.phase === "power-select", 15000);
assert.ok(selecting.duel.map);
alpha.send({ type: "action", action: { kind: "duel-select-power", power: "speed" } });
beta.send({ type: "action", action: { kind: "duel-select-power", power: "speed" } });

const round = await alpha.waitFor((message) => message.type === "duel-round-start", 15000);
assert.notDeepEqual(round.spawns[alpha.id], round.spawns[beta.id]);
assert.deepEqual(round.duel.scores, { A: 0, B: 0 });

await new Promise((resolve) => setTimeout(resolve, 2700));
alpha.send({ type: "state", state: { position: [0, 1.2, 0], forward: [0, 0, 1], quaternion: [0, 0, 0, 1] } });
beta.send({ type: "state", state: { position: [0, 1.2, 2.4], forward: [0, 0, -1], quaternion: [0, 1, 0, 0] } });

let verifiedDamage = 0;
for (let hit = 0; hit < 15; hit += 1) {
  alpha.send({ type: "action", action: { kind: "attack" } });
  const packet = await alpha.waitFor((message) => message.type === "pvp-hit" && message.attackerId === alpha.id && !message.__used, 3000);
  packet.__used = true;
  verifiedDamage += packet.damage;
  await new Promise((resolve) => setTimeout(resolve, 520));
  if (packet.defeated) break;
}
assert.ok(verifiedDamage >= 100);
const leaderboard = await alpha.waitFor((message) => message.type === "leaderboard" && message.players?.some((player) => player.id === alpha.id && player.damageMatch >= 100));
assert.ok(leaderboard.players.find((player) => player.id === alpha.id).damageRound >= 100);

const intermission = await alpha.waitFor((message) => message.type === "duel-intermission", 5000);
assert.equal(intermission.duel.scores.A, 1);
alpha.send({ type: "action", action: { kind: "duel-select-power", power: "robot" } });
const changed = await alpha.waitFor((message) => message.type === "duel-phase" && message.duel?.powers?.[alpha.id] === "robot");
assert.equal(changed.duel.powers[alpha.id], "robot");

beta.socket.close(1000, "disconnect test");
const cancelled = await alpha.waitFor((message) => message.type === "duel-cancelled", 5000);
assert.match(cancelled.reason, /cancelled/i);
alpha.socket.close(1000, "test complete");

console.log(JSON.stringify({ room, map: selecting.duel.map, verifiedDamage, score: intermission.duel.scores, disconnectHandled: true }, null, 2));
