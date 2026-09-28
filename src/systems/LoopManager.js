// ============================================================
// FORK — LoopManager.js
// Gerencia o timer do loop, alertas e reset
// ============================================================

class LoopManager {

  constructor(scene) {
    this.scene = scene;
    this.timeRemaining = FORK_CONFIG.LOOP_DURATION;
    this.active = false;
    this.paused = false;
    this._callbacks = {
      onWarning:  [],
      onCritical: [],
      onReset:    [],
      onTick:     [],
    };
  }

  // ── Inicialização ─────────────────────────────────────────

  start() {
    this.timeRemaining = FORK_CONFIG.LOOP_DURATION;
    this.active = true;
    this.paused = false;
    this._warningFired  = false;
    this._criticalFired = false;
    console.log(`[LOOP] Loop ${GameState.get('loop_count')} started — ${this.timeRemaining}s`);
  }

  pause()  { this.paused = true; }
  resume() { this.paused = false; }

  stop() {
    this.active = false;
    this.paused = false;
  }

  // ── Update (chamado em scene.update) ─────────────────────

  update(delta) {
    if (!this.active || this.paused) return;

    this.timeRemaining -= delta / 1000;

    // Dispara callbacks de tick
    this._callbacks.onTick.forEach(cb => cb(this.timeRemaining));

    // Aviso (60s restantes)
    if (!this._warningFired && this.timeRemaining <= FORK_CONFIG.LOOP_WARNING_TIME) {
      this._warningFired = true;
      this._fire('onWarning');
    }

    // Crítico (30s restantes)
    if (!this._criticalFired && this.timeRemaining <= FORK_CONFIG.LOOP_CRITICAL_TIME) {
      this._criticalFired = true;
      this._fire('onCritical');
    }

    // O relógio não encerra o loop. Apenas marca o tempo da sessão.
    if (this.timeRemaining <= 0) this.timeRemaining = 0;
  }

  // ── Formatação ────────────────────────────────────────────

  /** Retorna string formatada "MM:SS" */
  getFormattedTime() {
    const t = Math.max(0, Math.ceil(this.timeRemaining));
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Retorna 0-1 onde 1 = tempo cheio, 0 = reset */
  getProgress() {
    return Math.max(0, this.timeRemaining / FORK_CONFIG.LOOP_DURATION);
  }

  isWarning()  { return this.timeRemaining <= FORK_CONFIG.LOOP_WARNING_TIME; }
  isCritical() { return this.timeRemaining <= FORK_CONFIG.LOOP_CRITICAL_TIME; }

  // ── Callbacks ─────────────────────────────────────────────

  on(event, callback) {
    if (this._callbacks[event]) {
      this._callbacks[event].push(callback);
    }
    return this; // chaining
  }

  _fire(event) {
    this._callbacks[event].forEach(cb => cb(this.timeRemaining));
  }

  // ── Manipulação direta ────────────────────────────────────

  /** Adiciona tempo ao loop (recompensa) */
  addTime(seconds) {
    this.timeRemaining = Math.min(FORK_CONFIG.LOOP_DURATION, this.timeRemaining + seconds);
  }

  /** Remove tempo (penalidade) */
  removeTime(seconds) {
    this.timeRemaining = Math.max(0, this.timeRemaining - seconds);
  }

  /** Colapsa o loop por erro crítico explícito. */
  collapse(reason = 'CRITICAL_ERROR') {
    if (!this.active) return;
    this.active = false;
    this.paused = false;
    this._fire('onReset', reason);
  }

  forceReset(reason = 'FORCED_ERROR') {
    this.collapse(reason);
  }
}
