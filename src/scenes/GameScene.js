// ============================================================
// FORK — GameScene.js  [FIXED]
// Cena principal: mapa, HUD, sistemas, gameplay
// ============================================================

class GameScene extends Phaser.Scene {

  constructor() { super({ key: 'GameScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Sistemas
    this.loopManager   = new LoopManager(this);
    this.puzzleManager = new PuzzleManager();
    this.dialogManager = new DialogManager(this);
    this.finalManager  = new FinalManager(this);

    // Mapa
    this._wallRects = []; // FIX: guardar rects de parede para colisão
    this._buildMap();

    // Objetos interativos
    this._objects = [];
    this._buildObjects();

    // Player
    this.player = new Player(this, 200, 300);

    // FIX: colisão com array de rects em vez de staticGroup com staticImage
    this._wallRects.forEach(wall => {
      this.physics.add.collider(this.player.getPhysicsBody(), wall);
    });

    // HUD — criado por último para ficar acima de tudo
    this._buildHUD();

    // Câmera
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player.getPhysicsBody(), true, 0.1, 0.1);

    // Inicia loop
    this._setupLoopCallbacks();
    this.loopManager.start();

    // Mensagem de início
    this._showLoopStart();

    // FIX: _handleClick agora existe — point-and-click em objetos
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
    const gfx = this.add.graphics().setDepth(0);

    // Chão base
    gfx.fillStyle(C.BG_ALT, 1);
    gfx.fillRect(0, 0, W, H);

    // Grid
    gfx.lineStyle(1, C.GRID, 0.25);
    for (let x = 0; x < W; x += 32) { gfx.moveTo(x, 0).lineTo(x, H); }
    for (let y = 0; y < H; y += 32) { gfx.moveTo(0, y).lineTo(W, y); }
    gfx.strokePath();

    // Salas
    this._drawRoom(gfx, 60,  50,  840, 540);        // lab principal
    this._drawRoom(gfx, 660, 50,  240, 200, true);  // sala de controle
    this._drawRoom(gfx, 60,  390, 220, 200, true);  // armazenamento

    // Marcações de chão
    gfx.lineStyle(1, C.ACCENT_DIM, 0.10);
    for (let x = 80; x < 900; x += 80) { gfx.moveTo(x, 70).lineTo(x, 570); }
    for (let y = 70; y < 580; y += 80) { gfx.moveTo(80, y).lineTo(880, y); }
    gfx.strokePath();

    // Labels
    this.add.text(120, 62,  'MAIN LAB',     { fontFamily:'monospace', fontSize:'9px', color:'#1a3322' });
    this.add.text(672, 62,  'CONTROL ROOM', { fontFamily:'monospace', fontSize:'9px', color:'#1a3322' });
    this.add.text(72,  400, 'STORAGE',      { fontFamily:'monospace', fontSize:'9px', color:'#1a3322' });
  }

  _drawRoom(gfx, x, y, w, h, isSecondary = false) {
    const C         = FORK_CONFIG.COLORS;
    const wallColor = isSecondary ? C.ACCENT_DIM : C.ACCENT;
    const wallAlpha = isSecondary ? 0.3 : 0.5;
    const thick     = 12;

    // Chão da sala
    gfx.fillStyle(isSecondary ? C.BG : C.BG_ALT, 1);
    gfx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Borda visual
    gfx.lineStyle(2, wallColor, wallAlpha);
    gfx.strokeRect(x, y, w, h);

    // FIX: paredes como rectangles com physics.add.existing (static)
    // Deixamos abertura em uma parede para o jogador entrar nas salas secundárias
    const wallDefs = [
      { wx: x + w/2,        wy: y,            ww: w,     wh: thick }, // topo
      { wx: x + w/2,        wy: y + h,        ww: w,     wh: thick }, // base
      { wx: x,              wy: y + h/2,      ww: thick, wh: h     }, // esquerda
      { wx: x + w,          wy: y + h/2,      ww: thick, wh: h     }, // direita
    ];

    wallDefs.forEach(({ wx, wy, ww, wh }) => {
      const rect = this.add.rectangle(wx, wy, ww, wh, 0x000000, 0);
      this.physics.add.existing(rect, true); // static
      this._wallRects.push(rect);
    });
  }

  // ── Objetos interativos ───────────────────────────────────

  _buildObjects() {
    // Terminal principal
    const terminal = new Terminal(this, 180, 220, {
      id:            'terminal_main',
      label:         'TERMINAL',
      puzzleManager: this.puzzleManager,
      dialogManager: this.dialogManager,
      puzzleId:      FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
    });
    this._objects.push(terminal);

    // Porta de segurança
    const door = new InteractiveObject(this, 878, 300, {
      id:    'door_security',
      type:  FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: 'SECURITY DOOR',
      width: 16, height: 60,
      color: GameState.get('door_unlocked') ? FORK_CONFIG.COLORS.ACCENT : FORK_CONFIG.COLORS.DANGER,
      onInteract: (obj) => this._interactDoor(obj),
    });
    this._objects.push(door);

    // Servidor
    const server = new InteractiveObject(this, 750, 130, {
      id:    'server_main',
      type:  FORK_CONFIG.OBJECT_TYPES.SERVER,
      label: 'SERVER A',
      width: 36, height: 52,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactServer(),
    });
    this._objects.push(server);

    // Painel
    const panel = new InteractiveObject(this, 820, 130, {
      id:    'panel_sequence',
      type:  FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'PANEL',
      width: 28, height: 28,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactPanel(),
    });
    this._objects.push(panel);

    // Arquivo de notas
    const file = new InteractiveObject(this, 140, 460, {
      id:    'file_notes',
      type:  FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'NOTES',
      width: 20, height: 26,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactFile(),
    });
    this._objects.push(file);

    // Entidade
    const entity = new InteractiveObject(this, 160, 510, {
      id:    'entity',
      type:  FORK_CONFIG.OBJECT_TYPES.OBJECT,
      label: '???',
      width: 16, height: 16,
      color: 0x223322,
      onInteract: () => this._interactEntity(),
    });
    this._objects.push(entity);

    // Câmera de segurança
    const cam = new InteractiveObject(this, 855, 70, {
      id:    'camera_01',
      type:  FORK_CONFIG.OBJECT_TYPES.CAMERA,
      label: 'CAM-01',
      width: 20, height: 14,
      color: FORK_CONFIG.COLORS.DANGER,
      onInteract: () => this._interactCamera(),
    });
    this._objects.push(cam);

    // Arquivo secreto (só aparece no loop correto)
    if (GameState.get('server_rebooted') && GameState.get('log07_deleted')) {
      const secret = new InteractiveObject(this, 700, 490, {
        id:    'secret_file',
        type:  FORK_CONFIG.OBJECT_TYPES.FILE,
        label: 'PROJECT_B.enc',
        width: 22, height: 26,
        color: 0x004422,
        onInteract: () => this._interactSecretFile(),
      });
      this._objects.push(secret);
    }
  }

  // ── Interações ────────────────────────────────────────────

  // FIX: _handleClick implementado — detecta objeto mais próximo do clique
  _handleClick(ptr) {
    if (GameState.volatile.dialog_open || GameState.volatile.terminal_open) return;

    // Converte coordenadas de tela para mundo
    const worldX = ptr.worldX;
    const worldY = ptr.worldY;

    let nearest  = null;
    let minDist  = FORK_CONFIG.INTERACT_RANGE;

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
      if (ending) {
        this.finalManager.trigger(ending);
      } else {
        this.dialogManager.show([
          'ACCESS GRANTED.',
          'Mas algo te segura.',
          'Ainda não é hora.',
        ], { title: 'SECURITY DOOR' });
      }
    } else {
      this._showCodePuzzle();
    }
  }

  _showCodePuzzle() {
    if (!GameState.get('log07_deleted')) {
      this.dialogManager.show([
        'ACCESS DENIED.',
        'Código de acesso necessário.',
        'Formato: XXXX',
        'Talvez haja uma pista em algum arquivo.',
      ], { title: 'SECURITY DOOR' });
      return;
    }
    this._showCodeInput();
  }

  _showCodeInput() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    // Pausa o loop enquanto o puzzle está aberto
    this.loopManager.pause();

    const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);
    const box     = this.add.rectangle(W/2, H/2, 320, 200, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, C.ACCENT_DIM);
    const title   = this.add.text(W/2, H/2 - 74, 'SECURITY DOOR — ACCESS CODE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0);
    const prompt  = this.add.text(W/2, H/2 - 48, 'Enter 4-digit code:', {
      fontFamily: 'monospace', fontSize: '13px', color: '#88ffdd',
    }).setOrigin(0.5, 0);

    let code = '';
    const codeDisplay = this.add.text(W/2, H/2 - 14, '_ _ _ _', {
      fontFamily: 'monospace', fontSize: '28px', color: '#00ffe0', letterSpacing: 6,
    }).setOrigin(0.5, 0);

    const feedback = this.add.text(W/2, H/2 + 38, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff2244',
    }).setOrigin(0.5, 0);

    const hint = this.add.text(W/2, H/2 + 60, '[ ESC ] Cancel', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1a3322',
    }).setOrigin(0.5, 0);

    container.add([overlay, box, title, prompt, codeDisplay, feedback, hint]);

    const updateDisplay = () => {
      const shown = code.padEnd(4, '_').split('').join(' ');
      codeDisplay.setText(shown);
    };

    const closeUI = () => {
      container.destroy(true);
      keyHandler.remove();
      this.loopManager.resume();
    };

    const keyHandler = this.input.keyboard.on('keydown', (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        closeUI(); return;
      }
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
        code = code.slice(0, -1);
        updateDisplay(); return;
      }
      if (e.key >= '0' && e.key <= '9' && code.length < 4) {
        code += e.key;
        updateDisplay();
      }
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER && code.length === 4) {
        const correct = this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.DOOR_CODE, code);
        if (correct) {
          feedback.setColor('#00ffe0').setText('ACCESS GRANTED');
          this.time.delayedCall(700, () => {
            closeUI();
            this.dialogManager.show([
              'DOOR UNLOCKED.',
              'Uma ação anterior abriu esta porta.',
              'O sistema notou.',
            ], { title: 'SECURITY DOOR' });
          });
        } else {
          feedback.setText('ACCESS DENIED — INCORRECT CODE');
          code = '';
          updateDisplay();
          GameState.increaseSystemAwareness(1);
        }
      }
    });
  }

  _interactServer() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.SERVER_SEQUENCE)) {
      this.dialogManager.show([
        'SERVER: REBOOTED',
        'Status: Nominal.',
        GameState.get('log07_deleted')
          ? 'LOG_07: NOT FOUND — anomaly persists.'
          : 'All logs intact.',
      ], { title: 'SERVER A' });
      return;
    }
    this._showSequencePuzzle();
  }

  _showSequencePuzzle() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    this.loopManager.pause();

    const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);
    const box     = this.add.rectangle(W/2, H/2, 400, 280, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, C.ACCENT_DIM);

    this.add.text(W/2, H/2 - 114, 'SERVER SEQUENCE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0);
    this.add.text(W/2, H/2 - 90, 'Activate panels in the correct order:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#88ffdd',
    }).setOrigin(0.5, 0);

    container.add([overlay, box]);

    const panels   = ['A', 'B', 'C', 'D'];
    const selected = [];

    const seqDisplay = this.add.text(W/2, H/2 + 50, 'Sequence: [ ]', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0);
    container.add(seqDisplay);

    const feedback = this.add.text(W/2, H/2 + 76, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff2244',
    }).setOrigin(0.5, 0);
    container.add(feedback);

    panels.forEach((p, i) => {
      const bx = W/2 - 90 + i * 60;
      const by = H/2 - 20;

      const btn = this.add.rectangle(bx, by, 44, 44, C.ACCENT_DIM, 0.4)
        .setStrokeStyle(1, C.ACCENT_DIM).setInteractive({ useHandCursor: true });

      const lbl = this.add.text(bx, by, p, {
        fontFamily: 'monospace', fontSize: '18px', color: '#00ffe0',
      }).setOrigin(0.5, 0.5);

      container.add([btn, lbl]);

      btn.on('pointerover',  () => btn.setFillStyle(C.ACCENT, 0.3));
      btn.on('pointerout',   () => {
        if (!selected.includes(p)) btn.setFillStyle(C.ACCENT_DIM, 0.4);
      });
      btn.on('pointerdown',  () => {
        if (selected.includes(p)) return;
        selected.push(p);
        btn.setFillStyle(C.ACCENT, 0.6);
        seqDisplay.setText(`Sequence: [ ${selected.join(' → ')} ]`);

        if (selected.length === 4) {
          const correct = this.puzzleManager.checkAnswer(
            FORK_CONFIG.PUZZLES.SERVER_SEQUENCE, [...selected]
          );
          this.time.delayedCall(300, () => {
            container.destroy(true);
            this.loopManager.resume();
            if (correct) {
              this.dialogManager.show([
                'SEQUENCE ACCEPTED.',
                'Server rebooting...',
                'SYSTEM NOTE: Modification logged.',
                'Algo vai mudar no próximo loop.',
              ], { title: 'SERVER A' });
            } else {
              this.dialogManager.show([
                'SEQUENCE REJECTED.',
                'Tente novamente.',
              ], { title: 'SERVER A' });
            }
          });
        }
      });
    });

    // ESC cancela
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.once('down', () => {
      container.destroy(true);
      this.loopManager.resume();
    });

    this.add.text(W/2, H/2 + 108, '[ ESC ] Cancel', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1a3322',
    }).setOrigin(0.5, 0);
  }

  _interactPanel() {
    this.dialogManager.show([
      'PANEL — OFFLINE',
      'Requires server connection.',
      'Reinicie o servidor primeiro.',
    ], { title: 'CONTROL PANEL' });
  }

  _interactFile() {
    this.dialogManager.show([
      'NOTES — HAND WRITTEN',
      '─────────────────────────────',
      '"A porta nunca abre na primeira vez.',
      ' Mas sempre abre na segunda."',
      '',
      '"Delete o que o sistema não quer',
      ' que você veja."',
      '─────────────────────────────',
    ], { title: 'NOTES' });
    GameState.addButterflyStep('read_notes');
  }

  _interactEntity() {
    const trust = GameState.get('entity_trust');
    const msgs  = NARRATIVE.entity;

    if      (trust === 0) { this.dialogManager.show(msgs.first_contact, { title: '???' }); GameState.increment('entity_trust'); }
    else if (trust === 1) { this.dialogManager.show(msgs.hint_log07,    { title: '???' }); GameState.increment('entity_trust'); }
    else if (trust === 2) { this.dialogManager.show(msgs.hint_butterfly, { title: '???' }); GameState.increment('entity_trust'); }
    else                  { this.dialogManager.show(msgs.warning,        { title: '???' }); }
  }

  _interactCamera() {
    const awareness = GameState.get('system_awareness');
    this.dialogManager.show([
      'CAMERA-01  //  ACTIVE',
      `Monitoring: ${awareness >= 3 ? 'ENHANCED' : 'STANDARD'}`,
      awareness >= 2 ? 'The system is watching you closely.' : 'Recording...',
    ], { title: 'SECURITY CAMERA' });
    GameState.increaseSystemAwareness(1);
  }

  _interactSecretFile() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.HIDDEN_FILE)) {
      this.dialogManager.show([
        'PROJECT_B.enc — Already accessed.',
        'You know what this is.',
      ], { title: 'SECRET FILE' });
      return;
    }

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    this.dialogManager.show([
      'PROJECT_B.enc — ENCRYPTED',
      'Decryption key required.',
      'Hint: the name of this project.',
      '(All caps, one word)',
    ], {
      title: 'SECRET FILE',
      onClose: () => {
        this.loopManager.pause();
        const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

        const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);
        const box     = this.add.rectangle(W/2, H/2, 360, 180, C.TERMINAL_BG, 0.98)
          .setStrokeStyle(1, C.ACCENT_DIM);
        const title   = this.add.text(W/2, H/2 - 66, 'DECRYPTION KEY:', {
          fontFamily: 'monospace', fontSize: '12px', color: '#88ffdd',
        }).setOrigin(0.5, 0);

        container.add([overlay, box, title]);

        let input = '';
        const display  = this.add.text(W/2, H/2 - 28, '_', {
          fontFamily: 'monospace', fontSize: '18px', color: '#00ffe0',
        }).setOrigin(0.5, 0);
        const feedback = this.add.text(W/2, H/2 + 20, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ff2244',
        }).setOrigin(0.5, 0);
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
              this.dialogManager.show([
                'DECRYPTION SUCCESSFUL.',
                'PROJECT BUTTERFLY',
                'Objective: simulate butterfly effect',
                'in controlled loop environment.',
                '',
                'Variable: subject behavior.',
                'Expected iterations: unlimited.',
              ], { title: 'PROJECT_B.enc' });
            } else {
              feedback.setText('INCORRECT KEY');
              input = '';
              display.setText('_');
            }
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

    // FIX: cada elemento do HUD tem setScrollFactor(0) individualmente
    const sf = (obj) => { obj.setScrollFactor(0); return obj; };

    const topBar  = sf(this.add.rectangle(0, 0, W, 28, C.HIGHLIGHT, 0.95).setOrigin(0,0).setDepth(90));
    const forkLbl = sf(this.add.text(12, 7, 'FORK', { fontFamily:'monospace', fontSize:'11px', color:'#00ffe0' }).setDepth(91));

    this._hudLoop  = sf(this.add.text(W/2, 7, 'LOOP 01', {
      fontFamily:'monospace', fontSize:'11px', color:'#446655',
    }).setOrigin(0.5, 0).setDepth(91));

    this._hudTimer = sf(this.add.text(W - 12, 7, 'TIME: 05:00', {
      fontFamily:'monospace', fontSize:'11px', color:'#00ffe0',
    }).setOrigin(1, 0).setDepth(91));

    this._timerBar = sf(this.add.rectangle(0, 28, W, 3, C.ACCENT, 1).setOrigin(0,0).setDepth(91));

    const botBar = sf(this.add.rectangle(0, H - 22, W, 22, C.HIGHLIGHT, 0.9).setOrigin(0,0).setDepth(90));

    this._hudSystemMsg = sf(this.add.text(12, H - 15, 'SYSTEM: Awaiting input.', {
      fontFamily:'monospace', fontSize:'10px', color:'#446655',
    }).setDepth(91));

    this._hudAwareness = sf(this.add.text(W - 12, H - 15, '', {
      fontFamily:'monospace', fontSize:'10px', color:'#ff2244',
    }).setOrigin(1, 0).setDepth(91));
  }

  _updateHUD() {
    const loop      = GameState.get('loop_count');
    const time      = this.loopManager.getFormattedTime();
    const progress  = this.loopManager.getProgress();
    const awareness = GameState.get('system_awareness');
    const W         = FORK_CONFIG.WIDTH;

    this._hudLoop.setText(`LOOP ${String(loop).padStart(2, '0')}`);
    this._hudTimer.setText(`TIME: ${time}`);
    this._timerBar.setDisplaySize(W * progress, 3);

    if (this.loopManager.isCritical()) {
      this._hudTimer.setColor('#ff2244');
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.DANGER);
    } else if (this.loopManager.isWarning()) {
      this._hudTimer.setColor('#ffaa00');
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.WARNING);
    } else {
      this._hudTimer.setColor('#00ffe0');
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.ACCENT);
    }

    if (awareness > 0) {
      const bars = '|'.repeat(awareness) + '·'.repeat(5 - awareness);
      this._hudAwareness.setText(`SYS [${bars}]`);
    }
  }

  _setSystemMessage(msg) {
    if (this._hudSystemMsg) this._hudSystemMsg.setText(`SYSTEM: ${msg}`);
  }

  // ── Loop callbacks ────────────────────────────────────────

  _setupLoopCallbacks() {
    this.loopManager
      .on('onWarning', () => {
        this._setSystemMessage('WARNING: Loop reset imminent.');
        this.dialogManager.showSystem('WARNING: 60 seconds remaining.');
      })
      .on('onCritical', () => {
        this._setSystemMessage('CRITICAL: System resetting soon.');
      })
      .on('onReset', () => {
        this.scene.start('ResetScene');
      });
  }

  _showLoopStart() {
    const loopNum = GameState.get('loop_count');
    const msgs    = NARRATIVE.loopStart(loopNum);

    if (loopNum > 1) {
      if (GameState.get('log07_deleted'))   msgs.push(...NARRATIVE.systemReactions.log07_deleted);
      if (GameState.get('server_rebooted')) msgs.push(...NARRATIVE.systemReactions.server_rebooted);
    }

    this.time.delayedCall(400, () => {
      this.dialogManager.show(msgs, { title: `LOOP ${String(loopNum).padStart(2, '0')}` });
    });
  }
}
