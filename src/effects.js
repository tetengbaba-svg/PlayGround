import * as THREE from 'three';

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function ringTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GLOW = glowTexture();
const RING = ringTexture();

export class Effects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.glowTexture = GLOW;
    this.ringTexture = RING;
    this.poolSize = 700;
    this.positions = new Float32Array(this.poolSize * 3);
    this.colors = new Float32Array(this.poolSize * 3);
    this.particles = [];
    for (let i = 0; i < this.poolSize; i++) {
      this.particles.push({
        life: 0,
        maxLife: 1,
        velocity: new THREE.Vector3(),
        gravity: 0,
        drag: 0.98,
        baseColor: new THREE.Color(),
      });
      this.positions[i * 3 + 1] = -9999;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: GLOW,
        alphaTest: 0.01,
        sizeAttenuation: true,
      })
    );
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.cursor = 0;
    this.flashes = [];
    this.rings = [];
    this.lights = [];
    this.webs = [];
    this.trailTimers = new Map();
    this.time = 0;
  }

  spawn(origin, color, count = 8, options = {}) {
    const {
      speed = 7,
      spread = 1,
      upward = 0.3,
      size = 1,
      life = 0.6,
      gravity = -9,
      drag = 0.965,
      colorVariance = 0.4,
    } = options;
    const base = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.poolSize;
      const p = this.particles[i];
      p.life = life * (0.55 + Math.random() * 0.7);
      p.maxLife = p.life;
      p.gravity = gravity;
      p.drag = drag;
      p.baseColor.copy(base);
      const variance = (Math.random() - 0.5) * colorVariance;
      p.baseColor.offsetHSL(variance * 0.1, variance * 0.15, variance * 0.24);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speedJitter = speed * (0.3 + Math.random() * 0.9);
      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speedJitter * spread,
        Math.cos(phi) * speedJitter * 0.55 + upward * speed,
        Math.sin(phi) * Math.sin(theta) * speedJitter * spread
      );
      this.positions[i * 3] = origin.x + (Math.random() - 0.5) * 0.5;
      this.positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.5;
      this.positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.5;
      this.colors[i * 3] = p.baseColor.r;
      this.colors[i * 3 + 1] = p.baseColor.g;
      this.colors[i * 3 + 2] = p.baseColor.b;
      this.points.material.size = Math.max(this.points.material.size, size * 0.5);
    }
  }

  trail(id, position, color, options = {}) {
    const now = this.time;
    const last = this.trailTimers.get(id) || 0;
    if (now - last < (options.interval || 0.035)) return;
    this.trailTimers.set(id, now);
    this.spawn(position, color, options.count || 1, {
      speed: options.speed || 1.4,
      spread: options.spread || 0.7,
      upward: options.upward || 0,
      life: options.life || 0.45,
      gravity: options.gravity ?? 0.2,
      drag: 0.96,
      colorVariance: 0.5,
    });
  }

  impact(position, color = '#bdefff', count = 12, scale = 1) {
    this.spawn(position, color, count, { speed: 9 * scale, spread: 1, upward: 0.5, life: 0.42, gravity: -10 });
    this.spawn(position, '#ffffff', Math.floor(count / 3), { speed: 6 * scale, spread: 1, upward: 0.2, life: 0.22, gravity: 0 });
  }

  webSplat(position) {
    this.spawn(position, '#f2fbff', 20, { speed: 10, spread: 1, upward: 0.2, life: 0.7, gravity: -3.5 });
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: '#eefaff', transparent: true, opacity: 0.95 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * (0.6 + Math.random() * 0.7), Math.sin(angle) * (0.6 + Math.random() * 0.7), 0),
      ];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat);
      line.rotation.z = Math.random() * Math.PI;
      group.add(line);
    }
    group.position.copy(position);
    this.scene.add(group);
    this.webs.push({ group, life: 1.4, maxLife: 1.4 });
  }

  explosion(position, scale = 1) {
    this.spawn(position, '#ffcf5c', 30, { speed: 17 * scale, spread: 1, upward: 0.6, life: 0.7, gravity: -3, colorVariance: 1 });
    this.spawn(position, '#ff5c1c', 38, { speed: 12 * scale, spread: 1, upward: 0.4, life: 0.9, gravity: -1.5, colorVariance: 0.8 });
    this.spawn(position, '#8f2b14', 25, { speed: 6 * scale, spread: 1, upward: 1.1, life: 1.5, gravity: 1.4, colorVariance: 0.3 });
    this.spawn(position, '#f7fbff', 10, { speed: 20 * scale, spread: 1, upward: 0.2, life: 0.24, gravity: 0 });

    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: GLOW, color: '#ffd18b', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    flash.position.copy(position);
    flash.scale.setScalar(6 * scale);
    this.scene.add(flash);
    this.flashes.push({ mesh: flash, life: 0.38, maxLife: 0.38, size: 28 * scale, color: '#ffd18b' });

    const ring = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: RING, color: '#ffb55f', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.position.copy(position);
    ring.scale.setScalar(3 * scale);
    this.scene.add(ring);
    this.rings.push({ mesh: ring, life: 0.62, maxLife: 0.62, from: 2 * scale, to: 18 * scale, color: '#ffb55f' });

    const light = new THREE.PointLight('#ff7d32', 160 * scale, 60, 2);
    light.position.copy(position);
    this.scene.add(light);
    this.lights.push({ light, life: 0.32, maxLife: 0.32, intensity: 160 * scale });
  }

  shockwave(position, color = '#7cff65', scale = 1) {
    const ring = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: RING, color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.position.copy(position);
    ring.scale.setScalar(5 * scale);
    this.scene.add(ring);
    this.rings.push({ mesh: ring, life: 1.1, maxLife: 1.1, from: 4 * scale, to: 46 * scale, color });
    this.spawn(position, color, 24, { speed: 13 * scale, spread: 1, upward: 0, life: 0.7, gravity: 0 });
  }

  dust(position, scale = 1) {
    this.spawn(position, '#b7c4d6', 13, {
      speed: 4.5 * scale,
      spread: 1,
      upward: 0.5,
      life: 0.8,
      gravity: -1,
      colorVariance: 0.2,
    });
  }

  update(dt) {
    this.time += dt;
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.positions[i * 3 + 1] = -9999;
        continue;
      }
      p.velocity.y += p.gravity * dt;
      p.velocity.multiplyScalar(Math.pow(p.drag, dt * 60));
      this.positions[i * 3] += p.velocity.x * dt;
      this.positions[i * 3 + 1] += p.velocity.y * dt;
      this.positions[i * 3 + 2] += p.velocity.z * dt;
      const a = Math.max(0, p.life / p.maxLife);
      const fade = a * a;
      this.colors[i * 3] = p.baseColor.r * fade;
      this.colors[i * 3 + 1] = p.baseColor.g * fade;
      this.colors[i * 3 + 2] = p.baseColor.b * fade;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= dt;
      const a = Math.max(0, f.life / f.maxLife);
      f.mesh.material.opacity = a * 0.95;
      const s = THREE.MathUtils.lerp(f.size, f.size * 0.25, 1 - a);
      f.mesh.scale.setScalar(s);
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        f.mesh.material.dispose();
        this.flashes.splice(i, 1);
      }
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const t = 1 - Math.max(0, r.life / r.maxLife);
      const eased = 1 - Math.pow(1 - t, 2);
      r.mesh.scale.setScalar(THREE.MathUtils.lerp(r.from, r.to, eased));
      r.mesh.material.opacity = (1 - t) * 0.85;
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        r.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.life -= dt;
      const a = Math.max(0, l.life / l.maxLife);
      l.light.intensity = l.intensity * a * a;
      if (l.life <= 0) {
        this.scene.remove(l.light);
        this.lights.splice(i, 1);
      }
    }

    for (let i = this.webs.length - 1; i >= 0; i--) {
      const w = this.webs[i];
      w.life -= dt;
      const a = Math.max(0, w.life / w.maxLife);
      w.group.children.forEach((line) => {
        if (line.material) line.material.opacity = a;
      });
      w.group.scale.setScalar(1 + (1 - a) * 0.25);
      if (w.life <= 0) {
        this.scene.remove(w.group);
        w.group.children.forEach((line) => line.geometry.dispose());
        this.webs.splice(i, 1);
      }
    }
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
