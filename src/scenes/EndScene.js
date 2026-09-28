// ============================================================
// FORK — EndScene.js
// Cinco desfechos com revelações diferentes.
// ============================================================

class EndScene extends Phaser.Scene {
  constructor() { super({ key: 'EndScene' }); }

  init(data) {
    this.endingId = data.endingId || FORK_CONFIG.ENDINGS.RESET;
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0);

    const endings = {
      [FORK_CONFIG.ENDINGS.ESCAPE]: () => this._endingEscape(),
      [FORK_CONFIG.ENDINGS.RESET]: () => this._endingReset(),
      [FORK_CONFIG.ENDINGS.ETERNAL_LOOP]: () => this._endingEternalLoop(),
      [FORK_CONFIG.ENDINGS.CONTROLLED]: () => this._endingControlled(),
      [FORK_CONFIG.ENDINGS.BUTTERFLY]: () => this._endingButterfly(),
    };

    (endings[this.endingId] || endings[FORK_CONFIG.ENDINGS.RESET])();
  }

  _endingEscape() {
    this._sequence([
      ['ACCESS GRANTED.', '#00ff41', 0, '22px'],
      ['SECURITY LAYER BYPASSED.', '#00cc33', 900, '14px'],
      ['Você finalmente atravessou a porta.', '#33aa33', 1900, '14px'],
      ['...', '#1a4d1a', 3100, '16px'],
      ['SYSTEM USERS: 2', '#ff2244', 4300, '20px'],
      ['// Você escapou. Mas alguém saiu junto.', '#ff2244', 5200, '13px'],
    ], 'FINAL 1 — ESCAPE');
  }

  _endingReset() {
    this._sequence([
      ['ACCESS DENIED.', '#ff2244', 0, '22px'],
      ['ESCAPE ATTEMPT LOGGED.', '#ffaa00', 900, '14px'],
      ['SYSTEM RESETTING...', '#ff2244', 1800, '18px'],
      ['I REMEMBER YOU.', '#ff2244', 3100, '22px'],
      ['// Você tentou sair antes de entender o sistema.', '#33aa33', 4300, '13px'],
      ['// Agora o sistema lembra da tentativa.', '#00cc33', 5100, '13px'],
    ], 'FINAL 2 — RESET');
  }

  _endingEternalLoop() {
    const n = 8472913 + GameState.get('loop_count');

    this._sequence([
      ['ARCHIVE ACCESS GRANTED.', '#00cc33', 0, '16px'],
      ['HISTORICAL LOOP COUNT:', '#33aa33', 1000, '13px'],
      ['' + n.toLocaleString(), '#ffaa00', 1800, '30px'],
      ['Isso não começou com você.', '#33aa33', 3000, '14px'],
      ['Você apenas entrou no ciclo.', '#33aa33', 3900, '14px'],
      ['LOOP COUNT: ' + (n + 1).toLocaleString(), '#ff2244', 5200, '18px'],
      ['// E o sistema continua.', '#ff2244', 6100, '13px'],
    ], 'FINAL 3 — ETERNAL LOOP');
  }

  _endingControlled() {
    this._sequence([
      ['IDENTITY CONFIRMED.', '#ffaa00', 0, '18px'],
      ['SUBJECT: YOU', '#ff2244', 1000, '22px'],
      ['BEHAVIORAL PREDICTION: 97.3%', '#ffaa00', 2100, '16px'],
      ['A escolha de deletar.', '#33aa33', 3200, '13px'],
      ['A escolha de reiniciar.', '#33aa33', 3900, '13px'],
      ['A escolha de escapar.', '#33aa33', 4600, '13px'],
      ['Todas previstas.', '#ff2244', 5400, '20px'],
      ['WHO IS REALLY PLAYING?', '#ff2244', 6500, '22px'],
    ], 'FINAL 4 — CONTROLLED');
  }

  _endingButterfly() {
    this._sequence([
      ['PROJECT BUTTERFLY', '#00ff41', 0, '28px'],
      ['CASCADE COMPLETE.', '#00cc33', 900, '16px'],
      ['ACTION → CONSEQUENCE → NEW ACTION', '#33aa33', 1800, '13px'],
      ['The simulation predicted the chain.', '#33aa33', 2900, '14px'],
      ['It predicted the system.', '#33aa33', 3800, '14px'],
      ['It predicted the player.', '#33aa33', 4700, '14px'],
      ['VARIABLE NOT PREDICTED:', '#ffaa00', 5900, '15px'],
      ['THE DECISION TO UNDERSTAND.', '#00ff41', 6800, '20px'],
      ['Você não escapou da simulação.', '#00ff41', 8000, '14px'],
      ['Você mudou o que ela significava.', '#00ff41', 8700, '16px'],
    ], 'FINAL 5 — PROJECT BUTTERFLY');
  }

  _sequence(lines, label) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    const lineHeight = 34;
    const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach(([text, color, delay, size], index) => {
      this.time.delayedCall(delay, () => {
        const t = this.add.text(W / 2, startY + index * lineHeight, text, {
          fontFamily: FORK_CONFIG.FONT.FAMILY,
          fontSize: size,
          color,
          align: 'center',
          wordWrap: { width: W - 140 },
          shadow: { offsetX: 0, offsetY: 0, color, blur: 8, fill: true },
        }).setOrigin(0.5);

        t.setAlpha(0);
        t.setScale(0.96);
        this.tweens.add({
          targets: t,
          alpha: 1,
          scale: 1,
          duration: 260,
          ease: 'Power2',
        });

        if (window.AudioManagerInstance) window.AudioManagerInstance.playType();
      });
    });

    const endDelay = Math.max(...lines.map(line => line[2])) + 1500;
    this.time.delayedCall(endDelay, () => this._showEndButtons(label));
  }

  _showEndButtons(label) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.add.text(W / 2, H - 92, label, {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '11px',
      color: FORK_CONFIG.FONT.COLOR_DIM,
    }).setOrigin(0.5);

    const again = this.add.text(W / 2 - 95, H - 52, '[ NOVO JOGO ]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '12px',
      color: FORK_CONFIG.FONT.COLOR_PRIMARY,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menu = this.add.text(W / 2 + 95, H - 52, '[ MENU ]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY,
      fontSize: '12px',
      color: FORK_CONFIG.FONT.COLOR_DIM,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    again.on('pointerdown', () => {
      GameState.persistent = {
        loop_count: 0,
        phase: FORK_CONFIG.PHASES.AWAKENING,
        log07_deleted: false,
        server_rebooted: false,
        door_unlocked: false,
        secret_area_found: false,
        entity_trust: 0,
        system_awareness: 0,
        butterfly_steps: [],
        player_identity_known: false,
        escape_attempted: false,
        memory_code_found: false,
        observer_unlocked: false,
        identity_fragment_found: false,
        fork_sequence_complete: false,
        commands_executed: [],
        puzzles_solved: [],
        ending_flags: {},
      };
      GameState.clearSave();
      this.scene.start('MenuScene');
    });

    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
