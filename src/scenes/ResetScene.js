// ============================================================
// FORK — ResetScene.js
// Transição dramática de reset entre loops
// ============================================================

class ResetScene extends Phaser.Scene {

  constructor() { super({ key: 'ResetScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    const loopNum = GameState.get('loop_count');

    // Verifica condição de final ANTES do reset
    const ending = GameState.checkEndingConditions();
    if (ending) {
      this.scene.start('EndScene', { endingId: ending });
      return;
    }

    // Fundo preto
    this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0);

    // Sequência de reset
    const sequence = [
      { delay: 0,    text: 'SYSTEM RESETTING...',              color: '#ff2244', size: '20px' },
      { delay: 600,  text: `LOOP ${loopNum} COMPLETE`,         color: '#446655', size: '13px' },
      { delay: 1200, text: 'Saving state...',                  color: '#446655', size: '12px' },
      { delay: 1600, text: 'Clearing volatile memory...',      color: '#446655', size: '12px' },
      { delay: 2000, text: 'Persistent variables: preserved.', color: '#00886a', size: '12px' },
      { delay: 2500, text: `LOOP ${loopNum + 1} INITIALIZING...`, color: '#00ffe0', size: '16px' },
    ];

    // Mensagem especial se sistema está consciente
    const awareness = GameState.get('system_awareness');
    if (awareness >= 3) {
      sequence.push({
        delay: 3000,
        text:  'I REMEMBER WHAT YOU DID.',
        color: '#ff2244',
        size:  '14px',
      });
    }

    let y = H / 2 - (sequence.length * 20) / 2;

    sequence.forEach(({ delay, text, color, size }) => {
      this.time.delayedCall(delay, () => {
        this.add.text(W / 2, y, text, {
          fontFamily: 'monospace',
          fontSize:   size,
          color,
        }).setOrigin(0.5, 0);
        y += 26;
      });
    });

    // Glitch visual rápido
    this._runGlitch();

    // Avança para próximo loop
    const totalDelay = awareness >= 3 ? 3800 : 3200;
    this.time.delayedCall(totalDelay, () => {
      GameState.nextLoop();
      this.scene.start('GameScene');
    });
  }

  _runGlitch() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Linhas de glitch aleatórias
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(Phaser.Math.Between(100, 800), () => {
        const gfx = this.add.graphics();
        const y   = Phaser.Math.Between(0, H);
        const h   = Phaser.Math.Between(2, 12);
        gfx.fillStyle(FORK_CONFIG.COLORS.ACCENT, Phaser.Math.FloatBetween(0.1, 0.4));
        gfx.fillRect(0, y, W, h);

        this.time.delayedCall(80, () => gfx.destroy());
      });
    }
  }
}
