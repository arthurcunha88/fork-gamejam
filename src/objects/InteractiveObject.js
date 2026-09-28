// ============================================================
// FORK — InteractiveObject.js
// Objetos interativos com visuais específicos de equipamento.
// ============================================================

class InteractiveObject {

  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.id = config.id || 'object_' + Math.random().toString(36).slice(2);
    this.type = config.type || FORK_CONFIG.OBJECT_TYPES.OBJECT;
    this.label = config.label || 'OBJECT';
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.onInteract = config.onInteract || null;
    this.visual = config.visual || null;

    const w = config.width || 32;
    const h = config.height || 32;
    const color = config.color || FORK_CONFIG.COLORS.ACCENT_DIM;

    this._body = scene.add.graphics().setDepth(5);
    this._drawVisual(w, h, color);

    const labelColor = this.visual ? '#b9c8d8' : '#7ed6ff';
    this._label = scene.add.text(x, y - h / 2 - 8, this.label, {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE,
      fontSize: this.visual ? '14px' : '17px',
      color: labelColor,
      shadow: { offsetX: 0, offsetY: 0, color: this.visual ? '#4b647a' : '#4ac8ff', blur: 6, fill: true },
    }).setOrigin(0.5, 1).setDepth(6);

    this._icon = scene.add.text(x, y, this.visual ? '' : this._getTypeIcon(), {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE,
      fontSize: '17px',
      color: '#8fe8ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#4ac8ff', blur: 8, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(6);

    this._indicatorY = y - h / 2 - 20;
    this._indicator = scene.add.text(x, this._indicatorY, '[E]', {
      fontFamily: FORK_CONFIG.FONT.FAMILY_TITLE,
      fontSize: '20px',
      color: '#8fe8ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#4ac8ff', blur: 14, fill: true },
    }).setOrigin(0.5, 1).setDepth(7).setVisible(false);

    this._zone = scene.add.zone(x, y, w, h);
    scene.physics.add.existing(this._zone, true);
    this._zone.body.setSize(w, h);
    this._zone._owner = this;
    this.physicsBody = this._zone;

    this._setupIndicatorTween();
    this._updateAvailability();
  }

  _drawVisual(w, h, color) {
    const g = this._body;
    const C = FORK_CONFIG.COLORS;
    const x = this.x - w / 2;
    const y = this.y - h / 2;

    if (this.visual === 'cabinet') {
      g.fillGradientStyle(0x26313b, 0x121a22, 0x1a222b, 0x0b1015, 1, 1, 1, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(1, 0x718294, 0.75);
      g.strokeRoundedRect(x, y, w, h, 5);
      g.lineStyle(1, 0x0a0e13, 0.9);
      g.strokeRect(x + 5, y + 8, w - 10, h - 16);
      g.fillStyle(0x4d5b68, 1);
      g.fillRoundedRect(this.x - 3, y + 15, 2, 2, 1);
      g.fillRoundedRect(this.x - 3, y + 31, 2, 2, 1);
      g.fillStyle(0x79a7c4, 0.75);
      g.fillRect(this.x - 7, y + 13, 14, 1);
      g.fillRect(this.x - 7, y + 29, 14, 1);
      return;
    }

    if (this.visual === 'monitor') {
      g.fillStyle(0x1c2731, 1);
      g.fillRoundedRect(x, y, w, h, 4);
      g.lineStyle(1, 0x66798a, 0.9);
      g.strokeRoundedRect(x, y, w, h, 4);
      g.fillGradientStyle(0x102331, 0x071018, 0x0a1822, 0x03080d, 1, 1, 1, 1);
      g.fillRoundedRect(x + 3, y + 3, w - 6, h - 8, 2);
      g.lineStyle(1, 0x5aa6c7, 0.4);
      g.lineBetween(x + 5, y + 8, x + w - 5, y + 8);
      g.lineBetween(x + 5, y + 13, x + w - 12, y + 13);
      g.fillStyle(0x77c9e8, 0.8);
      g.fillCircle(x + w - 6, y + h - 4, 1.5);
      g.fillStyle(0x26343e, 1);
      g.fillRect(this.x - 5, y + h, 10, 3);
      g.fillRect(this.x - 2, y + h + 3, 4, 2);
      return;
    }

    if (this.visual === 'rack') {
      g.fillStyle(0x151c24, 1);
      g.fillRoundedRect(x, y, w, h, 3);
      g.lineStyle(1, 0x657788, 0.85);
      g.strokeRoundedRect(x, y, w, h, 3);
      for (let row = 0; row < 5; row++) {
        const ry = y + 5 + row * 9;
        g.fillStyle(0x202d38, 1);
        g.fillRect(x + 4, ry, w - 8, 6);
        g.fillStyle(row % 2 ? 0x70b7d4 : 0x86d4a4, 0.8);
        g.fillCircle(x + w - 8, ry + 3, 1.5);
        g.fillStyle(0x566a7a, 0.8);
        g.fillRect(x + 8, ry + 2, 12, 1);
      }
      return;
    }

    // Visual padrão para objetos narrativos.
    g.fillStyle(color, 0.85);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1, C.ACCENT_DIM, 0.9);
    g.strokeRoundedRect(x, y, w, h, 4);
  }

  update(playerX, playerY) {
    if (!this.enabled) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const inRange = dist <= FORK_CONFIG.INTERACT_RANGE;
    this._indicator.setVisible(inRange);

    if (inRange && !this.visual) {
      this._body.clear();
      this._body.fillStyle(FORK_CONFIG.COLORS.ACCENT, 0.95);
      this._body.fillRoundedRect(this.x - 16, this.y - 16, 32, 32, 4);
      this._body.lineStyle(2, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 1);
      this._body.strokeRoundedRect(this.x - 16, this.y - 16, 32, 32, 4);
    } else if (!this.visual && !inRange) {
      this._body.clear();
      this._drawVisual(32, 32, FORK_CONFIG.COLORS.ACCENT_DIM);
    }
  }

  interact() {
    if (!this.enabled) return false;
    console.log('[OBJECT] Interacting: ' + this.id);
    if (this.onInteract) { this.onInteract(this); return true; }
    return false;
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) {
      this._indicator.setVisible(false);
      this.scene.tweens.add({
        targets: [this._body, this._label, this._icon],
        alpha: 0,
        scale: { from: 1, to: 0.55 },
        duration: 220,
        ease: 'Power2',
      });
    } else {
      [this._body, this._label, this._icon].forEach(target => target.setAlpha(1).setScale(1));
    }
  }

  destroy() {
    if (this._indicator) this._indicator.destroy();
    if (this._body) this._body.destroy();
    if (this._label) this._label.destroy();
    if (this._icon) this._icon.destroy();
    if (this._zone) this._zone.destroy();
    this.enabled = false;
  }

  removeFromSimulation() {
    this.enabled = false;
    this._indicator.setVisible(false);
    const targets = [this._body, this._label, this._icon];
    this.scene.tweens.add({
      targets,
      alpha: 0,
      scale: { from: 1, to: 0.1 },
      duration: 360,
      ease: 'Back.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  _getTypeIcon() {
    const icons = {
      [FORK_CONFIG.OBJECT_TYPES.TERMINAL]: '[>_]',
      [FORK_CONFIG.OBJECT_TYPES.FILE]: '[FILE]',
      [FORK_CONFIG.OBJECT_TYPES.DOOR]: '[DOOR]',
      [FORK_CONFIG.OBJECT_TYPES.SERVER]: '[SRV]',
      [FORK_CONFIG.OBJECT_TYPES.PANEL]: '[PNL]',
      [FORK_CONFIG.OBJECT_TYPES.CAMERA]: '[CAM]',
      [FORK_CONFIG.OBJECT_TYPES.OBJECT]: '[OBJ]',
    };
    return icons[this.type] || '[?]';
  }

  _setupIndicatorTween() {
    this.scene.tweens.add({
      targets: this._indicator,
      y: this._indicatorY - 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _updateAvailability() {}
}
