// ============================================================
// FORK — EndScene.js
// Apresenta os 5 finais do jogo
// ============================================================

class EndScene extends Phaser.Scene {

  constructor() { super({ key: 'EndScene' }); }

  init(data) {
    this.endingId = data.endingId || FORK_CONFIG.ENDINGS.RESET;
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0);

    const endings = {
      [FORK_CONFIG.ENDINGS.ESCAPE]:       () => this._endingEscape(),
      [FORK_CONFIG.ENDINGS.RESET]:        () => this._endingReset(),
      [FORK_CONFIG.ENDINGS.ETERNAL_LOOP]: () => this._endingEternalLoop(),
      [FORK_CONFIG.ENDINGS.CONTROLLED]:   () => this._endingControlled(),
      [FORK_CONFIG.ENDINGS.BUTTERFLY]:    () => this._endingButterfly(),
    };

    const fn = endings[this.endingId];
    if (fn) fn();
    else     this._endingReset();
  }

  // ── Final 1 — ESCAPE ──────────────────────────────────────
  _endingEscape() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this._typeLines([
      { text: 'ACCESS GRANTED.',          color: '#00ffe0', delay: 0    },
      { text: 'Você sai do sistema.',     color: '#88ffdd', delay: 1200 },
      { text: '.',                        color: '#446655', delay: 2400 },
      { text: '. .',                      color: '#446655', delay: 3000 },
      { text: '. . .',                    color: '#446655', delay: 3600 },
    ], H / 2 - 60);

    // Tela fica preta
    this.time.delayedCall(4800, () => {
      this.cameras.main.fade(1200, 0, 0, 0);
    });

    // Mensagem final
    this.time.delayedCall(6200, () => {
      this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0);
      this.add.text(W / 2, H / 2, 'SYSTEM USERS: 2', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ff2244',
      }).setOrigin(0.5, 0.5);

      this._showEndButtons('FINAL 1 — ESCAPE');
    });
  }

  // ── Final 2 — RESET ───────────────────────────────────────
  _endingReset() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this._typeLines([
      { text: 'ACCESS DENIED.',             color: '#ff2244', delay: 0    },
      { text: 'SYSTEM RESETTING...',        color: '#ffaa00', delay: 1000 },
      { text: '',                           color: '#000000', delay: 2400 },
      { text: 'I REMEMBER YOU.',            color: '#ff2244', delay: 3200 },
      { text: `LOOP ${GameState.get('loop_count') + 1} INITIALIZING...`, color: '#446655', delay: 4200 },
    ], H / 2 - 60);

    this.time.delayedCall(5800, () => {
      this._showEndButtons('FINAL 2 — RESET');
    });
  }

  // ── Final 3 — LOOP ETERNO ─────────────────────────────────
  _endingEternalLoop() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const base = 8472913;
    const current = base + GameState.get('loop_count');

    this._typeLines([
      { text: 'Você encontrou os registros.',    color: '#88ffdd', delay: 0    },
      { text: `LOOP COUNT: ${current.toLocaleString()}`, color: '#ffaa00', delay: 1400 },
      { text: 'Isso já aconteceu antes.',        color: '#446655', delay: 2800 },
      { text: 'Muitas vezes.',                   color: '#446655', delay: 3800 },
      { text: '',                                color: '#000', delay: 5000 },
      { text: `LOOP COUNT: ${(current + 1).toLocaleString()}`, color: '#ff2244', delay: 5800 },
    ], H / 2 - 80);

    this.time.delayedCall(7200, () => {
      this._showEndButtons('FINAL 3 — LOOP ETERNO');
    });
  }

  // ── Final 4 — VOCÊ ESTÁ SENDO CONTROLADO ─────────────────
  _endingControlled() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this._typeLines([
      { text: 'Você encontrou os registros.',            color: '#88ffdd', delay: 0    },
      { text: 'BEHAVIORAL PREDICTION: 97.3% ACCURACY',  color: '#ffaa00', delay: 1400 },
      { text: 'Cada escolha que você fez...',            color: '#446655', delay: 2800 },
      { text: '...já havia sido calculada.',             color: '#446655', delay: 3800 },
      { text: '',                                        color: '#000',    delay: 5000 },
      { text: 'WHO IS REALLY PLAYING?',                  color: '#ff2244', delay: 5600 },
    ], H / 2 - 80);

    this.time.delayedCall(7200, () => {
      this._showEndButtons('FINAL 4 — CONTROLADO');
    });
  }

  // ── Final 5 — PROJECT BUTTERFLY ───────────────────────────
  _endingButterfly() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Fundo verde escuro especial
    this.time.delayedCall(200, () => {
      this.add.rectangle(0, 0, W, H, 0x001a0a, 1).setOrigin(0, 0);
    });

    this._typeLines([
      { text: 'PROJECT BUTTERFLY',                          color: '#00ffe0', delay: 0,    size: '18px' },
      { text: '──────────────────────────────────',         color: '#1a3322', delay: 600  },
      { text: 'OBJETIVO: Simular o efeito borboleta.',      color: '#88ffdd', delay: 1200 },
      { text: 'VARIÁVEL: comportamento do sujeito.',        color: '#88ffdd', delay: 2000 },
      { text: '',                                           color: '#000',    delay: 2800 },
      { text: 'VARIÁVEL NÃO PREVISTA:',                     color: '#ffaa00', delay: 3400 },
      { text: 'Sujeito encontrou este arquivo.',            color: '#ffaa00', delay: 4000 },
      { text: '',                                           color: '#000',    delay: 4800 },
      { text: 'SYSTEM NOTE: This was not supposed',        color: '#ff2244', delay: 5400 },
      { text: '            to happen.',                     color: '#ff2244', delay: 5900 },
      { text: '',                                           color: '#000',    delay: 6600 },
      { text: 'Parabéns.',                                  color: '#00ffe0', delay: 7200 },
      { text: 'Você é a anomalia.',                         color: '#00ffe0', delay: 8000, size: '16px' },
    ], H / 2 - 140);

    this.time.delayedCall(9600, () => {
      this._showEndButtons('FINAL 5 — PROJECT BUTTERFLY  ★');
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  _typeLines(lines, startY) {
    const W = FORK_CONFIG.WIDTH;
    let y = startY;

    lines.forEach(({ text, color, delay, size }) => {
      this.time.delayedCall(delay, () => {
        this.add.text(W / 2, y, text, {
          fontFamily: 'monospace',
          fontSize:   size || '13px',
          color,
        }).setOrigin(0.5, 0);
        y += size === '18px' ? 36 : 24;
      });
    });
  }

  _showEndButtons(finalLabel) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Label do final
    this.add.text(W / 2, H - 90, finalLabel, {
      fontFamily: 'monospace', fontSize: '11px', color: '#1a3322',
    }).setOrigin(0.5, 0);

    // Linha separadora
    this.add.rectangle(W / 2, H - 70, 400, 1, FORK_CONFIG.COLORS.ACCENT_DIM, 0.3)
      .setOrigin(0.5, 0);

    // Botão — jogar novamente
    const btnNew = this.add.text(W / 2 - 100, H - 52, '[ NOVO JOGO ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#00ffe0',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    btnNew.on('pointerover',  () => btnNew.setColor('#ffffff'));
    btnNew.on('pointerout',   () => btnNew.setColor('#00ffe0'));
    btnNew.on('pointerdown',  () => {
      // Reset total e volta ao menu
      GameState.persistent = {
        loop_count: 0, log07_deleted: false, server_rebooted: false,
        door_unlocked: false, secret_area_found: false, entity_trust: 0,
        system_awareness: 0, butterfly_steps: [], player_identity_known: false,
        escape_attempted: false, commands_executed: [], puzzles_solved: [], ending_flags: {},
      };
      this.scene.start('MenuScene');
    });

    // Botão — menu
    const btnMenu = this.add.text(W / 2 + 100, H - 52, '[ MENU ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#446655',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    btnMenu.on('pointerover',  () => btnMenu.setColor('#88ffdd'));
    btnMenu.on('pointerout',   () => btnMenu.setColor('#446655'));
    btnMenu.on('pointerdown',  () => this.scene.start('MenuScene'));
  }
}
