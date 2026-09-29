// ============================================================
// FORK — EndScene.js
// Tela final estática: o jogador escolhe explicitamente o próximo passo.
// ============================================================

class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' });
  }

  init(data) {
    this.endingId = data.endingId || FORK_CONFIG.ENDINGS.RESET;
    this.selectedIndex = 0;
  }

  preload() {
    this.load.image('fork_emblem_end', 'assets/fork-emblem.svg');
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const C = FORK_CONFIG.COLORS;

    this.add.rectangle(0, 0, W, H, C.BG, 1).setOrigin(0, 0);

    // Moldura fixa da tela final.
    const frame = this.add.graphics();
    frame.lineStyle(1, C.ACCENT_DIM, 0.55);
    frame.strokeRect(42, 38, W - 84, H - 76);
    frame.lineStyle(1, C.GRID, 0.75);
    frame.strokeRect(56, 52, W - 112, H - 104);

    if (this.textures.exists('fork_emblem_end')) {
      this.add.image(W / 2, 126, 'fork_emblem_end')
        .setScale(0.48)
        .setAlpha(0.34);
    }

    const ending = this._getEndingData();
    this._drawEnding(ending);
    this._createChoices();

    this._keyHandler = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        this._select(-1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        this._select(1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this._activateSelection();
      } else if (event.key === '1' || event.key === '2' || event.key === '3') {
        event.preventDefault();
        this.selectedIndex = Number(event.key) - 1;
        this._refreshChoices();
        this._activateSelection();
      }
    };

    this.input.keyboard.on('keydown', this._keyHandler);

    this.events.once('shutdown', () => {
      if (this._keyHandler) {
        this.input.keyboard.off('keydown', this._keyHandler);
      }
    });
  }

  _getEndingData() {
    const E = FORK_CONFIG.ENDINGS;

    const endings = {
      [E.ESCAPE]: {
        code: 'FINAL 1',
        title: 'ESCAPE',
        accent: '#59d8ff',
        lines: [
          'ACCESS GRANTED.',
          'SECURITY LAYER BYPASSED.',
          'Você finalmente atravessou a porta.',
          '',
          'SYSTEM USERS: 2',
          '// Você escapou. Mas alguém saiu junto.',
        ],
      },

      [E.RESET]: {
        code: 'FINAL 2',
        title: 'RESET',
        accent: '#ff6678',
        lines: [
          'ACCESS DENIED.',
          'ESCAPE ATTEMPT LOGGED.',
          'SYSTEM RESETTING...',
          '',
          'I REMEMBER YOU.',
          '// Você tentou sair antes de entender o sistema.',
          '// Agora o sistema lembra da tentativa.',
        ],
      },

      [E.ETERNAL_LOOP]: {
        code: 'FINAL 3',
        title: 'ETERNAL LOOP',
        accent: '#ff9aa6',
        lines: [
          'ARCHIVE ACCESS GRANTED.',
          'HISTORICAL LOOP COUNT:',
          String(8472913 + GameState.get('loop_count')),
          '',
          'Isso não começou com você.',
          'Você apenas entrou no ciclo.',
          '',
          'LOOP COUNT: ' + (8472914 + GameState.get('loop_count')),
          '// E o sistema continua.',
        ],
      },

      [E.CONTROLLED]: {
        code: 'FINAL 4',
        title: 'CONTROLLED',
        accent: '#ffb34d',
        lines: [
          'IDENTITY CONFIRMED.',
          'SUBJECT: YOU',
          'BEHAVIORAL PREDICTION: 97.3%',
          '',
          'A escolha de deletar.',
          'A escolha de reiniciar.',
          'A escolha de escapar.',
          'Todas previstas.',
          '',
          'WHO IS REALLY PLAYING?',
        ],
      },

      [E.BUTTERFLY]: {
        code: 'FINAL 5',
        title: 'PROJECT BUTTERFLY',
        accent: '#9be8ff',
        lines: [
          'PROJECT BUTTERFLY',
          'CASCADE COMPLETE.',
          'ACTION → CONSEQUENCE → NEW ACTION',
          '',
          'The simulation predicted the chain.',
          'It predicted the system.',
          'It predicted the player.',
          '',
          'VARIABLE NOT PREDICTED:',
          'THE DECISION TO UNDERSTAND.',
          '',
          'Você não escapou da simulação.',
          'Você mudou o que ela significava.',
        ],
      },
    };

    return endings[this.endingId] || endings[E.RESET];
  }

  _drawEnding(ending) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    // Layout fixo para todas as telas finais.
    // A área de texto nunca invade o título nem as opções inferiores.
    const panelX = 120;
    const panelY = 198;
    const panelWidth = W - 240;
    const panelHeight = 326;
    const panelPaddingX = 34;
    const panelPaddingY = 28;
    const lineHeight = 20;

    this.add.text(W / 2, 72, ending.code, {
      fontFamily: F.FAMILY,
      fontSize: '11px',
      color: F.COLOR_DIM,
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.add.text(W / 2, 158, ending.title, {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '26px',
      color: ending.accent,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: ending.accent,
        blur: 8,
        fill: true,
      },
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x071018, 0.94);
    panel.fillRect(panelX, panelY, panelWidth, panelHeight);
    panel.lineStyle(1, C.ACCENT_DIM, 0.38);
    panel.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // O conteúdo fica dentro de uma margem interna constante.
    const textX = W / 2;
    const startY = panelY + panelPaddingY;

    ending.lines.forEach((line, index) => {
      let color = C.TEXT_MID;
      let size = '14px';

      if (index === 0) {
        color = ending.accent;
        size = '17px';
      } else if (line.startsWith('//')) {
        color = C.TEXT_DIM;
        size = '12px';
      } else if (line === 'THE DECISION TO UNDERSTAND.') {
        color = ending.accent;
        size = '17px';
      }

      this.add.text(textX, startY + index * lineHeight, line, {
        fontFamily: F.FAMILY,
        fontSize: size,
        color,
        align: 'center',
        wordWrap: { width: panelWidth - (panelPaddingX * 2) },
        lineSpacing: 0,
      }).setOrigin(0.5, 0);
    });

    // Mantém uma distância clara entre o painel, a instrução e os controles.
    this.add.text(W / 2, 548, 'SELECIONE UMA OPÇÃO', {
      fontFamily: F.FAMILY,
      fontSize: '10px',
      color: C.TEXT_DIM,
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Área segura inferior: os controles ficam separados da mensagem final.  }

  _createChoices() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this._choices = [
      this._makeChoice(0, W / 2 - 205, H - 62, '[ 1 ] NOVO JOGO', () => this._newGame()),
      this._makeChoice(1, W / 2, H - 62, '[ 2 ] VOLTAR AO LOOP', () => this._nextLoop()),
      this._makeChoice(2, W / 2 + 205, H - 62, '[ 3 ] MENU', () => this._menu()),
    ];

    this._refreshChoices();
  }

  _makeChoice(index, x, y, label, callback) {
    const text = this.add.text(x, y, label, {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '12px',
      color: FORK_CONFIG.FONT.COLOR_DIM,
      align: 'center',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerover', () => {
      this.selectedIndex = index;
      this._refreshChoices();
    });

    text.on('pointerdown', callback);
    return text;
  }

  _refreshChoices() {
    if (!this._choices) return;

    this._choices.forEach((choice, index) => {
      const selected = index === this.selectedIndex;
      choice.setColor(
        selected
          ? FORK_CONFIG.FONT.COLOR_PRIMARY
          : FORK_CONFIG.FONT.COLOR_DIM
      );
      choice.setText(
        selected
          ? choice.text.replace(/^\[ [123] \]/, '▶')
          : choice.text.replace(/^▶/, index === 0 ? '[ 1 ]' : index === 1 ? '[ 2 ]' : '[ 3 ]')
      );
    });
  }

  _select(direction) {
    this.selectedIndex =
      (this.selectedIndex + direction + this._choices.length) % this._choices.length;
    this._refreshChoices();
  }

  _activateSelection() {
    const choice = this._choices[this.selectedIndex];
    if (choice) choice.emit('pointerdown');
  }

  _resetAllState() {
    GameState.persistent = {
      loop_count: 0,
      phase: FORK_CONFIG.PHASES.AWAKENING,
      boot_code_found: false,
      memory_code_found: false,
      observer_unlocked: false,
      identity_fragment_found: false,
      fork_sequence_complete: false,
      log07_deleted: false,
      server_rebooted: false,
      door_unlocked: false,
      secret_area_found: false,
      entity_trust: 0,
      system_awareness: 0,
      butterfly_steps: [],
      player_identity_known: false,
      escape_attempted: false,
      commands_executed: [],
      puzzles_solved: [],
      ending_flags: {},
      clear_count: 0,
      corruption_level: 0,
      filesystem_wiped: false,
      system_notes_read: false,
      restore_requested: false,
      system_restored: false,
      loop_error_count: 0,
      last_loop_error: null,
    };

    GameState.resetVolatile();
    GameState.clearSave();
  }

  _resetLoopProgress() {
    const loopCount = GameState.get('loop_count');
    const awareness = GameState.get('system_awareness');

    GameState.persistent.phase = FORK_CONFIG.PHASES.AWAKENING;
    GameState.persistent.boot_code_found = false;
    GameState.persistent.memory_code_found = false;
    GameState.persistent.observer_unlocked = false;
    GameState.persistent.identity_fragment_found = false;
    GameState.persistent.fork_sequence_complete = false;
    GameState.persistent.log07_deleted = false;
    GameState.persistent.server_rebooted = false;
    GameState.persistent.door_unlocked = false;
    GameState.persistent.secret_area_found = false;
    GameState.persistent.entity_trust = 0;
    GameState.persistent.butterfly_steps = [];
    GameState.persistent.player_identity_known = false;
    GameState.persistent.escape_attempted = false;
    GameState.persistent.commands_executed = [];
    GameState.persistent.puzzles_solved = [];
    GameState.persistent.ending_flags = {};
    GameState.persistent.clear_count = 0;
    GameState.persistent.corruption_level = 0;
    GameState.persistent.filesystem_wiped = false;
    GameState.persistent.system_notes_read = false;
    GameState.persistent.restore_requested = false;
    GameState.persistent.system_restored = false;
    GameState.persistent.loop_error_count = 0;
    GameState.persistent.last_loop_error = null;
    GameState.persistent.loop_count = loopCount;
    GameState.persistent.system_awareness = awareness;

    GameState.resetVolatile();
  }

  _newGame() {
    this._resetAllState();
    this.scene.start('GameScene');
  }

  _nextLoop() {
    this._resetLoopProgress();
    GameState.nextLoop();
    this.scene.start('GameScene');
  }

  _menu() {
    this.scene.start('MenuScene');
  }
}
