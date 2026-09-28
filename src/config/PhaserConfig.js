// ============================================================
// FORK — PhaserConfig.js
// Inicialização do Phaser
// ============================================================

const config = {
  type: Phaser.AUTO,
  width: FORK_CONFIG.WIDTH,
  height: FORK_CONFIG.HEIGHT,
  backgroundColor: '#050810',
  pixelArt: true,
  parent: document.body,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    ResetScene,
    EndScene,
  ],
};

const game = new Phaser.Game(config);
