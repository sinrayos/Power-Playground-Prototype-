import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";
import { MAP_DATA, POWER_DATA } from "./config.js?v=20260706-spawn-level";
import { playSfx, startMenuMusic, stopMenuMusic } from "./sfx.js?v=20260706-menu-audio";
import { MultiplayerClient, createRoomCode, normalizeRoomCode } from "./multiplayer.js?v=20260706-v1";

    const keys = new Set();
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const mouseNdc = new THREE.Vector2(0, 0);
    const tmpVec3 = new THREE.Vector3();
    const tmpVec3B = new THREE.Vector3();
    const tmpCannon = new CANNON.Vec3();
    const dummyMass = 3.4;
    const PLAYER_VISUAL_ROOT_OFFSET = 0.27;

    let selectedPower = null;
    let selectedMap = "hub";
    let builtMap = null;
    let gameStarted = false;
    let gamePaused = false;
    let cameraYaw = Math.PI;
    let cameraPitch = 0.23;
    let cameraDistance = 7.2;
    let isPointerDown = false;
    let strengthChargeStart = 0;
    let strengthUltraCooldownUntil = 0;
    let heldObject = null;
    let strengthHeldBox = null;
    let flightMode = false;
    let divePending = false;
    let flightFeatherCooldownUntil = 0;
    let featherPoseUntil = 0;
    let firstPersonMode = false;
    let rightMouseDragging = false;
    let shiftLockMode = false;
    let robotShieldMode = false;
    let robotThrusterTimer = 0;
    let lastRobotThrusterSfx = 0;
    let robotShieldEndsAt = 0;
    let robotShieldCooldownUntil = 0;
    let playerHealth = 100;
    let playerDamageFlash = 0;
    let lastAbilityTime = 0;
    let messageTimer = 0;
    let moveIntensity = 0;
    let abilityPose = 0;
    let walkTime = 0;
    let sprintTrailTimer = 0;
    let lastSprintTrailPosition = new THREE.Vector3();
    let kickComboUntil = 0;
    let kickComboSide = 1;
    let pinnedKickDummy = null;
    let teleportPunchUntil = 0;
    let teleportMovePoseUntil = 0;
    let teleportBackstabUntil = 0;
    let teleportBackstabYaw = 0;
    let teleportMoveCooldownUntil = 0;
    let telekinesisHoldDistance = 5;
    let telekinesisSlamCooldownUntil = 0;
    let lastSprintSfx = 0;
    let megaLeapChargeStart = 0;
    let megaLeapCharging = false;
    let megaLeapActiveUntil = 0;
    let jumpTrailTimer = 0;
    let lastJumpTrailPosition = new THREE.Vector3();
    let bouncePunchUntil = 0;
    let lastBouncePunchTime = 0;
    let wallBouncePoseUntil = 0;
    let lastWallBounceTime = 0;
    let wallBounceNormal = new THREE.Vector3(0, 0, 1);
    let selectedHotbarIndex = null;
    let speedPearlCount = 0;
    let pearlThrowPoseUntil = 0;
    let strongSwordSlashUntil = 0;
    let strongSwordCooldownUntil = 0;
    let webSwingActive = false;
    let webSwingRopeLength = 0;
    let webSwingStartedAt = 0;
    let webPullState = null;
    let webZipState = null;
    let webPunchUntil = 0;
    let webShootPoseUntil = 0;
    let webTrapCooldownUntil = 0;
    let webPullCooldownUntil = 0;
    let webLeftDownAt = 0;
    let webHoldTriggered = false;
    let webCord = null;
    let webWallWalkActive = false;
    let webWallLastContactAt = 0;
    let webWallDetachUntil = 0;
    let webWallVerticalInput = 0;
    let webWallHorizontalInput = 0;
    let webWallMoving = false;
    let webWallFacingAngle = 0;
    const webSwingAnchor = new THREE.Vector3();
    const webWallNormal = new THREE.Vector3(0, 0, 1);
    const webWallPoseMatrix = new THREE.Matrix4();
    const webWallPoseQuaternion = new THREE.Quaternion();
    const webWallFacingQuaternion = new THREE.Quaternion();
    const webWallTargetQuaternion = new THREE.Quaternion();
    const ATTACK_KNOCKBACK_SCALE = 0.38;
    const ATTACK_LIFT_SCALE = 0.28;
    const TARGET_RENDER_FPS = 180;
    const MAX_RENDER_PIXEL_RATIO = 1.5;
    const FPS_SAMPLE_INTERVAL = 500;
    const SHADOW_REFRESH_INTERVAL = 1 / 45;
    const HEALTH_BAR_RENDER_DISTANCE_SQ = 14 * 14;
    let fpsFrameCount = 0;
    let fpsSampleStartedAt = performance.now();
    let displayedFps = 0;
    let shadowRefreshAccumulator = 0;
    let onlineMode = false;
    let multiplayerClient = null;
    let multiplayerSendAt = 0;
    const remotePlayers = new Map();

    const startOverlay = document.getElementById("startOverlay");
    const heroStep = document.getElementById("heroStep");
    const mapStep = document.getElementById("mapStep");
    const backToHeroes = document.getElementById("backToHeroes");
    const launchTransition = document.getElementById("launchTransition");
    const launchStatus = document.getElementById("launchStatus");
    const hud = document.getElementById("hud");
    const powerName = document.getElementById("powerName");
    const powerHelp = document.getElementById("powerHelp");
    const chargeFill = document.getElementById("chargeFill");
    const flightBadge = document.getElementById("flightBadge");
    const inventoryHud = document.getElementById("inventoryHud");
    const pauseOverlay = document.getElementById("pauseOverlay");
    const resumeButton = document.getElementById("resumeButton");
    const restartButton = document.getElementById("restartButton");
    const mainMenuButton = document.getElementById("mainMenuButton");
    const hotbar = document.getElementById("hotbar");
    const bottomHealthFill = document.getElementById("bottomHealthFill");
    const bottomHealthText = document.getElementById("bottomHealthText");
    const fpsCounter = document.getElementById("fpsCounter");
    const shiftLockReticle = document.getElementById("shiftLockReticle");
    const message = document.getElementById("message");
    const soloModeButton = document.getElementById("soloModeButton");
    const onlineModeButton = document.getElementById("onlineModeButton");
    const roomControls = document.getElementById("roomControls");
    const roomCodeInput = document.getElementById("roomCodeInput");
    const newRoomButton = document.getElementById("newRoomButton");
    const multiplayerStatus = document.getElementById("multiplayerStatus");
    const activeRoomCode = document.getElementById("activeRoomCode");

    // Three.js scene setup.
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f9fc);
    scene.fog = new THREE.Fog(0xf7f9fc, 38, 76);

    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 180);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_RENDER_PIXEL_RATIO));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    document.body.appendChild(renderer.domElement);

    // A small second renderer powers lightweight, live arena dioramas in the menu.
    const menuPreviewScene = new THREE.Scene();
    menuPreviewScene.background = new THREE.Color(0xe8f0fa);
    menuPreviewScene.fog = null;
    const menuPreviewCamera = new THREE.PerspectiveCamera(52, 2, 0.1, 80);
    const menuPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    menuPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    menuPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    menuPreviewRenderer.shadowMap.enabled = true;
    menuPreviewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    menuPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    menuPreviewRenderer.toneMappingExposure = 1.08;
    menuPreviewRenderer.domElement.className = "mapPreviewCanvas";
    menuPreviewRenderer.domElement.setAttribute("aria-hidden", "true");
    menuPreviewScene.add(new THREE.HemisphereLight(0xffffff, 0x718096, 2.1));
    const menuPreviewSun = new THREE.DirectionalLight(0xffffff, 2.2);
    menuPreviewSun.position.set(5, 9, 6);
    menuPreviewSun.castShadow = true;
    menuPreviewSun.shadow.mapSize.set(512, 512);
    menuPreviewSun.shadow.camera.left = -7;
    menuPreviewSun.shadow.camera.right = 7;
    menuPreviewSun.shadow.camera.top = 7;
    menuPreviewSun.shadow.camera.bottom = -7;
    menuPreviewScene.add(menuPreviewSun);
    const menuPreviewDiorama = new THREE.Group();
    menuPreviewScene.add(menuPreviewDiorama);
    const menuPreviewGroups = new Map();
    let menuPreviewHost = null;
    let menuPreviewMap = null;

    const menuPreviewCenters = { hub: 0, speedTrack: 116, minionArena: 219, strengthPit: 318, city: 460 };
    const menuPreviewCameras = {
      hub: { radius: 20, height: 10, targetY: 2.6 },
      speedTrack: { radius: 44, height: 17, targetY: 2.2 },
      minionArena: { radius: 28, height: 15, targetY: 2.1 },
      strengthPit: { radius: 28, height: 15, targetY: -1.2 },
      city: { radius: 82, height: 48, targetY: 8 }
    };

    function buildMenuPreview(mapKey) {
      if (menuPreviewGroups.has(mapKey)) return menuPreviewGroups.get(mapKey);

      const originalSceneChildren = new Set(scene.children);
      const originalWorldBodies = new Set(world.bodies);
      const originalBackground = scene.background;
      const originalFog = scene.fog;
      const arrayLengths = {
        raycastTargets: raycastTargets.length,
        dynamicDummies: dynamicDummies.length,
        movableBoxes: movableBoxes.length,
        minionSpawnPoints: minionSpawnPoints.length,
        syncPairs: syncPairs.length
      };

      mapBuilders[mapKey]();
      dynamicDummies.slice(arrayLengths.dynamicDummies).forEach((dummy) => {
        if (dummy.healthGroup) dummy.healthGroup.visible = false;
      });

      const previewGroup = new THREE.Group();
      previewGroup.name = `${mapKey} actual map preview`;
      scene.children.filter((child) => !originalSceneChildren.has(child)).forEach((child) => previewGroup.add(child));
      previewGroup.position.z = -menuPreviewCenters[mapKey];
      menuPreviewDiorama.add(previewGroup);
      menuPreviewGroups.set(mapKey, previewGroup);

      world.bodies.filter((body) => !originalWorldBodies.has(body)).forEach((body) => world.removeBody(body));
      raycastTargets.length = arrayLengths.raycastTargets;
      dynamicDummies.length = arrayLengths.dynamicDummies;
      movableBoxes.length = arrayLengths.movableBoxes;
      minionSpawnPoints.length = arrayLengths.minionSpawnPoints;
      syncPairs.length = arrayLengths.syncPairs;
      scene.background = originalBackground;
      scene.fog = originalFog;
      return previewGroup;
    }

    function showMenuPreview(mapKey, host) {
      menuPreviewHost = host;
      if (menuPreviewMap !== mapKey) {
        menuPreviewMap = mapKey;
        menuPreviewGroups.forEach((group) => { group.visible = false; });
        buildMenuPreview(mapKey).visible = true;
        const previewColor = mapKey === "city" ? 0x8fcdf4 : 0xe8f0fa;
        menuPreviewScene.background.setHex(previewColor);
      }
      if (menuPreviewRenderer.domElement.parentElement !== host) host.appendChild(menuPreviewRenderer.domElement);
    }

    function animateMenuPreview(now) {
      if (!menuPreviewHost || !mapStep.classList.contains("active") || startOverlay.style.display === "none") return;
      const width = Math.round(menuPreviewHost.getBoundingClientRect().width);
      const height = 220;
      if (width < 2) return;
      if (menuPreviewRenderer.domElement.width !== Math.round(width * menuPreviewRenderer.getPixelRatio())) {
        menuPreviewRenderer.setSize(width, height, false);
        menuPreviewCamera.aspect = width / height;
        menuPreviewCamera.updateProjectionMatrix();
      }
      const orbit = now * 0.00032;
      const view = menuPreviewCameras[menuPreviewMap];
      menuPreviewCamera.far = menuPreviewMap === "city" ? 360 : 160;
      menuPreviewCamera.updateProjectionMatrix();
      menuPreviewCamera.position.set(Math.sin(orbit) * view.radius, view.height, Math.cos(orbit) * view.radius);
      menuPreviewCamera.lookAt(0, view.targetY, 0);
      menuPreviewRenderer.render(menuPreviewScene, menuPreviewCamera);
    }

    function disposeMenuPreviews() {
      menuPreviewRenderer.dispose();
      menuPreviewGroups.forEach((group) => {
        group.traverse((part) => part.geometry?.dispose?.());
        menuPreviewDiorama.remove(group);
      });
      menuPreviewGroups.clear();
      menuPreviewRenderer.domElement.remove();
      menuPreviewHost = null;
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.65);
    sun.position.set(13, 18, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.normalBias = 0.018;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 64;
    sun.shadow.camera.left = -32;
    sun.shadow.camera.right = 32;
    sun.shadow.camera.top = 32;
    sun.shadow.camera.bottom = -32;
    scene.add(sun);

    // Cannon world setup. Meshes mirror body transforms after every fixed physics step.
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -18, 0)
    });
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;

    const groundMaterial = new CANNON.Material("ground");
    const playerMaterial = new CANNON.Material("player");
    const dummyMaterial = new CANNON.Material("dummy");
    world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, playerMaterial, { friction: 0.02, restitution: 0.0 }));
    world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, dummyMaterial, { friction: 0.45, restitution: 0.12 }));
    world.addContactMaterial(new CANNON.ContactMaterial(dummyMaterial, dummyMaterial, { friction: 0.35, restitution: 0.06 }));

    const raycastTargets = [];
    const dynamicDummies = [];
    const movableBoxes = [];
    const minionSpawnPoints = [];
    const syncPairs = [];
    const activeEffects = [];
    const activeFloorWebs = [];
    const activeWebProjectiles = [];
    let activeMinion = null;
    let minionSpawnIndex = 0;
    let minionRespawnTimer = 0;

    function createPatternTexture(repeatX, repeatY, paint) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      paint(context, 256);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    function addTextureSpeckles(context, count, color, seed = 7, maxRadius = 1.7) {
      let value = seed >>> 0;
      context.fillStyle = color;
      for (let i = 0; i < count; i += 1) {
        value = (value * 1664525 + 1013904223) >>> 0;
        const x = (value / 4294967296) * 256;
        value = (value * 1664525 + 1013904223) >>> 0;
        const y = (value / 4294967296) * 256;
        value = (value * 1664525 + 1013904223) >>> 0;
        const radius = 0.35 + (value / 4294967296) * maxRadius;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    const floorTileTexture = createPatternTexture(7, 7, (context) => {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 256, 256);
      context.strokeStyle = "#dce6f0";
      context.lineWidth = 2;
      [0, 128, 256].forEach((point) => {
        context.beginPath(); context.moveTo(point, 0); context.lineTo(point, 256); context.stroke();
        context.beginPath(); context.moveTo(0, point); context.lineTo(256, point); context.stroke();
      });
      addTextureSpeckles(context, 60, "rgba(100,116,139,.09)", 11, 0.9);
    });
    function paintWallPanelTexture(context, label) {
      context.fillStyle = "#fbfdff";
      context.fillRect(0, 0, 256, 256);
      context.strokeStyle = "#aebdcd";
      context.lineWidth = 8;
      context.strokeRect(5, 5, 246, 246);
      context.strokeStyle = "#d3dde7";
      context.lineWidth = 5;
      context.strokeRect(20, 20, 216, 216);
      context.beginPath();
      context.moveTo(24, 24); context.lineTo(232, 232);
      context.moveTo(232, 24); context.lineTo(24, 232);
      context.stroke();
      context.fillStyle = "#7f91a5";
      [[17,17], [239,17], [17,239], [239,239]].forEach(([x, y]) => { context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill(); });
      context.fillStyle = "#2563eb";
      context.fillRect(28, 28, 42, 9);
      context.fillStyle = "#64748b";
      context.font = "bold 18px ui-monospace, monospace";
      context.fillText(label, 28, 62);
      for (let x = 24; x < 232; x += 32) {
        context.fillStyle = x % 64 === 24 ? "#facc15" : "#334155";
        context.fillRect(x, 218, 32, 12);
      }
    }
    const wallPanelTexture = createPatternTexture(10, 6, (context) => {
      paintWallPanelTexture(context, "P-01");
    });
    const structurePanelTexture = wallPanelTexture.clone();
    structurePanelTexture.repeat.set(2, 2);
    structurePanelTexture.needsUpdate = true;

    function updatePrototypePanelLabel(power) {
      const powerNumber = Math.max(1, Object.keys(POWER_DATA).indexOf(power) + 1);
      const label = `P-${String(powerNumber).padStart(2, "0")}`;
      const canvas = wallPanelTexture.image;
      paintWallPanelTexture(canvas.getContext("2d"), label);
      wallPanelTexture.needsUpdate = true;
      structurePanelTexture.needsUpdate = true;
    }
    const concreteTexture = createPatternTexture(4, 4, (context) => {
      context.fillStyle = "#f3f7fb";
      context.fillRect(0, 0, 256, 256);
      addTextureSpeckles(context, 300, "rgba(71,85,105,.11)", 29, 1.2);
      addTextureSpeckles(context, 120, "rgba(255,255,255,.62)", 97, 1.0);
    });
    const crateTexture = createPatternTexture(1, 1, (context) => {
      context.fillStyle = "#f7fbff";
      context.fillRect(0, 0, 256, 256);
      context.strokeStyle = "#86add5";
      context.lineWidth = 13;
      context.strokeRect(8, 8, 240, 240);
      context.lineWidth = 8;
      context.beginPath(); context.moveTo(18, 18); context.lineTo(238, 238); context.moveTo(238, 18); context.lineTo(18, 238); context.stroke();
      context.strokeStyle = "rgba(255,255,255,.88)";
      context.lineWidth = 3;
      context.strokeRect(22, 22, 212, 212);
      context.fillStyle = "#2563eb";
      context.fillRect(96, 108, 64, 40);
      context.fillStyle = "#ffffff";
      context.font = "bold 20px ui-monospace, monospace";
      context.fillText("TEST", 103, 135);
    });
    const dirtTexture = createPatternTexture(6, 6, (context) => {
      context.fillStyle = "#9b704c";
      context.fillRect(0, 0, 256, 256);
      addTextureSpeckles(context, 520, "rgba(63,36,20,.28)", 43, 2.3);
      addTextureSpeckles(context, 240, "rgba(225,184,132,.22)", 131, 1.8);
    });
    const asphaltTexture = createPatternTexture(12, 12, (context) => {
      context.fillStyle = "#4b535c";
      context.fillRect(0, 0, 256, 256);
      addTextureSpeckles(context, 650, "rgba(226,232,240,.18)", 61, 1.25);
      addTextureSpeckles(context, 260, "rgba(15,23,42,.28)", 17, 1.5);
    });
    const sidewalkTexture = createPatternTexture(6, 6, (context) => {
      context.fillStyle = "#e1e5e9";
      context.fillRect(0, 0, 256, 256);
      context.strokeStyle = "#aeb7c1";
      context.lineWidth = 4;
      [0, 128, 256].forEach((point) => {
        context.beginPath(); context.moveTo(point, 0); context.lineTo(point, 256); context.stroke();
        context.beginPath(); context.moveTo(0, point); context.lineTo(256, point); context.stroke();
      });
      addTextureSpeckles(context, 120, "rgba(71,85,105,.15)", 73, 1.1);
    });
    const facadeTextures = [0, 1, 2, 3].map((variant) => createPatternTexture(1.5 + (variant % 2) * 0.5, 3, (context) => {
      context.fillStyle = "#cbd3dc";
      context.fillRect(0, 0, 256, 256);
      context.fillStyle = variant % 2 ? "#31465a" : "#40566d";
      for (let y = 22; y < 230; y += 66) {
        for (let x = 26; x < 230; x += 88) {
          context.fillRect(x, y, 36, 30);
          context.fillStyle = "rgba(148,211,238,.42)";
          context.fillRect(x + 4, y + 4, 6, 22);
          context.fillStyle = variant % 2 ? "#31465a" : "#40566d";
        }
      }
      context.strokeStyle = "rgba(71,85,105,.48)";
      context.lineWidth = 4;
      context.strokeRect(2, 2, 252, 252);
    }));

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: floorTileTexture, roughness: 0.78, metalness: 0.0 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, map: wallPanelTexture, roughness: 0.82, metalness: 0.0 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.74, metalness: 0.0, transparent: true, opacity: 0.42 });
    const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, map: structurePanelTexture, roughness: 0.72, metalness: 0.02 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xdbe6f1, map: wallPanelTexture, roughness: 0.7, metalness: 0.0 });
    const dummyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.0 });
    const dummyAccentMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.52, metalness: 0.0 });
    const movableBoxMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, map: crateTexture, roughness: 0.62, metalness: 0.0 });

    function addVisualFloor(name, width, depth, position, material = whiteMat) {
      const floorHalfHeight = 0.35;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(position);
      mesh.receiveShadow = true;
      mesh.userData.type = "floor";
      mesh.userData.name = name;
      scene.add(mesh);
      raycastTargets.push(mesh);
      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, floorHalfHeight, depth / 2)));
      body.position.set(position.x, position.y - floorHalfHeight, position.z);
      body.userData = { type: "floor", name };
      world.addBody(body);
      return mesh;
    }

    function addStaticRamp(name, size, position, rotationX, material = wallMat) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
      mesh.position.copy(position);
      mesh.rotation.x = rotationX;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = "obstacle";
      mesh.userData.name = name;
      scene.add(mesh);
      raycastTargets.push(mesh);

      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
      body.position.set(position.x, position.y, position.z);
      body.quaternion.setFromEuler(rotationX, 0, 0);
      body.userData = { type: "obstacle", name };
      world.addBody(body);
      return { mesh, body };
    }

    function addStaticCylinder(name, radius, height, position, material = wallMat, radialSegments = 32) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = "obstacle";
      mesh.userData.name = name;
      scene.add(mesh);
      raycastTargets.push(mesh);

      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Cylinder(radius, radius, height, radialSegments));
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "obstacle", name };
      world.addBody(body);
      return { mesh, body };
    }

    function addTrackMark(name, size, position, color = 0xffea00) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.0 })
      );
      mesh.position.copy(position);
      mesh.receiveShadow = true;
      mesh.userData.type = "track-mark";
      mesh.userData.name = name;
      scene.add(mesh);
      return mesh;
    }

    function addStaticBox(name, size, position, material = wallMat) {
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = "obstacle";
      mesh.userData.name = name;
      scene.add(mesh);
      raycastTargets.push(mesh);

      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "obstacle", name };
      world.addBody(body);
      return { mesh, body };
    }

    function addStaticBoxYaw(name, size, position, yaw, material = wallMat) {
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.rotation.y = yaw;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = "obstacle";
      mesh.userData.name = name;
      scene.add(mesh);
      raycastTargets.push(mesh);

      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
      body.position.set(position.x, position.y, position.z);
      body.quaternion.setFromEuler(0, yaw, 0);
      body.userData = { type: "obstacle", name };
      world.addBody(body);
      return { mesh, body };
    }

    function addRoof(name, size, position) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), roofMat);
      mesh.position.copy(position);
      mesh.receiveShadow = true;
      mesh.userData.type = "roof";
      mesh.userData.name = name;
      scene.add(mesh);

      const body = new CANNON.Body({ mass: 0, material: groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "roof", name };
      world.addBody(body);
      return { mesh, body };
    }

    function createMovableBox(position, color = 0x60a5fa, options = {}) {
      const isRock = Boolean(options.isRock);
      const size = options.size || new THREE.Vector3(1.25, 1.25, 1.25);
      const geometry = isRock
        ? new THREE.DodecahedronGeometry(size.x * 0.58, 0)
        : new THREE.BoxGeometry(size.x, size.y, size.z);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color,
          map: isRock ? dirtTexture : crateTexture,
          roughness: isRock ? 0.92 : 0.6,
          metalness: 0.0,
          flatShading: isRock
        })
      );
      mesh.position.copy(position);
      if (isRock) mesh.scale.set(1.16, 0.82, 1.04);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.type = "movableBox";
      scene.add(mesh);
      raycastTargets.push(mesh);

      const body = new CANNON.Body({
        mass: options.mass || (isRock ? 8.5 : 5),
        material: dummyMaterial,
        linearDamping: isRock ? 0.18 : 0.14,
        angularDamping: isRock ? 0.9 : 0.82
      });
      body.angularFactor.set(0.08, 0.08, 0.08);
      if (isRock) body.addShape(new CANNON.Sphere(size.x * 0.58));
      else body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "movableBox" };
      world.addBody(body);

      const box = {
        mesh,
        body,
        mass: options.mass || (isRock ? 8.5 : 5),
        isHeld: false,
        isRock,
        damageMultiplier: isRock ? 2.15 : 1,
        lastThrownBy: null,
        label: isRock ? "Rock" : "Box"
      };
      mesh.userData.box = box;
      body.userData.box = box;
      body.addEventListener("collide", (event) => {
        if (box.isHeld) {
          box.lastHeldImpactAt = performance.now();
        }
        const other = event.body && event.body.userData;
        if (!other || other.type !== "dummy") return;
        const impact = body.velocity.length();
        if (impact < 5.5) return;
        const powerThrow = box.lastThrownBy === "strength" || box.lastThrownBy === "telekinesis";
        const multiplier = powerThrow ? box.damageMultiplier : 1;
        const maxDamage = box.isRock && powerThrow ? 72 : 34;
        damageDummy(other.dummy, Math.min(maxDamage, impact * 3.2 * multiplier));
        spawnBurst(threeFromCannon(other.dummy.body.position).add(new THREE.Vector3(0, 0.75, 0)), box.isRock ? 0x8b5e34 : 0x60a5fa, box.isRock ? 12 : 8, 0.34);
      });
      movableBoxes.push(box);
      syncPairs.push({ mesh, body });
      return box;
    }

    function createHealthBar(width = 0.9) {
      const healthGroup = new THREE.Group();
      const backMat = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide, depthTest: false });
      const fillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, depthTest: false });
      const healthBack = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.08), backMat);
      const healthFill = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.04, 0.045), fillMat);
      healthFill.position.z = 0.01;
      healthBack.renderOrder = 50;
      healthFill.renderOrder = 51;
      healthGroup.add(healthBack, healthFill);
      scene.add(healthGroup);
      return { healthGroup, healthFill, fillWidth: width - 0.04 };
    }

    function createDummy(position, accentColor = 0xf97316, options = {}) {
      const group = new THREE.Group();
      group.userData.type = "dummy";

      const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 1.75, 20), dummyMat.clone());
      if (options.punchingBag) bodyMesh.material.color.setHex(0x7f1d1d);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      bodyMesh.userData.type = "dummy";
      group.add(bodyMesh);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 14), new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 }));
      head.position.y = 1.07;
      head.castShadow = true;
      head.userData.type = "dummy";
      group.add(head);

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 8, 32), dummyAccentMat.clone());
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.25;
      band.castShadow = true;
      band.userData.type = "dummy";
      group.add(band);

      if (options.punchingBag) {
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 }));
        strap.position.y = 2.0;
        strap.castShadow = true;
        group.add(strap);
      }

      const { healthGroup, healthFill, fillWidth } = createHealthBar(0.9);

      scene.add(group);
      raycastTargets.push(group);

      const body = new CANNON.Body({
        mass: options.noKnockback ? 0 : dummyMass,
        material: dummyMaterial,
        linearDamping: 0.38,
        angularDamping: 0.78,
        sleepSpeedLimit: 0.08,
        sleepTimeLimit: 1.4
      });
      body.angularFactor.set(0.18, 0.18, 0.18);
      const cylinder = new CANNON.Cylinder(0.46, 0.54, 1.75, 16);
      const shapeQuat = new CANNON.Quaternion();
      shapeQuat.setFromEuler(Math.PI / 2, 0, 0);
      body.addShape(cylinder, new CANNON.Vec3(0, 0, 0), shapeQuat);
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "dummy" };
      body.addEventListener("collide", (event) => {
        if (!body.userData?.dummy?.isHeld) return;
        body.userData.dummy.lastHeldImpactAt = performance.now();
      });
      world.addBody(body);

      const dummy = {
        group,
        body,
        isHeld: false,
        isPinned: false,
        noKnockback: Boolean(options.noKnockback),
        knockbackMultiplier: options.knockbackMultiplier ?? 1,
        indestructible: Boolean(options.indestructible),
        health: options.maxHealth || 100,
        maxHealth: options.maxHealth || 100,
        healthGroup,
        healthFill,
        fillWidth,
        healthOffset: 1.92,
        label: options.label || "Training dummy",
        spawn: position.clone()
      };
      body.userData.dummy = dummy;
      group.userData.dummy = dummy;
      group.traverse((child) => {
        child.userData.type = "dummy";
        child.userData.dummy = dummy;
      });
      updateDummyHealthBar(dummy);
      dynamicDummies.push(dummy);
      syncPairs.push({ mesh: group, body });
      return dummy;
    }

    function createRobotMinion(position) {
      const group = new THREE.Group();
      group.userData.type = "dummy";

      const armor = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.48, metalness: 0.36 });
      const trim = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.38, metalness: 0.5 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1f1f });

      const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 8, 14), armor);
      bodyMesh.position.y = 0.15;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.48, 0.5), armor.clone());
      head.position.y = 1.05;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), eyeMat);
      eye.position.set(0, 1.08, 0.27);
      eye.castShadow = false;
      group.add(eye);

      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.22, 0.1), trim);
      chestPlate.position.set(0, 0.45, 0.35);
      chestPlate.castShadow = true;
      group.add(chestPlate);

      const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 6, 10), trim.clone());
      leftArm.position.set(-0.52, 0.4, 0);
      leftArm.rotation.z = 0.15;
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = leftArm.clone();
      rightArm.position.x = 0.52;
      rightArm.rotation.z = -0.15;
      group.add(rightArm);

      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.22), trim.clone());
      leftLeg.position.set(-0.22, -0.52, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.22;
      group.add(rightLeg);

      const { healthGroup, healthFill, fillWidth } = createHealthBar(1.05);
      scene.add(group);
      raycastTargets.push(group);

      const body = new CANNON.Body({
        mass: dummyMass + 0.4,
        material: dummyMaterial,
        linearDamping: 0.42,
        angularDamping: 0.82,
        sleepSpeedLimit: 0.08,
        sleepTimeLimit: 1.4
      });
      body.angularFactor.set(0.14, 0.14, 0.14);
      const cylinder = new CANNON.Cylinder(0.44, 0.48, 1.65, 16);
      const shapeQuat = new CANNON.Quaternion();
      shapeQuat.setFromEuler(Math.PI / 2, 0, 0);
      body.addShape(cylinder, new CANNON.Vec3(0, 0, 0), shapeQuat);
      body.position.set(position.x, position.y, position.z);
      body.userData = { type: "dummy" };
      world.addBody(body);

      const minion = {
        group,
        body,
        isHeld: false,
        isPinned: false,
        isMinion: true,
        attackCooldown: 0,
        aiPhase: Math.random() * Math.PI * 2,
        health: 45,
        maxHealth: 45,
        healthGroup,
        healthFill,
        fillWidth,
        healthOffset: 1.78,
        label: "Robot minion",
        spawn: position.clone()
      };
      body.userData.dummy = minion;
      group.userData.dummy = minion;
      group.traverse((child) => {
        child.userData.type = "dummy";
        child.userData.dummy = minion;
      });
      updateDummyHealthBar(minion);
      dynamicDummies.push(minion);
      syncPairs.push({ mesh: group, body });
      return minion;
    }

    function buildHub() {
      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), whiteMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      floorMesh.userData.type = "floor";
      floorMesh.userData.name = "hub floor";
      scene.add(floorMesh);
      raycastTargets.push(floorMesh);

      const floorBody = new CANNON.Body({ mass: 0, material: groundMaterial });
      floorBody.addShape(new CANNON.Box(new CANNON.Vec3(26, 0.35, 26)));
      floorBody.position.set(0, -0.35, 0);
      floorBody.userData = { type: "floor", name: "hub floor" };
      world.addBody(floorBody);

      addStaticBox("north wall", new THREE.Vector3(52, 16, 0.8), new THREE.Vector3(0, 8, -26), wallMat);
      addStaticBox("south wall", new THREE.Vector3(52, 16, 0.8), new THREE.Vector3(0, 8, 26), wallMat);
      addStaticBox("west wall", new THREE.Vector3(0.8, 16, 52), new THREE.Vector3(-26, 8, 0), wallMat);
      addStaticBox("east wall", new THREE.Vector3(0.8, 16, 52), new THREE.Vector3(26, 8, 0), wallMat);
      addRoof("hub roof", new THREE.Vector3(52, 0.45, 52), new THREE.Vector3(0, 17, 0));

      [
        { s: [3.5, 2.6, 3.5], p: [-9, 1.3, -8] },
        { s: [2.4, 4.4, 2.4], p: [8.5, 2.2, -10] },
        { s: [7.5, 2.2, 1.5], p: [1.5, 1.1, -1.8] },
        { s: [1.6, 3.4, 8], p: [-13, 1.7, 9] },
        { s: [4.8, 1.5, 2.4], p: [10, 0.75, 8.5] },
        { s: [2.2, 2.2, 6.6], p: [17, 1.1, -1] }
      ].forEach((item, index) => {
        addStaticBox(`training block ${index + 1}`, new THREE.Vector3(...item.s), new THREE.Vector3(...item.p), obstacleMat);
      });

      [
        [-15, 1.2, -14], [-4, 1.2, -12], [13, 1.2, -15], [-18, 1.2, 0], [-5, 1.2, 5],
        [5, 1.2, 2.5], [14, 1.2, 13], [0, 1.2, 17], [19, 1.2, -5], [-14, 1.2, 15]
      ].forEach((p, i) => createDummy(new THREE.Vector3(...p), i % 2 ? 0x22c55e : 0xf97316));

      [
        [-11, 0.7, 2], [-2, 0.7, 10], [8, 0.7, -5], [16, 0.7, 6]
      ].forEach((p, i) => createMovableBox(new THREE.Vector3(...p), i % 2 ? 0x93c5fd : 0x60a5fa));
    }

    function buildSuperSpeedTrack() {
      const z = 116;
      const trackFloorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: floorTileTexture, roughness: 0.76, metalness: 0.0 });
      const laneMat = new THREE.MeshStandardMaterial({ color: 0xff8a1f, map: concreteTexture, roughness: 0.7, metalness: 0.0 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, map: wallPanelTexture, roughness: 0.72, metalness: 0.0 });
      const yellowBlockMat = new THREE.MeshStandardMaterial({ color: 0xfff200, map: structurePanelTexture, roughness: 0.62, metalness: 0.02 });
      addVisualFloor("super speed track floor", 142, 94, new THREE.Vector3(0, 0.004, z), trackFloorMat);

      const outerTrack = new THREE.Mesh(new THREE.RingGeometry(17.5, 24, 96, 2), laneMat);
      outerTrack.rotation.x = -Math.PI / 2;
      outerTrack.scale.set(2.15, 1, 1.05);
      outerTrack.position.set(0, 0.018, z);
      outerTrack.receiveShadow = true;
      outerTrack.userData.type = "floor";
      outerTrack.userData.name = "super speed oval lane";
      scene.add(outerTrack);
      raycastTargets.push(outerTrack);

      const innerField = new THREE.Mesh(new THREE.CircleGeometry(15.8, 80), whiteMat);
      innerField.rotation.x = -Math.PI / 2;
      innerField.scale.set(2.15, 1, 1.05);
      innerField.position.set(0, 0.024, z);
      innerField.receiveShadow = true;
      innerField.userData.type = "floor";
      innerField.userData.name = "super speed infield";
      scene.add(innerField);
      raycastTargets.push(innerField);

      addTrackMark("start line", new THREE.Vector3(0.35, 0.035, 13.2), new THREE.Vector3(0, 0.04, z - 24.6), 0x111827);
      for (let i = -5; i <= 5; i += 1) {
        addTrackMark(`speed dash ${i}`, new THREE.Vector3(2.6, 0.026, 0.28), new THREE.Vector3(i * 7, 0.035, z - 24.8), 0xffea00);
        addTrackMark(`back dash ${i}`, new THREE.Vector3(2.6, 0.026, 0.28), new THREE.Vector3(i * 7, 0.035, z + 24.8), 0xffea00);
      }

      // Tall clean rails shape the playable race arena without blocking the whole oval visually.
      addStaticBox("track north wall", new THREE.Vector3(118, 18, 0.8), new THREE.Vector3(0, 9, z - 47), railMat);
      addStaticBox("track south wall", new THREE.Vector3(118, 18, 0.8), new THREE.Vector3(0, 9, z + 47), railMat);
      addStaticBox("track west wall", new THREE.Vector3(0.8, 18, 94), new THREE.Vector3(-59, 9, z), railMat);
      addStaticBox("track east wall", new THREE.Vector3(0.8, 18, 94), new THREE.Vector3(59, 9, z), railMat);
      addRoof("super speed track roof", new THREE.Vector3(118, 0.5, 94), new THREE.Vector3(0, 22, z));
      addStaticBox("infield timing tower", new THREE.Vector3(3.5, 8.5, 3.5), new THREE.Vector3(0, 4.25, z), yellowBlockMat);
      addStaticBox("speed ramp left", new THREE.Vector3(7, 1.2, 2.2), new THREE.Vector3(-27, 0.6, z - 15), yellowBlockMat);
      addStaticBox("speed ramp right", new THREE.Vector3(7, 1.2, 2.2), new THREE.Vector3(27, 0.6, z + 15), yellowBlockMat);
      [
        [-44, z - 31], [-31, z - 31], [31, z - 31], [44, z - 31],
        [-44, z + 31], [-31, z + 31], [31, z + 31], [44, z + 31],
        [-50, z], [50, z]
      ].forEach(([x, zz], index) => {
        addStaticBox(`yellow speed block ${index + 1}`, new THREE.Vector3(3.2, 2.6, 3.2), new THREE.Vector3(x, 1.3, zz), yellowBlockMat);
      });

      [
        [-38, 1.2, z - 19],
        [-22, 1.2, z - 25],
        [0, 1.2, z - 25],
        [22, 1.2, z - 25],
        [38, 1.2, z - 19],
        [-38, 1.2, z + 19],
        [-22, 1.2, z + 25],
        [0, 1.2, z + 25],
        [22, 1.2, z + 25],
        [38, 1.2, z + 19]
      ].forEach((p, i) => createDummy(new THREE.Vector3(...p), i % 2 ? 0xffea00 : 0xf97316));

      [
        [-18, 0.7, z],
        [-8, 0.7, z + 9],
        [8, 0.7, z - 9],
        [18, 0.7, z],
        [0, 0.7, z + 14]
      ].forEach((p, i) => createMovableBox(new THREE.Vector3(...p), i % 2 ? 0xffd166 : 0xfacc15));
    }

    function buildMinionArena() {
      const z = 219;
      const arenaFloorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, map: floorTileTexture, roughness: 0.76, metalness: 0.0 });
      const arenaWallMat = new THREE.MeshStandardMaterial({ color: 0xf9fafb, map: wallPanelTexture, roughness: 0.8, metalness: 0.0 });
      const warningMat = new THREE.MeshStandardMaterial({ color: 0xef4444, map: structurePanelTexture, roughness: 0.62, metalness: 0.03 });
      const coverMat = new THREE.MeshStandardMaterial({ color: 0xeaf2fb, map: structurePanelTexture, roughness: 0.68, metalness: 0.06 });

      addVisualFloor("minion arena floor", 74, 74, new THREE.Vector3(0, 0.006, z), arenaFloorMat);
      addStaticBox("arena north wall", new THREE.Vector3(74, 18, 0.8), new THREE.Vector3(0, 9, z - 37), arenaWallMat);
      addStaticBox("arena south wall", new THREE.Vector3(74, 18, 0.8), new THREE.Vector3(0, 9, z + 37), arenaWallMat);
      addStaticBox("arena west wall", new THREE.Vector3(0.8, 18, 74), new THREE.Vector3(-37, 9, z), arenaWallMat);
      addStaticBox("arena east wall", new THREE.Vector3(0.8, 18, 74), new THREE.Vector3(37, 9, z), arenaWallMat);
      addRoof("minion arena roof", new THREE.Vector3(74, 0.5, 74), new THREE.Vector3(0, 22, z));

      addTrackMark("arena red center line", new THREE.Vector3(0.25, 0.035, 58), new THREE.Vector3(0, 0.045, z), 0xef4444);
      addTrackMark("arena red cross line", new THREE.Vector3(58, 0.035, 0.25), new THREE.Vector3(0, 0.045, z), 0xef4444);
      const combatRing = new THREE.Mesh(new THREE.TorusGeometry(18, 0.14, 8, 96), new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.6 }));
      combatRing.rotation.x = Math.PI / 2;
      combatRing.position.set(0, 0.06, z);
      combatRing.receiveShadow = true;
      scene.add(combatRing);

      [
        [-18, 1.25, z - 18], [18, 1.25, z - 18],
        [-18, 1.25, z + 18], [18, 1.25, z + 18],
        [0, 1.8, z - 28], [0, 1.8, z + 28]
      ].forEach((p, index) => {
        addStaticBox(`arena cover ${index + 1}`, new THREE.Vector3(index > 3 ? 8 : 4.4, index > 3 ? 3.6 : 2.5, 2.4), new THREE.Vector3(...p), index > 3 ? warningMat : coverMat);
      });

      [
        [0, 1.2, z + 10], [-9, 1.2, z + 12], [9, 1.2, z + 12],
        [-13, 1.2, z], [13, 1.2, z], [0, 1.2, z - 12],
        [-20, 1.2, z - 18], [20, 1.2, z - 18],
        [-24, 1.2, z + 23], [0, 1.2, z + 27], [24, 1.2, z + 23]
      ].forEach((p) => minionSpawnPoints.push(new THREE.Vector3(...p)));

      [
        [-28, 0.7, z - 10],
        [28, 0.7, z - 10],
        [-28, 0.7, z + 13],
        [28, 0.7, z + 13]
      ].forEach((p) => createMovableBox(new THREE.Vector3(...p), 0x94a3b8));
    }

    function buildStrengthPit() {
      const z = 318;
      const pitDepth = -8.8;
      const pitRadius = 14.4;
      const pitWallMat = new THREE.MeshStandardMaterial({ color: 0x8b5e34, map: dirtTexture, roughness: 0.9, metalness: 0.0 });
      const pitFloorMat = new THREE.MeshStandardMaterial({ color: 0x6f4426, map: dirtTexture, roughness: 0.94, metalness: 0.0 });
      const stairMat = new THREE.MeshStandardMaterial({ color: 0xa06a3f, map: dirtTexture, roughness: 0.86, metalness: 0.0 });
      const roomWallMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, map: wallPanelTexture, roughness: 0.8, metalness: 0.0 });

      addVisualFloor("strength pit north floor", 72, 22, new THREE.Vector3(0, 0.008, z - 25), whiteMat);
      addVisualFloor("strength pit south floor", 72, 22, new THREE.Vector3(0, 0.008, z + 25), whiteMat);
      addVisualFloor("strength pit west floor", 22, 28, new THREE.Vector3(-25, 0.008, z), whiteMat);
      addVisualFloor("strength pit east floor", 22, 28, new THREE.Vector3(25, 0.008, z), whiteMat);
      [
        [-12, z - 12], [12, z - 12], [-12, z + 12], [12, z + 12]
      ].forEach(([x, zz], index) => {
        addStaticBox(`rounded pit corner floor ${index + 1}`, new THREE.Vector3(7.6, 0.32, 7.6), new THREE.Vector3(x, -0.16, zz), whiteMat);
      });

      const lip = new THREE.Mesh(new THREE.RingGeometry(pitRadius, pitRadius + 2.2, 96), whiteMat);
      lip.rotation.x = -Math.PI / 2;
      lip.position.set(0, 0.018, z);
      lip.receiveShadow = true;
      scene.add(lip);

      const pitBottom = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), pitFloorMat);
      pitBottom.rotation.x = -Math.PI / 2;
      pitBottom.position.set(0, pitDepth, z);
      pitBottom.receiveShadow = true;
      pitBottom.userData.type = "floor";
      pitBottom.userData.name = "dirt brown pit bottom";
      scene.add(pitBottom);
      raycastTargets.push(pitBottom);

      const pitBottomBody = new CANNON.Body({ mass: 0, material: groundMaterial });
      pitBottomBody.addShape(new CANNON.Box(new CANNON.Vec3(pitRadius - 0.4, 0.35, pitRadius - 0.4)));
      pitBottomBody.position.set(0, pitDepth - 0.35, z);
      pitBottomBody.userData = { type: "floor", name: "dirt brown pit bottom" };
      world.addBody(pitBottomBody);

      addStaticBox("strength pit north wall", new THREE.Vector3(72, 18, 0.8), new THREE.Vector3(0, 9, z - 36), roomWallMat);
      addStaticBox("strength pit south wall", new THREE.Vector3(72, 18, 0.8), new THREE.Vector3(0, 9, z + 36), roomWallMat);
      addStaticBox("strength pit west wall", new THREE.Vector3(0.8, 18, 72), new THREE.Vector3(-36, 9, z), roomWallMat);
      addStaticBox("strength pit east wall", new THREE.Vector3(0.8, 18, 72), new THREE.Vector3(36, 9, z), roomWallMat);
      addRoof("strength pit roof", new THREE.Vector3(72, 0.5, 72), new THREE.Vector3(0, 22, z));

      addStaticBox("pit north dirt wall", new THREE.Vector3(29, Math.abs(pitDepth) + 0.45, 0.8), new THREE.Vector3(0, pitDepth * 0.5, z - 14.25), pitWallMat);
      addStaticBox("pit south dirt wall", new THREE.Vector3(29, Math.abs(pitDepth) + 0.45, 0.8), new THREE.Vector3(0, pitDepth * 0.5, z + 14.25), pitWallMat);
      addStaticBox("pit west dirt wall", new THREE.Vector3(0.8, Math.abs(pitDepth) + 0.45, 29), new THREE.Vector3(-14.25, pitDepth * 0.5, z), pitWallMat);
      addStaticBox("pit east dirt wall", new THREE.Vector3(0.8, Math.abs(pitDepth) + 0.45, 29), new THREE.Vector3(14.25, pitDepth * 0.5, z), pitWallMat);

      const rampLength = 18;
      const rampAngle = Math.asin(Math.abs(pitDepth) / rampLength);
      addStaticRamp("north dirt stair ramp", new THREE.Vector3(5.4, 0.28, rampLength), new THREE.Vector3(-5.2, pitDepth * 0.5, z - 6), rampAngle, stairMat);
      addStaticRamp("south dirt stair ramp", new THREE.Vector3(5.4, 0.28, rampLength), new THREE.Vector3(5.2, pitDepth * 0.5, z + 6), -rampAngle, stairMat);
      for (let i = 0; i <= 18; i += 1) {
        const t = i / 18;
        const northY = pitDepth * t + 0.12;
        const southY = pitDepth * t + 0.12;
        addTrackMark(`north pit stair tread ${i + 1}`, new THREE.Vector3(5.6, 0.08, 0.62), new THREE.Vector3(-5.2, northY, z - 15 + t * rampLength), 0xa06a3f);
        addTrackMark(`south pit stair tread ${i + 1}`, new THREE.Vector3(5.6, 0.08, 0.62), new THREE.Vector3(5.2, southY, z + 15 - t * rampLength), 0xa06a3f);
      }

      const pitRing = new THREE.Mesh(new THREE.TorusGeometry(14.35, 0.16, 8, 96), pitWallMat);
      pitRing.rotation.x = Math.PI / 2;
      pitRing.scale.set(1, 1, 0.12);
      pitRing.position.set(0, 0.075, z);
      pitRing.receiveShadow = true;
      scene.add(pitRing);

      [
        [-20, 1.2, z - 20], [-7, 1.2, z - 23], [7, 1.2, z - 23], [20, 1.2, z - 20],
        [-23, 1.2, z - 7], [23, 1.2, z - 7], [-23, 1.2, z + 7], [23, 1.2, z + 7],
        [-20, 1.2, z + 20], [-7, 1.2, z + 23], [7, 1.2, z + 23], [20, 1.2, z + 20]
      ].forEach((p, i) => createDummy(new THREE.Vector3(...p), i % 2 ? 0xef4444 : 0xf97316, {
        knockbackMultiplier: 0.28
      }));

      [
        [-9.2, pitDepth + 1.2, z + 1.2],
        [9.2, pitDepth + 1.2, z - 1.2],
        [0, pitDepth + 1.2, z + 9.2]
      ].forEach((p, i) => createDummy(new THREE.Vector3(...p), 0xfacc15, {
        punchingBag: true,
        noKnockback: true,
        indestructible: true,
        label: `Punching bag ${i + 1}`
      }));

      [
        [-29, 0.7, z - 16], [-29, 0.7, z + 14], [29, 0.7, z - 12], [28, 0.7, z + 18],
        [-10, 0.7, z + 30], [12, 0.7, z - 30]
      ].forEach((p, i) => createMovableBox(new THREE.Vector3(...p), i % 2 ? 0x93c5fd : 0x60a5fa));

      [
        [-9, pitDepth + 0.92, z - 8], [9, pitDepth + 0.92, z - 7], [-8, pitDepth + 0.92, z + 8], [9, pitDepth + 0.92, z + 8],
        [0, pitDepth + 0.92, z - 11], [0, pitDepth + 0.92, z + 11],
        [-25, 0.82, z - 3], [25, 0.82, z + 4]
      ].forEach((p) => createMovableBox(new THREE.Vector3(...p), 0x7c5a3a, {
        isRock: true,
        mass: 8.5,
        size: new THREE.Vector3(1.55, 1.55, 1.55)
      }));
    }

    function buildPowerCity() {
      const z = 460;
      const citySize = 196;
      const skyColor = 0x8fcdf4;
      const groundMat = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, map: concreteTexture, roughness: 0.92, metalness: 0.0 });
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x303841, map: asphaltTexture, roughness: 0.96, metalness: 0.0 });
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xd8dde2, map: sidewalkTexture, roughness: 0.9, metalness: 0.0 });
      const buildingFacadeMats = [
        new THREE.MeshStandardMaterial({ color: 0x6b7c93, map: facadeTextures[0], roughness: 0.7, metalness: 0.08, emissive: 0x172033, emissiveIntensity: 0.08 }),
        new THREE.MeshStandardMaterial({ color: 0x9b6b63, map: facadeTextures[1], roughness: 0.76, metalness: 0.02, emissive: 0x2b1512, emissiveIntensity: 0.06 }),
        new THREE.MeshStandardMaterial({ color: 0x668b87, map: facadeTextures[2], roughness: 0.72, metalness: 0.06, emissive: 0x102826, emissiveIntensity: 0.07 }),
        new THREE.MeshStandardMaterial({ color: 0x887a9b, map: facadeTextures[3], roughness: 0.7, metalness: 0.07, emissive: 0x20172b, emissiveIntensity: 0.07 })
      ];
      const buildingMats = buildingFacadeMats.map((facade) => {
        const roof = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.92,
          metalness: 0.0
        });
        return [facade, facade, roof, roof, facade, facade];
      });

      scene.background = new THREE.Color(skyColor);
      scene.fog = new THREE.Fog(skyColor, 105, 255);
      addVisualFloor("city ground", citySize, citySize, new THREE.Vector3(0, 0.004, z), groundMat);

      function addCitySurface(name, width, depth, x, zz, material, y = 0.018) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, y, zz);
        mesh.receiveShadow = true;
        mesh.userData.type = "floor";
        mesh.userData.name = name;
        scene.add(mesh);
        raycastTargets.push(mesh);
      }

      const roadOffsets = [-58, 0, 58];
      roadOffsets.forEach((offset, index) => {
        addCitySurface(`city north-south road ${index + 1}`, 15, citySize, offset, z, roadMat, 0.024);
        addCitySurface(`city east-west road ${index + 1}`, citySize, 15, 0, z + offset, roadMat, 0.026);
        addTrackMark(`city north-south lane ${index + 1}`, new THREE.Vector3(0.16, 0.026, citySize - 4), new THREE.Vector3(offset, 0.04, z), 0xfacc15);
        addTrackMark(`city east-west lane ${index + 1}`, new THREE.Vector3(citySize - 4, 0.026, 0.16), new THREE.Vector3(0, 0.042, z + offset), 0xfacc15);
      });

      const blockCenters = [-80, -29, 29, 80];
      let buildingIndex = 0;
      blockCenters.forEach((x) => {
        blockCenters.forEach((zOffset) => {
          const sizeX = 22 + ((buildingIndex * 7) % 9);
          const sizeZ = 21 + ((buildingIndex * 5) % 10);
          const height = 13 + ((buildingIndex * 11) % 25);
          const buildingZ = z + zOffset;
          addCitySurface(`city sidewalk block ${buildingIndex + 1}`, Math.min(42, sizeX + 8), Math.min(42, sizeZ + 8), x, buildingZ, sidewalkMat, 0.032);
          addStaticBox(
            `city building ${buildingIndex + 1}`,
            new THREE.Vector3(sizeX, height, sizeZ),
            new THREE.Vector3(x, height * 0.5, buildingZ),
            buildingMats[buildingIndex % buildingMats.length]
          );
          buildingIndex += 1;
        });
      });

      const fenceHeight = 1.7;
      const fenceEdge = citySize * 0.5 - 0.35;
      const fencePanelMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.5,
        metalness: 0.5,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
      });
      addStaticBox("city north fence", new THREE.Vector3(citySize, fenceHeight, 0.34), new THREE.Vector3(0, fenceHeight * 0.5, z - fenceEdge), fencePanelMat);
      addStaticBox("city south fence", new THREE.Vector3(citySize, fenceHeight, 0.34), new THREE.Vector3(0, fenceHeight * 0.5, z + fenceEdge), fencePanelMat);
      addStaticBox("city west fence", new THREE.Vector3(0.34, fenceHeight, citySize), new THREE.Vector3(-fenceEdge, fenceHeight * 0.5, z), fencePanelMat);
      addStaticBox("city east fence", new THREE.Vector3(0.34, fenceHeight, citySize), new THREE.Vector3(fenceEdge, fenceHeight * 0.5, z), fencePanelMat);

      const fenceMetalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.46, metalness: 0.62 });
      const railGeometryHorizontal = new THREE.BoxGeometry(citySize, 0.1, 0.12);
      const railGeometryVertical = new THREE.BoxGeometry(0.12, 0.1, citySize);
      [0.5, 1.45].forEach((height) => {
        const northRail = new THREE.Mesh(railGeometryHorizontal, fenceMetalMat);
        northRail.position.set(0, height, z - fenceEdge);
        const southRail = northRail.clone();
        southRail.position.z = z + fenceEdge;
        const westRail = new THREE.Mesh(railGeometryVertical, fenceMetalMat);
        westRail.position.set(-fenceEdge, height, z);
        const eastRail = westRail.clone();
        eastRail.position.x = fenceEdge;
        scene.add(northRail, southRail, westRail, eastRail);
      });

      const postPositions = [];
      for (let offset = -citySize * 0.5; offset <= citySize * 0.5; offset += 7) {
        postPositions.push(new THREE.Vector3(offset, fenceHeight * 0.5, z - fenceEdge));
        postPositions.push(new THREE.Vector3(offset, fenceHeight * 0.5, z + fenceEdge));
        postPositions.push(new THREE.Vector3(-fenceEdge, fenceHeight * 0.5, z + offset));
        postPositions.push(new THREE.Vector3(fenceEdge, fenceHeight * 0.5, z + offset));
      }
      const fencePosts = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.16, fenceHeight, 0.16),
        fenceMetalMat,
        postPositions.length
      );
      const postMatrix = new THREE.Matrix4();
      postPositions.forEach((position, index) => {
        postMatrix.makeTranslation(position.x, position.y, position.z);
        fencePosts.setMatrixAt(index, postMatrix);
      });
      fencePosts.instanceMatrix.needsUpdate = true;
      fencePosts.castShadow = true;
      fencePosts.receiveShadow = true;
      scene.add(fencePosts);

      const pedestrianPoints = [
        [9, 1.2, z + 8], [-12, 1.2, z - 10], [18, 1.2, z + 48], [-19, 1.2, z - 47],
        [48, 1.2, z + 14], [-47, 1.2, z - 15], [66, 1.2, z + 49], [-67, 1.2, z - 50],
        [48, 1.2, z - 67], [-49, 1.2, z + 68]
      ];
      const pedestrianColors = [0x22c55e, 0xf97316, 0x38bdf8, 0xe879f9, 0xfacc15];
      pedestrianPoints.forEach((point, index) => createDummy(
        new THREE.Vector3(...point),
        pedestrianColors[index % pedestrianColors.length],
        {
          maxHealth: 70,
          knockbackMultiplier: 0.72,
          label: `Pedestrian dummy ${index + 1}`
        }
      ));
    }

    const mapBuilders = {
      hub: buildHub,
      speedTrack: buildSuperSpeedTrack,
      minionArena: buildMinionArena,
      strengthPit: buildStrengthPit,
      city: buildPowerCity
    };

    function ensureSelectedMapBuilt() {
      if (builtMap === selectedMap) return;
      if (builtMap !== null) throw new Error("Only one map can be loaded per game session.");
      mapBuilders[selectedMap]();
      builtMap = selectedMap;
    }

    // Player body is a stable sphere for smooth movement; the visible mesh is a simple third-person avatar.
    const playerBody = new CANNON.Body({
      mass: 6,
      material: playerMaterial,
      fixedRotation: true,
      linearDamping: 0.08,
      allowSleep: false
    });
    playerBody.addShape(new CANNON.Sphere(0.52));
    playerBody.position.set(0, 0.54, 12);
    playerBody.updateMassProperties();
    playerBody.addEventListener("collide", (event) => {
      if (selectedPower !== "jump") return;
      const other = event.body;
      const otherType = other && other.userData && other.userData.type;
      if (otherType !== "obstacle") return;
      const normal = threeFromCannon(other.position).sub(threeFromCannon(playerBody.position));
      if (normal.lengthSq() < 0.01 || Math.abs(normal.y) > Math.abs(normal.x) + Math.abs(normal.z)) return;
      triggerWallBounce(normal.normalize(), threeFromCannon(playerBody.position).addScaledVector(normal.normalize(), 0.52));
    });
    world.addBody(playerBody);

    const playerMaterialMain = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.42, metalness: 0.0 });
    const suitDarkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.0 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.44, metalness: 0.0 });
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.62, metalness: 0.0, side: THREE.DoubleSide });
    const robotArmorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.45 });
    const robotGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.88 });
    const playerParts = {};

    function makePart(geometry, material, parent, position) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function addPearlArrow(parent) {
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.014), arrowMat);
      stem.position.set(0, -0.025, 0.172);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.095, 3), arrowMat);
      head.position.set(0, 0.065, 0.172);
      head.rotation.z = Math.PI;
      parent.add(stem, head);
    }

    function makeLimb(name, side, y, length, radius, material) {
      const pivot = new THREE.Group();
      pivot.position.set(side, y, 0);
      playerGroup.add(pivot);
      const limb = makePart(new THREE.CapsuleGeometry(radius, length, 8, 14), material, pivot, new THREE.Vector3(0, -length * 0.42, 0));
      playerParts[name] = pivot;
      playerParts[`${name}Mesh`] = limb;
      return limb;
    }

    const playerGroup = new THREE.Group();
    playerGroup.rotation.order = "YXZ";
    const playerTorso = makePart(new THREE.CapsuleGeometry(0.34, 0.62, 10, 18), playerMaterialMain, playerGroup, new THREE.Vector3(0, 0.92, 0));
    const playerChest = new THREE.Object3D();
    playerGroup.add(playerChest);
    const playerHead = makePart(new THREE.SphereGeometry(0.29, 20, 16), skinMat, playerGroup, new THREE.Vector3(0, 1.58, 0));
    const playerCape = makePart(new THREE.PlaneGeometry(0.88, 1.18, 6, 6), capeMat, playerGroup, new THREE.Vector3(0, 0.84, -0.31));
    playerGroup.remove(playerCape);
    playerTorso.add(playerCape);
    playerCape.position.set(0, 0.04, -0.34);
    playerCape.rotation.set(0.24, 0, 0);
    playerCape.visible = false;
    playerParts.torso = playerTorso;
    playerParts.chest = playerChest;
    playerParts.head = playerHead;
    playerParts.cape = playerCape;

    makeLimb("leftArm", -0.47, 1.23, 0.58, 0.105, playerMaterialMain.clone()).rotation.z = -0.14;
    makeLimb("rightArm", 0.47, 1.23, 0.58, 0.105, playerMaterialMain.clone()).rotation.z = 0.14;
    makeLimb("leftLeg", -0.2, 0.55, 0.62, 0.12, suitDarkMat);
    makeLimb("rightLeg", 0.2, 0.55, 0.62, 0.12, suitDarkMat);

    const leftHand = makePart(new THREE.SphereGeometry(0.115, 12, 10), skinMat.clone(), playerParts.leftArm, new THREE.Vector3(0, -0.68, -0.01));
    const rightHand = makePart(new THREE.SphereGeometry(0.115, 12, 10), skinMat.clone(), playerParts.rightArm, new THREE.Vector3(0, -0.68, -0.01));
    const leftFoot = makePart(new THREE.BoxGeometry(0.23, 0.12, 0.36), suitDarkMat, playerParts.leftLeg, new THREE.Vector3(0, -0.74, -0.06));
    const rightFoot = makePart(new THREE.BoxGeometry(0.23, 0.12, 0.36), suitDarkMat, playerParts.rightLeg, new THREE.Vector3(0, -0.74, -0.06));
    leftFoot.material = suitDarkMat.clone();
    rightFoot.material = suitDarkMat.clone();
    Object.assign(playerParts, { leftHand, rightHand, leftFoot, rightFoot });
    const heldPearl = makePart(
      new THREE.SphereGeometry(0.13, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xff4fb8, roughness: 0.32, metalness: 0.05, emissive: 0x7c1d5a, emissiveIntensity: 0.18 }),
      playerParts.rightHand,
      new THREE.Vector3(0.03, -0.09, -0.13)
    );
    heldPearl.visible = false;
    addPearlArrow(heldPearl);
    playerParts.heldPearl = heldPearl;

    const strongSword = new THREE.Group();
    strongSword.visible = false;
    strongSword.position.set(0.02, -0.02, 0.12);
    strongSword.rotation.set(0.38, 0, 0.03);
    playerParts.rightHand.add(strongSword);
    const swordHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.052, 0.36, 10),
      new THREE.MeshStandardMaterial({ color: 0x7c4a25, roughness: 0.65 })
    );
    swordHandle.position.y = -0.05;
    strongSword.add(swordHandle);
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.92, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.34, metalness: 0.18, emissive: 0x7f1d1d, emissiveIntensity: 0.16 })
    );
    swordBlade.position.y = 0.55;
    strongSword.add(swordBlade);
    const swordGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.07, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x4b2e18, roughness: 0.6 })
    );
    swordGuard.position.y = 0.15;
    strongSword.add(swordGuard);
    const fistMark = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    fistMark.scale.set(1.35, 0.8, 0.25);
    fistMark.position.set(0, 0.54, -0.055);
    strongSword.add(fistMark);
    playerParts.strongSword = strongSword;

    const robotArmorGroup = new THREE.Group();
    robotArmorGroup.visible = false;
    playerGroup.add(robotArmorGroup);
    makePart(new THREE.BoxGeometry(0.92, 0.34, 0.28), robotArmorMat, robotArmorGroup, new THREE.Vector3(0, 1.13, 0.08));
    makePart(new THREE.BoxGeometry(0.74, 0.12, 0.05), robotGlowMat, robotArmorGroup, new THREE.Vector3(0, 1.6, 0.24));
    makePart(new THREE.BoxGeometry(0.28, 0.22, 0.38), robotArmorMat, robotArmorGroup, new THREE.Vector3(-0.5, 1.25, 0));
    makePart(new THREE.BoxGeometry(0.28, 0.22, 0.38), robotArmorMat, robotArmorGroup, new THREE.Vector3(0.5, 1.25, 0));
    makePart(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), robotGlowMat, robotArmorGroup, new THREE.Vector3(0, 1.12, 0.24)).rotation.x = Math.PI / 2;
    const leftBlaster = makePart(new THREE.CylinderGeometry(0.085, 0.1, 0.42, 12), robotArmorMat, playerParts.leftArm, new THREE.Vector3(0, -0.45, -0.18));
    const rightBlaster = makePart(new THREE.CylinderGeometry(0.085, 0.1, 0.42, 12), robotArmorMat, playerParts.rightArm, new THREE.Vector3(0, -0.45, -0.18));
    leftBlaster.rotation.x = Math.PI / 2;
    rightBlaster.rotation.x = Math.PI / 2;
    leftBlaster.visible = false;
    rightBlaster.visible = false;
    const robotShield = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.0, wireframe: true, depthWrite: false })
    );
    robotShield.position.y = 0.98;
    robotShield.visible = false;
    playerGroup.add(robotShield);
    Object.assign(playerParts, { robotArmorGroup, leftBlaster, rightBlaster, robotShield });

    const auraMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.34, depthWrite: false });
    const playerAura = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.025, 8, 54), auraMat);
    playerAura.rotation.x = Math.PI / 2;
    playerAura.position.y = 0.12;
    playerParts.aura = playerAura;
    scene.add(playerGroup);

    function createRemotePlayer(id, power = "speed") {
      const color = power === "webs" ? 0xdc2626 : (POWER_DATA[power]?.color || 0x2563eb);
      const group = new THREE.Group();
      const main = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.52 });
      const skin = new THREE.MeshStandardMaterial({ color: power === "robot" ? 0x334155 : 0xf8fafc, roughness: 0.45 });
      const torso = makePart(new THREE.CapsuleGeometry(0.34, 0.62, 8, 14), main, group, new THREE.Vector3(0, 0.92, 0));
      makePart(new THREE.SphereGeometry(0.29, 16, 12), skin, group, new THREE.Vector3(0, 1.58, 0));
      const limbs = [];
      [[-0.47, 1.2, main], [0.47, 1.2, main], [-0.2, 0.55, dark], [0.2, 0.55, dark]].forEach(([x, y, material], index) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, y, 0);
        const limbMaterial = power === "webs" && index < 2 ? skin : material;
        makePart(new THREE.CapsuleGeometry(index < 2 ? 0.105 : 0.12, index < 2 ? 0.58 : 0.62, 7, 10), limbMaterial, pivot, new THREE.Vector3(0, -0.26, 0));
        group.add(pivot);
        limbs.push(pivot);
      });
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
      marker.rotation.x = Math.PI / 2;
      marker.position.y = 0.1;
      group.add(marker);
      group.userData.remoteId = id;
      scene.add(group);
      const remote = { id, power, group, torso, limbs, target: new THREE.Vector3(), targetYaw: 0, move: 0, walk: 0 };
      remotePlayers.set(id, remote);
      return remote;
    }

    function removeRemotePlayer(id) {
      const remote = remotePlayers.get(id);
      if (!remote) return;
      scene.remove(remote.group);
      remote.group.traverse((child) => {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
        else child.material?.dispose();
      });
      remotePlayers.delete(id);
    }

    function ensureRemotePlayer(player) {
      if (!player?.id || player.id === multiplayerClient?.id || player.map !== selectedMap) return null;
      const existing = remotePlayers.get(player.id);
      if (existing?.power === player.power) return existing;
      if (existing) removeRemotePlayer(player.id);
      const remote = createRemotePlayer(player.id, player.power);
      if (player.state) applyRemoteState(player.id, player.state, true);
      return remote;
    }

    function applyRemoteState(id, state, snap = false) {
      if (!state?.position) return;
      const remote = remotePlayers.get(id);
      if (!remote) return;
      remote.target.fromArray(state.position);
      remote.targetYaw = Number(state.yaw) || 0;
      remote.move = THREE.MathUtils.clamp(Number(state.move) || 0, 0, 1);
      if (snap) remote.group.position.copy(remote.target);
    }

    function handleMultiplayerMessage(event) {
      const packet = event.detail;
      if (packet.type === "welcome") packet.players.forEach(ensureRemotePlayer);
      if (packet.type === "player-joined" || packet.type === "player-updated") ensureRemotePlayer(packet.player);
      if (packet.type === "player-state") applyRemoteState(packet.id, packet.state);
      if (packet.type === "player-left") removeRemotePlayer(packet.id);
    }

    async function connectToMultiplayer() {
      if (!onlineMode || !gameStarted) return;
      const roomCode = normalizeRoomCode(roomCodeInput.value) || createRoomCode();
      roomCodeInput.value = roomCode;
      if (multiplayerClient?.roomCode === roomCode && multiplayerClient.socket?.readyState === WebSocket.OPEN) return;
      remotePlayers.forEach((remote) => removeRemotePlayer(remote.id));
      multiplayerClient?.disconnect();
      multiplayerClient = new MultiplayerClient();
      multiplayerClient.addEventListener("message", handleMultiplayerMessage);
      multiplayerClient.addEventListener("status", (event) => {
        if (!event.detail.connected) {
          multiplayerStatus.hidden = true;
          if (gameStarted && event.detail.reason !== "Leaving room") showMessage("Multiplayer disconnected. Solo play is still active.", 2600);
        }
      });
      try {
        await multiplayerClient.connect(roomCode, { power: selectedPower, map: selectedMap });
        multiplayerStatus.hidden = false;
        activeRoomCode.textContent = roomCode;
        showMessage(`Online room ${roomCode}. Share this code with friends.`, 3400);
      } catch (error) {
        multiplayerStatus.hidden = true;
        showMessage(`${error.message} Continuing in solo mode.`, 3200);
      }
    }

    function updateMultiplayer(now, delta) {
      for (const remote of remotePlayers.values()) {
        remote.group.position.lerp(remote.target, Math.min(1, delta * 13));
        remote.group.rotation.y = THREE.MathUtils.lerp(remote.group.rotation.y, remote.targetYaw, Math.min(1, delta * 12));
        remote.walk += delta * (5 + remote.move * 7);
        const stride = Math.sin(remote.walk) * remote.move * 0.8;
        remote.limbs[0].rotation.x = stride;
        remote.limbs[1].rotation.x = -stride;
        remote.limbs[2].rotation.x = -stride;
        remote.limbs[3].rotation.x = stride;
        remote.torso.position.y = 0.92 + Math.abs(Math.sin(remote.walk)) * remote.move * 0.04;
      }
      if (!multiplayerClient?.id || now < multiplayerSendAt) return;
      multiplayerSendAt = now + 66;
      multiplayerClient.sendState({
        position: [playerGroup.position.x, playerGroup.position.y, playerGroup.position.z],
        yaw: playerGroup.rotation.y,
        move: moveIntensity,
        health: playerHealth,
      });
    }

    function getCameraForward(flatten = false) {
      camera.getWorldDirection(tmpVec3);
      if (flatten) tmpVec3.y = 0;
      if (tmpVec3.lengthSq() < 0.001) tmpVec3.set(0, 0, -1);
      return tmpVec3.normalize().clone();
    }

    function getCameraRight() {
      const forward = getCameraForward(true);
      return new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    }

    function cannonFromThree(v) {
      return new CANNON.Vec3(v.x, v.y, v.z);
    }

    function threeFromCannon(v) {
      return new THREE.Vector3(v.x, v.y, v.z);
    }

    function clampPointToMap(point) {
      const bounds = MAP_DATA[selectedMap].bounds;
      point.x = THREE.MathUtils.clamp(point.x, bounds.minX, bounds.maxX);
      point.z = THREE.MathUtils.clamp(point.z, bounds.minZ, bounds.maxZ);
      return point;
    }

    function showMessage(text, duration = 1400) {
      message.textContent = text;
      message.style.display = "block";
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => {
        message.style.display = "none";
      }, duration);
    }

    function effectMaterial(color, opacity = 0.72) {
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
    }

    function spawnRing(position, color, startScale = 0.6, endScale = 4.5, life = 0.55) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 8, 80), effectMaterial(color, 0.68));
      ring.position.copy(position);
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(startScale);
      scene.add(ring);
      activeEffects.push({
        mesh: ring,
        life,
        age: 0,
        update: (mesh, t) => {
          const s = THREE.MathUtils.lerp(startScale, endScale, t);
          mesh.scale.setScalar(s);
          mesh.material.opacity = 0.68 * (1 - t);
        }
      });
    }

    function groundEffectPoint(position, lift = 0.08) {
      const origin = position.clone().add(new THREE.Vector3(0, 2.4, 0));
      raycaster.set(origin, new THREE.Vector3(0, -1, 0));
      raycaster.far = 24;
      const hit = raycaster.intersectObjects(raycastTargets, true)
        .map((item) => ({ ...item, target: resolveTarget(item.object) }))
        .find((item) => {
          if (!item.target) return false;
          const type = item.target.userData.type;
          return type === "floor" || type === "obstacle" || type === "track-mark" || type === "movableBox";
        });
      if (hit) return hit.point.clone().add(new THREE.Vector3(0, lift, 0));
      return position.clone().add(new THREE.Vector3(0, -0.52 + lift, 0));
    }

    function spawnBeam(start, end, color, radius = 0.055, life = 0.22) {
      const direction = end.clone().sub(start);
      const length = Math.max(direction.length(), 0.01);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), effectMaterial(color, 0.86));
      beam.position.copy(start).addScaledVector(direction, 0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      scene.add(beam);
      activeEffects.push({
        mesh: beam,
        life,
        age: 0,
        update: (mesh, t) => {
          mesh.scale.x = mesh.scale.z = 1 + t * 1.8;
          mesh.material.opacity = 0.86 * (1 - t);
        }
      });
    }

    function disposeVisual(root) {
      if (!root) return;
      scene.remove(root);
      root.traverse((child) => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
        else child.material?.dispose?.();
      });
    }

    function createWebCord() {
      const group = new THREE.Group();
      const colors = [0x94a3b8, 0xffffff, 0xffffff];
      const lines = colors.map((color, index) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: index === 0 ? 0.82 : 0.96,
          depthWrite: false,
          depthTest: false
        });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 40;
        group.add(line);
        return line;
      });
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 1, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false, depthTest: false })
      );
      core.renderOrder = 41;
      group.add(core);
      group.visible = false;
      scene.add(group);
      return { group, lines, core };
    }

    function updateWebCord(start, end, visible = true, sag = 0.08) {
      if (!webCord) webCord = createWebCord();
      webCord.group.visible = visible;
      if (!visible) return;
      const coreDirection = end.clone().sub(start);
      const coreLength = Math.max(0.01, coreDirection.length());
      webCord.core.position.copy(start).addScaledVector(coreDirection, 0.5);
      webCord.core.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), coreDirection.normalize());
      webCord.core.scale.set(1, coreLength, 1);
      const cameraSide = getCameraRight().multiplyScalar(0.018);
      webCord.lines.forEach((line, lineIndex) => {
        const side = lineIndex - 1;
        const points = [];
        for (let i = 0; i <= 12; i += 1) {
          const t = i / 12;
          const point = start.clone().lerp(end, t);
          point.y -= Math.sin(Math.PI * t) * sag;
          point.addScaledVector(cameraSide, side * Math.sin(Math.PI * t));
          points.push(point);
        }
        line.geometry.setFromPoints(points);
      });
    }

    function createWebNet(radius = 1.4) {
      const group = new THREE.Group();
      const points = [];
      const spokes = 14;
      const rings = 5;
      for (let spoke = 0; spoke < spokes; spoke += 1) {
        const angle = (spoke / spokes) * Math.PI * 2;
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      }
      for (let ring = 1; ring <= rings; ring += 1) {
        const ringRadius = radius * (ring / rings);
        for (let spoke = 0; spoke < spokes; spoke += 1) {
          const a = (spoke / spokes) * Math.PI * 2;
          const b = ((spoke + 1) / spokes) * Math.PI * 2;
          const wobbleA = 1 + Math.sin(spoke * 2.31 + ring) * 0.035;
          const wobbleB = 1 + Math.sin((spoke + 1) * 2.31 + ring) * 0.035;
          points.push(new THREE.Vector3(Math.cos(a) * ringRadius * wobbleA, Math.sin(a) * ringRadius * wobbleA, 0));
          points.push(new THREE.Vector3(Math.cos(b) * ringRadius * wobbleB, Math.sin(b) * ringRadius * wobbleB, 0));
        }
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.88, depthWrite: false });
      group.add(new THREE.LineSegments(geometry, material));
      return group;
    }

    function createWebWrap() {
      const group = new THREE.Group();
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc, wireframe: true, transparent: true, opacity: 0.68, depthWrite: false })
      );
      shell.scale.set(1, 1.45, 1);
      group.add(shell);
      for (let i = -2; i <= 2; i += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.56 - Math.abs(i) * 0.055, 0.015, 6, 34),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.86, depthWrite: false })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 0.3;
        group.add(ring);
      }
      scene.add(group);
      return group;
    }

    function spawnSlashArc(origin, forward, color) {
      const flatForward = forward.clone().setY(0).normalize();
      const right = new THREE.Vector3(flatForward.z, 0, -flatForward.x).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const points = [];
      const steps = 9;

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const sweep = THREE.MathUtils.lerp(-1.05, 1.05, t);
        const point = origin.clone()
          .addScaledVector(flatForward, 1.7 + Math.cos(sweep) * 0.5)
          .addScaledVector(right, Math.sin(sweep) * 1.75)
          .addScaledVector(up, 0.62 - t * 0.78);
        points.push(point);
      }

      for (let i = 1; i < points.length; i += 1) {
        spawnBeam(points[i - 1], points[i], color, 0.07 - i * 0.003, 0.2);
      }
      spawnBurst(points[Math.floor(points.length * 0.55)], color, 8, 0.28);
    }

    function spawnBurst(position, color, count = 14, life = 0.62) {
      for (let i = 0; i < count; i += 1) {
        const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), effectMaterial(color, 0.9));
        spark.position.copy(position);
        const angle = (i / count) * Math.PI * 2;
        const lift = 0.25 + Math.random() * 0.9;
        const velocity = new THREE.Vector3(Math.cos(angle), lift, Math.sin(angle)).normalize().multiplyScalar(3 + Math.random() * 3.4);
        scene.add(spark);
        activeEffects.push({
          mesh: spark,
          life,
          age: 0,
          update: (mesh, t, delta) => {
            mesh.position.addScaledVector(velocity, delta);
            mesh.scale.setScalar(THREE.MathUtils.lerp(1, 0.12, t));
            mesh.material.opacity = 0.9 * (1 - t);
          }
        });
      }
    }

    function spawnSpeedTrail(start, end, color) {
      spawnBeam(start.clone().add(new THREE.Vector3(0, 0.7, 0)), end.clone().add(new THREE.Vector3(0, 0.7, 0)), color, 0.08, 0.32);
      spawnRing(start.clone().setY(0.08), color, 0.35, 1.6, 0.34);
      spawnRing(end.clone().setY(0.08), color, 0.35, 1.8, 0.34);
    }

    function spawnElectricTrail(start, end) {
      const yellow = POWER_DATA.speed.color;
      spawnBeam(start.clone().add(new THREE.Vector3(0, 0.28, 0)), end.clone().add(new THREE.Vector3(0, 0.28, 0)), yellow, 0.035, 0.22);
      for (let i = 0; i < 3; i += 1) {
        const offsetA = new THREE.Vector3((Math.random() - 0.5) * 0.55, 0.35 + Math.random() * 0.65, (Math.random() - 0.5) * 0.55);
        const offsetB = new THREE.Vector3((Math.random() - 0.5) * 0.55, 0.35 + Math.random() * 0.65, (Math.random() - 0.5) * 0.55);
        spawnBeam(start.clone().add(offsetA), end.clone().add(offsetB), yellow, 0.018, 0.16);
      }
    }

    function spawnJumpTrail(start, end) {
      const blue = POWER_DATA.jump.color;
      spawnBeam(start.clone().add(new THREE.Vector3(0, 0.45, 0)), end.clone().add(new THREE.Vector3(0, 0.45, 0)), blue, 0.04, 0.24);
      spawnBurst(end.clone().add(new THREE.Vector3(0, 0.34, 0)), blue, 4, 0.24);
    }

    function isSpeedSprinting() {
      return selectedPower === "speed" && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
    }

    function isRobotForwardThrusting() {
      return selectedPower === "robot" && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
    }

    function isRobotUpThrusting() {
      return selectedPower === "robot" && keys.has("Space");
    }

    function spawnFootThrusters(forwardThrust, upThrust) {
      const color = POWER_DATA.robot.color;
      const leftFootPos = playerParts.leftFoot.getWorldPosition(new THREE.Vector3());
      const rightFootPos = playerParts.rightFoot.getWorldPosition(new THREE.Vector3());
      const forward = getCameraForward(true);
      const exhaustDir = upThrust
        ? new THREE.Vector3(0, -1, 0)
        : forward.clone().multiplyScalar(-1).add(new THREE.Vector3(0, -0.24, 0)).normalize();

      [leftFootPos, rightFootPos].forEach((footPos) => {
        const start = footPos.clone().add(new THREE.Vector3(0, -0.06, 0));
        const end = start.clone().addScaledVector(exhaustDir, forwardThrust && upThrust ? 1.25 : 0.9);
        spawnBeam(start, end, color, 0.035, 0.14);
        spawnBurst(end, color, 4, 0.18);
      });
    }

    function updateEffects(delta) {
      for (let i = activeEffects.length - 1; i >= 0; i -= 1) {
        const effect = activeEffects[i];
        effect.age += delta;
        const t = THREE.MathUtils.clamp(effect.age / effect.life, 0, 1);
        effect.update(effect.mesh, t, delta);
        if (t >= 1) {
          scene.remove(effect.mesh);
          effect.mesh.geometry.dispose();
          effect.mesh.material.dispose();
          activeEffects.splice(i, 1);
        }
      }
    }

    function groundedHit() {
      const origin = threeFromCannon(playerBody.position).add(new THREE.Vector3(0, 0.12, 0));
      raycaster.set(origin, new THREE.Vector3(0, -1, 0));
      raycaster.far = 0.98;
      return raycaster.intersectObjects(raycastTargets, true)
        .map((item) => ({ ...item, target: resolveTarget(item.object) }))
        .find((item) => {
          if (!item.target) return false;
          const type = item.target.userData.type;
          return type === "floor" || type === "obstacle" || type === "movableBox" || type === "track-mark";
        });
    }

    function isGrounded() {
      if (Math.abs(playerBody.velocity.y) > 5.2) return false;
      return Boolean(groundedHit());
    }

    function findSpiderWall() {
      if (selectedPower !== "webs" || webSwingActive || webZipState || webPullState) return null;
      const origin = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      const right = getCameraRight();
      const directions = webWallWalkActive
        ? [webWallNormal.clone().negate(), forward, forward.clone().negate(), right, right.clone().negate()]
        : [forward, forward.clone().negate(), right, right.clone().negate()];

      let closest = null;
      directions.forEach((direction) => {
        if (direction.lengthSq() < 0.001) return;
        raycaster.set(origin, direction.normalize());
        raycaster.far = 0.88;
        const hit = raycaster.intersectObjects(raycastTargets, true).find((item) => {
          const target = resolveTarget(item.object);
          if (!target || !item.face) return false;
          const type = target.userData.type;
          return type === "obstacle" || type === "roof";
        });
        if (!hit || (closest && hit.distance >= closest.distance)) return;
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
        if (Math.abs(normal.y) > 0.32) return;
        closest = { distance: hit.distance, normal, point: hit.point.clone() };
      });
      return closest;
    }

    function updateSpiderWallWalk(delta, speed) {
      if (selectedPower !== "webs" || webSwingActive || webZipState || webPullState) {
        webWallWalkActive = false;
        webWallMoving = false;
        return false;
      }

      const verticalInput = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0)
        - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      const horizontalInput = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0)
        - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      const hasMovementInput = verticalInput !== 0 || horizontalInput !== 0;
      webWallVerticalInput = verticalInput;
      webWallHorizontalInput = horizontalInput;
      webWallMoving = hasMovementInput;
      const contact = findSpiderWall();
      const now = performance.now();

      if (now < webWallDetachUntil) {
        webWallWalkActive = false;
        webWallMoving = false;
        return false;
      }

      if (contact) {
        webWallNormal.lerp(contact.normal, webWallWalkActive ? Math.min(1, delta * 18) : 1).normalize();
        webWallLastContactAt = now;
      } else if (!webWallWalkActive || now - webWallLastContactAt > 120) {
        webWallWalkActive = false;
        webWallMoving = false;
        return false;
      }

      if (!webWallWalkActive && !hasMovementInput) return false;
      webWallWalkActive = true;
      const up = new THREE.Vector3(0, 1, 0);
      const wallRight = new THREE.Vector3().crossVectors(up, webWallNormal).normalize();
      if (wallRight.dot(getCameraRight()) < 0) wallRight.negate();
      const crawlSpeed = speed * 0.82;
      const lateralSpeed = horizontalInput * crawlSpeed;
      const verticalSpeed = verticalInput * crawlSpeed;

      playerBody.wakeUp();
      playerBody.velocity.x = wallRight.x * lateralSpeed - webWallNormal.x * 0.3;
      playerBody.velocity.y = verticalSpeed;
      playerBody.velocity.z = wallRight.z * lateralSpeed - webWallNormal.z * 0.3;
      playerBody.force.y += -world.gravity.y * playerBody.mass;
      playerBody.force.x += -webWallNormal.x * playerBody.mass * 18;
      playerBody.force.z += -webWallNormal.z * playerBody.mass * 18;
      return true;
    }

    function jumpOffSpiderWall() {
      if (!webWallWalkActive) return false;
      const jumpNormal = webWallNormal.clone();
      webWallWalkActive = false;
      webWallMoving = false;
      webWallLastContactAt = 0;
      webWallDetachUntil = performance.now() + 360;
      playerBody.position.x += jumpNormal.x * 0.12;
      playerBody.position.z += jumpNormal.z * 0.12;
      playerBody.velocity.set(jumpNormal.x * 8.8, 4.6, jumpNormal.z * 8.8);
      playerBody.wakeUp();
      playSfx("webSwingRelease");
      showMessage("Wall jump — press Space again in the air to swing", 900);
      return true;
    }

    function resolveTarget(object) {
      let current = object;
      while (current) {
        if (current.userData && current.userData.type) return current;
        current = current.parent;
      }
      return null;
    }

    function centerRaycast(maxDistance = 70) {
      raycaster.setFromCamera(mouseNdc, camera);
      raycaster.far = maxDistance;
      const hits = raycaster.intersectObjects(raycastTargets, true);
      for (const hit of hits) {
        const target = resolveTarget(hit.object);
        if (target && target !== playerGroup) {
          return { ...hit, target };
        }
      }
      return null;
    }

    function updateDummyHealthBar(dummy) {
      const pct = THREE.MathUtils.clamp(dummy.health / dummy.maxHealth, 0, 1);
      dummy.healthFill.scale.x = pct;
      dummy.healthFill.position.x = -(dummy.fillWidth || 0.86) * 0.5 * (1 - pct);
      dummy.healthFill.material.color.setHex(pct > 0.55 ? 0x22c55e : pct > 0.25 ? 0xfacc15 : 0xef4444);
    }

    function removeFromArray(array, item) {
      const index = array.indexOf(item);
      if (index >= 0) array.splice(index, 1);
    }

    function removeRobotMinion(minion) {
      if (!minion) return;
      if (minion.webWrap) disposeVisual(minion.webWrap);
      if (webPullState?.target === minion) {
        webPullState = null;
        if (webCord) webCord.group.visible = false;
      }
      removeFromArray(dynamicDummies, minion);
      removeFromArray(raycastTargets, minion.group);
      const syncIndex = syncPairs.findIndex((pair) => pair.mesh === minion.group);
      if (syncIndex >= 0) syncPairs.splice(syncIndex, 1);
      scene.remove(minion.group);
      scene.remove(minion.healthGroup);
      world.removeBody(minion.body);
      if (activeMinion === minion) activeMinion = null;
    }

    function spawnNextMinion() {
      if (!gameStarted || selectedMap !== "minionArena" || activeMinion || minionSpawnPoints.length === 0) return;
      if (minionSpawnIndex >= minionSpawnPoints.length) {
        minionSpawnIndex = 0;
        showMessage("New minion patrol cycle", 900);
      }
      const spawn = minionSpawnPoints[minionSpawnIndex].clone();
      minionSpawnIndex += 1;
      activeMinion = createRobotMinion(spawn);
      spawnRing(groundEffectPoint(spawn), 0xef4444, 0.4, 2.6, 0.45);
      spawnBurst(spawn.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xef4444, 10, 0.42);
      playSfx("minionSpawn");
      showMessage(`Minion ${minionSpawnIndex}/${minionSpawnPoints.length} deployed`, 900);
    }

    function resetMinionArena() {
      dynamicDummies.filter((target) => target.isMinion).forEach((minion) => removeRobotMinion(minion));
      activeMinion = null;
      minionSpawnIndex = 0;
      minionRespawnTimer = 0.2;
    }

    function defeatRobotMinion(minion) {
      minion.isDefeated = true;
      const pos = threeFromCannon(minion.body.position);
      spawnRing(groundEffectPoint(pos), 0xef4444, 0.45, 2.4, 0.42);
      spawnBurst(pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xef4444, 14, 0.5);
      playSfx("minionDefeat");
      showMessage("Robot minion defeated", 800);
      if (heldObject === minion) heldObject = null;
      removeRobotMinion(minion);
      minionRespawnTimer = 0.85;
    }

    function damageDummy(dummy, amount) {
      if (!dummy || amount <= 0) return;
      if (dummy.indestructible) {
        dummy.health = dummy.maxHealth;
        updateDummyHealthBar(dummy);
        return;
      }
      dummy.health = Math.max(0, dummy.health - amount);
      updateDummyHealthBar(dummy);
      if (dummy.health <= 0) {
        if (dummy.isMinion) {
          defeatRobotMinion(dummy);
          return;
        }
        dummy.health = dummy.maxHealth;
        dummy.body.position.set(dummy.spawn.x, dummy.spawn.y, dummy.spawn.z);
        dummy.body.velocity.set(0, 0, 0);
        dummy.body.angularVelocity.set(0, 0, 0);
        updateDummyHealthBar(dummy);
        spawnRing(groundEffectPoint(threeFromCannon(dummy.body.position)), 0xef4444, 0.35, 2.2, 0.45);
        showMessage(`${dummy.label || "Training dummy"} reset`, 700);
      }
    }

    function damagePlayer(amount, sourcePosition = null) {
      if (!gameStarted || amount <= 0) return;
      if (selectedPower === "robot" && robotShieldMode) {
        playerDamageFlash = 0.18;
        spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.robot.color, 0.45, 1.9, 0.28);
        playSfx("shieldBlock");
        showMessage("Defense Shield blocked the hit", 650);
        return;
      }
      playerHealth = Math.max(0, playerHealth - amount);
      playerDamageFlash = 0.45;
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), 0xef4444, 0.35, 1.45, 0.24);
      playSfx("playerHit");
      if (playerHealth <= 0) {
        playerHealth = 100;
        const map = MAP_DATA[selectedMap];
        playerBody.position.set(map.spawn.x, map.spawn.y, map.spawn.z);
        playerBody.velocity.set(0, 0, 0);
        playSfx("armorReboot");
        showMessage("Armor rebooted", 1200);
      }
    }

    function applyImpulseToDummy(dummy, direction, force, lift = 0, contactOffset = new THREE.Vector3(), damage = 0) {
      const dir = direction.clone().normalize();
      damageDummy(dummy, damage);
      if (dummy.isDefeated) return;
      if (dummy.isPinned) {
        dummy.body.velocity.set(0, 0, 0);
        dummy.body.angularVelocity.set(0, 0, 0);
        return;
      }
      if (dummy.noKnockback) {
        dummy.body.velocity.set(0, 0, 0);
        dummy.body.angularVelocity.set(0, 0, 0);
        return;
      }
      const knockbackMultiplier = dummy.knockbackMultiplier ?? 1;
      const clampedForce = dummy.isMinion ? 0 : Math.min(force, 18) * knockbackMultiplier * ATTACK_KNOCKBACK_SCALE;
      const clampedLift = dummy.isMinion ? 0 : Math.min(lift, 10) * knockbackMultiplier * ATTACK_LIFT_SCALE;
      const impulse = new CANNON.Vec3(dir.x * clampedForce, clampedLift, dir.z * clampedForce);
      const point = new CANNON.Vec3(
        dummy.body.position.x + contactOffset.x,
        dummy.body.position.y + contactOffset.y,
        dummy.body.position.z + contactOffset.z
      );
      dummy.body.wakeUp();
      dummy.body.velocity.x *= 0.45;
      dummy.body.velocity.y *= 0.35;
      dummy.body.velocity.z *= 0.45;
      dummy.body.applyImpulse(impulse, point);
    }

    function canUseAbility(cooldownMs) {
      const now = performance.now();
      if (now - lastAbilityTime < cooldownMs) return false;
      lastAbilityTime = now;
      return true;
    }

    function getMouseAimPoint(maxDistance = 60) {
      raycaster.setFromCamera(mouseNdc, camera);
      raycaster.far = maxDistance;
      const hit = raycaster.intersectObjects(raycastTargets, true)
        .map((item) => ({ ...item, target: resolveTarget(item.object) }))
        .find((item) => item.target && item.target !== playerGroup);
      return hit ? hit.point.clone() : raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, maxDistance * 0.72);
    }

    function webHandPosition(twoHands = false) {
      const rightPos = playerParts.rightHand.getWorldPosition(new THREE.Vector3());
      if (!twoHands) return rightPos;
      return rightPos.add(playerParts.leftHand.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    }

    function beginSpiderSwing() {
      if (selectedPower !== "webs" || isGrounded()) return false;
      const playerPos = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      const bounds = MAP_DATA[selectedMap].bounds;
      const citySwing = selectedMap === "city";
      webSwingAnchor.copy(playerPos)
        .addScaledVector(forward, (citySwing ? 13 : 8.5) + Math.min(7, new THREE.Vector3(playerBody.velocity.x, 0, playerBody.velocity.z).length() * 0.28))
        .add(new THREE.Vector3(0, citySwing ? 30 : 9.5, 0));
      webSwingAnchor.x = THREE.MathUtils.clamp(webSwingAnchor.x, bounds.minX + 0.8, bounds.maxX - 0.8);
      webSwingAnchor.z = THREE.MathUtils.clamp(webSwingAnchor.z, bounds.minZ + 0.8, bounds.maxZ - 0.8);
      webSwingAnchor.y = citySwing
        ? THREE.MathUtils.clamp(webSwingAnchor.y, 38, 58)
        : Math.min(16.3, webSwingAnchor.y);
      webSwingRopeLength = Math.max(6.2, playerPos.distanceTo(webSwingAnchor) * 0.9);
      webSwingStartedAt = performance.now();
      webSwingActive = true;
      webWallWalkActive = false;
      webPullState = null;
      webZipState = null;
      webWallLastContactAt = 0;
      playerBody.wakeUp();
      const horizontalSpeed = new THREE.Vector3(playerBody.velocity.x, 0, playerBody.velocity.z).length();
      if (horizontalSpeed < 7.5) {
        playerBody.velocity.x += forward.x * (7.5 - horizontalSpeed);
        playerBody.velocity.z += forward.z * (7.5 - horizontalSpeed);
      }
      playSfx("webSwingShoot");
      showMessage("Web line attached — release Space to launch", 900);
      return true;
    }

    function endSpiderSwing(playRelease = true) {
      if (!webSwingActive) return;
      webSwingActive = false;
      updateWebCord(new THREE.Vector3(), new THREE.Vector3(), false);
      if (playRelease) playSfx("webSwingRelease");
    }

    function spiderGroundPunch() {
      const now = performance.now();
      if (now < webPunchUntil - 120) return;
      webPunchUntil = now + 360;
      const origin = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      let targetDummy = null;
      let bestScore = Infinity;
      dynamicDummies.forEach((dummy) => {
        if (dummy.isDefeated) return;
        const offset = threeFromCannon(dummy.body.position).sub(origin);
        const distance = offset.length();
        if (distance > 3.25 || distance < 0.05) return;
        const facing = offset.clone().setY(0).normalize().dot(forward);
        if (facing < 0.2) return;
        const score = distance - facing * 0.75;
        if (score < bestScore) {
          bestScore = score;
          targetDummy = dummy;
        }
      });
      playSfx("webPunch");
      if (targetDummy) {
        const hitPoint = threeFromCannon(targetDummy.body.position).add(new THREE.Vector3(0, 0.78, 0));
        applyImpulseToDummy(targetDummy, forward, 1.8, 0.35, new THREE.Vector3(0, 0.45, 0), 23);
        spawnBurst(hitPoint, POWER_DATA.webs.color, 10, 0.32);
        spawnBeam(webHandPosition(), hitPoint, 0xffffff, 0.025, 0.16);
        showMessage("Web combo punch", 650);
      } else {
        spawnSlashArc(origin.clone().add(new THREE.Vector3(0, 0.65, 0)), forward, POWER_DATA.webs.color);
        showMessage("Web punch", 550);
      }
    }

    function ensureWebWrap(dummy) {
      if (!dummy.webWrap) dummy.webWrap = createWebWrap();
      return dummy.webWrap;
    }

    function trapDummyWithWeb(dummy, duration = 4300, announce = true) {
      if (!dummy || dummy.isDefeated) return;
      dummy.webTrappedUntil = Math.max(dummy.webTrappedUntil || 0, performance.now() + duration);
      dummy.webTrapAnchor = threeFromCannon(dummy.body.position);
      ensureWebWrap(dummy);
      dummy.body.velocity.set(0, 0, 0);
      dummy.body.angularVelocity.set(0, 0, 0);
      if (announce) {
        playSfx("webTrap");
        showMessage(`${dummy.label || "Enemy"} webbed in place`, 900);
      }
    }

    function placeFloorWeb(point) {
      const net = createWebNet(2.35);
      net.rotation.x = -Math.PI / 2;
      net.position.copy(point).add(new THREE.Vector3(0, 0.055, 0));
      scene.add(net);
      activeFloorWebs.push({ net, point: point.clone(), radius: 2.15, expiresAt: performance.now() + 15000 });
      playSfx("webFloorTrap");
      spawnRing(point.clone().add(new THREE.Vector3(0, 0.08, 0)), 0xffffff, 0.45, 2.2, 0.35);
      showMessage("Floor web armed", 850);
    }

    function shootSpiderNet() {
      if (selectedPower !== "webs") return;
      const now = performance.now();
      if (now < webTrapCooldownUntil) {
        playSfx("cooldownDeny");
        showMessage(`Web net reloading: ${((webTrapCooldownUntil - now) / 1000).toFixed(1)}s`, 650);
        return;
      }
      const hit = centerRaycast(44);
      if (!hit) {
        playSfx("cooldownDeny");
        showMessage("Aim at an enemy or the floor", 750);
        return;
      }
      const type = hit.target.userData.type;
      const dummy = type === "dummy" ? hit.target.userData.dummy : null;
      if (!dummy && type !== "floor" && type !== "obstacle" && type !== "track-mark") {
        playSfx("cooldownDeny");
        showMessage("Aim at an enemy or the floor", 750);
        return;
      }
      webTrapCooldownUntil = now + 1150;
      webShootPoseUntil = now + 560;
      const projectile = createWebNet(0.48);
      projectile.position.copy(webHandPosition());
      scene.add(projectile);
      activeWebProjectiles.push({
        net: projectile,
        start: projectile.position.clone(),
        point: hit.point.clone(),
        target: dummy,
        startedAt: now,
        duration: THREE.MathUtils.clamp(projectile.position.distanceTo(hit.point) * 22, 300, 680),
        nextTrailAt: 0
      });
      playSfx("webTrap");
      showMessage(dummy ? "Spider net fired" : "Floor web fired", 650);
    }

    function beginSpiderPullOrZip() {
      if (selectedPower !== "webs") return;
      const now = performance.now();
      if (now < webPullCooldownUntil || webSwingActive) return;
      const hit = centerRaycast(52);
      if (!hit) {
        playSfx("cooldownDeny");
        showMessage("No web target", 600);
        return;
      }
      const type = hit.target.userData.type;
      if (type === "dummy") {
        const dummy = hit.target.userData.dummy;
        if (!dummy || dummy.isDefeated) return;
        webPullCooldownUntil = now + 850;
        dummy.webTrappedUntil = 0;
        dummy.webTrapAnchor = null;
        if (dummy.webWrap) {
          disposeVisual(dummy.webWrap);
          dummy.webWrap = null;
        }
        webPullState = {
          target: dummy,
          start: threeFromCannon(dummy.body.position),
          startedAt: now,
          duration: THREE.MathUtils.clamp(threeFromCannon(dummy.body.position).distanceTo(threeFromCannon(playerBody.position)) * 34, 520, 1150)
        };
        webZipState = null;
        webShootPoseUntil = now + webPullState.duration;
        playSfx("webPull");
        showMessage("Web pull", 750);
        return;
      }
      if (type === "obstacle" || type === "movableBox" || type === "roof") {
        const normal = new THREE.Vector3(0, 1, 0);
        if (hit.face) normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
        const destination = clampPointToMap(hit.point.clone().addScaledVector(normal, 0.72));
        destination.y = Math.max(MAP_DATA[selectedMap].minY ?? 0.74, destination.y);
        const start = threeFromCannon(playerBody.position);
        webPullCooldownUntil = now + 800;
        webZipState = {
          start,
          point: hit.point.clone(),
          destination,
          startedAt: now,
          duration: THREE.MathUtils.clamp(start.distanceTo(destination) * 34, 480, 1250)
        };
        webPullState = null;
        webShootPoseUntil = now + webZipState.duration;
        playerBody.velocity.set(0, 0, 0);
        playerBody.wakeUp();
        playSfx("webZip");
        showMessage("Web zip", 700);
        return;
      }
      playSfx("cooldownDeny");
      showMessage("Aim at an enemy, wall, or object", 700);
    }

    function resetSpiderWebState(clearTraps = true) {
      endSpiderSwing(false);
      webPullState = null;
      webZipState = null;
      webWallWalkActive = false;
      webWallLastContactAt = 0;
      webWallDetachUntil = 0;
      webWallVerticalInput = 0;
      webWallHorizontalInput = 0;
      webWallMoving = false;
      webWallFacingAngle = 0;
      webLeftDownAt = 0;
      webHoldTriggered = false;
      if (webCord) webCord.group.visible = false;
      activeWebProjectiles.splice(0).forEach((projectile) => disposeVisual(projectile.net));
      dynamicDummies.forEach((dummy) => {
        if (dummy.webWrap) disposeVisual(dummy.webWrap);
        dummy.webWrap = null;
        dummy.webTrappedUntil = 0;
        dummy.webTrapAnchor = null;
      });
      if (clearTraps) activeFloorWebs.splice(0).forEach((trap) => disposeVisual(trap.net));
    }

    function updateSpiderWebs(delta) {
      const now = performance.now();
      const playerPos = threeFromCannon(playerBody.position);

      if (selectedPower === "webs" && isPointerDown && !webHoldTriggered && now - webLeftDownAt >= 240) {
        webHoldTriggered = true;
        beginSpiderPullOrZip();
      }

      if (webSwingActive && isGrounded() && now - webSwingStartedAt > 180) endSpiderSwing(false);

      if (selectedPower === "webs" && webSwingActive) {
        const fromAnchor = playerPos.clone().sub(webSwingAnchor);
        const distance = Math.max(0.001, fromAnchor.length());
        const radial = fromAnchor.multiplyScalar(1 / distance);
        const progress = THREE.MathUtils.clamp((now - webSwingStartedAt) / 1850, 0, 1);
        const forward = getCameraForward(true);
        const tangent = forward.clone().sub(radial.clone().multiplyScalar(forward.dot(radial))).normalize();
        const stretch = Math.max(0, distance - webSwingRopeLength);
        playerBody.force.x += -radial.x * stretch * playerBody.mass * 92;
        playerBody.force.y += -radial.y * stretch * playerBody.mass * 92 + playerBody.mass * (4 + progress * 18);
        playerBody.force.z += -radial.z * stretch * playerBody.mass * 92;
        playerBody.force.x += tangent.x * playerBody.mass * (9 + progress * 7);
        playerBody.force.z += tangent.z * playerBody.mass * (9 + progress * 7);
        if (distance > webSwingRopeLength * 1.035) {
          const outwardSpeed = playerBody.velocity.x * radial.x + playerBody.velocity.y * radial.y + playerBody.velocity.z * radial.z;
          if (outwardSpeed > 0) {
            playerBody.velocity.x -= radial.x * outwardSpeed * 0.82;
            playerBody.velocity.y -= radial.y * outwardSpeed * 0.82;
            playerBody.velocity.z -= radial.z * outwardSpeed * 0.82;
          }
        }
        playerBody.velocity.y = Math.min(playerBody.velocity.y, 15.5);
        updateWebCord(webHandPosition(), webSwingAnchor, true, 0.045);
      }

      if (selectedPower === "webs" && webPullState) {
        const pull = webPullState;
        if (!dynamicDummies.includes(pull.target) || pull.target.isDefeated) {
          webPullState = null;
          updateWebCord(new THREE.Vector3(), new THREE.Vector3(), false);
        } else {
          const t = THREE.MathUtils.clamp((now - pull.startedAt) / pull.duration, 0, 1);
          const eased = THREE.MathUtils.smoothstep(t, 0, 1);
          const stopPoint = playerPos.clone().addScaledVector(getCameraForward(true), 1.7);
          stopPoint.y = Math.max(MAP_DATA[selectedMap].minY ?? 0.74, playerPos.y + 0.15);
          const position = pull.start.clone().lerp(stopPoint, eased);
          position.y += Math.sin(Math.PI * t) * 0.55;
          pull.target.body.position.set(position.x, position.y, position.z);
          pull.target.body.velocity.set(0, 0, 0);
          pull.target.body.angularVelocity.set(0, 0, 0);
          updateWebCord(webHandPosition(), position.clone().add(new THREE.Vector3(0, 0.72, 0)), true, 0.12 * (1 - t));
          if (t >= 1) pull.completed = true;
        }
      }

      if (selectedPower === "webs" && webZipState) {
        const zip = webZipState;
        const t = THREE.MathUtils.clamp((now - zip.startedAt) / zip.duration, 0, 1);
        const eased = THREE.MathUtils.smoothstep(t, 0, 1);
        const position = zip.start.clone().lerp(zip.destination, eased);
        position.y += Math.sin(Math.PI * t) * Math.min(1.3, zip.start.distanceTo(zip.destination) * 0.05);
        playerBody.position.set(position.x, position.y, position.z);
        playerBody.velocity.set(0, 0, 0);
        updateWebCord(webHandPosition(), zip.point, true, 0.04);
        if (t >= 1) {
          zip.completed = true;
        }
      }

      for (let i = activeWebProjectiles.length - 1; i >= 0; i -= 1) {
        const projectile = activeWebProjectiles[i];
        if (projectile.target && (!dynamicDummies.includes(projectile.target) || projectile.target.isDefeated)) {
          disposeVisual(projectile.net);
          activeWebProjectiles.splice(i, 1);
          continue;
        }
        const destination = projectile.target
          ? threeFromCannon(projectile.target.body.position).add(new THREE.Vector3(0, 0.72, 0))
          : projectile.point;
        const t = THREE.MathUtils.clamp((now - projectile.startedAt) / projectile.duration, 0, 1);
        const eased = THREE.MathUtils.smoothstep(t, 0, 1);
        projectile.net.position.copy(projectile.start).lerp(destination, eased);
        projectile.net.quaternion.copy(camera.quaternion);
        projectile.net.scale.setScalar(0.45 + eased * 0.8);
        if (now >= projectile.nextTrailAt) {
          spawnBeam(projectile.start, projectile.net.position, 0xf8fafc, 0.012, 0.09);
          projectile.nextTrailAt = now + 70;
        }
        if (t >= 1) {
          if (projectile.target) trapDummyWithWeb(projectile.target, 4600, true);
          else placeFloorWeb(projectile.point);
          disposeVisual(projectile.net);
          activeWebProjectiles.splice(i, 1);
        }
      }

      for (let i = activeFloorWebs.length - 1; i >= 0; i -= 1) {
        const trap = activeFloorWebs[i];
        if (now >= trap.expiresAt) {
          disposeVisual(trap.net);
          activeFloorWebs.splice(i, 1);
          continue;
        }
        const pulse = 1 + Math.sin(now * 0.006 + i) * 0.025;
        trap.net.scale.setScalar(pulse);
        let caughtDummy = null;
        for (const dummy of dynamicDummies) {
          if (dummy.isDefeated || (dummy.webTrappedUntil || 0) > now) continue;
          const dummyPos = threeFromCannon(dummy.body.position);
          const flatDistance = new THREE.Vector2(dummyPos.x - trap.point.x, dummyPos.z - trap.point.z).length();
          if (flatDistance <= trap.radius && Math.abs(dummyPos.y - trap.point.y) < 2.2) {
            trapDummyWithWeb(dummy, 4300, true);
            caughtDummy = dummy;
            break;
          }
        }
        if (caughtDummy) {
          spawnBurst(trap.point.clone().add(new THREE.Vector3(0, 0.12, 0)), 0xffffff, 8, 0.3);
          disposeVisual(trap.net);
          activeFloorWebs.splice(i, 1);
        }
      }

      dynamicDummies.forEach((dummy) => {
        if ((dummy.webTrappedUntil || 0) > now && dummy.webTrapAnchor) {
          dummy.body.position.set(dummy.webTrapAnchor.x, dummy.webTrapAnchor.y, dummy.webTrapAnchor.z);
          dummy.body.velocity.set(0, 0, 0);
          dummy.body.angularVelocity.set(0, 0, 0);
          const wrap = ensureWebWrap(dummy);
          wrap.position.copy(dummy.webTrapAnchor).add(new THREE.Vector3(0, 0.08, 0));
          wrap.scale.setScalar(1 + Math.sin(now * 0.012) * 0.025);
        } else if (dummy.webWrap && (!webPullState || webPullState.target !== dummy)) {
          disposeVisual(dummy.webWrap);
          dummy.webWrap = null;
          dummy.webTrapAnchor = null;
        } else if (dummy.webWrap) {
          dummy.webWrap.position.copy(threeFromCannon(dummy.body.position)).add(new THREE.Vector3(0, 0.08, 0));
        }
      });
    }

    function refreshWebCordVisual() {
      if (!webCord) return;
      if (selectedPower !== "webs") {
        webCord.group.visible = false;
        return;
      }
      const hand = webHandPosition();
      if (webSwingActive) {
        updateWebCord(hand, webSwingAnchor, true, 0.045);
      } else if (webPullState?.target && !webPullState.target.isDefeated) {
        const targetPosition = webPullState.target.body.interpolatedPosition || webPullState.target.body.position;
        updateWebCord(hand, new THREE.Vector3(targetPosition.x, targetPosition.y + 0.72, targetPosition.z), true, 0.05);
      } else if (webZipState) {
        updateWebCord(hand, webZipState.point, true, 0.035);
      } else {
        webCord.group.visible = false;
      }
    }

    function beginMegaLeapCharge() {
      if (selectedPower !== "jump") return;
      if (!isGrounded()) {
        bouncePunch();
        return;
      }
      megaLeapCharging = true;
      megaLeapChargeStart = performance.now();
      playerBody.velocity.x *= 0.25;
      playerBody.velocity.z *= 0.25;
      playSfx("jumpCharge");
      showMessage("Charging Mega Leap");
    }

    function megaLeapReleaseAttack(origin, forward, charge) {
      let hits = 0;
      const radius = 3.1 + charge * 1.2;
      dynamicDummies.forEach((dummy) => {
        if (dummy.health <= 0 || dummy.isHeld) return;
        const dummyPos = threeFromCannon(dummy.body.position);
        const offset = dummyPos.clone().sub(origin);
        const distance = offset.length();
        if (distance > radius || distance < 0.001) return;
        const flatOffset = offset.clone().setY(0);
        if (flatOffset.lengthSq() > 0.01 && flatOffset.normalize().dot(forward) < -0.15) return;

        const attackDir = flatOffset.lengthSq() > 0.01 ? flatOffset.normalize() : forward.clone();
        const damage = dummy.isMinion ? 14 + charge * 8 : 18 + charge * 16;
        applyImpulseToDummy(dummy, attackDir, 8 + charge * 8, 5 + charge * 6, new THREE.Vector3(0, 0.55, 0), damage);
        spawnBeam(origin.clone().add(new THREE.Vector3(0, 0.5, 0)), dummyPos.clone().add(new THREE.Vector3(0, 0.75, 0)), POWER_DATA.jump.color, 0.06, 0.2);
        spawnBurst(dummyPos.clone().add(new THREE.Vector3(0, 0.78, 0)), POWER_DATA.jump.color, 10, 0.35);
        hits += 1;
      });
      if (hits) {
        spawnRing(groundEffectPoint(origin), POWER_DATA.jump.color, 0.55, radius + 1.4, 0.38);
        showMessage(`Mega Leap takeoff hit ${hits}.`);
      }
      return hits;
    }

    function releaseMegaLeap() {
      if (!megaLeapCharging) return;
      megaLeapCharging = false;
      const charge = THREE.MathUtils.clamp((performance.now() - megaLeapChargeStart) / 1150, 0.2, 1);
      const origin = threeFromCannon(playerBody.position);
      const aimPoint = getMouseAimPoint(72);
      const direction = aimPoint.sub(origin);
      const horizontal = direction.clone().setY(0);
      if (horizontal.lengthSq() < 0.01) horizontal.copy(getCameraForward(true));
      horizontal.normalize();
      const launchSpeed = 15 + charge * 27;
      const launchLift = 11.8 + charge * 12.6 + THREE.MathUtils.clamp(direction.y * 0.12, -1.2, 3.2);

      playerBody.wakeUp();
      playerBody.velocity.set(horizontal.x * launchSpeed, launchLift, horizontal.z * launchSpeed);
      megaLeapActiveUntil = performance.now() + 2200;
      lastJumpTrailPosition.copy(origin);
      spawnRing(groundEffectPoint(origin), POWER_DATA.jump.color, 0.42, 2.5 + charge * 1.9, 0.42);
      spawnBeam(origin.clone().add(new THREE.Vector3(0, 0.28, 0)), origin.clone().addScaledVector(horizontal, 4 + charge * 5).add(new THREE.Vector3(0, 1.4, 0)), POWER_DATA.jump.color, 0.065, 0.32);
      const hits = megaLeapReleaseAttack(origin, horizontal, charge);
      playSfx("megaLeap");
      if (!hits) showMessage("Mega Leap");
    }

    function bouncePunch() {
      if (selectedPower !== "jump") return;
      const now = performance.now();
      if (now - lastBouncePunchTime < 420) return;
      lastBouncePunchTime = now;
      bouncePunchUntil = now + 300;
      abilityPose = 1;

      raycaster.setFromCamera(mouseNdc, camera);
      const origin = threeFromCannon(playerBody.position);
      const aimDirection = raycaster.ray.direction.clone().normalize();
      const punchOrigin = origin.clone().add(new THREE.Vector3(0, 0.52, 0));
      let targetDummy = null;
      let targetScore = Infinity;
      dynamicDummies.forEach((dummy) => {
        if (dummy.health <= 0 || dummy.isHeld) return;
        const dummyPos = threeFromCannon(dummy.body.position).add(new THREE.Vector3(0, 0.72, 0));
        const toDummy = dummyPos.clone().sub(punchOrigin);
        const distance = toDummy.length();
        if (distance > 7.8 || distance < 0.001) return;
        const forwardDot = toDummy.clone().normalize().dot(aimDirection);
        if (forwardDot < 0.42) return;
        const lateralMiss = Math.sin(Math.acos(THREE.MathUtils.clamp(forwardDot, -1, 1))) * distance;
        if (lateralMiss > 2.35) return;
        const score = distance + lateralMiss * 1.6;
        if (score < targetScore) {
          targetScore = score;
          targetDummy = dummy;
        }
      });

      const punchEnd = targetDummy
        ? threeFromCannon(targetDummy.body.position).add(new THREE.Vector3(0, 0.72, 0))
        : punchOrigin.clone().addScaledVector(aimDirection, 5.2);
      const hand = playerParts.rightHand.getWorldPosition(new THREE.Vector3());
      spawnBeam(hand, punchEnd, POWER_DATA.jump.color, 0.055, 0.18);
      spawnBurst(punchEnd, POWER_DATA.jump.color, targetDummy ? 10 : 5, 0.3);
      playSfx("bouncePunch");

      if (targetDummy) {
        const dummy = targetDummy;
        damageDummy(dummy, dummy.isMinion ? 12 : 16);
        if (!dummy.isDefeated) {
          dummy.body.velocity.y = -3.8;
          dummy.body.angularVelocity.set(0, 0, 0);
        }
        const away = threeFromCannon(dummy.body.position).sub(origin).setY(0);
        if (away.lengthSq() > 0.01) {
          playerBody.velocity.x = -away.normalize().x * 5.5;
          playerBody.velocity.z = -away.z * 5.5;
        }
        playerBody.velocity.y = 11.4;
        showMessage("Bounce Punch");
      } else {
        playerBody.velocity.y = Math.max(playerBody.velocity.y, 5.5);
        showMessage("Bounce Punch missed");
      }
    }

    function triggerWallBounce(normal, point = null) {
      if (selectedPower !== "jump") return false;
      const now = performance.now();
      if (isGrounded() || now - lastWallBounceTime < 260) return false;
      const velocity = new THREE.Vector3(playerBody.velocity.x, 0, playerBody.velocity.z);
      if (velocity.lengthSq() < 38) return false;

      const wallNormal = normal.clone().setY(0);
      if (wallNormal.lengthSq() < 0.01) return false;
      wallNormal.normalize();
      const reflected = velocity.reflect(wallNormal).normalize();
      const speed = Math.max(17, velocity.length() * 0.92);
      playerBody.velocity.x = reflected.x * speed;
      playerBody.velocity.z = reflected.z * speed;
      playerBody.velocity.y = Math.max(playerBody.velocity.y, 10.8);
      wallBounceNormal.copy(wallNormal);
      wallBouncePoseUntil = now + 560;
      lastWallBounceTime = now;
      megaLeapActiveUntil = now + 1400;
      const impactPoint = point || threeFromCannon(playerBody.position).addScaledVector(wallNormal, -0.58);
      spawnRing(impactPoint.clone(), POWER_DATA.jump.color, 0.25, 1.75, 0.3);
      spawnBurst(impactPoint.clone(), POWER_DATA.jump.color, 10, 0.34);
      playSfx("wallBounce");
      showMessage("Wall Bounce", 650);
      return true;
    }

    function updateSuperJump(delta) {
      if (selectedPower !== "jump") return;
      const now = performance.now();
      const position = threeFromCannon(playerBody.position);
      const airborne = !isGrounded();

      if ((airborne || now < megaLeapActiveUntil) && position.distanceToSquared(lastJumpTrailPosition) > 0.45) {
        jumpTrailTimer -= delta;
        if (jumpTrailTimer <= 0) {
          spawnJumpTrail(lastJumpTrailPosition.lengthSq() > 0 ? lastJumpTrailPosition : position, position);
          lastJumpTrailPosition.copy(position);
          jumpTrailTimer = 0.055;
        }
      } else if (!airborne) {
        lastJumpTrailPosition.copy(position);
        jumpTrailTimer = 0;
      }

      const flatVelocity = new THREE.Vector3(playerBody.velocity.x, 0, playerBody.velocity.z);
      if (!airborne || flatVelocity.lengthSq() < 55 || now < wallBouncePoseUntil - 260) return;
      const rayOrigin = position.clone().add(new THREE.Vector3(0, 0.52, 0));
      const rayDirection = flatVelocity.normalize();
      raycaster.set(rayOrigin, rayDirection);
      raycaster.far = 0.95;
      const wallHit = raycaster.intersectObjects(raycastTargets, true)
        .map((item) => ({ ...item, target: resolveTarget(item.object) }))
        .find((item) => item.target && item.target.userData.type === "obstacle");
      if (!wallHit) return;

      const normal = wallHit.face
        ? wallHit.face.normal.clone().transformDirection(wallHit.object.matrixWorld).normalize()
        : rayDirection.clone().negate();
      if (Math.abs(normal.y) > 0.38) return;
      triggerWallBounce(normal, wallHit.point.clone());
    }

    function fastKickCombo() {
      if (!canUseAbility(520)) return;

      const origin = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      let targetDummy = null;
      let targetDistance = Infinity;
      dynamicDummies.forEach((dummy) => {
        const toDummy = threeFromCannon(dummy.body.position).sub(origin);
        const distance = toDummy.length();
        if (distance > 3.25 || distance < 0.001) return;
        const dir = toDummy.clone().normalize();
        if (dir.dot(forward) < 0.28) return;
        if (distance < targetDistance) {
          targetDistance = distance;
          targetDummy = dummy;
        }
      });

      if (!targetDummy) {
        showMessage("Fast Kick Combo needs a dummy close in front of you.");
        return;
      }

      kickComboUntil = performance.now() + 520;
      kickComboSide = 1;
      targetDummy.isPinned = true;
      pinnedKickDummy = targetDummy;
      targetDummy.body.velocity.set(0, 0, 0);
      targetDummy.body.angularVelocity.set(0, 0, 0);
      playSfx("speedKick");
      showMessage("Fast Kick Combo");

      [0, 115, 230, 345].forEach((delay, index) => {
        setTimeout(() => {
          if (!selectedPower || !targetDummy) return;
          const side = index % 2 === 0 ? 1 : -1;
          kickComboSide = side;
          kickComboUntil = performance.now() + 190;
          const currentOrigin = threeFromCannon(playerBody.position);
          const dummyPos = threeFromCannon(targetDummy.body.position);
          const toDummy = dummyPos.clone().sub(currentOrigin);
          if (index === 3) {
            targetDummy.isPinned = false;
            pinnedKickDummy = null;
          }
          if (toDummy.length() > 3.7) return;
          const hitDir = toDummy.setY(0).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), side * 0.08).normalize();
          const foot = (side > 0 ? playerParts.rightFoot : playerParts.leftFoot).getWorldPosition(new THREE.Vector3());
          if (index < 3) {
            damageDummy(targetDummy, 9);
            targetDummy.body.velocity.set(0, 0, 0);
            targetDummy.body.angularVelocity.set(0, 0, 0);
          } else {
            applyImpulseToDummy(targetDummy, hitDir, 16, 6, new THREE.Vector3(0, 0.48, 0), 18);
          }
          spawnBeam(foot, dummyPos.add(new THREE.Vector3(0, 0.7, 0)), POWER_DATA.speed.color, 0.045, 0.18);
          spawnBurst(threeFromCannon(targetDummy.body.position).add(new THREE.Vector3(0, 0.8, 0)), POWER_DATA.speed.color, 8, 0.32);
        }, delay);
      });
    }

    function releaseUltraPunch() {
      strengthUltraCooldownUntil = performance.now() + 3500;
      const chargeTime = Math.min(1.45, (performance.now() - strengthChargeStart) / 1000);
      const charge = THREE.MathUtils.clamp(chargeTime / 1.45, 0.18, 1);
      const origin = threeFromCannon(playerBody.position);
      const radius = 4.4 + charge * 5.4;
      let hits = 0;
      spawnRing(groundEffectPoint(origin), POWER_DATA.strength.color, 0.65, radius, 0.62);
      playSfx("strengthRelease");

      dynamicDummies.forEach((dummy) => {
        const toDummy = threeFromCannon(dummy.body.position).sub(origin);
        const distance = toDummy.length();
        if (distance > radius || distance < 0.001) return;
        const dir = toDummy.clone().normalize();
        const falloff = 1 - distance / radius;
        const force = 8 + charge * 13 + falloff * 7;
        applyImpulseToDummy(dummy, dir, force, 4 + charge * 7, new THREE.Vector3(0, 0.55, 0), 18 + charge * 34);
        spawnBurst(threeFromCannon(dummy.body.position).add(new THREE.Vector3(0, 0.5, 0)), POWER_DATA.strength.color, 10, 0.5);
        hits += 1;
      });

      chargeFill.style.width = "0%";
      showMessage(hits ? `Shockwave hit ${hits} dummy${hits === 1 ? "" : "ies"}.` : "Shockwave missed.");
    }

    function findTeleportPunchTarget(origin, forward) {
      const directHit = centerRaycast(54);
      if (directHit?.target?.userData.type === "dummy") return directHit.target.userData.dummy;

      let best = null;
      let bestScore = Infinity;
      dynamicDummies.forEach((dummy) => {
        if (dummy.health <= 0 || dummy.isHeld) return;
        const dummyPos = threeFromCannon(dummy.body.position);
        const offset = dummyPos.clone().sub(origin);
        const distance = offset.length();
        if (distance > 17 || distance < 0.01) return;
        const flat = offset.clone().setY(0);
        if (flat.lengthSq() < 0.01) return;
        const dot = flat.normalize().dot(forward);
        if (dot < 0.42) return;
        const score = distance + (1 - dot) * 8;
        if (score < bestScore) {
          best = dummy;
          bestScore = score;
        }
      });
      return best;
    }

    function teleportPunchReset() {
      if (!canUseAbility(620)) return;
      const startPos = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      const targetDummy = findTeleportPunchTarget(startPos, forward);
      if (!targetDummy) {
        showMessage("Aim near an enemy for TP Punch.");
        playSfx("cooldownDeny");
        return;
      }

      const dummyPos = threeFromCannon(targetDummy.body.position);
      const hitDirection = dummyPos.clone().sub(startPos).setY(0);
      if (hitDirection.lengthSq() < 0.01) hitDirection.copy(forward);
      hitDirection.normalize();
      const strikePos = dummyPos.clone().addScaledVector(hitDirection, -1.18);
      strikePos.y = Math.max((MAP_DATA[selectedMap].minY ?? 0.74), dummyPos.y);

      spawnRing(groundEffectPoint(startPos), POWER_DATA.teleport.color, 0.35, 1.5, 0.26);
      spawnBeam(startPos.clone().add(new THREE.Vector3(0, 0.45, 0)), dummyPos.clone().add(new THREE.Vector3(0, 0.85, 0)), POWER_DATA.teleport.color, 0.055, 0.18);
      playerBody.position.set(strikePos.x, strikePos.y, strikePos.z);
      playerBody.velocity.set(0, 0, 0);
      teleportPunchUntil = performance.now() + 360;
      abilityPose = 1;
      playSfx("teleportPunch");

      setTimeout(() => {
        if (selectedPower !== "teleport" || !gameStarted) return;
        applyImpulseToDummy(targetDummy, hitDirection, 10, 3.5, new THREE.Vector3(0, 0.55, 0), 18);
        spawnBurst(threeFromCannon(targetDummy.body.position).add(new THREE.Vector3(0, 0.82, 0)), POWER_DATA.teleport.color, 13, 0.38);
        spawnRing(groundEffectPoint(threeFromCannon(targetDummy.body.position)), POWER_DATA.teleport.color, 0.35, 1.8, 0.3);
      }, 65);

      setTimeout(() => {
        if (selectedPower !== "teleport" || !gameStarted) return;
        playerBody.position.set(startPos.x, startPos.y, startPos.z);
        playerBody.velocity.set(0, 0, 0);
        spawnRing(groundEffectPoint(startPos), POWER_DATA.teleport.color, 0.4, 1.7, 0.28);
      }, 145);

      showMessage("TP Hit-and-Reset Punch");
    }

    function teleportMove() {
      if (selectedPower !== "teleport") return;
      const now = performance.now();
      if (now < teleportMoveCooldownUntil) {
        showMessage(`Teleport cooling down: ${Math.ceil((teleportMoveCooldownUntil - now) / 1000)}s`);
        playSfx("cooldownDeny");
        return;
      }
      const hit = centerRaycast(58);
      if (!hit) {
        showMessage("No teleport surface found.");
        return;
      }

      const minTeleportY = MAP_DATA[selectedMap].minY ?? 0.74;
      playSfx("teleport");
      teleportMoveCooldownUntil = now + 1000;
      teleportMovePoseUntil = now + 360;

      if (hit.target.userData.type === "dummy") {
        const dummy = hit.target.userData.dummy;
        const startPos = threeFromCannon(playerBody.position);
        const dummyPos = threeFromCannon(dummy.body.position);
        const enemyForward = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(new THREE.Quaternion(
            dummy.body.quaternion.x,
            dummy.body.quaternion.y,
            dummy.body.quaternion.z,
            dummy.body.quaternion.w
          ))
          .setY(0);
        if (enemyForward.lengthSq() < 0.01) enemyForward.copy(dummyPos.clone().sub(startPos).setY(0));
        if (enemyForward.lengthSq() < 0.01) enemyForward.copy(getCameraForward(true));
        enemyForward.normalize();
        const behindPos = dummyPos.clone().addScaledVector(enemyForward, -1.34);
        behindPos.y = Math.max(minTeleportY, dummyPos.y);

        dummy.isPinned = true;
        dummy.body.velocity.set(0, 0, 0);
        dummy.body.angularVelocity.set(0, 0, 0);
        dummy.body.wakeUp();
        playerBody.position.set(behindPos.x, behindPos.y, behindPos.z);
        playerBody.velocity.set(0, 0, 0);
        teleportBackstabUntil = now + 520;
        teleportBackstabYaw = Math.atan2(enemyForward.x, enemyForward.z);
        abilityPose = 1;

        spawnRing(groundEffectPoint(startPos), POWER_DATA.teleport.color, 0.42, 1.7, 0.28);
        spawnRing(groundEffectPoint(behindPos), POWER_DATA.teleport.color, 0.42, 2.0, 0.32);
        spawnBeam(behindPos.clone().add(new THREE.Vector3(0, 0.72, 0)), dummyPos.clone().add(new THREE.Vector3(0, 0.82, 0)), POWER_DATA.teleport.color, 0.065, 0.26);
        playSfx("teleportBackstab");
        showMessage("Blink Backstab");

        setTimeout(() => {
          dummy.isPinned = false;
          if (selectedPower !== "teleport" || !gameStarted || dummy.isDefeated) return;
          applyImpulseToDummy(dummy, enemyForward, 14, 4.5, new THREE.Vector3(0, 0.55, 0), 24);
          spawnBurst(threeFromCannon(dummy.body.position).add(new THREE.Vector3(0, 0.82, 0)), POWER_DATA.teleport.color, 15, 0.42);
          spawnRing(groundEffectPoint(threeFromCannon(dummy.body.position)), POWER_DATA.teleport.color, 0.35, 2.15, 0.34);
        }, 360);
        return;
      }

      const worldNormal = new THREE.Vector3(0, 1, 0);
      if (hit.face) {
        worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      }
      const point = clampPointToMap(hit.point.clone().addScaledVector(worldNormal, hit.target.userData.type === "dummy" ? 1.2 : 0.72));
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.teleport.color, 0.45, 1.8, 0.32);
      playerBody.position.set(
        point.x,
        Math.max(minTeleportY, point.y),
        point.z
      );
      playerBody.velocity.set(0, 0, 0);
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.teleport.color, 0.45, 2.0, 0.36);
      showMessage("Teleported");
    }

    function beginTelekinesis() {
      const hit = centerRaycast(46);
      if (!hit || (hit.target.userData.type !== "dummy" && hit.target.userData.type !== "movableBox")) {
        showMessage("Aim the cursor at a dummy or box to lift it.");
        return;
      }

      heldObject = hit.target.userData.type === "dummy" ? hit.target.userData.dummy : hit.target.userData.box;
      telekinesisHoldDistance = THREE.MathUtils.clamp(camera.position.distanceTo(threeFromCannon(heldObject.body.position)), 2.2, 32);
      heldObject.isHeld = true;
      heldObject.body.type = CANNON.Body.DYNAMIC;
      heldObject.body.mass = heldObject.mass || dummyMass;
      heldObject.body.velocity.set(0, 0, 0);
      heldObject.body.angularVelocity.set(0, 0, 0);
      heldObject.body.collisionResponse = true;
      heldObject.body.linearDamping = Math.max(heldObject.body.linearDamping || 0, 0.62);
      heldObject.body.updateMassProperties();
      heldObject.body.wakeUp();
      spawnBeam(camera.position, threeFromCannon(heldObject.body.position), POWER_DATA.telekinesis.color, 0.045, 0.38);
      spawnRing(groundEffectPoint(threeFromCannon(heldObject.body.position)), POWER_DATA.telekinesis.color, 0.35, 1.5, 0.42);
      playSfx("telekinesisHold");
      showMessage("Telekinetic hold");
    }

    function releaseTelekinesis() {
      if (!heldObject) return;

      const forward = getCameraForward(false);
      const mass = heldObject.mass || dummyMass;
      heldObject.body.type = CANNON.Body.DYNAMIC;
      heldObject.body.mass = mass;
      heldObject.body.collisionResponse = true;
      heldObject.body.linearDamping = heldObject.isRock ? 0.18 : heldObject.health !== undefined ? 0.38 : 0.14;
      heldObject.body.updateMassProperties();
      if (heldObject.isDefeated) {
        heldObject = null;
        playSfx("telekinesisThrow");
        showMessage("Mind throw");
        return;
      }
      if (heldObject.isMinion) {
        heldObject.body.velocity.set(forward.x * 10, forward.y * 8 + 2.5, forward.z * 10);
      } else {
        if (heldObject.lastThrownBy !== undefined) heldObject.lastThrownBy = "telekinesis";
        heldObject.body.velocity.set(forward.x * 19, forward.y * 19 + 3.5, forward.z * 19);
      }
      heldObject.body.angularVelocity.set(0, 0, 0);
      heldObject.body.wakeUp();
      heldObject.body.applyImpulse(new CANNON.Vec3(forward.x * (heldObject.isMinion ? 8 : 18), forward.y * (heldObject.isMinion ? 6 : 12) + 3, forward.z * (heldObject.isMinion ? 8 : 18)), heldObject.body.position);
      heldObject.body.angularVelocity.set(0, 0, 0);
      spawnBeam(camera.position, threeFromCannon(heldObject.body.position).addScaledVector(forward, 5), POWER_DATA.telekinesis.color, 0.07, 0.26);
      spawnBurst(threeFromCannon(heldObject.body.position), POWER_DATA.telekinesis.color, 14, 0.5);
      heldObject.isHeld = false;
      heldObject = null;
      playSfx("telekinesisThrow");
      showMessage("Mind throw");
    }

    function updateHeldDummy() {
      if (!heldObject) return;
      raycaster.setFromCamera(mouseNdc, camera);
      const holdPoint = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, telekinesisHoldDistance);
      const current = threeFromCannon(heldObject.body.position);
      const toHold = holdPoint.sub(current);
      const maxSpeed = heldObject.health !== undefined ? 18 : 22;
      const desiredVelocity = toHold.multiplyScalar(8.5);
      if (desiredVelocity.length() > maxSpeed) desiredVelocity.setLength(maxSpeed);
      heldObject.body.velocity.set(desiredVelocity.x, desiredVelocity.y, desiredVelocity.z);
      heldObject.body.angularVelocity.set(0, 0, 0);
      heldObject.body.wakeUp();

      if (heldObject.health !== undefined && heldObject.lastHeldImpactAt && performance.now() - heldObject.lastHeldImpactAt < 120 && performance.now() > telekinesisSlamCooldownUntil) {
        telekinesisSlamCooldownUntil = performance.now() + 520;
        const impactSpeed = heldObject.body.velocity.length();
        const damage = heldObject.isMinion ? 10 : THREE.MathUtils.clamp(10 + impactSpeed * 0.7, 10, 24);
        damageDummy(heldObject, damage);
        spawnBurst(current.clone().add(new THREE.Vector3(0, 0.65, 0)), POWER_DATA.telekinesis.color, 10, 0.32);
        spawnRing(groundEffectPoint(current), POWER_DATA.telekinesis.color, 0.32, 1.55, 0.28);
        playSfx("telekinesisThrow");
        showMessage("Telekinetic slam", 650);
        heldObject.lastHeldImpactAt = 0;
      }
    }

    function nearestMovableBox(range = 3.3) {
      const origin = threeFromCannon(playerBody.position);
      let best = null;
      let bestDistance = Infinity;
      movableBoxes.forEach((box) => {
        if (box.isHeld) return;
        const distance = threeFromCannon(box.body.position).distanceTo(origin);
        if (distance < range && distance < bestDistance) {
          best = box;
          bestDistance = distance;
        }
      });
      return best;
    }

    function toggleStrengthBoxGrab() {
      if (selectedPower !== "strength") return;
      const forward = getCameraForward(false);
      if (strengthHeldBox) {
        const box = strengthHeldBox;
        strengthHeldBox = null;
        box.isHeld = false;
        box.lastThrownBy = "strength";
        box.body.type = CANNON.Body.DYNAMIC;
        box.body.mass = box.mass;
        box.body.collisionResponse = true;
        box.body.updateMassProperties();
        box.body.velocity.set(forward.x * 22, forward.y * 14 + 4, forward.z * 22);
        box.body.angularVelocity.set(0, 0, 0);
        box.body.wakeUp();
        box.body.applyImpulse(new CANNON.Vec3(forward.x * 20, forward.y * 10 + 2, forward.z * 20), box.body.position);
        box.body.angularVelocity.set(0, 0, 0);
        spawnBeam(camera.position, threeFromCannon(box.body.position).addScaledVector(forward, 4), POWER_DATA.strength.color, 0.08, 0.24);
        playSfx("boxThrow");
        showMessage("Box throw");
        return;
      }

      const box = nearestMovableBox();
      if (!box) {
        showMessage("Move close to a box and press E to grab it.");
        return;
      }
      strengthHeldBox = box;
      box.isHeld = true;
      box.body.type = CANNON.Body.KINEMATIC;
      box.body.mass = 0;
      box.body.collisionResponse = false;
      box.body.velocity.set(0, 0, 0);
      box.body.angularVelocity.set(0, 0, 0);
      box.body.updateMassProperties();
      box.body.wakeUp();
      playSfx("boxGrab");
      showMessage("Box grabbed");
    }

    function updateStrengthHeldBox() {
      if (!strengthHeldBox) return;
      const forward = getCameraForward(false);
      const holdPoint = threeFromCannon(playerBody.position).add(new THREE.Vector3(0, 2.2, 0)).addScaledVector(forward, 0.28);
      strengthHeldBox.body.position.set(holdPoint.x, holdPoint.y, holdPoint.z);
      strengthHeldBox.body.velocity.set(0, 0, 0);
      strengthHeldBox.body.angularVelocity.set(0, 0, 0);
    }

    function updatePinnedDummy() {
      if (!pinnedKickDummy) return;
      pinnedKickDummy.body.velocity.set(0, 0, 0);
      pinnedKickDummy.body.angularVelocity.set(0, 0, 0);
    }

    function blastDummies(radius, force) {
      const origin = threeFromCannon(playerBody.position);
      let hits = 0;
      dynamicDummies.forEach((dummy) => {
        const dummyPos = threeFromCannon(dummy.body.position);
        const offset = dummyPos.sub(origin);
        const distance = offset.length();
        if (distance > radius || distance < 0.01) return;
        const falloff = 1 - distance / radius;
        const direction = offset.normalize();
        applyImpulseToDummy(dummy, direction, 9 + falloff * 12, 5 + falloff * 8, new THREE.Vector3(0, 0.4, 0), 14 + falloff * 24);
        spawnBurst(threeFromCannon(dummy.body.position).add(new THREE.Vector3(0, 0.5, 0)), POWER_DATA.flight.color, 9, 0.48);
        hits += 1;
      });
      spawnRing(groundEffectPoint(origin), POWER_DATA.flight.color, 0.6, radius, 0.62);
      showMessage(hits ? `Dive Burst blasted ${hits} dummy${hits === 1 ? "" : "ies"}.` : "Dive Burst landed clear.");
    }

    function renderShiftLockState() {
      shiftLockReticle.hidden = !shiftLockMode;
      shiftLockReticle.style.display = shiftLockMode ? "block" : "none";
      renderer.domElement.style.cursor = shiftLockMode ? "none" : rightMouseDragging ? "grabbing" : "default";
    }

    function setShiftLock(active, announce = true) {
      shiftLockMode = Boolean(active && gameStarted);
      renderShiftLockState();
      if (shiftLockMode) {
        firstPersonMode = false;
        mouseNdc.set(0, 0);
        try {
          const lockRequest = renderer.domElement.requestPointerLock?.();
          lockRequest?.catch?.(() => {
            // Some embedded browsers deny native pointer capture; centered mouse-look remains active.
          });
        } catch (error) {
          // The centered reticle and mouse-look fallback remain active.
        }
      } else if (document.pointerLockElement === renderer.domElement && !flightMode) {
        document.exitPointerLock();
      }
      renderShiftLockState();
      if (announce) showMessage(shiftLockMode ? "Shift Lock on" : "Shift Lock off", 750);
    }

    function toggleShiftLock() {
      setShiftLock(!shiftLockMode);
    }

    function endFlightMode(messageText = "Flight Mode off") {
      flightMode = false;
      if (document.pointerLockElement === renderer.domElement && !shiftLockMode) document.exitPointerLock();
      playSfx("flightToggle");
      showMessage(messageText);
    }

    function fireFeatherVolley() {
      if (selectedPower !== "flight") return;
      if (flightMode || divePending) {
        showMessage("Land before firing cape feathers.");
        playSfx("cooldownDeny");
        return;
      }
      const now = performance.now();
      if (now < flightFeatherCooldownUntil) {
        showMessage(`Feather volley cooling down: ${Math.ceil((flightFeatherCooldownUntil - now) / 1000)}s`);
        playSfx("cooldownDeny");
        return;
      }

      flightFeatherCooldownUntil = now + 3000;
      featherPoseUntil = now + 620;
      abilityPose = 1;
      const color = POWER_DATA.flight.color;
      const capeOrigin = playerParts.cape.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.22, 0));
      raycaster.setFromCamera(mouseNdc, camera);
      const mouseAimHit = raycaster.intersectObjects(raycastTargets, true)[0];
      const mouseAimPoint = mouseAimHit
        ? mouseAimHit.point.clone()
        : raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 42);
      const baseForward = mouseAimPoint.sub(capeOrigin).normalize();
      const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      let hits = 0;
      playSfx("featherVolley");

      for (let i = 0; i < 11; i += 1) {
        const spreadX = (i - 5) * 0.035;
        const spreadY = ((i % 3) - 1) * 0.028;
        const direction = baseForward.clone()
          .add(cameraRight.clone().multiplyScalar(spreadX))
          .add(cameraUp.clone().multiplyScalar(spreadY))
          .normalize();

        raycaster.set(capeOrigin, direction);
        raycaster.far = 34;
        const hit = raycaster.intersectObjects(raycastTargets, true)
          .map((item) => ({ ...item, target: resolveTarget(item.object) }))
          .find((item) => item.target && item.target.userData.type === "dummy");
        const end = hit ? hit.point.clone() : capeOrigin.clone().addScaledVector(direction, 22 + (i % 4) * 3);
        spawnBeam(capeOrigin.clone().add(new THREE.Vector3((i - 5) * 0.025, 0, 0)), end, color, 0.018, 0.24);
        if (hit) {
          const dummy = hit.target.userData.dummy;
          damageDummy(dummy, dummy.isMinion ? 10 : 8);
          spawnBurst(end, color, 4, 0.22);
          hits += 1;
        }
      }
      showMessage(hits ? `Feather volley hit ${hits}.` : "Feather volley");
    }

    function updateMinions(delta) {
      if (!gameStarted) return;
      if (selectedMap === "minionArena" && !activeMinion) {
        minionRespawnTimer = Math.max(0, minionRespawnTimer - delta);
        if (minionRespawnTimer <= 0) spawnNextMinion();
      }
      const playerPos = threeFromCannon(playerBody.position);
      dynamicDummies.forEach((minion) => {
        if (!minion.isMinion || minion.isHeld || minion.isPinned || (minion.webTrappedUntil || 0) > performance.now() || minion.health <= 0) return;

        const minionPos = threeFromCannon(minion.body.position);
        const toPlayer = playerPos.clone().sub(minionPos);
        const flatToPlayer = toPlayer.clone().setY(0);
        const distance = flatToPlayer.length();
        minion.attackCooldown = Math.max(0, (minion.attackCooldown || 0) - delta);

        if (distance > 58 || distance < 0.001) {
          minion.body.velocity.x *= 0.96;
          minion.body.velocity.z *= 0.96;
          return;
        }

        const dir = flatToPlayer.normalize();
        const strafe = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(Math.sin(performance.now() * 0.0025 + minion.aiPhase) * 0.55);
        const chaseSpeed = distance > 8 ? 7.2 : distance > 2.4 ? 5.0 : 0.7;
        const desired = dir.clone().multiplyScalar(chaseSpeed).add(strafe);
        minion.body.wakeUp();
        minion.body.velocity.x = THREE.MathUtils.lerp(minion.body.velocity.x, desired.x, Math.min(1, delta * 4.2));
        minion.body.velocity.z = THREE.MathUtils.lerp(minion.body.velocity.z, desired.z, Math.min(1, delta * 4.2));
        if (distance > 2.4) {
          minion.body.position.x += desired.x * delta * 0.55;
          minion.body.position.z += desired.z * delta * 0.55;
        }

        const yaw = Math.atan2(flatToPlayer.x, flatToPlayer.z);
        minion.body.quaternion.setFromEuler(0, yaw, 0);

        if (distance < 2.65 && minion.attackCooldown <= 0) {
          minion.attackCooldown = 1.05;
          const blocked = selectedPower === "robot" && robotShieldMode;
          damagePlayer(10, minionPos);
          playSfx("minionStrike");
          const swingStart = minionPos.clone().add(new THREE.Vector3(0, 1.0, 0)).addScaledVector(dir, 0.45);
          const swingEnd = playerPos.clone().add(new THREE.Vector3(0, 0.78, 0));
          spawnBeam(swingStart, swingEnd, 0xef4444, 0.065, 0.14);
          spawnBurst(playerPos.clone().add(new THREE.Vector3(0, 0.55, 0)), 0xef4444, 8, 0.28);
          if (!blocked) showMessage("Minion melee hit your armor", 650);
        }
      });
    }

    function beginDiveBurst() {
      if (!flightMode || divePending || !canUseAbility(500)) return;
      divePending = true;
      flightMode = false;
      if (document.pointerLockElement === renderer.domElement && !shiftLockMode) document.exitPointerLock();
      const aimDirection = getCameraForward(false).normalize();
      const diveDirection = aimDirection.clone().add(new THREE.Vector3(0, -0.34, 0)).normalize();
      playerBody.velocity.set(diveDirection.x * 64, diveDirection.y * 28, diveDirection.z * 64);
      spawnBeam(threeFromCannon(playerBody.position), threeFromCannon(playerBody.position).addScaledVector(diveDirection, 6), POWER_DATA.flight.color, 0.1, 0.5);
      playSfx("dive");
      showMessage("Angled Dive Burst");
    }

    function toggleFlight() {
      if (selectedPower !== "flight") return;
      if (divePending) return;
      flightMode = !flightMode;
      if (flightMode) {
        firstPersonMode = false;
        playerBody.velocity.y = Math.max(4.8, playerBody.velocity.y);
        renderer.domElement.requestPointerLock?.();
        playSfx("flightToggle");
        showMessage("Flight dive stance");
      } else {
        endFlightMode("Flight Mode off");
      }
    }

    function fireRobotShot() {
      if (!canUseAbility(robotShieldMode ? 290 : 210)) return;

      const color = POWER_DATA.robot.color;
      const muzzle = playerParts.rightHand.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.06, -0.08));
      const forward = getCameraForward(false);
      const hit = centerRaycast(72);
      const end = hit ? hit.point.clone() : camera.position.clone().addScaledVector(forward, 54);

      spawnBeam(muzzle, end, color, robotShieldMode ? 0.08 : 0.06, 0.22);
      spawnBurst(end.clone(), color, hit ? 8 : 4, 0.34);
      playSfx("robotShot");

      if (!hit) {
        showMessage("Energy Shot");
        return;
      }

      const type = hit.target.userData.type;
      if (type === "dummy") {
        const dummy = hit.target.userData.dummy;
        const direction = end.clone().sub(muzzle).setY(0).normalize();
        applyImpulseToDummy(dummy, direction, robotShieldMode ? 5.5 : 7.5, robotShieldMode ? 1.2 : 2.2, new THREE.Vector3(0, 0.45, 0), robotShieldMode ? 10 : 16);
        showMessage(robotShieldMode ? "Shielded Beam" : "Energy Shot");
      } else if (type === "movableBox") {
        const box = hit.target.userData.box;
        const direction = end.clone().sub(muzzle).normalize();
        box.body.wakeUp();
        box.body.velocity.x += direction.x * 4.5;
        box.body.velocity.y += Math.max(0.5, direction.y * 2);
        box.body.velocity.z += direction.z * 4.5;
        box.body.angularVelocity.set(0, 0, 0);
        showMessage("Utility Push");
      } else {
        showMessage("Energy Shot");
      }
    }

    function toggleRobotShield() {
      if (selectedPower !== "robot") return;
      const now = performance.now();
      if (!robotShieldMode && now < robotShieldCooldownUntil) {
        const seconds = Math.ceil((robotShieldCooldownUntil - now) / 1000);
        showMessage(`Defense Shield cooling down: ${seconds}s`);
        playSfx("cooldownDeny");
        return;
      }
      robotShieldMode = !robotShieldMode;
      if (robotShieldMode) robotShieldEndsAt = now + 5000;
      else robotShieldCooldownUntil = now + 5000;
      playSfx("robotShield");
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.robot.color, 0.45, robotShieldMode ? 2.2 : 1.3, 0.36);
      showMessage(robotShieldMode ? "Defense Shield on: 5s" : "Defense Shield cooling down");
    }

    function updateRobotShield() {
      if (selectedPower !== "robot") return;
      if (robotShieldMode && performance.now() >= robotShieldEndsAt) {
        robotShieldMode = false;
        robotShieldCooldownUntil = performance.now() + 5000;
        playSfx("robotShieldDown");
        spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.robot.color, 0.35, 1.5, 0.3);
        showMessage("Defense Shield expired. Cooling down.", 1100);
      }
    }

    function hotbarItemForSlot(index) {
      if (selectedPower === "speed" && index === 0 && speedPearlCount > 0) {
        return { id: "teleportPearl", name: "Teleportation Pearl", icon: "⬆", quantity: speedPearlCount };
      }
      if (selectedPower === "strength" && index === 0) {
        return { id: "strongSword", name: "Strong Sword", icon: "✊", quantity: "" };
      }
      return null;
    }

    function equippedHotbarItem() {
      return selectedHotbarIndex === null ? null : hotbarItemForSlot(selectedHotbarIndex);
    }

    function renderHotbar() {
      if (!hotbar) return;
      hotbar.innerHTML = "";
      for (let i = 0; i < 9; i += 1) {
        const item = hotbarItemForSlot(i);
        const slot = document.createElement("div");
        slot.className = `hotbarSlot${selectedHotbarIndex === i ? " selected" : ""}`;
        slot.innerHTML = `
          <span class="slotKey">${i + 1}</span>
          <span class="slotIcon">${item ? item.icon : ""}</span>
          <span class="slotQty">${item ? item.quantity : ""}</span>
        `;
        slot.title = item ? item.name : "Empty slot";
        hotbar.appendChild(slot);
      }
    }

    function selectHotbarSlot(index) {
      if (!gameStarted) return;
      const item = hotbarItemForSlot(index);
      if (!item) {
        selectedHotbarIndex = null;
        renderHotbar();
        showMessage("Empty slot", 650);
        return;
      }
      selectedHotbarIndex = selectedHotbarIndex === index ? null : index;
      renderHotbar();
      showMessage(selectedHotbarIndex === null ? "Hands free" : `${item.name} equipped`, 850);
    }

    function removeTeleportPearl(mesh, body) {
      const syncIndex = syncPairs.findIndex((pair) => pair.mesh === mesh);
      if (syncIndex >= 0) syncPairs.splice(syncIndex, 1);
      scene.remove(mesh);
      world.removeBody(body);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    function teleportToPearlLanding(position) {
      const target = clampPointToMap(position.clone());
      const minY = MAP_DATA[selectedMap].minY ?? 0.74;
      playerBody.position.set(target.x, Math.max(minY, target.y + 0.78), target.z);
      playerBody.velocity.set(0, 0, 0);
      spawnRing(groundEffectPoint(target), POWER_DATA.speed.color, 0.42, 2.25, 0.34);
      spawnBurst(target.clone().add(new THREE.Vector3(0, 0.55, 0)), 0xff4fb8, 16, 0.44);
      playSfx("pearlTeleport");
      showMessage("Teleportation Pearl");
    }

    function throwTeleportPearl() {
      if (selectedPower !== "speed") return false;
      if (speedPearlCount <= 0) {
        selectedHotbarIndex = null;
        renderHotbar();
        showMessage("No Teleportation Pearls left.", 900);
        playSfx("cooldownDeny");
        return true;
      }

      speedPearlCount -= 1;
      pearlThrowPoseUntil = performance.now() + 420;
      abilityPose = 1;
      renderHotbar();

      raycaster.setFromCamera(mouseNdc, camera);
      const direction = raycaster.ray.direction.clone().normalize();
      const start = playerParts.rightHand.getWorldPosition(new THREE.Vector3())
        .addScaledVector(direction, 0.35)
        .add(new THREE.Vector3(0, 0.08, 0));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 14),
        new THREE.MeshStandardMaterial({ color: 0xff4fb8, roughness: 0.28, metalness: 0.04, emissive: 0x7c1d5a, emissiveIntensity: 0.24 })
      );
      addPearlArrow(mesh);
      mesh.position.copy(start);
      mesh.castShadow = true;
      scene.add(mesh);

      const body = new CANNON.Body({
        mass: 0.55,
        material: dummyMaterial,
        linearDamping: 0.02,
        angularDamping: 0.12
      });
      body.addShape(new CANNON.Sphere(0.18));
      body.position.set(start.x, start.y, start.z);
      body.velocity.set(direction.x * 25, direction.y * 25 + 5.2, direction.z * 25);
      body.angularVelocity.set(5, 9, 3);
      body.userData = { type: "teleportPearl" };
      world.addBody(body);
      syncPairs.push({ mesh, body });

      const armedAt = performance.now() + 120;
      let landed = false;
      body.addEventListener("collide", (event) => {
        if (landed || performance.now() < armedAt || event.body === playerBody) return;
        landed = true;
        const landing = threeFromCannon(body.position);
        teleportToPearlLanding(landing);
        setTimeout(() => removeTeleportPearl(mesh, body), 0);
      });

      setTimeout(() => {
        if (landed) return;
        landed = true;
        const landing = threeFromCannon(body.position);
        teleportToPearlLanding(landing);
        removeTeleportPearl(mesh, body);
      }, 4200);

      playSfx("pearlThrow");
      showMessage(`Teleportation Pearl thrown (${speedPearlCount} left)`, 900);
      if (speedPearlCount <= 0) selectedHotbarIndex = null;
      renderHotbar();
      return true;
    }

    function slashStrongSword() {
      if (selectedPower !== "strength") return false;
      const now = performance.now();
      if (now < strongSwordCooldownUntil) {
        const remaining = Math.ceil((strongSwordCooldownUntil - now) / 1000);
        playSfx("cooldownDeny");
        showMessage(`Strong Sword cooldown: ${remaining}s`, 850);
        return true;
      }
      strongSwordCooldownUntil = now + 15000;
      strongSwordSlashUntil = now + 560;
      abilityPose = 1;
      playSfx("strongSwordSlash");

      const origin = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
      let hits = 0;
      dynamicDummies.forEach((dummy) => {
        if (dummy.health <= 0 || dummy.isHeld) return;
        const dummyPos = threeFromCannon(dummy.body.position);
        const offset = dummyPos.clone().sub(origin);
        const distance = offset.length();
        if (distance > 4.35 || distance < 0.01 || Math.abs(offset.y) > 2.25) return;
        const flat = offset.clone().setY(0);
        if (flat.lengthSq() < 0.01) return;
        const flatDir = flat.clone().normalize();
        const frontDot = flatDir.dot(forward);
        const sideDot = flatDir.dot(right);
        if (frontDot < -0.04 || Math.abs(sideDot) > 0.92) return;
        const arcSweetSpot = frontDot > 0.16 || Math.abs(sideDot) > 0.28;
        if (!arcSweetSpot) return;
        const dir = flatDir;
        applyImpulseToDummy(dummy, dir, 4.8, 1.8, new THREE.Vector3(0, 0.55, 0), dummy.isMinion ? 12 : 26);
        spawnBurst(dummyPos.clone().add(new THREE.Vector3(0, 0.76, 0)), POWER_DATA.strength.color, 13, 0.38);
        hits += 1;
      });

      const hand = playerParts.rightHand.getWorldPosition(new THREE.Vector3());
      spawnSlashArc(hand.clone().add(new THREE.Vector3(0, 0.18, 0)), forward, POWER_DATA.strength.color);
      if (hits) playSfx("strongSwordHit");
      showMessage(hits ? `Strong Sword hit ${hits}.` : "Strong Sword slash", 750);
      return true;
    }

    function useEquippedItem() {
      const item = equippedHotbarItem();
      if (!item) return false;
      if (item.id === "teleportPearl") return throwTeleportPearl();
      if (item.id === "strongSword") return slashStrongSword();
      return false;
    }

    function onAbilityDown() {
      if (!gameStarted || isPointerDown) return;
      isPointerDown = true;
      abilityPose = 1;

      if (useEquippedItem()) {
        isPointerDown = false;
        return;
      }

      if (selectedPower === "speed") fastKickCombo();
      if (selectedPower === "strength") {
        if (performance.now() < strengthUltraCooldownUntil) {
          const remaining = ((strengthUltraCooldownUntil - performance.now()) / 1000).toFixed(1);
          playSfx("cooldownDeny");
          showMessage(`Ultra Smash cooldown: ${remaining}s`, 750);
          isPointerDown = false;
          return;
        }
        strengthChargeStart = performance.now();
        playSfx("strengthCharge");
        showMessage("Charging Ultra Punch", 900);
      }
      if (selectedPower === "teleport") teleportPunchReset();
      if (selectedPower === "telekinesis") beginTelekinesis();
      if (selectedPower === "flight") {
        if (flightMode) beginDiveBurst();
        else fireFeatherVolley();
      }
      if (selectedPower === "robot") fireRobotShot();
      if (selectedPower === "jump") beginMegaLeapCharge();
      if (selectedPower === "webs") {
        webLeftDownAt = performance.now();
        webHoldTriggered = false;
      }
    }

    function onAbilityUp() {
      if (!gameStarted) return;
      abilityPose = 1;
      if (selectedPower === "strength" && isPointerDown) releaseUltraPunch();
      if (selectedPower === "telekinesis") releaseTelekinesis();
      if (selectedPower === "jump") releaseMegaLeap();
      if (selectedPower === "webs") {
        if (!webHoldTriggered) {
          spiderGroundPunch();
        } else {
          if (webZipState) {
            const carry = webZipState.destination.clone().sub(webZipState.start).setY(0);
            if (carry.lengthSq() > 0.01) carry.normalize();
            playerBody.velocity.set(carry.x * 3.5, 2.5, carry.z * 3.5);
          }
          webPullState = null;
          webZipState = null;
          if (webCord) webCord.group.visible = false;
        }
        webLeftDownAt = 0;
        webHoldTriggered = false;
      }
      isPointerDown = false;
    }

    function updatePlayerControl(delta) {
      if (!selectedPower) return;

      const data = POWER_DATA[selectedPower];
      const forward = getCameraForward(true);
      const right = getCameraRight();
      const move = new THREE.Vector3();
      const flightLocked = selectedPower === "flight" && flightMode;
      if (!flightLocked) {
        if (keys.has("KeyW") || keys.has("ArrowUp")) move.add(forward);
        if (keys.has("KeyS") || keys.has("ArrowDown")) move.sub(forward);
        if (keys.has("KeyD") || keys.has("ArrowRight")) move.add(right);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) move.sub(right);
      }
      const robotForwardThrusting = isRobotForwardThrusting();
      const robotUpThrusting = isRobotUpThrusting();
      const webWallWalking = updateSpiderWallWalk(delta, data.speed);
      const webTraversal = selectedPower === "webs" && (webSwingActive || webZipState || webWallWalking);
      const webTraversalAnimating = selectedPower === "webs" && (webSwingActive || webZipState || (webWallWalking && webWallMoving));
      moveIntensity = THREE.MathUtils.lerp(moveIntensity, move.lengthSq() > 0.001 || robotForwardThrusting || robotUpThrusting || flightLocked || webTraversalAnimating ? 1 : 0, Math.min(1, delta * 12));
      if (move.lengthSq() > 0.001) {
        move.normalize();
        playerBody.wakeUp();
      }

      const sprinting = isSpeedSprinting() && move.lengthSq() > 0.001;
      const robotDashDirection = move.lengthSq() > 0.001 ? move : forward;
      const jumpLeaping = selectedPower === "jump" && performance.now() < megaLeapActiveUntil && !isGrounded();
      let speed = sprinting ? data.speed * 2.85 : (flightLocked ? data.speed * 2.45 : data.speed);
      if (selectedPower === "robot" && robotForwardThrusting) speed = data.speed * (robotShieldMode ? 1.65 : 2.55);
      else if (selectedPower === "robot" && robotShieldMode) speed *= 0.72;
      if (selectedPower === "strength" && strengthHeldBox?.isRock) speed *= 0.46;
      const horizontalMove = selectedPower === "robot" && robotForwardThrusting ? robotDashDirection : move;
      if (webWallWalking) {
        // Wall-walk velocity and gravity cancellation are handled by updateSpiderWallWalk.
      } else if (megaLeapCharging) {
        playerBody.wakeUp();
        playerBody.velocity.x *= 0.15;
        playerBody.velocity.z *= 0.15;
      } else if (divePending) {
        playerBody.wakeUp();
        playerBody.velocity.x *= 0.995;
        playerBody.velocity.z *= 0.995;
      } else if (flightLocked) {
        const flyDirection = getCameraForward(false).normalize();
        playerBody.force.y += -world.gravity.y * playerBody.mass;
        playerBody.velocity.x = flyDirection.x * speed;
        playerBody.velocity.y = flyDirection.y * speed + 1.6;
        playerBody.velocity.z = flyDirection.z * speed;
      } else if (jumpLeaping) {
        if (horizontalMove.lengthSq() > 0.001) {
          playerBody.velocity.x = THREE.MathUtils.lerp(playerBody.velocity.x, horizontalMove.x * speed, Math.min(1, delta * 1.6));
          playerBody.velocity.z = THREE.MathUtils.lerp(playerBody.velocity.z, horizontalMove.z * speed, Math.min(1, delta * 1.6));
        }
      } else if (webTraversal) {
        if (webSwingActive && horizontalMove.lengthSq() > 0.001) {
          playerBody.force.x += horizontalMove.x * playerBody.mass * 4.5;
          playerBody.force.z += horizontalMove.z * playerBody.mass * 4.5;
        }
      } else {
        playerBody.velocity.x = horizontalMove.x * speed;
        playerBody.velocity.z = horizontalMove.z * speed;
      }

      if (selectedPower === "robot" && (robotForwardThrusting || robotUpThrusting)) {
        playerBody.wakeUp();
        robotThrusterTimer -= delta;
        const now = performance.now();
        if (now - lastRobotThrusterSfx > 260) {
          playSfx("robotThruster");
          lastRobotThrusterSfx = now;
        }
        if (robotThrusterTimer <= 0) {
          spawnFootThrusters(robotForwardThrusting, robotUpThrusting);
          robotThrusterTimer = 0.055;
        }
      } else {
        robotThrusterTimer = 0;
      }

      if (sprinting) {
        const now = performance.now();
        if (now - lastSprintSfx > 360) {
          playSfx("speedSprint");
          lastSprintSfx = now;
        }
        sprintTrailTimer -= delta;
        const current = threeFromCannon(playerBody.position);
        if (sprintTrailTimer <= 0 && current.distanceToSquared(lastSprintTrailPosition) > 0.8) {
          spawnElectricTrail(lastSprintTrailPosition.lengthSq() > 0 ? lastSprintTrailPosition : current.clone().addScaledVector(move, -0.9), current);
          lastSprintTrailPosition.copy(current);
          sprintTrailTimer = 0.045;
        }
      } else {
        lastSprintTrailPosition.set(playerBody.position.x, playerBody.position.y, playerBody.position.z);
        sprintTrailTimer = 0;
      }

      if (selectedPower === "robot" && robotUpThrusting) {
        playerBody.force.y += -world.gravity.y * playerBody.mass * 0.92;
        const liftCap = robotShieldMode ? 8.4 : 11.4;
        playerBody.velocity.y = THREE.MathUtils.clamp(playerBody.velocity.y + delta * 32, 2.4, liftCap);
      } else if (keys.has("Space") && isGrounded() && !divePending) {
        playerBody.wakeUp();
        playerBody.velocity.y = selectedPower === "jump" ? (data.jumpVelocity || 14.4) : 9.8;
        if (selectedPower === "jump") {
          megaLeapActiveUntil = performance.now() + 900;
          playSfx("megaLeap");
        }
      }

      if (divePending && playerBody.position.y <= 0.76) {
        divePending = false;
        playerBody.position.y = 0.76;
        playerBody.velocity.y = 5;
        blastDummies(8.2, 58);
        playSfx("diveImpact");
      }
    }

    function updateCamera() {
      const renderPosition = playerBody.interpolatedPosition || playerBody.position;
      const playerPos = new THREE.Vector3(renderPosition.x, renderPosition.y + 0.78, renderPosition.z);
      if (firstPersonMode) {
        const lookDirection = new THREE.Vector3(
          -Math.sin(cameraYaw) * Math.cos(cameraPitch),
          -Math.sin(cameraPitch),
          -Math.cos(cameraYaw) * Math.cos(cameraPitch)
        ).normalize();
        camera.position.set(renderPosition.x, renderPosition.y + 1.18, renderPosition.z);
        camera.lookAt(camera.position.clone().add(lookDirection));
        playerGroup.visible = false;
        return;
      }

      playerGroup.visible = true;
      const flightDistance = selectedPower === "flight" && flightMode ? Math.max(cameraDistance, 8.8) : cameraDistance;
      const horizontal = Math.cos(cameraPitch) * flightDistance;
      const offset = new THREE.Vector3(
        Math.sin(cameraYaw) * horizontal,
        Math.sin(cameraPitch) * flightDistance + 2.2,
        Math.cos(cameraYaw) * horizontal
      );
      camera.position.copy(playerPos).add(offset);
      camera.lookAt(playerPos.x, playerPos.y + 0.75, playerPos.z);

      const face = getCameraForward(true);
      playerGroup.rotation.y = Math.atan2(face.x, face.z);
    }

    function animatePlayer(delta) {
      if (!selectedPower) return;

      const sprinting = isSpeedSprinting() && moveIntensity > 0.1;
      const flightLocked = selectedPower === "flight" && flightMode;
      const robotForwardThrusting = isRobotForwardThrusting();
      const robotUpThrusting = isRobotUpThrusting();
      const sprintAnimBoost = sprinting ? 3.2 : 1;
      const animationMoveIntensity = webWallWalkActive && !webWallMoving ? 0 : moveIntensity;
      walkTime += delta * (5 + POWER_DATA[selectedPower].speed * 0.34) * Math.max(animationMoveIntensity, 0.08) * sprintAnimBoost;
      abilityPose = Math.max(0, abilityPose - delta * 4.2);
      const strideAmount = animationMoveIntensity * (sprinting ? 1.65 : 1);
      const stride = Math.sin(walkTime) * strideAmount;
      const counterStride = Math.sin(walkTime + Math.PI) * strideAmount;
      const bob = Math.abs(Math.sin(walkTime)) * (sprinting ? 0.08 : 0.045) * animationMoveIntensity;
      const color = POWER_DATA[selectedPower].color;
      const targetGroupPitch = 0;
      if (!webWallWalkActive) {
        playerGroup.rotation.x = THREE.MathUtils.lerp(playerGroup.rotation.x, targetGroupPitch, Math.min(1, delta * 10));
        playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0, Math.min(1, delta * 10));
      }

      playerMaterialMain.color.setHex(selectedPower === "webs" ? 0xdc2626 : color);
      playerParts.leftArmMesh.material.color.setHex(selectedPower === "webs" ? 0xffffff : color);
      playerParts.rightArmMesh.material.color.setHex(selectedPower === "webs" ? 0xffffff : color);
      playerParts.head.material.color.setHex(selectedPower === "robot" ? 0x1f2937 : 0xf8fafc);
      playerParts.leftHand.material.color.setHex(selectedPower === "robot" ? 0x334155 : 0xf8fafc);
      playerParts.rightHand.material.color.setHex(selectedPower === "robot" ? 0x334155 : 0xf8fafc);
      playerParts.leftFoot.material.color.setHex(selectedPower === "jump" ? 0x38bdf8 : selectedPower === "speed" ? 0xffea00 : 0x111827);
      playerParts.rightFoot.material.color.setHex(selectedPower === "jump" ? 0x38bdf8 : selectedPower === "speed" ? 0xffea00 : 0x111827);
      playerParts.robotArmorGroup.visible = selectedPower === "robot";
      playerParts.leftBlaster.visible = selectedPower === "robot";
      playerParts.rightBlaster.visible = selectedPower === "robot";
      playerParts.robotShield.visible = selectedPower === "robot" && robotShieldMode;
      playerParts.aura.material.color.setHex(color);
      playerParts.aura.material.opacity = flightLocked ? 0.58 : robotShieldMode ? 0.55 : 0.22 + moveIntensity * 0.18 + abilityPose * 0.22;
      playerParts.aura.scale.setScalar(flightLocked ? 1.28 + Math.sin(walkTime * 1.7) * 0.06 : robotShieldMode ? 1.28 + Math.sin(walkTime * 2) * 0.05 : 1 + moveIntensity * 0.18);
      playerParts.aura.rotation.z += delta * (flightLocked ? 3.5 : 1.25);
      playerParts.robotShield.scale.setScalar(1 + Math.sin(walkTime * 2.4) * 0.035);
      playerParts.robotShield.material.opacity = robotShieldMode ? 0.18 + Math.sin(walkTime * 3) * 0.04 : 0;

      playerParts.torso.rotation.y = THREE.MathUtils.lerp(playerParts.torso.rotation.y, 0, Math.min(1, delta * 8));
      playerParts.torso.position.y = 0.92 + bob;
      playerParts.chest.position.y = 1.08 + bob;
      playerParts.head.position.y = 1.58 + bob;
      playerParts.torso.position.z = 0;
      playerParts.chest.position.z = 0;
      playerParts.head.position.z = 0;
      playerParts.leftArm.position.set(-0.47, 1.23, 0);
      playerParts.rightArm.position.set(0.47, 1.23, 0);
      playerParts.leftHand.position.set(0, -0.68, -0.01);
      playerParts.rightHand.position.set(0, -0.68, -0.01);
      playerParts.leftHand.rotation.set(0, 0, 0);
      playerParts.rightHand.rotation.set(0, 0, 0);
      playerParts.leftArm.rotation.set(stride * 0.82 - abilityPose * 0.35, 0, -0.18);
      playerParts.rightArm.rotation.set(counterStride * 0.82 - abilityPose * 0.9, 0, 0.18);
      playerParts.leftLeg.position.set(-0.2, 0.55, 0);
      playerParts.rightLeg.position.set(0.2, 0.55, 0);
      playerParts.leftLeg.rotation.set(counterStride * 0.7, 0, 0.04);
      playerParts.rightLeg.rotation.set(stride * 0.7, 0, -0.04);
      playerParts.leftLeg.scale.setScalar(1);
      playerParts.rightLeg.scale.setScalar(1);
      playerParts.leftFoot.scale.setScalar(1);
      playerParts.rightFoot.scale.setScalar(1);
      playerParts.leftFoot.position.set(0, -0.74, -0.06);
      playerParts.rightFoot.position.set(0, -0.74, -0.06);
      playerParts.leftFoot.rotation.set(0, 0, 0);
      playerParts.rightFoot.rotation.set(0, 0, 0);

      if (sprinting) {
        playerParts.leftArm.rotation.set(stride * 1.05 - 0.28, 0, -0.28);
        playerParts.rightArm.rotation.set(counterStride * 1.05 - 0.28, 0, 0.28);
        playerParts.leftLeg.rotation.set(counterStride * 1.05, 0, 0.08);
        playerParts.rightLeg.rotation.set(stride * 1.05, 0, -0.08);
        playerParts.torso.rotation.x = -0.18;
        playerParts.aura.scale.setScalar(1.34 + Math.sin(walkTime * 1.8) * 0.08);
        playerParts.aura.material.opacity = 0.64;
      } else {
        playerParts.torso.rotation.x = THREE.MathUtils.lerp(playerParts.torso.rotation.x, 0, Math.min(1, delta * 8));
      }

      const pearlEquipped = selectedPower === "speed" && selectedHotbarIndex === 0 && speedPearlCount > 0;
      const pearlThrowing = selectedPower === "speed" && performance.now() < pearlThrowPoseUntil;
      playerParts.heldPearl.visible = pearlEquipped || pearlThrowing;
      if (pearlEquipped && !pearlThrowing) {
        playerParts.rightArm.rotation.set(-0.62, 0.18, 0.38);
        playerParts.leftArm.rotation.set(stride * 0.6 - 0.18, 0, -0.24);
      }
      if (pearlThrowing) {
        const t = 1 - THREE.MathUtils.clamp((pearlThrowPoseUntil - performance.now()) / 420, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.torso.rotation.x = -0.14 * snap;
        playerParts.rightArm.rotation.set(-1.75 * snap - 0.18, 0.25, 0.55);
        playerParts.leftArm.rotation.set(-0.52, -0.08, -0.34);
        playerParts.aura.material.opacity = 0.7;
        playerParts.aura.scale.setScalar(1.38 + snap * 0.28);
      }

      const swordEquipped = selectedPower === "strength" && selectedHotbarIndex === 0;
      const swordSlashing = selectedPower === "strength" && performance.now() < strongSwordSlashUntil;
      playerParts.strongSword.visible = swordEquipped || swordSlashing;
      if (swordEquipped && !swordSlashing) {
        playerParts.strongSword.position.set(0.02, -0.02, 0.12);
        playerParts.strongSword.rotation.set(0.38, 0.02, 0.03);
        playerParts.rightArm.rotation.set(-0.18, 0.16, 0.42);
        playerParts.leftArm.rotation.set(stride * 0.45 - 0.16, 0, -0.24);
      }
      if (swordSlashing) {
        const t = 1 - THREE.MathUtils.clamp((strongSwordSlashUntil - performance.now()) / 560, 0, 1);
        const snap = Math.sin(t * Math.PI);
        const windup = THREE.MathUtils.clamp(t / 0.28, 0, 1);
        const swing = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((t - 0.18) / 0.72, 0, 1), 0, 1);
        playerParts.strongSword.position.set(0.02, -0.02, 0.12);
        playerParts.strongSword.rotation.set(0.38 - 0.18 * windup + 0.36 * swing, 0.08 - 0.18 * swing, -0.18 + 0.74 * windup - 1.18 * swing);
        playerParts.torso.rotation.y = -0.24 + swing * 0.48;
        playerParts.torso.rotation.x = -0.06 * snap;
        playerParts.rightArm.rotation.set(-1.08 + swing * 1.28, 0.2 - swing * 0.34, 0.92 - swing * 1.58);
        playerParts.leftArm.rotation.set(-0.55, -0.08, -0.42);
        playerParts.aura.material.opacity = 0.62 + snap * 0.16;
        playerParts.aura.scale.setScalar(1.2 + snap * 0.42);
      }

      if (selectedPower === "jump" && isGrounded() && moveIntensity > 0.08 && !megaLeapCharging) {
        const bigStep = Math.sin(walkTime * 0.72);
        const stepPlant = Math.abs(bigStep);
        const bounce = Math.pow(stepPlant, 1.15) * 0.18 * moveIntensity;
        playerParts.torso.position.y = 0.92 + bounce;
        playerParts.chest.position.y = 1.08 + bounce;
        playerParts.head.position.y = 1.58 + bounce;
        playerParts.leftArm.position.y = 1.23 + bounce;
        playerParts.rightArm.position.y = 1.23 + bounce;
        playerParts.leftArm.rotation.set(-0.2 + bigStep * 1.05, 0, -0.34);
        playerParts.rightArm.rotation.set(-0.2 - bigStep * 1.05, 0, 0.34);
        playerParts.leftLeg.position.set(-0.235, 0.55 + bounce, 0);
        playerParts.rightLeg.position.set(0.235, 0.55 + bounce, 0);
        playerParts.leftLeg.rotation.set(-1.18 * bigStep, 0, 0.22);
        playerParts.rightLeg.rotation.set(1.18 * bigStep, 0, -0.22);
        playerParts.leftFoot.scale.set(1.08, 1, 1.14);
        playerParts.rightFoot.scale.set(1.08, 1, 1.14);
        playerParts.aura.material.opacity = 0.32 + moveIntensity * 0.24;
        playerParts.aura.scale.setScalar(1.08 + bounce);
      }

      if (!isGrounded() && !flightLocked && !divePending && !webWallWalkActive) {
        playerParts.leftArm.rotation.set(-2.35, -0.12, -0.38);
        playerParts.rightArm.rotation.set(-2.35, 0.12, 0.38);
        playerParts.leftLeg.rotation.set(0.72, 0, 0.18);
        playerParts.rightLeg.rotation.set(0.72, 0, -0.18);
        playerParts.torso.rotation.x = THREE.MathUtils.lerp(playerParts.torso.rotation.x, -0.08, Math.min(1, delta * 8));
      }

      if (selectedPower === "jump" && megaLeapCharging) {
        const charge = THREE.MathUtils.clamp((performance.now() - megaLeapChargeStart) / 1150, 0, 1);
        const tremble = Math.sin(performance.now() * 0.045) * 0.025 * charge;
        playerParts.torso.position.y = 0.78 - charge * 0.12;
        playerParts.chest.position.y = 0.96 - charge * 0.08;
        playerParts.head.position.y = 1.44 - charge * 0.05;
        playerParts.torso.rotation.x = 0.22 + charge * 0.18;
        playerParts.leftArm.rotation.set(-0.72 - charge * 0.32, -0.08, -0.45);
        playerParts.rightArm.rotation.set(-0.72 - charge * 0.32, 0.08, 0.45);
        playerParts.leftLeg.position.set(-0.2, 0.48, tremble);
        playerParts.rightLeg.position.set(0.2, 0.48, -tremble);
        playerParts.leftLeg.rotation.set(1.05 + charge * 0.8, 0, 0.1);
        playerParts.rightLeg.rotation.set(1.05 + charge * 0.8, 0, -0.1);
        playerParts.leftLeg.scale.set(0.86, 1 - charge * 0.32, 0.86);
        playerParts.rightLeg.scale.set(0.86, 1 - charge * 0.32, 0.86);
        playerParts.aura.material.opacity = 0.4 + charge * 0.36;
        playerParts.aura.scale.setScalar(1.18 + charge * 0.74);
      }

      if (selectedPower === "jump" && performance.now() < wallBouncePoseUntil) {
        const t = 1 - THREE.MathUtils.clamp((wallBouncePoseUntil - performance.now()) / 520, 0, 1);
        const snap = Math.sin(t * Math.PI);
        const wallYaw = Math.atan2(wallBounceNormal.x, wallBounceNormal.z);
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, wallYaw, 0.42);
        playerParts.leftArm.rotation.set(-1.2, -0.22, -0.55);
        playerParts.rightArm.rotation.set(-1.2, 0.22, 0.55);
        playerParts.leftLeg.rotation.set(-1.25 * snap, 0.08, 0.22);
        playerParts.rightLeg.rotation.set(-1.25 * snap, -0.08, -0.22);
        playerParts.aura.material.opacity = 0.78;
        playerParts.aura.scale.setScalar(1.45 + snap * 0.36);
      }

      if (selectedPower === "jump" && performance.now() < bouncePunchUntil) {
        const t = 1 - THREE.MathUtils.clamp((bouncePunchUntil - performance.now()) / 300, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.rightArm.rotation.set(-1.85 * snap, 0.12, 0.46);
        playerParts.leftArm.rotation.set(-0.82, -0.12, -0.36);
        playerParts.rightLeg.rotation.set(0.95, 0, -0.18);
        playerParts.leftLeg.rotation.set(0.35, 0, 0.18);
        playerParts.aura.material.opacity = 0.72;
        playerParts.aura.scale.setScalar(1.32 + snap * 0.32);
      }

      if (selectedPower === "speed" && performance.now() < kickComboUntil) {
        const t = (kickComboUntil - performance.now()) / 190;
        const snap = Math.sin((1 - THREE.MathUtils.clamp(t, 0, 1)) * Math.PI);
        playerParts.leftArm.rotation.set(-0.35, 0, -0.38);
        playerParts.rightArm.rotation.set(-0.35, 0, 0.38);
        if (kickComboSide > 0) {
          playerParts.rightLeg.rotation.set(-1.45 * snap, 0.18, -0.08);
          playerParts.leftLeg.rotation.set(0.38 * snap, 0, 0.12);
        } else {
          playerParts.leftLeg.rotation.set(-1.45 * snap, -0.18, 0.08);
          playerParts.rightLeg.rotation.set(0.38 * snap, 0, -0.12);
        }
        playerParts.aura.scale.setScalar(1.5 + snap * 0.4);
        playerParts.aura.material.opacity = 0.72;
      }

      if (selectedPower === "teleport" && performance.now() < teleportPunchUntil) {
        const t = 1 - THREE.MathUtils.clamp((teleportPunchUntil - performance.now()) / 360, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.torso.rotation.x = -0.22 * snap;
        playerParts.leftArm.rotation.set(-0.72, -0.08, -0.42);
        playerParts.rightArm.rotation.set(-1.8 * snap, 0.18, 0.48);
        playerParts.leftLeg.rotation.set(0.4 * snap, 0, 0.1);
        playerParts.rightLeg.rotation.set(-0.42 * snap, 0, -0.1);
        playerParts.aura.scale.setScalar(1.48 + snap * 0.42);
        playerParts.aura.material.opacity = 0.76;
      } else if (selectedPower === "teleport" && performance.now() < teleportBackstabUntil) {
        const t = 1 - THREE.MathUtils.clamp((teleportBackstabUntil - performance.now()) / 520, 0, 1);
        const windup = Math.sin(Math.min(t * 1.35, 1) * Math.PI);
        const stab = Math.sin(THREE.MathUtils.clamp((t - 0.32) / 0.68, 0, 1) * Math.PI);
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, teleportBackstabYaw, Math.min(1, delta * 18));
        playerParts.torso.rotation.x = -0.32 * windup;
        playerParts.torso.rotation.y = 0.18 * stab;
        playerParts.leftArm.rotation.set(-0.78, -0.24, -0.5);
        playerParts.rightArm.rotation.set(-1.55 - stab * 0.35, 0.28, 0.58);
        playerParts.leftLeg.rotation.set(0.45 * windup, 0, 0.14);
        playerParts.rightLeg.rotation.set(-0.35 * windup, 0, -0.14);
        playerParts.aura.scale.setScalar(1.42 + stab * 0.5);
        playerParts.aura.material.opacity = 0.82;
      } else if (selectedPower === "teleport" && performance.now() < teleportMovePoseUntil) {
        const t = 1 - THREE.MathUtils.clamp((teleportMovePoseUntil - performance.now()) / 360, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.leftArm.rotation.set(-1.12 * snap, -0.18, -0.46);
        playerParts.rightArm.rotation.set(-1.12 * snap, 0.18, 0.46);
        playerParts.torso.rotation.x = -0.12 * snap;
        playerParts.aura.scale.setScalar(1.3 + snap * 0.35);
        playerParts.aura.material.opacity = 0.7;
      }

      if (selectedPower === "webs" && webSwingActive) {
        const swingAge = THREE.MathUtils.clamp((performance.now() - webSwingStartedAt) / 1850, 0, 1);
        playerParts.torso.rotation.x = 0.28 + swingAge * 0.3;
        playerParts.torso.position.z = -0.08;
        playerParts.head.position.z = 0.12;
        playerParts.leftArm.rotation.set(-2.76, -0.12, -0.12);
        playerParts.rightArm.rotation.set(-2.76, 0.12, 0.12);
        playerParts.leftHand.position.set(0.045, -0.65, -0.02);
        playerParts.rightHand.position.set(-0.045, -0.65, -0.02);
        playerParts.leftLeg.rotation.set(0.48 + swingAge * 0.55, 0, 0.3);
        playerParts.rightLeg.rotation.set(-0.62 - swingAge * 0.35, 0, -0.24);
        playerParts.aura.scale.setScalar(1.28 + swingAge * 0.28);
        playerParts.aura.material.opacity = 0.58;
      } else if (selectedPower === "webs" && performance.now() < webPunchUntil) {
        const t = 1 - THREE.MathUtils.clamp((webPunchUntil - performance.now()) / 360, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.torso.rotation.y = -0.32 + snap * 0.54;
        playerParts.torso.rotation.x = -0.15 * snap;
        playerParts.leftArm.rotation.set(-0.58, -0.12, -0.42);
        playerParts.rightArm.rotation.set(-1.92 * snap, 0.2, 0.5);
        playerParts.leftLeg.rotation.set(0.32 * snap, 0, 0.12);
        playerParts.rightLeg.rotation.set(-0.28 * snap, 0, -0.12);
        playerParts.aura.material.opacity = 0.68;
      } else if (selectedPower === "webs" && (webPullState || webZipState || performance.now() < webShootPoseUntil)) {
        playerParts.torso.rotation.x = -0.16;
        playerParts.leftArm.rotation.set(-0.66, -0.1, -0.38);
        playerParts.rightArm.rotation.set(-1.78, 0.18, 0.46);
        playerParts.rightHand.rotation.z = -0.16;
        playerParts.leftLeg.rotation.set(0.38, 0, 0.12);
        playerParts.rightLeg.rotation.set(-0.2, 0, -0.12);
        playerParts.aura.material.opacity = 0.55;
      }

      if (selectedPower === "webs" && webWallWalkActive) {
        const wallUp = webWallNormal.clone().normalize();
        const wallForward = new THREE.Vector3(0, 1, 0);
        const wallRight = new THREE.Vector3().crossVectors(wallUp, wallForward).normalize();
        webWallPoseMatrix.makeBasis(wallRight, wallUp, wallForward);
        webWallPoseQuaternion.setFromRotationMatrix(webWallPoseMatrix);
        if (webWallMoving) webWallFacingAngle = Math.atan2(webWallHorizontalInput, webWallVerticalInput);
        webWallFacingQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), webWallFacingAngle);
        webWallTargetQuaternion.copy(webWallPoseQuaternion).multiply(webWallFacingQuaternion);
        playerGroup.quaternion.slerp(webWallTargetQuaternion, Math.min(1, delta * 18));
        playerParts.aura.material.opacity = webWallMoving ? 0.5 : 0.34;
      }

      if (selectedPower === "strength" && isPointerDown) {
        const charge = THREE.MathUtils.clamp((performance.now() - strengthChargeStart) / 1450, 0, 1);
        playerParts.leftArm.rotation.set(-1.05 - charge * 0.5, 0, -0.42);
        playerParts.rightArm.rotation.set(-1.05 - charge * 0.5, 0, 0.42);
        playerParts.torso.scale.set(1 + charge * 0.12, 1 + charge * 0.08, 1 + charge * 0.12);
        playerParts.aura.scale.setScalar(1.1 + charge * 0.65);
        playerParts.aura.material.opacity = 0.35 + charge * 0.34;
      } else {
        playerParts.torso.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, delta * 9));
      }

      if (selectedPower === "strength" && strengthHeldBox) {
        playerParts.leftArm.rotation.set(-2.65, 0.18, -0.42);
        playerParts.rightArm.rotation.set(-2.65, -0.18, 0.42);
        playerParts.leftHand.position.set(0, -0.62, -0.02);
        playerParts.rightHand.position.set(0, -0.62, -0.02);
        playerParts.torso.rotation.x = -0.08;
        playerParts.aura.material.opacity = 0.42;
      }

      if (selectedPower === "telekinesis" && heldObject) {
        playerParts.leftArm.rotation.set(-1.28, -0.2, -0.46);
        playerParts.rightArm.rotation.set(-1.28, 0.2, 0.46);
        if (Math.random() < 0.18) {
          spawnBeam(playerParts.rightHand.getWorldPosition(new THREE.Vector3()), threeFromCannon(heldObject.body.position), color, 0.025, 0.16);
        }
      }

      if (selectedPower === "robot") {
        playerParts.torso.scale.lerp(new THREE.Vector3(1.08, 1.04, 1.08), Math.min(1, delta * 8));
        playerParts.leftArm.rotation.set(stride * 0.42 - 0.12, 0, -0.28);
        playerParts.rightArm.rotation.set(-0.82 - abilityPose * 0.35, 0.1, 0.22);
        playerParts.leftFoot.scale.setScalar(robotForwardThrusting || robotUpThrusting ? 1.18 : 1);
        playerParts.rightFoot.scale.setScalar(robotForwardThrusting || robotUpThrusting ? 1.18 : 1);
        if (robotForwardThrusting) {
          playerParts.torso.rotation.x = THREE.MathUtils.lerp(playerParts.torso.rotation.x, -0.22, Math.min(1, delta * 10));
          playerParts.leftArm.rotation.set(0.36, 0, -0.46);
          playerParts.rightArm.rotation.set(-0.45 - abilityPose * 0.25, 0.12, 0.32);
          playerParts.leftLeg.rotation.set(1.18, 0.02, 0.12);
          playerParts.rightLeg.rotation.set(1.18, -0.02, -0.12);
          playerParts.aura.material.opacity = 0.7;
          playerParts.aura.scale.setScalar(1.38 + Math.sin(walkTime * 2.6) * 0.08);
        }
        if (robotUpThrusting) {
          playerParts.torso.rotation.x = THREE.MathUtils.lerp(playerParts.torso.rotation.x, -0.08, Math.min(1, delta * 10));
          playerParts.leftArm.rotation.set(-0.18, -0.06, -0.5);
          playerParts.rightArm.rotation.set(-0.18 - abilityPose * 0.3, 0.06, 0.5);
          playerParts.leftLeg.rotation.set(0.92, 0.02, 0.16);
          playerParts.rightLeg.rotation.set(0.92, -0.02, -0.16);
          playerParts.aura.material.opacity = 0.76;
          playerParts.aura.scale.setScalar(1.48 + Math.sin(walkTime * 3.1) * 0.08);
        }
        if (robotShieldMode && !robotForwardThrusting && !robotUpThrusting) {
          playerParts.leftArm.rotation.set(-0.7, -0.1, -0.55);
          playerParts.rightArm.rotation.set(-0.7, 0.1, 0.55);
          playerParts.leftLeg.rotation.set(counterStride * 0.35, 0, 0.06);
          playerParts.rightLeg.rotation.set(stride * 0.35, 0, -0.06);
        }
      }

      if (flightLocked || divePending) {
        playerParts.torso.rotation.x = divePending ? 1.62 : 1.48;
        playerParts.torso.position.y = 1.05 + bob;
        playerParts.torso.position.z = divePending ? 0.42 : 0.34;
        playerParts.chest.position.z = divePending ? 0.72 : 0.58;
        playerParts.head.position.z = divePending ? 1.18 : 1.0;
        playerParts.head.position.y = 1.12 + bob;
        playerParts.leftArm.rotation.set(divePending ? -1.38 : -1.2, -0.08, -0.24);
        playerParts.rightArm.rotation.set(divePending ? 0.18 : 0.44, 0, 0.52);
        playerParts.leftLeg.position.set(-0.16, 0.78, -0.16);
        playerParts.rightLeg.position.set(0.16, 0.78, -0.16);
        playerParts.leftLeg.rotation.set(divePending ? 1.62 : 1.46, 0, 0.14);
        playerParts.rightLeg.rotation.set(divePending ? 1.62 : 1.46, 0, -0.14);
        playerParts.aura.material.opacity = 0.72;
      }

      playerParts.cape.visible = selectedPower === "flight";
      if (playerParts.cape.visible) {
        const wave = Math.sin(walkTime * 2.2) * 0.06;
        const featherPose = performance.now() < featherPoseUntil;
        playerParts.cape.rotation.x = featherPose ? -0.48 + wave : flightLocked || divePending ? 0.1 + wave : 0.24 + wave;
        playerParts.cape.rotation.z = featherPose ? Math.sin(walkTime * 10) * 0.18 : Math.sin(walkTime * 1.5) * 0.035;
        playerParts.cape.scale.set(featherPose ? 1.28 : 0.92, featherPose ? 0.82 : flightLocked || divePending ? 0.92 : 1, 1);
        playerParts.cape.position.set(0, flightLocked || divePending ? 0.0 : 0.04, -0.34);
      }
    }

    function syncVisuals() {
      const playerRenderPosition = playerBody.interpolatedPosition || playerBody.position;
      if (webWallWalkActive) {
        playerGroup.position.set(playerRenderPosition.x, playerRenderPosition.y, playerRenderPosition.z);
        playerGroup.position.addScaledVector(webWallNormal, -0.34);
      } else {
        playerGroup.position.set(playerRenderPosition.x, playerRenderPosition.y - PLAYER_VISUAL_ROOT_OFFSET, playerRenderPosition.z);
      }
      syncPairs.forEach(({ mesh, body }) => {
        const renderPosition = body.interpolatedPosition || body.position;
        const renderQuaternion = body.interpolatedQuaternion || body.quaternion;
        mesh.position.set(renderPosition.x, renderPosition.y, renderPosition.z);
        mesh.quaternion.set(renderQuaternion.x, renderQuaternion.y, renderQuaternion.z, renderQuaternion.w);
      });
      dynamicDummies.forEach((target) => {
        if (!target.healthGroup) return;
        const renderPosition = target.body.interpolatedPosition || target.body.position;
        const dx = renderPosition.x - playerRenderPosition.x;
        const dy = renderPosition.y - playerRenderPosition.y;
        const dz = renderPosition.z - playerRenderPosition.z;
        target.healthGroup.visible = !target.isDefeated && dx * dx + dy * dy + dz * dz <= HEALTH_BAR_RENDER_DISTANCE_SQ;
        if (!target.healthGroup.visible) return;
        target.healthGroup.position.set(
          renderPosition.x,
          renderPosition.y + (target.healthOffset || 1.9),
          renderPosition.z
        );
        target.healthGroup.quaternion.copy(camera.quaternion);
      });
    }

    function updateHud() {
      const showModeBadge = (selectedPower === "flight" && flightMode) || (selectedPower === "webs" && (webSwingActive || webWallWalkActive));
      flightBadge.hidden = !showModeBadge;
      flightBadge.style.display = showModeBadge ? "inline-block" : "none";
      flightBadge.textContent = selectedPower === "webs"
        ? webWallWalkActive ? "Wall Walk" : "Web Swing — release Space"
        : "Flight Mode";
      const healthPct = THREE.MathUtils.clamp(playerHealth / 100, 0, 1);
      const healthBackground = healthPct > 0.55
        ? "linear-gradient(90deg, #22c55e, #84cc16)"
        : healthPct > 0.25
          ? "linear-gradient(90deg, #facc15, #f97316)"
          : "linear-gradient(90deg, #ef4444, #f97316)";
      if (bottomHealthFill) {
        bottomHealthFill.style.width = `${Math.round(healthPct * 100)}%`;
        bottomHealthFill.style.background = healthBackground;
      }
      if (bottomHealthText) {
        bottomHealthText.textContent = `${Math.round(healthPct * 100)}%`;
      }
      hud.style.borderColor = playerDamageFlash > 0 ? "rgba(239, 68, 68, 0.85)" : "rgba(217, 222, 231, 0.85)";
      if (selectedPower === "strength" && isPointerDown) {
        const charge = THREE.MathUtils.clamp((performance.now() - strengthChargeStart) / 1450, 0, 1);
        chargeFill.style.width = `${Math.round(charge * 100)}%`;
      } else if (selectedPower === "jump" && megaLeapCharging) {
        const charge = THREE.MathUtils.clamp((performance.now() - megaLeapChargeStart) / 1150, 0, 1);
        chargeFill.style.width = `${Math.round(charge * 100)}%`;
      } else if (selectedPower !== "strength") {
        chargeFill.style.width = "0%";
      }
    }

    function updateFpsCounter(now) {
      fpsFrameCount += 1;
      const elapsed = now - fpsSampleStartedAt;
      if (elapsed < FPS_SAMPLE_INTERVAL) return;

      const sampledFps = (fpsFrameCount * 1000) / elapsed;
      displayedFps = displayedFps === 0
        ? sampledFps
        : THREE.MathUtils.lerp(displayedFps, sampledFps, 0.45);
      const roundedFps = Math.round(displayedFps);
      fpsCounter.textContent = `${roundedFps} FPS`;
      fpsCounter.dataset.tier = roundedFps >= TARGET_RENDER_FPS * 0.83
        ? "high"
        : roundedFps >= 60
          ? "medium"
          : "low";
      fpsFrameCount = 0;
      fpsSampleStartedAt = now;
    }

    function animate(now = performance.now()) {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      animateMenuPreview(now);

      if (gamePaused) {
        renderer.render(scene, camera);
        return;
      }

      updateHeldDummy();
      updateStrengthHeldBox();
      updatePinnedDummy();
      updateRobotShield();
      updatePlayerControl(delta);
      updateSuperJump(delta);
      updateSpiderWebs(delta);
      updateMinions(delta);
      playerDamageFlash = Math.max(0, playerDamageFlash - delta);

      // fixedStep keeps Cannon stable while rendering at the display refresh rate.
      world.fixedStep(1 / 60, delta, 5);
      updateCamera();
      syncVisuals();
      animatePlayer(delta);
      updateMultiplayer(now, delta);
      refreshWebCordVisual();
      updateEffects(delta);
      updateHud();
      shadowRefreshAccumulator += delta;
      if (shadowRefreshAccumulator >= SHADOW_REFRESH_INTERVAL) {
        renderer.shadowMap.needsUpdate = true;
        shadowRefreshAccumulator %= SHADOW_REFRESH_INTERVAL;
      }
      renderer.render(scene, camera);
      updateFpsCounter(now);
    }

    function startGame(power) {
      selectedPower = power;
      updatePrototypePanelLabel(power);
      gameStarted = true;
      gamePaused = false;
      pauseOverlay.hidden = true;
      keys.clear();
      flightMode = false;
      divePending = false;
      setShiftLock(false, false);
      resetSpiderWebState(true);
      flightFeatherCooldownUntil = 0;
      featherPoseUntil = 0;
      robotShieldMode = false;
      robotThrusterTimer = 0;
      robotShieldEndsAt = 0;
      robotShieldCooldownUntil = 0;
      playerHealth = 100;
      playerDamageFlash = 0;
      isPointerDown = false;
      megaLeapCharging = false;
      megaLeapChargeStart = 0;
      megaLeapActiveUntil = 0;
      bouncePunchUntil = 0;
      wallBouncePoseUntil = 0;
      rightMouseDragging = false;
      renderShiftLockState();
      firstPersonMode = false;
      if (heldObject) releaseTelekinesis();
      if (strengthHeldBox) {
        strengthHeldBox.isHeld = false;
        strengthHeldBox.body.type = CANNON.Body.DYNAMIC;
        strengthHeldBox.body.mass = strengthHeldBox.mass;
        strengthHeldBox.body.collisionResponse = true;
        strengthHeldBox.body.updateMassProperties();
        strengthHeldBox = null;
      }
      disposeMenuPreviews();
      ensureSelectedMapBuilt();
      renderer.shadowMap.needsUpdate = true;
      resetMinionArena();
      const data = POWER_DATA[power];
      playerTorso.material.color.setHex(data.color);
      playerParts.aura.material.color.setHex(data.color);
      powerName.textContent = data.name;
      const map = MAP_DATA[selectedMap];
      powerHelp.textContent = `${map.name}. ${data.help} WASD move. Left Ctrl toggles Shift Lock. Right drag camera. V toggles first person. Esc pauses.`;
      hud.style.display = "block";
      if (inventoryHud) inventoryHud.style.display = "block";
      fpsCounter.style.display = "block";
      fpsCounter.textContent = "-- FPS";
      fpsCounter.dataset.tier = "idle";
      fpsFrameCount = 0;
      fpsSampleStartedAt = performance.now();
      displayedFps = 0;
      startOverlay.style.display = "none";
      playerBody.position.set(map.spawn.x, map.spawn.y, map.spawn.z);
      playerBody.velocity.set(0, 0, 0);
      cameraYaw = map.yaw;
      cameraPitch = 0.23;
      cameraDistance = selectedMap === "city" ? 10.2 : selectedMap === "speedTrack" ? 9.2 : selectedMap === "minionArena" || selectedMap === "strengthPit" ? 8.4 : 7.2;
      camera.far = selectedMap === "city" ? 360 : 180;
      camera.updateProjectionMatrix();
      lastSprintTrailPosition.copy(map.spawn);
      kickComboUntil = 0;
      teleportPunchUntil = 0;
      teleportMovePoseUntil = 0;
      teleportBackstabUntil = 0;
      teleportBackstabYaw = map.yaw;
      teleportMoveCooldownUntil = 0;
      strengthUltraCooldownUntil = 0;
      selectedHotbarIndex = null;
      speedPearlCount = power === "speed" ? 5 : 0;
      pearlThrowPoseUntil = 0;
      strongSwordSlashUntil = 0;
      strongSwordCooldownUntil = 0;
      webPunchUntil = 0;
      webShootPoseUntil = 0;
      webTrapCooldownUntil = 0;
      webPullCooldownUntil = 0;
      renderHotbar();
      if (selectedMap === "minionArena") spawnNextMinion();
      showMessage("Aim with the cursor. Hold right click and drag to move the camera.", 2400);
      playerBody.wakeUp();
      renderer.domElement.focus();
      connectToMultiplayer();
    }

    function releaseActiveInputs() {
      keys.clear();
      isPointerDown = false;
      megaLeapCharging = false;
      rightMouseDragging = false;
      renderShiftLockState();
      releaseTelekinesis();
      endSpiderSwing(false);
      webPullState = null;
      webZipState = null;
      webWallWalkActive = false;
      webWallLastContactAt = 0;
      webWallDetachUntil = 0;
      webLeftDownAt = 0;
      webHoldTriggered = false;
      if (webCord) webCord.group.visible = false;
      if (strengthHeldBox) toggleStrengthBoxGrab();
      chargeFill.style.width = "0%";
    }

    function setPaused(paused) {
      if (!gameStarted || gamePaused === paused) return;
      gamePaused = paused;
      releaseActiveInputs();
      pauseOverlay.hidden = !paused;
      if (paused) {
        if (document.pointerLockElement) document.exitPointerLock();
        resumeButton.focus();
      } else {
        clock.getDelta();
        renderer.domElement.focus();
      }
    }

    resumeButton.addEventListener("click", () => setPaused(false));
    restartButton.addEventListener("click", () => startGame(selectedPower));
    mainMenuButton.addEventListener("click", () => window.location.reload());

    let menuSelectedPower = null;
    let menuLaunching = false;

    function setMenuStep(step) {
      const choosingMap = step === "map";
      heroStep.classList.toggle("active", !choosingMap);
      heroStep.setAttribute("aria-hidden", String(choosingMap));
      mapStep.classList.toggle("active", choosingMap);
      mapStep.setAttribute("aria-hidden", String(!choosingMap));
      document.querySelector('[data-progress="hero"]').classList.toggle("active", !choosingMap);
      document.querySelector('[data-progress="map"]').classList.toggle("active", choosingMap);
    }

    startOverlay.addEventListener("pointerdown", startMenuMusic, { once: true });

    function setOnlineMode(enabled) {
      onlineMode = enabled;
      soloModeButton.classList.toggle("active", !enabled);
      onlineModeButton.classList.toggle("active", enabled);
      roomControls.hidden = !enabled;
      if (enabled && !roomCodeInput.value) roomCodeInput.value = createRoomCode();
      playSfx("menuTap");
    }

    soloModeButton.addEventListener("click", () => setOnlineMode(false));
    onlineModeButton.addEventListener("click", () => setOnlineMode(true));
    newRoomButton.addEventListener("click", () => {
      roomCodeInput.value = createRoomCode();
      playSfx("menuTap");
    });
    roomCodeInput.addEventListener("input", () => { roomCodeInput.value = normalizeRoomCode(roomCodeInput.value); });

    document.querySelectorAll(".powerCard").forEach((button) => {
      button.addEventListener("click", () => {
        if (menuLaunching) return;
        startMenuMusic();
        playSfx("menuTap");
        menuSelectedPower = button.dataset.power;
        updatePrototypePanelLabel(menuSelectedPower);
        document.querySelectorAll(".powerCard").forEach((item) => item.classList.toggle("chosen", item === button));
        window.setTimeout(() => {
          setMenuStep("map");
          const firstMapButton = document.querySelector(".mapButton");
          showMenuPreview(firstMapButton.dataset.map, firstMapButton.querySelector(".mapPreviewHost"));
          firstMapButton.focus();
        }, 330);
      });
    });

    document.querySelectorAll(".mapButton").forEach((button) => {
      const previewHost = button.querySelector(".mapPreviewHost");
      const revealPreview = () => showMenuPreview(button.dataset.map, previewHost);
      button.addEventListener("pointerenter", revealPreview);
      button.addEventListener("focus", revealPreview);
      button.addEventListener("click", () => {
        if (!menuSelectedPower || menuLaunching) return;
        menuLaunching = true;
        selectedMap = button.dataset.map;
        button.classList.add("chosen");
        launchStatus.textContent = `${POWER_DATA[menuSelectedPower].name} → ${MAP_DATA[selectedMap].name}`;
        playSfx("menuTap");
        stopMenuMusic();
        window.setTimeout(() => playSfx("gameStart"), 90);
        startOverlay.classList.add("leaving");
        launchTransition.classList.add("active");
        launchTransition.setAttribute("aria-hidden", "false");
        window.setTimeout(() => startGame(menuSelectedPower), 470);
        window.setTimeout(() => {
          launchTransition.classList.remove("active");
          launchTransition.setAttribute("aria-hidden", "true");
          startOverlay.classList.remove("leaving");
        }, 1250);
      });
    });

    backToHeroes.addEventListener("click", () => {
      if (menuLaunching) return;
      playSfx("menuBack");
      document.querySelectorAll(".powerCard").forEach((item) => item.classList.remove("chosen"));
      setMenuStep("hero");
      const selectedButton = document.querySelector(`[data-power="${menuSelectedPower}"]`);
      selectedButton?.focus();
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape" && gameStarted && !event.repeat) {
        event.preventDefault();
        setPaused(!gamePaused);
        return;
      }
      if (gamePaused) {
        event.preventDefault();
        return;
      }
      keys.add(event.code);
      if (/^Digit[1-9]$/.test(event.code) && gameStarted && !event.repeat) {
        selectHotbarSlot(Number(event.code.slice(5)) - 1);
        event.preventDefault();
      }
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        if (!event.repeat) toggleFlight();
      }
      if ((event.code === "ControlLeft" || event.key === "Control") && !event.repeat && gameStarted) {
        toggleShiftLock();
      }
      if (event.code === "KeyV" && !event.repeat && gameStarted) {
        firstPersonMode = !firstPersonMode;
        showMessage(firstPersonMode ? "First person mode" : "Third person mode", 900);
      }
      if (event.code === "Space" && !event.repeat && gameStarted && selectedPower === "webs") {
        if (webWallWalkActive) jumpOffSpiderWall();
        else if (!isGrounded() && !webSwingActive) beginSpiderSwing();
      }
      if (event.code === "KeyE" && !event.repeat && gameStarted) {
        toggleStrengthBoxGrab();
        toggleRobotShield();
        teleportMove();
        shootSpiderNet();
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ControlLeft", "ControlRight", "KeyE", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (gamePaused) return;
      keys.delete(event.code);
      if (event.code === "Space" && selectedPower === "webs") endSpiderSwing();
    });

    window.addEventListener("blur", () => {
      releaseActiveInputs();
    });

    window.addEventListener("mousedown", (event) => {
      if (!gameStarted || gamePaused) return;
      event.preventDefault();
      if (event.button === 2) {
        rightMouseDragging = true;
        renderShiftLockState();
        return;
      }
      if (event.button === 0) onAbilityDown();
    });

    window.addEventListener("mouseup", (event) => {
      if (gamePaused) return;
      if (event.button === 2) {
        rightMouseDragging = false;
        renderShiftLockState();
      }
      if (event.button !== 0) return;
      event.preventDefault();
      onAbilityUp();
    });

    window.addEventListener("mousemove", (event) => {
      if (shiftLockMode) mouseNdc.set(0, 0);
      else {
        mouseNdc.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }
      if (!gameStarted || gamePaused) return;
      const lockedMouseLook = shiftLockMode || (
        document.pointerLockElement === renderer.domElement && selectedPower === "flight" && flightMode
      );
      if (lockedMouseLook) {
        cameraYaw -= event.movementX * 0.003;
        cameraPitch -= event.movementY * 0.0024;
        cameraPitch = THREE.MathUtils.clamp(cameraPitch, selectedPower === "flight" && flightMode ? -0.72 : -0.42, selectedPower === "flight" && flightMode ? 0.88 : 0.82);
      } else if (rightMouseDragging) {
        cameraYaw -= event.movementX * 0.003;
        cameraPitch -= event.movementY * 0.0024;
        cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.42, 0.82);
      }
    });

    window.addEventListener("wheel", (event) => {
      if (gamePaused) return;
      if (heldObject) {
        event.preventDefault();
        telekinesisHoldDistance = THREE.MathUtils.clamp(
          telekinesisHoldDistance + Math.sign(event.deltaY) * 0.75,
          2.2,
          34
        );
        return;
      }
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + Math.sign(event.deltaY) * 0.55, 4.8, 11);
    }, { passive: false });

    window.addEventListener("contextmenu", (event) => event.preventDefault());

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_RENDER_PIXEL_RATIO));
    });

    syncVisuals();
    updateCamera();
    animate();
