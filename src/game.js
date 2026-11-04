import * as THREE from 'three';
import { CITY } from './city.js';
import { Hero, Goblin, HenchmanDrone, Citizen } from './characters.js';
import { Effects } from './effects.js';

const V = () => new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;
const ease = (t) => t * t * (3 - 2 * t);
const damp = THREE.MathUtils.damp;

const LEVELS = [
  {
    chapter: 'CH. 01 / NEON HEIGHTS',
    shortName: 'NEON HEIGHTS',
    mood: 'sunset',
    timer: 150,
    goblinHealth: 100,
    goblinSpeed: 21,
    bombInterval: 5.2,
    citizens: 3,
    strikeDamage: 25,
    route: [
      [0, 120, 120],
      [0, 114, 60],
      [0, 123, 2],
      [-30, 118, -55],
      [-72, 113, -108],
      [-113, 121, -136],
      [-130, 115, -78],
      [-105, 120, -12],
      [-68, 112, 58],
      [-30, 117, 115],
    ],
    resultTitle: 'NEON HEIGHTS<br /><em>SECURED.</em>',
    resultCopy: 'The Goblin slipped into the smoke, but the skyline is still standing. For now.',
  },
  {
    chapter: 'CH. 02 / MIDNIGHT RUN',
    shortName: 'MIDNIGHT RUN',
    mood: 'night',
    timer: 140,
    goblinHealth: 110,
    goblinSpeed: 25,
    bombInterval: 4.2,
    citizens: 4,
    strikeDamage: 25,
    route: [
      [0, 124, 72],
      [55, 116, 32],
      [95, 122, -25],
      [88, 116, -88],
      [38, 121, -126],
      [-12, 126, -140],
      [-65, 116, -118],
      [-105, 122, -60],
      [-100, 115, 2],
      [-62, 120, 62],
      [-25, 125, 106],
    ],
    resultTitle: 'MIDNIGHT RUN<br /><em>SURVIVED.</em>',
    resultCopy: 'The Goblin is losing altitude — and patience. One last flight above Oscorp will end this.',
  },
  {
    chapter: 'CH. 03 / GOBLIN’S GAMBIT',
    shortName: 'GOBLIN’S GAMBIT',
    mood: 'final',
    timer: 165,
    goblinHealth: 120,
    goblinSpeed: 29,
    bombInterval: 3.4,
    citizens: 4,
    strikeDamage: 25,
    route: [
      [0, 126, 0],
      [45, 118, -45],
      [76, 124, -98],
      [32, 120, -146],
      [-22, 126, -158],
      [-72, 120, -132],
      [-98, 124, -82],
      [-70, 118, -22],
      [-34, 124, 28],
    ],
    resultTitle: 'THE SKY<br /><em>IS YOURS.</em>',
    resultCopy: 'Green Goblin is down. The city gets to see another morning.',
  },
];

const UPGRADES = [
  {
    id: 'health',
    tag: 'ARMOR WEAVE',
    icon: '✚',
    name: 'SPIDER-SENSE',
    description: '+25 maximum health. Your danger sense tingles before the pumpkin bombs land.',
  },
  {
    id: 'stun',
    tag: 'WEB FORMULA',
    icon: '⌁',
    name: 'TENSILE TENSION',
    description: '+35% web-stun duration. The Goblin stays tangled longer, giving you a bigger window to strike.',
  },
  {
    id: 'swing',
    tag: 'MOMENTUM',
    icon: '≈',
    name: 'KINETIC PUMP',
    description: '+18% swing acceleration and a stronger launch. Turn the whole city into your slingshot.',
  },
  {
    id: 'web',
    tag: 'UTILITY BELT',
    icon: '✦',
    name: 'WIDE WEB',
    description: 'Web shots cost less and recharge faster. More thwip, less waiting.',
  },
];

export class Game {
  constructor({ scene, camera, renderer, audio, ui, composer, city }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.audio = audio;
    this.ui = ui;
    this.composer = composer;
    this.city = city;

    this.state = 'title';
    this.pausedFrom = null;
    this.titleTime = 0;
    this.time = 0;
    this.levelIndex = 0;
    this.level = null;
    this.levelStats = null;
    this.run = null;

    this.hero = new Hero(scene);
    this.goblin = new Goblin(scene);
    this.effects = new Effects(scene, camera);

    this.heroStart = CITY;
    this.player = {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      grounded: true,
      surfaceY: 0,
      swinging: false,
      anchor: new THREE.Vector3(),
      ropeLength: 0,
      health: 100,
      maxHealth: 100,
      web: 100,
      invuln: 0,
      dodgeCooldown: 0,
      webCooldown: 0,
      strikeCooldown: 0,
      shootTimer: 0,
      strikeTimer: 0,
      attachCooldown: 0,
      hitTimer: 0,
      facing: Math.PI,
      combo: 0,
      comboWindow: 0,
      bestCombo: 1,
      lastSpeed: 0,
      strikeDash: null,
      zip: null,
    };

    this.goblinState = {
      t: 0,
      health: 100,
      maxHealth: 100,
      stunTimer: 0,
      bombCooldown: 3,
      speed: 22,
      yaw: 0,
      previousYaw: 0,
      bank: 0,
      visible: false,
      bossMode: false,
      bossTimer: 0,
      shockTimer: 6,
      escapeTimer: 0,
      distance: 0,
    };

    this.citizens = [];
    this.pickups = [];
    this.bombs = [];
    this.webBolts = [];
    this.transientWebs = [];
    this.henchman = null;
    this.tutorialStage = 'signal';
    this.chaseStarted = false;
    this.cutscene = null;
    this.introTimer = 0;
    this.delayTimer = 0;
    this.delayedAction = null;
    this.slowmoTimer = 0;
    this.shake = 0;
    this.flashSlowmo = false;
    this.chainIdle = 0;
    this.notificationCooldown = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.12;
    this.cameraDistance = 10.2;
    this.cameraPosition = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.cameraLook = new THREE.Vector3();
    this.lastLookInput = 0;
    this.touchMode = window.matchMedia('(pointer: coarse)').matches;
    this.isMobile = window.matchMedia('(max-width: 640px)').matches;
    this.gamepadButtons = [];
    this.joystick = { active: false, pointerId: null, x: 0, y: 0 };
    this.touchLook = { active: false, pointerId: null, x: 0, y: 0 };
    this.legacyKeys = new Set();
    this.input = {
      swingHeld: false,
      jumpQueued: false,
      keyMove: new THREE.Vector2(),
      gamepadMove: new THREE.Vector2(),
    };
    this.temp = {
      a: V(),
      b: V(),
      c: V(),
      d: V(),
      dir: V(),
      tangent: V(),
    };
    this.routePoints = [];
    this.curve = null;

    this.setupWebLine();
    this.setupInput();
    this.setupUiHandlers();
    this.setupTouch();
    this.prepareTitle();
  }

  setupUiHandlers() {
    this.ui.h = {
      onStart: () => this.startNewRun(),
      onSound: () => this.toggleSound(),
      onSkipCutscene: () => this.skipCutscene(),
      onResultsContinue: () => this.resultsContinue(),
      onUpgrade: (id) => this.chooseUpgrade(id),
      onRetry: () => this.retryLevel(),
      onQuit: () => this.returnToTitle(),
      onPlayAgain: () => this.startNewRun(),
      onResume: () => this.resume(),
      onRestart: () => this.restartLevel(),
      onUiSound: () => this.audio.sfx('ui'),
      isPaused: () => this.state === 'paused',
    };
    this.ui.setSoundLabel(this.audio.muted);
  }

  setupWebLine() {
    const geo = new THREE.BufferGeometry().setFromPoints([V(), V()]);
    this.webLine = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: '#e9f8ff', transparent: true, opacity: 0.95 })
    );
    this.webLine.visible = false;
    this.webLine.frustumCulled = false;
    this.scene.add(this.webLine);

    this.webAnchorGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.effects.glowTexture,
        color: '#d8f5ff',
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.webAnchorGlow.scale.set(3.5, 3.5, 1);
    this.webAnchorGlow.visible = false;
    this.scene.add(this.webAnchorGlow);
  }

  prepareTitle() {
    this.state = 'title';
    this.titleTime = 0;
    this.goblin.root.visible = true;
    this.goblin.root.position.set(-36, 124, -70);
    this.goblin.root.rotation.set(0, 0, 0);
    this.goblin.visual.visible = true;
    this.hero.setPosition(CITY_START());
    this.hero.setFacing(0.28, true);
    this.hero.root.visible = true;
    this.player.position.copy(CITY_START());
    this.player.facing = 0.28;
    this.player.grounded = true;
    this.ui.showTitle();
    this.ui.setCinema(false);
    this.ui.setCutscene(false);
    this.ui.resetRunUi();
    this.ui.hideHud();
    this.audio.setScene({ calm: true });
    this.snapTitleCamera();
  }

  snapTitleCamera() {
    const p = this.player.position;
    const portrait = window.innerWidth / window.innerHeight < 0.85;
    this.camera.position.set(
      p.x + (portrait ? 15 : 22),
      p.y + (portrait ? 7.4 : 9.2),
      p.z + (portrait ? 23 : 28)
    );
    this.cameraLook.set(
      p.x + (portrait ? -1.2 : -5.5),
      p.y + 2.8,
      p.z + (portrait ? -10 : -14)
    );
    this.camera.lookAt(this.cameraLook);
    this.camera.fov = portrait ? 59 : 50;
    this.camera.updateProjectionMatrix();
  }

  startNewRun() {
    this.audio.unlock();
    this.audio.sfx('ui');
    this.state = 'loadingRun';
    this.run = {
      score: 0,
      lives: 3,
      civilians: 0,
      bestCombo: 1,
      upgrades: { health: 0, stun: 0, swing: 0, web: 0 },
      startedAt: performance.now(),
    };
    this.ui.hideTitle();
    this.ui.showHud();
    this.ui.resetRunUi();
    this.startLevel(0, false);
  }

  startLevel(index, retry) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.levelStats = {
      civilians: 0,
      bestCombo: 1,
      elapsed: 0,
      startScore: this.run.score,
      bonus: 0,
    };
    this.timerRemaining = this.level.timer;
    this.bossHover = null;
    this.bossShock = null;
    this._escapeBoom = false;
    this._finalBoom = false;
    this._henchmanScored = false;
    this.chaseStarted = false;
    this.tutorialStage = 'signal';
    this.clearLevelObjects();
    this.setupPath();
    this.spawnPickups();
    this.city.setMood(this.level.mood);
    this.player.position.copy(this.getLevelStart(index));
    this.player.previous.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player.grounded = true;
    this.player.surfaceY = this.player.position.y;
    this.player.health = this.getMaxHealth();
    this.player.maxHealth = this.getMaxHealth();
    this.player.web = 100;
    this.player.invuln = 0;
    this.player.dodgeCooldown = 0;
    this.player.webCooldown = 0;
    this.player.strikeCooldown = 0;
    this.player.shootTimer = 0;
    this.player.strikeTimer = 0;
    this.player.combo = 0;
    this.player.comboWindow = 0;
    this.player.bestCombo = 1;
    this.player.swinging = false;
    this.player.strikeDash = null;
    this.player.zip = null;
    this.input.swingHeld = false;
    this.slowmoTimer = 0;
    this.shake = 0;
    this.ui.setSlowmo(false);
    this.webLine.visible = false;
    this.webAnchorGlow.visible = false;
    this.hero.setPosition(this.player.position);
    this.player.facing = this.getStartYaw(index);
    this.hero.setFacing(this.player.facing, true);
    this.cameraYaw = this.getStartYaw(index) + Math.PI;
    this.cameraPitch = 0.12;
    this.goblin.root.visible = false;
    this.goblinState.visible = false;
    this.goblinState.health = this.level.goblinHealth;
    this.goblinState.maxHealth = this.level.goblinHealth;
    this.goblinState.stunTimer = 0;
    this.goblinState.bossMode = false;
    this.goblinState.bossTimer = 0;
    this.goblinState.shockTimer = 0;
    this.goblinState.escapeTimer = 0;
    this.goblinState.t = 0;
    this.goblinState.speed = this.level.goblinSpeed;
    this.goblinState.distance = 0;
    this.henchman = null;
    this.bombs.forEach((b) => b.mesh && this.scene.remove(b.mesh));
    this.bombs = [];
    this.ui.hidePanels();
    this.ui.setChapter(this.level.chapter, 'GET READY');
    this.ui.setHealth(this.player.health, this.player.maxHealth);
    this.ui.setWeb(this.player.web);
    this.ui.setScore(this.run.score);
    this.ui.setLives(this.run.lives);
    this.ui.setTimer(this.level.timer, false);
    this.ui.showBossBanner(false);
    this.ui.setGoblin(0, 1, 0, false);
    this.ui.setPrompt('', false);
    this.ui.setSpeedLines(false);
    this.ui.setReticleTarget(false);
    this.ui.hideMarker(this.ui.markerWeb);
    this.ui.hideMarker(this.ui.markerCivilian);
    this.ui.hideMarker(this.ui.markerObjective);
    this.snapGameplayCamera();

    if (index === 0 && !retry) {
      this.playOpeningCutscene();
    } else if (index === 1) {
      this.playLevelTwoIntro();
    } else if (index === 2) {
      this.playLevelThreeIntro();
    } else {
      this.playChaseIntro();
    }
  }

  getLevelStart(index) {
    if (index === 0) return CITY_START();
    if (index === 1) {
      const y = this.city.getSurfaceY(CITY.waypoint.x, CITY.waypoint.z, 300);
      return new THREE.Vector3(CITY.waypoint.x, y + 1.2, CITY.waypoint.z);
    }
    const y = this.city.getSurfaceY(-58, -58, 300);
    return new THREE.Vector3(-58, (y || 48) + 1.2, -58);
  }

  getStartYaw(index) {
    if (index === 0) return Math.PI;
    const first = this.curve ? this.curve.getPointAt(0) : new THREE.Vector3(0, 120, 0);
    const dx = first.x - this.player.position.x;
    const dz = first.z - this.player.position.z;
    return Math.atan2(dx, dz);
  }
}

function CITY_START() {
  return new THREE.Vector3(CITY.start.x, CITY.start.top + 1.2, CITY.start.z);
}

Object.assign(Game.prototype, {
  isPlaying() {
    return this.state === 'tutorial' || this.state === 'chase' || this.state === 'boss';
  },

  getMaxHealth() {
    return 100 + (this.run?.upgrades.health || 0) * 25;
  },

  toggleSound() {
    this.audio.setMuted(!this.audio.muted);
    this.ui.setSoundLabel(this.audio.muted);
    if (!this.audio.muted) this.audio.sfx('ui');
  },

  setupInput() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();

      if (code === 'Escape') {
        if (this.state === 'paused') this.resume();
        else if (this.isPlaying()) this.pause();
        else if (this.ui.modal.classList.contains('is-hidden') === false) this.ui.closeModal();
        return;
      }

      if (this.state === 'title') {
        if (code === 'Enter' || code === 'Space') this.startNewRun();
        return;
      }

      if (this.state === 'paused') return;
      if (!this.isPlaying()) return;

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) this.legacyKeys.add(code);

      if (code === 'Space') {
        if (!e.repeat) this.onJumpDown();
        return;
      }
      if (code === 'KeyE') {
        if (!e.repeat) this.fireWeb();
        return;
      }
      if (code === 'KeyF') {
        if (!e.repeat) this.tryStrike();
        return;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        if (!e.repeat) this.dodge();
        return;
      }
      if (code === 'KeyR') {
        if (!e.repeat) this.rescueNearest();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) this.legacyKeys.delete(e.code);
      if (e.code === 'Space') {
        this.input.swingHeld = false;
        if (this.player.swinging) this.releaseWeb(true);
      }
    });

    const canvas = this.renderer.domElement;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (!this.isPlaying() || e.button !== 0) return;
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
        return;
      }
      this.fireWeb();
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (!this.isPlaying()) return;
      this.cameraYaw -= e.movementX * 0.0024;
      this.cameraPitch = clamp(this.cameraPitch + e.movementY * 0.0019, -0.07, 0.82);
      this.lastLookInput = this.time;
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== canvas && this.isPlaying()) {
        // Keep playing; E and the action buttons still work.
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isPlaying()) this.pause();
    });
  },

  setupTouch() {
    const base = document.getElementById('joystickBase');
    const knob = document.getElementById('joystickKnob');
    const radius = 47;

    const updateStick = (e) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joystick.x = dx / radius;
      this.joystick.y = -dy / radius;
    };

    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.joystick.active = true;
      this.joystick.pointerId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      updateStick(e);
    });
    base.addEventListener('pointermove', (e) => {
      if (!this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
      e.preventDefault();
      updateStick(e);
    });
    const releaseStick = (e) => {
      if (e.pointerId !== this.joystick.pointerId) return;
      this.joystick.active = false;
      this.joystick.pointerId = null;
      this.joystick.x = 0;
      this.joystick.y = 0;
      knob.style.transform = 'translate(0px, 0px)';
    };
    base.addEventListener('pointerup', releaseStick);
    base.addEventListener('pointercancel', releaseStick);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || !this.isPlaying()) return;
      this.touchLook.active = true;
      this.touchLook.pointerId = e.pointerId;
      this.touchLook.x = e.clientX;
      this.touchLook.y = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.touchLook.active || e.pointerId !== this.touchLook.pointerId) return;
      const dx = e.clientX - this.touchLook.x;
      const dy = e.clientY - this.touchLook.y;
      this.touchLook.x = e.clientX;
      this.touchLook.y = e.clientY;
      this.cameraYaw -= dx * 0.0042;
      this.cameraPitch = clamp(this.cameraPitch + dy * 0.0032, -0.07, 0.82);
      this.lastLookInput = this.time;
    });
    const releaseLook = (e) => {
      if (e.pointerId !== this.touchLook.pointerId) return;
      this.touchLook.active = false;
      this.touchLook.pointerId = null;
    };
    canvas.addEventListener('pointerup', releaseLook);
    canvas.addEventListener('pointercancel', releaseLook);

    document.querySelectorAll('.touch-btn').forEach((button) => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isPlaying()) return;
        button.classList.add('is-held');
        if (action === 'swing') {
          this.input.swingHeld = true;
          this.onJumpDown();
        } else if (action === 'web') {
          this.fireWeb();
        } else if (action === 'strike') {
          this.tryStrike();
        } else if (action === 'dodge') {
          this.dodge();
        } else if (action === 'rescue') {
          this.rescueNearest();
        }
      });
      const release = (e) => {
        e.preventDefault();
        button.classList.remove('is-held');
        if (action === 'swing') {
          this.input.swingHeld = false;
          if (this.player.swinging) this.releaseWeb(true);
        }
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', (e) => {
        if (action === 'swing' && this.input.swingHeld) {
          this.input.swingHeld = false;
          if (this.player.swinging) this.releaseWeb(true);
          button.classList.remove('is-held');
        }
      });
    });
  },

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && Array.from(pads).find(Boolean);
    if (!pad) return;
    const dead = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    const lx = dead(pad.axes[0] || 0);
    const ly = dead(pad.axes[1] || 0);
    this.input.gamepadMove.set(lx, -ly);
    const rx = dead(pad.axes[2] || 0);
    const ry = dead(pad.axes[3] || 0);
    if (Math.abs(rx) > 0 || Math.abs(ry) > 0) {
      this.cameraYaw -= rx * 0.04;
      this.cameraPitch = clamp(this.cameraPitch + ry * 0.03, -0.07, 0.82);
      this.lastLookInput = this.time;
    }
    if (!this.isPlaying()) return;
    const pressed = (i) => !!pad.buttons[i]?.pressed;
    const prev = this.gamepadButtons;
    const edge = (i) => pressed(i) && !prev[i];
    if (edge(0)) this.onJumpDown();
    if (!pressed(0) && prev[0]) {
      this.input.swingHeld = false;
      if (this.player.swinging) this.releaseWeb(true);
    }
    if (edge(2)) this.fireWeb();
    if (edge(3)) this.tryStrike();
    if (edge(1)) this.dodge();
    if (edge(12)) this.rescueNearest();
    if (edge(9)) this.pause();
    this.gamepadButtons = pad.buttons.map((b) => b.pressed);
  },

  onJumpDown() {
    if (!this.isPlaying()) return;
    this.input.swingHeld = true;
    if (this.player.grounded) {
      this.player.velocity.y = 12.8;
      this.player.grounded = false;
      this.player.surfaceY = 0;
      this.audio.sfx('jump');
      this.effects.dust(this.player.position.clone().setY(this.player.position.y + 0.1), 0.8);
    } else if (!this.player.swinging) {
      this.tryAttachWeb();
    }
  },

  pause() {
    if (!this.isPlaying()) return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    this.ui.showPause(true);
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.audio.sfx('ui');
  },

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.pausedFrom || 'chase';
    this.pausedFrom = null;
    this.ui.showPause(false);
    this.audio.sfx('ui');
  },

  restartLevel() {
    if (!this.level) return;
    this.ui.showPause(false);
    this.ui.hidePanels();
    this.startLevel(this.levelIndex, true);
  },

  retryLevel() {
    this.ui.hidePanels();
    if (!this.run || this.run.lives <= 0) {
      this.startNewRun();
      return;
    }
    this.startLevel(this.levelIndex, true);
  },

  returnToTitle() {
    this.ui.hidePanels();
    this.ui.showPause(false);
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.clearLevelObjects();
    this.state = 'title';
    this.prepareTitle();
    this.audio.setScene({ calm: true });
  },

  clearLevelObjects() {
    if (this.henchman) {
      this.scene.remove(this.henchman.root);
      this.henchman = null;
    }
    this.citizens.forEach((citizen) => this.scene.remove(citizen.root));
    this.citizens = [];
    this.pickups.forEach((pickup) => this.scene.remove(pickup.group));
    this.pickups = [];
    this.bombs.forEach((bomb) => this.scene.remove(bomb.mesh));
    this.bombs = [];
    this.webBolts.forEach((bolt) => this.scene.remove(bolt.line));
    this.webBolts = [];
    this.transientWebs.forEach((web) => this.scene.remove(web.line));
    this.transientWebs = [];
    this.webLine.visible = false;
    this.webAnchorGlow.visible = false;
    this.goblin.root.visible = false;
    this.ui.showBossBanner(false);
    this.ui.hideMarker(this.ui.markerWeb);
    this.ui.hideMarker(this.ui.markerCivilian);
    this.ui.hideMarker(this.ui.markerObjective);
  },

  setupPath() {
    this.routePoints = this.level.route.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.curve = new THREE.CatmullRomCurve3(this.routePoints, true, 'catmullrom', 0.5);
    this.curve.arcLengthDivisions = 300;
    this.pathLength = this.curve.getLength();
    this.spawnCitizens();
  },

  spawnCitizens() {
    this.citizens = [];
    const positions = this.city.getRoofCandidate(this.routePoints, this.level.citizens, this.levelIndex * 2 + 1);
    positions.forEach((position, index) => {
      const p = position.clone();
      p.y = this.city.getSurfaceY(p.x, p.z, 300) + 0.12;
      const citizen = new Citizen(this.scene, p, index + this.levelIndex);
      this.citizens.push(citizen);
    });
  },

  spawnPickups() {
    this.pickups = [];
    const types = ['health', 'web', 'health', 'web'];
    let built = 0;
    for (let i = 0; i < this.routePoints.length && built < types.length; i += 2) {
      const point = this.routePoints[i];
      const surfaceY = this.city.getSurfaceY(point.x, point.z, 320);
      if (surfaceY < 12) continue;
      const type = types[built];
      const accent = type === 'health' ? '#5dff9c' : '#70e7ff';
      const group = new THREE.Group();
      group.position.set(point.x, surfaceY + 2.2, point.z);

      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.68, 0),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: new THREE.Color(accent),
          emissiveIntensity: 1.5,
          metalness: 0.3,
          roughness: 0.25,
        })
      );
      core.rotation.z = Math.PI / 4;
      group.add(core);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.045, 6, 24),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.effects.glowTexture,
          color: accent,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.scale.set(5.2, 5.2, 1);
      group.add(halo);
      this.scene.add(group);

      this.pickups.push({
        group,
        core,
        ring,
        type,
        baseY: group.position.y,
        phase: Math.random() * Math.PI * 2,
        collected: false,
      });
      built += 1;
    }
  },

  updatePickups(dt) {
    if (!this.pickups.length) return;
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      if (pickup.collected) continue;
      pickup.phase += dt * 2.2;
      pickup.group.rotation.y += dt * 1.8;
      pickup.core.rotation.x += dt * 2.4;
      pickup.ring.rotation.z -= dt * 1.2;
      pickup.group.position.y = pickup.baseY + Math.sin(pickup.phase) * 0.28;

      if (p.position.distanceTo(pickup.group.position) < 4.2) {
        pickup.collected = true;
        if (pickup.type === 'health') {
          p.health = Math.min(p.maxHealth, p.health + 30);
          p.web = Math.min(100, p.web + 10);
          this.ui.toast('BIO-MESH · +30 HEALTH', 'is-green');
        } else {
          p.web = Math.min(100, p.web + 45);
          p.health = Math.min(p.maxHealth, p.health + 8);
          this.ui.toast('WEB CAPSULE · +45 FLUID', 'is-score');
        }
        this.registerHit(150, 'POWER-UP', 'is-green');
        this.effects.impact(pickup.group.position.clone(), pickup.type === 'health' ? '#5dff9c' : '#70e7ff', 18, 1.2);
        this.effects.shockwave(pickup.group.position.clone(), pickup.type === 'health' ? '#5dff9c' : '#70e7ff', 0.55);
        this.audio.sfx('rescue', 0.75);
        this.scene.remove(pickup.group);
        this.pickups.splice(i, 1);
      }
    }
  },

  beginChase() {
    this.state = 'chase';
    this.chaseStarted = true;
    this.ui.showHud();
    this.ui.setCinema(false);
    this.ui.setCutscene(false);
    this.ui.setChapter(this.level.chapter, 'TAKE DOWN THE GREEN GOBLIN');
    this.ui.setTimer(this.level.timer, true);
    this.ui.showBossBanner(false);
    this.ui.setGoblin(this.goblinState.health, this.goblinState.maxHealth, this.goblinState.distance, true);
    this.goblin.root.visible = true;
    this.goblinState.visible = true;
    this.goblinState.t = 0;
    this.goblinState.speed = this.level.goblinSpeed;
    this.goblinState.bombCooldown = 2.8;
    this.goblinState.stunTimer = 0;
    this.goblinState.bossMode = false;
    this.goblinState.escapeTimer = 0;
    this.audio.setScene({ chase: true });
    this.audio.sfx('laugh', 0.8);
    this.ui.toast('CHASE START', 'is-red');
    this.delayedAction = null;
    this.cameraYaw = this.player.facing + Math.PI;
  },

  startCutscene(beats, onEnd, chapter) {
    this.state = 'cutscene';
    this.ui.hideHud();
    this.ui.setCinema(true);
    this.ui.setCutscene(true);
    this.ui.setCutsceneText(chapter, '');
    this.ui.setPrompt('', false);
    this.audio.setScene({ calm: true });
    this.cutscene = {
      beats,
      total: beats.reduce((sum, beat) => sum + beat.duration, 0),
      elapsed: 0,
      beatIndex: -1,
      onEnd,
      chapter,
      onUpdate: null,
      finished: false,
    };
  },

  updateCutscene(dt) {
    if (!this.cutscene) return;
    const c = this.cutscene;
    c.elapsed += dt;

    let accumulated = 0;
    let activeIndex = 0;
    for (let i = 0; i < c.beats.length; i++) {
      if (c.elapsed < accumulated + c.beats[i].duration || i === c.beats.length - 1) {
        activeIndex = i;
        break;
      }
      accumulated += c.beats[i].duration;
    }

    if (activeIndex !== c.beatIndex) {
      c.beatIndex = activeIndex;
      const beat = c.beats[activeIndex];
      if (beat.text) this.ui.setCutsceneText(c.chapter, beat.text);
      if (beat.onStart) beat.onStart();
    }

    const beat = c.beats[activeIndex];
    const local = clamp((c.elapsed - accumulated) / beat.duration, 0, 1);
    const t = ease(local);
    if (beat.from && beat.to) {
      this.camera.position.lerpVectors(beat.from, beat.to, t);
    }
    if (beat.targetFrom && beat.targetTo) {
      this.cameraLook.lerpVectors(beat.targetFrom, beat.targetTo, t);
    }
    this.camera.lookAt(this.cameraLook);
    if (beat.fov) {
      this.camera.fov = THREE.MathUtils.lerp(beat.fov[0], beat.fov[1], t);
      this.camera.updateProjectionMatrix();
    }
    if (c.onUpdate) c.onUpdate(c.elapsed, local, activeIndex);

    if (c.elapsed >= c.total) {
      this.finishCutscene(false);
    }
  },

  skipCutscene() {
    if (this.state === 'cutscene') this.finishCutscene(true);
  },

  finishCutscene(skipped) {
    if (!this.cutscene || this.cutscene.finished) return;
    this.cutscene.finished = true;
    const callback = this.cutscene.onEnd;
    this.cutscene = null;
    this.ui.setCutscene(false);
    this.ui.setCinema(false);
    this.ui.setCutsceneText('', '');
    if (callback) callback(skipped);
  },

  snapGameplayCamera() {
    const target = this.player.position.clone().add(new THREE.Vector3(0, 1.9, 0));
    const horizontal = Math.cos(this.cameraPitch) * this.cameraDistance;
    this.camera.position.set(
      target.x + Math.sin(this.cameraYaw) * horizontal,
      target.y + Math.sin(this.cameraPitch) * this.cameraDistance + 1.15,
      target.z + Math.cos(this.cameraYaw) * horizontal
    );
    this.cameraLook.copy(target);
    this.camera.lookAt(target);
    this.camera.fov = 68;
    this.camera.updateProjectionMatrix();
    this.cameraPosition.copy(this.camera.position);
    this.cameraTarget.copy(target);
  },

  chooseUpgradeCards() {
    // Two chapter clears mean two choices. Keep the card set readable and varied.
    const order = [...UPGRADES];
    const rotate = this.levelIndex % order.length;
    return [...order.slice(rotate), ...order.slice(0, rotate)].slice(0, 3);
  },

  resultsContinue() {
    this.ui.hidePanels();
    this.ui.showUpgrades(this.chooseUpgradeCards());
    this.audio.sfx('ui');
  },

  chooseUpgrade(id) {
    if (!this.run) return;
    this.run.upgrades[id] = (this.run.upgrades[id] || 0) + 1;
    this.audio.sfx('rescue');
    this.ui.hidePanels();
    const next = this.levelIndex + 1;
    if (next < LEVELS.length) this.startLevel(next, false);
  },

  finishLevel() {
    if (this.state === 'cutscene' || this.state === 'results') return;
    const timeBonus = Math.max(0, Math.round(this.timerRemaining || 0)) * 18;
    const civilianBonus = this.levelStats.civilians * 250;
    this.levelStats.bonus = timeBonus + civilianBonus;
    this.run.score += this.levelStats.bonus;
    this.run.civilians += this.levelStats.civilians;
    this.run.bestCombo = Math.max(this.run.bestCombo, this.levelStats.bestCombo);
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
    this.run.lives = Math.min(3, this.run.lives + 1);
    this.ui.setLives(this.run.lives);
    this.audio.setScene({ calm: true });
    this.ui.hideHud();
    this.ui.setPrompt('', false);
    this.audio.sfx('win');
    this.player.swinging = false;
    this.input.swingHeld = false;
    this.webLine.visible = false;
    this.goblinState.stunTimer = 0;
    this.bombs.forEach((bomb) => this.scene.remove(bomb.mesh));
    this.bombs = [];

    if (this.levelIndex < 2) {
      this.playEscapeCutscene();
    } else {
      this.playFinalCutscene();
    }
  },

  showResults() {
    this.state = 'results';
    this.ui.showResults({
      eyebrow: 'CHAPTER CLEAR',
      title: this.level.resultTitle,
      copy: this.level.resultCopy,
      score: this.run.score,
      civilians: `${this.levelStats.civilians}/${this.level.citizens}`,
      bestCombo: this.levelStats.bestCombo,
      time: formatTime(this.levelStats.elapsed),
    });
    this.audio.setScene({ calm: true });
  },

  showVictory() {
    this.state = 'victory';
    const score = this.run.score;
    const rank = score > 42000 ? 'S' : score > 30000 ? 'A' : score > 18000 ? 'B' : 'C';
    this.ui.showVictory({
      score,
      civilians: `${this.run.civilians}`,
      rank,
    });
    this.city.setMood('dawn');
    this.audio.setScene({ calm: true });
    this.audio.sfx('win');
  },

  failLevel(reason) {
    if (!this.isPlaying()) return;
    this.state = 'fail';
    this.run.lives = Math.max(0, this.run.lives - 1);
    this.player.swinging = false;
    this.player.velocity.set(0, 0, 0);
    this.webLine.visible = false;
    this.input.swingHeld = false;
    this.bombs.forEach((bomb) => this.scene.remove(bomb.mesh));
    this.bombs = [];
    if (document.pointerLockElement) document.exitPointerLock?.();
    const titles = {
      health: 'YOU’RE<br /><em>DOWN.</em>',
      escape: 'THE GOBLIN<br /><em>GOT AWAY.</em>',
      time: 'TOO<br /><em>SLOW.</em>',
    };
    const copies = {
      health: 'The city needs you back on your feet. Shake it off and swing again.',
      escape: 'He slipped beyond the skyline. Get back in the air and cut him off.',
      time: 'The trail went cold. Next time, use the rooftops and keep the pressure on.',
    };
    this.ui.setLives(this.run.lives);
    this.ui.showFail({ title: titles[reason] || titles.health, copy: copies[reason] || copies.health, lives: this.run.lives });
    this.audio.sfx('fail');
    this.audio.setScene({ calm: true });
  },
});

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

Object.assign(Game.prototype, {
  playOpeningCutscene() {
    const h = this.player.position.clone();
    const goblinPos = new THREE.Vector3(10, 132, 16);
    this.goblin.root.visible = false;
    const beats = [
      {
        duration: 3.4,
        from: new THREE.Vector3(152, 158, 322),
        to: new THREE.Vector3(94, 125, 232),
        targetFrom: new THREE.Vector3(0, 78, 20),
        targetTo: new THREE.Vector3(0, 82, 15),
        fov: [55, 50],
        text: 'NEW YORK CITY. 8:42 PM.',
      },
      {
        duration: 3.1,
        from: new THREE.Vector3(h.x + 24, h.y + 10, h.z + 30),
        to: new THREE.Vector3(h.x + 17, h.y + 7, h.z + 21),
        targetFrom: h.clone().add(new THREE.Vector3(-4, 2.6, -4)),
        targetTo: h.clone().add(new THREE.Vector3(-3, 2.2, -7)),
        fov: [46, 42],
        text: 'ONE HERO. ONE CITY. ONE VERY BAD NIGHT.',
      },
      {
        duration: 3.3,
        from: new THREE.Vector3(78, 111, 151),
        to: new THREE.Vector3(65, 103, 132),
        targetFrom: goblinPos.clone(),
        targetTo: goblinPos.clone().add(new THREE.Vector3(6, -2, -8)),
        fov: [42, 47],
        text: 'THE GREEN GOBLIN OWNS THE SKYLINE.',
        onStart: () => {
          this.goblin.root.visible = true;
          this.goblin.root.position.copy(goblinPos);
          this.goblin.visual.rotation.y = 2.2;
          this.goblin.visual.rotation.z = 0.18;
          this.effects.explosion(new THREE.Vector3(12, 99, 35), 1.6);
          this.audio.sfx('explosion', 0.8);
          this.audio.sfx('laugh', 0.9);
          this.addShake(0.28);
        },
      },
      {
        duration: 2.6,
        from: new THREE.Vector3(h.x + 14, h.y + 7, h.z + 24),
        to: new THREE.Vector3(h.x + 10, h.y + 6, h.z + 20),
        targetFrom: new THREE.Vector3(0, 91, 86),
        targetTo: new THREE.Vector3(0, 89, 60),
        fov: [58, 60],
        text: 'GET TO THE SIGNAL. THEN TAKE BACK THE NIGHT.',
        onStart: () => {
          this.goblin.root.visible = false;
        },
      },
    ];

    this.startCutscene(beats, () => {
      this.goblin.root.visible = false;
      this.goblinState.visible = false;
      this.state = 'tutorial';
      this.tutorialStage = 'signal';
      this.ui.showHud();
      this.ui.setChapter(this.level.chapter, 'SWING TO THE ROOFTOP SIGNAL');
      this.ui.setTimer(this.level.timer, false);
      this.ui.setPrompt('<kbd>SPACE</kbd><span>JUMP · HOLD TO SWING</span>', true);
      this.cameraYaw = this.hero.root.rotation.y + Math.PI;
      this.cameraPitch = 0.12;
      this.snapGameplayCamera();
      this.audio.setScene({ chase: false, calm: true });
    }, 'CHAPTER 01 / NEON HEIGHTS');
  },

  playLevelTwoIntro() {
    const h = this.player.position.clone();
    this.goblin.root.visible = true;
    this.goblinState.visible = true;
    this.goblinState.t = 0;
    this.updateGoblinVisual(0, true);
    const first = this.curve.getPointAt(0);
    const beats = [
      {
        duration: 2.7,
        from: new THREE.Vector3(h.x + 19, h.y + 8, h.z + 22),
        to: new THREE.Vector3(h.x + 12, h.y + 5, h.z + 16),
        targetFrom: h.clone().add(new THREE.Vector3(0, 2, -30)),
        targetTo: new THREE.Vector3(first.x, first.y, first.z),
        fov: [60, 52],
        text: 'MIDNIGHT. THE GOBLIN IS HEADED FOR THE FINANCIAL DISTRICT.',
        onStart: () => this.audio.sfx('laugh', 0.7),
      },
      {
        duration: 2.4,
        from: new THREE.Vector3(h.x + 12, h.y + 6, h.z + 18),
        to: new THREE.Vector3(h.x + 10, h.y + 5, h.z + 16),
        targetFrom: new THREE.Vector3(first.x, first.y, first.z),
        targetTo: new THREE.Vector3(first.x + 12, first.y - 4, first.z - 20),
        fov: [54, 62],
        text: 'KEEP HIM IN SIGHT. KEEP THE CITY ALIVE.',
      },
    ];
    this.startCutscene(beats, () => this.beginChase(), 'CHAPTER 02 / MIDNIGHT RUN');
  },

  playLevelThreeIntro() {
    const h = this.player.position.clone();
    this.goblin.root.visible = true;
    this.goblinState.visible = true;
    this.goblinState.t = 0;
    this.updateGoblinVisual(0, true);
    const first = this.curve.getPointAt(0);
    const boss = this.city.getBossPosition();
    const beats = [
      {
        duration: 2.8,
        from: new THREE.Vector3(95, 142, -45),
        to: new THREE.Vector3(52, 124, -56),
        targetFrom: boss.clone(),
        targetTo: first.clone(),
        fov: [58, 50],
        text: 'OSCORP TOWER. THE GOBLIN’S LAST ROOFTOP.',
      },
      {
        duration: 2.5,
        from: new THREE.Vector3(h.x + 17, h.y + 8, h.z + 21),
        to: new THREE.Vector3(h.x + 12, h.y + 5, h.z + 17),
        targetFrom: h.clone().add(new THREE.Vector3(0, 2, -40)),
        targetTo: new THREE.Vector3(first.x, first.y, first.z),
        fov: [58, 50],
        text: 'NO MORE RUNNING. END THIS ABOVE THE CITY.',
        onStart: () => this.audio.sfx('laugh', 0.85),
      },
    ];
    this.startCutscene(beats, () => this.beginChase(), 'CHAPTER 03 / GOBLIN’S GAMBIT');
  },

  playChaseIntro() {
    this.ui.hidePanels();
    this.ui.showHud();
    this.goblin.root.visible = true;
    this.goblinState.visible = true;
    this.updateGoblinVisual(0, true);
    this.snapGameplayCamera();
    this.beginChase();
  },

  spawnHenchman() {
    if (this.henchman) return;
    const dir = new THREE.Vector3(Math.sin(this.hero.root.rotation.y), 0, Math.cos(this.hero.root.rotation.y));
    const position = this.player.position.clone().addScaledVector(dir, 27);
    position.y += 13;
    this.henchman = new HenchmanDrone(this.scene, position);
    this.ui.toast('SCOUT INBOUND', 'is-red');
    this.audio.sfx('laugh', 0.45);
    this.ui.setChapter(this.level.chapter, 'WEB THE GOBLIN SCOUT');
    this.ui.setPrompt('<kbd>E</kbd><span>WEB SHOT · STOP THE SCOUT</span>', true);
    this.addShake(0.18);
  },

  updateTutorial(dt) {
    if (this.tutorialStage === 'signal') {
      const target = this.city.getWaypointPosition();
      const dist = Math.hypot(this.player.position.x - target.x, this.player.position.z - target.z);
      this.ui.setChapter(this.level.chapter, 'SWING TO THE ROOFTOP SIGNAL');
      if (dist < 17) {
        this.tutorialStage = 'henchman';
        this.spawnHenchman();
        this.effects.impact(target, '#ffcf5c', 20, 1.4);
        this.addShake(0.25);
        this.ui.toast('SIGNAL REACHED', 'is-green');
      }
    } else if (this.tutorialStage === 'henchman') {
      if (this.henchman) {
        this.ui.setChapter(this.level.chapter, 'WEB THE GOBLIN SCOUT');
        if (this.henchman.captured && this.henchman.capturedTimer > 1.4) {
          this.tutorialStage = 'goblin';
          this.playGoblinRevealCutscene();
        }
      }
    }
  },

  playGoblinRevealCutscene() {
    this.ui.showBossBanner(false);
    this.ui.setPrompt('', false);
    const h = this.player.position.clone();
    const forward = new THREE.Vector3(Math.sin(this.hero.root.rotation.y), 0, Math.cos(this.hero.root.rotation.y));
    const near = h.clone().addScaledVector(forward, 42).add(new THREE.Vector3(0, 28, 0));
    this.goblin.root.visible = true;
    this.goblin.root.position.copy(near);
    this.goblin.visual.rotation.y = this.hero.root.rotation.y + Math.PI;
    this.goblinState.visible = true;
    const beats = [
      {
        duration: 2.5,
        from: near.clone().add(new THREE.Vector3(12, 4, 16)),
        to: near.clone().add(new THREE.Vector3(7, 2, 9)),
        targetFrom: near.clone(),
        targetTo: near.clone().add(new THREE.Vector3(0, 1, -8)),
        fov: [42, 47],
        text: 'WELL, WELL... THE SPIDER CAME OUT TO PLAY.',
        onStart: () => {
          this.audio.sfx('laugh', 1);
          this.addShake(0.2);
        },
      },
      {
        duration: 2.3,
        from: new THREE.Vector3(h.x + 16, h.y + 8, h.z + 22),
        to: new THREE.Vector3(h.x + 11, h.y + 5, h.z + 16),
        targetFrom: near.clone(),
        targetTo: near.clone().add(new THREE.Vector3(6, -8, -14)),
        fov: [48, 58],
        text: 'YOU WANT THE CITY? COME AND TAKE IT.',
        onStart: () => {
          const blast = h.clone().addScaledVector(forward, 38).add(new THREE.Vector3(0, 9, 0));
          this.effects.explosion(blast, 1.3);
          this.audio.sfx('explosion', 0.75);
          this.addShake(0.32);
        },
      },
      {
        duration: 2.0,
        from: new THREE.Vector3(h.x + 12, h.y + 6, h.z + 20),
        to: new THREE.Vector3(h.x + 10, h.y + 5, h.z + 17),
        targetFrom: h.clone().addScaledVector(forward, 35).add(new THREE.Vector3(0, 8, 0)),
        targetTo: h.clone().addScaledVector(forward, 90).add(new THREE.Vector3(0, 18, 0)),
        fov: [60, 66],
        text: 'CHASE HIM. WEB HIM. END THIS.',
      },
    ];
    this.startCutscene(beats, () => {
      this.goblin.root.visible = true;
      this.updateGoblinVisual(0, true);
      this.beginChase();
    }, 'CHAPTER 01 / NEON HEIGHTS');
  },

  playEscapeCutscene() {
    const g = this.goblin.root.position.clone();
    const h = this.player.position.clone();
    this.startCutscene(
      [
        {
          duration: 2.4,
          from: g.clone().add(new THREE.Vector3(12, 5, 15)),
          to: g.clone().add(new THREE.Vector3(6, 2, 8)),
          targetFrom: g.clone(),
          targetTo: g.clone().add(new THREE.Vector3(0, 1, -6)),
          fov: [40, 48],
          text: 'NO... NOT MY GLIDER!',
        },
        {
          duration: 3.2,
          from: g.clone().add(new THREE.Vector3(14, 9, 24)),
          to: g.clone().add(new THREE.Vector3(40, 28, 58)),
          targetFrom: g.clone(),
          targetTo: g.clone().add(new THREE.Vector3(-35, 8, -120)),
          fov: [52, 62],
          text: 'YOU HAVEN’T SEEN THE LAST OF ME, SPIDER-MAN!',
        },
        {
          duration: 2.4,
          from: new THREE.Vector3(h.x + 15, h.y + 7, h.z + 21),
          to: new THREE.Vector3(h.x + 11, h.y + 5, h.z + 17),
          targetFrom: new THREE.Vector3(0, 106, 30),
          targetTo: new THREE.Vector3(0, 98, -10),
          fov: [58, 62],
          text: 'CITY SAVED. FOR NOW.',
        },
      ],
      () => this.showResults(),
      this.level.chapter
    );

    this.cutscene.onUpdate = (elapsed, local, index) => {
      if (index === 0) {
        this.goblin.visual.rotation.z = Math.sin(elapsed * 18) * 0.35;
        this.goblin.visual.rotation.x = Math.sin(elapsed * 9) * 0.12;
        this.effects.trail('escape-smoke', this.goblin.root.position, '#76ff64', { interval: 0.04, count: 2, speed: 2.5 });
        this.effects.trail('escape-smoke2', this.goblin.root.position, '#ff9f3d', { interval: 0.06, count: 1, speed: 2 });
      } else if (index === 1) {
        this.goblin.root.position.set(
          g.x + local * 65,
          g.y + local * 26,
          g.z - local * 160
        );
        this.goblin.visual.rotation.z = 0.3 + local * 0.6;
        this.goblin.visual.rotation.x = -0.2;
        this.effects.trail('escape-smoke', this.goblin.root.position, '#ff8c38', { interval: 0.035, count: 2, speed: 2.4 });
        if (local > 0.55 && !this._escapeBoom) {
          this._escapeBoom = true;
          this.effects.explosion(this.goblin.root.position.clone(), 1.2);
          this.audio.sfx('explosion', 0.8);
        }
      }
    };
  },

  playFinalCutscene() {
    const g = this.goblin.root.position.clone();
    const h = this.player.position.clone();
    this.startCutscene(
      [
        {
          duration: 2.8,
          from: g.clone().add(new THREE.Vector3(15, 8, 18)),
          to: g.clone().add(new THREE.Vector3(6, 3, 7)),
          targetFrom: g.clone(),
          targetTo: g.clone().add(new THREE.Vector3(0, -4, -4)),
          fov: [40, 49],
          text: 'THIS ENDS HERE, GOBLIN.',
          onStart: () => {
            this.audio.sfx('strike');
            this.effects.explosion(g, 1.1);
            this.addShake(0.5);
          },
        },
        {
          duration: 3.4,
          from: g.clone().add(new THREE.Vector3(18, 12, 26)),
          to: g.clone().add(new THREE.Vector3(32, 20, 48)),
          targetFrom: g.clone(),
          targetTo: g.clone().add(new THREE.Vector3(-12, -62, -34)),
          fov: [52, 65],
          text: 'THE GOBLIN IS DOWN. THE CITY IS SAFE.',
        },
        {
          duration: 4.2,
          from: new THREE.Vector3(70, 115, 108),
          to: new THREE.Vector3(38, 100, 70),
          targetFrom: new THREE.Vector3(0, 92, -30),
          targetTo: new THREE.Vector3(-10, 108, -130),
          fov: [54, 58],
          text: 'THE SUN COMES UP OVER NEW YORK.',
          onStart: () => {
            this.city.setMood('dawn');
            this.audio.sfx('win', 1);
          },
        },
      ],
      () => this.showVictory(),
      'EPILOGUE / DAWN'
    );

    this.cutscene.onUpdate = (elapsed, local, index) => {
      if (index === 0) {
        this.goblin.visual.rotation.z = Math.sin(elapsed * 20) * 0.4;
        this.goblin.visual.rotation.x = Math.sin(elapsed * 11) * 0.2;
        this.effects.trail('final-smoke', this.goblin.root.position, '#ff9f3d', { interval: 0.03, count: 2, speed: 2.2 });
      } else if (index === 1) {
        this.goblin.root.position.set(g.x + local * 12, g.y - local * local * 105, g.z - local * 34);
        this.goblin.visual.rotation.z = 0.5 + local * 2.2;
        this.goblin.visual.rotation.x = -0.4 - local * 1.8;
        this.effects.trail('final-smoke', this.goblin.root.position, '#ff6c2d', { interval: 0.025, count: 2, speed: 3 });
        if (local > 0.8 && !this._finalBoom) {
          this._finalBoom = true;
          this.effects.explosion(this.goblin.root.position.clone().setY(Math.max(4, this.goblin.root.position.y)), 2);
          this.audio.sfx('explosion', 1);
          this.addShake(0.8);
        }
      }
    };
  },
});

Object.assign(Game.prototype, {
  update(rawDt) {
    const dt = Math.min(rawDt, 0.05);
    this.time += dt;
    this.city.update(dt, this.time);
    this.pollGamepad();

    if (this.state === 'paused') return;

    this.effects.update(dt);

    if (this.slowmoTimer > 0) {
      this.slowmoTimer = Math.max(0, this.slowmoTimer - dt);
      this.ui.setSlowmo(true);
    } else {
      this.ui.setSlowmo(false);
    }

    if (this.state === 'title') {
      this.updateTitle(dt);
      return;
    }

    if (this.state === 'cutscene') {
      this.updateCutscene(dt);
      this.updateHeroVisual(dt, true);
      return;
    }

    if (this.isPlaying()) {
      this.updateGameplay(dt);
      return;
    }

    this.updateHeroVisual(dt, true);
  },

  updateTitle(dt) {
    this.titleTime += dt;
    const p = this.player.position;
    const orbit = this.titleTime * 0.06;
    const portrait = window.innerWidth / window.innerHeight < 0.85;
    this.camera.position.set(
      p.x + (portrait ? 4.8 : 6.4) + Math.sin(orbit) * 0.35,
      p.y + (portrait ? 3.4 : 3.8),
      p.z + (portrait ? 10.4 : 8.2) + Math.cos(orbit) * 0.25
    );
    const forward = p.clone().sub(this.camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    this.cameraLook.copy(p).add(new THREE.Vector3(0, 1.25, 0)).addScaledVector(right, portrait ? -0.6 : -2.55);
    this.camera.lookAt(this.cameraLook);
    this.camera.fov = portrait ? 54 : 44;
    this.camera.updateProjectionMatrix();

    this.goblin.root.visible = true;
    const gt = this.titleTime * 0.09;
    const gx = -36 + Math.sin(gt) * 54;
    const gz = -70 + Math.cos(gt * 0.8) * 38;
    this.goblin.root.position.set(gx, 126 + Math.sin(gt * 1.4) * 3, gz);
    this.goblin.update(dt, {
      yaw: gt + Math.PI * 0.5,
      bank: 0.25,
      bobPhase: 0.4,
      stunned: false,
      boss: false,
    });
    this.effects.trail('title-goblin', this.goblin.root.position.clone().add(new THREE.Vector3(0, -1, 2)), '#76ff64', {
      interval: 0.09,
      count: 1,
      speed: 1.1,
      life: 0.8,
      gravity: 0.1,
    });
    this.updateHeroVisual(dt, true);
  },

  updateGameplay(rawDt) {
    this.levelStats.elapsed += rawDt;
    const scale = this.slowmoTimer > 0 ? 0.28 : 1;
    const dt = rawDt * scale;

    this.updatePlayer(dt, rawDt);
    this.updateGoblin(dt, rawDt);
    this.updateBossShockAndState(rawDt);
    this.updateHenchman(rawDt);
    this.updateBombs(dt);
    this.updateWebBolts(dt);
    this.updateTransientWebs(rawDt);
    this.updateCitizens(rawDt);
    this.updatePickups(rawDt);
    this.updateChaseRules(rawDt);
    if (this.state === 'tutorial') this.updateTutorial(rawDt);
    this.updateCamera(rawDt);
    this.updateHeroVisual(rawDt);
    this.updateWebLine();
    this.updateUi();

    if (this.delayedAction) {
      this.delayTimer -= rawDt;
      if (this.delayTimer <= 0) {
        const action = this.delayedAction;
        this.delayedAction = null;
        action();
      }
    }
  },

  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.legacyKeys.has('KeyD')) x += 1;
    if (this.legacyKeys.has('KeyA')) x -= 1;
    if (this.legacyKeys.has('KeyW')) y += 1;
    if (this.legacyKeys.has('KeyS')) y -= 1;

    x += this.joystick.x;
    y += this.joystick.y;
    x += this.input.gamepadMove.x;
    y += this.input.gamepadMove.y;

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    const fwdX = -Math.sin(this.cameraYaw);
    const fwdZ = -Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw);
    const rightZ = -Math.sin(this.cameraYaw);
    return new THREE.Vector2(fwdX * y + rightX * x, fwdZ * y + rightZ * x);
  },

  updatePlayer(dt, rawDt) {
    const p = this.player;
    p.previous.copy(p.position);
    p.invuln = Math.max(0, p.invuln - rawDt);
    p.dodgeCooldown = Math.max(0, p.dodgeCooldown - rawDt);
    p.webCooldown = Math.max(0, p.webCooldown - rawDt);
    p.strikeCooldown = Math.max(0, p.strikeCooldown - rawDt);
    p.shootTimer = Math.max(0, p.shootTimer - rawDt);
    p.strikeTimer = Math.max(0, p.strikeTimer - rawDt);
    p.attachCooldown = Math.max(0, p.attachCooldown - rawDt);
    p.hitTimer = Math.max(0, p.hitTimer - rawDt);

    if (p.strikeDash) {
      this.updateStrikeDash(rawDt);
      p.position.copy(this.hero.root.position);
      p.velocity.set(0, 0, 0);
      p.grounded = false;
      return;
    }

    const move = this.getMoveVector();

    // While holding the swing button, automatically fire a line once airborne.
    if (this.input.swingHeld && !p.swinging && !p.grounded && p.attachCooldown <= 0) {
      this.tryAttachWeb();
    }

    if (p.swinging) {
      const swingBoost = 1 + (this.run.upgrades.swing || 0) * 0.18;
      const gravity = p.velocity.y > 0 ? 23 : 27;
      p.velocity.y -= gravity * dt;
      if (move.lengthSq() > 0.01) {
        p.velocity.x += move.x * 15 * swingBoost * dt;
        p.velocity.z += move.y * 15 * swingBoost * dt;
      }
      // A tiny forward assist keeps the arc readable and fun.
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      p.velocity.x += forward.x * 2.1 * dt;
      p.velocity.z += forward.z * 2.1 * dt;
      p.velocity.x *= Math.pow(0.999, dt * 60);
      p.velocity.z *= Math.pow(0.999, dt * 60);

      p.position.addScaledVector(p.velocity, dt);

      const toAnchor = this.temp.a.copy(p.position).sub(p.anchor);
      const dist = toAnchor.length();
      if (dist > p.ropeLength) {
        toAnchor.divideScalar(dist);
        p.position.copy(p.anchor).addScaledVector(toAnchor, p.ropeLength);
        const radial = p.velocity.dot(toAnchor);
        if (radial > 0) p.velocity.addScaledVector(toAnchor, -radial * 1.02);
      }
      if (p.position.y > p.anchor.y - 1.0 || dist < 4.5) {
        this.releaseWeb(true);
      }

      // A web line breaking on a rooftop still lets the player roll out.
      const surface = this.city.getSurfaceY(p.position.x, p.position.z, p.position.y + 1.2);
      if (p.position.y <= surface + 0.05) {
        p.position.y = surface;
        p.velocity.y = 0;
        p.grounded = true;
        p.surfaceY = surface;
        this.releaseWeb(false);
        this.onPlayerLanded(-10);
      }
    } else {
      if (p.grounded) {
        const targetSpeed = 14.5;
        p.velocity.x = damp(p.velocity.x, move.x * targetSpeed, 13, dt);
        p.velocity.z = damp(p.velocity.z, move.y * targetSpeed, 13, dt);
        p.velocity.y = 0;
      } else {
        p.velocity.y -= 27 * dt;
        if (move.lengthSq() > 0.01) {
          p.velocity.x += move.x * 12 * dt;
          p.velocity.z += move.y * 12 * dt;
        }
        const horizontalSpeed = Math.hypot(p.velocity.x, p.velocity.z);
        if (horizontalSpeed > 40) {
          const scale = 40 / horizontalSpeed;
          p.velocity.x *= scale;
          p.velocity.z *= scale;
        }
      }
      p.position.addScaledVector(p.velocity, dt);
    }

    const fallSpeed = p.velocity.y;
    const landedBuilding = this.city.resolvePlayerCollisions(p.position, p.previous, 0.7);
    const surface = this.city.getSurfaceY(p.position.x, p.position.z, p.position.y + 1.4);
    if (landedBuilding || (p.position.y <= surface + 0.02 && p.velocity.y <= 0)) {
      const ground = landedBuilding ? landedBuilding.roofY : surface;
      if (!p.grounded) this.onPlayerLanded(fallSpeed);
      p.position.y = ground;
      p.velocity.y = 0;
      p.grounded = true;
      p.surfaceY = ground;
    } else if (p.position.y > surface + 0.08) {
      if (p.grounded) p.surfaceY = surface;
      p.grounded = false;
    }

    // Never let the player fall through the street.
    if (p.position.y < 0.02) {
      p.position.y = 0.02;
      if (!p.grounded) this.onPlayerLanded(fallSpeed);
      p.grounded = true;
      p.surfaceY = 0;
      p.velocity.y = 0;
    }

    p.lastSpeed = Math.hypot(p.velocity.x, p.velocity.z);

    // Face the direction of travel, or the chase target when almost still in the air.
    let targetYaw = p.facing;
    if (p.lastSpeed > 1.6) targetYaw = Math.atan2(p.velocity.x, p.velocity.z);
    else if (!p.grounded) {
      const target = this.getCurrentTargetPosition();
      if (target) targetYaw = Math.atan2(target.x - p.position.x, target.z - p.position.z);
    }
    p.facing = this.lerpAngle(p.facing, targetYaw, p.swinging ? 8 : 12, dt);
    this.hero.root.position.copy(p.position);
    this.hero.setFacing(p.facing, true);
  },

  onPlayerLanded(fallSpeed) {
    this.audio.sfx('land', clamp(Math.abs(fallSpeed) / 22, 0.2, 1));
    this.effects.dust(this.player.position.clone().setY(this.player.position.y + 0.08), 1.1);
    if (Math.abs(fallSpeed) > 16) this.addShake(0.16);
  },

  findAnchor() {
    let best = null;
    let bestScore = -Infinity;
    const pos = this.player.position;
    const fwdX = -Math.sin(this.cameraYaw);
    const fwdZ = -Math.cos(this.cameraYaw);
    for (const entry of this.city.anchors) {
      const point = entry.point;
      const dx = point.x - pos.x;
      const dy = point.y - pos.y;
      const dz = point.z - pos.z;
      if (dy < 7) continue;
      const hDist = Math.hypot(dx, dz);
      if (hDist < 16 || hDist > 138) continue;
      const dot = (dx * fwdX + dz * fwdZ) / hDist;
      if (dot < 0.12) continue;
      const dist = Math.hypot(dx, dy, dz);
      const score = dot * 3.2 + clamp(dy / 55, 0, 1) * 0.55 - Math.abs(dist - 62) / 100;
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best;
  },

  tryAttachWeb() {
    if (this.player.swinging || this.state === 'cutscene' || !this.isPlaying()) return false;
    const anchor = this.findAnchor();
    if (!anchor) {
      if (this.time - (this._lastAnchorToast || 0) > 1.4) {
        this._lastAnchorToast = this.time;
        this.ui.toast('NO ANCHOR AHEAD', 'is-red');
      }
      this.player.attachCooldown = 0.35;
      return false;
    }
    const p = this.player;
    p.swinging = true;
    p.grounded = false;
    p.anchor.copy(anchor.point);
    p.ropeLength = Math.max(10, p.position.distanceTo(anchor.point) * 0.965);
    p.velocity.y += 1.8;
    this.webLine.visible = true;
    this.webAnchorGlow.visible = true;
    this.webAnchorGlow.position.copy(anchor.point);
    this.effects.webSplat(anchor.point);
    this.audio.sfx('thwip', 1);
    this.audio.sfx('swing', 0.8);
    this.ui.toast('THWIP', 'is-green');
    return true;
  },

  releaseWeb(boost = true) {
    if (!this.player.swinging) return;
    this.player.swinging = false;
    this.webLine.visible = false;
    this.webAnchorGlow.visible = false;
    if (boost) {
      const swingUpgrade = 1 + (this.run?.upgrades.swing || 0) * 0.18;
      this.player.velocity.y += 4.6 * swingUpgrade;
      const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
      if (speed > 12) {
        this.player.velocity.x *= 1.025;
        this.player.velocity.z *= 1.025;
      }
      this.audio.sfx('swing', 0.7);
      this.ui.setSpeedLines(false);
    }
    this.player.attachCooldown = 0.22;
  },

  updateWebLine() {
    if (!this.player.swinging) {
      this.webLine.visible = false;
      this.webAnchorGlow.visible = false;
      return;
    }
    const hand = this.hero.getHandWorld(this.temp.a);
    const positions = this.webLine.geometry.attributes.position.array;
    positions[0] = hand.x;
    positions[1] = hand.y;
    positions[2] = hand.z;
    positions[3] = this.player.anchor.x;
    positions[4] = this.player.anchor.y;
    positions[5] = this.player.anchor.z;
    this.webLine.geometry.attributes.position.needsUpdate = true;
    this.webLine.visible = true;
    this.webAnchorGlow.visible = true;
    this.webAnchorGlow.position.copy(this.player.anchor);
    this.webAnchorGlow.material.opacity = 0.55 + Math.sin(this.time * 9) * 0.22;
  },

  updateHeroVisual(dt, idle = false) {
    const p = this.player;
    const target = this.getCurrentTargetPosition();
    const state = {
      grounded: p.grounded,
      swinging: p.swinging,
      velocity: p.velocity,
      speed: p.lastSpeed,
      shootTimer: p.shootTimer,
      strikeTimer: p.strikeTimer,
      dodgeTimer: p.dodgeCooldown,
      aimTarget: target,
      surfaceY: p.surfaceY,
    };
    this.hero.update(dt, state);
    if (idle) {
      this.hero.root.position.copy(p.position);
    }
    this.hero.shadow.visible = this.state !== 'title' || true;
  },

  updateGoblinVisual(t, snap = false) {
    if (!this.curve) return;
    const point = this.curve.getPointAt(t);
    const tangent = this.curve.getTangentAt(t);
    const yaw = Math.atan2(tangent.x, tangent.z);
    let delta = yaw - this.goblinState.previousYaw;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const bank = clamp(-delta * 7, -0.55, 0.55);
    this.goblinState.previousYaw = yaw;
    this.goblinState.yaw = yaw;
    this.goblinState.bank = snap ? bank : damp(this.goblinState.bank, bank, 4, 0.016);
    this.goblinState.t = t;
    this.goblin.update(0.016, {
      position: point,
      yaw,
      bank: this.goblinState.bank,
      bobPhase: this.time * 0.8,
      stunned: this.goblinState.stunTimer > 0,
      boss: this.goblinState.bossMode,
    });
    this.goblin.root.position.copy(point);
  },

  updateGoblin(dt, rawDt) {
    const g = this.goblinState;
    if (!g.visible) return;
    const p = this.player;

    if (g.bossMode) {
      g.bossTimer += dt;
      if (!this.bossHover) this.bossHover = this.goblin.root.position.clone();
      const hover = this.temp.a.copy(this.bossHover);
      hover.y += Math.sin(this.time * 1.6) * 1.5;
      hover.x += Math.sin(this.time * 0.7) * 2.2;
      hover.z += Math.cos(this.time * 0.7) * 2.2;
      const yaw = Math.atan2(p.position.x - hover.x, p.position.z - hover.z);
      this.goblin.update(dt, {
        position: hover,
        yaw,
        bank: Math.sin(this.time * 0.8) * 0.08,
        bobPhase: this.time,
        stunned: g.stunTimer > 0,
        boss: true,
      });
      this.goblin.root.position.copy(hover);
      g.distance = p.position.distanceTo(hover);
    } else {
      const stunFactor = g.stunTimer > 0 ? 0.2 : 1;
      const speed = g.speed * stunFactor;
      g.t = (g.t + (speed / this.pathLength) * dt) % 1;
      this.updateGoblinVisual(g.t);
      g.distance = p.position.distanceTo(this.goblin.root.position);
    }

    if (g.stunTimer > 0) {
      g.stunTimer = Math.max(0, g.stunTimer - rawDt);
      if (g.stunTimer === 0) this.ui.setGoblinNote('WEB HIM, THEN STRIKE');
    } else {
      this.ui.setGoblinNote(g.bossMode ? 'FINAL AERIAL BATTLE' : 'WEB HIM, THEN STRIKE');
    }

    // Glider exhaust.
    const engine = this.goblin.root.position.clone().add(new THREE.Vector3(0, -0.3, 0));
    this.effects.trail('goblin-engine', engine, '#78ff5e', {
      interval: 0.045,
      count: 1,
      speed: 1.5,
      life: 0.45,
      gravity: 0.2,
      spread: 0.5,
    });
    if (g.stunTimer > 0) {
      this.effects.trail('goblin-stun', engine, '#ecfbff', {
        interval: 0.08,
        count: 1,
        speed: 2.2,
        life: 0.5,
        gravity: -0.4,
      });
    }

    if (!g.bossMode) {
      g.bombCooldown -= rawDt;
      if (g.bombCooldown <= 0) {
        this.throwBomb();
        g.bombCooldown = this.level.bombInterval * (0.82 + Math.random() * 0.4);
      }
    } else {
      g.shockTimer -= rawDt;
      if (g.shockTimer <= 0) {
        g.shockTimer = 6.5;
        this.telegraphShockwave();
      }
      g.bombCooldown -= rawDt;
      if (g.bombCooldown <= 0) {
        this.throwBomb();
        this.throwBomb(0.2);
        g.bombCooldown = this.level.bombInterval * (0.8 + Math.random() * 0.3);
      }
    }

    if (this.levelIndex === 2 && !g.bossMode && g.health <= g.maxHealth * 0.5) {
      this.enterBossMode();
    }

    if (g.distance > 245) {
      g.escapeTimer += rawDt;
      this.ui.setGoblinNote('GOBLIN ESCAPING — SWING FASTER!');
      if (g.escapeTimer > 4.5) this.failLevel('escape');
    } else if (g.distance < 205) {
      g.escapeTimer = 0;
    }
  },

  updateCamera(rawDt) {
    const p = this.player;
    const speed = p.lastSpeed;
    const target = this.temp.a.copy(p.position).add(new THREE.Vector3(0, p.swinging ? 2.35 : 1.9, 0));
    if (p.swinging) target.addScaledVector(p.velocity, 0.045);

    const desiredDistance = clamp(9.7 + speed * 0.14, 9.7, 17.5);
    this.cameraDistance = damp(this.cameraDistance, desiredDistance, 4, rawDt);

    if (this.time - this.lastLookInput > 1.4 && (p.swinging || speed > 12)) {
      const desiredYaw = Math.atan2(-p.velocity.x, -p.velocity.z);
      this.cameraYaw = this.lerpAngle(this.cameraYaw, desiredYaw, 1.2, rawDt);
    }

    const horizontal = Math.cos(this.cameraPitch) * this.cameraDistance;
    const desired = this.temp.b.set(
      target.x + Math.sin(this.cameraYaw) * horizontal,
      target.y + Math.sin(this.cameraPitch) * this.cameraDistance + 1.15,
      target.z + Math.cos(this.cameraYaw) * horizontal
    );

    const dir = this.temp.c.copy(desired).sub(target);
    const fullDist = dir.length();
    dir.normalize();
    const hitDist = this.city.raycastCamera(target, desired, fullDist);
    if (hitDist < fullDist) {
      desired.copy(target).addScaledVector(dir, Math.max(3.4, hitDist - 0.9));
    }

    const smooth = 1 - Math.exp(-9 * rawDt);
    this.cameraPosition.lerp(desired, smooth);
    this.cameraLook.lerp(target, 1 - Math.exp(-12 * rawDt));
    this.camera.position.copy(this.cameraPosition);

    if (this.shake > 0.001) {
      const intensity = this.shake;
      this.camera.position.x += (Math.random() - 0.5) * intensity;
      this.camera.position.y += (Math.random() - 0.5) * intensity;
      this.camera.position.z += (Math.random() - 0.5) * intensity;
      this.shake = Math.max(0, this.shake - rawDt * 1.7);
    }

    this.camera.lookAt(this.cameraLook);

    const targetFov = this.slowmoTimer > 0 ? 56 : clamp(64 + speed * 0.34, 66, 87);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = damp(this.camera.fov, targetFov, 5, rawDt);
      this.camera.updateProjectionMatrix();
    }
  },

  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  },

  updateHenchman(dt) {
    if (!this.henchman) return;
    this.henchman.update(dt, this.player.position);
    if (this.henchman.captured && !this._henchmanScored) {
      this._henchmanScored = true;
    }
  },

  updateCitizens(dt) {
    for (const citizen of this.citizens) citizen.update(dt);
  },

  updateChaseRules(rawDt) {
    if (this.state !== 'chase') return;
    this.timerRemaining = Math.max(0, this.timerRemaining - rawDt);
    if (this.timerRemaining <= 0) {
      this.failLevel('time');
      return;
    }
    const g = this.goblinState;
    if (g.health <= 0) this.finishLevel();
    if (g.distance > 330) {
      this.failLevel('escape');
    }
  },

  updateUi() {
    const p = this.player;
    const g = this.goblinState;
    this.ui.setHealth(p.health, p.maxHealth);
    this.ui.setWeb(p.web);
    this.ui.setScore(this.run.score);
    this.ui.setLives(this.run.lives);
    this.ui.setTimer(this.timerRemaining, this.chaseStarted);
    this.ui.showCombo(p.combo, this.comboWord || 'NICE!', p.comboWindow > 0);
    this.ui.setSpeedLines((p.swinging || Math.hypot(p.velocity.x, p.velocity.z) > 28) && p.lastSpeed > 22, p.lastSpeed);

    if (this.state === 'tutorial') {
      this.ui.setGoblin(0, 1, 0, false);
      const pos = this.getCurrentObjectivePosition();
      if (pos) {
        const dist = Math.round(this.player.position.distanceTo(pos));
        this.ui.showMarker(this.ui.markerObjective, pos, this.camera, true, `${dist}m`);
      }
      this.ui.setReticleTarget(false);
      this.ui.hideMarker(this.ui.markerWeb);
      this.updateCitizenMarker();
      return;
    }

    const inRange = this.getWebTarget() !== null;
    this.ui.setGoblin(g.health, g.maxHealth, g.distance, true);
    this.ui.setGoblinNote(
      g.bossMode ? 'FINAL AERIAL BATTLE' : g.stunTimer > 0 ? 'STUNNED — STRIKE NOW' : 'WEB HIM, THEN STRIKE'
    );

    const goblinPos = this.goblin.root.position;
    if (inRange) {
      this.ui.hideMarker(this.ui.markerObjective);
      this.ui.showMarker(this.ui.markerWeb, goblinPos, this.camera, true, g.stunTimer > 0 ? 'STRIKE' : 'WEB');
    } else {
      this.ui.hideMarker(this.ui.markerWeb);
      this.ui.showMarker(this.ui.markerObjective, goblinPos, this.camera, true, `${Math.round(g.distance)}m`);
    }
    this.ui.setReticleTarget(inRange, goblinPos, this.camera);

    const prompt = this.getPrompt();
    this.ui.setPrompt(prompt.html, prompt.visible);
    this.updateCitizenMarker();
  },

  getPrompt() {
    if (this.state === 'tutorial') {
      if (this.tutorialStage === 'signal') {
        if (this.player.swinging) return { html: '<kbd>SPACE</kbd><span>RELEASE AT THE TOP TO LAUNCH</span>', visible: true };
        return { html: '<kbd>SPACE</kbd><span>JUMP · HOLD TO SWING</span>', visible: true };
      }
      if (this.tutorialStage === 'henchman') return { html: '<kbd>E</kbd><span>WEB THE SCOUT</span>', visible: true };
      return { html: '', visible: false };
    }
    if (this.goblinState.stunTimer > 0) {
      return { html: '<kbd>F</kbd><span>WEB-STRIKE</span>', visible: true };
    }
    if (this.getWebTarget()) {
      return { html: '<kbd>E</kbd><span>WEB SHOT</span>', visible: true };
    }
    return { html: '<span>SWING CLOSER TO THE GOBLIN</span>', visible: true };
  },

  updateCitizenMarker() {
    let nearest = null;
    let nearestDist = 170;
    for (const citizen of this.citizens) {
      if (citizen.rescued) continue;
      const dist = this.player.position.distanceTo(citizen.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = citizen;
      }
    }
    if (nearest && nearestDist < 110) {
      this.ui.showMarker(this.ui.markerCivilian, nearest.root.position, this.camera, true, nearestDist < 34 ? 'RESCUE · R' : `${Math.round(nearestDist)}m · R`, false);
    } else {
      this.ui.hideMarker(this.ui.markerCivilian);
    }
  },

  getCurrentTargetPosition() {
    if (this.state === 'tutorial') {
      if (this.tutorialStage === 'signal') return this.city.getWaypointPosition();
      if (this.henchman && !this.henchman.captured) return this.henchman.root.position;
      return null;
    }
    if (this.goblinState.visible) return this.goblin.root.position;
    return null;
  },

  getCurrentObjectivePosition() {
    if (this.tutorialStage === 'signal') return this.city.getWaypointPosition();
    if (this.tutorialStage === 'henchman' && this.henchman) return this.henchman.root.position;
    return null;
  },

  getWebTarget() {
    if (this.state === 'tutorial') {
      if (this.tutorialStage === 'henchman' && this.henchman && !this.henchman.captured) {
        const dist = this.player.position.distanceTo(this.henchman.root.position);
        return dist < 125 ? { type: 'henchman', position: this.henchman.root.position, distance: dist } : null;
      }
      return null;
    }
    if (this.state !== 'chase' || !this.goblinState.visible || this.goblinState.health <= 0) return null;
    const dist = this.player.position.distanceTo(this.goblin.root.position);
    return dist < 135 ? { type: 'goblin', position: this.goblin.root.position, distance: dist } : null;
  },

  lerpAngle(a, b, rate, dt) {
    let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return a + d * (1 - Math.exp(-rate * dt));
  },
});

Object.assign(Game.prototype, {
  registerHit(basePoints, label, className = 'is-score') {
    const p = this.player;
    const chained = p.comboWindow > 0;
    p.combo = chained ? Math.min(9, p.combo + 1) : 1;
    p.comboWindow = 5.2;
    p.bestCombo = Math.max(p.bestCombo, p.combo);
    this.levelStats.bestCombo = Math.max(this.levelStats.bestCombo, p.combo);
    this.run.bestCombo = Math.max(this.run.bestCombo, p.combo);
    const points = basePoints * p.combo;
    this.run.score += points;
    const words = ['NICE!', 'GOOD!', 'SWEET!', 'AMAZING!', 'SPECTACULAR!', 'UNSTOPPABLE!'];
    this.comboWord = words[Math.min(words.length - 1, p.combo - 1)];
    this.ui.setScore(this.run.score);
    this.ui.toast(`+${points} ${label}`, className);
    this.ui.showCombo(p.combo, this.comboWord, true);
  },

  breakCombo() {
    this.player.combo = 0;
    this.player.comboWindow = 0;
    this.comboWord = '';
    this.ui.showCombo(0, '', false);
  },

  fireWeb() {
    if (!this.isPlaying()) return;
    if (this.player.webCooldown > 0) return;
    const target = this.getWebTarget();
    if (!target) {
      if (this.state === 'chase') this.ui.toast('OUT OF WEB RANGE', 'is-red');
      return;
    }
    const cost = 18 - (this.run.upgrades.web || 0) * 3;
    if (this.player.web < cost) {
      this.ui.toast('WEB FLUID EMPTY', 'is-red');
      return;
    }
    this.player.web -= cost;
    this.player.webCooldown = 0.62 - (this.run.upgrades.web || 0) * 0.08;
    this.player.shootTimer = 0.34;
    const from = this.hero.getHandWorld(V());
    const to = target.position.clone();
    this.createWebBolt(from, to, () => {
      if (target.type === 'goblin') this.webHitGoblin();
      else if (target.type === 'henchman') this.webHitHenchman();
    });
    this.audio.sfx('thwip');
  },

  createWebBolt(from, to, onHit) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const material = new THREE.LineBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 1 });
    const line = new THREE.Line(geo, material);
    line.frustumCulled = false;
    this.scene.add(line);
    this.webBolts.push({ line, elapsed: 0, duration: 0.095, onHit, from: from.clone(), to: to.clone() });
    this.effects.impact(from, '#e9fbff', 4, 0.5);
  },

  updateWebBolts(dt) {
    for (let i = this.webBolts.length - 1; i >= 0; i--) {
      const bolt = this.webBolts[i];
      bolt.elapsed += dt;
      const t = clamp(bolt.elapsed / bolt.duration, 0, 1);
      bolt.line.material.opacity = 1 - t * 0.55;
      // Slight flex makes the line feel like a real web strand.
      const arr = bolt.line.geometry.attributes.position.array;
      const flex = Math.sin(t * Math.PI) * 0.9;
      arr[3] = this.lerp(bolt.from.x, bolt.to.x, t);
      arr[4] = this.lerp(bolt.from.y, bolt.to.y, t) - flex;
      arr[5] = this.lerp(bolt.from.z, bolt.to.z, t);
      bolt.line.geometry.attributes.position.needsUpdate = true;
      if (t >= 1) {
        this.effects.webSplat(bolt.to);
        this.audio.sfx('webhit');
        bolt.onHit();
        this.scene.remove(bolt.line);
        bolt.line.geometry.dispose();
        bolt.line.material.dispose();
        this.webBolts.splice(i, 1);
      }
    }
  },

  updateTransientWebs(dt) {
    for (let i = this.transientWebs.length - 1; i >= 0; i--) {
      const web = this.transientWebs[i];
      web.life -= dt;
      web.line.material.opacity = clamp(web.life / web.maxLife, 0, 1) * 0.9;
      if (web.life <= 0) {
        this.scene.remove(web.line);
        web.line.geometry.dispose();
        web.line.material.dispose();
        this.transientWebs.splice(i, 1);
      }
    }
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  webHitGoblin() {
    if (this.state !== 'chase' || this.goblinState.health <= 0) return;
    const g = this.goblinState;
    const stunBase = 2.7 + (this.run.upgrades.stun || 0) * 0.9;
    g.stunTimer = Math.max(g.stunTimer, stunBase);
    g.bombCooldown = Math.max(g.bombCooldown, 1.6);
    this.registerHit(250, 'WEB HIT', 'is-green');
    this.effects.impact(this.goblin.root.position, '#effbff', 20, 1.6);
    this.effects.webSplat(this.goblin.root.position);
    this.audio.sfx('webhit', 1);
    this.addShake(0.2);
    this.ui.toast('WEBBED — PRESS F', 'is-green');
    this.slowmoTimer = Math.max(this.slowmoTimer, 0.18);
    this.audio.sfx('slowmo', 0.4);
  },

  webHitHenchman() {
    if (!this.henchman || this.henchman.captured) return;
    this.henchman.capture();
    this.registerHit(500, 'SCOUT CAPTURED', 'is-green');
    this.effects.webSplat(this.henchman.root.position);
    this.audio.sfx('webhit', 1);
    this.audio.sfx('strike', 0.6);
    this.addShake(0.24);
    this.ui.toast('SCOUT WRAPPED UP', 'is-green');
    this.ui.setChapter(this.level.chapter, 'SCOUT CAPTURED — HOLD ON');
    this.ui.setPrompt('', false);
    this.slowmoTimer = 0.32;
  },

  tryStrike() {
    if (!this.isPlaying() || this.state !== 'chase') return;
    if (this.player.strikeCooldown > 0 || this.player.strikeDash) return;
    const g = this.goblinState;
    if (!g.visible || g.health <= 0) return;
    const dist = this.player.position.distanceTo(this.goblin.root.position);
    if (dist > 135) {
      this.ui.toast('TOO FAR — SWING CLOSER', 'is-red');
      return;
    }
    if (g.stunTimer <= 0) {
      this.ui.toast('WEB HIM FIRST', 'is-red');
      this.audio.sfx('ui');
      return;
    }
    const from = this.player.position.clone();
    const target = this.goblin.root.position.clone();
    const towardPlayer = from.clone().sub(target);
    if (towardPlayer.lengthSq() < 0.01) towardPlayer.set(0, 0, 1);
    towardPlayer.normalize();
    const to = target.clone().addScaledVector(towardPlayer, 5.5);
    this.player.strikeDash = {
      from,
      to,
      target,
      elapsed: 0,
      duration: 0.24,
      direction: towardPlayer.clone(),
    };
    this.player.swinging = false;
    this.input.swingHeld = false;
    this.webLine.visible = false;
    this.webAnchorGlow.visible = false;
    this.player.invuln = Math.max(this.player.invuln, 1);
    this.player.strikeTimer = 0.36;
    this.player.shootTimer = 0;
    this.audio.sfx('swing', 1);
    this.audio.sfx('slowmo', 0.8);
    this.slowmoTimer = Math.max(this.slowmoTimer, 0.55);
    this.addShake(0.18);
    this.effects.impact(from, '#d8f4ff', 12, 0.8);
  },

  updateStrikeDash(rawDt) {
    const p = this.player;
    const dash = p.strikeDash;
    if (!dash) return;
    dash.elapsed += rawDt;
    const t = clamp(dash.elapsed / dash.duration, 0, 1);
    const e = ease(t);
    p.position.lerpVectors(dash.from, dash.to, e);
    p.position.y += Math.sin(t * Math.PI) * 2;
    p.facing = Math.atan2(
      dash.target.x - dash.from.x,
      dash.target.z - dash.from.z
    );
    this.hero.root.position.copy(p.position);
    this.hero.setFacing(p.facing, true);
    this.hero.rig.position.y = -0.05;
    this.hero.shootTimer = 0;

    if (t >= 1) {
      this.hero.rig.position.y = 0;
      this.damageGoblin();
      p.strikeDash = null;
      p.velocity.copy(dash.direction).multiplyScalar(16);
      p.velocity.y = 3.5;
      p.position.addScaledVector(dash.direction, 1.5);
      this.hero.root.position.copy(p.position);
      p.strikeCooldown = 1.15;
      p.invuln = Math.max(p.invuln, 0.9);
    }
  },

  damageGoblin() {
    const g = this.goblinState;
    const damage = this.level.strikeDamage;
    g.health = Math.max(0, g.health - damage);
    g.stunTimer = 0;
    this.registerHit(1000, 'WEB-STRIKE', 'is-red');
    const pos = this.goblin.root.position.clone();
    this.effects.impact(pos, '#f4fbff', 32, 2);
    this.effects.explosion(pos, 0.7);
    this.effects.shockwave(pos, '#dff8ff', 0.7);
    this.audio.sfx('strike', 1);
    this.audio.sfx('explosion', 0.55);
    this.audio.sfx('laugh', 0.4);
    this.addShake(0.55);
    this.slowmoTimer = Math.max(this.slowmoTimer, 0.65);
    this.player.strikeTimer = 0.45;
    this.ui.setGoblin(g.health, g.maxHealth, g.distance, true);
    if (g.health <= 0) {
      this.delayedAction = () => this.finishLevel();
      this.delayTimer = 0.55;
      this.ui.toast('GOBLIN DOWN', 'is-red');
    } else {
      this.ui.toast(`${damage} DAMAGE`, 'is-red');
      if (this.levelIndex === 2 && g.health <= g.maxHealth * 0.5 && !g.bossMode) {
        this.enterBossMode();
      }
    }
  },

  enterBossMode() {
    const g = this.goblinState;
    if (g.bossMode) return;
    g.bossMode = true;
    this.bossHover = this.goblin.root.position.clone();
    g.bombCooldown = 1.4;
    g.shockTimer = 4.8;
    this.bossShock = null;
    this.ui.showBossBanner(true);
    this.ui.setChapter(this.level.chapter, 'SURVIVE THE FINAL AERIAL BATTLE');
    this.ui.toast('NO MORE RUNNING', 'is-green');
    this.audio.setScene({ boss: true });
    this.audio.sfx('laugh', 1);
    this.effects.shockwave(this.goblin.root.position, '#7cff65', 1.6);
    this.addShake(0.5);
    this.slowmoTimer = Math.max(this.slowmoTimer, 0.8);
    this.delayedAction = () => this.ui.showBossBanner(false);
    this.delayTimer = 4.2;
  },

  telegraphShockwave() {
    if (this.bossShock) return;
    const pos = this.goblin.root.position.clone();
    this.bossShock = { position: pos, timer: 0.75 };
    this.ui.toast('SHOCKWAVE — DODGE!', 'is-green');
    this.audio.sfx('slowmo', 0.5);
    this.audio.sfx('laugh', 0.7);
    this.effects.shockwave(pos, '#7cff65', 1.2);
  },

  updateBossShock(rawDt) {
    if (!this.bossShock) return;
    this.bossShock.timer -= rawDt;
    if (this.bossShock.timer <= 0) {
      const dist = this.player.position.distanceTo(this.bossShock.position);
      if (dist < 46 && this.player.invuln <= 0) {
        this.damagePlayer(20, this.bossShock.position);
      }
      this.bossShock = null;
    }
  },

  throwBomb(delayOffset = 0) {
    if (this.goblinState.health <= 0) return;
    const origin = this.goblin.arms.left.hand.getWorldPosition(V());
    const target = this.player.position.clone();
    target.x += this.player.velocity.x * (0.55 + delayOffset);
    target.z += this.player.velocity.z * (0.55 + delayOffset);
    target.y += 1.2;
    target.x += (Math.random() - 0.5) * 4;
    target.z += (Math.random() - 0.5) * 4;
    const flight = 1.55 + Math.random() * 0.25;
    const velocity = target.clone().sub(origin).divideScalar(flight);
    velocity.y += 4.9 * flight;
    const mesh = this.createBombMesh();
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.bombs.push({
      mesh,
      velocity,
      fuse: flight,
      radius: 9,
      spin: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14),
    });
    this.audio.sfx('thwip', 0.55);
    this.effects.impact(origin, '#ff9a3d', 8, 0.8);
  },

  createBombMesh() {
    const group = new THREE.Group();
    const orange = new THREE.MeshStandardMaterial({ color: '#ff7a1a', roughness: 0.4, emissive: '#ff3f00', emissiveIntensity: 0.85 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 9), orange);
    body.scale.y = 0.8;
    group.add(body);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: '#d44a09', roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.028, 3, 16, Math.PI), ridgeMat);
      ridge.rotation.y = (i / 6) * Math.PI;
      ridge.rotation.x = Math.PI / 2;
      ridge.scale.y = 0.8;
      group.add(ridge);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.22, 5), new THREE.MeshStandardMaterial({ color: '#3b5822', roughness: 0.7 }));
    stem.position.y = 0.4;
    group.add(stem);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.effects.glowTexture, color: '#ff7e2a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.scale.set(3.2, 3.2, 1);
    group.add(glow);
    group.scale.setScalar(1.25);
    return group;
  },

  updateBombs(dt) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.velocity.y -= 9.8 * dt;
      bomb.mesh.position.addScaledVector(bomb.velocity, dt);
      bomb.mesh.rotation.x += bomb.spin.x * dt;
      bomb.mesh.rotation.y += bomb.spin.y * dt;
      bomb.mesh.rotation.z += bomb.spin.z * dt;
      bomb.fuse -= dt;
      this.effects.trail('bomb', bomb.mesh.position, '#ff8f32', {
        interval: 0.035,
        count: 1,
        speed: 1.2,
        life: 0.4,
        gravity: 1,
      });
      const surface = this.city.getSurfaceY(bomb.mesh.position.x, bomb.mesh.position.z, bomb.mesh.position.y);
      if (bomb.fuse <= 0 || bomb.mesh.position.y <= surface + 0.35) {
        this.explodeBomb(bomb);
        this.bombs.splice(i, 1);
      }
    }
  },

  explodeBomb(bomb) {
    const pos = bomb.mesh.position.clone();
    this.scene.remove(bomb.mesh);
    this.effects.explosion(pos, 1);
    this.audio.sfx('explosion', 0.9);
    const dist = this.player.position.distanceTo(pos);
    if (dist < 40) this.addShake(0.4 * (1 - dist / 40));
    if (dist < bomb.radius && this.player.invuln <= 0 && this.isPlaying()) {
      this.damagePlayer(16, pos);
    }
  },

  updateBossShockAndState(rawDt) {
    this.updateBossShock(rawDt);
    if (this.bossShock) {
      const t = 1 - this.bossShock.timer / 0.75;
      this.effects.trail('boss-warning', this.bossShock.position, '#7cff65', { interval: 0.05, count: 1, speed: 0.5, life: 0.4, gravity: 0 });
    }
  },
});

Object.assign(Game.prototype, {
  damagePlayer(amount, sourcePosition = null) {
    const p = this.player;
    if (p.invuln > 0 || !this.isPlaying()) return;
    p.health = Math.max(0, p.health - amount);
    p.invuln = 1.25;
    p.hitTimer = 1.25;
    this.breakCombo();
    this.ui.flashDamage();
    this.audio.sfx('damage', 1);
    this.addShake(0.55);
    this.effects.impact(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ff9b83', 20, 1.2);
    if (sourcePosition) {
      const knock = p.position.clone().sub(sourcePosition);
      knock.y = 0;
      if (knock.lengthSq() < 0.01) knock.set(0, 0, 1);
      knock.normalize().multiplyScalar(9);
      p.velocity.add(knock);
      p.velocity.y = Math.max(p.velocity.y, 5);
      p.grounded = false;
    }
    this.ui.toast(`-${amount} HEALTH`, 'is-red');
    if (p.health <= 0) {
      this.failLevel('health');
    }
  },

  dodge() {
    const p = this.player;
    if (!this.isPlaying() || p.dodgeCooldown > 0) return;
    p.dodgeCooldown = 1.15;
    p.invuln = Math.max(p.invuln, 0.62);
    const move = this.getMoveVector();
    let dx = move.x;
    let dz = move.y;
    if (Math.hypot(dx, dz) < 0.2) {
      dx = -Math.sin(this.cameraYaw);
      dz = -Math.cos(this.cameraYaw);
    }
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    p.velocity.x += dx * 15;
    p.velocity.z += dz * 15;
    if (p.grounded) {
      p.velocity.y = 5.2;
      p.grounded = false;
    } else {
      p.velocity.y += 1.4;
    }
    this.audio.sfx('swing', 0.8);
    this.effects.dust(p.position.clone(), 0.9);
    this.effects.impact(p.position.clone().add(new THREE.Vector3(0, 1, 0)), '#b7dcff', 8, 0.7);
    this.addShake(0.1);
    this.ui.toast('DODGE', 'is-green');
  },

  rescueNearest() {
    if (!this.isPlaying()) return;
    let nearest = null;
    let best = 22;
    for (const citizen of this.citizens) {
      if (citizen.rescued) continue;
      const dist = this.player.position.distanceTo(citizen.position);
      if (dist < best) {
        best = dist;
        nearest = citizen;
      }
    }
    if (!nearest) {
      this.ui.toast('NO CIVILIAN IN RANGE', 'is-red');
      return;
    }
    nearest.rescue();
    this.levelStats.civilians += 1;
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 14);
    this.player.web = Math.min(100, this.player.web + 18);
    this.registerHit(500, 'CIVILIAN RESCUED', 'is-green');
    this.effects.impact(nearest.root.position, '#6eeaff', 26, 1.4);
    this.effects.shockwave(nearest.root.position, '#6eeaff', 0.8);
    this.audio.sfx('rescue', 1);
    this.ui.toast(`CIVILIAN SAFE · ${this.levelStats.civilians}/${this.level.citizens}`, 'is-green');
    this.addShake(0.15);
    if (this.levelStats.civilians === this.level.citizens) {
      this.delayedAction = () => this.ui.toast('ALL CIVILIANS SAFE', 'is-green');
      this.delayTimer = 0.45;
    }
  },
});

/* __GAME_METHODS__ */
