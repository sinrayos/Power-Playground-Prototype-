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
second.socket.send(JSON.stringify({ type: "hello", username: "Beta", power: "webs", map: "pvpArena" }));
first.socket.send(JSON.stringify({ type: "state", state: { position: [0, 1, 650], forward: [1, 0, 0], yaw: 1, move: 1 } }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [2, 1, 650], forward: [-1, 0, 0], yaw: -1, move: 1 } }));
first.socket.send(JSON.stringify({ type: "entities", map: "pvpArena", snapshot: { dummies: [], objects: [{ id: 0, p: [1, 1, 650], q: [0, 0, 0, 1], v: [1, 0, 0] }] } }));
await new Promise((resolve) => setTimeout(resolve, 150));
first.socket.send(JSON.stringify({ type: "action", action: { kind: "attack" } }));
await new Promise((resolve) => setTimeout(resolve, 500));

if (!first.messages.some((message) => message.type === "player-state" && message.id === second.id)) {
  throw new Error("The first client did not receive the second client's state.");
}
if (!second.messages.some((message) => message.type === "pvp-hit" && message.targetId === second.id && message.health === 88)) {
  throw new Error("The server did not apply authoritative PvP damage.");
}
if (!second.messages.some((message) => message.type === "entities" && message.snapshot.objects.length === 1)) {
  throw new Error("The second client did not receive the shared object snapshot.");
}

first.socket.close();
second.socket.close();
console.log(`Remote room relay passed (${room}).`);
