// ============================================================
// FORK — InteractiveObject.js  [FIXED]
// Classe base para todos os objetos interativos do mapa
// ============================================================

class InteractiveObject {

  constructor(scene, x, y, config = {}) {
    this.scene      = scene;
    this.x          = x;
    this.y          = y;
    this.id         = config.id      || 'object_' + Math.random().toString(36).slice(2);
    this.type       = config.type    || FORK_CONFIG.OBJECT_TYPES.OBJECT;
    this.label      = config.label   || 'OBJECT';
    this.enabled    = config.enabled !== undefined ? config.enabled : true;
    this.onInteract = config.onInteract || null;

    const w     = config.width  || 32;
    const h     = config.height || 32;
    const color = config.color  || FORK_CONFIG.COLORS.ACCENT_DIM;

    // Corpo visual
    this._body = scene.add.rectangle(x, y, w, h, color, 0.85)
      .setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_DIM)
      .setDepth(5);

    // Label
    this._label = scene.add.text(x, y - h / 2 - 8, this.label, {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE, fontSize: '16px', color: FORK_CONFIG.FONT.COLOR_MID,
    }).setOrigin(0.5, 1).setDepth(6);

    // Ícone
    this._icon = scene.add.text(x, y, this._getTypeIcon(), {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE, fontSize: '16px', color: FORK_CONFIG.FONT.COLOR_MID,
    }).setOrigin(0.5, 0.5).setDepth(6);

    // Indicador [E] — começa invisível
    // FIX: posição inicial correta para o tween
    this._indicatorY = y - h / 2 - 20;
    this._indicator  = scene.add.text(x, this._indicatorY, '[E]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE, fontSize: '18px', color: FORK_CONFIG.FONT.COLOR_BRIGHT,
    }).setOrigin(0.5, 1).setDepth(7).setVisible(false);

    // FIX: hitbox usando zone + physics.add.existing em vez de staticImage sem texture
    this._zone = scene.add.zone(x, y, w, h);
    scene.physics.add.existing(this._zone, true); // true = static
    this._zone.body.setSize(w, h);
    this._zone._owner = this;

    // Expõe o zone como physicsBody para colisão externa se necessário
    this.physicsBody = this._zone;

    this._setupIndicatorTween();
    this._updateAvailability();
  }

  // ── Update ────────────────────────────────────────────────

  update(playerX, playerY) {
    if (!this.enabled) return;

    const dist    = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const inRange = dist <= FORK_CONFIG.INTERACT_RANGE;

    this._indicator.setVisible(inRange);

    // FIX: setStrokeStyle com thickness e color corretos
    if (inRange) {
      this._body.setStrokeStyle(2, FORK_CONFIG.COLORS.ACCENT);
    } else {
      this._body.setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_DIM);
    }
  }

  interact() {
    if (!this.enabled) return false;
    console.log(`[OBJECT] Interacting: ${this.id}`);
    if (this.onInteract) { this.onInteract(this); return true; }
    return false;
  }

  setEnabled(val) {
    this.enabled = val;
    const alpha  = val ? 1 : 0.3;
    this._body.setAlpha(alpha);
    this._icon.setAlpha(alpha);
    this._label.setAlpha(alpha);
    if (!val) this._indicator.setVisible(false);
  }

  destroy() {
    this._body.destroy();
    this._label.destroy();
    this._icon.destroy();
    this._indicator.destroy();
    this._zone.destroy();
  }

  // ── Helpers ───────────────────────────────────────────────

  _getTypeIcon() {
    const icons = {
      [FORK_CONFIG.OBJECT_TYPES.TERMINAL]: '[>_]',
      [FORK_CONFIG.OBJECT_TYPES.FILE]:     '[FILE]',
      [FORK_CONFIG.OBJECT_TYPES.DOOR]:     '[DOOR]',
      [FORK_CONFIG.OBJECT_TYPES.SERVER]:   '[SRV]',
      [FORK_CONFIG.OBJECT_TYPES.PANEL]:    '[PNL]',
      [FORK_CONFIG.OBJECT_TYPES.CAMERA]:   '[CAM]',
      [FORK_CONFIG.OBJECT_TYPES.OBJECT]:   '[OBJ]',
    };
    return icons[this.type] || '[?]';
  }

  // FIX: tween oscila entre indicatorY e indicatorY-8 (relativo, não absoluto)
  _setupIndicatorTween() {
    this.scene.tweens.add({
      targets:  this._indicator,
      y:        this._indicatorY - 8,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  _updateAvailability() {}
}
