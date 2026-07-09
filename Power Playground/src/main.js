import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";
import { MAP_DATA, POWER_DATA } from "./config.js?v=20260708-flight-web-defeat";
import { playSfx as playLocalSfx, startMenuMusic, stopMenuMusic } from "./sfx.js?v=20260708-flight-web-defeat";
import { MultiplayerClient, createRoomCode, normalizeRoomCode } from "./multiplayer.js?v=20260706-v2";

    const keys = new Set();
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const mouseNdc = new THREE.Vector2(0, 0);
    const tmpVec3 = new THREE.Vector3();
    const tmpVec3B = new THREE.Vector3();
    const tmpCannon = new CANNON.Vec3();
    const dummyMass = 3.4;
    const PLAYER_VISUAL_ROOT_OFFSET = 0.27;
    const TELEKINESIS_GRAB_COOLDOWN = 1200;
    const ROBOT_SHOT_COOLDOWN = 850;

    let selectedPower = null;
    let menuSelectedPower = null;
    let selectedMap = "hub";
    let builtMap = null;
    const builtMaps = new Set();
    let gameStarted = false;
    let gamePaused = false;
    let cameraYaw = Math.PI;
    let cameraPitch = 0.23;
    let cameraDistance = 7.2;
    let isPointerDown = false;
    let primaryAttackArmed = false;
    let strengthChargeStart = 0;
    let strengthUltraCooldownUntil = 0;
    let heldObject = null;
    let strengthHeldBox = null;
    let strengthHeldEnemy = null;
    let strengthThrowPoseUntil = 0;
    let strengthGrabCooldownUntil = 0;
    let grabbedById = null;
    let playerForcedMotionUntil = 0;
    let playerTumbleUntil = 0;
    let flightMode = false;
    let flyMeterCharge = 0;
    let flyMeterGraceUntil = 0;
    let flightJumpArmed = false;
    let flightSprintActive = false;
    let flightTurboActive = false;
    let flightTrailTimer = 0;
    let flightStrikeState = null;
    let flightStrikeCooldownUntil = 0;
    let divePending = false;
    let flightFeatherCooldownUntil = 0;
    let featherPoseUntil = 0;
    let firstPersonMode = false;
    let frontViewMode = false;
    let rightMouseDragging = false;
    let shiftLockMode = false;
    let robotShieldMode = false;
    let robotThrusterTimer = 0;
    let lastRobotThrusterSfx = 0;
    let robotShieldEndsAt = 0;
    let robotShieldCooldownUntil = 0;
    let robotShotCooldownUntil = 0;
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
    let telekinesisHeldPlayer = null;
    let grabbedMode = null;
    let telekinesisPlayerSlamReportAt = 0;
    let telekinesisGrabCooldownUntil = 0;
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
    let webSwingMomentumUntil = 0;
    let webSwingCooldownUntil = 0;
    let webPullState = null;
    let webPullTargetPlayer = null;
    let webPulledById = null;
    let webPullEndsAt = 0;
    let playerWebTrappedUntil = 0;
    let playerWebTrapAnchor = null;
    let playerWebWrap = null;
    let webZipState = null;
    let webPunchUntil = 0;
    let webPunchCooldownUntil = 0;
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
    const maxPlayerHealth = (power = selectedPower) => power === "strength" ? 150 : 100;
    let fpsFrameCount = 0;
    let fpsSampleStartedAt = performance.now();
    let displayedFps = 0;
    let shadowRefreshAccumulator = 0;
    let onlineMode = false;
    let multiplayerClient = null;
    let multiplayerSendAt = 0;
    let entitySendAt = 0;
    let multiplayerHostId = null;
    let localUsername = "Player";
    let localPlayerIcon = "portrait-speed";
    let pvpRespawnAt = 0;
    let localDefeat = null;
    let soloDefeatSequence = 0;
    let cameraReturn = null;
    const defeatEffects = new Map();
    const seenDefeatIds = new Set();
    let suppressNetworkVisuals = false;
    let burstSeedCounter = Math.floor(Math.random() * 0x7fffffff);
    const pendingNetworkVisuals = [];
    const roomPlayers = new Map();
    const remotePlayers = new Map();

    function queueNetworkVisual(event) {
      if (suppressNetworkVisuals || !onlineMode || !gameStarted || !multiplayerClient?.id) return;
      if (pendingNetworkVisuals.length < 96) pendingNetworkVisuals.push(event);
    }

    function playSfx(name) {
      playLocalSfx(name);
      queueNetworkVisual({ type: "sfx", name });
    }

    function withoutNetworkVisualRelay(callback) {
      const previous = suppressNetworkVisuals;
      suppressNetworkVisuals = true;
      try { callback(); } finally { suppressNetworkVisuals = previous; }
    }

    const startOverlay = document.getElementById("startOverlay");
    const modeStep = document.getElementById("modeStep");
    const heroStep = document.getElementById("heroStep");
    const mapStep = document.getElementById("mapStep");
    const backToHeroes = document.getElementById("backToHeroes");
    const backToMode = document.getElementById("backToMode");
    const launchTransition = document.getElementById("launchTransition");
    const launchStatus = document.getElementById("launchStatus");
    const hud = document.getElementById("hud");
    const powerName = document.getElementById("powerName");
    const powerHelp = document.getElementById("powerHelp");
    const chargeFill = document.getElementById("chargeFill");
    const flightBadge = document.getElementById("flightBadge");
    const flyMeter = document.getElementById("flyMeter");
    const flyMeterFill = document.getElementById("flyMeterFill");
    const flyMeterState = document.getElementById("flyMeterState");
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
    const menuUsername = document.getElementById("menuUsername");
    const usernameOverlay = document.getElementById("usernameOverlay");
    const usernameInput = document.getElementById("usernameInput");
    const saveUsernameButton = document.getElementById("saveUsernameButton");
    const onlineOnlyMaps = document.querySelectorAll(".onlineOnlyMap");
    const powerSwapSelect = document.getElementById("powerSwapSelect");
    const swapPowerButton = document.getElementById("swapPowerButton");
    const selectionProgress = document.getElementById("selectionProgress");
    const onlineLobby = document.getElementById("onlineLobby");
    const connectRoomButton = document.getElementById("connectRoomButton");
    const continueOnlineButton = document.getElementById("continueOnlineButton");
    const lobbyConnection = document.querySelector(".lobbyConnection");
    const lobbyConnectionText = document.getElementById("lobbyConnectionText");
    const lobbyRoster = document.getElementById("lobbyRoster");
    const lobbyPlayerCount = document.getElementById("lobbyPlayerCount");
    const lobbyPlayerDetail = document.getElementById("lobbyPlayerDetail");
    const playerList = document.getElementById("playerList");
    const playerListRows = document.getElementById("playerListRows");
    const playerListCount = document.getElementById("playerListCount");
    const usernameIconPicker = document.getElementById("usernameIconPicker");
    const menuIconButton = document.getElementById("menuIconButton");
    const menuIconPanel = document.getElementById("menuIconPanel");
    const menuIconPicker = document.getElementById("menuIconPicker");
    const mapSwapSelect = document.getElementById("mapSwapSelect");
    const swapMapButton = document.getElementById("swapMapButton");

    const PLAYER_ICON_POWERS = ["speed", "strength", "teleport", "telekinesis", "flight", "jump", "robot", "webs"];
    const PLAYER_ICON_IDS = PLAYER_ICON_POWERS.flatMap((power) => [`portrait-${power}`, `symbol-${power}`]);
    const PIXEL_FACE_RECTS = {
      speed: [[5,7,8,2],[19,7,8,2],[7,11,6,6],[19,11,6,6],[5,20,22,3],[8,23,16,5,"#ffffff"],[11,23,2,3],[19,23,2,3]],
      strength: [[6,10,7,2],[19,8,7,2],[8,13,5,2],[20,12,5,2],[9,21,14,2],[12,23,8,2]],
      teleport: [[5,12,8,2],[19,10,8,2],[12,22,8,2]],
      telekinesis: [[5,9,9,2],[18,9,9,2],[8,12,6,3],[18,12,6,3],[10,23,12,2]],
      flight: [[5,7,3,2],[8,8,6,2],[18,8,6,2],[24,7,3,2],[7,11,6,4],[19,11,6,4],[7,20,18,2],[10,22,12,3,"#ffffff"]],
      jump: [[5,7,8,2],[20,9,6,2],[7,11,6,6],[21,12,4,3],[6,21,6,3],[12,23,13,2],[20,25,5,4,"#ff69b4"]],
      robot: [[3,8,26,11,"#263449"],[7,11,6,4,"#67e8f9"],[19,11,6,4,"#67e8f9"],[10,23,12,2,"#67e8f9"]],
      webs: [[5,10,9,2],[18,9,9,2],[8,12,5,4],[19,12,5,4],[10,22,13,2],[19,20,5,2]]
    };
    const iconArtCache = new Map();
    const iconImageCache = new Map();

    function playerIconArt(iconId = "portrait-speed") {
      const safeId = PLAYER_ICON_IDS.includes(iconId) ? iconId : "portrait-speed";
      if (iconArtCache.has(safeId)) return iconArtCache.get(safeId);
      const [kind, power] = safeId.split("-");
      const color = `#${(POWER_DATA[power]?.color || 0x2563eb).toString(16).padStart(6, "0")}`;
      const backgroundColor = kind === "portrait" && power === "webs" ? "#2563eb" : color;
      const dark = power === "speed" ? "#6b5600" : "#172033";
      const symbols = {
        speed: '<path d="M39 8 18 37h15l-7 19 26-32H36z"/><path d="M10 19h15M7 29h14"/>',
        strength: '<path d="M15 30V18q0-5 5-5t5 5v8-11q0-5 5-5t5 5v11-9q0-5 5-5t5 5v11-6q0-5 5-5t5 5v15q0 19-20 21-17-1-23-17L7 31q-2-5 3-7 4-1 7 5l4 7V30z" fill="#fff" stroke="#fff"/><path d="M21 29h28M25 19v10m10-12v12m10-8v8" stroke="#172033" stroke-width="3"/>',
        teleport: '<path d="M51 33c0 12-10 21-22 19C16 50 9 37 14 25 19 13 34 8 45 16c10 7 9 22 0 28-8 6-20 2-22-7-2-8 5-15 13-14 7 1 10 9 6 14-3 5-11 4-12-2"/>',
        telekinesis: '<path d="M13 24C5 31 8 44 19 48m32-24c8 7 5 20-6 24M19 14C8 17 7 31 17 35m28-21c11 3 12 17 2 21" opacity=".65"/><path d="M24 18c-8 0-11 10-5 14-5 6 1 15 8 12 3 6 12 4 12-2 8 2 12-8 6-13 4-8-7-15-13-9-2-4-8-4-8-2z"/><path d="M31 21v22m-8-17c5 0 8 3 8 7m8-7c-5 0-8 3-8 7m-7 6c4-2 7-1 7 3m8-3c-4-2-7-1-7 3" stroke-width="2.5"/>',
        flight: '<path d="M16 10h32l8 44-24-9L8 54z"/><path d="M16 10q16 12 32 0M32 18v27"/>',
        jump: '<path d="M18 9v9l-8 5 16 7-16 7 16 7-8 5v7M46 9v9l8 5-16 7 16 7-16 7 8 5v7"/>',
        robot: '<circle cx="32" cy="32" r="24" fill="#05070b" stroke="#22d3ee"/><path d="M14 25h36l-6 17H20z" fill="#22d3ee" stroke="#67e8f9"/><path d="M23 32h6m6 0h6" stroke="#05070b" stroke-width="4"/>',
        webs: '<path d="M32 7v50M7 32h50M14 14l36 36M50 14 14 50M32 7C18 7 7 18 7 32s11 25 25 25 25-11 25-25S46 7 32 7zm0 9c-9 0-16 7-16 16s7 16 16 16 16-7 16-16-7-16-16-16zm0 8a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/>'
      };
      const portraitPixels = PIXEL_FACE_RECTS[power].map(([x,y,width,height,fill = "#172033"]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`).join("");
      const art = kind === "symbol"
        ? `<g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${symbols[power]}</g>`
        : `<path d="M7 55q25-17 50 0v9H7z" fill="${color}"/><circle cx="32" cy="29" r="21" fill="${power === "robot" ? "#111827" : "#e5e7eb"}"/><g transform="translate(16 12)" shape-rendering="crispEdges">${portraitPixels}</g>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${backgroundColor}"/><stop offset="1" stop-color="#172033"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><circle cx="12" cy="11" r="15" fill="#fff" opacity=".13"/>${art}</svg>`;
      const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      iconArtCache.set(safeId, uri);
      return uri;
    }

    function cachedPlayerIconImage(iconId) {
      const safeId = PLAYER_ICON_IDS.includes(iconId) ? iconId : "portrait-speed";
      if (!iconImageCache.has(safeId)) {
        const image = new Image();
        image.src = playerIconArt(safeId);
        iconImageCache.set(safeId, image);
      }
      return iconImageCache.get(safeId);
    }

    function setLocalPlayerIcon(iconId, sync = true) {
      localPlayerIcon = PLAYER_ICON_IDS.includes(iconId) ? iconId : "portrait-speed";
      try { localStorage.setItem("powerPlaygroundPlayerIcon", localPlayerIcon); } catch { /* Storage can be unavailable. */ }
      menuIconButton.replaceChildren(Object.assign(document.createElement("img"), { src: playerIconArt(localPlayerIcon), alt: "" }));
      document.querySelectorAll(".iconChoice").forEach((button) => button.classList.toggle("selected", button.dataset.icon === localPlayerIcon));
      renderPlayerList();
      if (sync && multiplayerClient?.socket?.readyState === WebSocket.OPEN) {
        multiplayerClient.send({ type: "hello", power: gameStarted ? selectedPower : menuSelectedPower || "speed", map: gameStarted ? selectedMap : "lobby", username: localUsername, icon: localPlayerIcon });
        rememberRoomPlayer({ id: multiplayerClient.id, username: localUsername, icon: localPlayerIcon });
      }
    }

    function buildIconPicker(host) {
      if (!host) return;
      PLAYER_ICON_IDS.forEach((iconId) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "iconChoice";
        button.dataset.icon = iconId;
        button.title = `${POWER_DATA[iconId.split("-")[1]].name} ${iconId.startsWith("portrait") ? "portrait" : "symbol"}`;
        button.appendChild(Object.assign(document.createElement("img"), { src: playerIconArt(iconId), alt: button.title }));
        button.addEventListener("click", () => setLocalPlayerIcon(iconId));
        host.appendChild(button);
      });
    }

    buildIconPicker(usernameIconPicker);
    buildIconPicker(menuIconPicker);
    try { localPlayerIcon = localStorage.getItem("powerPlaygroundPlayerIcon") || localPlayerIcon; } catch { /* Storage can be unavailable. */ }
    setLocalPlayerIcon(localPlayerIcon, false);
    menuIconButton.addEventListener("click", () => { menuIconPanel.hidden = !menuIconPanel.hidden; });

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

    const menuPreviewCenters = { hub: 0, speedTrack: 116, minionArena: 219, strengthPit: 318, city: 460, pvpArena: 650 };
    const menuPreviewCameras = {
      hub: { radius: 20, height: 10, targetY: 2.6 },
      speedTrack: { radius: 44, height: 17, targetY: 2.2 },
      minionArena: { radius: 28, height: 15, targetY: 2.1 },
      strengthPit: { radius: 28, height: 15, targetY: -1.2 },
      city: { radius: 82, height: 48, targetY: 8 },
      pvpArena: { radius: 48, height: 24, targetY: 2.5 }
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
    const networkVisualAnimations = [];
    const activeFloorWebs = [];
    const networkFloorWebs = new Map();
    const activeWebProjectiles = [];
    const mapResources = new Map();
    let activeMinion = null;
    let minionSpawnIndex = 0;
    let minionRespawnTimer = 0;
    const PVP_CENTER_Z = 650;
    const PVP_SPAWN_SLOTS = [[-31, -18], [31, 18], [-31, 18], [31, -18], [-18, -31], [18, 31], [-18, 31], [18, -31]];
    const PVP_JUMP_PADS = [[-27, -27], [27, -27], [-27, 27], [27, 27], [-11, 0], [11, 0]];
    let pvpJumpPadCooldownUntil = 0;

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
      const roofWindowColors = [0x40566d, 0x31465a, 0x40566d, 0x31465a];
      const buildingMats = buildingFacadeMats.map((facade, index) => {
        const roof = new THREE.MeshStandardMaterial({
          color: roofWindowColors[index],
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

    function buildPvpArena() {
      const centerZ = PVP_CENTER_Z;
      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), whiteMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.z = centerZ;
      floorMesh.receiveShadow = true;
      floorMesh.userData.type = "floor";
      scene.add(floorMesh);
      raycastTargets.push(floorMesh);

      const floorBody = new CANNON.Body({ mass: 0, material: groundMaterial });
      floorBody.addShape(new CANNON.Box(new CANNON.Vec3(38, 0.5, 38)));
      floorBody.position.set(0, -0.5, centerZ);
      floorBody.userData = { type: "floor", name: "pvp arena floor" };
      world.addBody(floorBody);

      addStaticBox("pvp north wall", new THREE.Vector3(76, 8, 0.8), new THREE.Vector3(0, 4, centerZ - 38), wallMat);
      addStaticBox("pvp south wall", new THREE.Vector3(76, 8, 0.8), new THREE.Vector3(0, 4, centerZ + 38), wallMat);
      addStaticBox("pvp west wall", new THREE.Vector3(0.8, 8, 76), new THREE.Vector3(-38, 4, centerZ), wallMat);
      addStaticBox("pvp east wall", new THREE.Vector3(0.8, 8, 76), new THREE.Vector3(38, 4, centerZ), wallMat);

      [
        [-18, 2, -15, 9, 4, 3], [18, 2, 15, 9, 4, 3],
        [-18, 2, 15, 3, 4, 9], [18, 2, -15, 3, 4, 9],
        [0, 1.25, 0, 12, 2.5, 12], [0, 3.7, 0, 6, 2.4, 6],
      ].forEach(([x, y, z, sx, sy, sz], index) => {
        addStaticBox(`pvp test cover ${index + 1}`, new THREE.Vector3(sx, sy, sz), new THREE.Vector3(x, y, centerZ + z), obstacleMat);
      });

      PVP_JUMP_PADS.forEach(([x, z], index) => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.16, 24), new THREE.MeshStandardMaterial({ color: index % 2 ? 0xef4444 : 0x2563eb, emissive: index % 2 ? 0x450a0a : 0x172554, emissiveIntensity: 0.35, roughness: 0.5 }));
        pad.position.set(x, 0.08, centerZ + z);
        pad.receiveShadow = true;
        scene.add(pad);
      });

      PVP_SPAWN_SLOTS.forEach(([x, z]) => {
        const marker = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.5, 24), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(x, 0.025, centerZ + z);
        scene.add(marker);
      });

      [[-24, -8], [24, 8], [-8, 24], [8, -24], [0, 15], [0, -15]].forEach(([x, z], index) => {
        createMovableBox(new THREE.Vector3(x, 0.7, centerZ + z), index % 2 ? 0xef4444 : 0x2563eb);
      });
    }

    const mapBuilders = {
      hub: buildHub,
      speedTrack: buildSuperSpeedTrack,
      minionArena: buildMinionArena,
      strengthPit: buildStrengthPit,
      city: buildPowerCity,
      pvpArena: buildPvpArena
    };

    function ensureSelectedMapBuilt() {
      if (!builtMaps.has(selectedMap)) {
        const sceneBefore = new Set(scene.children);
        const bodiesBefore = new Set(world.bodies);
        const raycastBefore = new Set(raycastTargets);
        mapBuilders[selectedMap]();
        mapResources.set(selectedMap, {
          objects: scene.children.filter((object) => !sceneBefore.has(object)),
          bodies: world.bodies.filter((body) => !bodiesBefore.has(body)),
          raycastTargets: raycastTargets.filter((target) => !raycastBefore.has(target)),
        });
        builtMaps.add(selectedMap);
      }
      const trackedRaycasts = new Set([...mapResources.values()].flatMap((resource) => resource.raycastTargets));
      mapResources.forEach((resource, mapKey) => {
        const active = mapKey === selectedMap;
        resource.objects.forEach((object) => { object.visible = active; });
        resource.bodies.forEach((body) => {
          const inWorld = world.bodies.includes(body);
          if (active && !inWorld) world.addBody(body);
          if (!active && inWorld) world.removeBody(body);
        });
      });
      const activeTargets = new Set(mapResources.get(selectedMap)?.raycastTargets || []);
      for (let index = raycastTargets.length - 1; index >= 0; index -= 1) {
        if (trackedRaycasts.has(raycastTargets[index]) && !activeTargets.has(raycastTargets[index])) raycastTargets.splice(index, 1);
      }
      activeTargets.forEach((target) => { if (!raycastTargets.includes(target)) raycastTargets.push(target); });
      const cityActive = selectedMap === "city";
      scene.background = new THREE.Color(cityActive ? 0x8fcdf4 : 0xf7f9fc);
      scene.fog = new THREE.Fog(cityActive ? 0x8fcdf4 : 0xf7f9fc, cityActive ? 105 : 38, cityActive ? 255 : 76);
      sun.shadow.camera.far = cityActive ? 190 : 64;
      renderer.shadowMap.needsUpdate = true;
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
      const other = event.body;
      const otherType = other && other.userData && other.userData.type;
      const contactNormalY = Math.abs(Number(event.contact?.ni?.y) || 0);
      if (divePending && playerBody.velocity.y <= 1 && contactNormalY > 0.42 && ["floor", "obstacle", "movableBox"].includes(otherType)) {
        finishDiveImpact(new THREE.Vector3(playerBody.position.x, playerBody.position.y - 0.52, playerBody.position.z));
      }
      if (grabbedById && grabbedMode === "telekinesis" && performance.now() >= telekinesisPlayerSlamReportAt && (otherType === "floor" || otherType === "obstacle" || otherType === "movableBox")) {
        telekinesisPlayerSlamReportAt = performance.now() + 700;
        multiplayerClient?.sendAction({
          kind: "telekinesis-slam-player",
          holderId: grabbedById,
          position: [playerBody.position.x, playerBody.position.y, playerBody.position.z],
          impactSpeed: playerBody.velocity.length(),
        });
      }
      if (selectedPower !== "jump") return;
      if (otherType !== "obstacle") return;
      const normal = threeFromCannon(other.position).sub(threeFromCannon(playerBody.position));
      if (normal.lengthSq() < 0.01 || Math.abs(normal.y) > Math.abs(normal.x) + Math.abs(normal.z)) return;
      triggerWallBounce(normal.normalize(), threeFromCannon(playerBody.position).addScaledVector(normal.normalize(), 0.52));
    });
    world.addBody(playerBody);

    const playerMaterialMain = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.42, metalness: 0.0 });
    const suitDarkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.0 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.44, metalness: 0.0 });
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
    const playerFaceGroup = new THREE.Group();
    playerFaceGroup.position.z = 0.286;
    playerHead.add(playerFaceGroup);
    playerParts.faceGroup = playerFaceGroup;

    function createPixelFaceTexture(power) {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      const ink = power === "robot" ? "#67e8f9" : "#172033";
      context.clearRect(0, 0, 32, 32);
      const rect = (x, y, width, height, color = ink) => { context.fillStyle = color; context.fillRect(x, y, width, height); };
      PIXEL_FACE_RECTS[power].forEach(([x, y, width, height, color]) => rect(x, y, width, height, color));
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      return texture;
    }

    PLAYER_ICON_POWERS.forEach((power) => {
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(0.43, 0.43),
        new THREE.MeshBasicMaterial({ map: createPixelFaceTexture(power), transparent: true, alphaTest: 0.05, depthWrite: false })
      );
      face.name = `pixel-face-${power}`;
      face.visible = power === "speed";
      playerFaceGroup.add(face);
    });

    function applyPowerFace(parts, power) {
      parts.faceGroup?.children.forEach((face) => { face.visible = face.name === `pixel-face-${power}`; });
    }
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
    const leftFoot = makePart(new THREE.BoxGeometry(0.23, 0.12, 0.36), suitDarkMat, playerParts.leftLeg, new THREE.Vector3(0, -0.74, 0.16));
    const rightFoot = makePart(new THREE.BoxGeometry(0.23, 0.12, 0.36), suitDarkMat, playerParts.rightLeg, new THREE.Vector3(0, -0.74, 0.16));
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
    playerAura.visible = false;
    playerParts.aura = playerAura;
    playerGroup.add(playerAura);
    scene.add(playerGroup);

    function createPlayerTag(username, health = 100, maxHealth = 100, icon = "portrait-speed") {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      sprite.position.y = 2.35;
      sprite.scale.set(3.2, 0.8, 1);
      const tag = { canvas, texture, sprite, username, health, maxHealth, icon, drawn: false };
      updatePlayerTag(tag, username, health, maxHealth, icon);
      return tag;
    }

    function updatePlayerTag(tag, username = tag.username, health = tag.health, maxHealth = tag.maxHealth || 100, icon = tag.icon || "portrait-speed") {
      const nextUsername = username || "Player";
      const nextMaxHealth = Math.max(1, Number(maxHealth) || 100);
      const nextHealth = THREE.MathUtils.clamp(Number(health) || 0, 0, nextMaxHealth);
      const nextIcon = PLAYER_ICON_IDS.includes(icon) ? icon : "portrait-speed";
      if (tag.drawn && tag.username === nextUsername && tag.maxHealth === nextMaxHealth && tag.health === nextHealth && tag.icon === nextIcon) return;
      tag.username = nextUsername;
      tag.maxHealth = nextMaxHealth;
      tag.health = nextHealth;
      tag.icon = nextIcon;
      const healthRatio = tag.health / tag.maxHealth;
      const context = tag.canvas.getContext("2d");
      context.clearRect(0, 0, 512, 128);
      context.fillStyle = "rgba(15,23,42,.86)";
      context.beginPath();
      context.roundRect(18, 10, 476, 94, 18);
      context.fill();
      const iconImage = cachedPlayerIconImage(tag.icon);
      const drawIcon = () => {
        if (tag.icon !== nextIcon || !iconImage.naturalWidth) return;
        context.save();
        context.beginPath();
        context.roundRect(30, 22, 66, 66, 13);
        context.clip();
        context.drawImage(iconImage, 30, 22, 66, 66);
        context.restore();
        tag.texture.needsUpdate = true;
      };
      if (iconImage.complete) drawIcon();
      else iconImage.addEventListener("load", drawIcon, { once: true });
      context.fillStyle = "white";
      context.font = "800 32px system-ui";
      context.textAlign = "center";
      context.fillText(tag.username, 292, 50, 370);
      context.fillStyle = "#334155";
      context.fillRect(116, 68, 350, 18);
      context.fillStyle = healthRatio > 0.55 ? "#22c55e" : healthRatio > 0.25 ? "#facc15" : "#ef4444";
      context.fillRect(116, 68, 350 * healthRatio, 18);
      tag.drawn = true;
      tag.texture.needsUpdate = true;
    }

    const NETWORK_POSE_KEYS = [
      "torso", "chest", "head", "cape", "leftArm", "rightArm", "leftLeg", "rightLeg",
      "leftHand", "rightHand", "leftFoot", "rightFoot", "heldPearl", "strongSword",
      "robotArmorGroup", "leftBlaster", "rightBlaster", "robotShield", "aura"
    ];

    function captureNetworkPose() {
      return NETWORK_POSE_KEYS.map((key) => {
        const part = playerParts[key];
        if (!part) return null;
        return [
          +part.position.x.toFixed(3), +part.position.y.toFixed(3), +part.position.z.toFixed(3),
          +part.rotation.x.toFixed(3), +part.rotation.y.toFixed(3), +part.rotation.z.toFixed(3),
          +part.scale.x.toFixed(3), +part.scale.y.toFixed(3), +part.scale.z.toFixed(3), part.visible ? 1 : 0,
          Number.isFinite(part.material?.opacity) ? +part.material.opacity.toFixed(3) : null,
        ];
      });
    }

    function applyNetworkPose(remote, pose) {
      if (!Array.isArray(pose)) return;
      pose.forEach((values, index) => {
        const part = remote.parts[NETWORK_POSE_KEYS[index]];
        if (!part || !values) return;
        part.position.set(values[0], values[1], values[2]);
        part.rotation.set(values[3], values[4], values[5]);
        part.scale.set(values[6], values[7], values[8]);
        part.visible = Boolean(values[9]);
        if (Number.isFinite(values[10]) && part.material) part.material.opacity = values[10];
      });
      if (remote.parts.robotShield && remote.shieldActive) {
        remote.parts.robotShield.visible = true;
        if (remote.parts.robotShield.material.opacity <= 0.01) remote.parts.robotShield.material.opacity = 0.2;
      }
      if (remote.parts.aura) remote.parts.aura.visible = false;
    }

    function styleRemoteRig(parts, power) {
      const color = POWER_DATA[power]?.color || 0x2563eb;
      parts.torso.material.color.setHex(power === "webs" ? 0xdc2626 : color);
      parts.leftArmMesh.material.color.setHex(power === "webs" ? 0x2563eb : color);
      parts.rightArmMesh.material.color.setHex(power === "webs" ? 0x2563eb : color);
      parts.head.material.color.setHex(power === "robot" ? 0x111827 : 0xe5e7eb);
      parts.leftHand.material.color.setHex(power === "robot" ? 0x334155 : 0xe5e7eb);
      parts.rightHand.material.color.setHex(power === "robot" ? 0x334155 : 0xe5e7eb);
      parts.leftFoot.material.color.setHex(power === "jump" ? 0x38bdf8 : power === "speed" ? 0xffea00 : 0x111827);
      parts.rightFoot.material.color.copy(parts.leftFoot.material.color);
      parts.aura.material.color.setHex(color);
      applyPowerFace(parts, power);
    }

    function createRemotePlayer(id, power = "speed", username = "Player", health = 100, icon = "portrait-speed") {
      const sourceNodes = [];
      playerGroup.traverse((node) => sourceNodes.push(node));
      const group = playerGroup.clone(true);
      const clonedNodes = [];
      group.traverse((node) => {
        clonedNodes.push(node);
        if (node.material) node.material = Array.isArray(node.material) ? node.material.map((material) => material.clone()) : node.material.clone();
      });
      const parts = {};
      Object.entries(playerParts).forEach(([key, part]) => {
        const index = sourceNodes.indexOf(part);
        if (index >= 0) parts[key] = clonedNodes[index];
      });
      group.visible = true;
      group.userData.remoteId = id;
      styleRemoteRig(parts, power);
      const tag = createPlayerTag(username, health, maxPlayerHealth(power), icon);
      group.add(tag.sprite);
      const remoteWebCord = createWebCord();
      scene.add(group);
      const remote = { id, power, username, health, icon, group, parts, tag, webCord: remoteWebCord, webWrap: null, webTrappedUntil: 0, target: new THREE.Vector3(), targetQuaternion: new THREE.Quaternion(), web: null, carryKey: null, flightSprint: false, flightTurbo: false };
      remotePlayers.set(id, remote);
      return remote;
    }

    function removeRemotePlayer(id) {
      const remote = remotePlayers.get(id);
      if (!remote) return;
      const effect = [...defeatEffects.values()].find((entry) => entry.playerId === id);
      if (effect) removeDefeatEffect(effect, false);
      scene.remove(remote.group);
      disposeVisual(remote.webCord?.group);
      disposeVisual(remote.webWrap);
      remote.group.traverse((child) => {
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
        else child.material?.dispose();
      });
      remote.tag?.texture?.dispose();
      remotePlayers.delete(id);
    }

    function seededRandom(seed) {
      let state = (Number(seed) >>> 0) || 0x6d2b79f5;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function cloneDefeatRenderable(source, excludedChild = null) {
      const sourceNodes = [];
      source.traverse((node) => sourceNodes.push(node));
      const clone = source.clone(true);
      const cloneNodes = [];
      clone.traverse((node) => cloneNodes.push(node));
      cloneNodes.forEach((node) => {
        if (!node.material) return;
        node.material = Array.isArray(node.material)
          ? node.material.map((material) => material.clone())
          : node.material.clone();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          material.transparent = true;
          material.userData.defeatOpacity = Number.isFinite(material.opacity) ? material.opacity : 1;
        });
      });
      if (excludedChild) {
        const index = sourceNodes.indexOf(excludedChild);
        if (index >= 0) cloneNodes[index]?.parent?.remove(cloneNodes[index]);
      }
      return clone;
    }

    function defeatPartVisible(part, rig) {
      for (let node = part; node && node !== rig; node = node.parent) {
        if (!node.visible) return false;
      }
      return Boolean(part);
    }

    function createDefeatPart(effect, source, spec, random, excludedChild = null) {
      if (!source || !defeatPartVisible(source, effect.sourceGroup)) return null;
      const mesh = cloneDefeatRenderable(source, excludedChild);
      const position = source.getWorldPosition(new THREE.Vector3());
      const quaternion = source.getWorldQuaternion(new THREE.Quaternion());
      const scale = source.getWorldScale(new THREE.Vector3());
      mesh.position.copy(position);
      mesh.quaternion.copy(quaternion);
      mesh.scale.copy(scale);
      scene.add(mesh);

      const body = new CANNON.Body({ mass: spec.mass || 0.42, material: dummyMaterial });
      body.collisionFilterGroup = 2;
      body.collisionFilterMask = 1;
      body.userData = { type: "defeatPart", defeatId: effect.id };
      if (spec.sphere) body.addShape(new CANNON.Sphere(spec.sphere));
      else body.addShape(new CANNON.Box(new CANNON.Vec3(spec.size[0], spec.size[1], spec.size[2])));
      body.position.set(position.x, position.y, position.z);
      body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      body.linearDamping = 0.055;
      body.angularDamping = 0.08;
      const outward = position.clone().sub(effect.center);
      outward.y *= 0.35;
      if (outward.lengthSq() < 0.01) outward.set(random() - 0.5, 0.2, random() - 0.5);
      outward.normalize();
      const side = new THREE.Vector3(random() - 0.5, random() * 0.45, random() - 0.5).multiplyScalar(2.5);
      body.velocity.set(outward.x * 5.8 + side.x, 5.4 + random() * 3.2 + outward.y * 1.4, outward.z * 5.8 + side.z);
      body.angularVelocity.set((random() - 0.5) * 11, (random() - 0.5) * 11, (random() - 0.5) * 11);
      world.addBody(body);
      const part = { name: spec.name, mesh, body };
      effect.parts.push(part);
      if (spec.name === "head") effect.headPart = part;
      body.addEventListener("collide", () => {
        if (effect.impactPlayed || performance.now() - effect.startedAt < 130) return;
        effect.impactPlayed = true;
        spawnBurst(threeFromCannon(body.position), 0xe5e7eb, 7, 0.28, effect.seed ^ 0x51f15e);
      });
      return part;
    }

    function beginDefeatEffect(packet, offline = false) {
      if (!packet?.defeatId || seenDefeatIds.has(packet.defeatId) || packet.map !== selectedMap) return;
      if (Number(packet.respawnAt) && Number(packet.respawnAt) <= Date.now()) return;
      const isLocal = packet.id === multiplayerClient?.id || (offline && packet.id === "local");
      const remote = isLocal ? null : remotePlayers.get(packet.id);
      const sourceGroup = isLocal ? playerGroup : remote?.group;
      const parts = isLocal ? playerParts : remote?.parts;
      if (!sourceGroup || !parts) return;
      seenDefeatIds.add(packet.defeatId);
      while (seenDefeatIds.size > 128) seenDefeatIds.delete(seenDefeatIds.values().next().value);
      if (Array.isArray(packet.position)) sourceGroup.position.fromArray(packet.position);
      if (Array.isArray(packet.orientation) && packet.orientation.length >= 4) sourceGroup.quaternion.fromArray(packet.orientation);
      sourceGroup.updateWorldMatrix(true, true);
      const origin = new THREE.Vector3().fromArray(packet.position || [sourceGroup.position.x, sourceGroup.position.y, sourceGroup.position.z]);
      const effect = {
        id: packet.defeatId,
        playerId: packet.id,
        map: packet.map,
        power: packet.power,
        seed: Number(packet.seed) >>> 0,
        sourceGroup,
        parts: [],
        headPart: null,
        center: origin.clone().add(new THREE.Vector3(0, 0.82, 0)),
        fallback: origin.clone().add(new THREE.Vector3(0, 0.9, 0)),
        forward: new THREE.Vector3().fromArray(packet.forward || [0, 0, -1]).normalize(),
        startedAt: performance.now(),
        expiresAt: performance.now() + Math.max(1200, Number(packet.respawnAt || Date.now() + 4400) - Date.now()),
        impactPlayed: false,
        isLocal,
        offline,
      };
      const random = seededRandom(effect.seed);
      const specs = [
        ["head", parts.head, { name: "head", sphere: 0.29, mass: 0.48 }],
        ["torso", parts.torso, { name: "torso", size: [0.34, 0.47, 0.25], mass: 0.9 }, parts.cape],
        ["leftArm", parts.leftArmMesh, { name: "leftArm", size: [0.12, 0.34, 0.12] }],
        ["rightArm", parts.rightArmMesh, { name: "rightArm", size: [0.12, 0.34, 0.12] }],
        ["leftHand", parts.leftHand, { name: "leftHand", sphere: 0.12, mass: 0.2 }],
        ["rightHand", parts.rightHand, { name: "rightHand", sphere: 0.12, mass: 0.2 }],
        ["leftLeg", parts.leftLegMesh, { name: "leftLeg", size: [0.14, 0.36, 0.14], mass: 0.55 }],
        ["rightLeg", parts.rightLegMesh, { name: "rightLeg", size: [0.14, 0.36, 0.14], mass: 0.55 }],
        ["leftFoot", parts.leftFoot, { name: "leftFoot", size: [0.13, 0.08, 0.2], mass: 0.24 }],
        ["rightFoot", parts.rightFoot, { name: "rightFoot", size: [0.13, 0.08, 0.2], mass: 0.24 }],
        ["cape", parts.cape, { name: "cape", size: [0.42, 0.54, 0.035], mass: 0.22 }],
        ["armor", parts.robotArmorGroup, { name: "armor", size: [0.48, 0.42, 0.22], mass: 0.65 }],
        ["leftBlaster", parts.leftBlaster, { name: "leftBlaster", size: [0.1, 0.23, 0.1], mass: 0.22 }],
        ["rightBlaster", parts.rightBlaster, { name: "rightBlaster", size: [0.1, 0.23, 0.1], mass: 0.22 }],
      ];
      specs.forEach(([, source, spec, excluded]) => createDefeatPart(effect, source, spec, random, excluded));
      sourceGroup.visible = false;
      defeatEffects.set(effect.id, effect);
      spawnBurst(effect.center, POWER_DATA[packet.power]?.color || 0xffffff, 22, 0.55, effect.seed);
      spawnRing(groundEffectPoint(origin), POWER_DATA[packet.power]?.color || 0xffffff, 0.35, 2.5, 0.42);
      playLocalSfx("playerDefeat");

      if (isLocal) {
        const savedCamera = { firstPersonMode, frontViewMode, shiftLockMode, yaw: cameraYaw, pitch: cameraPitch, distance: cameraDistance };
        localDefeat = { effect, savedCamera, cameraPosition: camera.position.clone(), cameraTarget: effect.center.clone(), shakeUntil: performance.now() + 420 };
        pvpRespawnAt = Number(packet.respawnAt) || Date.now() + 4400;
        firstPersonMode = false;
        frontViewMode = false;
        shiftLockMode = false;
        flightMode = false;
        flyMeterCharge = 0;
        flyMeterGraceUntil = 0;
        flightJumpArmed = false;
        flightSprintActive = false;
        flightTurboActive = false;
        divePending = false;
        robotShieldMode = false;
        releaseActiveInputs();
        clearPlayerWebWrap();
        grabbedById = null;
        grabbedMode = null;
        playerBody.velocity.set(0, 0, 0);
        playerBody.angularVelocity.set(0, 0, 0);
        playerBody.sleep();
        renderShiftLockState();
        showMessage("Defeated — respawning…", 3800);
      }
    }

    function removeDefeatEffect(effect, restoreRig = true) {
      if (!effect || !defeatEffects.has(effect.id)) return;
      effect.parts.forEach(({ mesh, body }) => {
        world.removeBody(body);
        scene.remove(mesh);
        mesh.traverse((node) => {
          if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
          else node.material?.dispose();
        });
      });
      if (restoreRig && effect.sourceGroup) effect.sourceGroup.visible = true;
      defeatEffects.delete(effect.id);
    }

    function completeLocalRespawn(position = null) {
      if (!localDefeat) return;
      const { effect, savedCamera } = localDefeat;
      const returnFrom = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
      removeDefeatEffect(effect, true);
      firstPersonMode = savedCamera.firstPersonMode;
      frontViewMode = savedCamera.frontViewMode;
      shiftLockMode = savedCamera.shiftLockMode;
      cameraYaw = savedCamera.yaw;
      cameraPitch = savedCamera.pitch;
      cameraDistance = savedCamera.distance;
      localDefeat = null;
      pvpRespawnAt = 0;
      cameraReturn = { ...returnFrom, startedAt: performance.now(), endsAt: performance.now() + 720 };
      playerBody.wakeUp();
      if (position) playerBody.position.copy(position);
      renderShiftLockState();
    }

    function updateDefeatEffects(now) {
      for (const effect of defeatEffects.values()) {
        const fade = THREE.MathUtils.clamp((now - (effect.expiresAt - 950)) / 950, 0, 1);
        effect.parts.forEach(({ mesh, body }) => {
          mesh.position.copy(threeFromCannon(body.interpolatedPosition || body.position));
          mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
          if (fade > 0) mesh.traverse((node) => {
            const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
            materials.forEach((material) => { material.opacity = material.userData.defeatOpacity * (1 - fade); });
          });
        });
        if (!effect.isLocal && now >= effect.expiresAt) removeDefeatEffect(effect, false);
      }
      if (localDefeat?.effect.offline && Date.now() >= pvpRespawnAt) {
        const map = MAP_DATA[selectedMap];
        playerHealth = maxPlayerHealth();
        playerBody.position.set(map.spawn.x, map.spawn.y, map.spawn.z);
        playerBody.velocity.set(0, 0, 0);
        completeLocalRespawn();
        showMessage("Respawned", 900);
      }
    }

    function clearAllDefeatEffects() {
      [...defeatEffects.values()].forEach((effect) => removeDefeatEffect(effect, true));
      localDefeat = null;
      pvpRespawnAt = 0;
      cameraReturn = null;
      playerBody.wakeUp();
    }

    function ensureRemotePlayer(player) {
      if (!player?.id || player.id === multiplayerClient?.id || !gameStarted) return null;
      const existing = remotePlayers.get(player.id);
      if (player.map !== selectedMap) {
        if (existing) removeRemotePlayer(player.id);
        return null;
      }
      if (existing?.power === player.power) {
        existing.username = player.username || existing.username;
        existing.icon = player.icon || existing.icon;
        existing.health = Number.isFinite(player.health) ? player.health : existing.health;
        updatePlayerTag(existing.tag, existing.username, existing.health, maxPlayerHealth(existing.power), existing.icon);
        existing.shieldActive = Boolean(player.shieldActive);
        if (existing.parts.robotShield) existing.parts.robotShield.visible = existing.shieldActive;
        if (player.state) applyRemoteState(player.id, player.state);
        return existing;
      }
      if (existing) removeRemotePlayer(player.id);
      const remote = createRemotePlayer(player.id, player.power, player.username, player.health, player.icon);
      remote.shieldActive = Boolean(player.shieldActive);
      if (remote.parts.robotShield) remote.parts.robotShield.visible = remote.shieldActive;
      if (player.state) applyRemoteState(player.id, player.state, true);
      return remote;
    }

    function rememberRoomPlayer(player) {
      if (!player?.id) return;
      const previous = roomPlayers.get(player.id) || {};
      roomPlayers.set(player.id, { ...previous, ...player });
      renderRoomRoster();
      renderPlayerList();
      renderMapPopulation();
    }

    function renderPlayerList() {
      if (!playerListRows) return;
      const entries = onlineMode ? new Map(roomPlayers) : new Map();
      if (!onlineMode || !entries.has(multiplayerClient?.id)) {
        entries.set(multiplayerClient?.id || "local", {
          id: multiplayerClient?.id || "local",
          username: localUsername,
          icon: localPlayerIcon,
          power: selectedPower || menuSelectedPower || "speed",
          map: gameStarted ? selectedMap : "lobby"
        });
      }
      const players = [...entries.values()].sort((a, b) => String(a.username).localeCompare(String(b.username)));
      playerListCount.textContent = String(players.length);
      playerListRows.replaceChildren();
      players.forEach((player) => {
        const row = document.createElement("div");
        row.className = "playerListRow";
        const icon = Object.assign(document.createElement("img"), { src: playerIconArt(player.icon), alt: "" });
        const name = document.createElement("strong");
        name.textContent = `${player.username || "Player"}${player.id === multiplayerClient?.id || (!onlineMode && player.id === "local") ? " (You)" : ""}`;
        const power = document.createElement("span");
        power.textContent = POWER_DATA[player.power]?.name || "Choosing";
        power.title = power.textContent;
        const map = document.createElement("span");
        map.textContent = player.map === "lobby" ? "Lobby" : MAP_DATA[player.map]?.name || "Unknown map";
        map.title = map.textContent;
        row.append(icon, name, power, map);
        playerListRows.appendChild(row);
      });
    }

    function renderRoomRoster() {
      if (!lobbyRoster) return;
      lobbyRoster.replaceChildren();
      const players = [...roomPlayers.values()].sort((a, b) => String(a.username).localeCompare(String(b.username)));
      lobbyPlayerCount.textContent = `${players.length} connected`;
      if (!players.length) {
        const empty = document.createElement("p");
        empty.textContent = "Connect to see who is here.";
        lobbyRoster.appendChild(empty);
        return;
      }
      players.forEach((player) => {
        const button = document.createElement("button");
        button.type = "button";
        const powerNameLabel = POWER_DATA[player.power]?.name || "Choosing a Power Guy";
        const icon = Object.assign(document.createElement("img"), { src: playerIconArt(player.icon), alt: "" });
        icon.className = "rosterIcon";
        const name = document.createElement("strong");
        name.textContent = `${player.username || "Player"}${player.id === multiplayerClient?.id ? " (You)" : ""}`;
        const location = document.createElement("span");
        location.textContent = player.map === "lobby" ? "Lobby" : MAP_DATA[player.map]?.name || "Unknown map";
        button.append(icon, name, location);
        button.addEventListener("click", () => {
          lobbyPlayerDetail.textContent = `${player.username || "Player"} — ${powerNameLabel} — ${player.map === "lobby" ? "Waiting in the lobby" : MAP_DATA[player.map]?.name || "Unknown map"}`;
        });
        lobbyRoster.appendChild(button);
      });
    }

    function renderMapPopulation() {
      const counts = new Map();
      roomPlayers.forEach((player) => {
        if (!MAP_DATA[player.map]) return;
        counts.set(player.map, (counts.get(player.map) || 0) + 1);
      });
      document.querySelectorAll(".mapButton").forEach((button) => {
        button.querySelector(".mapPopulation")?.remove();
        const count = counts.get(button.dataset.map) || 0;
        if (!onlineMode || count <= 0) return;
        const badge = document.createElement("span");
        badge.className = "mapPopulation";
        badge.textContent = `${count} connected`;
        button.insertBefore(badge, button.querySelector(".mapPreviewHost"));
      });
    }

    function setLobbyConnection(connected, text = connected ? "Connected" : "Not connected") {
      lobbyConnection?.classList.toggle("connected", connected);
      lobbyConnectionText.textContent = text;
      continueOnlineButton.disabled = !connected;
      continueOnlineButton.textContent = connected ? "Continue to Power Guy selection" : "Connect to continue";
    }

    function applyRemoteState(id, state, snap = false) {
      if (!state?.position) return;
      const remote = remotePlayers.get(id);
      if (!remote) return;
      remote.target.fromArray(state.position);
      if (Array.isArray(state.quaternion)) remote.targetQuaternion.fromArray(state.quaternion);
      applyNetworkPose(remote, state.pose);
      applyRemoteStrengthCarry(remote, state.strengthCarry);
      remote.web = state.web || null;
      remote.flightSprint = Boolean(state.flightSprint);
      remote.flightTurbo = Boolean(state.flightTurbo);
      if (Number.isFinite(state.health) && state.health !== remote.health) {
        remote.health = state.health;
        updatePlayerTag(remote.tag, remote.username, remote.health);
      }
      if (snap) remote.group.position.copy(remote.target);
      if (snap) remote.group.quaternion.copy(remote.targetQuaternion);
    }

    function handleMultiplayerMessage(event) {
      const packet = event.detail;
      if (packet.type === "welcome") {
        multiplayerHostId = packet.hostId;
        roomPlayers.clear();
        packet.players.forEach((player) => {
          rememberRoomPlayer(player);
          ensureRemotePlayer(player);
        });
        rememberRoomPlayer({ id: packet.id, username: localUsername, icon: localPlayerIcon, power: gameStarted ? selectedPower : "choosing", map: gameStarted ? selectedMap : "lobby", health: playerHealth });
        packet.entities?.filter((entry) => entry.map === selectedMap).forEach((entry) => applyEntitySnapshot(entry.snapshot));
        if (selectedMap === "pvpArena") placeAtPvpSpawn(packet.id);
      }
      if (packet.type === "player-joined" || packet.type === "player-updated") {
        rememberRoomPlayer(packet.player);
        ensureRemotePlayer(packet.player);
      }
      if (packet.type === "player-state") {
        const player = roomPlayers.get(packet.id);
        if (player) {
          const updatedPlayer = { ...player, state: packet.state, health: packet.state.health };
          rememberRoomPlayer(updatedPlayer);
          ensureRemotePlayer(updatedPlayer);
        }
        applyRemoteState(packet.id, packet.state);
      }
      if (packet.type === "player-left") {
        if (grabbedById === packet.id) {
          grabbedById = null;
          grabbedMode = null;
        }
        if (strengthHeldEnemy?.type === "player" && strengthHeldEnemy.id === packet.id) strengthHeldEnemy = null;
        if (telekinesisHeldPlayer?.id === packet.id) telekinesisHeldPlayer = null;
        if (webPullTargetPlayer?.id === packet.id) {
          webPullTargetPlayer = null;
          if (webPullState?.targetPlayer?.id === packet.id) webPullState = null;
        }
        if (webPulledById === packet.id) {
          webPulledById = null;
          webPullEndsAt = 0;
        }
        roomPlayers.delete(packet.id);
        renderRoomRoster();
        renderPlayerList();
        renderMapPopulation();
        removeRemotePlayer(packet.id);
      }
      if (packet.type === "host-changed") multiplayerHostId = packet.hostId;
      if (packet.type === "entities" && packet.map === selectedMap && packet.senderId !== multiplayerClient?.id) applyEntitySnapshot(packet.snapshot);
      if (packet.type === "player-action") renderRemoteAction(packet.id, packet.action);
      if (packet.type === "pvp-hit") withoutNetworkVisualRelay(() => applyPvpHit(packet));
      if (packet.type === "player-defeated") withoutNetworkVisualRelay(() => beginDefeatEffect(packet));
      if (packet.type === "player-respawn") withoutNetworkVisualRelay(() => applyPvpRespawn(packet));
      if (packet.type === "player-grabbed") applyPlayerGrabbed(packet);
      if (packet.type === "player-thrown") withoutNetworkVisualRelay(() => applyPlayerThrown(packet));
      if (packet.type === "player-released") applyPlayerReleased(packet);
      if (packet.type === "shield-state") withoutNetworkVisualRelay(() => applyShieldState(packet));
      if (packet.type === "shield-blocked") withoutNetworkVisualRelay(() => applyShieldBlocked(packet));
      if (packet.type === "ability-cooldown") applyAbilityCooldown(packet);
      if (packet.type === "web-pull-start") withoutNetworkVisualRelay(() => applyWebPullStart(packet));
      if (packet.type === "web-pull-end") applyWebPullEnd(packet);
      if (packet.type === "web-trapped") withoutNetworkVisualRelay(() => applyPlayerWebTrapped(packet));
      if (packet.type === "web-released") applyPlayerWebReleased(packet);
      if (packet.type === "web-escaped") withoutNetworkVisualRelay(() => applyWebEscape(packet));
      if (packet.type === "web-trap-placed") withoutNetworkVisualRelay(() => applyNetworkFloorTrap(packet));
      if (packet.type === "web-trap-removed") removeNetworkFloorTrap(packet.trapId);
      if (packet.type === "flight-strike-started") startFlightStrikeSequence(packet);
      if (packet.type === "flight-strike-impact") beginFlightStrikeDescent(packet);
      if (packet.type === "flight-strike-cancelled") {
        if (packet.id === multiplayerClient?.id) cancelFlightStrike(false);
        else {
          const remote = remotePlayers.get(packet.id);
          if (remote) remote.group.visible = true;
        }
      }
    }

    function placeAtPvpSpawn(id) {
      let hash = 0;
      for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
      const [x, z] = PVP_SPAWN_SLOTS[hash % PVP_SPAWN_SLOTS.length];
      playerBody.position.set(x, 1.2, PVP_CENTER_Z + z);
      playerBody.velocity.set(0, 0, 0);
      playerBody.angularVelocity.set(0, 0, 0);
      playerBody.force.set(0, 0, 0);
      playerBody.wakeUp();
    }

    function updatePvpArenaSafety(now) {
      if (selectedMap !== "pvpArena" || !gameStarted) return;
      if (playerBody.position.y < -5 || Math.abs(playerBody.position.x) > 45 || Math.abs(playerBody.position.z - PVP_CENTER_Z) > 45) {
        placeAtPvpSpawn(multiplayerClient?.id || localUsername);
        showMessage("Returned to a PvP respawn point", 1000);
        return;
      }
      if (now < pvpJumpPadCooldownUntil || playerBody.position.y > 1.15 || playerBody.velocity.y > 2) return;
      const pad = PVP_JUMP_PADS.find(([x, z]) => Math.hypot(playerBody.position.x - x, playerBody.position.z - (PVP_CENTER_Z + z)) <= 2.25);
      if (!pad) return;
      const outward = new THREE.Vector3(pad[0], 0, pad[1]);
      if (outward.lengthSq() < 0.1) outward.set(0, 0, -1);
      outward.normalize();
      playerBody.velocity.x = outward.x * 7;
      playerBody.velocity.y = 18;
      playerBody.velocity.z = outward.z * 7;
      playerBody.wakeUp();
      pvpJumpPadCooldownUntil = now + 900;
      spawnRing(new THREE.Vector3(pad[0], 0.1, PVP_CENTER_Z + pad[1]), 0x38bdf8, 0.5, 2.6, 0.42);
      playSfx("megaLeap");
    }

    function updateStrengthThrownContacts() {
      if (selectedMap !== "pvpArena" || !multiplayerClient?.id || grabbedById || pvpRespawnAt) return;
      const now = performance.now();
      movableBoxes.forEach((box, index) => {
        if (!box.networkThrowAttackerId || box.networkThrowAttackerId === multiplayerClient.id || box.networkContactSent || now > (box.networkThrowExpiresAt || 0)) return;
        const dx = box.body.position.x - playerBody.position.x;
        const dy = box.body.position.y - playerBody.position.y;
        const dz = box.body.position.z - playerBody.position.z;
        if (dx * dx + dz * dz > 1.35 * 1.35 || Math.abs(dy) > 1.45) return;
        box.networkContactSent = true;
        multiplayerClient.sendAction({
          kind: "strength-entity-contact",
          entityType: "box",
          entityId: box.networkThrowId ?? index,
          position: [box.body.position.x, box.body.position.y, box.body.position.z],
        });
      });
    }

    function entityBodyState(body, health = null) {
      return {
        p: [body.position.x, body.position.y, body.position.z],
        q: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
        v: [body.velocity.x, body.velocity.y, body.velocity.z],
        h: health,
      };
    }

    function buildEntitySnapshot() {
      return {
        dummies: dynamicDummies.map((dummy, index) => ({ id: index, ...entityBodyState(dummy.body, dummy.health) })),
        objects: movableBoxes.map((box, index) => ({ id: index, ...entityBodyState(box.body) })),
      };
    }

    function applyBodyState(body, state) {
      if (!body || !state?.p || !state?.q) return;
      body.position.set(...state.p);
      body.quaternion.set(...state.q);
      if (state.v) body.velocity.set(...state.v);
      body.angularVelocity.set(0, 0, 0);
      body.wakeUp();
    }

    function applyEntitySnapshot(snapshot) {
      snapshot?.dummies?.forEach((state) => {
        const dummy = dynamicDummies[state.id];
        if (!dummy || dummy.isHeld) return;
        applyBodyState(dummy.body, state);
        if (Number.isFinite(state.h)) {
          dummy.health = state.h;
          updateDummyHealthBar(dummy);
        }
      });
      snapshot?.objects?.forEach((state) => {
        const box = movableBoxes[state.id];
        if (!box || box.isHeld) return;
        applyBodyState(box.body, state);
      });
    }

    function renderRemoteAction(id, action) {
      const remote = remotePlayers.get(id);
      if (!remote || !action) return;
      if (action.map === selectedMap && (action.kind === "strength-entity-grab" || action.kind === "telekinesis-entity-grab")) {
        const entity = networkStrengthEntity(action.entityType, Number(action.entityId));
        if (entity && entity !== strengthHeldBox && entity !== strengthHeldEnemy?.target) setStrengthEntityHeld(entity, true);
        return;
      }
      if (action.map === selectedMap && (action.kind === "strength-entity-throw" || action.kind === "telekinesis-entity-throw")) {
        const entity = networkStrengthEntity(action.entityType, Number(action.entityId));
        if (!entity || entity === strengthHeldBox || entity === strengthHeldEnemy?.target) return;
        setStrengthEntityHeld(entity, false);
        if (action.position) entity.body.position.set(...action.position);
        if (action.quaternion) entity.body.quaternion.set(...action.quaternion);
        if (action.velocity) entity.body.velocity.set(...action.velocity);
        if (Number.isFinite(action.health) && entity.health !== undefined) {
          entity.health = action.health;
          updateDummyHealthBar(entity);
        }
        const throwPower = action.kind.startsWith("telekinesis") ? "telekinesis" : "strength";
        entity.lastThrownBy = throwPower;
        markStrengthThrownEntity(entity, id, action.entityType, Number(action.entityId), throwPower);
        entity.body.wakeUp();
        return;
      }
      if (action.kind !== "visual-batch" || !Array.isArray(action.events)) return;
      suppressNetworkVisuals = true;
      try {
        action.events.forEach((event) => {
          if (event.type === "sfx") playLocalSfx(event.name);
          if (event.type === "ring") spawnRing(new THREE.Vector3().fromArray(event.p), event.color, event.startScale, event.endScale, event.life);
          if (event.type === "beam") spawnBeam(new THREE.Vector3().fromArray(event.start), new THREE.Vector3().fromArray(event.end), event.color, event.radius, event.life);
          if (event.type === "burst") spawnBurst(new THREE.Vector3().fromArray(event.p), event.color, event.count, event.life, event.seed);
          if (event.type === "web-projectile") spawnNetworkWebProjectile(new THREE.Vector3().fromArray(event.start), new THREE.Vector3().fromArray(event.end), event.duration);
          if (event.type === "floor-web") spawnNetworkFloorWeb(new THREE.Vector3().fromArray(event.p), event.life);
        });
      } finally {
        suppressNetworkVisuals = false;
      }
    }

    function applyPvpHit(packet) {
      const color = POWER_DATA[packet.power]?.color || 0xef4444;
      if (packet.targetId === multiplayerClient?.id) {
        playerHealth = packet.health;
        playerDamageFlash = 0.55;
        playerForcedMotionUntil = Math.max(playerForcedMotionUntil, performance.now() + 220);
        playerBody.velocity.x += packet.impulse[0];
        playerBody.velocity.y += packet.impulse[1];
        playerBody.velocity.z += packet.impulse[2];
        const effectPosition = Array.isArray(packet.position) ? new THREE.Vector3().fromArray(packet.position) : threeFromCannon(playerBody.position);
        spawnRing(groundEffectPoint(effectPosition), color, packet.slam ? 0.45 : 0.35, packet.slam ? 2.7 : 2.2, packet.slam ? 0.42 : 0.35);
        spawnBurst(effectPosition.clone().add(new THREE.Vector3(0, 0.8, 0)), color, packet.slam ? 16 : 10, 0.4);
        playSfx(packet.slam ? "telekinesisThrow" : "playerHit");
        if (packet.slam && !packet.defeated) showMessage(`Telekinetic slam: ${packet.damage} damage`, 850);
        if (packet.defeated) {
          grabbedById = null;
          grabbedMode = null;
          pvpRespawnAt = packet.respawnAt;
          showMessage("Defeated — respawning…", 2400);
        }
      } else {
        if (packet.defeated && strengthHeldEnemy?.type === "player" && strengthHeldEnemy.id === packet.targetId) strengthHeldEnemy = null;
        if (packet.defeated && telekinesisHeldPlayer?.id === packet.targetId) telekinesisHeldPlayer = null;
        const remote = remotePlayers.get(packet.targetId);
        if (remote) {
          remote.health = packet.health;
          updatePlayerTag(remote.tag, remote.username, remote.health);
          const effectPosition = Array.isArray(packet.position) ? new THREE.Vector3().fromArray(packet.position) : remote.group.position.clone();
          spawnBurst(effectPosition.add(new THREE.Vector3(0, 1, 0)), color, packet.slam ? 16 : 12, 0.4);
          if (packet.slam) {
            spawnRing(groundEffectPoint(remote.group.position.clone()), color, 0.45, 2.7, 0.42);
            playSfx("telekinesisThrow");
          }
        }
      }
    }

    function networkTimeToPerformance(serverTimestamp) {
      return performance.now() + Math.max(0, Number(serverTimestamp || 0) - Date.now());
    }

    function applyShieldState(packet) {
      const active = Boolean(packet.active);
      const endsAt = networkTimeToPerformance(packet.endsAt);
      const cooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
      if (packet.id === multiplayerClient?.id) {
        const changed = robotShieldMode !== active;
        robotShieldMode = active;
        robotShieldEndsAt = active ? endsAt : 0;
        robotShieldCooldownUntil = cooldownUntil;
        if (changed) {
          playSfx(active ? "robotShield" : "robotShieldDown");
          spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.robot.color, 0.45, active ? 2.2 : 1.5, 0.36);
          showMessage(active ? "Defense Shield active: 5s" : "Defense Shield cooling down: 5s", 950);
        }
        return;
      }
      const remote = remotePlayers.get(packet.id);
      if (!remote) return;
      remote.shieldActive = active;
      remote.shieldEndsAt = endsAt;
      if (remote.parts.robotShield) {
        remote.parts.robotShield.visible = active;
        remote.parts.robotShield.material.opacity = active ? 0.2 : 0;
      }
      playSfx(active ? "robotShield" : "robotShieldDown");
      spawnRing(groundEffectPoint(remote.group.position.clone()), POWER_DATA.robot.color, 0.45, active ? 2.2 : 1.5, 0.36);
    }

    function applyShieldBlocked(packet) {
      const remote = remotePlayers.get(packet.targetId);
      const position = packet.targetId === multiplayerClient?.id
        ? threeFromCannon(playerBody.position)
        : remote?.group.position.clone() || new THREE.Vector3().fromArray(packet.position || [0, 0, 0]);
      spawnBurst(position.clone().add(new THREE.Vector3(0, 1, 0)), POWER_DATA.robot.color, 14, 0.36);
      spawnRing(groundEffectPoint(position), POWER_DATA.robot.color, 0.5, 2.25, 0.32);
      playSfx("shieldBlock");
      if (packet.targetId === multiplayerClient?.id) {
        playerDamageFlash = 0.18;
        showMessage("Defense Shield blocked the hit", 750);
      }
    }

    function applyAbilityCooldown(packet) {
      const until = networkTimeToPerformance(packet.cooldownUntil);
      if (packet.ability === "robot-shot") robotShotCooldownUntil = Math.max(robotShotCooldownUntil, until);
      if (packet.ability === "robot-shield") {
        robotShieldCooldownUntil = Math.max(robotShieldCooldownUntil, until);
        showMessage(`Defense Shield ready in ${Math.max(0.1, (robotShieldCooldownUntil - performance.now()) / 1000).toFixed(1)}s`, 700);
      }
      if (packet.ability === "telekinesis-grab") telekinesisGrabCooldownUntil = Math.max(telekinesisGrabCooldownUntil, until);
      if (packet.ability === "web-trap") webTrapCooldownUntil = Math.max(webTrapCooldownUntil, until);
      if (packet.ability === "flight-strike") {
        flightStrikeCooldownUntil = Math.max(flightStrikeCooldownUntil, until);
        if (flightStrikeState?.optimistic && flightStrikeState.phase !== "descending") {
          cancelFlightStrike(false);
          showMessage(`Aerial strike ready in ${Math.max(1, Math.ceil((flightStrikeCooldownUntil - performance.now()) / 1000))}s`, 850);
        }
      }
    }

    function applyWebPullStart(packet) {
      const endsAt = networkTimeToPerformance(packet.endsAt);
      if (packet.attackerId === multiplayerClient?.id) {
        const remote = remotePlayers.get(packet.targetId);
        if (remote) {
          webPullTargetPlayer = remote;
          webPullState = { targetPlayer: remote, startedAt: performance.now(), duration: Math.max(1, endsAt - performance.now()) };
          webPullCooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
          webShootPoseUntil = endsAt;
        }
      }
      if (packet.targetId === multiplayerClient?.id) {
        webPulledById = packet.attackerId;
        webPullEndsAt = endsAt;
        keys.clear();
        playSfx("webPull");
        showMessage("Caught by a web pull!", 850);
      }
    }

    function applyWebPullEnd(packet) {
      if (packet.attackerId === multiplayerClient?.id && webPullTargetPlayer?.id === packet.targetId) {
        webPullTargetPlayer = null;
        if (webPullState?.targetPlayer) webPullState = null;
        if (webCord) webCord.group.visible = false;
      }
      if (packet.targetId === multiplayerClient?.id) {
        webPulledById = null;
        webPullEndsAt = 0;
      }
    }

    function clearPlayerWebWrap() {
      disposeVisual(playerWebWrap);
      playerWebWrap = null;
      playerWebTrapAnchor = null;
      playerWebTrappedUntil = 0;
    }

    function applyPlayerWebTrapped(packet) {
      const endsAt = networkTimeToPerformance(packet.endsAt);
      if (packet.targetId === multiplayerClient?.id) {
        webPulledById = null;
        webPullEndsAt = 0;
        playerWebTrappedUntil = endsAt;
        playerWebTrapAnchor = new THREE.Vector3().fromArray(packet.anchor || [playerBody.position.x, playerBody.position.y, playerBody.position.z]);
        if (!playerWebWrap) playerWebWrap = createWebWrap();
        playSfx("webTrap");
        showMessage("Webbed in place!", 950);
      }
      const remote = remotePlayers.get(packet.targetId);
      if (remote) {
        remote.webTrappedUntil = endsAt;
        if (!remote.webWrap) remote.webWrap = createWebWrap();
        remote.webWrap.position.copy(remote.group.position).add(new THREE.Vector3(0, 0.08, 0));
      }
    }

    function applyPlayerWebReleased(packet) {
      if (packet.targetId === multiplayerClient?.id) clearPlayerWebWrap();
      const remote = remotePlayers.get(packet.targetId);
      if (remote) {
        disposeVisual(remote.webWrap);
        remote.webWrap = null;
        remote.webTrappedUntil = 0;
      }
    }

    function applyWebEscape(packet) {
      const isLocalEscape = packet.id === multiplayerClient?.id || packet.id === "local";
      const remote = remotePlayers.get(packet.id);
      const position = isLocalEscape
        ? threeFromCannon(playerBody.position)
        : remote?.group.position.clone() || new THREE.Vector3().fromArray(packet.position || [0, 0, 0]);
      if (isLocalEscape) {
        clearPlayerWebWrap();
        if (packet.method === "teleport" && Array.isArray(packet.position)) {
          playerBody.position.set(packet.position[0], packet.position[1], packet.position[2]);
          playerBody.velocity.set(0, 0, 0);
          playerBody.wakeUp();
        }
        if (Number.isFinite(packet.pearls)) speedPearlCount = packet.pearls;
        teleportMovePoseUntil = performance.now() + 420;
        pearlThrowPoseUntil = packet.method === "pearl" ? performance.now() + 420 : pearlThrowPoseUntil;
        renderHotbar();
        showMessage(packet.method === "pearl" ? "Pearl escape!" : "Teleported out of the web!", 900);
      } else if (remote) {
        disposeVisual(remote.webWrap);
        remote.webWrap = null;
        remote.webTrappedUntil = 0;
      }
      spawnRing(groundEffectPoint(position), packet.method === "pearl" ? 0xff4fb8 : POWER_DATA.teleport.color, 0.38, 2.15, 0.34);
      spawnBurst(position.clone().add(new THREE.Vector3(0, 0.7, 0)), packet.method === "pearl" ? 0xff4fb8 : POWER_DATA.teleport.color, 14, 0.4);
      playLocalSfx(packet.method === "pearl" ? "pearlTeleport" : "teleport");
    }

    function applyNetworkFloorTrap(packet) {
      if (!Array.isArray(packet.point) || networkFloorWebs.has(packet.trapId)) return;
      const point = new THREE.Vector3().fromArray(packet.point);
      const net = createWebNet(2.35);
      net.rotation.x = -Math.PI / 2;
      net.position.copy(point).add(new THREE.Vector3(0, 0.055, 0));
      scene.add(net);
      const trap = { net, point, radius: 2.15, expiresAt: networkTimeToPerformance(packet.expiresAt), trapId: packet.trapId, serverManaged: true };
      activeFloorWebs.push(trap);
      networkFloorWebs.set(packet.trapId, trap);
      if (packet.attackerId === multiplayerClient?.id) webTrapCooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
      playSfx("webFloorTrap");
      spawnRing(point.clone().add(new THREE.Vector3(0, 0.08, 0)), 0xffffff, 0.45, 2.2, 0.35);
    }

    function removeNetworkFloorTrap(trapId) {
      const trap = networkFloorWebs.get(trapId);
      if (!trap) return;
      const index = activeFloorWebs.indexOf(trap);
      if (index >= 0) activeFloorWebs.splice(index, 1);
      disposeVisual(trap.net);
      networkFloorWebs.delete(trapId);
    }

    function applyPvpRespawn(packet) {
      if (packet.id === multiplayerClient?.id) {
        grabbedById = null;
        grabbedMode = null;
        playerForcedMotionUntil = 0;
        playerTumbleUntil = 0;
        playerHealth = Number.isFinite(packet.health) ? packet.health : maxPlayerHealth();
        placeAtPvpSpawn(packet.id);
        completeLocalRespawn();
        showMessage("Respawned", 900);
      } else {
        const remote = remotePlayers.get(packet.id);
        const effect = [...defeatEffects.values()].find((entry) => entry.playerId === packet.id);
        if (effect) removeDefeatEffect(effect, true);
        if (remote) {
          remote.group.visible = true;
          remote.health = Number.isFinite(packet.health) ? packet.health : maxPlayerHealth(remote.power);
          updatePlayerTag(remote.tag, remote.username, remote.health);
        }
      }
    }

    function applyPlayerGrabbed(packet) {
      const targetPlayer = roomPlayers.get(packet.targetId);
      if (targetPlayer) rememberRoomPlayer({ ...targetPlayer, grabbedBy: packet.attackerId, grabbedMode: packet.mode });
      if (packet.attackerId === multiplayerClient?.id) {
        if (packet.mode === "telekinesis" && packet.cooldownUntil) telekinesisGrabCooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
        const remote = remotePlayers.get(packet.targetId);
        if (packet.mode === "telekinesis") {
          telekinesisHeldPlayer = remote;
          if (remote) telekinesisHoldDistance = THREE.MathUtils.clamp(camera.position.distanceTo(remote.group.position), 2.2, 32);
          playSfx("telekinesisHold");
          showMessage("Telekinetic hold — release click to throw", 1300);
        } else {
          if (remote) strengthHeldEnemy = { type: "player", target: remote, id: packet.targetId };
          strengthThrowPoseUntil = 0;
          playSfx("boxGrab");
          showMessage("Player grabbed — press E to throw", 1300);
        }
      }
      if (packet.targetId === multiplayerClient?.id) {
        grabbedById = packet.attackerId;
        grabbedMode = packet.mode || "strength";
        keys.clear();
        isPointerDown = false;
        playerBody.velocity.set(0, 0, 0);
        playerBody.angularVelocity.set(0, 0, 0);
        showMessage("You were grabbed!", 1100);
      }
    }

    function applyPlayerThrown(packet) {
      const targetPlayer = roomPlayers.get(packet.targetId);
      if (targetPlayer) rememberRoomPlayer({ ...targetPlayer, grabbedBy: null, health: packet.health });
      if (packet.attackerId === multiplayerClient?.id) {
        if (packet.mode === "telekinesis") telekinesisHeldPlayer = null;
        else {
          if (strengthHeldEnemy?.type === "player" && strengthHeldEnemy.id === packet.targetId) strengthHeldEnemy = null;
          strengthThrowPoseUntil = performance.now() + 520;
        }
      }
      if (packet.targetId === multiplayerClient?.id) {
        grabbedById = null;
        grabbedMode = null;
        playerHealth = packet.health;
        playerDamageFlash = 0.7;
        playerForcedMotionUntil = performance.now() + 800;
        playerTumbleUntil = performance.now() + 900;
        playerBody.velocity.set(...packet.impulse);
        playerBody.wakeUp();
        spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.strength.color, 0.4, 2.5, 0.42);
        playSfx("playerHit");
        if (packet.defeated) {
          pvpRespawnAt = packet.respawnAt;
          showMessage("Thrown out — respawning…", 2200);
        } else {
          showMessage(`Thrown for ${packet.damage} damage`, 1000);
        }
      } else {
        const remote = remotePlayers.get(packet.targetId);
        if (remote) {
          remote.health = packet.health;
          updatePlayerTag(remote.tag, remote.username, remote.health);
          spawnBurst(remote.group.position.clone().add(new THREE.Vector3(0, 1, 0)), POWER_DATA.strength.color, 15, 0.45);
        }
      }
    }

    function applyPlayerReleased(packet) {
      const targetPlayer = roomPlayers.get(packet.targetId);
      if (targetPlayer) rememberRoomPlayer({ ...targetPlayer, grabbedBy: null });
      if (packet.targetId === multiplayerClient?.id) {
        grabbedById = null;
        grabbedMode = null;
      }
      if (packet.attackerId === multiplayerClient?.id && strengthHeldEnemy?.type === "player" && strengthHeldEnemy.id === packet.targetId) strengthHeldEnemy = null;
      if (packet.attackerId === multiplayerClient?.id && telekinesisHeldPlayer?.id === packet.targetId) telekinesisHeldPlayer = null;
    }

    async function connectToMultiplayer(lobbyOnly = false) {
      if (!onlineMode) return false;
      const roomCode = normalizeRoomCode(roomCodeInput.value) || createRoomCode();
      roomCodeInput.value = roomCode;
      rememberRoomCode(roomCode);
      const targetMap = lobbyOnly || !gameStarted ? "lobby" : selectedMap;
      const targetPower = targetMap === "lobby" ? "choosing" : selectedPower || menuSelectedPower || "speed";
      if (multiplayerClient?.roomCode === roomCode && multiplayerClient.socket?.readyState === WebSocket.OPEN) {
        multiplayerClient.send({ type: "hello", power: targetPower, map: targetMap, username: localUsername, icon: localPlayerIcon });
        rememberRoomPlayer({ id: multiplayerClient.id, username: localUsername, icon: localPlayerIcon, power: targetPower, map: targetMap, health: playerHealth });
        setLobbyConnection(true, `Connected to ${roomCode}`);
        return true;
      }
      remotePlayers.forEach((remote) => removeRemotePlayer(remote.id));
      multiplayerClient?.disconnect();
      multiplayerClient = new MultiplayerClient();
      multiplayerClient.addEventListener("message", handleMultiplayerMessage);
      multiplayerClient.addEventListener("status", (event) => {
        if (!event.detail.connected) {
          multiplayerStatus.hidden = true;
          setLobbyConnection(false, event.detail.reason || "Disconnected");
          if (gameStarted && event.detail.reason !== "Leaving room") showMessage("Multiplayer disconnected. Solo play is still active.", 2600);
        }
      });
      try {
        setLobbyConnection(false, `Connecting to ${roomCode}…`);
        await multiplayerClient.connect(roomCode, { power: targetPower, map: targetMap, username: localUsername, icon: localPlayerIcon });
        multiplayerStatus.hidden = false;
        activeRoomCode.textContent = roomCode;
        rememberRoomPlayer({ id: multiplayerClient.id, username: localUsername, icon: localPlayerIcon, power: targetPower, map: targetMap, health: playerHealth });
        setLobbyConnection(true, `Connected to ${roomCode}`);
        if (gameStarted) showMessage(`Online room ${roomCode}. Share this code with friends.`, 3400);
        return true;
      } catch (error) {
        multiplayerStatus.hidden = true;
        setLobbyConnection(false, error.message);
        if (gameStarted) showMessage(`${error.message} Continuing in solo mode.`, 3200);
        return false;
      }
    }

    function currentWebNetworkState() {
      if (!webCord?.group.visible) return null;
      const start = webHandPosition();
      let end = null;
      let sag = 0.05;
      if (webSwingActive) end = webSwingAnchor.clone();
      else if (webPullState) {
        const position = webPullState.target?.body
          ? threeFromCannon(webPullState.target.body.position)
          : webPullState.targetPlayer?.group?.position?.clone() || null;
        if (position) end = position.add(new THREE.Vector3(0, 0.72, 0));
      } else if (webZipState?.point) {
        end = webZipState.point.clone();
        sag = 0.035;
      }
      return end ? { start: start.toArray(), end: end.toArray(), sag } : null;
    }

    function networkStrengthEntity(type, id) {
      if (type === "box") return movableBoxes[id] || null;
      if (type === "dummy") return dynamicDummies[id] || null;
      return null;
    }

    function currentStrengthCarryNetworkState() {
      const entity = strengthHeldBox || (strengthHeldEnemy?.type === "dummy" ? strengthHeldEnemy.target : null) || heldObject;
      if (!entity) return null;
      const type = movableBoxes.includes(entity) ? "box" : "dummy";
      const id = type === "box" ? movableBoxes.indexOf(entity) : dynamicDummies.indexOf(entity);
      return {
        type,
        id,
        position: [entity.body.position.x, entity.body.position.y, entity.body.position.z],
        quaternion: [entity.body.quaternion.x, entity.body.quaternion.y, entity.body.quaternion.z, entity.body.quaternion.w],
      };
    }

    function currentTelekinesisNetworkPoint() {
      if (!telekinesisHeldPlayer) return null;
      raycaster.setFromCamera(mouseNdc, camera);
      return raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, telekinesisHoldDistance).toArray();
    }

    function applyRemoteStrengthCarry(remote, carry) {
      const nextKey = carry ? `${carry.type}:${carry.id}` : null;
      if (remote.carryKey && remote.carryKey !== nextKey) {
        const [oldType, oldId] = remote.carryKey.split(":");
        const oldEntity = networkStrengthEntity(oldType, Number(oldId));
        if (oldEntity?.isHeld && oldEntity !== strengthHeldBox && oldEntity !== strengthHeldEnemy?.target) setStrengthEntityHeld(oldEntity, false);
      }
      remote.carryKey = nextKey;
      if (!carry?.position || !carry?.quaternion) return;
      const entity = networkStrengthEntity(carry.type, Number(carry.id));
      if (!entity || entity === strengthHeldBox || entity === strengthHeldEnemy?.target) return;
      if (!entity.isHeld) setStrengthEntityHeld(entity, true);
      entity.body.position.set(...carry.position);
      entity.body.quaternion.set(...carry.quaternion);
      entity.body.velocity.set(0, 0, 0);
      entity.body.angularVelocity.set(0, 0, 0);
      entity.body.previousPosition.copy(entity.body.position);
      entity.body.interpolatedPosition.copy(entity.body.position);
      entity.body.previousQuaternion.copy(entity.body.quaternion);
      entity.body.interpolatedQuaternion.copy(entity.body.quaternion);
      entity.body.aabbNeedsUpdate = true;
    }

    function updateMultiplayer(now, delta) {
      for (const remote of remotePlayers.values()) {
        remote.group.position.lerp(remote.target, Math.min(1, delta * 13));
        remote.group.quaternion.slerp(remote.targetQuaternion, Math.min(1, delta * 13));
        if (remote.web) updateSpecificWebCord(remote.webCord, new THREE.Vector3().fromArray(remote.web.start), new THREE.Vector3().fromArray(remote.web.end), true, remote.web.sag);
        else if (remote.webCord) remote.webCord.group.visible = false;
      }
      if (!multiplayerClient?.id || now < multiplayerSendAt) return;
      multiplayerSendAt = now + 66;
      const forward = getCameraForward(true);
      multiplayerClient.sendState({
        position: [playerGroup.position.x, playerGroup.position.y, playerGroup.position.z],
        forward: [forward.x, forward.y, forward.z],
        quaternion: playerGroup.quaternion.toArray(),
        pose: captureNetworkPose(),
        web: currentWebNetworkState(),
        strengthCarry: currentStrengthCarryNetworkState(),
        telekinesisPoint: currentTelekinesisNetworkPoint(),
        flightSprint: flightSprintActive,
        flightTurbo: flightTurboActive,
        flyCharge: +flyMeterCharge.toFixed(3),
      });
      if (pendingNetworkVisuals.length) multiplayerClient.sendAction({ kind: "visual-batch", events: pendingNetworkVisuals.splice(0, 96) });
      if (multiplayerClient.id === multiplayerHostId && now >= entitySendAt) {
        entitySendAt = now + 100;
        multiplayerClient.sendEntities(selectedMap, buildEntitySnapshot());
      }
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
      queueNetworkVisual({ type: "ring", p: position.toArray(), color, startScale, endScale, life });
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
      queueNetworkVisual({ type: "beam", start: start.toArray(), end: end.toArray(), color, radius, life });
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
      updateSpecificWebCord(webCord, start, end, visible, sag);
    }

    function updateSpecificWebCord(cord, start, end, visible = true, sag = 0.08) {
      if (!cord) return;
      cord.group.visible = visible;
      if (!visible) return;
      const coreDirection = end.clone().sub(start);
      const coreLength = Math.max(0.01, coreDirection.length());
      cord.core.position.copy(start).addScaledVector(coreDirection, 0.5);
      cord.core.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), coreDirection.normalize());
      cord.core.scale.set(1, coreLength, 1);
      const cameraSide = getCameraRight().multiplyScalar(0.018);
      cord.lines.forEach((line, lineIndex) => {
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

    function spawnNetworkWebProjectile(start, end, duration = 500) {
      const net = createWebNet(0.48);
      net.position.copy(start);
      scene.add(net);
      networkVisualAnimations.push({ root: net, start: start.clone(), end: end.clone(), startedAt: performance.now(), duration });
    }

    function spawnNetworkFloorWeb(point, life = 15) {
      const net = createWebNet(2.35);
      net.rotation.x = -Math.PI / 2;
      net.position.copy(point).add(new THREE.Vector3(0, 0.055, 0));
      scene.add(net);
      window.setTimeout(() => disposeVisual(net), life * 1000);
    }

    function updateNetworkVisualAnimations(now) {
      for (let index = networkVisualAnimations.length - 1; index >= 0; index -= 1) {
        const animation = networkVisualAnimations[index];
        const t = THREE.MathUtils.clamp((now - animation.startedAt) / animation.duration, 0, 1);
        animation.root.position.copy(animation.start).lerp(animation.end, t);
        animation.root.rotation.z += 0.12;
        animation.root.scale.setScalar(THREE.MathUtils.lerp(1, 1.45, t));
        if (t < 1) continue;
        disposeVisual(animation.root);
        networkVisualAnimations.splice(index, 1);
      }
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

    function spawnBurst(position, color, count = 14, life = 0.62, seed = null) {
      const burstSeed = seed ?? (++burstSeedCounter >>> 0);
      queueNetworkVisual({ type: "burst", p: position.toArray(), color, count, life, seed: burstSeed });
      let randomState = burstSeed >>> 0;
      const seededRandom = () => {
        randomState = (randomState * 1664525 + 1013904223) >>> 0;
        return randomState / 4294967296;
      };
      for (let i = 0; i < count; i += 1) {
        const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), effectMaterial(color, 0.9));
        spark.position.copy(position);
        const angle = (i / count) * Math.PI * 2;
        const lift = 0.25 + seededRandom() * 0.9;
        const velocity = new THREE.Vector3(Math.cos(angle), lift, Math.sin(angle)).normalize().multiplyScalar(3 + seededRandom() * 3.4);
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
      if (!gameStarted || amount <= 0 || localDefeat) return;
      if (selectedPower === "robot" && robotShieldMode) {
        playerDamageFlash = 0.18;
        spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.robot.color, 0.45, 1.9, 0.28);
        playSfx("shieldBlock");
        showMessage("Defense Shield blocked the hit", 650);
        return;
      }
      playerHealth = Math.max(0, playerHealth - amount);
      if (selectedPower === "flight") {
        flyMeterCharge *= 0.55;
        flightJumpArmed = false;
      }
      playerDamageFlash = 0.45;
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), 0xef4444, 0.35, 1.45, 0.24);
      playSfx("playerHit");
      if (playerHealth <= 0) {
        cancelFlightStrike(true);
        const direction = sourcePosition
          ? threeFromCannon(playerBody.position).sub(sourcePosition).setY(0).normalize()
          : getCameraForward(true).multiplyScalar(-1);
        const respawnAt = Date.now() + 4400;
        soloDefeatSequence += 1;
        beginDefeatEffect({
          type: "player-defeated",
          defeatId: `solo:${soloDefeatSequence}`,
          id: "local",
          attackerId: null,
          map: selectedMap,
          position: [playerGroup.position.x, playerGroup.position.y, playerGroup.position.z],
          orientation: playerGroup.quaternion.toArray(),
          forward: direction.toArray(),
          power: selectedPower,
          seed: (0x9e3779b9 ^ soloDefeatSequence) >>> 0,
          respawnAt,
        }, true);
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
      const now = performance.now();
      if (now < webSwingCooldownUntil) {
        showMessage(`Web Line ready in ${((webSwingCooldownUntil - now) / 1000).toFixed(1)}s`, 550);
        return false;
      }
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
      webSwingRopeLength = Math.max(6.2, playerPos.distanceTo(webSwingAnchor));
      webSwingStartedAt = now;
      webSwingCooldownUntil = now + 1000;
      webSwingActive = true;
      webWallWalkActive = false;
      webPullState = null;
      webZipState = null;
      webWallLastContactAt = 0;
      playerBody.wakeUp();
      playSfx("webSwingShoot");
      showMessage("Web Line attached — momentum carries the swing", 900);
      return true;
    }

    function endSpiderSwing(playRelease = true) {
      if (!webSwingActive) return;
      webSwingActive = false;
      const horizontalSpeed = Math.hypot(playerBody.velocity.x, playerBody.velocity.z);
      if (playRelease && horizontalSpeed > 0.2) playerBody.wakeUp();
      webSwingMomentumUntil = performance.now() + (playRelease ? 900 : 420);
      updateWebCord(new THREE.Vector3(), new THREE.Vector3(), false);
      if (playRelease) playSfx("webSwingRelease");
    }

    function spiderGroundPunch() {
      const now = performance.now();
      if (now < webPunchCooldownUntil) {
        playSfx("cooldownDeny");
        showMessage(`Web punch ready in ${((webPunchCooldownUntil - now) / 1000).toFixed(1)}s`, 550);
        return;
      }
      webPunchCooldownUntil = now + 650;
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
      queueNetworkVisual({ type: "floor-web", p: point.toArray(), life: 15 });
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
      webTrapCooldownUntil = now + 5000;
      webShootPoseUntil = now + 560;
      const projectile = createWebNet(0.48);
      projectile.position.copy(webHandPosition());
      scene.add(projectile);
      raycaster.setFromCamera(mouseNdc, camera);
      const direction = raycaster.ray.direction.clone().normalize();
      const destination = projectile.position.clone().addScaledVector(direction, 44);
      activeWebProjectiles.push({
        mode: "trap",
        net: projectile,
        start: projectile.position.clone(),
        position: projectile.position.clone(),
        direction,
        speed: 38,
        maxRange: 44,
        startedAt: now,
        nextTrailAt: 0
      });
      queueNetworkVisual({ type: "web-projectile", start: projectile.position.toArray(), end: destination.toArray(), duration: 1158 });
      playSfx("webTrap");
      showMessage("Spider net fired", 650);
    }

    function beginSpiderPullOrZip() {
      if (selectedPower !== "webs") return;
      const now = performance.now();
      if (now < webPullCooldownUntil || webSwingActive) return;
      const zipHit = centerRaycast(52);
      const zipType = zipHit?.target?.userData?.type;
      if (["obstacle", "movableBox", "roof"].includes(zipType)) {
        const normal = new THREE.Vector3(0, 1, 0);
        if (zipHit.face) normal.copy(zipHit.face.normal).transformDirection(zipHit.object.matrixWorld);
        const destination = clampPointToMap(zipHit.point.clone().addScaledVector(normal, 0.72));
        destination.y = Math.max(MAP_DATA[selectedMap].minY ?? 0.74, destination.y);
        const start = threeFromCannon(playerBody.position);
        webPullCooldownUntil = now + 1000;
        webZipState = { start, point: zipHit.point.clone(), destination, startedAt: now, duration: THREE.MathUtils.clamp(start.distanceTo(destination) * 34, 480, 1250) };
        webPullState = null;
        webShootPoseUntil = now + webZipState.duration;
        playerBody.velocity.set(0, 0, 0);
        playerBody.wakeUp();
        playSfx("webZip");
        showMessage("Web Zip", 700);
        return;
      }
      webPullCooldownUntil = now + 1000;
      webShootPoseUntil = now + 900;
      const projectile = createWebNet(0.32);
      projectile.position.copy(webHandPosition());
      scene.add(projectile);
      raycaster.setFromCamera(mouseNdc, camera);
      const direction = raycaster.ray.direction.clone().normalize();
      const destination = projectile.position.clone().addScaledVector(direction, 52);
      activeWebProjectiles.push({ mode: "pull", net: projectile, start: projectile.position.clone(), position: projectile.position.clone(), direction, speed: 48, maxRange: 52, startedAt: now, nextTrailAt: 0 });
      queueNetworkVisual({ type: "web-projectile", start: projectile.position.toArray(), end: destination.toArray(), duration: 1083 });
      playSfx("webSwingShoot");
      showMessage("Web line fired", 650);
    }

    function resetSpiderWebState(clearTraps = true) {
      if (webPullTargetPlayer) multiplayerClient?.sendAction({ kind: "web-pull-release", targetId: webPullTargetPlayer.id });
      endSpiderSwing(false);
      webPullState = null;
      webPullTargetPlayer = null;
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
      webPulledById = null;
      webPullEndsAt = 0;
      clearPlayerWebWrap();
      if (webCord) webCord.group.visible = false;
      activeWebProjectiles.splice(0).forEach((projectile) => disposeVisual(projectile.net));
      dynamicDummies.forEach((dummy) => {
        if (dummy.webWrap) disposeVisual(dummy.webWrap);
        dummy.webWrap = null;
        dummy.webTrappedUntil = 0;
        dummy.webTrapAnchor = null;
      });
      if (clearTraps) {
        activeFloorWebs.splice(0).forEach((trap) => disposeVisual(trap.net));
        networkFloorWebs.clear();
      }
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
        const stretch = Math.max(0, distance - webSwingRopeLength);
        playerBody.force.x += -radial.x * stretch * playerBody.mass * 92;
        playerBody.force.y += -radial.y * stretch * playerBody.mass * 92;
        playerBody.force.z += -radial.z * stretch * playerBody.mass * 92;
        const velocity = new THREE.Vector3(playerBody.velocity.x, playerBody.velocity.y, playerBody.velocity.z);
        const speed = velocity.length();
        if (speed > 4) {
          const tangent = velocity.sub(radial.clone().multiplyScalar(velocity.dot(radial)));
          if (tangent.lengthSq() > 0.01) {
            tangent.normalize().multiplyScalar(playerBody.mass * Math.min(1.8, (speed - 4) * 0.055));
            playerBody.force.x += tangent.x;
            playerBody.force.y += tangent.y;
            playerBody.force.z += tangent.z;
          }
        }
        if (distance > webSwingRopeLength * 1.035) {
          const outwardSpeed = playerBody.velocity.x * radial.x + playerBody.velocity.y * radial.y + playerBody.velocity.z * radial.z;
          if (outwardSpeed > 0) {
            playerBody.velocity.x -= radial.x * outwardSpeed * 0.22;
            playerBody.velocity.y -= radial.y * outwardSpeed * 0.22;
            playerBody.velocity.z -= radial.z * outwardSpeed * 0.22;
          }
        }
        playerBody.velocity.y = Math.min(playerBody.velocity.y, 22);
        updateWebCord(webHandPosition(), webSwingAnchor, true, 0.045);
      }

      if (selectedPower === "webs" && webPullState) {
        const pull = webPullState;
        if (pull.targetPlayer) {
          const remote = remotePlayers.get(pull.targetPlayer.id);
          if (!remote || remote.health <= 0) {
            webPullState = null;
            webPullTargetPlayer = null;
            updateWebCord(new THREE.Vector3(), new THREE.Vector3(), false);
          } else {
            updateWebCord(webHandPosition(), remote.group.position.clone().add(new THREE.Vector3(0, 0.82, 0)), true, 0.08);
          }
        } else if (!dynamicDummies.includes(pull.target) || pull.target.isDefeated) {
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
        const previous = projectile.position.clone();
        const traveledBefore = previous.distanceTo(projectile.start);
        const stepDistance = Math.min(projectile.speed * delta, projectile.maxRange - traveledBefore);
        const next = previous.clone().addScaledVector(projectile.direction, Math.max(0, stepDistance));
        const segmentLength = previous.distanceTo(next);
        let closest = null;

        if (segmentLength > 0.001) {
          raycaster.set(previous, projectile.direction);
          raycaster.far = segmentLength;
          const worldHit = raycaster.intersectObjects(raycastTargets, true)
            .map((item) => ({ ...item, target: resolveTarget(item.object) }))
            .find((item) => item.target?.visible !== false);
          if (worldHit) closest = { distance: worldHit.distance, point: worldHit.point.clone(), object: worldHit.target, face: worldHit.face };

          if (selectedMap === "pvpArena") {
            remotePlayers.forEach((remote) => {
              if (remote.health <= 0 || !remote.group.visible) return;
              const center = remote.group.position.clone().add(new THREE.Vector3(0, 0.82, 0));
              const offset = center.sub(previous);
              const along = THREE.MathUtils.clamp(offset.dot(projectile.direction), 0, segmentLength);
              const miss = offset.addScaledVector(projectile.direction, -along).length();
              if (miss > 0.78 || (closest && along >= closest.distance)) return;
              closest = { distance: along, point: previous.clone().addScaledVector(projectile.direction, along), remote };
            });
          }
        }

        projectile.position.copy(closest?.point || next);
        projectile.net.position.copy(projectile.position);
        projectile.net.quaternion.copy(camera.quaternion);
        projectile.net.scale.setScalar(projectile.mode === "trap" ? 1.05 : 0.72);
        if (now >= projectile.nextTrailAt) {
          spawnBeam(previous, projectile.position, 0xf8fafc, 0.012, 0.09);
          projectile.nextTrailAt = now + 70;
        }

        const finished = Boolean(closest) || projectile.position.distanceTo(projectile.start) >= projectile.maxRange - 0.01;
        if (!finished) continue;
        const flightMs = now - projectile.startedAt;
        if (closest?.remote) {
          multiplayerClient?.sendAction({
            kind: projectile.mode === "trap" ? "web-trap-player" : "web-pull-player",
            targetId: closest.remote.id,
            origin: projectile.start.toArray(),
            direction: projectile.direction.toArray(),
            hitPoint: closest.point.toArray(),
            flightMs,
          });
        } else if (closest?.object?.userData.type === "dummy") {
          const dummy = closest.object.userData.dummy;
          if (projectile.mode === "trap") trapDummyWithWeb(dummy, 3200, true);
          else if (dummy && !dummy.isDefeated) {
            dummy.webTrappedUntil = 0;
            if (dummy.webWrap) disposeVisual(dummy.webWrap);
            dummy.webWrap = null;
            webPullState = { target: dummy, start: threeFromCannon(dummy.body.position), startedAt: now, duration: THREE.MathUtils.clamp(threeFromCannon(dummy.body.position).distanceTo(playerPos) * 34, 520, 1150) };
            playSfx("webPull");
          }
        } else if (closest?.object) {
          const type = closest.object.userData.type;
          if (projectile.mode === "trap" && ["floor", "obstacle", "track-mark"].includes(type)) {
            if (onlineMode && multiplayerClient?.id) multiplayerClient.sendAction({ kind: "web-trap-place", point: closest.point.toArray() });
            else placeFloorWeb(closest.point);
          } else if (projectile.mode === "pull" && ["obstacle", "movableBox", "roof"].includes(type)) {
            const normal = new THREE.Vector3(0, 1, 0);
            if (closest.face) normal.copy(closest.face.normal).transformDirection(closest.object.matrixWorld);
            const destination = clampPointToMap(closest.point.clone().addScaledVector(normal, 0.72));
            destination.y = Math.max(MAP_DATA[selectedMap].minY ?? 0.74, destination.y);
            const start = threeFromCannon(playerBody.position);
            webZipState = { start, point: closest.point.clone(), destination, startedAt: now, duration: THREE.MathUtils.clamp(start.distanceTo(destination) * 34, 480, 1250) };
            playSfx("webZip");
          }
        }
        disposeVisual(projectile.net);
        activeWebProjectiles.splice(i, 1);
      }

      for (let i = activeFloorWebs.length - 1; i >= 0; i -= 1) {
        const trap = activeFloorWebs[i];
        if (now >= trap.expiresAt) {
          disposeVisual(trap.net);
          activeFloorWebs.splice(i, 1);
          if (trap.trapId) networkFloorWebs.delete(trap.trapId);
          continue;
        }
        const pulse = 1 + Math.sin(now * 0.006 + i) * 0.025;
        trap.net.scale.setScalar(pulse);
        let caughtDummy = null;
        for (const dummy of trap.serverManaged ? [] : dynamicDummies) {
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

      if (playerWebTrappedUntil > now && playerWebTrapAnchor) {
        if (!playerWebWrap) playerWebWrap = createWebWrap();
        playerWebWrap.position.copy(threeFromCannon(playerBody.position)).add(new THREE.Vector3(0, 0.08, 0));
        playerWebWrap.scale.setScalar(1 + Math.sin(now * 0.012) * 0.025);
      } else if (playerWebWrap) {
        clearPlayerWebWrap();
      }
      remotePlayers.forEach((remote) => {
        if (remote.webTrappedUntil > now && remote.webWrap) {
          remote.webWrap.position.copy(remote.group.position).add(new THREE.Vector3(0, 0.08, 0));
          remote.webWrap.scale.setScalar(1 + Math.sin(now * 0.012) * 0.025);
        } else if (remote.webWrap) {
          disposeVisual(remote.webWrap);
          remote.webWrap = null;
          remote.webTrappedUntil = 0;
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
      } else if (webPullState?.targetPlayer && remotePlayers.has(webPullState.targetPlayer.id)) {
        updateWebCord(hand, webPullState.targetPlayer.group.position.clone().add(new THREE.Vector3(0, 0.82, 0)), true, 0.05);
      } else if (webZipState) {
        updateWebCord(hand, webZipState.point, true, 0.035);
      } else {
        webCord.group.visible = false;
      }
    }

    function beginMegaLeapCharge() {
      if (selectedPower !== "jump") return false;
      if (!isGrounded()) {
        bouncePunch();
        return true;
      }
      megaLeapCharging = true;
      megaLeapChargeStart = performance.now();
      playerBody.velocity.x *= 0.25;
      playerBody.velocity.z *= 0.25;
      playSfx("jumpCharge");
      showMessage("Charging Mega Leap");
      return true;
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
      if (!canUseAbility(520)) return false;

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

      kickComboUntil = performance.now() + 520;
      kickComboSide = 1;
      if (targetDummy) {
        targetDummy.isPinned = true;
        pinnedKickDummy = targetDummy;
        targetDummy.body.velocity.set(0, 0, 0);
        targetDummy.body.angularVelocity.set(0, 0, 0);
      }
      playSfx("speedKick");
      showMessage(targetDummy || selectedMap === "pvpArena" ? "Fast Kick Combo" : "Fast Kick Combo missed");

      [0, 115, 230, 345].forEach((delay, index) => {
        setTimeout(() => {
          if (selectedPower !== "speed") return;
          const side = index % 2 === 0 ? 1 : -1;
          kickComboSide = side;
          kickComboUntil = performance.now() + 190;
          if (!targetDummy) return;
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
      return true;
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

    function findRemoteCombatTarget(origin, forward, maxDistance = 17, minDot = 0.42) {
      if (selectedMap !== "pvpArena") return null;
      let best = null;
      let bestScore = Infinity;
      remotePlayers.forEach((remote) => {
        if (remote.health <= 0) return;
        const offset = remote.group.position.clone().sub(origin);
        const distance = offset.length();
        if (distance > maxDistance || distance < 0.01) return;
        const flat = offset.setY(0);
        if (flat.lengthSq() < 0.01) return;
        const dot = flat.normalize().dot(forward);
        if (dot < minDot) return;
        const score = distance + (1 - dot) * 8;
        if (score < bestScore) {
          best = remote;
          bestScore = score;
        }
      });
      return best;
    }

    function teleportPunchReset() {
      if (!canUseAbility(620)) return false;
      const startPos = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      const targetDummy = findTeleportPunchTarget(startPos, forward);
      const targetRemote = targetDummy ? null : findRemoteCombatTarget(startPos, forward);
      if (!targetDummy && !targetRemote) {
        showMessage("Aim near an enemy for TP Punch.");
        playSfx("cooldownDeny");
        return false;
      }

      const dummyPos = targetDummy ? threeFromCannon(targetDummy.body.position) : targetRemote.group.position.clone();
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
        if (targetDummy) applyImpulseToDummy(targetDummy, hitDirection, 10, 3.5, new THREE.Vector3(0, 0.55, 0), 18);
        const impactPosition = targetDummy ? threeFromCannon(targetDummy.body.position) : targetRemote.group.position.clone();
        spawnBurst(impactPosition.clone().add(new THREE.Vector3(0, 0.82, 0)), POWER_DATA.teleport.color, 13, 0.38);
        spawnRing(groundEffectPoint(impactPosition), POWER_DATA.teleport.color, 0.35, 1.8, 0.3);
      }, 65);

      setTimeout(() => {
        if (selectedPower !== "teleport" || !gameStarted) return;
        playerBody.position.set(startPos.x, startPos.y, startPos.z);
        playerBody.velocity.set(0, 0, 0);
        spawnRing(groundEffectPoint(startPos), POWER_DATA.teleport.color, 0.4, 1.7, 0.28);
      }, 145);

      showMessage("TP Hit-and-Reset Punch");
      return true;
    }

    function teleportMove() {
      if (selectedPower !== "teleport") return;
      if (playerWebTrappedUntil > performance.now()) {
        const escapeHit = centerRaycast(58);
        const destination = escapeHit
          ? clampPointToMap(escapeHit.point.clone().add(new THREE.Vector3(0, 0.78, 0)))
          : clampPointToMap(threeFromCannon(playerBody.position).addScaledVector(getCameraForward(true), 8));
        destination.y = Math.max(MAP_DATA[selectedMap].minY ?? 0.74, destination.y);
        multiplayerClient?.sendAction({ kind: "web-escape", method: "teleport", destination: destination.toArray() });
        if (!onlineMode) applyWebEscape({ id: "local", method: "teleport", position: destination.toArray() });
        return;
      }
      const now = performance.now();
      if (now < teleportMoveCooldownUntil) {
        showMessage(`Teleport cooling down: ${Math.ceil((teleportMoveCooldownUntil - now) / 1000)}s`);
        playSfx("cooldownDeny");
        return;
      }
      const startPosition = threeFromCannon(playerBody.position);
      const remoteTarget = findRemoteCombatTarget(startPosition, getCameraForward(true), 58, 0.78);
      const hit = remoteTarget ? null : centerRaycast(58);
      if (!remoteTarget && !hit) {
        showMessage("No teleport surface found.");
        return;
      }

      const minTeleportY = MAP_DATA[selectedMap].minY ?? 0.74;
      playSfx("teleport");
      teleportMoveCooldownUntil = now + 1000;
      teleportMovePoseUntil = now + 360;

      if (remoteTarget || hit.target.userData.type === "dummy") {
        const dummy = remoteTarget ? null : hit.target.userData.dummy;
        const startPos = threeFromCannon(playerBody.position);
        const dummyPos = remoteTarget ? remoteTarget.group.position.clone() : threeFromCannon(dummy.body.position);
        const enemyQuaternion = remoteTarget
          ? remoteTarget.group.quaternion
          : new THREE.Quaternion(dummy.body.quaternion.x, dummy.body.quaternion.y, dummy.body.quaternion.z, dummy.body.quaternion.w);
        const enemyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemyQuaternion).setY(0);
        if (enemyForward.lengthSq() < 0.01) enemyForward.copy(dummyPos.clone().sub(startPos).setY(0));
        if (enemyForward.lengthSq() < 0.01) enemyForward.copy(getCameraForward(true));
        enemyForward.normalize();
        const behindPos = dummyPos.clone().addScaledVector(enemyForward, -1.34);
        behindPos.y = Math.max(minTeleportY, dummyPos.y);

        if (dummy) {
          dummy.isPinned = true;
          dummy.body.velocity.set(0, 0, 0);
          dummy.body.angularVelocity.set(0, 0, 0);
          dummy.body.wakeUp();
        }
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
        if (remoteTarget) multiplayerClient?.sendAction({ kind: "teleport-backstab", targetId: remoteTarget.id });

        setTimeout(() => {
          if (dummy) dummy.isPinned = false;
          if (selectedPower !== "teleport" || !gameStarted || dummy?.isDefeated) return;
          if (dummy) applyImpulseToDummy(dummy, enemyForward, 14, 4.5, new THREE.Vector3(0, 0.55, 0), 24);
          const impactPosition = dummy ? threeFromCannon(dummy.body.position) : remoteTarget.group.position.clone();
          spawnBurst(impactPosition.clone().add(new THREE.Vector3(0, 0.82, 0)), POWER_DATA.teleport.color, 15, 0.42);
          spawnRing(groundEffectPoint(impactPosition), POWER_DATA.teleport.color, 0.35, 2.15, 0.34);
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
      const now = performance.now();
      if (now < telekinesisGrabCooldownUntil) {
        showMessage(`Telekinetic Hold ready in ${((telekinesisGrabCooldownUntil - now) / 1000).toFixed(1)}s`, 650);
        playSfx("cooldownDeny");
        return false;
      }
      const hit = centerRaycast(46);
      const remoteTarget = selectedMap === "pvpArena"
        ? findRemoteCombatTarget(threeFromCannon(playerBody.position), getCameraForward(true), 46, 0.88)
        : null;
      if ((!hit || (hit.target.userData.type !== "dummy" && hit.target.userData.type !== "movableBox")) && !remoteTarget) {
        showMessage("Aim the cursor at a dummy or box to lift it.");
        return false;
      }
      if (remoteTarget && (!hit || remoteTarget.group.position.distanceTo(camera.position) <= hit.point.distanceTo(camera.position))) {
        telekinesisGrabCooldownUntil = now + TELEKINESIS_GRAB_COOLDOWN;
        telekinesisHoldDistance = THREE.MathUtils.clamp(camera.position.distanceTo(remoteTarget.group.position), 2.2, 32);
        multiplayerClient?.sendAction({ kind: "telekinesis-grab-player", targetId: remoteTarget.id });
        showMessage("Telekinetic player hold…", 700);
        return true;
      }

      heldObject = hit.target.userData.type === "dummy" ? hit.target.userData.dummy : hit.target.userData.box;
      telekinesisGrabCooldownUntil = now + TELEKINESIS_GRAB_COOLDOWN;
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
      const entityType = movableBoxes.includes(heldObject) ? "box" : "dummy";
      const entityId = entityType === "box" ? movableBoxes.indexOf(heldObject) : dynamicDummies.indexOf(heldObject);
      multiplayerClient?.sendAction({ kind: "telekinesis-entity-grab", map: selectedMap, entityType, entityId });
      spawnBeam(camera.position, threeFromCannon(heldObject.body.position), POWER_DATA.telekinesis.color, 0.045, 0.38);
      spawnRing(groundEffectPoint(threeFromCannon(heldObject.body.position)), POWER_DATA.telekinesis.color, 0.35, 1.5, 0.42);
      playSfx("telekinesisHold");
      showMessage("Telekinetic hold");
      return true;
    }

    function releaseTelekinesis() {
      if (telekinesisHeldPlayer) {
        const remote = telekinesisHeldPlayer;
        telekinesisHeldPlayer = null;
        const forward = getCameraForward(false);
        multiplayerClient?.sendAction({ kind: "telekinesis-throw-player", targetId: remote.id, forward: [forward.x, forward.y, forward.z] });
        spawnBeam(camera.position, remote.group.position.clone().addScaledVector(forward, 5), POWER_DATA.telekinesis.color, 0.07, 0.26);
        spawnBurst(remote.group.position.clone(), POWER_DATA.telekinesis.color, 14, 0.5);
        playSfx("telekinesisThrow");
        showMessage("Mind throw");
        return;
      }
      if (!heldObject) return;

      const forward = getCameraForward(false);
      const thrownObject = heldObject;
      const entityType = movableBoxes.includes(thrownObject) ? "box" : "dummy";
      const entityId = entityType === "box" ? movableBoxes.indexOf(thrownObject) : dynamicDummies.indexOf(thrownObject);
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
      markStrengthThrownEntity(heldObject, multiplayerClient?.id, entityType, entityId, "telekinesis");
      multiplayerClient?.sendAction(strengthEntitySnapshot(entityType, entityId, heldObject, "telekinesis-entity-throw"));
      heldObject = null;
      playSfx("telekinesisThrow");
      showMessage("Mind throw");
    }

    function updateHeldDummy() {
      if (telekinesisHeldPlayer) return;
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

    function nearestStrengthEnemy(range = 4.25) {
      const origin = threeFromCannon(playerBody.position);
      const forward = getCameraForward(true);
      let best = null;
      let bestScore = Infinity;
      dynamicDummies.forEach((dummy, index) => {
        if (dummy.health <= 0 || dummy.isHeld || dummy.isPinned) return;
        const offset = threeFromCannon(dummy.body.position).sub(origin);
        const distance = offset.length();
        if (distance > range || distance < 0.05) return;
        const facing = offset.clone().setY(0).normalize().dot(forward);
        if (facing < -0.05) return;
        const score = distance - facing * 0.8;
        if (score < bestScore) {
          best = { type: "dummy", target: dummy, index };
          bestScore = score;
        }
      });
      if (selectedMap === "pvpArena") {
        remotePlayers.forEach((remote) => {
          if (remote.health <= 0) return;
          const offset = remote.group.position.clone().sub(origin);
          const distance = offset.length();
          if (distance > range || distance < 0.05) return;
          const facing = offset.clone().setY(0).normalize().dot(forward);
          if (facing < -0.05) return;
          const score = distance - facing * 0.8;
          if (score < bestScore) {
            best = { type: "player", target: remote, id: remote.id };
            bestScore = score;
          }
        });
      }
      return best;
    }

    function setStrengthEntityHeld(entity, held) {
      entity.isHeld = held;
      entity.body.type = held ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC;
      entity.body.mass = held ? 0 : (entity.mass || dummyMass);
      entity.body.collisionResponse = !held;
      entity.body.velocity.set(0, 0, 0);
      entity.body.angularVelocity.set(0, 0, 0);
      entity.body.updateMassProperties();
      entity.body.previousPosition.copy(entity.body.position);
      entity.body.interpolatedPosition.copy(entity.body.position);
      entity.body.previousQuaternion.copy(entity.body.quaternion);
      entity.body.interpolatedQuaternion.copy(entity.body.quaternion);
      entity.body.aabbNeedsUpdate = true;
      entity.body.wakeUp();
    }

    function strengthEntitySnapshot(type, index, entity, kind = "strength-entity-throw") {
      return {
        kind,
        map: selectedMap,
        entityType: type,
        entityId: index,
        position: [entity.body.position.x, entity.body.position.y, entity.body.position.z],
        quaternion: [entity.body.quaternion.x, entity.body.quaternion.y, entity.body.quaternion.z, entity.body.quaternion.w],
        velocity: [entity.body.velocity.x, entity.body.velocity.y, entity.body.velocity.z],
        health: entity.health,
      };
    }

    function markStrengthThrownEntity(entity, attackerId, type, id, power = "strength") {
      entity.networkThrowAttackerId = attackerId;
      entity.networkThrowType = type;
      entity.networkThrowId = id;
      entity.networkThrowPower = power;
      entity.networkThrowExpiresAt = performance.now() + 2200;
      entity.networkContactSent = false;
    }

    function toggleStrengthGrab() {
      if (selectedPower !== "strength" || grabbedById) return;
      const now = performance.now();
      const forward = getCameraForward(false);
      if (strengthHeldEnemy) {
        const held = strengthHeldEnemy;
        strengthHeldEnemy = null;
        strengthThrowPoseUntil = now + 520;
        strengthGrabCooldownUntil = now + 1500;
        if (held.type === "player") {
          multiplayerClient?.sendAction({ kind: "strength-throw-player", targetId: held.id, forward: [forward.x, forward.y, forward.z] });
          playSfx("boxThrow");
          showMessage("Enemy throw");
          return;
        }
        const dummy = held.target;
        setStrengthEntityHeld(dummy, false);
        dummy.lastThrownBy = "strength";
        dummy.body.velocity.set(forward.x * 18, forward.y * 12 + 5, forward.z * 18);
        dummy.body.wakeUp();
        damageDummy(dummy, 28);
        markStrengthThrownEntity(dummy, multiplayerClient?.id, "dummy", held.index);
        multiplayerClient?.sendAction(strengthEntitySnapshot("dummy", held.index, dummy));
        spawnBurst(threeFromCannon(dummy.body.position), POWER_DATA.strength.color, 14, 0.46);
        playSfx("boxThrow");
        showMessage(dummy.isMinion ? "Minion throw" : "Dummy throw");
        return;
      }
      if (strengthHeldBox) {
        const box = strengthHeldBox;
        const boxIndex = movableBoxes.indexOf(box);
        strengthHeldBox = null;
        strengthThrowPoseUntil = now + 520;
        strengthGrabCooldownUntil = now + 1500;
        setStrengthEntityHeld(box, false);
        box.lastThrownBy = "strength";
        box.body.velocity.set(forward.x * 22, forward.y * 14 + 5, forward.z * 22);
        box.body.wakeUp();
        markStrengthThrownEntity(box, multiplayerClient?.id, "box", boxIndex);
        multiplayerClient?.sendAction(strengthEntitySnapshot("box", boxIndex, box));
        spawnBurst(threeFromCannon(box.body.position), POWER_DATA.strength.color, 12, 0.4);
        playSfx("boxThrow");
        showMessage("Box throw");
        return;
      }

      if (now < strengthGrabCooldownUntil) {
        showMessage(`Grab cooldown: ${((strengthGrabCooldownUntil - now) / 1000).toFixed(1)}s`, 650);
        playSfx("cooldownDeny");
        return;
      }

      const enemy = nearestStrengthEnemy();
      if (enemy?.type === "player") {
        strengthGrabCooldownUntil = now + 1200;
        multiplayerClient?.sendAction({ kind: "strength-grab-player", targetId: enemy.id });
        showMessage("Grabbing player…", 700);
        return;
      }
      if (enemy?.type === "dummy") {
        strengthGrabCooldownUntil = now + 900;
        strengthHeldEnemy = enemy;
        setStrengthEntityHeld(enemy.target, true);
        multiplayerClient?.sendAction({ kind: "strength-entity-grab", map: selectedMap, entityType: "dummy", entityId: enemy.index });
        playSfx("boxGrab");
        showMessage(enemy.target.isMinion ? "Minion grabbed" : "Dummy grabbed");
        return;
      }

      const box = nearestMovableBox();
      if (!box) {
        showMessage("Move close to a box or enemy and press E to grab it.");
        return;
      }
      strengthHeldBox = box;
      strengthGrabCooldownUntil = now + 900;
      setStrengthEntityHeld(box, true);
      multiplayerClient?.sendAction({ kind: "strength-entity-grab", map: selectedMap, entityType: "box", entityId: movableBoxes.indexOf(box) });
      playSfx("boxGrab");
      showMessage("Box grabbed");
    }

    function updateStrengthHeldBox() {
      if (!strengthHeldBox && strengthHeldEnemy?.type !== "dummy") return;
      const forward = getCameraForward(false);
      const holdPoint = threeFromCannon(playerBody.position).add(new THREE.Vector3(0, 2.2, 0)).addScaledVector(forward, 0.28);
      const entity = strengthHeldBox || strengthHeldEnemy.target;
      entity.body.position.set(holdPoint.x, holdPoint.y, holdPoint.z);
      entity.body.velocity.set(0, 0, 0);
      entity.body.angularVelocity.set(0, 0, 0);
      if (strengthHeldEnemy) entity.body.quaternion.setFromEuler(Math.PI / 2, Math.atan2(forward.x, forward.z), 0);
      entity.body.previousPosition.copy(entity.body.position);
      entity.body.interpolatedPosition.copy(entity.body.position);
      entity.body.previousQuaternion.copy(entity.body.quaternion);
      entity.body.interpolatedQuaternion.copy(entity.body.quaternion);
      entity.body.aabbNeedsUpdate = true;
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
        frontViewMode = false;
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
      if (localDefeat) return;
      setShiftLock(!shiftLockMode);
    }

    function endFlightMode(messageText = "Flight Mode off") {
      flightMode = false;
      flyMeterCharge = 0;
      flyMeterGraceUntil = 0;
      flightJumpArmed = false;
      flightSprintActive = false;
      flightTurboActive = false;
      if (document.pointerLockElement === renderer.domElement && !shiftLockMode) document.exitPointerLock();
      playSfx("flightToggle");
      showMessage(messageText);
    }

    function fireFeatherVolley() {
      if (selectedPower !== "flight") return false;
      if (flightMode || divePending) {
        showMessage("Land before firing cape feathers.");
        playSfx("cooldownDeny");
        return false;
      }
      const now = performance.now();
      if (now < flightFeatherCooldownUntil) {
        showMessage(`Feather volley cooling down: ${Math.ceil((flightFeatherCooldownUntil - now) / 1000)}s`);
        playSfx("cooldownDeny");
        return false;
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
      return true;
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
      if (!flightMode || divePending || !canUseAbility(500)) return false;
      divePending = true;
      flightMode = false;
      if (document.pointerLockElement === renderer.domElement && !shiftLockMode) document.exitPointerLock();
      const aimDirection = getCameraForward(false).normalize();
      const diveDirection = aimDirection.clone().add(new THREE.Vector3(0, -0.34, 0)).normalize();
      playerBody.velocity.set(diveDirection.x * 64, diveDirection.y * 28, diveDirection.z * 64);
      spawnBeam(threeFromCannon(playerBody.position), threeFromCannon(playerBody.position).addScaledVector(diveDirection, 6), POWER_DATA.flight.color, 0.1, 0.5);
      playSfx("dive");
      showMessage("Angled Dive Burst");
      return true;
    }

    function finishDiveImpact(point) {
      if (!divePending) return;
      divePending = false;
      playerBody.position.y = Math.max(playerBody.position.y, point.y + 0.54);
      playerBody.velocity.set(0, 5, 0);
      blastDummies(8.2, 58);
      spawnRing(point, POWER_DATA.flight.color, 0.45, 4.6, 0.5);
      spawnBurst(point.clone().add(new THREE.Vector3(0, 0.35, 0)), 0xd6c7a1, 20, 0.55);
      playSfx("diveImpact");
    }

    function toggleFlight() {
      if (localDefeat) return;
      if (selectedPower !== "flight") return;
      if (divePending) return;
      if (flightMode) return;
      if (flyMeterCharge < 0.999 || !flightJumpArmed || isGrounded()) {
        playSfx("cooldownDeny");
        showMessage(flyMeterCharge < 0.999 ? "Charge the Fly-O-Meter first" : "Jump, then press Space again", 800);
        return;
      }
      flightMode = true;
      flightJumpArmed = false;
      flyMeterCharge = 0;
      flyMeterGraceUntil = 0;
      firstPersonMode = false;
      frontViewMode = false;
      playerBody.velocity.y = Math.max(4.8, playerBody.velocity.y);
      setShiftLock(true, false);
      playSfx("flightToggle");
      showMessage("Flight Mode — hold Shift for turbo");
    }

    function requestFlightStrike() {
      if (selectedPower !== "flight") return false;
      if (flightStrikeState || localDefeat) return true;
      const now = performance.now();
      if (now < flightStrikeCooldownUntil) {
        playSfx("cooldownDeny");
        showMessage(`Aerial strike ready in ${Math.ceil((flightStrikeCooldownUntil - now) / 1000)}s`, 750);
        return true;
      }
      const onlineStrike = Boolean(onlineMode && multiplayerClient?.id);
      startFlightStrikeSequence({
        id: onlineStrike ? multiplayerClient.id : "local",
        cooldownUntil: Date.now() + 12000,
        optimistic: onlineStrike,
      });
      if (onlineStrike) multiplayerClient.sendAction({ kind: "flight-strike-start" });
      return true;
    }

    function startFlightStrikeSequence(packet) {
      const isLocalStrike = packet.id === multiplayerClient?.id || packet.id === "local";
      if (!isLocalStrike) {
        const remote = remotePlayers.get(packet.id);
        if (remote) remote.group.visible = false;
        return;
      }
      if (selectedPower !== "flight") return;
      if (flightStrikeState) {
        if (packet.cooldownUntil) flightStrikeCooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
        flightStrikeState.optimistic = false;
        flightStrikeState.serverConfirmed = true;
        return;
      }
      flightStrikeCooldownUntil = networkTimeToPerformance(packet.cooldownUntil);
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.15, 32),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.86, depthTest: false })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      marker.renderOrder = 80;
      scene.add(marker);
      flightStrikeState = {
        phase: "launching",
        startedAt: performance.now(),
        marker,
        target: threeFromCannon(playerBody.position),
        valid: false,
        optimistic: Boolean(packet.optimistic),
        serverConfirmed: !packet.optimistic,
        descentFallbackTimer: 0,
        targetSelectEndsAt: 0,
        lastCountdownSecond: 0,
        savedCamera: { position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone() },
        savedFog: scene.fog,
        savedCameraFar: camera.far,
      };
      flightMode = false;
      flightTurboActive = false;
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      keys.clear();
      playerBody.velocity.set(0, 56, 0);
      playSfx("flightLaunch");
      spawnRing(groundEffectPoint(threeFromCannon(playerBody.position)), POWER_DATA.flight.color, 0.5, 3.3, 0.55);
      showMessage("Sky launch — choose a landing point", 1100);
    }

    function cancelFlightStrike(notifyServer = true) {
      if (!flightStrikeState) return;
      if (notifyServer && onlineMode) multiplayerClient?.sendAction({ kind: "flight-strike-cancel" });
      window.clearTimeout(flightStrikeState.descentFallbackTimer);
      scene.remove(flightStrikeState.marker);
      flightStrikeState.marker.geometry.dispose();
      flightStrikeState.marker.material.dispose();
      camera.up.copy(flightStrikeState.savedCamera.up);
      scene.fog = flightStrikeState.savedFog;
      camera.far = flightStrikeState.savedCameraFar;
      camera.updateProjectionMatrix();
      cameraReturn = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), startedAt: performance.now(), endsAt: performance.now() + 600 };
      flightStrikeState = null;
      playerGroup.visible = true;
      playerBody.collisionResponse = true;
      playerBody.wakeUp();
    }

    function chooseFlightStrikeTarget() {
      if (flightStrikeState?.phase !== "targeting") return;
      const point = clampPointToMap(flightStrikeState.target.clone());
      if (onlineMode && multiplayerClient?.id) {
        multiplayerClient.sendAction({ kind: "flight-strike-impact", point: point.toArray() });
        window.clearTimeout(flightStrikeState.descentFallbackTimer);
        flightStrikeState.descentFallbackTimer = window.setTimeout(() => {
          if (flightStrikeState?.phase === "targeting") {
            beginFlightStrikeDescent({ id: multiplayerClient?.id || "local", point: point.toArray(), map: selectedMap, seed: Date.now() >>> 0 });
          }
        }, flightStrikeState.serverConfirmed ? 850 : 180);
      } else beginFlightStrikeDescent({ id: "local", point: point.toArray(), map: selectedMap, seed: Date.now() >>> 0 });
    }

    function beginFlightStrikeDescent(packet) {
      const isLocalStrike = packet.id === multiplayerClient?.id || packet.id === "local";
      const point = new THREE.Vector3().fromArray(packet.point || [0, 0, 0]);
      if (!isLocalStrike) {
        const remote = remotePlayers.get(packet.id);
        if (remote) {
          spawnBeam(point.clone().add(new THREE.Vector3(0, 48, 0)), point, POWER_DATA.flight.color, 0.12, 0.28);
          window.setTimeout(() => {
            remote.group.position.copy(point);
            remote.target.copy(point);
            remote.group.visible = true;
            renderFlightStrikeImpact(point, packet.seed, false);
          }, 220);
        }
        return;
      }
      if (!flightStrikeState || flightStrikeState.phase === "descending") return;
      flightStrikeState.phase = "descending";
      flightStrikeState.descentStartedAt = performance.now();
      flightStrikeState.target.copy(point);
      flightStrikeState.descentStart = point.clone().add(new THREE.Vector3(0, 52, 0));
      flightStrikeState.marker.visible = false;
      playerGroup.visible = true;
      playSfx("dive");
    }

    function renderFlightStrikeImpact(point, seed = 1, local = true) {
      spawnRing(groundEffectPoint(point), POWER_DATA.flight.color, 0.5, 8.5, 0.7);
      spawnBurst(point.clone().add(new THREE.Vector3(0, 0.65, 0)), POWER_DATA.flight.color, 34, 0.75, seed);
      spawnBurst(point.clone().add(new THREE.Vector3(0, 0.25, 0)), 0xd6c7a1, 26, 0.7, seed ^ 0x777);
      playLocalSfx("flightStrike");
      if (!local) return;
      blastDummies(9, 68);
      movableBoxes.forEach((box) => {
        const offset = threeFromCannon(box.body.position).sub(point);
        if (offset.length() > 9) return;
        offset.setY(0.35).normalize();
        box.body.applyImpulse(new CANNON.Vec3(offset.x * 7, 5, offset.z * 7));
      });
      playerDamageFlash = 0.3;
    }

    function updateFlightStrike() {
      if (!flightStrikeState) return;
      const now = performance.now();
      const state = flightStrikeState;
      if (state.phase === "launching") {
        playerBody.velocity.x = 0;
        playerBody.velocity.z = 0;
        if (now - state.startedAt < 820) {
          if (Math.floor((now - state.startedAt) / 90) !== Math.floor((now - state.startedAt - 16) / 90)) {
            spawnBurst(threeFromCannon(playerBody.position).add(new THREE.Vector3(0, -0.4, 0)), 0xffffff, 5, 0.3);
          }
          return;
        }
        state.phase = "targeting";
        scene.fog = null;
        camera.far = 500;
        camera.updateProjectionMatrix();
        playerGroup.visible = false;
        playerBody.velocity.set(0, 0, 0);
        playerBody.collisionResponse = false;
        playerBody.sleep();
        state.targetSelectEndsAt = now + 10000;
        state.lastCountdownSecond = 10;
        showMessage("Choose landing point — 10s", 900);
      }
      if (state.phase === "targeting") {
        const secondsLeft = Math.ceil((state.targetSelectEndsAt - now) / 1000);
        if (secondsLeft <= 0) {
          cancelFlightStrike(true);
          showMessage("Aerial strike cancelled — time ran out", 1000);
          return;
        }
        if (secondsLeft !== state.lastCountdownSecond) {
          state.lastCountdownSecond = secondsLeft;
          showMessage(`Choose landing point — ${secondsLeft}s`, 780);
        }
        raycaster.setFromCamera(mouseNdc, camera);
        const hit = raycaster.intersectObjects(raycastTargets, true)
          .map((entry) => ({ ...entry, targetObject: resolveTarget(entry.object) }))
          .find((entry) => ["floor", "obstacle", "roof", "track-mark"].includes(entry.targetObject?.userData?.type));
        const landingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(MAP_DATA[selectedMap].minY ?? 0));
        const planePoint = raycaster.ray.intersectPlane(landingPlane, new THREE.Vector3());
        if (hit) state.target.copy(hit.point);
        else if (planePoint) state.target.copy(clampPointToMap(planePoint));
        state.valid = Boolean(hit || planePoint);
        state.marker.visible = state.valid;
        state.marker.position.copy(state.target).add(new THREE.Vector3(0, 0.08, 0));
        state.marker.material.color.setHex(state.valid ? 0x22c55e : 0xef4444);
        state.marker.scale.setScalar(1 + Math.sin(now * 0.01) * 0.12);
      }
      if (state.phase === "descending") {
        const progress = THREE.MathUtils.clamp((now - state.descentStartedAt) / 280, 0, 1);
        const position = state.descentStart.clone().lerp(state.target.clone().add(new THREE.Vector3(0, 0.78, 0)), progress * progress);
        playerBody.position.set(position.x, position.y, position.z);
        spawnBeam(position, state.target, POWER_DATA.flight.color, 0.1, 0.12);
        if (progress < 1) return;
        const impact = state.target.clone();
        renderFlightStrikeImpact(impact, Date.now() >>> 0, true);
        cancelFlightStrike(false);
        playerBody.position.set(impact.x, impact.y + 0.78, impact.z);
        playerBody.velocity.set(0, 4.5, 0);
        showMessage("Aerial strike!", 900);
      }
    }

    function fireRobotShot() {
      const now = performance.now();
      if (now < robotShotCooldownUntil) {
        showMessage(`Energy Shot ready in ${((robotShotCooldownUntil - now) / 1000).toFixed(1)}s`, 650);
        playSfx("cooldownDeny");
        return false;
      }
      robotShotCooldownUntil = now + ROBOT_SHOT_COOLDOWN;

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
        return true;
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
      return true;
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
      if (onlineMode && multiplayerClient?.id) {
        multiplayerClient.sendAction({ kind: "robot-shield-toggle" });
        showMessage(robotShieldMode ? "Lowering Defense Shield…" : "Activating Defense Shield…", 600);
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
        robotShieldCooldownUntil = Math.max(robotShieldCooldownUntil, performance.now() + 5000);
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

      if (playerWebTrappedUntil > performance.now()) {
        if (onlineMode && multiplayerClient?.id) multiplayerClient.sendAction({ kind: "web-escape", method: "pearl" });
        else {
          speedPearlCount -= 1;
          applyWebEscape({ id: "local", method: "pearl", pearls: speedPearlCount, position: [playerBody.position.x, playerBody.position.y, playerBody.position.z] });
        }
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
      strongSwordCooldownUntil = now + 7000;
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
        if (distance > 3.1 || distance < 0.01 || Math.abs(offset.y) > 2.25) return;
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
      multiplayerClient?.sendAction({ kind: "strong-sword", forward: [forward.x, forward.y, forward.z] });
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

    function broadcastPrimaryAttack() {
      if (!onlineMode || !multiplayerClient?.id) return;
      multiplayerClient.sendAction({ kind: "attack", power: selectedPower, name: `${selectedPower}-primary`, at: Date.now() });
      if (multiplayerClient.id !== multiplayerHostId) {
        window.setTimeout(() => multiplayerClient?.sendEntities(selectedMap, buildEntitySnapshot()), 120);
      }
    }

    function broadcastSecondaryAbility() {
      if (!onlineMode || !multiplayerClient?.id) return;
      multiplayerClient.sendAction({ kind: "ability", power: selectedPower, name: `${selectedPower}-secondary`, at: Date.now() });
      window.setTimeout(() => multiplayerClient?.sendEntities(selectedMap, buildEntitySnapshot()), 120);
    }

    function onAbilityDown() {
      if (localDefeat) return;
      if (flightStrikeState?.phase === "targeting") {
        chooseFlightStrikeTarget();
        return;
      }
      if (!gameStarted || isPointerDown || grabbedById) return;
      if (selectedPower === "strength" && (strengthHeldBox || strengthHeldEnemy)) {
        showMessage("Throw what you are holding before attacking.", 850);
        playSfx("cooldownDeny");
        return;
      }
      isPointerDown = true;
      primaryAttackArmed = false;
      abilityPose = 1;

      if (useEquippedItem()) {
        isPointerDown = false;
        return;
      }

      if (selectedPower === "speed") primaryAttackArmed = fastKickCombo();
      if (selectedPower === "strength") {
        if (performance.now() < strengthUltraCooldownUntil) {
          const remaining = ((strengthUltraCooldownUntil - performance.now()) / 1000).toFixed(1);
          playSfx("cooldownDeny");
          showMessage(`Ultra Smash cooldown: ${remaining}s`, 750);
          isPointerDown = false;
          return;
        }
        strengthChargeStart = performance.now();
        primaryAttackArmed = true;
        playSfx("strengthCharge");
        showMessage("Charging Ultra Punch", 900);
      }
      if (selectedPower === "teleport") primaryAttackArmed = teleportPunchReset();
      if (selectedPower === "telekinesis") beginTelekinesis();
      if (selectedPower === "flight") {
        primaryAttackArmed = flightMode ? beginDiveBurst() : fireFeatherVolley();
      }
      if (selectedPower === "robot") primaryAttackArmed = fireRobotShot();
      if (selectedPower === "jump") primaryAttackArmed = beginMegaLeapCharge();
      if (selectedPower === "webs") {
        webLeftDownAt = performance.now();
        webHoldTriggered = false;
      }
    }

    function onAbilityUp() {
      if (localDefeat) return;
      if (!gameStarted) return;
      if (grabbedById) {
        isPointerDown = false;
        return;
      }
      abilityPose = 1;
      if (selectedPower === "strength" && isPointerDown) releaseUltraPunch();
      if (selectedPower === "telekinesis") releaseTelekinesis();
      if (selectedPower === "jump") releaseMegaLeap();
      if (selectedPower === "webs") {
        primaryAttackArmed = !webHoldTriggered;
        if (!webHoldTriggered) {
          spiderGroundPunch();
        } else {
          if (webPullTargetPlayer) multiplayerClient?.sendAction({ kind: "web-pull-release", targetId: webPullTargetPlayer.id });
          if (webZipState) {
            const carry = webZipState.destination.clone().sub(webZipState.start).setY(0);
            if (carry.lengthSq() > 0.01) carry.normalize();
            playerBody.velocity.set(carry.x * 3.5, 2.5, carry.z * 3.5);
          }
          webPullState = null;
          webPullTargetPlayer = null;
          webZipState = null;
          if (webCord) webCord.group.visible = false;
        }
        webLeftDownAt = 0;
        webHoldTriggered = false;
      }
      if (primaryAttackArmed) broadcastPrimaryAttack();
      primaryAttackArmed = false;
      isPointerDown = false;
    }

    function updatePlayerControl(delta) {
      if (localDefeat) {
        moveIntensity = 0;
        return;
      }
      if (!selectedPower) return;
      if (flightStrikeState) {
        moveIntensity = 0;
        return;
      }
      const controlNow = performance.now();
      if (playerWebTrappedUntil > controlNow && playerWebTrapAnchor) {
        playerBody.position.set(playerWebTrapAnchor.x, playerWebTrapAnchor.y, playerWebTrapAnchor.z);
        playerBody.velocity.set(0, 0, 0);
        playerBody.angularVelocity.set(0, 0, 0);
        playerBody.aabbNeedsUpdate = true;
        moveIntensity = 0;
        return;
      }
      if (webPulledById && webPullEndsAt > controlNow) {
        const attackerPosition = remotePlayers.get(webPulledById)?.group.position || roomPlayers.get(webPulledById)?.state?.position;
        if (attackerPosition) {
          const ax = Array.isArray(attackerPosition) ? attackerPosition[0] : attackerPosition.x;
          const ay = Array.isArray(attackerPosition) ? attackerPosition[1] : attackerPosition.y;
          const az = Array.isArray(attackerPosition) ? attackerPosition[2] : attackerPosition.z;
          const dx = ax - playerBody.position.x;
          const dy = ay + 0.2 - playerBody.position.y;
          const dz = az - playerBody.position.z;
          const distance = Math.hypot(dx, dy, dz);
          const speed = Math.min(15, Math.max(4, distance * 4.2));
          const scale = distance > 0.001 ? speed / distance : 0;
          playerBody.velocity.set(dx * scale, dy * scale + 0.8, dz * scale);
          playerBody.collisionResponse = true;
          playerBody.wakeUp();
        }
        moveIntensity = 0;
        return;
      }
      if (webPulledById && webPullEndsAt <= controlNow) {
        webPulledById = null;
        webPullEndsAt = 0;
      }
      if (grabbedById) {
        const holderState = roomPlayers.get(grabbedById)?.state;
        if (holderState?.position) {
          const holdPosition = grabbedMode === "telekinesis" && Array.isArray(holderState.telekinesisPoint)
            ? holderState.telekinesisPoint
            : [holderState.position[0], holderState.position[1] + 2.05, holderState.position[2]];
          if (grabbedMode === "telekinesis") {
            const dx = holdPosition[0] - playerBody.position.x;
            const dy = holdPosition[1] - playerBody.position.y;
            const dz = holdPosition[2] - playerBody.position.z;
            const distance = Math.hypot(dx, dy, dz);
            const pullSpeed = Math.min(16, Math.max(2.5, distance * 5.5));
            const scale = distance > 0.001 ? pullSpeed / distance : 0;
            playerBody.velocity.set(dx * scale, dy * scale, dz * scale);
            playerBody.collisionResponse = true;
            playerBody.wakeUp();
          } else {
            playerBody.position.set(...holdPosition);
            playerBody.previousPosition.copy(playerBody.position);
            playerBody.interpolatedPosition.copy(playerBody.position);
            playerBody.aabbNeedsUpdate = true;
            playerBody.velocity.set(0, 0, 0);
          }
        }
        playerBody.angularVelocity.set(0, 0, 0);
        moveIntensity = 0;
        return;
      }
      if (performance.now() < playerForcedMotionUntil) {
        moveIntensity = 0;
        playerBody.wakeUp();
        return;
      }
      if (pvpRespawnAt) {
        playerBody.velocity.x *= 0.82;
        playerBody.velocity.z *= 0.82;
        return;
      }

      const data = POWER_DATA[selectedPower];
      const forward = getCameraForward(true);
      const right = getCameraRight();
      const move = new THREE.Vector3();
      const flightLocked = selectedPower === "flight" && flightMode;
      if (!flightLocked) {
        if (frontViewMode) {
          if (keys.has("KeyW") || keys.has("ArrowUp")) move.sub(forward);
          if (keys.has("KeyS") || keys.has("ArrowDown")) move.add(forward);
        } else {
          if (keys.has("KeyW") || keys.has("ArrowUp")) move.add(forward);
          if (keys.has("KeyS") || keys.has("ArrowDown")) move.sub(forward);
        }
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
      const groundedNow = isGrounded();
      const flightSprinting = selectedPower === "flight" && !flightLocked && groundedNow && move.lengthSq() > 0.001 && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
      flightSprintActive = flightSprinting;
      flightTurboActive = selectedPower === "flight" && flightLocked && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
      if (selectedPower === "flight" && !flightLocked) {
        if (flightSprinting) {
          flyMeterCharge = Math.min(1, flyMeterCharge + delta / 5.2);
          flyMeterGraceUntil = controlNow + 3000;
        } else if (groundedNow && controlNow > flyMeterGraceUntil) flyMeterCharge = Math.max(0, flyMeterCharge - delta / 9);
        if (groundedNow && flyMeterCharge < 0.999) flightJumpArmed = false;
      }
      const robotDashDirection = move.lengthSq() > 0.001 ? move : forward;
      const jumpLeaping = selectedPower === "jump" && performance.now() < megaLeapActiveUntil && !isGrounded();
      let speed = sprinting ? data.speed * 2.85 : flightSprinting ? data.speed * (1 + flyMeterCharge * 1.1) : (flightLocked ? (flightTurboActive ? 27.5 : data.speed * 2.45) : data.speed);
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
      } else if (selectedPower === "webs" && performance.now() < webSwingMomentumUntil) {
        if (horizontalMove.lengthSq() > 0.001) {
          playerBody.force.x += horizontalMove.x * playerBody.mass * 7.5;
          playerBody.force.z += horizontalMove.z * playerBody.mass * 7.5;
        }
        const carryDamping = Math.pow(0.999, delta * 60);
        playerBody.velocity.x *= carryDamping;
        playerBody.velocity.z *= carryDamping;
      } else if (!groundedNow) {
        if (horizontalMove.lengthSq() > 0.001) {
          const steering = Math.min(1, delta * 1.35);
          const airborneVelocity = new THREE.Vector3(playerBody.velocity.x, 0, playerBody.velocity.z);
          const preservedSpeed = Math.max(airborneVelocity.length(), speed);
          if (airborneVelocity.lengthSq() < 0.001) airborneVelocity.copy(horizontalMove);
          airborneVelocity.normalize().lerp(horizontalMove, steering).normalize().multiplyScalar(preservedSpeed);
          playerBody.velocity.x = airborneVelocity.x;
          playerBody.velocity.z = airborneVelocity.z;
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

      if (flightSprintActive || flightTurboActive) {
        flightTrailTimer -= delta;
        if (flightTrailTimer <= 0) {
          const trailOrigin = threeFromCannon(playerBody.position).add(new THREE.Vector3(0, 0.55, 0));
          const trailDirection = flightTurboActive ? getCameraForward(false).multiplyScalar(-2.8) : move.clone().multiplyScalar(-1.35);
          spawnBeam(trailOrigin, trailOrigin.clone().add(trailDirection), 0xffffff, flightTurboActive ? 0.065 : 0.035, 0.24);
          spawnBurst(trailOrigin, POWER_DATA.flight.color, flightTurboActive ? 7 : 4, 0.28);
          playSfx(flightTurboActive ? "flightTurbo" : "flightSprint");
          flightTrailTimer = flightTurboActive ? 0.18 : 0.3;
        }
      } else flightTrailTimer = 0;

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

      if (divePending && playerBody.position.y <= 0.76) finishDiveImpact(new THREE.Vector3(playerBody.position.x, 0, playerBody.position.z));
    }

    function applyCameraReturnTransition() {
      if (!cameraReturn) return;
      const now = performance.now();
      const targetPosition = camera.position.clone();
      const targetQuaternion = camera.quaternion.clone();
      const progress = THREE.MathUtils.clamp((now - cameraReturn.startedAt) / (cameraReturn.endsAt - cameraReturn.startedAt), 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.copy(cameraReturn.position).lerp(targetPosition, eased);
      camera.quaternion.copy(cameraReturn.quaternion).slerp(targetQuaternion, eased);
      if (progress >= 1) cameraReturn = null;
    }

    function updateDefeatCamera() {
      const effect = localDefeat?.effect;
      if (!effect) return;
      const headBody = effect.headPart?.body;
      const validHead = headBody && headBody.world === world && headBody.position.y > -18
        && Math.abs(headBody.position.x - effect.fallback.x) < 180
        && Math.abs(headBody.position.z - effect.fallback.z) < 180;
      const target = validHead ? threeFromCannon(headBody.interpolatedPosition || headBody.position) : effect.fallback.clone();
      const velocity = validHead ? threeFromCannon(headBody.velocity) : effect.forward.clone();
      velocity.y = 0;
      const trail = velocity.lengthSq() > 0.12 ? velocity.normalize() : effect.forward.clone().setY(0).normalize();
      if (trail.lengthSq() < 0.01) trail.set(0, 0, -1);
      const desired = target.clone().addScaledVector(trail, -5.4).add(new THREE.Vector3(0, 2.65, 0));
      const boom = desired.clone().sub(target);
      const start = target.clone().addScaledVector(boom.clone().normalize(), 0.5);
      const rayResult = new CANNON.RaycastResult();
      world.raycastClosest(
        new CANNON.Vec3(start.x, start.y, start.z),
        new CANNON.Vec3(desired.x, desired.y, desired.z),
        { collisionFilterGroup: 1, collisionFilterMask: 1, skipBackfaces: true },
        rayResult
      );
      if (rayResult.hasHit) {
        const hit = threeFromCannon(rayResult.hitPointWorld);
        desired.copy(hit).addScaledVector(boom.normalize(), -0.32);
      }
      const smoothing = validHead ? 0.14 : 0.08;
      localDefeat.cameraPosition.lerp(desired, smoothing);
      localDefeat.cameraTarget.lerp(target.clone().add(new THREE.Vector3(0, 0.38, 0)), 0.18);
      const shake = Math.max(0, (localDefeat.shakeUntil - performance.now()) / 420);
      const phase = performance.now() * 0.055;
      camera.position.copy(localDefeat.cameraPosition).add(new THREE.Vector3(
        Math.sin(phase * 1.7) * 0.1 * shake,
        Math.sin(phase * 2.3) * 0.07 * shake,
        Math.cos(phase * 1.3) * 0.1 * shake
      ));
      camera.lookAt(localDefeat.cameraTarget);
    }

    function updateCamera() {
      if (localDefeat) {
        updateDefeatCamera();
        return;
      }
      if (flightStrikeState?.phase === "targeting") {
        const bounds = MAP_DATA[selectedMap].bounds;
        const center = new THREE.Vector3((bounds.minX + bounds.maxX) * 0.5, 0, (bounds.minZ + bounds.maxZ) * 0.5);
        const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
        camera.up.set(0, 0, -1);
        camera.position.set(center.x, Math.max(48, span * 0.82), center.z);
        camera.lookAt(center);
        return;
      }
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
        applyCameraReturnTransition();
        return;
      }

      if (frontViewMode) {
        playerGroup.visible = true;
        const frontDistance = Math.max(5.6, cameraDistance * 0.78);
        const horizontal = Math.cos(cameraPitch) * frontDistance;
        const offset = new THREE.Vector3(
          Math.sin(cameraYaw) * horizontal,
          Math.sin(cameraPitch) * frontDistance + 1.5,
          Math.cos(cameraYaw) * horizontal
        );
        camera.position.copy(playerPos).add(offset);
        camera.lookAt(playerPos.x, playerPos.y + 0.72, playerPos.z);
        applyCameraReturnTransition();
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
      applyCameraReturnTransition();

      const face = getCameraForward(true);
      playerGroup.rotation.y = Math.atan2(face.x, face.z);
    }

    function animatePlayer(delta) {
      if (!selectedPower) return;

      const sprinting = (isSpeedSprinting() || flightSprintActive) && moveIntensity > 0.1;
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
      const targetGroupPitch = flightLocked || divePending ? Math.PI / 2 : 0;
      if (!webWallWalkActive) {
        playerGroup.rotation.x = THREE.MathUtils.lerp(playerGroup.rotation.x, targetGroupPitch, Math.min(1, delta * 10));
        playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, 0, Math.min(1, delta * 10));
      }

      playerMaterialMain.color.setHex(selectedPower === "webs" ? 0xdc2626 : color);
      playerParts.leftArmMesh.material.color.setHex(selectedPower === "webs" ? 0x2563eb : color);
      playerParts.rightArmMesh.material.color.setHex(selectedPower === "webs" ? 0x2563eb : color);
      playerParts.head.material.color.setHex(selectedPower === "robot" ? 0x111827 : 0xe5e7eb);
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
      // The camera normally sees the avatar from behind. Keep each leg at the
      // heel edge while the longer part of the shoe projects forward (+Z).
      playerParts.leftFoot.position.set(0, -0.74, 0.16);
      playerParts.rightFoot.position.set(0, -0.74, 0.16);
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

      if (selectedPower === "strength" && (strengthHeldBox || strengthHeldEnemy)) {
        playerParts.leftArm.rotation.set(-2.65, 0.18, -0.42);
        playerParts.rightArm.rotation.set(-2.65, -0.18, 0.42);
        playerParts.leftHand.position.set(0, -0.62, -0.02);
        playerParts.rightHand.position.set(0, -0.62, -0.02);
        playerParts.torso.rotation.x = -0.08;
        playerParts.aura.material.opacity = 0.42;
      } else if (selectedPower === "strength" && performance.now() < strengthThrowPoseUntil) {
        const t = 1 - THREE.MathUtils.clamp((strengthThrowPoseUntil - performance.now()) / 520, 0, 1);
        const snap = Math.sin(t * Math.PI);
        playerParts.torso.rotation.x = -0.36 * snap;
        playerParts.leftArm.rotation.set(-2.35 + snap * 1.35, 0.22, -0.52);
        playerParts.rightArm.rotation.set(-2.35 + snap * 1.35, -0.22, 0.52);
        playerParts.leftLeg.rotation.set(0.42 * snap, 0, 0.14);
        playerParts.rightLeg.rotation.set(-0.42 * snap, 0, -0.14);
        playerParts.aura.material.opacity = 0.72;
      }

      if (selectedPower === "telekinesis" && (heldObject || telekinesisHeldPlayer)) {
        playerParts.leftArm.rotation.set(-1.28, -0.2, -0.46);
        playerParts.rightArm.rotation.set(-1.28, 0.2, 0.46);
        if (Math.random() < 0.18) {
          const heldPosition = heldObject ? threeFromCannon(heldObject.body.position) : telekinesisHeldPlayer.group.position.clone();
          spawnBeam(playerParts.rightHand.getWorldPosition(new THREE.Vector3()), heldPosition, color, 0.025, 0.16);
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
        playerParts.torso.rotation.x = 0;
        playerParts.torso.position.set(0, 0.92 + bob * 0.25, 0);
        playerParts.chest.position.set(0, 0, 0);
        playerParts.head.position.set(0, 1.58 + bob * 0.2, flightTurboActive || divePending ? -0.1 : -0.03);
        playerParts.leftArm.position.set(-0.47, 1.23, 0);
        playerParts.rightArm.position.set(0.47, 1.23, 0);
        playerParts.leftArm.rotation.set(divePending ? -2.15 : flightTurboActive ? -1.82 : -0.72, -0.08, -0.34);
        playerParts.rightArm.rotation.set(divePending ? -2.15 : flightTurboActive ? -1.82 : -2.32, 0.08, 0.34);
        playerParts.leftLeg.position.set(-0.2, 0.55, 0);
        playerParts.rightLeg.position.set(0.2, 0.55, 0);
        playerParts.leftLeg.rotation.set(divePending ? 0.72 : flightTurboActive ? 0.58 : 0.34, 0, 0.12);
        playerParts.rightLeg.rotation.set(divePending ? 0.72 : flightTurboActive ? 0.58 : 0.2, 0, -0.12);
        playerParts.aura.material.opacity = flightTurboActive ? 0.82 : 0.68;
      }

      playerParts.cape.visible = selectedPower === "flight";
      if (playerParts.cape.visible) {
        const windActive = flightLocked || flightSprintActive;
        const wave = Math.sin(walkTime * (flightTurboActive ? 5.2 : windActive ? 3.6 : 2.2)) * (flightTurboActive ? 0.16 : windActive ? 0.1 : 0.06);
        const featherPose = performance.now() < featherPoseUntil;
        playerParts.cape.rotation.x = featherPose ? -0.48 + wave : flightSprintActive || flightLocked || divePending ? 0.08 + wave * 0.35 : 0.24 + wave;
        playerParts.cape.rotation.z = featherPose ? Math.sin(walkTime * 10) * 0.18 : Math.sin(walkTime * (windActive ? 5 : 1.5)) * (windActive ? 0.09 : 0.035);
        playerParts.cape.scale.set(featherPose ? 1.28 : flightSprintActive || flightTurboActive ? 1.34 : 0.92, featherPose ? 0.82 : flightLocked || divePending || flightSprintActive ? 1.18 : 1, 1);
        playerParts.cape.position.set(0, flightLocked || divePending || flightSprintActive ? -0.16 : 0.04, flightLocked || divePending || flightSprintActive ? -0.43 : -0.34);
      }
      if ((grabbedById && grabbedMode === "strength") || performance.now() < playerTumbleUntil) {
        const holderState = roomPlayers.get(grabbedById)?.state;
        const holderForward = holderState?.forward || [playerBody.velocity.x, 0, playerBody.velocity.z];
        const tumble = grabbedById ? 0 : Math.sin(performance.now() * 0.018) * 0.28;
        playerGroup.rotation.set(Math.PI / 2, Math.atan2(holderForward[0], holderForward[2]) + Math.PI / 2, tumble);
        playerParts.leftArm.rotation.set(-0.28, 0, -0.34);
        playerParts.rightArm.rotation.set(-0.28, 0, 0.34);
        playerParts.leftLeg.rotation.set(0.18, 0, 0.1);
        playerParts.rightLeg.rotation.set(-0.18, 0, -0.1);
        playerParts.aura.material.opacity = 0.3;
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
      const now = performance.now();
      const showFlyMeter = selectedPower === "flight" && !flightMode;
      flyMeter.hidden = !showFlyMeter;
      flyMeterFill.style.width = `${Math.round(flyMeterCharge * 100)}%`;
      const flyState = flyMeterCharge >= 0.999 ? (flightJumpArmed ? "Airborne: press Space" : "Full: jump to arm") : flightSprintActive ? `Charging ${Math.round(flyMeterCharge * 100)}%` : `Sprint to charge — ${Math.round(flyMeterCharge * 100)}%`;
      flyMeterState.textContent = flyState;
      flyMeter.dataset.state = flyMeterCharge >= 0.999 ? "full" : flightSprintActive ? "charging" : "idle";
      const robotCooldownText = selectedPower === "robot"
        ? robotShieldMode
          ? `Shield ${Math.max(0, (robotShieldEndsAt - now) / 1000).toFixed(1)}s`
          : now < robotShotCooldownUntil
            ? `Energy Shot ${Math.max(0, (robotShotCooldownUntil - now) / 1000).toFixed(1)}s`
            : now < robotShieldCooldownUntil
              ? `Shield ${Math.ceil((robotShieldCooldownUntil - now) / 1000)}s`
              : ""
        : "";
      const showModeBadge = (selectedPower === "flight" && flightMode) || (selectedPower === "webs" && (webSwingActive || webWallWalkActive)) || Boolean(robotCooldownText);
      flightBadge.hidden = !showModeBadge;
      flightBadge.style.display = showModeBadge ? "inline-block" : "none";
      flightBadge.textContent = selectedPower === "robot"
        ? robotCooldownText
        : selectedPower === "webs"
        ? webWallWalkActive ? "Wall Walk" : "Web Swing — release Space"
        : flightTurboActive ? "Turbo Flight" : "Flight Mode";
      const healthPct = THREE.MathUtils.clamp(playerHealth / maxPlayerHealth(), 0, 1);
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

      if (gamePaused && !onlineMode) {
        renderer.render(scene, camera);
        return;
      }

      if (!gamePaused) {
        updateHeldDummy();
        updateStrengthHeldBox();
        updatePinnedDummy();
        updatePlayerControl(delta);
        updateSuperJump(delta);
      }
      updateFlightStrike();
      updateRobotShield();
      updateSpiderWebs(delta);
      updateMinions(delta);
      playerDamageFlash = Math.max(0, playerDamageFlash - delta);

      // fixedStep keeps Cannon stable while rendering at the display refresh rate.
      world.fixedStep(1 / 60, delta, 5);
      updateDefeatEffects(now);
      updateStrengthThrownContacts();
      updatePvpArenaSafety(now);
      updateCamera();
      syncVisuals();
      animatePlayer(delta);
      updateMultiplayer(now, delta);
      refreshWebCordVisual();
      updateEffects(delta);
      updateNetworkVisualAnimations(now);
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
      clearAllDefeatEffects();
      cancelFlightStrike(false);
      selectedPower = power;
      updatePrototypePanelLabel(power);
      gameStarted = true;
      gamePaused = false;
      pauseOverlay.hidden = true;
      playerList.hidden = true;
      keys.clear();
      flightMode = false;
      flyMeterCharge = 0;
      flyMeterGraceUntil = 0;
      flightJumpArmed = false;
      flightSprintActive = false;
      flightTurboActive = false;
      divePending = false;
      setShiftLock(false, false);
      resetSpiderWebState(true);
      flightFeatherCooldownUntil = 0;
      featherPoseUntil = 0;
      robotShieldMode = false;
      robotThrusterTimer = 0;
      robotShieldEndsAt = 0;
      robotShieldCooldownUntil = 0;
      robotShotCooldownUntil = 0;
      playerHealth = maxPlayerHealth(power);
      playerDamageFlash = 0;
      playerForcedMotionUntil = 0;
      playerTumbleUntil = 0;
      isPointerDown = false;
      primaryAttackArmed = false;
      megaLeapCharging = false;
      megaLeapChargeStart = 0;
      megaLeapActiveUntil = 0;
      bouncePunchUntil = 0;
      wallBouncePoseUntil = 0;
      rightMouseDragging = false;
      renderShiftLockState();
      firstPersonMode = false;
      frontViewMode = false;
      if (heldObject || telekinesisHeldPlayer) releaseTelekinesis();
      if (strengthHeldBox) {
        setStrengthEntityHeld(strengthHeldBox, false);
        strengthHeldBox = null;
      }
      if (strengthHeldEnemy?.type === "dummy") setStrengthEntityHeld(strengthHeldEnemy.target, false);
      if (strengthHeldEnemy?.type === "player") multiplayerClient?.sendAction({ kind: "strength-release-player", targetId: strengthHeldEnemy.id });
      strengthHeldEnemy = null;
      strengthThrowPoseUntil = 0;
      disposeMenuPreviews();
      ensureSelectedMapBuilt();
      renderer.shadowMap.needsUpdate = true;
      resetMinionArena();
      const data = POWER_DATA[power];
      playerTorso.material.color.setHex(data.color);
      playerParts.aura.material.color.setHex(data.color);
      applyPowerFace(playerParts, power);
      renderPlayerList();
      powerName.textContent = data.name;
      const map = MAP_DATA[selectedMap];
      powerHelp.textContent = `${map.name}. ${data.help} WASD move. Left Ctrl toggles Shift Lock. Right drag camera. V cycles camera views. Esc pauses.`;
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
      if (selectedMap === "pvpArena") placeAtPvpSpawn(multiplayerClient?.id || localUsername);
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
      telekinesisGrabCooldownUntil = 0;
      strengthUltraCooldownUntil = 0;
      selectedHotbarIndex = null;
      speedPearlCount = power === "speed" ? 5 : 0;
      pearlThrowPoseUntil = 0;
      strongSwordSlashUntil = 0;
      strongSwordCooldownUntil = 0;
      webPunchUntil = 0;
      webPunchCooldownUntil = 0;
      webShootPoseUntil = 0;
      webTrapCooldownUntil = 0;
      webPullCooldownUntil = 0;
      webSwingMomentumUntil = 0;
      webSwingCooldownUntil = 0;
      webPulledById = null;
      webPullEndsAt = 0;
      clearPlayerWebWrap();
      renderHotbar();
      if (selectedMap === "minionArena") spawnNextMinion();
      showMessage("Aim with the cursor. Hold right click and drag to move the camera.", 2400);
      playerBody.wakeUp();
      renderer.domElement.focus();
      if (multiplayerClient?.socket?.readyState === WebSocket.OPEN) {
        multiplayerClient.send({ type: "hello", power: selectedPower, map: selectedMap, username: localUsername, icon: localPlayerIcon });
      }
      connectToMultiplayer();
      roomPlayers.forEach((player) => ensureRemotePlayer(player));
    }

    function releaseActiveInputs() {
      keys.clear();
      isPointerDown = false;
      primaryAttackArmed = false;
      megaLeapCharging = false;
      rightMouseDragging = false;
      renderShiftLockState();
      releaseTelekinesis();
      endSpiderSwing(false);
      if (webPullTargetPlayer) multiplayerClient?.sendAction({ kind: "web-pull-release", targetId: webPullTargetPlayer.id });
      webPullState = null;
      webPullTargetPlayer = null;
      webZipState = null;
      webWallWalkActive = false;
      webWallLastContactAt = 0;
      webWallDetachUntil = 0;
      webLeftDownAt = 0;
      webHoldTriggered = false;
      if (webCord) webCord.group.visible = false;
      if (strengthHeldBox || strengthHeldEnemy) toggleStrengthGrab();
      chargeFill.style.width = "0%";
    }

    function setPaused(paused) {
      if (!gameStarted || gamePaused === paused) return;
      gamePaused = paused;
      if (paused) cancelFlightStrike(true);
      releaseActiveInputs();
      if (paused && onlineMode) {
        moveIntensity = 0;
        playerBody.velocity.x = 0;
        playerBody.velocity.z = 0;
      }
      if (paused && selectedPower === "flight" && !flightMode) {
        flyMeterCharge *= 0.5;
        flightJumpArmed = false;
      }
      pauseOverlay.hidden = !paused;
      pauseOverlay.querySelector(".pauseEyebrow").textContent = onlineMode ? "Controls paused — room stays live" : "Game paused";
      if (paused) {
        if (document.pointerLockElement) document.exitPointerLock();
        resumeButton.focus();
        powerSwapSelect.value = selectedPower;
        mapSwapSelect.value = selectedMap;
      } else {
        clock.getDelta();
        renderer.domElement.focus();
      }
    }

    resumeButton.addEventListener("click", () => setPaused(false));
    restartButton.addEventListener("click", () => startGame(selectedPower));
    mainMenuButton.addEventListener("click", () => window.location.reload());
    swapPowerButton.addEventListener("click", () => {
      const nextPower = powerSwapSelect.value;
      if (!POWER_DATA[nextPower] || nextPower === selectedPower) {
        setPaused(false);
        return;
      }
      playSfx("menuTap");
      startGame(nextPower);
      showMessage(`Switched to ${POWER_DATA[nextPower].name}`, 1600);
    });
    swapMapButton.addEventListener("click", () => {
      const nextMap = mapSwapSelect.value;
      if (!MAP_DATA[nextMap] || (MAP_DATA[nextMap].onlineOnly && !onlineMode) || nextMap === selectedMap) {
        setPaused(false);
        return;
      }
      playSfx("menuTap");
      resetSpiderWebState(true);
      remotePlayers.forEach((remote) => removeRemotePlayer(remote.id));
      selectedMap = nextMap;
      startGame(selectedPower);
      showMessage(`Deployed to ${MAP_DATA[nextMap].name}`, 1800);
    });

    let menuLaunching = false;

    function setMenuStep(step) {
      const choosingMode = step === "mode";
      const choosingMap = step === "map";
      modeStep.classList.toggle("active", choosingMode);
      modeStep.setAttribute("aria-hidden", String(!choosingMode));
      heroStep.classList.toggle("active", !choosingMode && !choosingMap);
      heroStep.setAttribute("aria-hidden", String(choosingMode || choosingMap));
      mapStep.classList.toggle("active", choosingMap);
      mapStep.setAttribute("aria-hidden", String(!choosingMap));
      selectionProgress.hidden = choosingMode;
      document.querySelector('[data-progress="hero"]').classList.toggle("active", !choosingMode && !choosingMap);
      document.querySelector('[data-progress="map"]').classList.toggle("active", choosingMap);
    }

    startOverlay.addEventListener("pointerdown", startMenuMusic, { once: true });

    function cleanUsername(value) {
      return String(value || "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 18);
    }

    try { localUsername = cleanUsername(localStorage.getItem("powerPlaygroundUsername")); } catch { localUsername = ""; }
    if (!localUsername) {
      usernameOverlay.hidden = false;
      window.setTimeout(() => usernameInput.focus(), 80);
    } else {
      usernameOverlay.hidden = true;
      usernameInput.value = localUsername;
    }
    menuUsername.textContent = localUsername || "New player";
    try { roomCodeInput.value = normalizeRoomCode(localStorage.getItem("powerPlaygroundRoomCode")); } catch { roomCodeInput.value = ""; }

    function rememberRoomCode(code) {
      const normalized = normalizeRoomCode(code);
      if (!normalized) return;
      try { localStorage.setItem("powerPlaygroundRoomCode", normalized); } catch { /* Storage can be unavailable in private browsing. */ }
    }

    function markRoomCodeForReconnect() {
      const code = normalizeRoomCode(roomCodeInput.value);
      if (!multiplayerClient?.id || multiplayerClient.roomCode === code) return;
      multiplayerClient.disconnect();
      multiplayerClient = null;
      roomPlayers.clear();
      renderRoomRoster();
      renderMapPopulation();
      setLobbyConnection(false, "Connect to the new room code");
    }

    function saveUsername() {
      const username = cleanUsername(usernameInput.value);
      if (username.length < 2) {
        usernameInput.focus();
        return;
      }
      localUsername = username;
      try { localStorage.setItem("powerPlaygroundUsername", username); } catch { /* Private browsing may disable storage. */ }
      usernameOverlay.hidden = true;
      menuUsername.textContent = username;
      playSfx("menuTap");
    }

    saveUsernameButton.addEventListener("click", saveUsername);
    usernameInput.addEventListener("input", () => { usernameInput.value = cleanUsername(usernameInput.value); });
    usernameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") saveUsername(); });

    function setOnlineMode(enabled) {
      onlineMode = enabled;
      onlineLobby.hidden = !enabled;
      onlineOnlyMaps.forEach((button) => { button.hidden = !enabled; });
      if (enabled && !roomCodeInput.value) roomCodeInput.value = createRoomCode();
      if (enabled) rememberRoomCode(roomCodeInput.value);
      renderMapPopulation();
      playSfx("menuTap");
    }

    soloModeButton.addEventListener("click", () => {
      setOnlineMode(false);
      multiplayerClient?.disconnect();
      multiplayerClient = null;
      roomPlayers.clear();
      renderRoomRoster();
      setLobbyConnection(false);
      setMenuStep("hero");
    });
    onlineModeButton.addEventListener("click", () => setOnlineMode(true));
    connectRoomButton.addEventListener("click", () => connectToMultiplayer(true));
    continueOnlineButton.addEventListener("click", () => {
      if (!multiplayerClient?.id) return;
      setMenuStep("hero");
    });
    newRoomButton.addEventListener("click", () => {
      roomCodeInput.value = createRoomCode();
      rememberRoomCode(roomCodeInput.value);
      markRoomCodeForReconnect();
      playSfx("menuTap");
    });
    roomCodeInput.addEventListener("input", () => {
      roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
      rememberRoomCode(roomCodeInput.value);
      markRoomCodeForReconnect();
    });

    document.querySelectorAll(".powerCard").forEach((button) => {
      button.addEventListener("click", () => {
        if (menuLaunching) return;
        startMenuMusic();
        playSfx("menuTap");
        menuSelectedPower = button.dataset.power;
        updatePrototypePanelLabel(menuSelectedPower);
        if (onlineMode && multiplayerClient?.id) {
          multiplayerClient.send({ type: "hello", power: menuSelectedPower, map: "lobby", username: localUsername, icon: localPlayerIcon });
          rememberRoomPlayer({ id: multiplayerClient.id, username: localUsername, icon: localPlayerIcon, power: menuSelectedPower, map: "lobby", health: playerHealth });
        }
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

    backToMode.addEventListener("click", () => {
      if (menuLaunching) return;
      playSfx("menuBack");
      setMenuStep("mode");
    });

    function isTextEntryTarget(target) {
      return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
    }

    function handleSecondaryAbilityKey() {
      if (!gameStarted) return false;
      if (selectedPower === "flight") return requestFlightStrike();
      if (selectedPower === "strength") {
        toggleStrengthGrab();
        broadcastSecondaryAbility();
        return true;
      }
      if (selectedPower === "robot") {
        toggleRobotShield();
        broadcastSecondaryAbility();
        return true;
      }
      if (selectedPower === "teleport") {
        teleportMove();
        broadcastSecondaryAbility();
        return true;
      }
      if (selectedPower === "webs") {
        shootSpiderNet();
        broadcastSecondaryAbility();
        return true;
      }
      broadcastSecondaryAbility();
      return true;
    }

    window.addEventListener("keydown", (event) => {
      if (isTextEntryTarget(event.target)) return;
      if ((event.code === "Tab" || event.key === "Tab") && gameStarted && !event.repeat) {
        event.preventDefault();
        renderPlayerList();
        playerList.hidden = !playerList.hidden;
        return;
      }
      if (event.code === "Escape" && gameStarted && !event.repeat) {
        event.preventDefault();
        if (flightStrikeState) {
          cancelFlightStrike(true);
          showMessage("Aerial strike cancelled", 750);
          return;
        }
        setPaused(!gamePaused);
        return;
      }
      if (localDefeat) {
        event.preventDefault();
        return;
      }
      if (grabbedById) {
        event.preventDefault();
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
      }
      if ((event.code === "ControlLeft" || event.key === "Control") && !event.repeat && gameStarted) {
        toggleShiftLock();
      }
      if (event.code === "KeyV" && !event.repeat && gameStarted) {
        if (!firstPersonMode && !frontViewMode) firstPersonMode = true;
        else if (firstPersonMode) {
          firstPersonMode = false;
          frontViewMode = true;
          cameraYaw = playerGroup.rotation.y;
          cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.18, 0.36);
        }
        else frontViewMode = false;
        showMessage(firstPersonMode ? "First person view" : frontViewMode ? "Front view" : "Third person view", 900);
      }
      if (event.code === "Space" && !event.repeat && gameStarted && selectedPower === "webs") {
        if (webWallWalkActive) jumpOffSpiderWall();
        else if (!isGrounded() && !webSwingActive) beginSpiderSwing();
      }
      if (event.code === "Space" && !event.repeat && gameStarted && selectedPower === "flight") {
        if (isGrounded()) flightJumpArmed = flyMeterCharge >= 0.999;
        else if (!flightMode) toggleFlight();
      }
      if (event.code === "KeyE" && !event.repeat && gameStarted) {
        handleSecondaryAbilityKey();
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ControlLeft", "ControlRight", "KeyE", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (isTextEntryTarget(event.target)) return;
      if (gamePaused || localDefeat) return;
      keys.delete(event.code);
      if (event.code === "Space" && selectedPower === "webs") endSpiderSwing();
    });

    window.addEventListener("blur", () => {
      releaseActiveInputs();
    });

    window.addEventListener("mousedown", (event) => {
      if (!gameStarted || gamePaused || localDefeat) return;
      event.preventDefault();
      if (event.button === 2) {
        rightMouseDragging = true;
        renderShiftLockState();
        return;
      }
      if (event.button === 0) onAbilityDown();
    });

    window.addEventListener("mouseup", (event) => {
      if (gamePaused || localDefeat) return;
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
      if (!gameStarted || gamePaused || localDefeat) return;
      const lockedMouseLook = shiftLockMode || (
        document.pointerLockElement === renderer.domElement && selectedPower === "flight" && flightMode
      );
      if (shiftLockMode) {
        cameraYaw -= event.movementX * 0.003;
        cameraPitch -= event.movementY * 0.0024;
        cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.82, 0.42);
      } else if (lockedMouseLook) {
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
      if (gamePaused || localDefeat) return;
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
