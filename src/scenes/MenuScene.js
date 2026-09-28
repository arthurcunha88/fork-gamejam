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
      fontFamily: F.FAMILY, fontSize: '11px', color: '#33aa33',
    });
    this.add.text(W - 12, 6, 'v2.1.0', {
      fontFamily: F.FAMILY, fontSize: '11px', color: '#33aa33',
    }).setOrigin(1, 0);

    // Título FORK — grande, neon, com glow via shadow
    const titleY = H / 2 - 110;
    const title = this.add.text(W / 2, titleY, 'F O R K', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '110px',
      color: '#39ff14',
      stroke: '#00ff41',
      strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff41', blur: 20, stroke: true, fill: true },
    }).setOrigin(0.5, 0);

    // Pulso no título
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.75 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtítulo
    this.add.text(W / 2, titleY + 96, '[ ESCAPE ROOM  //  LOOP SYSTEM  //  BUTTERFLY EFFECT ]', {
      fontFamily: F.FAMILY,
      fontSize: '12px',
      color: '#33aa33',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff41', blur: 6, fill: true },
    }).setOrigin(0.5, 0);

    // Linha separadora com brilho
    this.add.rectangle(W / 2, titleY + 116, 360, 1, 0x00ff41, 0.5).setOrigin(0.5, 0);

    // Botões
    const btnY = H / 2 + 18;
    this._makeButton(W / 2, btnY,       '> INICIAR SIMULAÇÃO', () => this._startGame());
    this._makeButton(W / 2, btnY + 52,  '> CONTINUAR',         () => this._continueGame(), GameState.get('loop_count') > 0);
    this._makeButton(W / 2, btnY + 104, '> SOBRE',             () => this._showAbout());

    // Footer
    this.add.text(W / 2, H - 12, 'NPCboPe  //  GAME JAM  //  BUTTERFLY EFFECT', {
      fontFamily: F.FAMILY, fontSize: '10px', color: '#1a4d1a',
    }).setOrigin(0.5, 1);

    // Loop warning
    if (GameState.get('loop_count') > 0) {
      const msg = this.add.text(W / 2, btnY - 32,
        `// LOOP ${GameState.get('loop_count')} DETECTED — MEMORY PRESERVED`, {
        fontFamily: F.FAMILY, fontSize: '11px', color: '#ffaa00',
        shadow: { offsetX: 0, offsetY: 0, color: '#ffaa00', blur: 8, fill: true },
      }).setOrigin(0.5, 0);
      this.tweens.add({ targets: msg, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  _makeButton(x, y, label, onClick, enabled = true) {
    const F    = FORK_CONFIG.FONT;
    const color = enabled ? '#00ff41' : '#1a4d1a';

    const btn = this.add.text(x, y, label, {
      fontFamily: F.FAMILY,
      fontSize:   '16px',
      color,
      shadow: enabled
        ? { offsetX: 0, offsetY: 0, color: '#00ff41', blur: 8, fill: true }
        : undefined,
    }).setOrigin(0.5, 0);

    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setColor('#ffffff');
        btn.setShadow(0, 0, '#39ff14', 18, true, true);
      });
      btn.on('pointerout', () => {
        btn.setColor(color);
        btn.setShadow(0, 0, '#00ff41', 8, true, true);
      });
      btn.on('pointerdown', onClick);
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
