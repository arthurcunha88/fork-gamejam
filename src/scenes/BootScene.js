// ============================================================
// FORK — BootScene.js
// ============================================================

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Cria textura branca 1x1 para evitar 404 do Phaser
    if (!this.textures.exists('pixel')) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      canvas.getContext('2d').fillStyle = '#ffffff';
      canvas.getContext('2d').fillRect(0, 0, 1, 1);
      this.textures.addCanvas('pixel', canvas);
    }
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;

    this.add.rectangle(0, 0, W, H, FORK_CONFIG.COLORS.BG).setOrigin(0, 0);

    const lines = [
      { t: 'FORK OS  v2.1.0',                   c: F.COLOR_BRIGHT  },
      { t: '────────────────────────────',        c: F.COLOR_DIM     },
      { t: 'Initializing core systems...',        c: F.COLOR_MID     },
      { t: 'Loading simulation parameters...',    c: F.COLOR_MID     },
      { t: 'Checking loop integrity...',          c: F.COLOR_MID     },
      { t: 'User profile: NOT FOUND',             c: F.COLOR_DANGER  },
      { t: 'Generating environment...',           c: F.COLOR_MID     },
      { t: '────────────────────────────',        c: F.COLOR_DIM     },
      { t: 'READY.',                              c: F.COLOR_PRIMARY },
    ];

    let delay = 0;
    lines.forEach((line, i) => {
      this.time.delayedCall(delay, () => {
        this.add.text(W / 2, H / 2 - 80 + i * 20, line.t, {
          fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE,
          fontSize: '22px',
          color: line.c,
          shadow: { offsetX:0, offsetY:0, color: line.c, blur:8, fill:true },
        }).setOrigin(0.5, 0);
      });
      delay += i < 2 ? 80 : 160;
    });

    this.time.delayedCall(delay + 500, () => {
      this.scene.start('MenuScene');
    });
  }
}
