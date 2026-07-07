const DEFAULT_SERVER = "wss://power-playground-multiplayer.algomezg29.workers.dev";

export function normalizeRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export class MultiplayerClient extends EventTarget {
  constructor(serverUrl = DEFAULT_SERVER) {
    super();
    this.serverUrl = serverUrl.replace(/\/$/, "");
    this.socket = null;
    this.id = null;
    this.roomCode = null;
  }

  connect(roomCode, player) {
    this.disconnect();
    this.roomCode = normalizeRoomCode(roomCode);
    if (this.roomCode.length < 4) return Promise.reject(new Error("Room codes need at least four characters."));

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`${this.serverUrl}/room/${this.roomCode}`);
      this.socket = socket;
      const timeout = window.setTimeout(() => {
        socket.close();
        reject(new Error("The multiplayer server took too long to answer."));
      }, 8000);

      socket.addEventListener("open", () => {
        this.send({ type: "hello", ...player });
      });
      socket.addEventListener("message", (event) => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === "welcome") {
          window.clearTimeout(timeout);
          this.id = message.id;
          resolve(message);
        }
        this.dispatchEvent(new CustomEvent("message", { detail: message }));
      });
      socket.addEventListener("close", (event) => {
        window.clearTimeout(timeout);
        this.dispatchEvent(new CustomEvent("status", { detail: { connected: false, reason: event.reason } }));
      });
      socket.addEventListener("error", () => {
        window.clearTimeout(timeout);
        reject(new Error("Could not connect to the multiplayer server."));
      }, { once: true });
    });
  }

  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  sendState(state) {
    this.send({ type: "state", state });
  }

  sendAction(action) {
    this.send({ type: "action", action });
  }

  disconnect() {
    if (this.socket) this.socket.close(1000, "Leaving room");
    this.socket = null;
    this.id = null;
  }
}
