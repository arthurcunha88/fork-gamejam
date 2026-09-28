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
    this._keyEsc = null;
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
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '11px',
      color: FORK_CONFIG.FONT.COLOR_PRIMARY,
      alpha: 0.8,
    });

    // Texto principal
    this._text = this.scene.add.text(18, boxY + 26, '', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '13px',
      color: FORK_CONFIG.FONT.COLOR_SYSTEM,
      wordWrap: { width: W - 40 },
      lineSpacing: 4,
    });

    // Prompt "[ PRESSIONE E PARA CONTINUAR ]"
    this._closeBtn = this.scene.add.text(W - 20, boxY + 3, '[X]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY, fontSize: '10px', color: FORK_CONFIG.FONT.COLOR_DIM,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerdown', () => this.close());

    this._prompt = this.scene.add.text(W - 20, boxY + boxH - 18, '[ E / CLICK ]  [ ESC / CLOSE ]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '10px',
      color: FORK_CONFIG.FONT.COLOR_DIM,
    }).setOrigin(1, 0);

    // Piscar do prompt
    this.scene.tweens.add({
      targets: this._prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this._container.add([overlay, boxBg, titleBg, this._titleText, this._text, this._prompt, this._closeBtn]);

    overlay.setInteractive();
    overlay.on('pointerdown', () => this.close());

    // Input do teclado para avançar
    this._keyE = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._keyEsc = (e) => {
      if (this.isOpen && e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) this.close();
    };
    this.scene.input.keyboard.on('keydown', this._keyEsc);
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

  // Mensagens de início de loop — evoluem conforme o estado
  loopStart: (loopNum) => {
    const deleted   = GameState.get('log07_deleted');
    const rebooted  = GameState.get('server_rebooted');
    const awareness = GameState.get('system_awareness');
    const identity  = GameState.get('player_identity_known');

    if (loopNum === 1) return [
      'SYSTEM ONLINE.',
      'USER: UNKNOWN',
      'TIME REMAINING: 05:00',
      '',
      'Você está aqui.',
      'Não sabe por quê.',
      'Mas há uma saída em algum lugar.',
    ];

    if (loopNum === 2) {
      const msgs = ['SYSTEM RESETTING... DONE.', `LOOP ${loopNum}`, ''];
      if (deleted)  msgs.push('// Você deletou algo no loop anterior.', '// O sistema registrou.', '// Timestamp: 07:31');
      else          msgs.push('Você lembra do que tentou.', 'O sistema também.');
      return msgs;
    }

    // Loop 3+
    const msgs = [`LOOP ${loopNum}`, ''];
    if (awareness >= 3 && identity) {
      msgs.push('I KNOW WHO YOU ARE.', 'The file you deleted? I have copies.', '// Did you think that would change anything?');
    } else if (deleted && rebooted) {
      msgs.push('Você alterou duas coisas.', 'Ambas foram registradas.', '// As consequências aparecem agora.');
    } else if (deleted) {
      msgs.push('LOG_07 continua ausente.', 'Timestamp 07:31 permanece no sistema.', '// O que você deletou mudou o que é possível agora.');
    } else {
      msgs.push('I REMEMBER WHAT YOU DID.', 'Or what you did not do.');
    }
    return msgs;
  },

  // Reações do sistema às ações do jogador — exibidas no início do loop seguinte
  systemReactions: {
    log07_deleted: [
      '',
      'ANOMALY DETECTED: LOG_07 removed.',
      'Deletion timestamp on record: 07:31.',
      '// Você apagou o arquivo.',
      '// Mas o sistema guardou a hora em que você agiu.',
    ],
    server_rebooted: [
      '',
      'SYSTEM MODIFICATION: Server_A rebooted.',
      'Restricted directory: now accessible.',
      '// O servidor reiniciou.',
      '// Algo que estava bloqueado agora não está.',
    ],
    both: [
      '',
      'TWO ANOMALIES DETECTED THIS LOOP.',
      'Cascading consequence probability: HIGH.',
      '// Você fez duas coisas.',
      '// Cada uma mudou algo.',
      '// Juntas, mudaram mais.',
    ],
  },

  // Servidor — pista dos LEDs para o puzzle de sequência
  serverLEDs: [
    'SERVER A — DIAGNOSTIC',
    '──────────────────────────────',
    'LED status report:',
    '  Panel A: [ . ]          — 1 pulse',
    '  Panel B: [ . . ]        — 2 pulses',
    '  Panel C: [ . . . ]      — 3 pulses',
    '  Panel D: [ . . . . ]    — 4 pulses',
    '──────────────────────────────',
    '// Os painéis piscam em sequência.',
    '// A ordem de ativação importa.',
    '// Observe a frequência.',
  ],

  // Porta — feedback contextual
  door: {
    locked_no_clue: [
      'SECURITY DOOR — LOCKED.',
      'Código de acesso necessário. Formato: XXXX',
      '// Talvez o terminal tenha uma pista.',
    ],
    locked_has_clue: [
      'SECURITY DOOR — LOCKED.',
      'Código de acesso necessário.',
      '// Você deletou LOG_07 às 07:31.',
      '// O sistema registrou esse momento.',
      '// O que essa hora representa?',
    ],
    unlocked_no_ending: [
      'ACCESS GRANTED.',
      'Mas algo te segura.',
      '// Você ainda não entende o suficiente.',
    ],
  },

  // Entidade secundária
  entity: {
    first_contact: [
      '> ...',
      '> alguém está aqui.',
      '> eu estou nesse loop há mais tempo que você.',
      '> escuta: o timer não é o verdadeiro problema.',
    ],
    hint_log07: [
      '> você leu os logs?',
      '> LOG_07 tem algo sobre você.',
      '> e se você deletar... o sistema vai registrar a hora.',
      '> essa hora vai importar.',
    ],
    hint_server: [
      '> você viu os LEDs do servidor?',
      '> eles piscam em padrão.',
      '> conta quantas vezes cada um pisca.',
      '> ative na ordem crescente.',
    ],
    hint_butterfly: [
      '> você percebeu o padrão?',
      '> delete o log. reinicie o servidor.',
      '> as duas ações juntas desbloqueiam algo.',
      '> algo que sozinho nenhuma das duas abriria.',
    ],
    warning: [
      '> o sistema já sabe de mim.',
      '> não confie em tudo que você lê.',
      '> inclusive isso.',
    ],
  },

  // Câmera — pista do morse para BUTTERFLY (Final 5)
  camera: {
    standard: [
      'CAMERA-01 — ACTIVE',
      'Status: RECORDING',
      '// Monitoramento padrão.',
    ],
    aware: [
      'CAMERA-01 — ENHANCED MONITORING',
      'Behavioral deviation flagged.',
      '// Ela está prestando mais atenção agora.',
    ],
    morse: [
      'CAMERA-01 — SIGNAL DETECTED',
      '──────────────────────────────',
      'Interference pattern on feed:',
      '  -... ..- - - . .-. ..-. .-.. -.--',
      '──────────────────────────────',
      '// Parece ruído.',
      '// Ou não.',
    ],
  },
};
