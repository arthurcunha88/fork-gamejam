// ============================================================
// FORK — MenuScene.js
// Tela inicial do jogo
// ============================================================

class MenuScene extends Phaser.Scene {

  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    // ── Fundo ──────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, C.BG).setOrigin(0, 0);
    this._drawGrid();

    // ── Header do sistema ──────────────────────────────────
    const headerBg = this.add.rectangle(0, 0, W, 28, C.HIGHLIGHT, 1).setOrigin(0, 0);
    this.add.text(14, 7, 'FORK OS  //  SIMULATION ENVIRONMENT  //  LOOP SYSTEM ACTIVE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#446655',
    });
    this.add.text(W - 14, 7, 'v2.1.0', {
      fontFamily: 'monospace', fontSize: '10px', color: '#446655',
    }).setOrigin(1, 0);

    // ── Título FORK ────────────────────────────────────────
    const titleY = H / 2 - 90;
    this.add.text(W / 2, titleY, 'F O R K', {
      fontFamily: 'monospace',
      fontSize:   '64px',
      color:      '#00ffe0',
      letterSpacing: 8,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, titleY + 72, '[ ESCAPE ROOM  //  LOOP SYSTEM  //  BUTTERFLY EFFECT ]', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#446655',
    }).setOrigin(0.5, 0);

    // Linha decorativa
    this.add.rectangle(W / 2, titleY + 94, 320, 1, C.ACCENT_DIM, 0.4).setOrigin(0.5, 0);

    // ── Botões ─────────────────────────────────────────────
    const btnY = H / 2 + 10;

    this._makeButton(W / 2, btnY,      'INICIAR SIMULAÇÃO', () => this._startGame());
    this._makeButton(W / 2, btnY + 46, 'CONTINUAR',         () => this._continueGame(), GameState.get('loop_count') > 0);
    this._makeButton(W / 2, btnY + 92, 'SOBRE',             () => this._showAbout());

    // ── Footer ─────────────────────────────────────────────
    this.add.text(W / 2, H - 16, 'NPCboPe  //  GAME JAM  //  BUTTERFLY EFFECT', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a3322',
    }).setOrigin(0.5, 1);

    // ── Mensagem do sistema (se loop > 0) ──────────────────
    if (GameState.get('loop_count') > 0) {
      const loopMsg = this.add.text(W / 2, btnY - 30,
        `LOOP ${GameState.get('loop_count')} DETECTED  //  MEMORY PRESERVED`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffaa00',
      }).setOrigin(0.5, 0);

      this.tweens.add({
        targets: loopMsg, alpha: 0.3, duration: 800, yoyo: true, repeat: -1,
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  _makeButton(x, y, label, onClick, enabled = true) {
    const color  = enabled ? '#00ffe0' : '#1a3322';
    const hover  = enabled ? '#ffffff' : '#1a3322';

    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color,
    }).setOrigin(0.5, 0);

    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover',  () => btn.setColor(hover));
      btn.on('pointerout',   () => btn.setColor(color));
      btn.on('pointerdown',  onClick);
    }

    return btn;
  }

  _drawGrid() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const step = 40;
    const gfx = this.add.graphics();
    gfx.lineStyle(1, FORK_CONFIG.COLORS.GRID, 0.3);

    for (let x = 0; x < W; x += step) {
      gfx.moveTo(x, 0).lineTo(x, H);
    }
    for (let y = 0; y < H; y += step) {
      gfx.moveTo(0, y).lineTo(W, y);
    }
    gfx.strokePath();
  }

  _startGame() {
    // Reset completo
    GameState.persistent = {
      loop_count:            0,
      log07_deleted:         false,
      server_rebooted:       false,
      door_unlocked:         false,
      secret_area_found:     false,
      entity_trust:          0,
      system_awareness:      0,
      butterfly_steps:       [],
      player_identity_known: false,
      escape_attempted:      false,
      commands_executed:     [],
      puzzles_solved:        [],
      ending_flags:          {},
    };
    GameState.nextLoop();
    this.scene.start('GameScene');
  }

  _continueGame() {
    this.scene.start('GameScene');
  }

  _showAbout() {
    // Overlay de "sobre"
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.85).setOrigin(0, 0).setDepth(50);
    const box = this.add.rectangle(W / 2, H / 2, 480, 320, FORK_CONFIG.COLORS.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_DIM).setDepth(51);

    const text = [
      'FORK',
      '────────────────────────────────',
      'Escape room digital em 2D top-down.',
      'Você está preso em um sistema que',
      'se reinicia continuamente.',
      '',
      'Cada ação altera o próximo ciclo.',
      'Pequenas decisões. Grandes consequências.',
      '',
      'TEMA: Efeito Borboleta',
      '',
      'Desenvolvido por NPCboPe',
      'Game Jam Edition',
      '────────────────────────────────',
      '[ CLIQUE PARA FECHAR ]',
    ].join('\n');

    this.add.text(W / 2, H / 2, text, {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#88ffdd',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(52);

    overlay.setInteractive();
    overlay.once('pointerdown', () => {
      overlay.destroy();
      box.destroy();
      // destroys text too via scene cleanup handled by GC
    });
  }
}
