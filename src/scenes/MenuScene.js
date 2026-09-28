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
    const C = FORK_CONFIG.COLORS;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.9)
      .setOrigin(0, 0).setDepth(50).setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 620, 400, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, C.ACCENT_DIM).setDepth(51);

    const title = this.add.text(W / 2, H / 2 - 174, '// FORK — TECHNICAL OVERVIEW', {
      fontFamily: F.FAMILY_TITLE, fontSize: '24px', color: F.COLOR_BRIGHT,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff41', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(52);

    const body = [
      'DIGITAL ESCAPE ROOM  //  TOP-DOWN 2D',
      '────────────────────────────────────────────',
      'ENGINE        Phaser 3',
      'RUNTIME       JavaScript / Web Audio API',
      'ARCHITECTURE  Scene + Manager + State',
      'GAME STATE    Persistent local state between loops',
      'AUDIO         Procedural synthesis — no external SFX',
      'VISUALS       Procedural rendering / tweens / particles',
      'INPUT         Keyboard + pointer interaction',
      '',
      'CORE SYSTEMS',
      '  LoopManager     → temporal reset and loop lifecycle',
      '  PuzzleManager   → dependencies and consequences',
      '  GameState       → persistent narrative state',
      '  UIManager       → modal/input lifecycle',
      '  AudioManager    → procedural sound layer',
      '  AnimationManager→ visual feedback and effects',
      '',
      'GAMEPLAY MODEL',
      '  Efeito Borboleta → pequenas ações alteram estados futuros.',
      '  Cinco rotas de final → investigação, identidade e decisão.',
      '',
      'DESENVOLVIMENTO',
      '  Arthur Cunha • Pedro Henrique Andrade',
      '  Andre Luiz Rangel • e equipe',
      '',
      'SEMCOMP GAME JAM 2026  //  BUTTERFLY EFFECT',
    ].join('\n');

    const text = this.add.text(W / 2, H / 2 + 4, body, {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_SYSTEM,
      align: 'left', lineSpacing: 3,
    }).setOrigin(0.5).setDepth(52);

    const close = this.add.text(W / 2, H / 2 + 174, '[ ESC / CLIQUE FORA / [X] ]', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    const closeAbout = () => {
      overlay.destroy(); box.destroy(); title.destroy(); text.destroy(); close.destroy();
      this.input.keyboard.off('keydown', esc);
    };
    const esc = (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) closeAbout();
    };

    overlay.on('pointerdown', closeAbout);
    close.on('pointerdown', closeAbout);
    this.input.keyboard.on('keydown', esc);

    box.setScale(0.96); box.setAlpha(0);
    this.tweens.add({ targets: [box, title, text, close], alpha: 1, duration: 180, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: box, scale: 1, duration: 180, ease: 'Back.easeOut' });
  }
}