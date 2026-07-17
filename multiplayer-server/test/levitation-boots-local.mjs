import assert from "node:assert/strict";

const server = process.env.POWER_PLAYGROUND_TEST_SERVER || "ws://127.0.0.1:8787";
const room = `L${Date.now().toString(36).toUpperCase().slice(-7)}`;
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
        id: message.id,
        socket,
        messages,
        send(payload) { socket.send(JSON.stringify(payload)); },
        waitForAfter(index, predicate, waitMs = 5000) {
          return new Promise((resolveMessage, rejectMessage) => {
            const startedAt = Date.now();
            const poll = () => {
              const found = messages.slice(index).find(predicate);
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

const [telekinesis, observer, protectedPlayer, wrongPower] = await Promise.all([
  connect("Telekinesis"), connect("Observer"), connect("Protected"), connect("WrongPower"),
]);

telekinesis.send({ type: "hello", username: "Telekinesis", icon: "portrait-telekinesis", power: "telekinesis", map: "hub", mode: "hangout" });
observer.send({ type: "hello", username: "Observer", icon: "portrait-speed", power: "speed", map: "hub", mode: "hangout" });
protectedPlayer.send({ type: "hello", username: "Protected", icon: "portrait-telekinesis", power: "telekinesis", map: "hub", mode: "pvp" });
wrongPower.send({ type: "hello", username: "WrongPower", icon: "portrait-speed", power: "speed", map: "hub", mode: "hangout" });
await wait(120);

let mark = wrongPower.messages.length;
wrongPower.send({ type: "action", action: { kind: "inventory-equip", item: "levitation-boots" } });
wrongPower.send({ type: "action", action: { kind: "levitation-boots-activate" } });
await wait(160);
assert.equal(wrongPower.messages.slice(mark).some((message) => message.type === "levitation-boots-state" && message.active), false, "Non-Telekinesis players must not activate Levitation Boots");

mark = protectedPlayer.messages.length;
protectedPlayer.send({ type: "action", action: { kind: "inventory-equip", item: "levitation-boots" } });
await protectedPlayer.waitForAfter(mark, (message) => message.type === "inventory-item-state" && message.id === protectedPlayer.id && message.equippedItem === "levitation-boots");
mark = protectedPlayer.messages.length;
protectedPlayer.send({ type: "action", action: { kind: "levitation-boots-activate" } });
const protectedState = await protectedPlayer.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === protectedPlayer.id);
assert.equal(protectedState.activated, false, "Spawn-protected players must not arm Levitation Boots");

mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "inventory-equip", item: "levitation-boots" } });
const equipped = await telekinesis.waitForAfter(mark, (message) => message.type === "inventory-item-state" && message.id === telekinesis.id);
assert.equal(equipped.equippedItem, "levitation-boots", "Telekinesis Guy must be allowed to equip Levitation Boots");
assert.ok(observer.messages.some((message) => message.type === "inventory-item-state" && message.id === telekinesis.id && message.equippedItem === "levitation-boots"), "Equipped boots must synchronize to observers");

mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "levitation-boots-activate" } });
const activated = await telekinesis.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === telekinesis.id && message.activated);
assert.equal(activated.active, false, "Equipping and activating alone must not start levitation");

mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "levitation-boots-start" } });
await telekinesis.waitForAfter(mark, (message) => message.type === "ability-cooldown" && message.ability === "levitation-boots-airborne");

telekinesis.send({ type: "state", state: { position: [0, 1.2, 0], forward: [0, 0, -1], quaternion: [0, 0, 0, 1] } });
await wait(90);
telekinesis.send({ type: "state", state: { position: [0, 2.05, 0], forward: [0, 0, -1], quaternion: [0, 0, 0, 1] } });
await wait(30);
mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "levitation-boots-start" } });
const started = await telekinesis.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === telekinesis.id && message.active);
assert.ok(started.endsAt - started.startedAt >= 5990 && started.endsAt - started.startedAt <= 6010, "Worker must own the six-second levitation duration");
assert.equal(started.cooldownUntil - started.endsAt, 10000, "Worker must start a ten-second cooldown after levitation ends");
assert.equal(started.movementState, "levitating", "Worker must synchronize levitating movement state");
assert.equal(started.animationState, "walking", "Worker must synchronize the air-walking animation state");
assert.ok(observer.messages.some((message) => message.type === "levitation-boots-state" && message.id === telekinesis.id && message.active), "Levitation start must synchronize to observers");

mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "levitation-boots-start" } });
const repeatedStart = await telekinesis.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === telekinesis.id);
assert.equal(repeatedStart.endsAt, started.endsAt, "Repeated start requests must not extend the authoritative duration");

mark = observer.messages.length;
telekinesis.send({ type: "state", state: { position: [0, 2.05, 0], forward: [0, 0, -1], quaternion: [0, 0, 0, 1], levitationBootsActive: false, levitationBootsEndsAt: Date.now() + 60000 } });
const sanitizedState = await observer.waitForAfter(mark, (message) => message.type === "player-state" && message.id === telekinesis.id);
assert.equal(sanitizedState.state.levitationBootsActive, true, "Worker must ignore the client's claimed active state");
assert.equal(sanitizedState.state.levitationBootsEndsAt, started.endsAt, "Worker must ignore the client's claimed duration");

mark = observer.messages.length;
telekinesis.send({ type: "action", action: { kind: "telekinesis-entity-grab", entityType: "box", entityId: 0, map: "hub" } });
await observer.waitForAfter(mark, (message) => message.type === "player-action" && message.id === telekinesis.id && message.action?.kind === "telekinesis-entity-grab");

mark = telekinesis.messages.length;
await wait(6200);
const ended = await telekinesis.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === telekinesis.id && !message.active, 2500);
assert.ok(ended.cooldownUntil > Date.now(), "Cooldown must remain authoritative after expiry");
mark = telekinesis.messages.length;
telekinesis.send({ type: "action", action: { kind: "levitation-boots-activate" } });
await telekinesis.waitForAfter(mark, (message) => message.type === "ability-cooldown" && message.ability === "levitation-boots");

const resetter = await connect("Resetter");
resetter.send({ type: "hello", username: "Resetter", icon: "portrait-telekinesis", power: "telekinesis", map: "hub", mode: "hangout" });
await wait(80);
mark = resetter.messages.length;
resetter.send({ type: "action", action: { kind: "inventory-equip", item: "levitation-boots" } });
await resetter.waitForAfter(mark, (message) => message.type === "inventory-item-state" && message.equippedItem === "levitation-boots");
mark = resetter.messages.length;
resetter.send({ type: "action", action: { kind: "levitation-boots-activate" } });
await resetter.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.activated);
mark = resetter.messages.length;
resetter.send({ type: "hello", username: "Resetter", icon: "portrait-telekinesis", power: "telekinesis", map: "hub", mode: "hangout", reset: true });
const resetState = await resetter.waitForAfter(mark, (message) => message.type === "levitation-boots-state" && message.id === resetter.id);
assert.equal(resetState.equippedItem, null, "Game reset must unequip Levitation Boots");
assert.equal(resetState.activated, false, "Game reset must clear armed Levitation Boots");
assert.equal(resetState.active, false, "Game reset must clear active levitation");

[telekinesis, observer, protectedPlayer, wrongPower, resetter].forEach((client) => client.socket.close(1000, "test complete"));
console.log(JSON.stringify({ room, wrongPowerRejected: true, protectedRejected: true, airborneRequired: true, durationMs: started.endsAt - started.startedAt, cooldownMs: started.cooldownUntil - started.endsAt, repeatedStartRejected: true, clientStateSanitized: true, telekinesisHoldAllowed: true, observerSync: true, resetCleanup: true }, null, 2));
