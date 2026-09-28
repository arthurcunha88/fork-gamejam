// ============================================================
// FORK — Terminal.js
// Terminal interativo com sistema de comandos
// ============================================================

class Terminal extends InteractiveObject {

  constructor(scene, x, y, config = {}) {
    super(scene, x, y, {
      ...config,
      type:  FORK_CONFIG.OBJECT_TYPES.TERMINAL,
      label: config.label || 'TERMINAL',
      color: FORK_CONFIG.COLORS.TERMINAL_BG,
      width: 48, height: 36,
    });

    this.puzzleManager = config.puzzleManager || null;
    this.dialogManager = config.dialogManager || null;

    // Estado do terminal
    this._isOpen    = false;
    this._history   = [];      // linhas no terminal
    this._inputBuf  = '';      // buffer do input atual
    this._maxLines  = 18;

    // Comandos disponíveis (do PuzzleManager ou config)
    this._commands = config.commands || {};

    // Mescla com comandos do puzzle, se houver
    const puzzleData = this.puzzleManager
      ? this.puzzleManager.get(config.puzzleId || FORK_CONFIG.PUZZLES.TERMINAL_MAIN)
      : null;
    if (puzzleData && puzzleData.commands) {
      this._commands = { ...puzzleData.commands, ...this._commands };
    }

    // UI do terminal (começa escondida)
    this._buildTerminalUI();

    // Sobrescreve onInteract
    this.onInteract = () => this.open();
  }

  // ── UI ────────────────────────────────────────────────────

  _buildTerminalUI() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    const TW = 600;
    const TH = 380;
    const TX = (W - TW) / 2;
    const TY = (H - TH) / 2;

    this._termContainer = this.scene.add.container(0, 0)
      .setDepth(200)
      .setVisible(false);

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);

    // Janela
    const win = this.scene.add.rectangle(TX, TY, TW, TH, C.TERMINAL_BG, 0.98)
      .setOrigin(0, 0)
      .setStrokeStyle(1, C.ACCENT_DIM);

    // Header
    const header = this.scene.add.rectangle(TX, TY, TW, 20, C.HIGHLIGHT, 1).setOrigin(0, 0);
    const headerText = this.scene.add.text(TX + 8, TY + 4, 'FORK TERMINAL  //  v2.1.0', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '10px',
      color:      '#00ffe0',
    });
    const closeBtn = this.scene.add.text(TX + TW - 10, TY + 4, '[ESC]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '10px',
      color:      '#446655',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    // Área de output
    this._outputText = this.scene.add.text(TX + 10, TY + 28, '', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '12px',
      color:      '#88ffdd',
      wordWrap:   { width: TW - 20 },
      lineSpacing: 2,
    });

    // Separador
    const sep = this.scene.add.rectangle(TX, TY + TH - 36, TW, 1, C.ACCENT_DIM, 0.4)
      .setOrigin(0, 0);

    // Input line
    this._inputPrefix = this.scene.add.text(TX + 10, TY + TH - 28, '> ', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '12px',
      color:      '#00ffe0',
    });

    this._inputText = this.scene.add.text(TX + 26, TY + TH - 28, '', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '12px',
      color:      '#ffffff',
    });

    // Cursor piscante
    this._cursor = this.scene.add.text(TX + 26, TY + TH - 28, '_', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize:   '12px',
      color:      '#00ffe0',
    });
    this.scene.tweens.add({
      targets:  this._cursor,
      alpha:    0,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
    });

    // Scanlines e pequenos indicadores dão aparência de monitor físico.
    const scanlines = this.scene.add.graphics();
    scanlines.lineStyle(1, C.ACCENT, 0.035);
    for (let y = TY + 24; y < TY + TH - 38; y += 4) {
      scanlines.moveTo(TX + 4, y).lineTo(TX + TW - 4, y);
    }
    scanlines.strokePath();

    const status = this.scene.add.text(TX + TW - 74, TY + 4, '● LIVE', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '9px',
      color: '#39ff14',
    });

    this._termContainer.add([
      overlay, win, header, headerText, status, scanlines, closeBtn,
      this._outputText, sep,
      this._inputPrefix, this._inputText, this._cursor,
    ]);

    // Keyboard capture
    this._setupKeyboard();
  }

  _setupKeyboard() {
    this._keyboardListener = this.scene.input.keyboard.on('keydown', (e) => {
      if (!this._isOpen) return;

      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        this.close();
        return;
      }

      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        this._executeCommand(this._inputBuf.trim().toUpperCase());
        this._inputBuf = '';
        this._updateInputDisplay();
        return;
      }

      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
        this._inputBuf = this._inputBuf.slice(0, -1);
        this._updateInputDisplay();
        return;
      }

      // Caracteres imprimíveis
      if (e.key.length === 1) {
        this._inputBuf += e.key;
        this._updateInputDisplay();
      }
    });
  }

  // ── Lógica do terminal ────────────────────────────────────

  open() {
    if (GameState.volatile.dialog_open) return;

    this._isOpen = true;
    this._termContainer.setVisible(true);
    GameState.volatile.terminal_open = true;
    if (window.AudioManagerInstance) window.AudioManagerInstance.playBeep();
    this._termContainer.setAlpha(0);
    this.scene.tweens.add({ targets: this._termContainer, alpha: 1, duration: 160 });

    if (this._history.length === 0) {
      this._printWelcome();
    }

    this._renderOutput();
  }

  close() {
    this._isOpen = false;
    this.scene.tweens.add({ targets: this._termContainer, alpha: 0, duration: 120, onComplete: () => this._termContainer.setVisible(false) });
    GameState.volatile.terminal_open = false;
  }

  _printWelcome() {
    const loopNum = GameState.get('loop_count');
    this._addLine('FORK TERMINAL  //  SECURE SHELL');
    this._addLine('────────────────────────────────');
    this._addLine(`LOOP: ${loopNum}  //  USER: UNKNOWN`);

    if (GameState.get('log07_deleted')) {
      this._addLine('WARNING: LOG_07 — NOT FOUND');
    }
    if (GameState.get('system_awareness') >= 3) {
      this._addLine('NOTICE: Unauthorized activity flagged.');
    }

    this._addLine('Type HELP for available commands.');
    this._addLine('');
  }

  _executeCommand(cmd) {
    if (!cmd) return;

    this._addLine(`> ${cmd}`);
    GameState.executeCommand(cmd);

    const cmdDef = this._commands[cmd];

    if (cmdDef) {
      // Output pode ser array estático ou função
      const output = typeof cmdDef.output === 'function'
        ? cmdDef.output()
        : cmdDef.output;

      if (Array.isArray(output)) {
        output.forEach(line => this._addLine(line));
      } else if (output) {
        this._addLine(output);
      }

      // Callback de execução
      if (cmdDef.onExecute) {
        cmdDef.onExecute();
      }

    } else if (cmd === 'CLEAR') {
      this._history = [];
    } else {
      this._addLine(`ERROR: Command not recognized — "${cmd}"`);
      this._addLine('Type HELP for available commands.');
    }

    this._addLine('');
    this._renderOutput();
  }

  _addLine(line) {
    this._history.push(line);
    // Mantém máximo de linhas
    if (this._history.length > this._maxLines * 3) {
      this._history = this._history.slice(-this._maxLines * 2);
    }
  }

  _renderOutput() {
    // Mostra as últimas N linhas
    const visible = this._history.slice(-this._maxLines);
    this._outputText.setText(visible.join('\n'));
  }

  _updateInputDisplay() {
    this._inputText.setText(this._inputBuf);
    // Move cursor para o fim do texto
    const w = this._inputText.width;
    const base = (FORK_CONFIG.WIDTH - 600) / 2 + 26;
    this._cursor.setX(base + w);
  }
}
