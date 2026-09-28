// ============================================================
// FORK — GameState.js
// Estado central do jogo — persiste entre loops
// Singleton acessível globalmente
// ============================================================

const FORK_SAVE_KEY = 'fork_gamejam_save_v2';

const GameState = {

  // ── Estado persistente (sobrevive ao reset) ──────────────
  persistent: {
    loop_count:            0,
    phase:                 FORK_CONFIG.PHASES.AWAKENING,
    memory_code_found:     false,
    observer_unlocked:     false,
    identity_fragment_found: false,
    fork_sequence_complete: false,
    log07_deleted:         false,
    server_rebooted:       false,
    door_unlocked:         false,
    secret_area_found:     false,
    entity_trust:          0,       // 0-3
    system_awareness:      0,       // 0-5 (o sistema "aprende")
    butterfly_steps:       [],      // passos do puzzle secreto
    player_identity_known: false,
    escape_attempted:      false,
    commands_executed:     [],      // histórico de comandos
    puzzles_solved:        [],      // IDs de puzzles resolvidos
    ending_flags:          {},      // flags dos finais
    clear_count:            0,       // quantas vezes o terminal foi limpo
    corruption_level:      0,       // 0-5: degradação da simulação
    filesystem_wiped:      false,   // DELETE ALL
    system_notes_read:     false,
    restore_requested:     false,
    system_restored:       false,
  },

  // ── Estado volátil (reseta a cada loop) ──────────────────
  volatile: {
    current_room:     'main_lab',
    player_x:         400,
    player_y:         300,
    dialog_open:      false,
    terminal_open:    false,
    modal_open:       false,
    active_object:    null,
  },

  // ── Persistência local ──────────────────────────────────

  hasSave() {
    try {
      return !!window.localStorage.getItem(FORK_SAVE_KEY);
    } catch (error) {
      console.warn('[FORK] Local save unavailable:', error);
      return false;
    }
  },

  save() {
    try {
      const payload = {
        version: 2,
        saved_at: new Date().toISOString(),
        persistent: JSON.parse(JSON.stringify(this.persistent)),
      };
      window.localStorage.setItem(FORK_SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('[FORK] Could not save game:', error);
      return false;
    }
  },

  load() {
    try {
      const raw = window.localStorage.getItem(FORK_SAVE_KEY);
      if (!raw) return false;

      const payload = JSON.parse(raw);
      if (!payload || payload.version !== 2 || !payload.persistent) return false;

      this.persistent = { ...this.persistent, ...payload.persistent };
      return true;
    } catch (error) {
      console.warn('[FORK] Could not load save:', error);
      return false;
    }
  },

  clearSave() {
    try {
      window.localStorage.removeItem(FORK_SAVE_KEY);
      return true;
    } catch (error) {
      console.warn('[FORK] Could not clear save:', error);
      return false;
    }
  },

  getSaveDate() {
    try {
      const raw = window.localStorage.getItem(FORK_SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw).saved_at || null;
    } catch (error) {
      return null;
    }
  },

  // ── API pública ──────────────────────────────────────────

  /** Retorna valor persistente */
  get(key) {
    return this.persistent[key];
  },

  /** Define valor persistente */
  set(key, value) {
    this.persistent[key] = value;
    this._onChange(key, value);
  },

  /** Incrementa número persistente */
  increment(key, amount = 1) {
    this.persistent[key] = (this.persistent[key] || 0) + amount;
    this._onChange(key, this.persistent[key]);
  },

  /** Adiciona item a array persistente */
  push(key, value) {
    if (!Array.isArray(this.persistent[key])) {
      this.persistent[key] = [];
    }
    if (!this.persistent[key].includes(value)) {
      this.persistent[key].push(value);
      this._onChange(key, this.persistent[key]);
    }
  },

  /** Verifica se puzzle já foi resolvido */
  isPuzzleSolved(puzzleId) {
    return this.persistent.puzzles_solved.includes(puzzleId);
  },

  /** Marca puzzle como resolvido */
  solvePuzzle(puzzleId) {
    this.push('puzzles_solved', puzzleId);
    console.log(`[FORK] Puzzle solved: ${puzzleId}`);
  },

  /** Registra comando executado */
  executeCommand(cmd) {
    this.push('commands_executed', cmd);
    console.log(`[FORK] Command executed: ${cmd}`);
  },

  /** Registra passo do puzzle borboleta */
  addButterflyStep(step) {
    this.push('butterfly_steps', step);
    console.log(`[FORK] Butterfly step: ${step} (${this.persistent.butterfly_steps.length} total)`);
  },

  /** Registra o efeito borboleta de limpar o terminal. */
  registerClear() {
    this.persistent.clear_count += 1;

    // Os dois primeiros CLEARs corrompem apenas elementos decorativos.
    // A partir do terceiro, a simulação começa a perder elementos relevantes.
    this.persistent.corruption_level = Math.min(5, this.persistent.clear_count);

    const step = 'clear_' + this.persistent.clear_count;
    this.addButterflyStep(step);

    if (this.persistent.clear_count >= 3) {
      this.persistent.system_awareness = Math.min(5, this.persistent.system_awareness + 1);
    }

    this.save();
    return this.persistent.corruption_level;
  },

  /** Apaga o sistema de arquivos e força a simulação a entrar em corrupção. */
  wipeFilesystem() {
    this.persistent.filesystem_wiped = true;
    this.persistent.corruption_level = 5;
    this.persistent.clear_count += 5;
    this.addButterflyStep('filesystem_wiped');
    this.increaseSystemAwareness(2);
    this.save();
  },

  /** Restaura a simulação usando a chave descoberta em SYSTEM_NOTES. */
  restoreSystem() {
    if (!this.persistent.system_notes_read) return false;
    if (this.persistent.corruption_level < 3) return false;

    this.persistent.corruption_level = 0;
    this.persistent.filesystem_wiped = false;
    this.persistent.restore_requested = true;
    this.persistent.system_restored = true;
    this.addButterflyStep('system_restored');
    this.save();
    return true;
  },

  /** Aumenta consciência do sistema */
  increaseSystemAwareness(amount = 1) {
    this.persistent.system_awareness = Math.min(5, this.persistent.system_awareness + amount);
    console.log('[FORK] System awareness: ' + this.persistent.system_awareness);
    this.save();
  },

  /** Reseta estado volátil (chamado no início de cada loop) */
  resetVolatile() {
    this.volatile = {
      current_room:  'main_lab',
      player_x:      400,
      player_y:      300,
      dialog_open:   false,
      terminal_open: false,
      modal_open:    false,
      active_object: null,
    };
  },

  /** Incrementa loop e reseta volátil */
  nextLoop() {
    this.persistent.loop_count++;
    this.resetVolatile();
    console.log(`[FORK] Loop ${this.persistent.loop_count} started`);
  },

  advancePhase(phase) {
    if (phase > (this.persistent.phase || 1)) {
      this.persistent.phase = Math.min(FORK_CONFIG.PHASES.FORK, phase);
    }
  },

  /** Verifica condições para cada final */
  checkEndingConditions() {
    const p = this.persistent;

    // FINAL 5 — exige a cadeia secreta completa.
    if (p.butterfly_steps.includes('delete_log07') &&
        p.butterfly_steps.includes('reboot_server') &&
        p.butterfly_steps.includes('find_project') &&
        p.butterfly_steps.includes('unlock_door') &&
        p.butterfly_steps.includes('observer_truth') &&
        p.fork_sequence_complete) {
      return FORK_CONFIG.ENDINGS.BUTTERFLY;
    }

    // FINAL 3 — LOOP ETERNO
    if (p.loop_count >= FORK_CONFIG.MAX_LOOPS) {
      return FORK_CONFIG.ENDINGS.ETERNAL_LOOP;
    }

    // FINAL 4 — VOCÊ ESTÁ SENDO CONTROLADO
    if (p.system_awareness >= 4 && p.player_identity_known && p.identity_fragment_found) {
      return FORK_CONFIG.ENDINGS.CONTROLLED;
    }

    // FINAL 2 — RESET
    if (p.escape_attempted && p.system_awareness >= 2 && p.phase < FORK_CONFIG.PHASES.OBSERVER) {
      return FORK_CONFIG.ENDINGS.RESET;
    }

    // FINAL 1 — ESCAPE
    if (p.door_unlocked && p.puzzles_solved.length >= 5 && p.phase >= FORK_CONFIG.PHASES.INFILTRATION) {
      return FORK_CONFIG.ENDINGS.ESCAPE;
    }

    return null; // nenhum final ainda
  },

  /** Callback interno ao alterar estado */
  _onChange(key, value) {
    // Aumenta consciência do sistema quando certas ações ocorrem
    if (key === 'log07_deleted' && value === true) {
      this.increaseSystemAwareness(1);
    }
    if (key === 'escape_attempted' && value === true) {
      this.increaseSystemAwareness(2);
    }
    if (key === 'server_rebooted' && value === true) {
      this.increaseSystemAwareness(1);
    }
    if (key === 'identity_fragment_found' && value === true) {
      this.increaseSystemAwareness(1);
    }
    if (this.persistent.log07_deleted && this.persistent.server_rebooted) {
      this.advancePhase(FORK_CONFIG.PHASES.INFILTRATION);
    }
    if (this.persistent.observer_unlocked && this.persistent.identity_fragment_found) {
      this.advancePhase(FORK_CONFIG.PHASES.OBSERVER);
    }
    if (this.persistent.secret_area_found && this.persistent.door_unlocked && this.persistent.observer_unlocked) {
      this.advancePhase(FORK_CONFIG.PHASES.FORK);
    }

    this.save();
  },

  /** Debug: imprime estado atual */
  debug() {
    console.table(this.persistent);
  },
};

GameState.load();
