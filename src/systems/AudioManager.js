// ============================================================
// FORK — AudioManager.js
// Sons procedurais via Web Audio API.
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.baseMaster = 0.07;
    this.volume = 1;
    this.muted = false;
    this.master = this.baseMaster;
    this._ambient = null;
    this._boundInput = false;
    this._lastInputAt = 0;
    this._settingsLoaded = false;
    this._bindGlobalInput();
  }

  _loadSettings() {
    if (this._settingsLoaded) return;
    this._settingsLoaded = true;
    try {
      const raw = window.localStorage.getItem('fork_audio_settings_v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.volume === 'number') this.volume = Math.max(0, Math.min(1, data.volume));
      if (typeof data.muted === 'boolean') this.muted = data.muted;
      this._syncMaster();
    } catch (_) {}
  }

  _saveSettings() {
    try {
      window.localStorage.setItem('fork_audio_settings_v1', JSON.stringify({
        volume: this.volume,
        muted: this.muted,
      }));
    } catch (_) {}
  }

  _syncMaster() {
    this.master = this.muted ? 0 : this.baseMaster * this.volume;
    if (this._ambient && this._ambient.gain) {
      this._ambient.gain.gain.value = this.master * 0.18;
    }
  }

  getVolumePercent() {
    this._loadSettings();
    return Math.round(this.volume * 100);
  }

  isMuted() {
    this._loadSettings();
    return this.muted;
  }

  setVolume(value) {
    this._loadSettings();
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.volume > 0 && this.muted) this.muted = false;
    this._syncMaster();
    this._saveSettings();
    return this.getVolumePercent();
  }

  changeVolume(delta) {
    return this.setVolume(this.volume + delta);
  }

  setMuted(value) {
    this._loadSettings();
    this.muted = !!value;
    this._syncMaster();
    this._saveSettings();
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  _bindGlobalInput() {
    if (this._boundInput || typeof document === 'undefined') return;
    this._boundInput = true;

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.playKey(event.code || event.key || '');
    });

    document.addEventListener('pointerdown', () => {
      this.playInterfaceClick();
    });
  }

  _ensure() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch (_) {
      return null;
    }
  }

  _tone(freq, duration = 0.08, type = 'square', volume = 1, endFreq = null) {
    if (this.muted || this.master <= 0) return;

    const ctx = this._ensure();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(30, endFreq),
        ctx.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, this.master * volume),
      ctx.currentTime + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  playBeep() { this._tone(520, 0.05, 'square', 0.7); }

  playInterfaceClick() {
    if (this.muted || this.master <= 0) return;

    const now = performance.now();
    if (now - this._lastInputAt < 28) return;
    this._lastInputAt = now;

    const ctx = this._ensure();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.055);
    filter.type = 'highpass';
    filter.frequency.value = 520;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(this.master * 0.45, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playKey(code = '') {
    if (this.muted || this.master <= 0) return;

    const now = performance.now();
    if (now - this._lastInputAt < 18) return;
    this._lastInputAt = now;

    const special = {
      Enter: 880,
      NumpadEnter: 880,
      Backspace: 430,
      Escape: 310,
      ArrowUp: 700,
      ArrowDown: 560,
      ArrowLeft: 620,
      ArrowRight: 620,
      Space: 760,
    };

    const base = special[code] || (code.startsWith('Key') ? 690 : 610);
    this._tone(base, 0.035, 'square', 0.22, base * 0.72);

    if (code === 'Enter' || code === 'NumpadEnter') {
      setTimeout(() => this._tone(1120, 0.045, 'sine', 0.16, 760), 28);
    }
  }

  playType() {
    this._tone(780 + Math.random() * 80, 0.025, 'square', 0.25);
  }

  playSuccess() {
    this._tone(520, 0.08, 'sine', 0.8);
    setTimeout(() => this._tone(780, 0.14, 'sine', 0.8), 70);
  }

  playError() {
    this._tone(170, 0.18, 'sawtooth', 0.7, 90);
  }

  playDoor() {
    this._tone(110, 0.45, 'sawtooth', 0.8, 420);
  }

  playReset() {
    this._tone(440, 0.12, 'square', 0.5, 100);
    setTimeout(() => this._tone(100, 0.5, 'sawtooth', 0.7, 40), 120);
  }

  playAlarm() {
    this._tone(760, 0.12, 'square', 0.35);
    setTimeout(() => this._tone(520, 0.12, 'square', 0.35), 140);
  }

  playAmbient() {
    const ctx = this._ensure();
    if (!ctx || this._ambient) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 52;
    gain.gain.value = this.master * 0.18;

    osc.connect(gain).connect(ctx.destination);
    osc.start();

    this._ambient = { osc, gain };
  }

  stopAmbient() {
    if (!this._ambient) return;
    try { this._ambient.osc.stop(); } catch (_) {}
    this._ambient = null;
  }
}

try {
  window.AudioManagerInstance = new AudioManager();
} catch (error) {
  console.warn('[FORK] Audio disabled:', error);
  window.AudioManagerInstance = {
    getVolumePercent: () => 100,
    isMuted: () => false,
    setVolume: () => 100,
    changeVolume: () => 100,
    setMuted: () => false,
    toggleMute: () => false,
    playBeep: () => {},
    playInterfaceClick: () => {},
    playKey: () => {},
    playType: () => {},
    playSuccess: () => {},
    playError: () => {},
    playDoor: () => {},
    playReset: () => {},
    playAlarm: () => {},
    playAmbient: () => {},
    stopAmbient: () => {},
  };
}
