// Fully procedural audio: a driving synth-orchestral chase score and comic-book SFX.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.started = false;
    this.intensity = 1;
    this.step = 0;
    this.nextNoteTime = 0;
    this.timer = null;
    this.noiseBuffer = null;
    this.chaseActive = false;
    this.bossActive = false;
  }

  async unlock() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.75;
      this.master.connect(this.ctx.destination);

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.24;
      compressor.connect(this.master);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.33;
      this.musicGain.connect(compressor);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(compressor);

      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.startScheduler();
    }
  }

  createNoiseBuffer() {
    const length = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setMuted(value) {
    this.muted = value;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value ? 0 : 0.75, this.ctx.currentTime, 0.04);
    }
  }

  setScene({ chase = false, boss = false, calm = false } = {}) {
    this.chaseActive = chase;
    this.bossActive = boss;
    this.intensity = calm ? 0.55 : boss ? 1.35 : chase ? 1.12 : 0.85;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(calm ? 0.2 : 0.31, this.ctx.currentTime, 0.4);
    }
  }

  startScheduler() {
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  schedule() {
    if (!this.ctx || this.muted) return;
    const tempo = this.bossActive ? 142 : this.chaseActive ? 130 : 104;
    const stepDur = 60 / tempo / 4;
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextNoteTime, stepDur, tempo);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  playStep(step, time, stepDur, tempo) {
    const bar = Math.floor(step / 16) % 4;
    const beat = step % 16;
    const intensity = this.intensity;
    const roots = [49.0, 43.65, 58.27, 46.25]; // G, F, Bb, F# – dark, heroic tension
    const root = roots[bar];
    const chase = this.chaseActive;
    const boss = this.bossActive;

    // Low pulse / engine.
    if (chase || boss) {
      if (beat === 0 || beat === 6 || beat === 10 || (boss && beat === 13)) {
        this.kick(time, 0.8 * intensity);
      }
      if (beat === 4 || beat === 12) this.snare(time, 0.45 * intensity);
      if (beat % 2 === 0) this.hat(time, 0.12 * intensity, beat % 4 === 0 ? 0.05 : 0.08);
    } else {
      if (beat === 0) this.kick(time, 0.35);
      if (beat === 8) this.hat(time, 0.05, 0.11);
    }

    // 16th bass engine.
    if (chase || boss) {
      const pattern = [0, 0, 12, 0, 0, 7, 0, 10, 0, 0, 12, 0, 7, 0, 10, 7];
      const semi = pattern[beat];
      this.bass(root * Math.pow(2, semi / 12), time, stepDur * 0.72, 0.16 * intensity);
    }

    // Neon arpeggio.
    if (step % 2 === 0 || boss) {
      const arp = [0, 3, 7, 10, 12, 10, 7, 3];
      const octave = bar === 2 ? 4 : 2;
      const freq = root * octave * Math.pow(2, arp[(step / 2) % 8] / 12);
      this.lead(freq, time, stepDur * (boss ? 0.8 : 1.5), 0.024 * intensity);
    }

    // Wide pad at bar changes.
    if (beat === 0 && (chase || boss || step === 0)) {
      this.pad(root * 2, root * 2 * 1.5, root * 3, time, stepDur * 15, 0.047 * intensity);
    }

    // Orchestral stabs.
    if ((chase || boss) && (beat === 0 || beat === 8)) {
      this.brass(root * 4, time, stepDur * 3, 0.035 * intensity);
    }

    // Boss alarm pulse.
    if (boss && beat % 4 === 3) {
      this.lead(root * 8, time, stepDur * 0.45, 0.019, 'sawtooth');
    }
  }

  tone({ freq, endFreq, time, dur, type = 'sine', gain = 0.1, destination = this.musicGain, attack = 0.01, release = 0.05 }) {
    if (!this.ctx || !destination) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2800;
    filter.Q.value = 0.8;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + dur);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(gain, time + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(destination);
    osc.start(time);
    osc.stop(time + dur + release + 0.03);
  }

  kick(time, gain = 0.7) {
    this.tone({ freq: 160, endFreq: 39, time, dur: 0.22, type: 'sine', gain, destination: this.musicGain, attack: 0.002, release: 0.08 });
  }

  snare(time, gain = 0.4) {
    if (!this.ctx || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
    source.start(time, Math.random() * 0.2, 0.2);
  }

  hat(time, gain = 0.1, decay = 0.04) {
    if (!this.ctx || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
    source.start(time, Math.random() * 0.3, decay + 0.02);
  }

  bass(freq, time, dur, gain) {
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + dur);
    filter.Q.value = 5;
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(gain, time + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.04);
  }

  lead(freq, time, dur, gain, type = 'triangle') {
    this.tone({ freq, time, dur, type, gain, destination: this.musicGain, attack: 0.005, release: 0.06 });
  }

  pad(f1, f2, f3, time, dur, gain) {
    [f1, f2, f3].forEach((freq, i) => {
      this.tone({
        freq,
        time,
        dur,
        type: i === 1 ? 'sawtooth' : 'triangle',
        gain,
        destination: this.musicGain,
        attack: 0.4,
        release: 0.6,
      });
    });
  }

  brass(freq, time, dur, gain) {
    this.tone({ freq, endFreq: freq * 0.985, time, dur, type: 'sawtooth', gain, destination: this.musicGain, attack: 0.025, release: 0.12 });
  }

  // ---------------- SFX ----------------

  sfx(name, volume = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'ui':
        this.tone({ freq: 660, endFreq: 880, time: t, dur: 0.06, type: 'triangle', gain: 0.08, destination: this.sfxGain, release: 0.03 });
        break;
      case 'thwip':
        this.noiseHit(t, 0.15, 0.28, 4300, 'highpass', volume);
        this.tone({ freq: 920, endFreq: 160, time: t, dur: 0.12, type: 'square', gain: 0.055 * volume, destination: this.sfxGain, release: 0.02 });
        break;
      case 'swing':
        this.whoosh(t, 0.5, 0.2, volume);
        break;
      case 'jump':
        this.tone({ freq: 190, endFreq: 360, time: t, dur: 0.16, type: 'triangle', gain: 0.08 * volume, destination: this.sfxGain, release: 0.03 });
        break;
      case 'land':
        this.noiseHit(t, 0.25, 0.14, 560, 'lowpass', volume, 0.13);
        break;
      case 'webhit':
        this.noiseHit(t, 0.28, 0.12, 2800, 'bandpass', volume, 0.14);
        this.tone({ freq: 300, endFreq: 120, time: t, dur: 0.16, type: 'square', gain: 0.05 * volume, destination: this.sfxGain });
        break;
      case 'strike':
        this.noiseHit(t, 0.35, 0.2, 700, 'lowpass', volume, 0.15);
        this.tone({ freq: 120, endFreq: 62, time: t, dur: 0.35, type: 'sine', gain: 0.17 * volume, destination: this.sfxGain, release: 0.12 });
        break;
      case 'explode':
        this.noiseHit(t, 0.6, 0.5, 720, 'lowpass', volume, 0.35);
        this.tone({ freq: 95, endFreq: 32, time: t, dur: 0.7, type: 'sine', gain: 0.2 * volume, destination: this.sfxGain, release: 0.2 });
        break;
      case 'rescue':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.tone({ freq: f, time: t + i * 0.06, dur: 0.18, type: 'triangle', gain: 0.07 * volume, destination: this.sfxGain, release: 0.1 });
        });
        break;
      case 'damage':
        this.noiseHit(t, 0.28, 0.18, 420, 'lowpass', volume, 0.18);
        this.tone({ freq: 160, endFreq: 80, time: t, dur: 0.3, type: 'sawtooth', gain: 0.06 * volume, destination: this.sfxGain });
        break;
      case 'laugh':
        this.goblinLaugh(t, volume);
        break;
      case 'win':
        [392, 523, 659, 784].forEach((f, i) => {
          this.tone({ freq: f, time: t + i * 0.11, dur: 0.5, type: 'triangle', gain: 0.075 * volume, destination: this.sfxGain, release: 0.2 });
        });
        break;
      case 'fail':
        [330, 277, 220, 164].forEach((f, i) => {
          this.tone({ freq: f, time: t + i * 0.13, dur: 0.4, type: 'sawtooth', gain: 0.045 * volume, destination: this.sfxGain, release: 0.16 });
        });
        break;
      case 'slowmo':
        this.tone({ freq: 320, endFreq: 62, time: t, dur: 0.8, type: 'sine', gain: 0.08 * volume, destination: this.sfxGain, release: 0.25 });
        break;
      default:
        break;
    }
  }

  noiseHit(time, gain, dur, freq, type = 'lowpass', volume = 1, attack = 0.005) {
    if (!this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = type === 'bandpass' ? 1.4 : 0.6;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(gain * volume, time + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfxGain);
    source.start(time, Math.random() * 0.25, dur + 0.05);
  }

  whoosh(time, dur, gain, volume) {
    if (!this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(1600, time + dur * 0.45);
    filter.frequency.exponentialRampToValueAtTime(240, time + dur);
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(gain * volume, time + 0.12);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfxGain);
    source.start(time, Math.random() * 0.2, dur + 0.05);
  }

  goblinLaugh(time, volume = 1) {
    const base = 180;
    for (let i = 0; i < 6; i++) {
      this.tone({
        freq: base + (i % 2) * 60 + i * 12,
        endFreq: base * 0.72,
        time: time + i * 0.09,
        dur: 0.1,
        type: 'sawtooth',
        gain: 0.035 * volume,
        destination: this.sfxGain,
        release: 0.04,
      });
    }
  }
}
