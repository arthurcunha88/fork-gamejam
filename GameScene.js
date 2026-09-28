// ============================================================
// FORK — GameScene.js
// Cena principal: mapa, HUD, sistemas, gameplay
// ============================================================

class GameScene extends Phaser.Scene {

  constructor() { super({ key: 'GameScene' }); }

  // ── Lifecycle ─────────────────────────────────────────────

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Sistemas
    this.loopManager   = new LoopManager(this);
    this.puzzleManager = new PuzzleManager();
    this.dialogManager = new DialogManager(this);
    this.finalManager  = new FinalManager(this);

    // Mapa
    this._buildMap();

    // Objetos interativos
    this._objects = [];
    this._buildObjects();

    // Player
    this.player = new Player(this, 200, 300);

    // Colisão player ↔ paredes
    this.physics.add.collider(this.player.getPhysicsBody(), this._wallGroup);

    // HUD (por cima de tudo)
    this._buildHUD();

    // Câmera
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player.getPhysicsBody(), true, 0.1, 0.1);

    // Inicia loop
    this._setupLoopCallbacks();
    this.loopManager.start();

    // Mensagem de início do loop
    this._showLoopStart();

    // Click em objeto (point-and-click)
    this.input.on('pointerdown', (ptr) => this._handleClick(ptr));
  }

  update(time, delta) {
    if (!this.player) return;

    // Atualiza sistemas
    this.loopManager.update(delta);
    this.dialogManager.update();
    this.finalManager.check();

    // Atualiza player
    this.player.update(this._objects);

    // Atualiza objetos interativos
    this._objects.forEach(obj => obj.update(this.player.x, this.player.y));

    // Atualiza HUD
    this._updateHUD();
  }

  // ── Mapa ──────────────────────────────────────────────────

  _buildMap() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const gfx = this.add.graphics().setDepth(0);

    // Chão
    gfx.fillStyle(C.BG_ALT, 1);
    gfx.fillRect(0, 0, W, H);

    // Grid de chão
    gfx.lineStyle(1, C.GRID, 0.25);
    for (let x = 0; x < W; x += 32) { gfx.moveTo(x, 0).lineTo(x, H); }
    for (let y = 0; y < H; y += 32) { gfx.moveTo(0, y).lineTo(W, y); }
    gfx.strokePath();

    // ── Sala principal ──────────────────────────────────────
    // Paredes externas
    this._wallGroup = this.physics.add.staticGroup();
    this._drawRoom(gfx, 60, 50, 840, 540); // x, y, w, h

    // ── Sala de controle (canto superior direito) ───────────
    this._drawRoom(gfx, 660, 50, 240, 200, true);

    // ── Área de armazenamento (canto inferior esquerdo) ────
    this._drawRoom(gfx, 60, 390, 220, 200, true);

    // Decorações de chão — marcações digitais
    gfx.lineStyle(1, C.ACCENT_DIM, 0.12);
    for (let x = 80; x < 900; x += 80) {
      gfx.moveTo(x, 70).lineTo(x, 570);
    }
    for (let y = 70; y < 580; y += 80) {
      gfx.moveTo(80, y).lineTo(880, y);
    }
    gfx.strokePath();

    // Labels das salas
    this.add.text(120, 60, 'MAIN LAB', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a3322',
    });
    this.add.text(672, 60, 'CONTROL ROOM', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a3322',
    });
    this.add.text(72, 400, 'STORAGE', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a3322',
    });
  }

  /**
   * Desenha uma sala e adiciona paredes ao grupo de física.
   * @param {boolean} isSecondary — salas secundárias têm cor diferente
   */
  _drawRoom(gfx, x, y, w, h, isSecondary = false) {
    const C = FORK_CONFIG.COLORS;
    const wallColor = isSecondary ? C.ACCENT_DIM : C.ACCENT;
    const wallAlpha = isSecondary ? 0.3 : 0.5;

    // Chão da sala
    gfx.fillStyle(isSecondary ? C.BG : C.BG_ALT, 1);
    gfx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Paredes
    gfx.lineStyle(2, wallColor, wallAlpha);
    gfx.strokeRect(x, y, w, h);

    const thick = 10;

    // Paredes físicas (invisíveis, apenas colisão)
    const walls = [
      { rx: x,         ry: y,         rw: w,     rh: thick },  // topo
      { rx: x,         ry: y + h,     rw: w,     rh: thick },  // base
      { rx: x,         ry: y,         rw: thick, rh: h     },  // esquerda
      { rx: x + w,     ry: y,         rw: thick, rh: h     },  // direita
    ];

    walls.forEach(({ rx, ry, rw, rh }) => {
      const wall = this.physics.add.staticImage(rx + rw / 2, ry + rh / 2)
        .setDisplaySize(rw, rh)
        .refreshBody();
      wall.setVisible(false);
      this._wallGroup.add(wall);
    });
  }

  // ── Objetos interativos ───────────────────────────────────

  _buildObjects() {
    // ── Terminal principal (centro-esquerda) ────────────────
    const terminal = new Terminal(this, 180, 220, {
      id:            'terminal_main',
      label:         'TERMINAL',
      puzzleManager: this.puzzleManager,
      dialogManager: this.dialogManager,
      puzzleId:      FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
    });
    this._objects.push(terminal);

    // ── Porta de segurança (parede direita) ─────────────────
    const door = new InteractiveObject(this, 840, 300, {
      id:    'door_security',
      type:  FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: 'SECURITY DOOR',
      width: 20, height: 60,
      color: GameState.get('door_unlocked')
        ? FORK_CONFIG.COLORS.ACCENT
        : FORK_CONFIG.COLORS.DANGER,
      onInteract: (obj) => this._interactDoor(obj),
    });
    this._objects.push(door);

    // ── Servidor (sala de controle) ─────────────────────────
    const server = new InteractiveObject(this, 750, 130, {
      id:    'server_main',
      type:  FORK_CONFIG.OBJECT_TYPES.SERVER,
      label: 'SERVER A',
      width: 36, height: 52,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactServer(),
    });
    this._objects.push(server);

    // ── Painel de sequência (sala de controle) ──────────────
    const panel = new InteractiveObject(this, 820, 130, {
      id:    'panel_sequence',
      type:  FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'PANEL',
      width: 28, height: 28,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactPanel(),
    });
    this._objects.push(panel);

    // ── Arquivo na área de armazenamento ────────────────────
    const file = new InteractiveObject(this, 140, 450, {
      id:    'file_notes',
      type:  FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'NOTES',
      width: 20, height: 26,
      color: FORK_CONFIG.COLORS.ACCENT_DIM,
      onInteract: () => this._interactFile(),
    });
    this._objects.push(file);

    // ── Entidade secundária (canto escuro) ──────────────────
    const entity = new InteractiveObject(this, 200, 490, {
      id:    'entity',
      type:  FORK_CONFIG.OBJECT_TYPES.OBJECT,
      label: '???',
      width: 16, height: 16,
      color: 0x223322,
      onInteract: () => this._interactEntity(),
    });
    this._objects.push(entity);

    // ── Câmera de segurança ─────────────────────────────────
    const camera = new InteractiveObject(this, 860, 80, {
      id:    'camera_01',
      type:  FORK_CONFIG.OBJECT_TYPES.CAMERA,
      label: 'CAM-01',
      width: 20, height: 14,
      color: FORK_CONFIG.COLORS.DANGER,
      onInteract: () => this._interactCamera(),
    });
    this._objects.push(camera);

    // ── Objeto secreto (só aparece se server_rebooted E log07_deleted) ──
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

  // ── Interações específicas ────────────────────────────────

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
      // Mostra puzzle de código
      this._showCodePuzzle();
    }
  }

  _showCodePuzzle() {
    if (!this.puzzleManager.isAvailable(FORK_CONFIG.PUZZLES.DOOR_CODE)) {
      if (GameState.get('log07_deleted')) {
        this._showCodeInput();
      } else {
        this.dialogManager.show([
          'ACCESS DENIED.',
          'Código de acesso necessário.',
          'Formato: XXXX',
        ], { title: 'SECURITY DOOR' });
      }
      return;
    }
    this._showCodeInput();
  }

  _showCodeInput() {
    // UI simples de input de código
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75)
      .setOrigin(0, 0).setDepth(150).setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 320, 180, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, C.ACCENT_DIM).setDepth(151);

    this.add.text(W / 2, H / 2 - 60, 'SECURITY DOOR', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0).setDepth(152);

    this.add.text(W / 2, H / 2 - 38, 'Enter access code:', {
      fontFamily: 'monospace', fontSize: '13px', color: '#88ffdd',
    }).setOrigin(0.5, 0).setDepth(152);

    let code = '';
    const codeDisplay = this.add.text(W / 2, H / 2 - 6, '_ _ _ _', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ffe0',
    }).setOrigin(0.5, 0).setDepth(152);

    const feedback = this.add.text(W / 2, H / 2 + 36, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff2244',
    }).setOrigin(0.5, 0).setDepth(152);

    const closeUI = () => {
      overlay.destroy(); box.destroy();
      keyHandler.remove();
    };

    const updateDisplay = () => {
      const shown = code.padEnd(4, '_').split('').join(' ');
      codeDisplay.setText(shown);
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
          this.time.delayedCall(800, () => {
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

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75)
      .setOrigin(0, 0).setDepth(150).setInteractive();

    this.add.rectangle(W / 2, H / 2, 380, 260, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, C.ACCENT_DIM).setDepth(151);

    this.add.text(W / 2, H / 2 - 100, 'SERVER SEQUENCE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0).setDepth(152);

    this.add.text(W / 2, H / 2 - 78, 'Activate panels in correct order:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#88ffdd',
    }).setOrigin(0.5, 0).setDepth(152);

    const panels = ['A', 'B', 'C', 'D'];
    const selected = [];
    const btnRefs = {};

    panels.forEach((p, i) => {
      const bx = W / 2 - 90 + i * 60;
      const by = H / 2 - 30;

      const btn = this.add.rectangle(bx, by, 44, 44, C.ACCENT_DIM, 0.5)
        .setStrokeStyle(1, C.ACCENT_DIM).setDepth(152).setInteractive({ useHandCursor: true });

      this.add.text(bx, by, p, {
        fontFamily: 'monospace', fontSize: '16px', color: '#00ffe0',
      }).setOrigin(0.5, 0.5).setDepth(153);

      btnRefs[p] = btn;

      btn.on('pointerdown', () => {
        selected.push(p);
        btn.setFillStyle(C.ACCENT, 0.6);

        if (selected.length === 4) {
          const correct = this.puzzleManager.checkAnswer(
            FORK_CONFIG.PUZZLES.SERVER_SEQUENCE, [...selected]
          );
          this.time.delayedCall(400, () => {
            overlay.destroy();
            if (correct) {
              this.dialogManager.show([
                'SEQUENCE ACCEPTED.',
                'Server rebooting...',
                'SYSTEM NOTE: Reboot logged.',
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

    // Sequência atual
    const seqDisplay = this.add.text(W / 2, H / 2 + 40, 'Sequence: [ ]', {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0).setDepth(152);

    // ESC para fechar
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.once('down', () => overlay.destroy());

    this.add.text(W / 2, H / 2 + 90, '[ ESC ] Cancel', {
      fontFamily: 'monospace', fontSize: '10px', color: '#446655',
    }).setOrigin(0.5, 0).setDepth(152);
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
      '────────────────────',
      '"A porta nunca abre na primeira vez.',
      ' Mas sempre abre na segunda."',
      '',
      '"Delete o que o sistema não quer',
      ' que você veja."',
      '────────────────────',
    ], { title: 'NOTES' });
    GameState.addButterflyStep('read_notes');
  }

  _interactEntity() {
    const trust = GameState.get('entity_trust');
    const msgs = NARRATIVE.entity;

    if (trust === 0) {
      this.dialogManager.show(msgs.first_contact, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust === 1) {
      this.dialogManager.show(msgs.hint_log07, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust === 2) {
      this.dialogManager.show(msgs.hint_butterfly, { title: '???' });
      GameState.increment('entity_trust');
    } else {
      this.dialogManager.show(msgs.warning, { title: '???' });
    }
  }

  _interactCamera() {
    const awareness = GameState.get('system_awareness');
    this.dialogManager.show([
      'CAMERA-01  //  ACTIVE',
      `Monitoring status: ${awareness >= 3 ? 'ENHANCED' : 'STANDARD'}`,
      awareness >= 2
        ? 'The system is watching you closely.'
        : 'Recording...',
    ], { title: 'SECURITY CAMERA' });
    GameState.increaseSystemAwareness(1);
  }

  _interactSecretFile() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.HIDDEN_FILE)) {
      this.dialogManager.show([
        'PROJECT_B.enc',
        'File already accessed.',
        'You know what this is.',
      ], { title: 'SECRET FILE' });
      return;
    }

    // Puzzle de associação — resposta é "BUTTERFLY"
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
        // Mostra input de palavra
        const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75)
          .setOrigin(0, 0).setDepth(150).setInteractive();

        this.add.rectangle(W / 2, H / 2, 360, 160, C.TERMINAL_BG, 0.98)
          .setStrokeStyle(1, C.ACCENT_DIM).setDepth(151);

        this.add.text(W / 2, H / 2 - 50, 'DECRYPTION KEY:', {
          fontFamily: 'monospace', fontSize: '12px', color: '#88ffdd',
        }).setOrigin(0.5, 0).setDepth(152);

        let input = '';
        const display = this.add.text(W / 2, H / 2 - 14, '_', {
          fontFamily: 'monospace', fontSize: '16px', color: '#00ffe0',
        }).setOrigin(0.5, 0).setDepth(152);

        const feedback = this.add.text(W / 2, H / 2 + 30, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ff2244',
        }).setOrigin(0.5, 0).setDepth(152);

        const closeUI = () => { overlay.destroy(); keyH.remove(); };

        const keyH = this.input.keyboard.on('keydown', (e) => {
          if (e.keyCode === 27) { closeUI(); return; }
          if (e.keyCode === 8)  { input = input.slice(0, -1); }
          else if (e.key.length === 1) { input += e.key.toUpperCase(); }

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
      }
    });
  }

  // ── HUD ───────────────────────────────────────────────────

  _buildHUD() {
    const W = FORK_CONFIG.WIDTH;
    const C = FORK_CONFIG.COLORS;

    // Container fixo (não segue câmera)
    this._hudContainer = this.add.container(0, 0).setDepth(90).setScrollFactor(0);

    // Barra superior
    const topBar = this.add.rectangle(0, 0, W, 28, C.HIGHLIGHT, 0.95).setOrigin(0, 0);

    // Título
    const titleText = this.add.text(12, 7, 'FORK', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ffe0',
    });

    // Loop counter
    this._hudLoop = this.add.text(W / 2, 7, `LOOP 01`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#446655',
    }).setOrigin(0.5, 0);

    // Timer
    this._hudTimer = this.add.text(W - 12, 7, 'TIME: 05:00', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ffe0',
    }).setOrigin(1, 0);

    // Barra de tempo (embaixo do header)
    this._timerBar = this.add.rectangle(0, 28, W, 3, C.ACCENT, 1).setOrigin(0, 0);

    // Barra inferior (mensagens do sistema)
    const bottomBar = this.add.rectangle(0, FORK_CONFIG.HEIGHT - 22, W, 22, C.HIGHLIGHT, 0.9)
      .setOrigin(0, 0);
    this._hudSystemMsg = this.add.text(12, FORK_CONFIG.HEIGHT - 15, 'SYSTEM: Awaiting input.', {
      fontFamily: 'monospace', fontSize: '10px', color: '#446655',
    });

    // Awareness indicator
    this._hudAwareness = this.add.text(W - 12, FORK_CONFIG.HEIGHT - 15, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff2244',
    }).setOrigin(1, 0);

    this._hudContainer.add([
      topBar, titleText, this._hudLoop, this._hudTimer,
      this._timerBar, bottomBar, this._hudSystemMsg, this._hudAwareness,
    ]);
  }

  _updateHUD() {
    const loop     = GameState.get('loop_count');
    const time     = this.loopManager.getFormattedTime();
    const progress = this.loopManager.getProgress();
    const awareness = GameState.get('system_awareness');
    const W = FORK_CONFIG.WIDTH;

    this._hudLoop.setText(`LOOP ${String(loop).padStart(2, '0')}`);
    this._hudTimer.setText(`TIME: ${time}`);

    // Barra de tempo
    this._timerBar.setDisplaySize(W * progress, 3);

    // Cor muda conforme urgência
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

    // Awareness
    if (awareness > 0) {
      const bars = '|'.repeat(awareness) + '·'.repeat(5 - awareness);
      this._hudAwareness.setText(`SYS [${bars}]`);
    }
  }

  _setSystemMessage(msg) {
    this._hudSystemMsg.setText(`SYSTEM: ${msg}`);
  }

  // ── Loop callbacks ────────────────────────────────────────

  _setupLoopCallbacks() {
    this.loopManager
      .on('onWarning', () => {
        this._setSystemMessage('WARNING: Loop reset imminent.');
        this.dialogManager.showSystem('WARNING: 60 seconds remaining.', null);
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

    // Reage ações anteriores
    if (loopNum > 1) {
      if (GameState.get('log07_deleted')) {
        msgs.push(...NARRATIVE.systemReactions.log07_deleted);
      }
      if (GameState.get('server_rebooted')) {
        msgs.push(...NARRATIVE.systemReactions.server_rebooted);
      }
    }

    this.time.delayedCall(400, () => {
      this.dialogManager.show(msgs, { title: `LOOP ${String(loopNum).padStart(2, '0')}` });
    });
  }
}
