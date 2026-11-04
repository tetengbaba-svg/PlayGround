import * as THREE from 'three';

export const CITY = {
  centerX: 0,
  centerZ: 0,
  gridStep: 58,
  half: 3,
  streetY: 0,
  start: { x: 58, z: 174, top: 66 },
  waypoint: { x: -58, z: 58, top: 82 },
  bossTower: { x: 0, z: -174, top: 164 },
};

const PALETTES = {
  sunset: {
    top: '#071335',
    mid: '#1b2f68',
    horizon: '#ff7a58',
    fog: '#1d2c55',
    fogDensity: 0.0038,
    hemiSky: '#8fb7ff',
    hemiGround: '#281826',
    sun: '#ffb28a',
    sunIntensity: 2.3,
    fill: '#396dff',
    stars: 0.22,
  },
  night: {
    top: '#02040d',
    mid: '#08152f',
    horizon: '#182f5c',
    fog: '#081226',
    fogDensity: 0.005,
    hemiSky: '#3b5f9d',
    hemiGround: '#100c19',
    sun: '#7d9dff',
    sunIntensity: 1.25,
    fill: '#ff4b72',
    stars: 0.9,
  },
  final: {
    top: '#03040b',
    mid: '#10172a',
    horizon: '#354a2c',
    fog: '#0a1410',
    fogDensity: 0.0058,
    hemiSky: '#597a58',
    hemiGround: '#0b0b11',
    sun: '#8fff70',
    sunIntensity: 1.05,
    fill: '#3157ff',
    stars: 0.45,
  },
  dawn: {
    top: '#122a55',
    mid: '#895d80',
    horizon: '#ffcf93',
    fog: '#5e617e',
    fogDensity: 0.0034,
    hemiSky: '#ffd7b5',
    hemiGround: '#241c2b',
    sun: '#ffd2a0',
    sunIntensity: 2.6,
    fill: '#597dff',
    stars: 0,
  },
};

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeWindowTexture(seed, warm = true) {
  const random = mulberry32(seed);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0c1320';
  ctx.fillRect(0, 0, size, size);

  // Subtle facade panel variation.
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(70,88,120,${random() * 0.12})`;
    ctx.fillRect(0, random() * size, size, 1 + random() * 15);
  }

  const cols = 7;
  const rows = 12;
  const cellW = size / cols;
  const cellH = size / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lit = random() > 0.68;
      const warmLight = random() > 0.6;
      if (lit) {
        const palette = warmLight
          ? ['#ffdba0', '#ffb963', '#f7e6c4', '#ffcf8a']
          : ['#8ee6ff', '#79a9ff', '#adfff2', '#d6ecff'];
        ctx.fillStyle = palette[Math.floor(random() * palette.length)];
        ctx.globalAlpha = 0.48 + random() * 0.52;
      } else {
        ctx.fillStyle = random() > 0.5 ? '#111b2e' : '#0a111e';
        ctx.globalAlpha = 1;
      }
      const insetX = 5;
      const insetY = 4;
      ctx.fillRect(col * cellW + insetX, row * cellH + insetY, cellW - insetX * 2, cellH - insetY * 2);
      ctx.globalAlpha = 1;
    }
  }

  // Window frames.
  ctx.strokeStyle = 'rgba(2,6,14,0.9)';
  ctx.lineWidth = 3;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath();
    ctx.moveTo(col * cellW, 0);
    ctx.lineTo(col * cellW, size);
    ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellH);
    ctx.lineTo(size, row * cellH);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeBillboardTexture(text, accent = '#ff2948', sub = 'NEW YORK') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, 496, 240);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 20; i++) ctx.fillRect(0, i * 16, 512, 2);
  ctx.fillStyle = accent;
  ctx.font = '800 94px "Arial Narrow", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 115);
  ctx.fillStyle = '#d9ecff';
  ctx.font = '600 26px "Trebuchet MS", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText(sub, 256, 190);
  ctx.fillStyle = accent;
  ctx.fillRect(60, 221, 392, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeRoofTexture(kind = 'normal') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const random = mulberry32(kind === 'start' ? 404 : kind === 'waypoint' ? 808 : 1212);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#263247');
  base.addColorStop(0.55, '#1c2637');
  base.addColorStop(1, '#141c2b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Concrete panel seams.
  ctx.strokeStyle = 'rgba(6,11,20,0.85)';
  ctx.lineWidth = 3;
  for (let p = 0; p <= 8; p++) {
    const at = (p / 8) * size;
    ctx.beginPath();
    ctx.moveTo(at, 0);
    ctx.lineTo(at, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, at);
    ctx.lineTo(size, at);
    ctx.stroke();
  }

  // Grime, scuffs and old tar patches.
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? '8,14,24' : '74,92,116'},${0.05 + random() * 0.12})`;
    const w = 12 + random() * 90;
    const h = 8 + random() * 42;
    ctx.fillRect(random() * size, random() * size, w, h);
  }

  // Safety border.
  ctx.strokeStyle = 'rgba(255,207,92,0.3)';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 18]);
  ctx.strokeRect(18, 18, size - 36, size - 36);
  ctx.setLineDash([]);

  if (kind === 'start') {
    // Helipad: the read-at-a-glance landmark for the opening rooftop.
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = 'rgba(255,207,92,0.6)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 128, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,207,92,0.55)';
    ctx.font = '800 108px "Arial Narrow", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 0, 4);
    ctx.restore();

    // Rooftop access hatch.
    ctx.fillStyle = 'rgba(8,14,24,0.9)';
    ctx.fillRect(356, 56, 94, 94);
    ctx.strokeStyle = 'rgba(112,231,255,0.42)';
    ctx.lineWidth = 4;
    ctx.strokeRect(366, 66, 74, 74);
    ctx.fillStyle = 'rgba(112,231,255,0.55)';
    ctx.fillRect(398, 78, 10, 50);
  } else if (kind === 'waypoint') {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = 'rgba(112,231,255,0.55)';
    ctx.lineWidth = 8;
    for (let r = 48; r <= 144; r += 48) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(112,231,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -96);
    ctx.lineTo(34, -32);
    ctx.lineTo(-34, -32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Faded parking / utility markings.
    ctx.fillStyle = 'rgba(214,229,255,0.14)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(64 + i * 120, 400, 62, 6);
    }
    ctx.fillStyle = 'rgba(255,180,70,0.18)';
    ctx.beginPath();
    ctx.moveTo(54, 54);
    ctx.lineTo(118, 54);
    ctx.lineTo(54, 118);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export class City {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.buildings = [];
    this.anchors = [];
    this.cameraMeshes = [];
    this.roofs = [];
    this.cars = [];
    this.signs = [];
    this.beacons = [];
    this.moodName = 'sunset';
    this.time = 0;
    this.random = mulberry32(1987);
    this.glowTexture = makeGlowTexture();
    this.roofTextures = {
      start: makeRoofTexture('start'),
      waypoint: makeRoofTexture('waypoint'),
      normal: makeRoofTexture('normal'),
    };
    this.tmp = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.sky = null;
    this.sun = null;
    this.hemi = null;
    this.fill = null;
    this.fog = null;
    this.cityGroup = new THREE.Group();
    this.scene.add(this.cityGroup);

    this.buildLighting();
    this.buildSky();
    this.buildGround();
    this.buildBuildings();
    this.buildTraffic();
    this.buildChopper();
    this.setMood('sunset', true);
  }

  buildLighting() {
    this.hemi = new THREE.HemisphereLight(PALETTES.sunset.hemiSky, PALETTES.sunset.hemiGround, 1.35);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(PALETTES.sunset.sun, PALETTES.sunset.sunIntensity);
    this.sun.position.set(-130, 180, 90);
    this.scene.add(this.sun);

    this.fill = new THREE.DirectionalLight(PALETTES.sunset.fill, 0.8);
    this.fill.position.set(110, 80, -140);
    this.scene.add(this.fill);

    this.fog = new THREE.FogExp2(PALETTES.sunset.fog, PALETTES.sunset.fogDensity);
    this.scene.fog = this.fog;

    const bounce = new THREE.PointLight('#ff3e56', 120, 90, 2);
    bounce.position.set(0, 15, 120);
    this.scene.add(bounce);
    this.bounce = bounce;

    // Warm hero rim lights on the starting rooftop. They give the title shot and
    // the opening swings a clean red/blue silhouette against the dark city.
    const heroKey = new THREE.PointLight('#ffd0b0', 85, 32, 2);
    heroKey.position.set(CITY.start.x + 9, CITY.start.top + 7, CITY.start.z + 8);
    this.scene.add(heroKey);
    const heroRim = new THREE.PointLight('#5ac8ff', 55, 26, 2);
    heroRim.position.set(CITY.start.x - 8, CITY.start.top + 5, CITY.start.z - 4);
    this.scene.add(heroRim);
  }

  buildSky() {
    const geometry = new THREE.SphereGeometry(620, 32, 20);
    this.skyUniforms = {
      topColor: { value: new THREE.Color(PALETTES.sunset.top) },
      midColor: { value: new THREE.Color(PALETTES.sunset.mid) },
      horizonColor: { value: new THREE.Color(PALETTES.sunset.horizon) },
    };
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDir;
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        void main() {
          float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 low = mix(horizonColor, midColor, smoothstep(0.47, 0.62, h));
          vec3 col = mix(low, topColor, smoothstep(0.58, 0.95, h));
          float glow = pow(max(0.0, 1.0 - abs(vDir.y - 0.02) * 5.0), 3.0);
          col += horizonColor * glow * 0.12;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.sky = new THREE.Mesh(geometry, material);
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    // Stars.
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = this.random() * Math.PI * 2;
      const phi = Math.acos(0.08 + this.random() * 0.9);
      const r = 560;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: '#d3e8ff', size: 1.45, transparent: true, opacity: 0.22, sizeAttenuation: true, depthWrite: false, fog: false })
    );
    this.scene.add(this.stars);

    // Moon.
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(17, 24, 16),
      new THREE.MeshBasicMaterial({ color: '#fff4d5', fog: false })
    );
    moon.position.set(250, 280, -410);
    this.scene.add(moon);
    const moonGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTexture, color: '#ffddaa', transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    moonGlow.scale.set(150, 150, 1);
    moonGlow.position.copy(moon.position);
    this.scene.add(moonGlow);
    this.moon = moon;
    this.moonGlow = moonGlow;

    // Wispy horizon clouds as flattened sprites.
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.glowTexture,
          color: i % 3 === 0 ? '#ff9a7a' : '#879dc8',
          transparent: true,
          opacity: 0.07 + this.random() * 0.07,
          depthWrite: false,
          fog: false,
        })
      );
      const angle = this.random() * Math.PI * 2;
      cloud.position.set(Math.cos(angle) * 390, 80 + this.random() * 90, Math.sin(angle) * 390);
      cloud.scale.set(220 + this.random() * 240, 45 + this.random() * 40, 1);
      this.scene.add(cloud);
    }
  }

  buildGround() {
    const groundGeo = new THREE.PlaneGeometry(900, 900, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#080c14', roughness: 0.95, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    this.cityGroup.add(ground);

    // Central avenue.
    const avenue = new THREE.Mesh(
      new THREE.PlaneGeometry(56, 760),
      new THREE.MeshStandardMaterial({ color: '#111722', roughness: 0.82, metalness: 0.22 })
    );
    avenue.rotation.x = -Math.PI / 2;
    avenue.position.set(0, 0.01, 0);
    this.cityGroup.add(avenue);

    const lineMat = new THREE.MeshBasicMaterial({ color: '#d5be68', transparent: true, opacity: 0.56 });
    for (let z = -360; z < 360; z += 30) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 14), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(-18, 0.03, z);
      this.cityGroup.add(dash);
      const dash2 = dash.clone();
      dash2.position.x = 18;
      this.cityGroup.add(dash2);
    }

    // Crosswalk stripes at intersections.
    for (let i = -3; i <= 3; i++) {
      const z = i * CITY.gridStep + CITY.gridStep / 2;
      for (let s = -20; s <= 20; s += 4) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), new THREE.MeshBasicMaterial({ color: '#d2d9e4', transparent: true, opacity: 0.26 }));
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(s, 0.025, z);
        this.cityGroup.add(stripe);
      }
    }

    // Cyan lane strips.
    const cyanLine = new THREE.MeshBasicMaterial({ color: '#26d9ff', transparent: true, opacity: 0.32 });
    [-24, 24].forEach((x) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 700), cyanLine);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(x, 0.035, 0);
      this.cityGroup.add(strip);
    });

    // Street lamps down the avenue.
    const lampMat = new THREE.MeshBasicMaterial({ color: '#b8efff' });
    const poleMat = new THREE.MeshStandardMaterial({ color: '#1a2638', metalness: 0.7, roughness: 0.4 });
    for (let z = -330; z <= 330; z += 46) {
      for (const x of [-27, 27]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 9, 5), poleMat);
        pole.position.set(x, 4.5, z);
        this.cityGroup.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), lampMat);
        lamp.position.set(x, 9.1, z);
        this.cityGroup.add(lamp);
        const halo = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: this.glowTexture, color: '#79dfff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.copy(lamp.position);
        halo.scale.set(7, 7, 1);
        this.cityGroup.add(halo);
        this.beacons.push({ mesh: halo, phase: this.random() * 8, base: 4.5, kind: 'lamp' });
      }
    }
  }

  buildBuildings() {
    const facadeTextures = [makeWindowTexture(11), makeWindowTexture(29), makeWindowTexture(53), makeWindowTexture(77)];
    const facadeCache = facadeTextures.map((tex) => tex);

    for (let i = -CITY.half; i <= CITY.half; i++) {
      for (let j = -CITY.half; j <= CITY.half; j++) {
        if (i === 0) continue; // central open avenue
        const x = i * CITY.gridStep;
        const z = j * CITY.gridStep;
        const isStart = x === CITY.start.x && z === CITY.start.z;
        const isWaypoint = x === CITY.waypoint.x && z === CITY.waypoint.z;
        if (isStart || isWaypoint) {
          this.createBuilding({
            x,
            z,
            width: 44,
            depth: 44,
            height: isStart ? CITY.start.top : CITY.waypoint.top,
            seedIndex: Math.abs(i * 7 + j) % facadeCache.length,
            textureCache: facadeCache,
            accent: isStart ? '#ff2948' : '#70e7ff',
            style: isStart ? 'start' : 'waypoint',
          });
          continue;
        }

        const distance = Math.hypot(x, z);
        const downtownBoost = Math.max(0, 1 - distance / 260);
        const height = 30 + Math.floor(this.random() * 40 + downtownBoost * 24);
        const width = 36 + this.random() * 7;
        const depth = 36 + this.random() * 7;
        const accentRoll = this.random();
        const accent = accentRoll > 0.78 ? '#ff2948' : accentRoll > 0.46 ? '#70e7ff' : accentRoll > 0.24 ? '#ffb657' : '#a97cff';
        this.createBuilding({
          x,
          z,
          width,
          depth,
          height,
          seedIndex: Math.abs(i * 11 + j * 3) % facadeCache.length,
          textureCache: facadeCache,
          accent,
          style: 'normal',
        });
      }
    }

    this.createBossTower();
    this.createBackgroundSkyline(facadeCache);
  }

  createBuilding({ x, z, width, depth, height, seedIndex, textureCache, accent, style }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.cityGroup.add(group);

    const texture = textureCache[seedIndex].clone();
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, Math.round(width / 16)), Math.max(1, Math.round(height / 22)));
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: new THREE.Color('#b7a58b'),
      emissiveIntensity: 0.66,
      roughness: 0.72,
      metalness: 0.24,
      color: new THREE.Color('#9aa6b8'),
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    body.position.y = height / 2;
    group.add(body);
    this.cameraMeshes.push(body);

    // Setback crown on some buildings.
    let crownHeight = 0;
    if (style === 'normal' && this.random() > 0.62) {
      crownHeight = 6 + this.random() * 16;
      const crownW = width * 0.55;
      const crownD = depth * 0.55;
      const crownTex = texture.clone();
      crownTex.repeat.set(Math.max(1, Math.round(crownW / 14)), Math.max(1, Math.round(crownHeight / 18)));
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(crownW, crownHeight, crownD),
        new THREE.MeshStandardMaterial({
          map: crownTex,
          emissiveMap: crownTex,
          emissive: new THREE.Color('#b7a58b'),
          emissiveIntensity: 0.62,
          roughness: 0.7,
          metalness: 0.3,
          color: '#8b97a9',
        })
      );
      crown.position.y = height + crownHeight / 2;
      group.add(crown);
      this.cameraMeshes.push(crown);
    }

    const totalHeight = height + crownHeight;
    const roofTexture = this.roofTextures[style] || this.roofTextures.normal;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.99, 0.9, depth * 0.99),
      new THREE.MeshStandardMaterial({
        map: roofTexture,
        emissiveMap: roofTexture,
        emissive: new THREE.Color('#4a6383'),
        emissiveIntensity: 0.5,
        color: new THREE.Color('#b8c6d8'),
        metalness: 0.32,
        roughness: 0.78,
      })
    );
    roof.position.y = totalHeight + 0.35;
    group.add(roof);

    // Neon roof trim.
    const trimMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: style === 'start' || style === 'waypoint' ? 0.8 : 0.27 });
    const trimY = totalHeight + 0.2;
    const horizontal = new THREE.BoxGeometry(width + 0.15, 0.11, 0.11);
    const vertical = new THREE.BoxGeometry(0.11, 0.11, depth + 0.15);
    [[0, trimY, -depth / 2], [0, trimY, depth / 2]].forEach(([tx, ty, tz]) => {
      const m = new THREE.Mesh(horizontal, trimMat);
      m.position.set(tx, ty, tz);
      group.add(m);
    });
    [[-width / 2, trimY, 0], [width / 2, trimY, 0]].forEach(([tx, ty, tz]) => {
      const m = new THREE.Mesh(vertical, trimMat);
      m.position.set(tx, ty, tz);
      group.add(m);
    });

    // Rooftop props.
    if (style !== 'waypoint' || this.random() > 0.5) {
      this.addRoofProps(group, width, depth, totalHeight, accent, style);
    }

    // Billboards on selected buildings.
    if (style === 'start') {
      this.addBillboard(group, width, depth, totalHeight, 'GOBLIN\nALERT', '#ff2948', 'CITYWIDE CURFEW', 6, -depth / 2 - 0.15, 'front');
      this.addBillboard(group, width, depth, totalHeight, 'NEON', '#70e7ff', 'PURSUIT', width / 2 + 0.15, 4, 'side');
    } else if (style === 'waypoint') {
      this.addBillboard(group, width, depth, totalHeight, 'SIGNAL', '#ffcf5c', 'ROOFTOP UPLINK', 0, depth / 2 + 0.15, 'back');
    } else if (style === 'normal' && this.random() > 0.78) {
      const labels = [
        ['OSCORP', '#92ff7b', 'TOMORROW TODAY'],
        ['NEON', '#ff2948', 'NIGHT LIFE'],
        ['BUGLE', '#ffcf5c', 'THE CITY PAPER'],
        ['24/7', '#70e7ff', 'OPEN ALL NIGHT'],
      ];
      const label = labels[Math.floor(this.random() * labels.length)];
      const onSide = this.random() > 0.5;
      if (onSide) {
        const signX = this.random() > 0.5 ? width / 2 + 0.15 : -width / 2 - 0.15;
        this.addBillboard(group, width, depth, totalHeight, label[0], label[1], label[2], signX, totalHeight * 0.55, 'side');
      } else {
        const signZ = this.random() > 0.5 ? depth / 2 + 0.15 : -depth / 2 - 0.15;
        this.addBillboard(group, width, depth, totalHeight, label[0], label[1], label[2], 0, totalHeight * 0.62, signZ > 0 ? 'back' : 'front');
      }
    }

    const building = {
      group,
      x,
      z,
      width,
      depth,
      height: totalHeight,
      bodyTop: height,
      roofY: totalHeight,
      style,
      accent,
      material,
    };
    this.buildings.push(building);
    this.roofs.push(building);

    // Web anchor points around the roof rim.
    const anchorY = totalHeight + 0.6;
    const ax = width * 0.48;
    const az = depth * 0.48;
    const points = [
      [x - ax, anchorY, z - az],
      [x + ax, anchorY, z - az],
      [x - ax, anchorY, z + az],
      [x + ax, anchorY, z + az],
      [x, anchorY, z - az],
      [x, anchorY, z + az],
      [x - ax, anchorY, z],
      [x + ax, anchorY, z],
    ];
    for (const p of points) {
      this.anchors.push({ point: new THREE.Vector3(p[0], p[1], p[2]), building });
    }

    return building;
  }

  addRoofProps(group, width, depth, top, accent, style) {
    // AC units. Keep them on the outer ring so they never block the hero,
    // the landing zone or the chase camera.
    const acMat = new THREE.MeshStandardMaterial({ color: '#273346', metalness: 0.52, roughness: 0.7 });
    const count = style === 'start' ? 1 : 1 + Math.floor(this.random() * 3);
    const placeOnOuterRing = (axisSize, otherSize) => {
      const sx = this.random() > 0.5 ? 1 : -1;
      const sz = this.random() > 0.5 ? 1 : -1;
      return [
        sx * axisSize * (0.3 + this.random() * 0.09),
        sz * otherSize * (0.3 + this.random() * 0.09),
      ];
    };
    for (let i = 0; i < count; i++) {
      const [px, pz] = placeOnOuterRing(width, depth);
      const ac = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 3.4), acMat);
      ac.position.set(px, top + 0.95, pz);
      ac.rotation.y = Math.atan2(px, pz);
      group.add(ac);
    }

    if (this.random() > 0.45) {
      const [px, pz] = placeOnOuterRing(width, depth);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 9, 4), acMat);
      pole.position.set(px, top + 4.7, pz);
      group.add(pole);
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 7, 5),
        new THREE.MeshBasicMaterial({ color: '#ff314d' })
      );
      light.position.copy(pole.position);
      light.position.y += 4.6;
      group.add(light);
      this.beacons.push({ mesh: light, phase: this.random() * 8, base: 0.45, kind: 'aviation' });
    }

    if (style === 'start') {
      // A recognizable rooftop billboard frame in front of the player's first pose.
      const frameMat = new THREE.MeshStandardMaterial({ color: '#182232', metalness: 0.8, roughness: 0.35 });
      const frame = new THREE.Group();
      frame.position.set(-width * 0.22, top + 3.2, -depth * 0.3);
      const postGeo = new THREE.BoxGeometry(0.4, 6.4, 0.4);
      const post1 = new THREE.Mesh(postGeo, frameMat);
      post1.position.x = -4;
      const post2 = post1.clone();
      post2.position.x = 4;
      frame.add(post1, post2);
      group.add(frame);
    }

    if (style === 'start' || style === 'waypoint') {
      const utilityMat = new THREE.MeshStandardMaterial({ color: '#2c3a50', metalness: 0.55, roughness: 0.55 });
      const crateMat = new THREE.MeshStandardMaterial({ color: '#3d4a5e', metalness: 0.25, roughness: 0.8 });
      const glowMat = new THREE.MeshBasicMaterial({ color: accent });

      // Corner safety pylons with hazard light.
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const px = sx * (width / 2 - 1.4);
        const pz = sz * (depth / 2 - 1.4);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.45, 6), utilityMat);
        post.position.set(px, top + 0.72, pz);
        group.add(post);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), glowMat);
        cap.position.set(px, top + 1.5, pz);
        group.add(cap);
        const halo = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: this.glowTexture, color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.copy(cap.position);
        halo.scale.set(3.8, 3.8, 1);
        group.add(halo);
      }

      // A low vent bank and stacked crates give the foreground scale.
      const vent = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 2.4), utilityMat);
      vent.position.set(-width * 0.36, top + 0.4, depth * 0.34);
      group.add(vent);
      for (let v = -1; v <= 1; v++) {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: '#101826', metalness: 0.4, roughness: 0.8 }));
        slit.position.set(vent.position.x, vent.position.y + 0.15 + v * 0.2, vent.position.z - 1.22);
        group.add(slit);
      }
      const crateA = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), crateMat);
      crateA.position.set(width * 0.36, top + 1.15, depth * 0.35);
      crateA.rotation.y = 0.22;
      group.add(crateA);
      const crateB = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), crateMat);
      crateB.position.set(width * 0.36 - 2.5, top + 0.8, depth * 0.36);
      crateB.rotation.y = -0.16;
      group.add(crateB);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 8, 8), utilityMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-width * 0.1, top + 0.3, -depth * 0.46);
      group.add(pipe);

      // A soft roof wash lifts the hero and the panel texture out of the dark.
      const wash = new THREE.PointLight('#cfe4ff', style === 'start' ? 40 : 26, 26, 2);
      wash.position.set(0, top + 4.6, depth * 0.08);
      group.add(wash);
    }
  }

  addBillboard(group, width, depth, top, text, accent, sub, x, y, side) {
    const tex = makeBillboardTexture(text, accent, sub);
    const geo = new THREE.PlaneGeometry(14, 7);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geo, mat);
    if (side === 'side') {
      plane.rotation.y = Math.PI / 2;
      plane.position.set(x, Math.max(8, y + top * 0.3), 0);
    } else {
      plane.rotation.y = side === 'back' ? 0 : Math.PI;
      plane.position.set(x, Math.max(8, y + top * 0.25), side === 'back' ? depth / 2 + 0.16 : -depth / 2 - 0.16);
    }
    if (side === 'side') plane.position.z = 0;
    group.add(plane);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTexture, color: accent, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.copy(plane.position);
    glow.scale.set(28, 17, 1);
    group.add(glow);
    this.signs.push({ mesh: plane, glow, phase: this.random() * 10, accent });
  }

  createBossTower() {
    const x = CITY.bossTower.x;
    const z = CITY.bossTower.z;
    const h = CITY.bossTower.top;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.cityGroup.add(group);

    const material = new THREE.MeshStandardMaterial({
      color: '#314850',
      metalness: 0.5,
      roughness: 0.45,
      emissive: new THREE.Color('#09261c'),
      emissiveIntensity: 0.5,
    });
    const tiers = [
      { w: 52, d: 52, h: h * 0.62 },
      { w: 38, d: 38, h: h * 0.3, offset: h * 0.62 },
      { w: 22, d: 22, h: h * 0.14, offset: h * 0.9 },
    ];
    for (const tier of tiers) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.d), material);
      box.position.y = (tier.offset || 0) + tier.h / 2;
      group.add(box);
      this.cameraMeshes.push(box);
    }
    // Green vertical light strips.
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, h * 0.8, 0.18),
        new THREE.MeshBasicMaterial({ color: '#7cff65', transparent: true, opacity: 0.8 })
      );
      strip.position.set(side * 24, h * 0.45, 26.2);
      group.add(strip);
    }
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 5, 34, 4),
      new THREE.MeshStandardMaterial({ color: '#1b2b2a', metalness: 0.8, roughness: 0.3, emissive: new THREE.Color('#082014'), emissiveIntensity: 0.6 })
    );
    crown.position.y = h + 10;
    group.add(crown);

    // Massive billboard facing the approach.
    const tex = makeBillboardTexture('OSCORP', '#7cff65', 'WE OWN THE NIGHT');
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(38, 17), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    plane.position.set(0, h * 0.76, 27.1);
    group.add(plane);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: '#7cff65', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(plane.position);
    glow.scale.set(65, 38, 1);
    group.add(glow);

    const building = {
      group,
      x,
      z,
      width: 52,
      depth: 52,
      height: h,
      bodyTop: h,
      roofY: h,
      style: 'boss',
      accent: '#7cff65',
      material,
    };
    this.buildings.push(building);
    this.roofs.push(building);
    const anchorY = h + 0.6;
    for (const [ax, az] of [
      [-24, -24],
      [24, -24],
      [-24, 24],
      [24, 24],
      [0, -24],
      [0, 24],
      [-24, 0],
      [24, 0],
    ]) {
      this.anchors.push({ point: new THREE.Vector3(x + ax, anchorY, z + az), building });
    }
  }

  createBackgroundSkyline(textureCache) {
    const random = mulberry32(77);
    const mat = new THREE.MeshStandardMaterial({ color: '#0a1220', roughness: 0.8, metalness: 0.2 });
    const count = 60;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const instanced = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 265 + random() * 190;
      const width = 20 + random() * 38;
      const height = 40 + random() * 150;
      dummy.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      dummy.rotation.y = random() * Math.PI;
      dummy.scale.set(width, height, width);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    this.cityGroup.add(instanced);
    this.background = instanced;

    // Tiny window lights on distant silhouettes.
    const positions = [];
    for (let i = 0; i < 800; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 240 + random() * 200;
      positions.push(Math.cos(angle) * radius, 12 + random() * 150, Math.sin(angle) * radius);
    }
    const geoPoints = new THREE.BufferGeometry();
    geoPoints.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.distantLights = new THREE.Points(
      geoPoints,
      new THREE.PointsMaterial({ color: '#ffd495', size: 1.4, transparent: true, opacity: 0.45, depthWrite: false })
    );
    this.cityGroup.add(this.distantLights);
  }

  buildTraffic() {
    const bodyColors = ['#0e1522', '#1d2636', '#351523', '#101b29', '#1d1c27'];
    for (let i = 0; i < 20; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.75, 4.4),
        new THREE.MeshStandardMaterial({ color: bodyColors[i % bodyColors.length], metalness: 0.6, roughness: 0.35 })
      );
      body.position.y = 0.55;
      group.add(body);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.55, 2.15),
        new THREE.MeshStandardMaterial({ color: '#0b111b', metalness: 0.5, roughness: 0.25 })
      );
      roof.position.set(0, 1.2, -0.25);
      group.add(roof);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.16, 0.12),
        new THREE.MeshBasicMaterial({ color: '#e8f7ff' })
      );
      head.position.set(0, 0.58, -2.22);
      group.add(head);
      const tail = head.clone();
      tail.material = new THREE.MeshBasicMaterial({ color: '#ff203e' });
      tail.position.z = 2.22;
      group.add(tail);
      const lane = i % 2 === 0 ? 1 : -1;
      const direction = lane === 1 ? -1 : 1;
      group.position.set(lane * (18 + (i % 3) * 3), 0.03, -340 + (i * 37) % 680);
      group.rotation.y = direction > 0 ? 0 : Math.PI;
      this.cityGroup.add(group);
      this.cars.push({ group, direction, speed: 10 + (i % 5) * 3, lane });
    }
  }

  buildChopper() {
    const chopper = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#101c2c', metalness: 0.6, roughness: 0.4 })
    );
    body.scale.set(1, 0.7, 1.5);
    chopper.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 4.5), new THREE.MeshStandardMaterial({ color: '#0d1827', metalness: 0.7, roughness: 0.3 }));
    tail.position.z = 3.3;
    chopper.add(tail);
    const rotor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.08, 0.22),
      new THREE.MeshBasicMaterial({ color: '#4d698a', transparent: true, opacity: 0.6 })
    );
    rotor.position.y = 1.9;
    chopper.add(rotor);
    const searchlight = new THREE.Mesh(
      new THREE.ConeGeometry(11, 54, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: '#d6edff', transparent: true, opacity: 0.032, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    searchlight.position.y = -29;
    searchlight.rotation.x = Math.PI;
    chopper.add(searchlight);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), new THREE.MeshBasicMaterial({ color: '#ff2d4b' }));
    beacon.position.set(0, 1.5, -1.8);
    chopper.add(beacon);
    chopper.position.set(58, 118, 40);
    chopper.rotation.y = -0.6;
    this.cityGroup.add(chopper);
    this.chopper = chopper;
    this.chopperRotor = rotor;
    this.chopperBeacon = beacon;
    this.chopperAngle = 0;
  }

  setMood(name, immediate = false) {
    if (!PALETTES[name]) return;
    this.moodName = name;
    const palette = PALETTES[name];
    const apply = () => {
      this.skyUniforms.topColor.value.set(palette.top);
      this.skyUniforms.midColor.value.set(palette.mid);
      this.skyUniforms.horizonColor.value.set(palette.horizon);
      this.fog.color.set(palette.fog);
      this.fog.density = palette.fogDensity;
      this.hemi.color.set(palette.hemiSky);
      this.hemi.groundColor.set(palette.hemiGround);
      this.sun.color.set(palette.sun);
      this.sun.intensity = palette.sunIntensity;
      this.fill.color.set(palette.fill);
      this.stars.material.opacity = palette.stars;
      if (this.moon) {
        this.moon.material.color.set(name === 'dawn' ? '#fff1cb' : '#e8f0ff');
        this.moonGlow.material.opacity = name === 'dawn' ? 0.18 : 0.34;
      }
      if (this.bounce) this.bounce.color.set(name === 'dawn' ? '#ffb37e' : '#ff3e56');
    };

    if (immediate) {
      apply();
      return;
    }
    const startTop = this.skyUniforms.topColor.value.clone();
    const startMid = this.skyUniforms.midColor.value.clone();
    const startHorizon = this.skyUniforms.horizonColor.value.clone();
    const startFog = this.fog.color.clone();
    const startSun = this.sun.color.clone();
    const startHemi = this.hemi.color.clone();
    const start = performance.now();
    const duration = 1800;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t * t * (3 - 2 * t);
      this.skyUniforms.topColor.value.copy(startTop).lerp(new THREE.Color(palette.top), eased);
      this.skyUniforms.midColor.value.copy(startMid).lerp(new THREE.Color(palette.mid), eased);
      this.skyUniforms.horizonColor.value.copy(startHorizon).lerp(new THREE.Color(palette.horizon), eased);
      this.fog.color.copy(startFog).lerp(new THREE.Color(palette.fog), eased);
      this.sun.color.copy(startSun).lerp(new THREE.Color(palette.sun), eased);
      this.hemi.color.copy(startHemi).lerp(new THREE.Color(palette.hemiSky), eased);
      this.fog.density = THREE.MathUtils.lerp(this.fog.density, palette.fogDensity, 0.08);
      this.sun.intensity = THREE.MathUtils.lerp(this.sun.intensity, palette.sunIntensity, 0.08);
      this.stars.material.opacity = THREE.MathUtils.lerp(this.stars.material.opacity, palette.stars, 0.08);
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  update(dt, elapsed) {
    this.time += dt;
    for (const car of this.cars) {
      car.group.position.z += car.direction * car.speed * dt;
      if (car.group.position.z > 355) car.group.position.z = -355;
      if (car.group.position.z < -355) car.group.position.z = 355;
    }

    for (const beacon of this.beacons) {
      if (beacon.kind === 'aviation') {
        beacon.mesh.material.opacity = beacon.base + Math.sin(elapsed * 2.4 + beacon.phase) * 0.12;
        beacon.mesh.scale.setScalar(0.8 + Math.sin(elapsed * 2.4 + beacon.phase) * 0.15);
      } else if (beacon.mesh.material) {
        beacon.mesh.material.opacity = 0.36 + Math.sin(elapsed * 1.8 + beacon.phase) * 0.12;
      }
    }

    for (const sign of this.signs) {
      sign.glow.material.opacity = 0.12 + Math.sin(elapsed * 3 + sign.phase) * 0.06;
    }

    if (this.chopper) {
      this.chopperAngle += dt * 0.08;
      this.chopper.position.x = Math.cos(this.chopperAngle) * 105;
      this.chopper.position.z = Math.sin(this.chopperAngle) * 130 - 30;
      this.chopper.rotation.y = -this.chopperAngle + Math.PI / 2;
      this.chopper.position.y = 118 + Math.sin(elapsed * 0.6) * 2;
      this.chopperRotor.rotation.y += dt * 26;
      this.chopperBeacon.material.color.set(Math.sin(elapsed * 9) > 0 ? '#ff2d4b' : '#2a0308');
    }

    // Slight shimmer on distant lights.
    if (this.distantLights) this.distantLights.material.opacity = 0.38 + Math.sin(elapsed * 1.2) * 0.07;
  }

  getStartPosition() {
    return new THREE.Vector3(CITY.start.x, CITY.start.top + 1.15, CITY.start.z);
  }

  getWaypointPosition() {
    return new THREE.Vector3(CITY.waypoint.x, CITY.waypoint.top + 4.5, CITY.waypoint.z);
  }

  getBossPosition() {
    return new THREE.Vector3(CITY.bossTower.x, CITY.bossTower.top + 30, CITY.bossTower.z);
  }

  getSurfaceY(x, z, currentY) {
    let best = 0;
    for (const b of this.buildings) {
      if (
        Math.abs(x - b.x) <= b.width / 2 &&
        Math.abs(z - b.z) <= b.depth / 2 &&
        currentY >= b.roofY - 1.2
      ) {
        if (b.roofY > best) best = b.roofY;
      }
    }
    return best;
  }

  getRoofCandidate(routePoints, wanted, seedOffset = 0) {
    // Pick scenic rooftops near the chase route, avoiding repeats.
    const used = new Set();
    const result = [];
    let startIndex = seedOffset % Math.max(1, routePoints.length);
    for (let step = 0; step < 20 && result.length < wanted; step++) {
      const routePoint = routePoints[(startIndex + step * 3) % routePoints.length];
      let best = null;
      let bestDist = Infinity;
      for (const b of this.roofs) {
        if (b.style === 'boss' || b === CITY.start) continue;
        if (used.has(b)) continue;
        const d = Math.hypot(b.x - routePoint.x, b.z - routePoint.z);
        if (d < bestDist && d < 125) {
          bestDist = d;
          best = b;
        }
      }
      if (best) {
        used.add(best);
        result.push(new THREE.Vector3(best.x, best.roofY + 1.2, best.z));
      }
    }
    return result;
  }

  resolvePlayerCollisions(pos, prevPos, radius = 0.7) {
    let landedOn = null;
    for (const b of this.buildings) {
      const halfW = b.width / 2 + radius;
      const halfD = b.depth / 2 + radius;
      const dx = pos.x - b.x;
      const dz = pos.z - b.z;
      const insideX = Math.abs(dx) < halfW;
      const insideZ = Math.abs(dz) < halfD;
      if (!insideX || !insideZ) continue;

      const top = b.roofY;
      // Landing from above.
      if (prevPos.y >= top - 0.5 && pos.y <= top + 0.9) {
        if (pos.y < top + 0.5) {
          pos.y = top;
          landedOn = b;
          if (pos.velocityY !== undefined) {
            // handled by caller
          }
        }
        continue;
      }

      // Side collision only when below the roof.
      if (pos.y < top - 0.7) {
        const penetrationX = halfW - Math.abs(dx);
        const penetrationZ = halfD - Math.abs(dz);
        if (penetrationX < penetrationZ) {
          pos.x = b.x + Math.sign(dx || 1) * halfW;
        } else {
          pos.z = b.z + Math.sign(dz || 1) * halfD;
        }
      }
    }
    return landedOn;
  }

  raycastCamera(origin, target, maxDistance = 40) {
    this.raycaster.set(origin, target.clone().sub(origin).normalize());
    this.raycaster.far = maxDistance;
    const hits = this.raycaster.intersectObjects(this.cameraMeshes, false);
    if (hits.length) return hits[0].distance;
    return maxDistance;
  }

  getCarLights() {
    return this.cars;
  }

  dispose() {
    this.scene.remove(this.cityGroup);
    this.cityGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
