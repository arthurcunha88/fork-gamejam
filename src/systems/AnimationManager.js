// ============================================================
// FORK — AnimationManager.js
// Glitch, flash, partículas e feedback visual.
// ============================================================

class AnimationManager {
  constructor(scene) {
    this.scene = scene;
  }

  flash(kind = 'critical') {
    const color = kind === 'success'
      ? FORK_CONFIG.COLORS.ACCENT
      : FORK_CONFIG.COLORS.DANGER;

    const overlay = this.scene.add.rectangle(
      0, 0, FORK_CONFIG.WIDTH, FORK_CONFIG.HEIGHT,
      color, kind === 'success' ? 0.18 : 0.25
    ).setOrigin(0, 0).setDepth(1000).setScrollFactor(0);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 180,
      onComplete: () => overlay.destroy(),
    });
  }

  glitch(duration = 500, intensity = 7) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    for (let i = 0; i < intensity; i++) {
      this.scene.time.delayedCall(Phaser.Math.Between(0, duration), () => {
        const line = this.scene.add.graphics().setDepth(999).setScrollFactor(0);

        line.fillStyle(
          i % 2 ? FORK_CONFIG.COLORS.ACCENT : FORK_CONFIG.COLORS.DANGER,
          Phaser.Math.FloatBetween(0.06, 0.22)
        );

        line.fillRect(
          Phaser.Math.Between(0, 40),
          Phaser.Math.Between(0, H),
          Phaser.Math.Between(80, W),
          Phaser.Math.Between(2, 9)
        );

        this.scene.time.delayedCall(
          Phaser.Math.Between(40, 100),
          () => line.destroy()
        );
      });
    }
  }

  doorOpen(x, y) {
    for (let i = 0; i < 12; i++) {
      const spark = this.scene.add.rectangle(
        x, y,
        Phaser.Math.Between(2, 5),
        Phaser.Math.Between(2, 7),
        FORK_CONFIG.COLORS.ACCENT_BRIGHT,
        1
      ).setDepth(20);

      this.scene.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-55, 55),
        y: y + Phaser.Math.Between(-55, 55),
        alpha: 0,
        duration: Phaser.Math.Between(300, 650),
        onComplete: () => spark.destroy(),
      });
    }

    this.scene.cameras.main.flash(220, 0, 255, 65);
  }

  pulse(target, scale = 1.08, duration = 180) {
    if (!target || !target.scene) return;

    this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }
}

window.AnimationManagerInstance = null;
