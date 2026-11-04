import * as THREE from 'three';

const TAU = Math.PI * 2;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.58,
    metalness: opts.metalness ?? 0.15,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? false,
    side: opts.side ?? THREE.FrontSide,
  });
}

function glowSprite(texture, color, scale, opacity = 0.55) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.76)');
  grad.addColorStop(0.48, 'rgba(255,255,255,0.16)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

const GLOW = makeGlowTexture();

function makeSpiderEmblem() {
  const group = new THREE.Group();
  const black = new THREE.MeshBasicMaterial({ color: '#080a0f' });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), black);
  body.scale.set(0.7, 2.15, 0.35);
  group.add(body);
  const legGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.03, 0.04, 0),
    new THREE.Vector3(-0.17, 0.12, 0),
    new THREE.Vector3(-0.26, 0.19, 0),
    new THREE.Vector3(-0.04, -0.05, 0),
    new THREE.Vector3(-0.2, -0.15, 0),
    new THREE.Vector3(-0.28, -0.25, 0),
    new THREE.Vector3(0.03, 0.04, 0),
    new THREE.Vector3(0.17, 0.12, 0),
    new THREE.Vector3(0.26, 0.19, 0),
    new THREE.Vector3(0.04, -0.05, 0),
    new THREE.Vector3(0.2, -0.15, 0),
    new THREE.Vector3(0.28, -0.25, 0),
  ]);
  group.add(new THREE.LineSegments(legGeo, new THREE.LineBasicMaterial({ color: '#080a0f', linewidth: 1 })));
  return group;
}

export class Hero {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'SpiderMan';
    this.scene.add(this.root);

    this.red = mat('#d5132f', { roughness: 0.42, metalness: 0.08, emissive: '#4c0310', emissiveIntensity: 0.25 });
    this.redDark = mat('#8e0c22', { roughness: 0.52 });
    this.blue = mat('#173dad', { roughness: 0.46, metalness: 0.14, emissive: '#05133a', emissiveIntensity: 0.32 });
    this.blueDark = mat('#0c2468', { roughness: 0.55 });
    this.black = mat('#070b13', { roughness: 0.5, metalness: 0.25 });
    this.white = mat('#eef8ff', { roughness: 0.22, metalness: 0.05, emissive: '#bcdfff', emissiveIntensity: 0.6 });
    this.redWeb = mat('#ff2d42', { roughness: 0.35, emissive: '#ff1029', emissiveIntensity: 0.5 });

    this.rig = new THREE.Group();
    this.root.add(this.rig);
    this.parts = {};
    this.time = 0;
    this.pose = {
      idle: 0,
      run: 0,
      swing: 0,
      shoot: 0,
      strike: 0,
      fall: 0,
    };

    this.buildBody();
    this.buildShadow();
  }

  addCapsule(parent, radius, length, material, x = 0, y = 0, z = 0, radial = 10) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 5, radial), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  buildBody() {
    const rig = this.rig;

    // Hips and torso.
    const pelvis = this.addCapsule(rig, 0.3, 0.22, this.blue, 0, 1.06, 0, 12);
    pelvis.scale.z = 0.82;
    this.parts.pelvis = pelvis;

    const torso = this.addCapsule(rig, 0.34, 0.42, this.red, 0, 1.53, 0, 14);
    torso.scale.set(1, 1, 0.8);
    this.parts.torso = torso;

    const abdomen = this.addCapsule(rig, 0.26, 0.22, this.red, 0, 1.29, 0.06, 12);
    abdomen.scale.set(0.9, 1, 0.7);
    this.parts.abdomen = abdomen;

    // Blue rib panels.
    for (const side of [-1, 1]) {
      const panel = this.addCapsule(rig, 0.16, 0.36, this.blue, side * 0.24, 1.55, 0.01, 8);
      panel.scale.set(0.58, 1, 0.6);
      panel.rotation.z = side * 0.22;
    }

    // Belt.
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 5, 16), this.black);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 1.16;
    belt.scale.z = 0.82;
    rig.add(belt);

    const emblem = makeSpiderEmblem();
    emblem.position.set(0, 1.57, 0.284);
    emblem.scale.setScalar(1.1);
    rig.add(emblem);

    // Head.
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.9, 0);
    rig.add(this.headPivot);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 18, 14), this.red);
    head.scale.set(0.9, 1.06, 0.92);
    head.position.y = 0.18;
    this.headPivot.add(head);

    // Mask webbing: thin dark rings.
    const webMat = new THREE.MeshBasicMaterial({ color: '#5c0714', transparent: true, opacity: 0.72 });
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23 - i * 0.005, 0.004, 3, 24), webMat);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = 0.32 + i * 0.4;
      ring.position.y = 0.18 + i * 0.045;
      ring.scale.z = 0.92;
      this.headPivot.add(ring);
    }
    const centerWeb = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.004, 3, 24, Math.PI), webMat);
    centerWeb.rotation.x = Math.PI / 2;
    centerWeb.position.y = 0.17;
    this.headPivot.add(centerWeb);

    // Eye lenses.
    for (const side of [-1, 1]) {
      const outline = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 8), this.black);
      outline.scale.set(1.7, 0.9, 0.32);
      outline.position.set(side * 0.098, 0.215, 0.225);
      outline.rotation.y = side * 0.26;
      outline.rotation.z = side * 0.28;
      this.headPivot.add(outline);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), this.white);
      eye.scale.set(1.68, 0.82, 0.3);
      eye.position.set(side * 0.1, 0.218, 0.241);
      eye.rotation.y = side * 0.26;
      eye.rotation.z = side * 0.3;
      this.headPivot.add(eye);
    }

    // Neck.
    const neck = this.addCapsule(rig, 0.13, 0.08, this.red, 0, 1.84, 0, 8);
    neck.scale.z = 0.8;

    // Arms.
    this.arms = {};
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.39, 1.72, 0);
      rig.add(shoulder);
      const upper = this.addCapsule(shoulder, 0.11, 0.3, this.red, 0, -0.23, 0, 9);
      const upperBlue = this.addCapsule(shoulder, 0.112, 0.13, this.blue, 0, -0.1, 0, 9);
      upperBlue.scale.set(1.01, 0.9, 1.01);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.46, 0);
      shoulder.add(elbow);
      const lower = this.addCapsule(elbow, 0.095, 0.26, this.red, 0, -0.2, 0, 9);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 9, 7), this.redDark);
      hand.scale.set(0.72, 1.1, 0.64);
      hand.position.y = -0.4;
      elbow.add(hand);
      this.arms[side === -1 ? 'left' : 'right'] = { shoulder, elbow, hand, upper, lower };
    }

    // Legs.
    this.legs = {};
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.18, 1.02, 0);
      rig.add(hip);
      const thigh = this.addCapsule(hip, 0.13, 0.28, this.blue, 0, -0.25, 0, 9);
      const thighPanel = this.addCapsule(hip, 0.132, 0.13, this.red, 0, -0.08, 0.015, 9);
      thighPanel.scale.set(1.01, 0.88, 1.01);

      const knee = new THREE.Group();
      knee.position.set(0, -0.51, 0);
      hip.add(knee);
      const shin = this.addCapsule(knee, 0.105, 0.29, this.blueDark, 0, -0.23, 0, 9);
      const boot = this.addCapsule(knee, 0.11, 0.16, this.red, 0, -0.46, 0.015, 9);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), this.redDark);
      foot.position.set(0, -0.56, 0.06);
      knee.add(foot);
      this.legs[side === -1 ? 'left' : 'right'] = { hip, knee, thigh, shin, boot, foot };
    }

    // Tiny web shooters.
    for (const side of [-1, 1]) {
      const shooter = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 4, 9), this.black);
      shooter.rotation.x = Math.PI / 2;
      shooter.position.set(side * 0.39, 1.33, 0);
      rig.add(shooter);
    }

    this.rig.scale.setScalar(1.03);
  }

  buildShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.62)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    this.scene.add(this.shadow);
  }

  getHandWorld(target = new THREE.Vector3()) {
    return this.arms.right.hand.getWorldPosition(target);
  }

  setPosition(position) {
    this.root.position.copy(position);
  }

  setFacing(yaw, instant = false) {
    if (instant) this.root.rotation.y = yaw;
    else this.root.rotation.y = this.lerpAngle(this.root.rotation.y, yaw, 0.16);
  }

  lerpAngle(a, b, t) {
    let d = ((b - a + Math.PI) % TAU) - Math.PI;
    if (d < -Math.PI) d += TAU;
    return a + d * t;
  }

  update(dt, state) {
    this.time += dt;
    const { grounded, swinging, velocity, speed, shootTimer, strikeTimer, dodgeTimer, aimTarget, surfaceY } = state;

    const speedN = THREE.MathUtils.clamp(speed / 45, 0, 1);
    const target = {
      swing: swinging ? 1 : 0,
      shoot: shootTimer > 0 ? 1 : 0,
      strike: strikeTimer > 0 ? 1 : 0,
      run: grounded ? THREE.MathUtils.clamp(speed / 13, 0, 1) : 0,
      fall: !grounded && !swinging ? 1 : 0,
      idle: grounded && speed < 1 ? 1 : 0,
    };
    for (const key of Object.keys(this.pose)) {
      this.pose[key] = THREE.MathUtils.damp(this.pose[key], target[key], key === 'strike' ? 22 : 9, dt);
    }

    // Body bob and tilt.
    const t = this.time;
    const runWave = Math.sin(t * 13) * 0.5;
    const bodyBob = this.pose.idle * Math.sin(t * 2.1) * 0.012 + this.pose.run * Math.abs(runWave) * 0.05;
    this.rig.position.y = bodyBob;
    this.rig.rotation.x = -this.pose.swing * 0.19 + this.pose.fall * 0.04 + this.pose.strike * 0.1;
    this.rig.rotation.z = Math.sin(t * 1.6) * 0.008 + this.pose.swing * THREE.MathUtils.clamp(-velocity.x * 0.008, -0.2, 0.2);

    // Head looks toward target while airborne, otherwise forward.
    let headYaw = 0;
    let headPitch = 0;
    if ((swinging || !grounded) && aimTarget) {
      const local = this.root.worldToLocal(aimTarget.clone());
      headYaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -0.55, 0.55);
      headPitch = THREE.MathUtils.clamp(-Math.atan2(local.y - 2, Math.hypot(local.x, local.z)), -0.4, 0.35);
    }
    this.headPivot.rotation.y = THREE.MathUtils.damp(this.headPivot.rotation.y, headYaw - this.pose.strike * 0.2, 8, dt);
    this.headPivot.rotation.x = THREE.MathUtils.damp(this.headPivot.rotation.x, headPitch, 8, dt);

    // Arms.
    for (const side of [-1, 1]) {
      const arm = side === -1 ? this.arms.left : this.arms.right;
      let sx = 0;
      let sz = side * 0.1;
      let ex = 0.12;
      let ez = 0;

      if (this.pose.idle > 0.01) {
        sx += -0.04 + Math.sin(t * 1.7 + side) * 0.02;
        sz += side * 0.16;
        ex = 0.1;
      }
      if (this.pose.run > 0.01) {
        const run = Math.sin(t * 13 + (side === -1 ? 0 : Math.PI)) * 0.9 * this.pose.run;
        sx += run;
        ex = 0.5 + Math.max(0, run) * 0.6;
        sz = side * 0.15;
      }
      if (this.pose.swing > 0.01) {
        if (side === 1) {
          // Web arm reaches overhead.
          sx += -2.65 * this.pose.swing;
          sz += -0.24 * this.pose.swing;
          ex = 0.15;
        } else {
          // Free arm trails in the wind.
          sx += 1.1 * this.pose.swing;
          sz += -0.7 * this.pose.swing;
          ex = 0.7 * this.pose.swing;
        }
      }
      if (this.pose.fall > 0.01) {
        sx += -0.55 * this.pose.fall;
        sz += side * (0.7 * this.pose.fall);
        ex = 0.55;
      }
      if (this.pose.shoot > 0.01) {
        sx = THREE.MathUtils.lerp(sx, -1.48, this.pose.shoot);
        sz = THREE.MathUtils.lerp(sz, -0.08, this.pose.shoot);
        ex = THREE.MathUtils.lerp(ex, 0.08, this.pose.shoot);
      }
      if (this.pose.strike > 0.01) {
        if (side === 1) {
          sx = THREE.MathUtils.lerp(sx, -1.25, this.pose.strike);
          sz = THREE.MathUtils.lerp(sz, -0.2, this.pose.strike);
          ex = THREE.MathUtils.lerp(ex, 1.2, this.pose.strike);
        } else {
          sx = THREE.MathUtils.lerp(sx, 0.5, this.pose.strike);
          sz = THREE.MathUtils.lerp(sz, 0.5, this.pose.strike);
        }
      }

      arm.shoulder.rotation.x = THREE.MathUtils.damp(arm.shoulder.rotation.x, sx, 13, dt);
      arm.shoulder.rotation.z = THREE.MathUtils.damp(arm.shoulder.rotation.z, sz, 13, dt);
      arm.shoulder.rotation.y = THREE.MathUtils.damp(arm.shoulder.rotation.y, side * 0.04, 10, dt);
      arm.elbow.rotation.x = THREE.MathUtils.damp(arm.elbow.rotation.x, -ex, 14, dt);
      arm.elbow.rotation.z = ez;
    }

    // Legs.
    for (const side of [-1, 1]) {
      const leg = side === -1 ? this.legs.left : this.legs.right;
      let hx = 0;
      let hz = side * 0.025;
      let kx = 0.05;

      if (this.pose.run > 0.01) {
        const run = Math.sin(t * 13 + (side === -1 ? 0 : Math.PI)) * 0.85 * this.pose.run;
        hx += run;
        kx += Math.max(0, -run) * 1.2 + 0.15;
        hz += side * 0.02;
      }
      if (this.pose.swing > 0.01) {
        hx += (side === 1 ? 0.5 : 0.28) * this.pose.swing;
        kx += (side === 1 ? 0.9 : 0.45) * this.pose.swing;
        hz += side * 0.1;
      }
      if (this.pose.fall > 0.01) {
        hx += side * 0.25 * this.pose.fall;
        kx += 0.5 * this.pose.fall;
        hz += side * 0.16 * this.pose.fall;
      }
      if (this.pose.strike > 0.01) {
        hx += (side === 1 ? 0.45 : -0.3) * this.pose.strike;
        kx += 0.55 * this.pose.strike;
      }

      leg.hip.rotation.x = THREE.MathUtils.damp(leg.hip.rotation.x, hx, 13, dt);
      leg.hip.rotation.z = THREE.MathUtils.damp(leg.hip.rotation.z, hz, 12, dt);
      leg.knee.rotation.x = THREE.MathUtils.damp(leg.knee.rotation.x, kx, 14, dt);
    }

    // Landing squash translated into a short crouch.
    if (grounded) {
      this.rig.position.y -= this.pose.fall * 0.05;
    }

    // Shadow.
    const hover = Math.max(0, this.root.position.y - (surfaceY ?? 0));
    this.shadow.position.set(this.root.position.x, (surfaceY ?? 0) + 0.035, this.root.position.z);
    const shadowScale = THREE.MathUtils.clamp(1 - hover / 40, 0.32, 1.4);
    this.shadow.scale.setScalar(shadowScale);
    this.shadow.material.opacity = THREE.MathUtils.clamp(0.55 - hover / 70, 0.08, 0.55);
    this.shadow.rotation.z = this.root.rotation.y;
  }

  getWorldPosition(target = new THREE.Vector3()) {
    return this.root.getWorldPosition(target);
  }
}

export class Goblin {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'GreenGoblin';
    this.scene.add(this.root);
    this.visual = new THREE.Group();
    this.root.add(this.visual);

    this.green = mat('#55a52b', { roughness: 0.5, flatShading: true, emissive: '#0a2303', emissiveIntensity: 0.3 });
    this.greenDark = mat('#2d631d', { roughness: 0.62, flatShading: true });
    this.purple = mat('#522887', { roughness: 0.42, metalness: 0.18, emissive: '#16052d', emissiveIntensity: 0.3 });
    this.purpleDark = mat('#281044', { roughness: 0.52 });
    this.yellow = mat('#ffe23b', { roughness: 0.22, emissive: '#ffcf00', emissiveIntensity: 1.25 });
    this.brown = mat('#4b3020', { roughness: 0.78 });
    this.black = mat('#0b0b0e', { roughness: 0.5 });
    this.time = 0;
    this.arms = {};
    this.headPivot = null;
    this.webWrap = null;
    this.bombHand = null;
    this.normalY = 0;
    this.buildGlider();
    this.buildGoblin();
    this.buildWebWrap();
  }

  buildGlider() {
    const glider = new THREE.Group();
    this.glider = glider;
    this.visual.add(glider);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 3.2), this.purpleDark);
    deck.position.y = -0.05;
    glider.add(deck);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 4), this.purple);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0.05, -2.2);
    glider.add(nose);

    // Bat-wing glider surfaces.
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.8);
      shape.lineTo(1.0, 0.65);
      shape.lineTo(4.6, 1.1);
      shape.lineTo(3.9, 0.1);
      shape.lineTo(4.8, -0.75);
      shape.lineTo(2.0, -0.5);
      shape.lineTo(0, -0.9);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2);
      const wing = new THREE.Mesh(geo, this.purple);
      wing.scale.x = side;
      wing.position.set(0, 0.06, 0);
      glider.add(wing);

      const trimShape = new THREE.Shape();
      trimShape.moveTo(0.85, 0.64);
      trimShape.lineTo(4.55, 1.05);
      trimShape.lineTo(3.9, 0.13);
      trimShape.lineTo(4.72, -0.72);
      const trimGeo = new THREE.BufferGeometry().setFromPoints(trimShape.getPoints());
      const trim = new THREE.Line(trimGeo, new THREE.LineBasicMaterial({ color: '#92ff73', transparent: true, opacity: 0.8 }));
      trim.rotation.x = Math.PI / 2;
      trim.scale.x = side;
      trim.position.y = 0.17;
      glider.add(trim);

      const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.7, 8), this.black);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(side * 0.55, -0.18, 1.25);
      glider.add(engine);
      const engineGlow = glowSprite(GLOW, '#7cff65', 2.8, 0.78);
      engineGlow.position.set(side * 0.55, -0.18, 1.7);
      glider.add(engineGlow);
      if (!this.engineGlows) this.engineGlows = [];
      this.engineGlows.push(engineGlow);
    }

    // Handle bars.
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.85, 6), this.black);
      bar.position.set(side * 0.38, 0.45, -0.95);
      bar.rotation.x = 0.35;
      bar.rotation.z = side * 0.15;
      glider.add(bar);
    }

    const batEyes = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), this.yellow);
    batEyes.position.set(0, 0.18, -2.9);
    glider.add(batEyes);
  }

  buildGoblin() {
    const body = new THREE.Group();
    body.position.y = 0.68;
    this.body = body;
    this.visual.add(body);

    // Legs astride glider.
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 7), this.purple);
      leg.position.set(side * 0.28, 0.38, 0.1);
      leg.rotation.z = side * 0.4;
      leg.rotation.x = 0.2;
      body.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.42), this.greenDark);
      boot.position.set(side * 0.48, 0.04, 0.12);
      body.add(boot);
    }

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.5, 5, 9), this.purple);
    torso.position.y = 1.25;
    torso.scale.set(1.05, 1, 0.82);
    body.add(torso);

    const tunic = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.85, 7), this.purpleDark);
    tunic.position.y = 0.95;
    tunic.rotation.y = 0.3;
    body.add(tunic);

    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 4, 12), this.brown);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 1.09;
    body.add(belt);

    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.22), this.brown);
    satchel.position.set(-0.37, 1.02, 0.14);
    satchel.rotation.z = 0.16;
    body.add(satchel);

    // Shoulders / arms.
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.43, 1.53, 0);
      body.add(shoulder);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.3, 4, 7), this.purple);
      upper.position.y = -0.22;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.44;
      shoulder.add(elbow);
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.26, 4, 7), this.green);
      forearm.position.y = -0.2;
      elbow.add(forearm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), this.greenDark);
      hand.position.y = -0.38;
      elbow.add(hand);
      this.arms[side === -1 ? 'left' : 'right'] = { shoulder, elbow, hand };
    }

    // Bomb held in left hand.
    const bomb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 9),
      new THREE.MeshStandardMaterial({ color: '#ff7418', roughness: 0.42, emissive: '#ff3a00', emissiveIntensity: 0.7 })
    );
    bomb.scale.y = 0.82;
    bomb.position.y = -0.42;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.13, 5), this.greenDark);
    stem.position.y = 0.2;
    bomb.add(stem);
    this.arms.left.hand.add(bomb);
    this.bombHand = bomb;

    // Head and hood.
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.93, 0);
    body.add(this.headPivot);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.37, 12, 9), this.purple);
    hood.scale.set(1, 1.07, 0.92);
    hood.position.y = 0.24;
    this.headPivot.add(hood);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), this.green);
    head.scale.set(0.92, 1, 1.05);
    head.position.set(0, 0.19, 0.06);
    this.headPivot.add(head);

    // Nose, chin and manic grin.
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.38, 6), this.greenDark);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.14, 0.37);
    this.headPivot.add(nose);
    const chin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 5), this.greenDark);
    chin.position.set(0, 0.01, 0.24);
    chin.rotation.x = Math.PI;
    this.headPivot.add(chin);

    for (const side of [-1, 1]) {
      // Pointed ears.
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.44, 5), this.green);
      ear.position.set(side * 0.32, 0.26, 0.02);
      ear.rotation.z = side * -1.0;
      ear.rotation.x = 0.12;
      this.headPivot.add(ear);

      const eyeOutline = new THREE.Mesh(new THREE.SphereGeometry(0.08, 9, 7), this.black);
      eyeOutline.scale.set(1.6, 0.9, 0.22);
      eyeOutline.position.set(side * 0.1, 0.22, 0.28);
      eyeOutline.rotation.z = side * 0.32;
      this.headPivot.add(eyeOutline);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.064, 9, 7), this.yellow);
      eye.scale.set(1.55, 0.8, 0.2);
      eye.position.set(side * 0.1, 0.225, 0.29);
      eye.rotation.z = side * 0.32;
      this.headPivot.add(eye);
    }

    // Grin.
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 3, 12, Math.PI), this.black);
    mouth.rotation.x = Math.PI / 2;
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, 0.07, 0.29);
    this.headPivot.add(mouth);

    // Hood peak.
    const peak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), this.purpleDark);
    peak.position.set(0, 0.62, -0.06);
    peak.rotation.x = -0.25;
    this.headPivot.add(peak);
  }

  buildWebWrap() {
    const wrap = new THREE.Group();
    const webMat = new THREE.MeshBasicMaterial({ color: '#e8f8ff', transparent: true, opacity: 0.88 });
    for (let i = 0; i < 10; i++) {
      const strand = new THREE.Mesh(new THREE.TorusGeometry(0.36 + i * 0.02, 0.012, 3, 18, Math.PI * 1.5), webMat);
      strand.rotation.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
      strand.position.y = 1.15 + (Math.random() - 0.5) * 0.7;
      wrap.add(strand);
    }
    wrap.visible = false;
    this.root.add(wrap);
    this.webWrap = wrap;
  }

  update(dt, state = {}) {
    this.time += dt;
    const { position, yaw = 0, bank = 0, bobPhase = 0, stunned = false, bob = true, boss = false } = state;
    if (position) this.root.position.copy(position);
    this.visual.rotation.y = THREE.MathUtils.damp(this.visual.rotation.y, yaw, 5, dt);
    this.visual.rotation.z = THREE.MathUtils.damp(this.visual.rotation.z, bank, 5, dt);
    this.visual.rotation.x = THREE.MathUtils.damp(this.visual.rotation.x, -0.04 - Math.abs(bank) * 0.3, 5, dt);

    const t = this.time;
    const hover = bob ? Math.sin(t * 3.2 + bobPhase) * 0.18 : 0;
    this.glider.position.y = hover;
    this.body.position.y = 0.68 + hover * 0.8;
    this.glider.rotation.z = Math.sin(t * 1.8 + bobPhase) * 0.015;
    this.body.rotation.z = Math.sin(t * 1.5) * 0.02;

    // Idle engine pulse.
    if (this.engineGlows) {
      this.engineGlows.forEach((g, i) => {
        g.scale.setScalar(2.5 + Math.sin(t * 5 + i) * 0.3);
        g.material.opacity = 0.6 + Math.sin(t * 8 + i) * 0.17;
      });
    }

    // Stunned: arms flail and glider wobbles. Otherwise: evil crouch and throw flourish.
    const arms = this.arms;
    const cackle = stunned ? Math.sin(t * 12) * 0.1 : Math.sin(t * 2.2) * 0.03;
    arms.left.shoulder.rotation.x = THREE.MathUtils.damp(arms.left.shoulder.rotation.x, stunned ? -1.8 : 0.8, 8, dt);
    arms.left.shoulder.rotation.z = THREE.MathUtils.damp(arms.left.shoulder.rotation.z, stunned ? -0.7 : 0.2, 8, dt);
    arms.right.shoulder.rotation.x = THREE.MathUtils.damp(arms.right.shoulder.rotation.x, stunned ? -2.2 : -0.3, 8, dt);
    arms.right.shoulder.rotation.z = THREE.MathUtils.damp(arms.right.shoulder.rotation.z, stunned ? 0.7 : -0.2, 8, dt);
    arms.left.elbow.rotation.x = THREE.MathUtils.damp(arms.left.elbow.rotation.x, stunned ? -0.5 : -0.5, 8, dt);
    arms.right.elbow.rotation.x = THREE.MathUtils.damp(arms.right.elbow.rotation.x, stunned ? -0.8 : -0.8, 8, dt);

    this.headPivot.rotation.z = cackle;
    this.headPivot.rotation.y = stunned ? Math.sin(t * 7) * 0.12 : Math.sin(t * 0.8) * 0.12;
    this.headPivot.rotation.x = stunned ? -0.15 : Math.sin(t * 1.5) * 0.03;

    if (this.bombHand) {
      this.bombHand.visible = !stunned;
      this.bombHand.rotation.y += dt * 1.4;
      this.bombHand.material.emissiveIntensity = 0.55 + Math.sin(t * 6) * 0.35;
    }
    this.webWrap.visible = stunned;
    if (this.webWrap.visible) {
      this.webWrap.rotation.y += dt * 1.2;
      this.webWrap.rotation.z = Math.sin(t * 2) * 0.12;
    }
  }

  setPosition(position) {
    this.root.position.copy(position);
  }

  getWorldPosition(target = new THREE.Vector3()) {
    return this.root.getWorldPosition(target);
  }
}

export class HenchmanDrone {
  constructor(scene, position) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.scene.add(this.root);
    this.time = 0;
    this.baseY = position.y;
    this.alive = true;
    this.captured = false;
    this.capturedTimer = 0;

    this.green = mat('#4f982b', { flatShading: true });
    this.purple = mat('#49247a', { flatShading: true });
    this.black = mat('#080b12', { roughness: 0.4, metalness: 0.55 });
    this.blueGlow = new THREE.MeshBasicMaterial({ color: '#6be7ff' });
    this.redGlow = new THREE.MeshBasicMaterial({ color: '#ff2c42' });

    this.body = new THREE.Group();
    this.root.add(this.body);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 4, 8), this.purple);
    torso.position.y = 1.2;
    this.body.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), this.green);
    head.position.y = 1.73;
    head.scale.set(0.9, 1, 0.92);
    this.body.add(head);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), this.green);
      ear.position.set(side * 0.24, 1.78, 0);
      ear.rotation.z = -side * 1.1;
      this.body.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), this.yellow ?? this.redGlow);
      eye.position.set(side * 0.08, 1.77, 0.23);
      this.body.add(eye);
    }
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), this.green);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 1.65, 0.26);
    this.body.add(snout);

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 7), this.purple);
      arm.position.set(side * 0.35, 1.16, 0.02);
      arm.rotation.z = side * 0.2;
      this.body.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), this.green);
      hand.position.set(side * 0.4, 0.89, 0.05);
      this.body.add(hand);
    }
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 4, 7), this.purple);
      leg.position.set(side * 0.15, 0.63, 0);
      leg.rotation.z = side * 0.12;
      this.body.add(leg);
    }

    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 2.0), this.black);
    board.position.y = 0.12;
    this.root.add(board);
    const boardGlow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 1.2), this.blueGlow);
    boardGlow.position.y = 0.22;
    this.root.add(boardGlow);
    for (const side of [-1, 1]) {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.5, 7), this.black);
      thruster.rotation.x = Math.PI / 2;
      thruster.position.set(side * 0.42, 0.05, 0.65);
      this.root.add(thruster);
      const glow = glowSprite(GLOW, '#ff3d55', 1.5, 0.65);
      glow.position.set(side * 0.42, 0.05, 1.0);
      this.root.add(glow);
    }
    this.eyeGlow = glowSprite(GLOW, '#ff223c', 1.3, 0.5);
    this.eyeGlow.position.set(0, 1.77, 0.28);
    this.body.add(this.eyeGlow);
  }

  update(dt, playerPosition) {
    this.time += dt;
    if (this.captured) {
      this.capturedTimer += dt;
      this.root.position.y -= dt * (4 + this.capturedTimer * 9);
      this.root.rotation.z += dt * 5;
      this.root.rotation.x += dt * 2;
      if (this.root.position.y < 0.8) this.root.visible = false;
      return;
    }
    const bob = Math.sin(this.time * 2.6) * 0.4;
    this.root.position.y = this.baseY + bob;
    this.root.rotation.z = Math.sin(this.time * 1.5) * 0.07;
    this.root.rotation.y = Math.atan2(playerPosition.x - this.root.position.x, playerPosition.z - this.root.position.z);
    this.eyeGlow.material.opacity = 0.4 + Math.sin(this.time * 6) * 0.25;
  }

  capture() {
    this.captured = true;
    this.capturedTimer = 0;
  }
}

export class Citizen {
  constructor(scene, position, index) {
    this.scene = scene;
    this.position = position.clone();
    this.index = index;
    this.rescued = false;
    this.time = index * 0.7;
    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.scene.add(this.root);

    const skin = mat(index % 2 === 0 ? '#bd7d55' : '#895634', { roughness: 0.75 });
    const shirtColors = ['#ffb23d', '#ef4059', '#43c9de', '#e7e1d2'];
    const shirt = mat(shirtColors[index % shirtColors.length], { roughness: 0.72 });
    const pants = mat('#172039', { roughness: 0.8 });

    const body = new THREE.Group();
    this.root.add(body);
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 3, 6), pants);
    legs.position.y = 0.55;
    body.add(legs);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.3, 4, 7), shirt);
    torso.position.y = 1.05;
    body.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7), skin);
    head.position.y = 1.42;
    body.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.171, 9, 7, 0, TAU, 0, Math.PI * 0.55), mat(index % 2 ? '#1d1410' : '#4a2d18'));
    hair.position.y = 1.44;
    body.add(hair);

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 3, 6), shirt);
      arm.position.set(side * 0.23, 1.05, 0);
      arm.rotation.z = side * 0.15;
      body.add(arm);
    }
    const raisedArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 3, 6), shirt);
    raisedArm.position.set(0.22, 1.34, 0);
    raisedArm.rotation.z = -1.9;
    body.add(raisedArm);

    // Rescue beacon.
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.7, 14, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#6eeaff', transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    beam.position.y = 7;
    this.root.add(beam);
    this.beam = beam;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.55, 30),
      new THREE.MeshBasicMaterial({ color: '#6eeaff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.root.add(ring);
    this.ring = ring;
    const glow = glowSprite(GLOW, '#6eeaff', 4.5, 0.45);
    glow.position.y = 1.2;
    this.root.add(glow);
    this.glow = glow;
    this.body = body;
    this.raisedArm = raisedArm;
  }

  update(dt) {
    if (this.rescued) return;
    this.time += dt;
    const wave = Math.sin(this.time * 5) * 0.2;
    this.raisedArm.rotation.z = -1.9 + wave;
    this.body.position.y = Math.sin(this.time * 2.5) * 0.03;
    this.beam.material.opacity = 0.07 + Math.sin(this.time * 2.2) * 0.025;
    this.ring.scale.setScalar(1 + Math.sin(this.time * 1.7) * 0.08);
    this.glow.material.opacity = 0.35 + Math.sin(this.time * 4) * 0.12;
  }

  rescue() {
    this.rescued = true;
    this.root.visible = false;
  }
}
