import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import './style.css';

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { City } from './city.js';
import { AudioEngine } from './audio.js';
import { UI } from './ui.js';
import { Game } from './game.js';

const container = document.getElementById('scene');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1800);
camera.position.set(80, 80, 200);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.setClearColor('#050914');
container.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.68, 0.52, 0.76);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const city = new City(scene, renderer);
const audio = new AudioEngine();
const ui = new UI({});
const game = new Game({ scene, camera, renderer, audio, ui, composer, city });

let last = performance.now();
let firstFrame = true;

function render(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  game.update(dt);
  composer.render();

  if (firstFrame) {
    firstFrame = false;
    setTimeout(() => ui.hideLoading(), 180);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (game.state === 'title') game.snapTitleCamera();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(width, height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
});

// Exposed for the launch harness and for curious players who open the console.
window.__NEON_PURSUIT__ = { game, scene, camera, renderer, city, audio, ui };

window.addEventListener('error', (event) => {
  console.error('[Neon Pursuit]', event.message);
});
