// ============================================================
// FORK — PhaserConfig.js
// Inicialização do Phaser
// ============================================================

const config = {
  type: Phaser.AUTO,
  width: FORK_CONFIG.WIDTH,
  height: FORK_CONFIG.HEIGHT,
  backgroundColor: '#070b10',
  pixelArt: false,
  parent: document.body,
  // FIX 404: desabilita loader de textura padrão
  loader: {
    baseURL: '',
    crossOrigin: 'anonymous',
  },
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
