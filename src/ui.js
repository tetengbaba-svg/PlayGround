import * as THREE from 'three';

const $ = (id) => document.getElementById(id);

const CONTROL_HTML = `
  <div class="control-grid">
    <div class="control-item"><span>Move / steer</span><kbd>W A S D / STICK</kbd></div>
    <div class="control-item"><span>Camera</span><kbd>MOUSE / RIGHT STICK</kbd></div>
    <div class="control-item"><span>Jump + hold to swing</span><kbd>SPACE / A</kbd></div>
    <div class="control-item"><span>Web shot</span><kbd>E / LEFT CLICK / X</kbd></div>
    <div class="control-item"><span>Web-strike</span><kbd>F / Y</kbd></div>
    <div class="control-item"><span>Dodge burst</span><kbd>SHIFT / B</kbd></div>
    <div class="control-item"><span>Rescue civilian</span><kbd>R / D-PAD ↑</kbd></div>
    <div class="control-item"><span>Pause</span><kbd>ESC / START</kbd></div>
  </div>
  <p class="manual-note"><strong>THE COMBO:</strong> hold <strong>SPACE</strong> in mid-air to fire a web line. Let go at the top of the arc to launch. Web the Goblin first, then hit <strong>F</strong> to zip in and strike. Chain clean hits without taking damage to build your multiplier.</p>
  <p class="manual-note"><strong>MOBILE:</strong> drag the right side of the screen to look. Use the joystick to move, and hold <strong>WEB/SWING</strong> to swing. Tap the action buttons for web shots, strikes, dodges and rescues.</p>
`;

export class UI {
  constructor(handlers = {}) {
    this.h = handlers;
    this.time = 0;
    this.last = {};
    this.toastCount = 0;

    $('startButton').addEventListener('click', () => this.h.onStart?.());
    $('howToButton').addEventListener('click', () => this.openHowTo());
    $('modalClose').addEventListener('click', () => this.closeModal());
    $('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') this.closeModal();
    });
    $('soundButton').addEventListener('click', () => this.h.onSound?.());
    $('skipCutscene').addEventListener('click', () => this.h.onSkipCutscene?.());
    $('resultsContinue').addEventListener('click', () => this.h.onResultsContinue?.());
    $('retryButton').addEventListener('click', () => this.h.onRetry?.());
    $('quitButton').addEventListener('click', () => this.h.onQuit?.());
    $('playAgainButton').addEventListener('click', () => this.h.onPlayAgain?.());
    $('resumeButton').addEventListener('click', () => this.h.onResume?.());
    $('restartButton').addEventListener('click', () => this.h.onRestart?.());
    $('pauseHowTo').addEventListener('click', () => this.openHowTo());
    $('pauseQuit').addEventListener('click', () => this.h.onQuit?.());

    this.hud = $('hud');
    this.title = $('titleScreen');
    this.results = $('resultsScreen');
    this.upgrade = $('upgradeScreen');
    this.fail = $('failScreen');
    this.victory = $('victoryScreen');
    this.pause = $('pauseScreen');
    this.cutscene = $('cutsceneOverlay');
    this.cinemaBars = $('cinemaBars');
    this.loading = $('loading');
    this.speedLines = $('speedLines');
    this.damageFlash = $('damageFlash');
    this.slowmoGrade = $('slowmoGrade');
    this.comboStack = $('comboStack');
    this.goblinPanel = $('goblinPanel');
    this.bossBanner = $('bossBanner');
    this.toastStack = $('toastStack');
    this.markerObjective = $('objectiveMarker');
    this.markerWeb = $('webTargetMarker');
    this.markerCivilian = $('civilianMarker');
    this.reticle = $('reticle');
    this.prompt = $('prompt');
    this.chaseClock = $('chaseClock');
    this.modal = $('modal');
    this.modalTitle = $('modalTitle');
    this.modalContent = $('modalContent');

    this.projectTmp = new THREE.Vector3();
    this.comboTimeout = null;
    this.damageTimeout = null;
    this.toastIndex = 0;

    // Touch control buttons are wired by the game.
    setTimeout(() => this.hideLoading(), 650);
  }

  hideLoading() {
    this.loading.classList.add('is-hidden');
  }

  showTitle() {
    this.title.classList.remove('is-hidden');
    this.hud.classList.add('is-hidden');
    this.hidePanels();
    this.setCinema(false);
    this.setCutscene(false);
  }

  hideTitle() {
    this.title.classList.add('is-hidden');
    this.hud.classList.remove('is-hidden');
  }

  hideHud() {
    this.hud.classList.add('is-hidden');
  }

  showHud() {
    this.hud.classList.remove('is-hidden');
  }

  hidePanels() {
    [this.results, this.upgrade, this.fail, this.victory, this.pause].forEach((p) => p.classList.add('is-hidden'));
  }

  openHowTo(fromPause = false) {
    this.modalTitle.textContent = 'HOW TO SWING';
    this.modalContent.innerHTML = CONTROL_HTML;
    this.modal.classList.remove('is-hidden');
    this.h.onUiSound?.();
    if (fromPause) this.pause.classList.add('is-hidden');
  }

  closeModal() {
    this.modal.classList.add('is-hidden');
    if (this.h.isPaused?.()) this.pause.classList.remove('is-hidden');
    this.h.onUiSound?.();
  }

  setSoundLabel(muted) {
    $('soundButton').textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  }

  setCinema(active) {
    this.cinemaBars.classList.toggle('is-active', active);
  }

  setCutscene(active) {
    this.cutscene.classList.toggle('is-hidden', !active);
  }

  setCutsceneText(chapter, text) {
    $('cutsceneChapter').textContent = chapter;
    const p = $('cutsceneText');
    if (p.textContent !== text) {
      p.textContent = text;
      const parent = p.parentElement;
      parent.style.animation = 'none';
      // Force a reflow to restart the caption animation.
      void parent.offsetWidth;
      parent.style.animation = '';
    }
  }

  setChapter(chapter, objective) {
    if (this.last.chapter !== chapter) {
      $('chapterLabel').textContent = chapter;
      this.last.chapter = chapter;
    }
    if (this.last.objective !== objective) {
      $('objectiveText').textContent = objective;
      this.last.objective = objective;
    }
  }

  setTimer(seconds, visible = true) {
    this.chaseClock.style.opacity = visible ? '1' : '0';
    const clamped = Math.max(0, Math.ceil(seconds));
    const label = `${Math.floor(clamped / 60)}:${String(clamped % 60).padStart(2, '0')}`;
    if (this.last.timer !== label) {
      $('timerText').textContent = label;
      this.last.timer = label;
    }
    this.chaseClock.classList.toggle('is-critical', seconds <= 20);
  }

  setScore(score) {
    const label = String(Math.max(0, Math.floor(score))).padStart(6, '0');
    if (this.last.score !== label) {
      $('scoreText').textContent = label;
      this.last.score = label;
    }
  }

  setHealth(health, maxHealth) {
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    $('healthFill').style.width = `${pct * 100}%`;
    $('healthText').textContent = Math.ceil(Math.max(0, health));
  }

  setWeb(web) {
    const pct = Math.max(0, Math.min(1, web / 100));
    $('webFill').style.width = `${pct * 100}%`;
    $('webText').textContent = Math.ceil(Math.max(0, web));
  }

  setLives(lives, maxLives = 3) {
    const pips = $('livesPips').children;
    for (let i = 0; i < pips.length; i++) pips[i].classList.toggle('is-empty', i >= lives);
    const failPips = $('failLives').children;
    for (let i = 0; i < failPips.length; i++) failPips[i].classList.toggle('is-empty', i >= lives);
  }

  setGoblin(health, maxHealth, distance, visible = true) {
    this.goblinPanel.classList.toggle('is-hidden', !visible);
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    $('goblinFill').style.width = `${pct * 100}%`;
    const dist = `${Math.max(0, Math.round(distance))}m`;
    if (this.last.distance !== dist) {
      $('distanceText').textContent = dist;
      this.last.distance = dist;
    }
  }

  setGoblinNote(text) {
    if (this.last.note !== text) {
      $('goblinNote').textContent = text;
      this.last.note = text;
    }
  }

  setPrompt(html, visible = true) {
    if (this.last.prompt !== html) {
      this.prompt.innerHTML = html;
      this.last.prompt = html;
    }
    this.prompt.classList.toggle('is-hidden', !visible);
  }

  setReticleTarget(active, worldPosition = null, camera = null) {
    this.reticle.classList.toggle('is-target', active);
    if (!active || !worldPosition || !camera) {
      this.reticle.classList.add('is-hidden');
      return;
    }
    const pos = this.projectTmp.copy(worldPosition);
    pos.y += 1.2;
    pos.project(camera);
    if (pos.z > 1 || pos.z < -1) {
      this.reticle.classList.add('is-hidden');
      return;
    }
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    if (x < 20 || x > window.innerWidth - 20 || y < 20 || y > window.innerHeight - 20) {
      this.reticle.classList.add('is-hidden');
      return;
    }
    this.reticle.style.left = `${x}px`;
    this.reticle.style.top = `${y}px`;
    this.reticle.classList.remove('is-hidden');
  }

  setSpeedLines(active, speed = 0) {
    this.speedLines.classList.toggle('is-active', active);
    this.speedLines.style.opacity = active ? String(Math.min(0.8, 0.2 + speed / 75)) : '0';
  }

  flashDamage() {
    this.damageFlash.classList.add('is-hit');
    clearTimeout(this.damageTimeout);
    this.damageTimeout = setTimeout(() => this.damageFlash.classList.remove('is-hit'), 55);
  }

  setSlowmo(active) {
    this.slowmoGrade.classList.toggle('is-active', active);
  }

  showCombo(count, label, visible = true) {
    if (count < 2 || !visible) {
      this.comboStack.classList.remove('is-active');
      return;
    }
    this.comboStack.classList.add('is-active');
    $('comboNumber').textContent = `x${count}`;
    $('comboWord').textContent = label || 'NICE!';
    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => this.comboStack.classList.remove('is-active'), 2700);
  }

  toast(text, className = '') {
    const el = document.createElement('div');
    el.className = `toast ${className}`;
    el.style.setProperty('--toast-index', this.toastIndex++);
    el.textContent = text;
    this.toastStack.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1850);
    while (this.toastStack.children.length > 4) this.toastStack.firstElementChild.remove();
  }

  showMarker(el, worldPosition, camera, visible = true, label = null, clampToScreen = true) {
    if (!visible) {
      el.classList.add('is-hidden');
      return;
    }
    const pos = this.projectTmp.copy(worldPosition);
    pos.y += 2.4;
    pos.project(camera);
    if (pos.z > 1 || pos.z < -1) {
      el.classList.add('is-hidden');
      return;
    }
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    if (!clampToScreen && (x < 30 || x > window.innerWidth - 30 || y < 80 || y > window.innerHeight - 100)) {
      el.classList.add('is-hidden');
      return;
    }
    const clampedX = Math.max(50, Math.min(window.innerWidth - 50, x));
    const clampedY = Math.max(120, Math.min(window.innerHeight - 88, y));
    el.style.left = `${clampedX}px`;
    el.style.top = `${clampedY}px`;
    el.classList.remove('is-hidden');
    const offscreen = x !== clampedX || y !== clampedY;
    el.style.opacity = offscreen ? '0.62' : '1';
    if (label !== null) {
      const span = el.querySelector('span');
      if (span && span.textContent !== label) span.textContent = label;
    }
  }

  hideMarker(el) {
    el.classList.add('is-hidden');
  }

  showBossBanner(show) {
    this.bossBanner.classList.toggle('is-hidden', !show);
  }

  showResults(data) {
    this.hidePanels();
    this.hideHud();
    $('resultsEyebrow').textContent = data.eyebrow || 'CHAPTER CLEAR';
    $('resultsTitle').innerHTML = data.title;
    $('resultsCopy').textContent = data.copy;
    $('resultScore').textContent = String(Math.floor(data.score)).padStart(6, '0');
    $('resultCivilians').textContent = data.civilians;
    $('resultCombo').textContent = `x${data.bestCombo}`;
    $('resultTime').textContent = data.time;
    this.results.classList.remove('is-hidden');
  }

  showUpgrades(cards) {
    this.hidePanels();
    this.hideHud();
    const container = $('upgradeCards');
    container.innerHTML = '';
    cards.forEach((card) => {
      const button = document.createElement('button');
      button.className = 'upgrade-card';
      button.innerHTML = `
        <div class="up-grade"><span>${card.tag}</span><span>+</span></div>
        <span class="up-icon">${card.icon}</span>
        <h3>${card.name}</h3>
        <p>${card.description}</p>
      `;
      button.addEventListener('click', () => {
        this.h.onUpgrade?.(card.id);
      });
      container.appendChild(button);
    });
    this.upgrade.classList.remove('is-hidden');
  }

  showFail(data) {
    this.hidePanels();
    this.hideHud();
    $('failTitle').innerHTML = data.title || 'THE GOBLIN<br /><em>GOT AWAY.</em>';
    $('failCopy').textContent = data.copy || 'The city still needs you. Get back in the air.';
    this.setLives(data.lives);
    this.fail.classList.remove('is-hidden');
  }

  showVictory(data) {
    this.hidePanels();
    this.hideHud();
    $('victoryScore').textContent = String(Math.floor(data.score)).padStart(6, '0');
    $('victoryCivilians').textContent = data.civilians;
    $('victoryRank').textContent = data.rank;
    this.victory.classList.remove('is-hidden');
  }

  showPause(show) {
    this.pause.classList.toggle('is-hidden', !show);
  }

  resetRunUi() {
    this.last = {};
    this.comboStack.classList.remove('is-active');
    this.goblinPanel.classList.add('is-hidden');
    this.bossBanner.classList.add('is-hidden');
    this.prompt.classList.add('is-hidden');
    this.markerObjective.classList.add('is-hidden');
    this.markerWeb.classList.add('is-hidden');
    this.markerCivilian.classList.add('is-hidden');
    this.setSpeedLines(false);
    this.setSlowmo(false);
  }
}

export { CONTROL_HTML };
