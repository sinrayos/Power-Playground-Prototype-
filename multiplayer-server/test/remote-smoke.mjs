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
first.socket.send(JSON.stringify({ type: "hello", power: "speed", map: "hub" }));
const second = await openClient();
second.socket.send(JSON.stringify({ type: "hello", power: "webs", map: "hub" }));
second.socket.send(JSON.stringify({ type: "state", state: { position: [1, 2, 3], yaw: 1, move: 1 } }));
await new Promise((resolve) => setTimeout(resolve, 500));

if (!first.messages.some((message) => message.type === "player-state" && message.id === second.id)) {
  throw new Error("The first client did not receive the second client's state.");
}

first.socket.close();
second.socket.close();
console.log(`Remote room relay passed (${room}).`);
