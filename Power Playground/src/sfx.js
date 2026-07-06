let audioContext = null;
const teleportSfxUrls = [
  new URL("../vwoop.mp3", import.meta.url).href,
  new URL("../teleport1_Cw1ot9l.mp3", import.meta.url).href
];
let nextTeleportSfxIndex = 0;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(freq, duration, type = "sine", gain = 0.045, slideTo = null) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  amp.gain.setValueAtTime(0.0001, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.03);
}

function playNoise(duration = 0.12, gain = 0.025, highpass = 900) {
  const ctx = getAudioContext();
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start();
}

function playTeleportMp3(volume = 0.78) {
  const audio = new Audio(teleportSfxUrls[nextTeleportSfxIndex]);
  nextTeleportSfxIndex = (nextTeleportSfxIndex + 1) % teleportSfxUrls.length;
  audio.volume = volume;
  audio.play().catch(() => {
    // Browsers can block media before interaction; gameplay continues.
  });
}

export function playSfx(name) {
  try {
    if (name === "speedSprint") playTone(520, 0.13, "sawtooth", 0.028, 1100);
    if (name === "speedKick") {
      playTone(880, 0.08, "square", 0.04, 360);
      playTone(1500, 0.06, "sine", 0.025, 700);
    }
    if (name === "pearlThrow") {
      playTone(520, 0.1, "triangle", 0.032, 980);
      playTone(1320, 0.08, "sine", 0.022, 760);
    }
    if (name === "pearlTeleport") {
      playTeleportMp3(0.85);
      playTone(880, 0.12, "sine", 0.045, 1800);
      playTone(240, 0.16, "triangle", 0.03, 620);
    }
    if (name === "strengthCharge") playTone(90, 0.42, "sawtooth", 0.035, 210);
    if (name === "strengthRelease") {
      playTone(80, 0.22, "triangle", 0.07, 42);
      playTone(180, 0.14, "sawtooth", 0.04, 70);
    }
    if (name === "strongSwordSlash") {
      playTone(280, 0.08, "sawtooth", 0.034, 980);
      playTone(1180, 0.07, "triangle", 0.026, 520);
    }
    if (name === "strongSwordHit") {
      playTone(120, 0.1, "square", 0.04, 70);
      playTone(540, 0.08, "sawtooth", 0.028, 220);
    }
    if (name === "teleport") {
      playTeleportMp3(0.82);
      playTone(720, 0.18, "sine", 0.045, 1800);
    }
    if (name === "teleportPunch") {
      playTeleportMp3(0.72);
      playTone(980, 0.08, "square", 0.038, 420);
      playTone(520, 0.12, "sine", 0.03, 1600);
    }
    if (name === "teleportBackstab") {
      playTeleportMp3(0.78);
      playTone(620, 0.08, "triangle", 0.032, 1300);
      playTone(1500, 0.06, "square", 0.024, 520);
      playTone(190, 0.1, "sawtooth", 0.028, 90);
    }
    if (name === "telekinesisHold") playTone(330, 0.28, "triangle", 0.036, 520);
    if (name === "telekinesisThrow") playTone(460, 0.16, "sawtooth", 0.045, 120);
    if (name === "flightToggle") playTone(260, 0.2, "sine", 0.04, 620);
    if (name === "dive") {
      playTone(520, 0.18, "sawtooth", 0.035, 75);
      playTone(90, 0.18, "triangle", 0.06, 45);
    }
    if (name === "diveImpact") {
      playTone(75, 0.18, "triangle", 0.06, 38);
      playTone(180, 0.1, "sawtooth", 0.04, 90);
    }
    if (name === "featherVolley") {
      playTone(1200, 0.08, "triangle", 0.025, 760);
      playTone(860, 0.11, "sawtooth", 0.025, 1320);
    }
    if (name === "boxGrab") playTone(160, 0.13, "square", 0.035, 260);
    if (name === "boxThrow") playTone(220, 0.18, "sawtooth", 0.045, 80);
    if (name === "robotShot") {
      playTone(920, 0.09, "square", 0.035, 420);
      playTone(1300, 0.07, "sine", 0.025, 760);
    }
    if (name === "robotShield") {
      playTone(260, 0.18, "triangle", 0.035, 520);
      playTone(520, 0.16, "sine", 0.025, 880);
    }
    if (name === "robotThruster") {
      playTone(120, 0.16, "sawtooth", 0.026, 210);
      playTone(480, 0.11, "triangle", 0.018, 320);
    }
    if (name === "shieldBlock") {
      playTone(220, 0.1, "square", 0.04, 360);
      playTone(680, 0.12, "sine", 0.028, 980);
    }
    if (name === "robotShieldDown") playTone(420, 0.2, "triangle", 0.03, 160);
    if (name === "cooldownDeny") playTone(140, 0.08, "square", 0.026, 90);
    if (name === "playerHit") playTone(110, 0.12, "sawtooth", 0.038, 65);
    if (name === "armorReboot") {
      playTone(260, 0.16, "sine", 0.03, 520);
      playTone(520, 0.16, "triangle", 0.025, 900);
    }
    if (name === "minionSpawn") {
      playTone(75, 0.22, "sawtooth", 0.035, 155);
      playTone(420, 0.12, "square", 0.025, 240);
    }
    if (name === "minionStrike") {
      playTone(180, 0.09, "square", 0.04, 90);
      playTone(70, 0.1, "sawtooth", 0.03, 45);
    }
    if (name === "minionDefeat") {
      playTone(520, 0.12, "triangle", 0.035, 180);
      playTone(120, 0.18, "sawtooth", 0.025, 55);
    }
    if (name === "jumpCharge") {
      playTone(180, 0.24, "triangle", 0.028, 520);
      playTone(420, 0.18, "sine", 0.02, 760);
    }
    if (name === "megaLeap") {
      playTone(240, 0.18, "sawtooth", 0.04, 1200);
      playTone(900, 0.12, "square", 0.026, 1500);
    }
    if (name === "wallBounce") {
      playTone(360, 0.12, "square", 0.035, 780);
      playTone(120, 0.1, "triangle", 0.03, 220);
    }
    if (name === "bouncePunch") {
      playTone(760, 0.09, "square", 0.04, 280);
      playTone(1280, 0.07, "sine", 0.025, 640);
    }
    if (name === "webSwingShoot") {
      playNoise(0.13, 0.038, 1250);
      playTone(1180, 0.12, "triangle", 0.025, 560);
    }
    if (name === "webSwingRelease") {
      playNoise(0.09, 0.022, 1600);
      playTone(640, 0.08, "sine", 0.018, 980);
    }
    if (name === "webPunch") {
      playTone(220, 0.09, "square", 0.042, 95);
      playNoise(0.08, 0.026, 620);
    }
    if (name === "webPull") {
      playNoise(0.18, 0.038, 1050);
      playTone(920, 0.16, "sawtooth", 0.024, 240);
    }
    if (name === "webZip") {
      playNoise(0.2, 0.04, 1400);
      playTone(420, 0.2, "triangle", 0.03, 1280);
    }
    if (name === "webTrap") {
      playNoise(0.22, 0.04, 1750);
      playTone(1380, 0.11, "triangle", 0.022, 620);
      playTone(360, 0.14, "sine", 0.02, 180);
    }
    if (name === "webFloorTrap") {
      playNoise(0.16, 0.033, 1200);
      playTone(760, 0.14, "sine", 0.022, 320);
    }
  } catch (error) {
    // Browsers can temporarily block audio before user interaction; gameplay continues.
  }
}
