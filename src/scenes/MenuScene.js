// ============================================================
// FORK — MenuScene.js
// ============================================================

class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    this.add.rectangle(0, 0, W, H, C.BG).setOrigin(0, 0);
    this._drawGrid();

    // Header
    this.add.rectangle(0, 0, W, 26, C.HIGHLIGHT, 1).setOrigin(0, 0);
    this.add.text(12, 6, 'FORK OS  //  SIMULATION ENVIRONMENT  //  LOOP SYSTEM ACTIVE', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    });
    this.add.text(W - 12, 6, 'v2.1.0', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(1, 0);

    // Título
    const titleY = H / 2 - 100;
    this.add.text(W / 2, titleY, 'F O R K', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '90px',
      color: F.COLOR_BRIGHT,
      stroke: '#003300',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, titleY + 68, '[ ESCAPE ROOM  //  LOOP SYSTEM  //  BUTTERFLY EFFECT ]', {
      fontFamily: F.FAMILY_TITLE, fontSize: '16px', color: F.COLOR_DIM,
    }).setOrigin(0.5, 0);

    this.add.rectangle(W / 2, titleY + 88, 340, 1, C.ACCENT_DIM, 0.6).setOrigin(0.5, 0);

    // Botões
    const btnY = H / 2 + 10;
    this._makeButton(W / 2, btnY,      '> INICIAR SIMULAÇÃO', () => this._startGame());
    this._makeButton(W / 2, btnY + 46, '> CONTINUAR',         () => this._continueGame(), GameState.get('loop_count') > 0);
    this._makeButton(W / 2, btnY + 92, '> SOBRE',             () => this._showAbout());

    // Footer
    this.add.text(W / 2, H - 14, 'NPCboPe  //  GAME JAM  //  BUTTERFLY EFFECT', {
      fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM,
    }).setOrigin(0.5, 1);

    // Loop warning
    if (GameState.get('loop_count') > 0) {
      const msg = this.add.text(W / 2, btnY - 28,
        `// LOOP ${GameState.get('loop_count')} DETECTED — MEMORY PRESERVED`, {
        fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_WARNING,
      }).setOrigin(0.5, 0);
      this.tweens.add({ targets: msg, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  _makeButton(x, y, label, onClick, enabled = true) {
    const F = FORK_CONFIG.FONT;
    const color = enabled ? F.COLOR_PRIMARY : F.COLOR_DIM;

    const btn = this.add.text(x, y, label, {
      fontFamily: F.FAMILY_TITLE, fontSize: '22px', color,
    }).setOrigin(0.5, 0);

    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover',  () => { btn.setColor(F.COLOR_BRIGHT); btn.setFontStyle('bold'); });
      btn.on('pointerout',   () => { btn.setColor(color); btn.setFontStyle('normal'); });
      btn.on('pointerdown',  onClick);
    }
    return btn;
  }

  _drawGrid() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const gfx = this.add.graphics();
    gfx.lineStyle(1, FORK_CONFIG.COLORS.GRID, 0.4);
    for (let x = 0; x < W; x += 40) { gfx.moveTo(x, 0).lineTo(x, H); }
    for (let y = 0; y < H; y += 40) { gfx.moveTo(0, y).lineTo(W, y); }
    gfx.strokePath();
  }

  _startGame() {
    GameState.persistent = {
      loop_count: 0, log07_deleted: false, server_rebooted: false,
      door_unlocked: false, secret_area_found: false, entity_trust: 0,
      system_awareness: 0, butterfly_steps: [], player_identity_known: false,
      escape_attempted: false, commands_executed: [], puzzles_solved: [], ending_flags: {},
    };
    GameState.nextLoop();
    this.scene.start('GameScene');
  }

  _continueGame() { this.scene.start('GameScene'); }

  _showAbout() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.88).setOrigin(0, 0).setDepth(50);
    this.add.rectangle(W/2, H/2, 500, 320, FORK_CONFIG.COLORS.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_DIM).setDepth(51);

    this.add.text(W/2, H/2, [
      'FORK',
      '──────────────────────────────────',
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
      'SEMCOMP Game Jam 2026',
      '──────────────────────────────────',
      '[ CLIQUE PARA FECHAR ]',
    ].join('\n'), {
      fontFamily: F.FAMILY, fontSize: '12px',
      color: F.COLOR_SYSTEM, align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(52);

    overlay.setInteractive();
    overlay.once('pointerdown', () => { overlay.destroy(); });
  }
}
