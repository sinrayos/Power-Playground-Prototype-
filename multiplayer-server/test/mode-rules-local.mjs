import assert from "node:assert/strict";

const server = process.env.POWER_PLAYGROUND_TEST_SERVER || "ws://127.0.0.1:8787";
const room = `R${Date.now().toString(36).toUpperCase().slice(-7)}`;

function connect(username) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${server}/room/${room}`);
    const messages = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      messages.push(message);
      if (message.type === "welcome") resolve({ id: message.id, socket, messages, send(value) { socket.send(JSON.stringify(value)); } });
    });
    socket.addEventListener("error", reject);
  });
}

const [alpha, beta] = await Promise.all([connect("Alpha"), connect("Beta")]);
const setMode = (client, username, mode) => {
  client.send({ type: "hello", username, icon: "portrait-speed", power: "speed", map: "hub", mode });
  client.send({ type: "state", state: { position: [0, 1.2, client === alpha ? 0 : 2.4], forward: [0, 0, client === alpha ? 1 : -1], quaternion: [0, 0, 0, 1] } });
};

setMode(alpha, "Alpha", "hangout");
setMode(beta, "Beta", "hangout");
await new Promise((resolve) => setTimeout(resolve, 2200));
alpha.send({ type: "action", action: { kind: "attack" } });
await new Promise((resolve) => setTimeout(resolve, 750));
assert.equal(alpha.messages.some((message) => message.type === "pvp-hit"), false, "Hangout must reject player damage");

setMode(alpha, "Alpha", "pvp");
setMode(beta, "Beta", "pvp");
await new Promise((resolve) => setTimeout(resolve, 2200));
alpha.send({ type: "action", action: { kind: "attack" } });
await new Promise((resolve) => setTimeout(resolve, 900));
const hit = alpha.messages.find((message) => message.type === "pvp-hit" && message.attackerId === alpha.id);
assert.ok(hit, "PvP must work on the normally non-PvP Hub map");
const leaderboard = alpha.messages.find((message) => message.type === "leaderboard" && message.players?.find((player) => player.id === alpha.id)?.damageSession >= hit.damage);
assert.ok(leaderboard, "Verified PvP damage must update the authoritative session total");

alpha.socket.close(1000, "test complete");
beta.socket.close(1000, "test complete");
console.log(JSON.stringify({ room, hangoutDamageRejected: true, hubPvpDamage: hit.damage, authoritativeLeaderboard: true }, null, 2));
