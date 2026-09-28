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
    this.uiManager     = new UIManager(this, this.loopManager);
    this.animationManager = new AnimationManager(this);
    window.AnimationManagerInstance = this.animationManager;

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
    if (this.loopManager.isCritical()) {
      this.animationManager.flash('critical');
    }
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

    // Fase 4 — o espaço do Observador aparece somente após a memória ser desbloqueada.
    if (GameState.get('observer_unlocked')) {
      const memory = new InteractiveObject(this, 500, 480, {
        id: 'memory_panel', type: FORK_CONFIG.OBJECT_TYPES.PANEL,
        label: 'MEMORY PANEL', width: 30, height: 30,
        color: FORK_CONFIG.COLORS.WARNING,
        onInteract: () => this._interactMemoryPanel(),
      });
      this._objects.push(memory);

      const observer = new InteractiveObject(this, 720, 350, {
        id: 'observer_terminal', type: FORK_CONFIG.OBJECT_TYPES.TERMINAL,
        label: 'OBSERVER', width: 34, height: 30,
        color: FORK_CONFIG.COLORS.ACCENT_BRIGHT,
        onInteract: () => this._interactObserver(),
      });
      this._objects.push(observer);

      const identity = new InteractiveObject(this, 620, 350, {
        id: 'identity_terminal', type: FORK_CONFIG.OBJECT_TYPES.FILE,
        label: 'IDENTITY', width: 30, height: 26,
        color: FORK_CONFIG.COLORS.WARNING,
        onInteract: () => this._interactIdentity(),
      });
      this._objects.push(identity);
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
    this.uiManager.openCodeInput({
      title: '// SECURITY DOOR — ACCESS CODE',
      length: 4,
      validator: value => this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.DOOR_CODE, value),
      onSuccess: () => {
        if (window.AudioManagerInstance) window.AudioManagerInstance.playDoor();
        this.animationManager.doorOpen(878, 300);
        this._setSystemMessage('DOOR UNLOCKED — proceed with caution');
        this.time.delayedCall(450, () => {
          this.dialogManager.show([
            'ACCESS GRANTED.',
            'A porta abriu porque você alterou um loop anterior.',
            'O sistema registrou a mudança.',
            'Há algo além desta porta que ele não quer que você veja.',
          ], { title: 'SECURITY DOOR' });
        });
      },
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
    this.uiManager.openSequence({
      title: '// SERVER SEQUENCE',
      items: ['A', 'B', 'C', 'D'],
      validator: answer => this.puzzleManager.checkAnswer(
        FORK_CONFIG.PUZZLES.SERVER_SEQUENCE,
        answer
      ),
      onSuccess: () => {
        this.animationManager.flash('success');
        this._setSystemMessage('SERVER — REBOOTED');
        this.dialogManager.show([
          'SEQUENCE ACCEPTED.',
          'SERVER A REBOOTING...',
          'A pasta /restricted agora existe.',
          'No próximo loop, algo novo estará esperando.',
        ], { title: 'SERVER A' });
      },
    });
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
      this.dialogManager.show([
        'PROJECT_B.enc — ALREADY DECRYPTED.',
        'Você encontrou o experimento.',
        'Mas ainda não encontrou quem o observa.',
      ], { title: 'PROJECT_B.enc' });
      return;
    }

    this.dialogManager.show([
      'PROJECT_B.enc — ENCRYPTED',
      'Decryption key required.',
      'Hint: the codename of the project.',
    ], {
      title: 'SECRET FILE',
      onClose: () => this.uiManager.openWordInput({
        title: '// DECRYPTION KEY',
        maxLength: 20,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.HIDDEN_FILE,
          value
        ),
        onSuccess: () => {
          this.animationManager.flash('success');
          this._setSystemMessage('PROJECT BUTTERFLY — FILE DECRYPTED');
          this.dialogManager.show([
            'DECRYPTION SUCCESSFUL.',
            'PROJECT BUTTERFLY',
            'The simulation was built to study consequences.',
            'A new directory appeared: /observer/',
          ], { title: 'PROJECT_B.enc' });
        },
      }),
    });
  }

  _interactMemoryPanel() {
    if (GameState.get('memory_code_found')) {
      this.dialogManager.show([
        'MEMORY PANEL — UNLOCKED.',
        'The observer room is accessible.',
        '// Someone has been watching every loop.',
      ], { title: 'MEMORY PANEL' });
      return;
    }

    this.dialogManager.show([
      'MEMORY PANEL',
      'A four-digit fragment is burned into the display.',
      '4217',
      '// It is not a password. It is a memory.',
    ], {
      title: 'MEMORY PANEL',
      onClose: () => this.uiManager.openCodeInput({
        title: '// MEMORY FRAGMENT',
        length: 4,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.MEMORY_CODE,
          value
        ),
        onSuccess: () => {
          this._setSystemMessage('OBSERVER ROOM — ACCESS GRANTED');
          this.dialogManager.show([
            'MEMORY ACCEPTED.',
            'The system did not generate this memory.',
            'Something else left it for you.',
          ], { title: 'OBSERVER ACCESS' });
        },
      }),
    });
  }

  _interactObserver() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE)) {
      this.dialogManager.show([
        'OBSERVER — COMPLETE.',
        'The sequence has already been executed.',
        'One final fragment remains.',
      ], { title: 'OBSERVER' });
      return;
    }

    this.dialogManager.show([
      'OBSERVER ROOM',
      'Three controls appear on the console:',
      'PAUSE / WATCH / RELEASE',
      '// Do not choose them in the order the system suggests.',
    ], {
      title: 'OBSERVER',
      onClose: () => this.uiManager.openSequence({
        title: '// OBSERVER PROTOCOL',
        items: ['PAUSE', 'WATCH', 'RELEASE'],
        validator: answer => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE,
          answer
        ),
        onSuccess: () => {
          this.dialogManager.show([
            'OBSERVER PROTOCOL ACCEPTED.',
            'The system was not watching the player.',
            'It was watching its own predictions.',
          ], { title: 'OBSERVER' });
          if (!GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.BUTTERFLY)) {
            this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.BUTTERFLY, []);
          }
        },
      }),
    });
  }

  _interactIdentity() {
    if (GameState.get('identity_fragment_found')) {
      this.dialogManager.show([
        'IDENTITY FRAGMENT — ALREADY EXTRACTED.',
        'SUBJECT: YOU.',
        '// The system predicted your escape attempt before you made it.',
      ], { title: 'IDENTITY' });
      return;
    }

    this.dialogManager.show([
      'IDENTITY FRAGMENT',
      'A label appears on the monitor:',
      'SUBJECT',
      '// The word feels familiar.',
      '// Maybe because the system has used it for every loop.',
    ], {
      title: 'IDENTITY',
      onClose: () => this.uiManager.openWordInput({
        title: '// IDENTITY VERIFICATION',
        maxLength: 16,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.IDENTITY_WORD,
          value
        ),
        onSuccess: () => {
          this.animationManager.glitch(700, 12);
          this._setSystemMessage('IDENTITY CONFIRMED — SYSTEM PREDICTION EXPOSED');
          this.dialogManager.show([
            'IDENTITY CONFIRMED.',
            'You were not an unknown user.',
            'You were the subject the entire time.',
            'Now ask the final question: who is controlling whom?',
          ], { title: 'IDENTITY' });
        },
      }),
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
