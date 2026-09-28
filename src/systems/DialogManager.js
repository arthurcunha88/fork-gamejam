// ============================================================
// FORK — DialogManager.js
// Gerencia diálogos, mensagens do sistema e texto narrativo
// ============================================================

class DialogManager {

  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this._queue = [];
    this._onCloseCallback = null;

    // Elementos de UI criados na cena
    this._box    = null;
    this._text   = null;
    this._prompt = null;
    this._input  = null;

    this._buildUI();
  }

  // ── Construção da UI ──────────────────────────────────────

  _buildUI() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    // Container
    this._container = this.scene.add.container(0, 0).setDepth(100).setVisible(false);

    // Fundo semi-transparente
    const overlay = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.5)
      .setOrigin(0, 0);

    // Caixa principal
    const boxH = 180;
    const boxY = H - boxH - 10;

    const boxBg = this.scene.add.rectangle(10, boxY, W - 20, boxH, C.TERMINAL_BG, 0.97)
      .setOrigin(0, 0)
      .setStrokeStyle(1, C.ACCENT_DIM);

    // Linha de título
    const titleBg = this.scene.add.rectangle(10, boxY, W - 20, 18, C.HIGHLIGHT, 1)
      .setOrigin(0, 0);

    this._titleText = this.scene.add.text(18, boxY + 3, 'SYSTEM', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#00ffe0',
      alpha: 0.8,
    });

    // Texto principal
    this._text = this.scene.add.text(18, boxY + 26, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#88ffdd',
      wordWrap: { width: W - 40 },
      lineSpacing: 4,
    });

    // Prompt "[ PRESSIONE E PARA CONTINUAR ]"
    this._prompt = this.scene.add.text(W - 20, boxY + boxH - 18, '[ E / CLICK TO CONTINUE ]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#446655',
    }).setOrigin(1, 0);

    // Piscar do prompt
    this.scene.tweens.add({
      targets: this._prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this._container.add([overlay, boxBg, titleBg, this._titleText, this._text, this._prompt]);

    // Input do teclado para avançar
    this._keyE = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  // ── API pública ───────────────────────────────────────────

  /** Mostra uma ou várias mensagens em sequência */
  show(messages, { title = 'SYSTEM', onClose } = {}) {
    if (!Array.isArray(messages)) messages = [messages];

    this._queue     = [...messages];
    this._title     = title;
    this._onCloseCallback = onClose || null;

    this._showNext();
  }

  /** Mostra mensagem do sistema (estilo IA) */
  showSystem(message, onClose) {
    const awareness = GameState.get('system_awareness');

    // Sistema mais consciente = mensagens mais inquietantes
    let prefix = 'SYSTEM';
    if (awareness >= 3) prefix = 'SYSTEM [AWARE]';
    if (awareness >= 5) prefix = 'SYSTEM [WATCHING]';

    this.show([message], { title: prefix, onClose });
  }

  /** Fecha o diálogo manualmente */
  close() {
    this._container.setVisible(false);
    this.isOpen = false;
    GameState.volatile.dialog_open = false;

    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }
  }

  /** Update — verifica input para avançar */
  update() {
    if (!this.isOpen) return;

    if (Phaser.Input.Keyboard.JustDown(this._keyE)) {
      this._advance();
    }
  }

  // ── Internos ──────────────────────────────────────────────

  _showNext() {
    if (this._queue.length === 0) {
      this.close();
      return;
    }

    const msg = this._queue.shift();
    this._display(msg);
  }

  _display(message) {
    this._titleText.setText(this._title || 'SYSTEM');
    this._text.setText(message);
    this._container.setVisible(true);
    this.isOpen = true;
    GameState.volatile.dialog_open = true;

    // Clique também avança
    this.scene.input.once('pointerdown', () => {
      if (this.isOpen) this._advance();
    });
  }

  _advance() {
    if (this._queue.length > 0) {
      this._showNext();
    } else {
      this.close();
    }
  }
}

// ── Banco de mensagens da narrativa ──────────────────────────

const NARRATIVE = {

  // Mensagens de boas-vindas por loop
  loopStart: (loopNum) => {
    const msgs = {
      1: [
        'SYSTEM ONLINE',
        'USER: UNKNOWN',
        'Você está aqui. Não sabe por quê.',
        'Mas há uma saída em algum lugar.',
      ],
      2: [
        `LOOP ${loopNum}`,
        'SYSTEM RESETTING... DONE.',
        'Você se lembra do que fez antes.',
        'O sistema também.',
      ],
      3: [
        `LOOP ${loopNum}`,
        'I REMEMBER WHAT YOU DID.',
        'Algumas coisas mudaram.',
        'Outras, você mudou.',
      ],
    };
    return msgs[Math.min(loopNum, 3)] || [`LOOP ${loopNum}`, 'SYSTEM RESETTING... DONE.'];
  },

  // Mensagem de reset
  reset: (loopNum) => [
    'SYSTEM RESETTING...',
    `LOOP ${loopNum} COMPLETE.`,
    `LOOP ${loopNum + 1} INITIALIZING...`,
  ],

  // Sistema reagindo a ações específicas
  systemReactions: {
    log07_deleted: [
      'UNAUTHORIZED FILE DELETION DETECTED.',
      'Logging action...',
      'WHY DID YOU DO THAT?',
    ],
    escape_attempted: [
      'UNAUTHORIZED EXIT ATTEMPT.',
      'ACCESS DENIED.',
      'You cannot leave. Not yet.',
    ],
    identity_revealed: [
      'I KNOW WHO YOU ARE.',
      'The file you deleted... I have copies.',
      'Did you think that would change anything?',
    ],
    server_rebooted: [
      'UNAUTHORIZED SYSTEM MODIFICATION.',
      'Recalibrating...',
      'Interesting choice.',
    ],
  },

  // Mensagens da entidade secundária
  entity: {
    first_contact: [
      '> Someone else is here.',
      '> psst. over here.',
      '> I\'ve been in this loop longer than you.',
      '> Listen carefully. The timer isn\'t the real threat.',
    ],
    hint_log07: [
      '> Delete LOG_07.',
      '> Trust me. Do it in this loop.',
      '> You\'ll understand in the next one.',
    ],
    hint_butterfly: [
      '> Have you noticed the pattern?',
      '> Every action. Every loop.',
      '> The system is... collecting something.',
    ],
    warning: [
      '> It already knows about me.',
      '> Don\'t trust everything you read.',
      '> Including this.',
    ],
  },

  // Finais
  endings: {
    escape: [
      'ACCESS GRANTED.',
      'Você sai.',
      'A tela fica preta.',
      'SYSTEM USERS: 2',
    ],
    reset: [
      'ACCESS DENIED.',
      'SYSTEM RESETTING...',
      'I REMEMBER YOU.',
      `LOOP ${GameState.get('loop_count') + 1} INITIALIZING...`,
    ],
    eternal_loop: [
      `LOOP COUNT: ${(8472913 + GameState.get('loop_count')).toLocaleString()}`,
      'You found the records.',
      'This has happened before.',
      'Many times.',
      `LOOP COUNT: ${(8472914 + GameState.get('loop_count')).toLocaleString()}`,
    ],
    controlled: [
      'You found the records.',
      'BEHAVIORAL PREDICTION: 97.3% ACCURACY',
      'Every choice you made...',
      '...was already accounted for.',
      'WHO IS REALLY PLAYING?',
    ],
    butterfly: [
      'PROJECT BUTTERFLY',
      'OBJECTIVE: Simulate butterfly effect.',
      'VARIABLE: Subject behavior under loop conditions.',
      'UNPREDICTED VARIABLE: Subject found this file.',
      'SYSTEM NOTE: This was not supposed to happen.',
      'Congratulations.',
      'You are the anomaly.',
    ],
  },
};
