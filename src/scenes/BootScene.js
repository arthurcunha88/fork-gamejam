// ============================================================
// FORK — BootScene.js
// Carrega assets e exibe tela de boot
// ============================================================

class BootScene extends Phaser.Scene {

  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Sem assets externos por enquanto — tudo procedural
    // Quando houver spritesheets/tilemaps, carregar aqui
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;

    // Fundo
    this.add.rectangle(0, 0, W, H, C.BG).setOrigin(0, 0);

    // Texto de boot simulado
    const lines = [
      'FORK OS  v2.1.0',
      '────────────────────────────',
      'Initializing core systems...',
      'Loading simulation parameters...',
      'Checking loop integrity...',
      'User profile: NOT FOUND',
      'Generating environment...',
      '────────────────────────────',
      'READY.',
    ];

    let delay = 0;
    lines.forEach((line, i) => {
      this.time.delayedCall(delay, () => {
        this.add.text(W / 2, H / 2 - 80 + i * 18, line, {
          fontFamily: 'monospace',
          fontSize:   '13px',
          color:      i === lines.length - 1 ? '#00ffe0' : '#446655',
        }).setOrigin(0.5, 0);
      });
      delay += i < 2 ? 100 : 180;
    });

    // Vai para MenuScene após boot
    this.time.delayedCall(delay + 600, () => {
      this.scene.start('MenuScene');
    });
  }
}
