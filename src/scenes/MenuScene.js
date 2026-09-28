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

    this._selectedIndex = 0;
    this._menuItems = [];

    this.add.rectangle(0, 0, W, H, C.BG).setOrigin(0, 0);
    this._drawGrid();
    this._drawMatrixRain();
    this._drawServerVisuals();

    this.add.rectangle(0, 0, W, 30, C.HIGHLIGHT, 1).setOrigin(0, 0);
    this.add.text(14, 7, 'FORK OS  //  SIMULATION CORE  //  NETWORK ONLINE', {
      fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_MID,
    });
    this.add.text(W - 14, 7, 'NODE: 07:31  //  v2.1.0', {
      fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_MID,
    }).setOrigin(1, 0);

    const titleY = H / 2 - 148;
    const title = this.add.text(W / 2, titleY, 'F O R K', {
      fontFamily: F.FAMILY_TITLE, fontSize: '112px', color: F.COLOR_BRIGHT,
      stroke: F.COLOR_PRIMARY, strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 22, stroke: true, fill: true },
    }).setOrigin(0.5, 0);

    this.tweens.add({ targets: title, alpha: { from: 1, to: 0.72 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(W / 2, titleY + 100, '[ DIGITAL ESCAPE ROOM  //  LOOP SYSTEM  //  BUTTERFLY EFFECT ]', {
      fontFamily: F.FAMILY, fontSize: '12px', color: F.COLOR_MID,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 7, fill: true },
    }).setOrigin(0.5, 0);
    this.add.rectangle(W / 2, titleY + 124, 420, 1, C.ACCENT, 0.5).setOrigin(0.5, 0);

    const hasSave = GameState.hasSave();
    const menuY = H / 2 + 4;
    this._makeButton(W / 2, menuY, '> NOVO JOGO', () => this._startGame(), true);
    this._makeButton(W / 2, menuY + 48, hasSave ? '> CONTINUAR' : '> CONTINUAR  [NO SAVE]', () => this._continueGame(), hasSave);
    this._makeButton(W / 2, menuY + 96, '> SOBRE', () => this._showAbout(), true);

    this._selectionHint = this.add.text(W / 2, menuY + 146, '[ ↑ / ↓ ] SELECIONAR    [ ENTER ] CONFIRMAR', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(0.5);

    const saveDate = GameState.getSaveDate();
    const saveText = hasSave
      ? 'SAVE: LOCAL // LOOP ' + String(GameState.get('loop_count')).padStart(2, '0') + ' // ' + (saveDate ? saveDate.slice(0, 19).replace('T', ' ') : 'AVAILABLE')
      : 'SAVE: NO LOCAL DATA // START A NEW SIMULATION';
    this._saveStatus = this.add.text(W / 2, H - 52, saveText, {
      fontFamily: F.FAMILY, fontSize: '10px', color: hasSave ? F.COLOR_MID : F.COLOR_DIM,
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 14, 'NPCboPe  //  GAME JAM  //  BUTTERFLY EFFECT  //  LOCAL SAVE ENABLED', {
      fontFamily: F.FAMILY, fontSize: '9px', color: '#1a4d1a',
    }).setOrigin(0.5, 1);

    this._updateSelection();
    this._keyHandler = (event) => {
      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) this._moveSelection(-1);
      else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) this._moveSelection(1);
      else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) this._activateSelection();
    };
    this.input.keyboard.on('keydown', this._keyHandler);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this._keyHandler));
  }
  _makeButton(x, y, label, onClick, enabled = true) {
    const F = FORK_CONFIG.FONT;
    const btn = this.add.text(x, y, label, {
      fontFamily: F.FAMILY, fontSize: '17px', color: enabled ? F.COLOR_PRIMARY : F.COLOR_DIM,
      shadow: enabled ? { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 8, fill: true } : undefined,
    }).setOrigin(0.5, 0);
    const item = { btn, onClick, enabled };
    this._menuItems.push(item);
    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => { this._selectedIndex = this._menuItems.indexOf(item); this._updateSelection(); });
      btn.on('pointerdown', onClick);
    }
    return btn;
  }

  _moveSelection(direction) {
    if (!this._menuItems.length) return;
    let next = this._selectedIndex;
    for (let i = 0; i < this._menuItems.length; i++) {
      next = (next + direction + this._menuItems.length) % this._menuItems.length;
      if (this._menuItems[next].enabled) { this._selectedIndex = next; this._updateSelection(); return; }
    }
  }

  _updateSelection() {
    this._menuItems.forEach((item, index) => {
      if (!item.enabled) { item.btn.setColor(FORK_CONFIG.FONT.COLOR_DIM).setAlpha(0.45); return; }
      const selected = index === this._selectedIndex;
      item.btn.setColor(selected ? FORK_CONFIG.FONT.COLOR_WHITE : FORK_CONFIG.FONT.COLOR_PRIMARY);
      item.btn.setShadow(0, 0, selected ? FORK_CONFIG.FONT.COLOR_BRIGHT : FORK_CONFIG.FONT.COLOR_PRIMARY, selected ? 16 : 7, true, true);
      item.btn.setScale(selected ? 1.04 : 1);
    });
  }

  _activateSelection() {
    const item = this._menuItems[this._selectedIndex];
    if (item && item.enabled) item.onClick();
  }

  _drawMatrixRain() {
    const W = FORK_CONFIG.WIDTH, H = FORK_CONFIG.HEIGHT, F = FORK_CONFIG.FONT;
    const glyphs = '01アイウエオカキクケコ<>[]{}+/\\';
    const layer = this.add.container(0, 30).setAlpha(0.16);
    for (let i = 0; i < 34; i++) {
      const x = Phaser.Math.Between(8, W - 8), y = Phaser.Math.Between(35, H);
      const length = Phaser.Math.Between(5, 15);
      let value = '';
      for (let j = 0; j < length; j++) value += glyphs[Phaser.Math.Between(0, glyphs.length - 1)] + '\n';
      const column = this.add.text(x, y, value, { fontFamily: F.FAMILY, fontSize: Phaser.Math.Between(8, 12) + 'px', color: i % 6 === 0 ? F.COLOR_BRIGHT : F.COLOR_DIM });
      layer.add(column);
      this.tweens.add({ targets: column, y: y + Phaser.Math.Between(70, 190), duration: Phaser.Math.Between(3500, 7000), delay: Phaser.Math.Between(0, 2500), repeat: -1, onRepeat: () => { column.y = Phaser.Math.Between(35, H); } });
    }
  }

  _drawServerVisuals() {
    const W = FORK_CONFIG.WIDTH, C = FORK_CONFIG.COLORS, F = FORK_CONFIG.FONT;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x010501, 0.92); gfx.fillRect(34, 170, 150, 230);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.8); gfx.strokeRect(34, 170, 150, 230);
    this.add.text(46, 180, 'SERVER RACK // A', { fontFamily: F.FAMILY_TITLE, fontSize: '16px', color: F.COLOR_MID });
    for (let i = 0; i < 7; i++) {
      const y = 210 + i * 25;
      gfx.fillStyle(0x030d03, 1); gfx.fillRect(46, y, 126, 18); gfx.lineStyle(1, C.ACCENT_DIM, 0.45); gfx.strokeRect(46, y, 126, 18);
      this.add.text(52, y + 3, 'NODE-' + String(i + 1).padStart(2, '0'), { fontFamily: F.FAMILY, fontSize: '8px', color: F.COLOR_DIM });
      const led = this.add.circle(158, y + 9, 3, i === 0 ? C.ACCENT_BRIGHT : C.ACCENT_DIM, 1);
      this.tweens.add({ targets: led, alpha: { from: 1, to: 0.25 }, duration: 500 + i * 100, yoyo: true, repeat: -1 });
    }
    gfx.fillStyle(0x010501, 0.92); gfx.fillRect(W - 190, 170, 150, 230);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.8); gfx.strokeRect(W - 190, 170, 150, 230);
    this.add.text(W - 178, 180, 'NETWORK // CORE', { fontFamily: F.FAMILY_TITLE, fontSize: '16px', color: F.COLOR_MID });
    ['CORE','MEMORY','OBSERVER','LOOP','GATE'].forEach((name, i) => {
      const y = 220 + i * 30;
      this.add.text(W - 176, y, name, { fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM });
      this.add.text(W - 58, y, i === 2 ? 'LOCKED' : 'ONLINE', { fontFamily: F.FAMILY, fontSize: '9px', color: i === 2 ? F.COLOR_WARNING : F.COLOR_MID }).setOrigin(1, 0);
    });
    gfx.lineStyle(1, C.ACCENT_DIM, 0.35); gfx.moveTo(184, 285).lineTo(330, 285); gfx.moveTo(W - 190, 285).lineTo(810, 285); gfx.strokePath();
    this.add.text(W / 2, 308, ':: SYSTEM STATUS ::', { fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM }).setOrigin(0.5);
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
      phase: FORK_CONFIG.PHASES.AWAKENING,
      escape_attempted: false, memory_code_found: false,
      observer_unlocked: false, identity_fragment_found: false,
      fork_sequence_complete: false, commands_executed: [], puzzles_solved: [], ending_flags: {},
    };
    GameState.nextLoop();
    GameState.save();
    this.scene.start('GameScene');
  }

  _continueGame() {
    if (!GameState.load()) return;
    this.scene.start('GameScene');
  }

  _showAbout() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;
    const C = FORK_CONFIG.COLORS;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.9)
      .setOrigin(0, 0).setDepth(50).setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 700, 500, C.TERMINAL_BG, 0.99)
      .setStrokeStyle(1, C.ACCENT_DIM).setDepth(51);

    const title = this.add.text(W / 2, H / 2 - 224, '// FORK — TECHNICAL OVERVIEW', {
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

    const text = this.add.text(W / 2, H / 2 + 2, body, {
      fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_SYSTEM,
      align: 'left', lineSpacing: 3, wordWrap: { width: 640 },
    }).setOrigin(0.5).setDepth(52);

    const close = this.add.text(W / 2 + 324, H / 2 - 230, '[ X ]', {
      fontFamily: F.FAMILY, fontSize: '12px', color: F.COLOR_BRIGHT,
      backgroundColor: '#001a00', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(53).setInteractive({ useHandCursor: true });

    const closeHint = this.add.text(W / 2, H / 2 + 232, '[ ESC / CLIQUE FORA PARA FECHAR ]', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(0.5).setDepth(52);

    const closeAbout = () => {
      overlay.destroy(); box.destroy(); title.destroy(); text.destroy(); close.destroy(); closeHint.destroy();
      this.input.keyboard.off('keydown', esc);
    };
    const esc = (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) closeAbout();
    };

    overlay.on('pointerdown', closeAbout);
    close.on('pointerdown', closeAbout);
    this.input.keyboard.on('keydown', esc);

    box.setScale(0.96); box.setAlpha(0);
    this.tweens.add({ targets: [box, title, text, close, closeHint], alpha: 1, duration: 180, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: box, scale: 1, duration: 180, ease: 'Back.easeOut' });
  }
}