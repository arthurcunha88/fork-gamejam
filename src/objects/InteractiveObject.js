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

    this._selectionFrame = scene.add.graphics().setDepth(6).setVisible(false);
    this._selectionW = w + 10;
    this._selectionH = h + 10;
    this._selectionFrame.lineStyle(1.5, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 0.9);
    this._selectionFrame.strokeRoundedRect(
      x - this._selectionW / 2,
      y - this._selectionH / 2,
      this._selectionW,
      this._selectionH,
      5
    );

    this._selectionPulse = scene.tweens.add({
      targets: this._selectionFrame,
      alpha: { from: 0.35, to: 0.95 },
      scale: { from: 0.96, to: 1.04 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });

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

    if (this.visual === 'door') {
      // Porta embutida: moldura metálica, painel central e leitura luminosa.
      const frameX = x - 4;
      const frameY = y - 5;
      const frameW = w + 8;
      const frameH = h + 10;
      const unlocked = color === C.ACCENT;

      g.fillStyle(0x0a1117, 0.98);
      g.fillRoundedRect(frameX, frameY, frameW, frameH, 5);
      g.lineStyle(1.5, unlocked ? C.ACCENT_DIM : 0x394752, 0.95);
      g.strokeRoundedRect(frameX, frameY, frameW, frameH, 5);

      g.fillStyle(unlocked ? 0x14252b : 0x111920, 1);
      g.fillRoundedRect(x, y, w, h, 3);

      // Divisão central e barras da porta.
      g.lineStyle(1, unlocked ? 0x3e8fa8 : 0x36434d, 0.9);
      g.lineBetween(this.x, y + 3, this.x, y + h - 3);
      g.lineBetween(x + 7, y + 5, x + w - 7, y + 5);
      g.lineBetween(x + 7, y + h - 5, x + w - 7, y + h - 5);

      // Indicador de acesso.
      g.fillStyle(unlocked ? C.ACCENT_BRIGHT : 0x687781, 0.9);
      g.fillCircle(x + w - 7, this.y, 2);
      g.lineStyle(1, unlocked ? C.ACCENT : 0x45525b, 0.55);
      g.strokeCircle(x + w - 7, this.y, 4);

      // Pequenas ranhuras dão volume sem virar um bloco colorido.
      g.lineStyle(1, unlocked ? 0x2b6476 : 0x27333b, 0.65);
      for (let i = 0; i < 4; i++) {
        const rx = x + 9 + i * ((w - 24) / 3);
        g.lineBetween(rx, y + 8, rx, y + h - 8);
      }
      return;
    }

    if (this.visual === 'camera') {
      // Câmera de segurança com suporte e lente, em vez de um quadrado azul.
      const bodyW = w - 8;
      const bodyH = h - 10;
      const bx = this.x - bodyW / 2;
      const by = this.y - bodyH / 2 - 2;

      g.fillStyle(0x111a21, 0.98);
      g.fillRoundedRect(bx, by, bodyW, bodyH, 7);
      g.lineStyle(1.5, 0x5b6b77, 0.9);
      g.strokeRoundedRect(bx, by, bodyW, bodyH, 7);

      // Aba superior e braço de fixação.
      g.fillStyle(0x1c2932, 1);
      g.fillRoundedRect(this.x - 10, by - 5, 20, 5, 2);
      g.fillRect(this.x - 2, by - 10, 4, 7);
      g.fillStyle(0x2d3b45, 1);
      g.fillRoundedRect(this.x - 8, by - 12, 16, 4, 2);

      // Lente.
      g.fillStyle(0x071018, 1);
      g.fillCircle(this.x, this.y - 1, 7);
      g.lineStyle(1, 0x7392a3, 0.85);
      g.strokeCircle(this.x, this.y - 1, 7);
      g.fillStyle(0x8fe8ff, 0.85);
      g.fillCircle(this.x + 2, this.y - 3, 2);
      g.fillStyle(0x0b1015, 1);
      g.fillCircle(this.x + 2, this.y - 3, 0.9);

      // LED discreto de gravação.
      g.fillStyle(0xff7b88, 0.95);
      g.fillCircle(bx + bodyW - 5, by + 5, 1.5);
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

  update(playerX, playerY, selectedObject = null) {
    if (!this.enabled) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const inRange = dist <= FORK_CONFIG.INTERACT_RANGE;
    const isSelected = inRange && (!selectedObject || selectedObject === this);

    this._indicator.setVisible(isSelected);
    this._selectionFrame.setVisible(isSelected);

    if (isSelected) {
      this._selectionPulse.resume();
      this._label.setColor('#9be8ff');
      this._label.setShadow(0, 0, '#59d8ff', 9, true, true);
      this._indicator.setAlpha(1);
    } else {
      this._selectionPulse.pause();
      this._selectionFrame.setAlpha(0);
      this._selectionFrame.setScale(1);
      this._label.setColor(this.visual ? '#b9c8d8' : '#7ed6ff');
      this._label.setShadow(0, 0, this.visual ? '#4b647a' : '#4ac8ff', 6, true, true);
    }

    // Apenas objetos narrativos usam o preenchimento de destaque.
    // Equipamentos decorativos recebem somente o frame de seleção.
    if (isSelected && !this.visual) {
      this._body.clear();
      this._body.fillStyle(FORK_CONFIG.COLORS.ACCENT, 0.95);
      this._body.fillRoundedRect(this.x - 16, this.y - 16, 32, 32, 4);
      this._body.lineStyle(2, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 1);
      this._body.strokeRoundedRect(this.x - 16, this.y - 16, 32, 32, 4);
    } else if (!isSelected && !this.visual) {
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
    if (this._selectionPulse) this._selectionPulse.remove();
    if (this._selectionFrame) this._selectionFrame.destroy();
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
