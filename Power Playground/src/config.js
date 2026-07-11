import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export const POWER_DATA = {
  training: {
    name: "Training Runner",
    color: 0xf8fafc,
    speed: 6.2,
    help: "Movement only. Stand on a glowing queue pad to enter a Duel queue."
  },
  speed: {
    name: "Super Speed Guy",
    color: 0xffea00,
    speed: 10.5,
    help: "Shift: super sprint with an electric trail. Left click: fast kick combo on an aimed dummy."
  },
  strength: {
    name: "Super Strength Guy",
    color: 0xef4444,
    speed: 5.1,
    help: "Hold left click to charge a point-blank shockwave. Press E to grab nearby boxes, dummies, minions, or players; press E again to throw them."
  },
  teleport: {
    name: "Teleportation Guy",
    color: 0x8b5cf6,
    speed: 7.1,
    help: "Left click: TP hit-and-reset punch. E: teleport to surfaces, or blink behind enemies for a delayed backstab."
  },
  telekinesis: {
    name: "Telekinesis Guy",
    color: 0x10b981,
    speed: 7.0,
    help: "Hold left click on a dummy, minion, box, or player to lift it. Slam it into structures or release to throw it along the camera aim."
  },
  flight: {
    name: "Flight Guy",
    color: 0xf59e0b,
    speed: 7.4,
    help: "Hold Shift while running to charge the Fly-O-Meter. Jump, then press Space again when full to fly. Hold Shift in flight for turbo. E launches an aerial strike."
  },
  robot: {
    name: "Robot Suit Guy",
    color: 0x06b6d4,
    speed: 6.7,
    help: "Left click fires a palm beam. Hold Shift for forward foot thrusters. Hold Space for an up dash. Press E for a 5s blocking shield."
  },
  jump: {
    name: "Super Jump Guy",
    color: 0x2563eb,
    speed: 6.2,
    jumpVelocity: 14.4,
    help: "Higher base jump. Hold left click to charge a mouse-aimed Mega Leap. In the air, left click performs a Bounce Punch."
  },
  webs: {
    name: "Spider Webs Guy",
    color: 0xdc2626,
    speed: 7.5,
    help: "Space jumps; while airborne, hold Space to swing and release with momentum. Tap left click to punch. Hold left click to web-pull an enemy or player, or zip to an obstacle. E nets a target or arms a floor trap."
  }
};

export const MAP_DATA = {
  hub: {
    name: "Power Playground Hub",
    spawn: new THREE.Vector3(0, 0.54, 12),
    yaw: Math.PI,
    minY: 0.74,
    bounds: { minX: -23.6, maxX: 23.6, minZ: -23.6, maxZ: 23.6 }
  },
  speedTrack: {
    name: "Super Speed Track",
    spawn: new THREE.Vector3(0, 9.05, 116),
    yaw: Math.PI,
    minY: 0.74,
    bounds: { minX: -56.5, maxX: 56.5, minZ: 70.5, maxZ: 161.5 }
  },
  minionArena: {
    name: "Minion Fighting Arena",
    spawn: new THREE.Vector3(0, 0.54, 219),
    yaw: Math.PI,
    minY: 0.74,
    bounds: { minX: -35.5, maxX: 35.5, minZ: 184.5, maxZ: 253.5 }
  },
  strengthPit: {
    name: "Strength Pit",
    spawn: new THREE.Vector3(0, 0.54, 306),
    yaw: Math.PI,
    minY: -8.1,
    bounds: { minX: -35.5, maxX: 35.5, minZ: 282.5, maxZ: 353.5 }
  },
  city: {
    name: "Power City",
    spawn: new THREE.Vector3(0, 0.54, 460),
    yaw: Math.PI,
    minY: 0.74,
    bounds: { minX: -94, maxX: 94, minZ: 366, maxZ: 554 }
  },
  pvpArena: {
    name: "Prototype PvP Arena",
    spawn: new THREE.Vector3(0, 0.54, 650),
    yaw: Math.PI,
    minY: 0.74,
    onlineOnly: true,
    bounds: { minX: -38, maxX: 38, minZ: 612, maxZ: 688 }
  },
  powerStation: {
    name: "Power Station",
    spawn: new THREE.Vector3(0, 0.84, 756),
    yaw: Math.PI,
    minY: -1.2,
    onlineOnly: true,
    bounds: { minX: -43, maxX: 43, minZ: 724, maxZ: 842 }
  },
  duelLobby: {
    name: "Duels Lobby",
    spawn: new THREE.Vector3(0, 1.2, 915),
    yaw: Math.PI,
    minY: 0.74,
    onlineOnly: true,
    duelLobby: true,
    bounds: { minX: -42, maxX: 42, minZ: 900, maxZ: 968 }
  }
};
