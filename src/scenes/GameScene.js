// ============================================================
// FORK — GameScene.js  [v2 — green hacker visual]
// ============================================================

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.loopManager   = new LoopManager(this);
    this.puzzleManager = new PuzzleManager();
    this.dialogManager = new DialogManager(this);
    this.finalManager  = new FinalManager(this);

    this._wallRects = [];
    this._buildMap();

    this._objects = [];
    this._buildObjects();

    this.player = new Player(this, 200, 300);

    this._wallRects.forEach(wall => {
      this.physics.add.collider(this.player.getPhysicsBody(), wall);
    });

    this._buildHUD();

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player.getPhysicsBody(), true, 0.1, 0.1);

    this._setupLoopCallbacks();
    this.loopManager.start();
    this._showLoopStart();

    this.input.on('pointerdown', (ptr) => this._handleClick(ptr));
  }

  update(time, delta) {
    if (!this.player) return;
    this.loopManager.update(delta);
    this.dialogManager.update();
    this.finalManager.check();
    this.player.update(this._objects);
    this._objects.forEach(obj => obj.update(this.player.x, this.player.y));
    this._updateHUD();
  }

  // ── Mapa ──────────────────────────────────────────────────

  _buildMap() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const gfx = this.add.graphics().setDepth(0);

    // Chão base
    gfx.fillStyle(C.BG, 1);
    gfx.fillRect(0, 0, W, H);

    // Grid sutil
    gfx.lineStyle(1, C.GRID, 0.5);
    for (let x = 0; x < W; x += 32) { gfx.moveTo(x, 0).lineTo(x, H); }
    for (let y = 0; y < H; y += 32) { gfx.moveTo(0, y).lineTo(W, y); }
    gfx.strokePath();

    // Salas
    this._drawRoom(gfx, 60,  50,  840, 540);
    this._drawRoom(gfx, 660, 50,  240, 200, true);
    this._drawRoom(gfx, 60,  390, 220, 200, true);

    // Marcações de chão (scanlines digitais)
    gfx.lineStyle(1, C.ACCENT_DIM, 0.08);
    for (let x = 80; x < 900; x += 80) { gfx.moveTo(x, 70).lineTo(x, 570); }
    for (let y = 70; y < 580; y += 80) { gfx.moveTo(80, y).lineTo(880, y); }
    gfx.strokePath();

    // Labels das salas — agora visíveis com verde médio
    const labelStyle = { fontFamily: F.FAMILY_TITLE, fontSize: '20px', color: '#00ff41', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:10, fill:true } };
    this.add.text(120, 62,  '// MAIN LAB',     labelStyle).setDepth(1);
    this.add.text(672, 62,  '// CONTROL ROOM', labelStyle).setDepth(1);
    this.add.text(72,  400, '// STORAGE',      labelStyle).setDepth(1);

    // Decoração extra: coordenadas dos cantos
    const dimStyle = { fontFamily: F.FAMILY, fontSize: '9px', color: '#33aa33' };
    this.add.text(65,  55,  '[00,00]', dimStyle).setDepth(1);
    this.add.text(860, 55,  '[10,00]', dimStyle).setOrigin(1,0).setDepth(1);
    this.add.text(65,  575, '[00,06]', dimStyle).setDepth(1);
    this.add.text(860, 575, '[10,06]', dimStyle).setOrigin(1,0).setDepth(1);
  }

  _drawRoom(gfx, x, y, w, h, isSecondary = false) {
    const C     = FORK_CONFIG.COLORS;
    const color = isSecondary ? C.ACCENT_DIM : C.ACCENT;
    const alpha = isSecondary ? 0.25 : 0.45;
    const thick = 12;

    // Chão interno levemente diferente
    gfx.fillStyle(isSecondary ? 0x020f02 : 0x030d03, 1);
    gfx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Borda da sala
    gfx.lineStyle(isSecondary ? 1 : 2, color, alpha);
    gfx.strokeRect(x, y, w, h);

    // Cantos decorativos (esquadros)
    const cs = 10; // corner size
    gfx.lineStyle(2, color, alpha + 0.2);
    // TL
    gfx.moveTo(x, y + cs).lineTo(x, y).lineTo(x + cs, y);
    // TR
    gfx.moveTo(x + w - cs, y).lineTo(x + w, y).lineTo(x + w, y + cs);
    // BL
    gfx.moveTo(x, y + h - cs).lineTo(x, y + h).lineTo(x + cs, y + h);
    // BR
    gfx.moveTo(x + w - cs, y + h).lineTo(x + w, y + h).lineTo(x + w, y + h - cs);
    gfx.strokePath();

    // Paredes físicas
    const walls = [
      { wx: x + w/2, wy: y,       ww: w,     wh: thick },
      { wx: x + w/2, wy: y + h,   ww: w,     wh: thick },
      { wx: x,       wy: y + h/2, ww: thick, wh: h     },
      { wx: x + w,   wy: y + h/2, ww: thick, wh: h     },
    ];
    walls.forEach(({ wx, wy, ww, wh }) => {
      const rect = this.add.rectangle(wx, wy, ww, wh, 0x000000, 0);
      this.physics.add.existing(rect, true);
      this._wallRects.push(rect);
    });
  }

  // ── Objetos interativos ───────────────────────────────────

  _buildObjects() {
    const C = FORK_CONFIG.COLORS;

    const terminal = new Terminal(this, 180, 220, {
      id: 'terminal_main', label: 'TERMINAL',
      puzzleManager: this.puzzleManager,
      dialogManager: this.dialogManager,
      puzzleId: FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
    });
    this._objects.push(terminal);

    const door = new InteractiveObject(this, 878, 300, {
      id: 'door_security', type: FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: 'SECURITY DOOR', width: 16, height: 60,
      color: GameState.get('door_unlocked') ? C.ACCENT : C.DANGER,
      onInteract: (obj) => this._interactDoor(obj),
    });
    this._objects.push(door);

    const server = new InteractiveObject(this, 750, 130, {
      id: 'server_main', type: FORK_CONFIG.OBJECT_TYPES.SERVER,
      label: 'SERVER A', width: 36, height: 52,
      color: C.ACCENT_DIM,
      onInteract: () => this._interactServer(),
    });
    this._objects.push(server);

    const panel = new InteractiveObject(this, 820, 130, {
      id: 'panel_sequence', type: FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'PANEL', width: 28, height: 28,
      color: C.ACCENT_DIM,
      onInteract: () => this._interactPanel(),
    });
    this._objects.push(panel);

    const file = new InteractiveObject(this, 140, 460, {
      id: 'file_notes', type: FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'NOTES.txt', width: 20, height: 26,
      color: C.ACCENT_DIM,
      onInteract: () => this._interactFile(),
    });
    this._objects.push(file);

    const entity = new InteractiveObject(this, 160, 510, {
      id: 'entity', type: FORK_CONFIG.OBJECT_TYPES.OBJECT,
      label: '???', width: 16, height: 16,
      color: 0x113311,
      onInteract: () => this._interactEntity(),
    });
    this._objects.push(entity);

    const cam = new InteractiveObject(this, 855, 70, {
      id: 'camera_01', type: FORK_CONFIG.OBJECT_TYPES.CAMERA,
      label: 'CAM-01', width: 20, height: 14,
      color: C.DANGER,
      onInteract: () => this._interactCamera(),
    });
    this._objects.push(cam);

    if (GameState.get('server_rebooted') && GameState.get('log07_deleted')) {
      const secret = new InteractiveObject(this, 700, 490, {
        id: 'secret_file', type: FORK_CONFIG.OBJECT_TYPES.FILE,
        label: 'PROJECT_B.enc', width: 22, height: 26,
        color: 0x004422,
        onInteract: () => this._interactSecretFile(),
      });
      this._objects.push(secret);
    }
  }

  // ── Interações ────────────────────────────────────────────

  _handleClick(ptr) {
    if (GameState.volatile.dialog_open || GameState.volatile.terminal_open) return;
    const worldX = ptr.worldX;
    const worldY = ptr.worldY;
    let nearest = null;
    let minDist = FORK_CONFIG.INTERACT_RANGE;
    this._objects.forEach(obj => {
      if (!obj.enabled) return;
      const d = Phaser.Math.Distance.Between(worldX, worldY, obj.x, obj.y);
      if (d < minDist) { minDist = d; nearest = obj; }
    });
    if (nearest) nearest.interact();
  }

  _interactDoor(obj) {
    if (GameState.get('door_unlocked')) {
      GameState.set('escape_attempted', true);
      const ending = GameState.checkEndingConditions();
      if (ending) { this.finalManager.trigger(ending); }
      else {
        this.dialogManager.show([
          'ACCESS GRANTED.',
          'Mas algo te segura.',
          'Ainda não é hora.',
        ], { title: 'SECURITY DOOR' });
      }
    } else { this._showCodePuzzle(); }
  }

  _showCodePuzzle() {
    if (!GameState.get('log07_deleted')) {
      this.dialogManager.show(NARRATIVE.door.locked_no_clue, { title: 'SECURITY DOOR' });
      return;
    }
    // Efeito borboleta: porta dá pista só porque LOG_07 foi deletado
    this.dialogManager.show(NARRATIVE.door.locked_has_clue, {
      title: 'SECURITY DOOR',
      onClose: () => this._showCodeInput(),
    });
  }

  _showCodeInput() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    this.loopManager.pause();
    const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const overlay  = this.add.rectangle(0, 0, W, H, 0x000000, 0.8).setOrigin(0, 0);
    const box      = this.add.rectangle(W/2, H/2, 340, 210, C.TERMINAL_BG, 0.98).setStrokeStyle(1, C.ACCENT_DIM);
    const titleLbl = this.add.text(W/2, H/2 - 82, '// SECURITY DOOR — ACCESS CODE', { fontFamily: F.FAMILY_TITLE, fontSize: '18px', color: F.COLOR_DIM }).setOrigin(0.5, 0);
    const prompt   = this.add.text(W/2, H/2 - 56, 'Enter 4-digit access code:', { fontFamily: F.FAMILY_TITLE, fontSize: '20px', color: F.COLOR_SYSTEM }).setOrigin(0.5, 0);

    let code = '';
    const codeDisplay = this.add.text(W/2, H/2 - 18, '_ _ _ _', { fontFamily: F.FAMILY_TITLE, fontSize: '52px', color: F.COLOR_PRIMARY, letterSpacing: 8 }).setOrigin(0.5, 0);
    const feedback    = this.add.text(W/2, H/2 + 42, '', { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_DANGER }).setOrigin(0.5, 0);
    const hint        = this.add.text(W/2, H/2 + 66, '[ ESC ] Cancel', { fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM }).setOrigin(0.5, 0);

    container.add([overlay, box, titleLbl, prompt, codeDisplay, feedback, hint]);

    const updateDisplay = () => {
      codeDisplay.setText(code.padEnd(4, '_').split('').join(' '));
    };
    const closeUI = () => { container.destroy(true); keyHandler.remove(); this.loopManager.resume(); };

    const keyHandler = this.input.keyboard.on('keydown', (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) { closeUI(); return; }
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) { code = code.slice(0, -1); updateDisplay(); return; }
      if (e.key >= '0' && e.key <= '9' && code.length < 4) { code += e.key; updateDisplay(); }
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER && code.length === 4) {
        const correct = this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.DOOR_CODE, code);
        if (correct) {
          feedback.setColor(F.COLOR_PRIMARY).setText('// ACCESS GRANTED');
          this.time.delayedCall(700, () => {
            closeUI();
            this.dialogManager.show(['DOOR UNLOCKED.', 'Uma ação anterior abriu esta porta.', 'O sistema notou.'], { title: 'SECURITY DOOR' });
          });
        } else {
          feedback.setText('// ACCESS DENIED — INCORRECT CODE');
          code = ''; updateDisplay();
          GameState.increaseSystemAwareness(1);
        }
      }
    });
  }

  _interactServer() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.SERVER_SEQUENCE)) {
      this.dialogManager.show([
        'SERVER A — REBOOTED',
        'Status: Nominal.',
        GameState.get('log07_deleted')
          ? '// LOG_07 ausente — anomalia persiste nos registros.'
          : '// Todos os logs intactos.',
        GameState.get('log07_deleted')
          ? '// A pasta /restricted está acessível.'
          : '',
      ], { title: 'SERVER A' });
      return;
    }
    // Mostra pista dos LEDs antes do puzzle
    this.dialogManager.show(NARRATIVE.serverLEDs, {
      title: 'SERVER A',
      onClose: () => this._showSequencePuzzle(),
    });
  }

  _showSequencePuzzle() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    this.loopManager.pause();
    const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.8).setOrigin(0, 0);
    const box     = this.add.rectangle(W/2, H/2, 420, 290, C.TERMINAL_BG, 0.98).setStrokeStyle(1, C.ACCENT_DIM);

    this.add.text(W/2, H/2 - 120, '// SERVER SEQUENCE', { fontFamily: F.FAMILY_TITLE, fontSize: '18px', color: F.COLOR_DIM }).setOrigin(0.5, 0);
    this.add.text(W/2, H/2 - 96,  'Activate panels in the correct order:', { fontFamily: F.FAMILY_TITLE, fontSize: '18px', color: F.COLOR_SYSTEM }).setOrigin(0.5, 0);
    container.add([overlay, box]);

    const panels   = ['A', 'B', 'C', 'D'];
    const selected = [];

    const seqDisplay = this.add.text(W/2, H/2 + 52, 'sequence: []', { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_MID }).setOrigin(0.5, 0);
    const feedback   = this.add.text(W/2, H/2 + 78, '', { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_DANGER }).setOrigin(0.5, 0);
    container.add([seqDisplay, feedback]);

    panels.forEach((p, i) => {
      const bx = W/2 - 90 + i * 60;
      const by = H/2 - 22;
      const btn = this.add.rectangle(bx, by, 44, 44, C.ACCENT_DIM, 0.3).setStrokeStyle(1, C.ACCENT_DIM).setInteractive({ useHandCursor: true });
      const lbl = this.add.text(bx, by, p, { fontFamily: F.FAMILY_TITLE, fontSize: '30px', color: F.COLOR_PRIMARY }).setOrigin(0.5, 0.5);
      container.add([btn, lbl]);

      btn.on('pointerover',  () => { if (!selected.includes(p)) btn.setFillStyle(C.ACCENT, 0.2); });
      btn.on('pointerout',   () => { if (!selected.includes(p)) btn.setFillStyle(C.ACCENT_DIM, 0.3); });
      btn.on('pointerdown',  () => {
        if (selected.includes(p)) return;
        selected.push(p);
        btn.setFillStyle(C.ACCENT, 0.5);
        lbl.setColor(FORK_CONFIG.FONT.COLOR_BRIGHT);
        seqDisplay.setText(`sequence: [${selected.join(' > ')}]`);
        if (selected.length === 4) {
          const correct = this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.SERVER_SEQUENCE, [...selected]);
          this.time.delayedCall(300, () => {
            container.destroy(true); this.loopManager.resume();
            if (correct) {
              this.dialogManager.show(['SEQUENCE ACCEPTED.', 'Server rebooting...', 'Algo vai mudar no próximo loop.'], { title: 'SERVER A' });
            } else {
              this.dialogManager.show(['SEQUENCE REJECTED.', 'Tente novamente.'], { title: 'SERVER A' });
            }
          });
        }
      });
    });

    this.add.text(W/2, H/2 + 112, '[ ESC ] Cancel', { fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM }).setOrigin(0.5, 0);
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.once('down', () => { container.destroy(true); this.loopManager.resume(); });
  }

  _interactPanel() {
    this.dialogManager.show(['PANEL — OFFLINE', 'Requires server connection.', 'Reinicie o servidor primeiro.'], { title: 'CONTROL PANEL' });
  }

  _interactFile() {
    this.dialogManager.show([
      'NOTES.txt',
      '─────────────────────────────────',
      '"A porta nunca abre na primeira vez.',
      ' Mas sempre abre na segunda."',
      '',
      '"Delete o que o sistema não quer que você veja."',
      '─────────────────────────────────',
    ], { title: 'NOTES' });
    GameState.addButterflyStep('read_notes');
  }

  _interactEntity() {
    const trust   = GameState.get('entity_trust');
    const deleted = GameState.get('log07_deleted');
    const rebooted= GameState.get('server_rebooted');
    const msgs    = NARRATIVE.entity;

    // Entidade dá hints progressivos e contextuais
    if (trust === 0) {
      this.dialogManager.show(msgs.first_contact, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust === 1 && !deleted) {
      this.dialogManager.show(msgs.hint_log07, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust <= 2 && deleted && !rebooted) {
      this.dialogManager.show(msgs.hint_server, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust <= 3 && deleted && rebooted) {
      this.dialogManager.show(msgs.hint_butterfly, { title: '???' });
      GameState.increment('entity_trust');
    } else {
      this.dialogManager.show(msgs.warning, { title: '???' });
    }
  }

  _interactCamera() {
    const awareness = GameState.get('system_awareness');
    let msgs;
    // Efeito borboleta: quanto mais o sistema sabe de você, mais a câmera revela
    if (awareness >= 3 && GameState.get('log07_deleted') && GameState.get('server_rebooted')) {
      // Pista do morse para BUTTERFLY — só aparece quando tudo foi ativado
      msgs = NARRATIVE.camera.morse;
    } else if (awareness >= 2) {
      msgs = NARRATIVE.camera.aware;
    } else {
      msgs = NARRATIVE.camera.standard;
    }
    this.dialogManager.show(msgs, { title: 'SECURITY CAMERA' });
    GameState.increaseSystemAwareness(1);
  }

  _interactSecretFile() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.HIDDEN_FILE)) {
      this.dialogManager.show(['PROJECT_B.enc — Already accessed.', 'You know what this is.'], { title: 'SECRET FILE' });
      return;
    }
    const W = FORK_CONFIG.WIDTH; const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS; const F = FORK_CONFIG.FONT;

    this.dialogManager.show(['PROJECT_B.enc — ENCRYPTED', 'Decryption key required.', 'Hint: the name of this project. (All caps, one word)'], {
      title: 'SECRET FILE',
      onClose: () => {
        this.loopManager.pause();
        const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);
        const overlay   = this.add.rectangle(0, 0, W, H, 0x000000, 0.8).setOrigin(0, 0);
        const box       = this.add.rectangle(W/2, H/2, 380, 190, C.TERMINAL_BG, 0.98).setStrokeStyle(1, C.ACCENT_DIM);
        const title     = this.add.text(W/2, H/2 - 72, '// DECRYPTION KEY:', { fontFamily: F.FAMILY, fontSize: '12px', color: F.COLOR_SYSTEM }).setOrigin(0.5, 0);
        container.add([overlay, box, title]);

        let input = '';
        const display  = this.add.text(W/2, H/2 - 30, '_', { fontFamily: F.FAMILY, fontSize: '20px', color: F.COLOR_PRIMARY }).setOrigin(0.5, 0);
        const feedback = this.add.text(W/2, H/2 + 22, '', { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_DANGER }).setOrigin(0.5, 0);
        container.add([display, feedback]);

        const closeUI = () => { container.destroy(true); keyH.remove(); this.loopManager.resume(); };
        const keyH = this.input.keyboard.on('keydown', (e) => {
          if (e.keyCode === 27) { closeUI(); return; }
          if (e.keyCode === 8)  { input = input.slice(0, -1); }
          else if (e.key.length === 1 && input.length < 20) { input += e.key.toUpperCase(); }
          display.setText(input || '_');
          if (e.keyCode === 13) {
            const ok = this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.HIDDEN_FILE, input);
            if (ok) {
              closeUI();
              this.dialogManager.show(['DECRYPTION SUCCESSFUL.', 'PROJECT BUTTERFLY', 'Objective: simulate butterfly effect in controlled loop environment.', '', 'Variable: subject behavior.', 'Expected iterations: unlimited.'], { title: 'PROJECT_B.enc' });
            } else { feedback.setText('// INCORRECT KEY'); input = ''; display.setText('_'); }
          }
        });
      },
    });
  }

  // ── HUD ───────────────────────────────────────────────────

  _buildHUD() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const sf = (obj) => { obj.setScrollFactor(0); return obj; };

    sf(this.add.rectangle(0, 0, W, 28, C.HIGHLIGHT, 0.96).setOrigin(0,0).setDepth(90));
    sf(this.add.text(12, 4, 'FORK', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#39ff14', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:12, fill:true } }).setDepth(91));

    this._hudLoop  = sf(this.add.text(W/2, 4, 'LOOP 01', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#33aa33', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:6, fill:true } }).setOrigin(0.5,0).setDepth(91));
    this._hudTimer = sf(this.add.text(W-12, 4, 'TIME: 05:00', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#00ff41', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:10, fill:true } }).setOrigin(1,0).setDepth(91));
    this._timerBar = sf(this.add.rectangle(0, 28, W, 3, C.ACCENT, 1).setOrigin(0,0).setDepth(91));

    sf(this.add.rectangle(0, H-22, W, 22, C.HIGHLIGHT, 0.92).setOrigin(0,0).setDepth(90));
    this._hudSystemMsg  = sf(this.add.text(12, H-14, '> SYSTEM: Awaiting input.', { fontFamily: F.FAMILY, fontSize: '11px', color: '#33aa33' }).setDepth(91));
    this._hudAwareness  = sf(this.add.text(W-12, H-14, '', { fontFamily: F.FAMILY, fontSize: '11px', color: '#ff2244', shadow: { offsetX:0, offsetY:0, color:'#ff0000', blur:8, fill:true } }).setOrigin(1,0).setDepth(91));
  }

  _updateHUD() {
    const loop      = GameState.get('loop_count');
    const time      = this.loopManager.getFormattedTime();
    const progress  = this.loopManager.getProgress();
    const awareness = GameState.get('system_awareness');
    const W         = FORK_CONFIG.WIDTH;
    const F         = FORK_CONFIG.FONT;

    this._hudLoop.setText(`LOOP ${String(loop).padStart(2,'0')}`);
    this._hudTimer.setText(`TIME: ${time}`);
    this._timerBar.setDisplaySize(W * progress, 3);

    if (this.loopManager.isCritical()) {
      this._hudTimer.setColor(F.COLOR_DANGER);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.DANGER);
    } else if (this.loopManager.isWarning()) {
      this._hudTimer.setColor(F.COLOR_WARNING);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.WARNING);
    } else {
      this._hudTimer.setColor(F.COLOR_PRIMARY);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.ACCENT);
    }

    if (awareness > 0) {
      this._hudAwareness.setText(`SYS [${('|').repeat(awareness)}${('·').repeat(5 - awareness)}]`);
    }
  }

  _setSystemMessage(msg) {
    if (this._hudSystemMsg) this._hudSystemMsg.setText(`> SYSTEM: ${msg}`);
  }

  // ── Loop callbacks ────────────────────────────────────────

  _setupLoopCallbacks() {
    this.loopManager
      .on('onWarning',  () => { this._setSystemMessage('WARNING — Loop reset imminent.'); this.dialogManager.showSystem('WARNING: 60 seconds remaining.'); })
      .on('onCritical', () => { this._setSystemMessage('CRITICAL — System resetting soon.'); })
      .on('onReset',    () => { this.scene.start('ResetScene'); });
  }

  _showLoopStart() {
    const loopNum  = GameState.get('loop_count');
    const deleted  = GameState.get('log07_deleted');
    const rebooted = GameState.get('server_rebooted');

    let msgs = NARRATIVE.loopStart(loopNum);

    // Adiciona reações específicas às ações do loop anterior
    if (loopNum > 1) {
      if (deleted && rebooted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.both);
      } else if (deleted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.log07_deleted);
      } else if (rebooted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.server_rebooted);
      }
    }

    this.time.delayedCall(400, () => {
      this.dialogManager.show(msgs, { title: `LOOP ${String(loopNum).padStart(2,'0')}` });
    });
  }
}
