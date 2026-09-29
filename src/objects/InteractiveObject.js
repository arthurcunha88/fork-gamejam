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
      g.fillStyle(0x131d25, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, 0x647681, 0.85);
      g.strokeRect(x, y, w, h);
      g.fillStyle(0x1d2a33, 1);
      g.fillRect(x + 5, y + 7, w - 10, h - 14);
      for (let row = 0; row < 2; row++) {
        const ry = y + 12 + row * 22;
        g.fillStyle(0x0b1218, 1);
        g.fillRect(x + 8, ry, w - 16, 14);
        g.fillStyle(row ? C.PURPLE : C.ACCENT, 0.28);
        g.fillRect(x + 12, ry + 4, w - 24, 3);
        g.fillStyle(C.MAGENTA, 0.38);
        g.fillRect(x + w - 12, ry + 4, 3, 3);
      }
      g.fillStyle(0x738793, 0.8);
      g.fillRect(this.x - 2, y + h - 7, 4, 2);
      return;
    }

    if (this.visual === 'monitor') {
      g.fillStyle(0x111b22, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, 0x6b7f8b, 0.9);
      g.strokeRect(x, y, w, h);
      g.fillStyle(0x07131b, 1);
      g.fillRect(x + 3, y + 3, w - 6, h - 9);
      g.fillStyle(C.ACCENT, 0.28);
      g.fillRect(x + 6, y + 7, w - 12, 2);
      g.fillStyle(C.PURPLE, 0.25);
      g.fillRect(x + 6, y + 13, w - 20, 2);
      g.fillStyle(C.MAGENTA, 0.40);
      g.fillRect(x + 6, y + 19, Math.max(8, w - 28), 2);
      g.fillStyle(C.GREEN, 0.85);
      g.fillRect(x + w - 8, y + h - 7, 3, 3);
      g.fillStyle(0x27343d, 1);
      g.fillRect(this.x - 6, y + h, 12, 3);
      g.fillRect(this.x - 2, y + h + 3, 4, 3);
      return;
    }

    if (this.visual === 'server') {
      g.fillStyle(0x0c151c, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, 0x647984, 0.9);
      g.strokeRect(x, y, w, h);
      for (let row = 0; row < 6; row++) {
        const ry = y + 4 + row * ((h - 10) / 6);
        g.fillStyle(0x18262f, 1);
        g.fillRect(x + 4, ry, w - 8, 7);
        g.fillStyle(row % 2 ? C.ACCENT : C.PURPLE, 0.62);
        g.fillRect(x + 7, ry + 2, Math.max(6, w - 20), 2);
        g.fillStyle(row % 3 === 0 ? C.GREEN : C.MAGENTA, 0.8);
        g.fillRect(x + w - 9, ry + 2, 3, 3);
      }
      return;
    }

    if (this.visual === 'panel') {
      g.fillStyle(0x0d171e, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, 0x627985, 0.9);
      g.strokeRect(x, y, w, h);
      g.fillStyle(0x16242d, 1);
      g.fillRect(x + 4, y + 4, w - 8, h - 8);
      g.fillStyle(C.PURPLE, 0.30);
      g.fillRect(x + 7, y + 7, w - 14, 4);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(i === 0 ? C.ACCENT : (i === 1 ? C.MAGENTA : C.GREEN), 0.65);
        g.fillRect(x + 8, y + 15 + i * 6, 5, 3);
        g.fillStyle(0x4d6570, 0.8);
        g.fillRect(x + 17, y + 15 + i * 6, Math.max(7, w - 26), 3);
      }
      return;
    }

    if (this.visual === 'file') {
      // Arquivo físico: papel/cartão com pixels de "fita" e etiqueta.
      g.fillStyle(0x0a1117, 0.95);
      g.fillRect(x + 2, y + 2, w - 1, h - 1);
      g.fillStyle(0xd4d8dc, 0.96);
      g.fillRect(x, y, w - 4, h - 3);
      g.lineStyle(1, 0x74828a, 0.9);
      g.strokeRect(x, y, w - 4, h - 3);
      g.fillStyle(C.PURPLE, 0.72);
      g.fillRect(x + 3, y + 4, w - 10, 4);
      g.fillStyle(C.MAGENTA, 0.55);
      g.fillRect(x + 3, y + 11, w - 12, 2);
      g.fillStyle(0x65747b, 0.8);
      for (let i = 0; i < 3; i++) g.fillRect(x + 3, y + 16 + i * 4, w - 11 - i * 3, 2);
      return;
    }

    if (this.visual === 'entity') {
      // Pequeno objeto desconhecido, deliberadamente mais "sprite" que UI.
      g.fillStyle(0x080c12, 1);
      g.fillRect(x + 3, y + 3, w - 6, h - 6);
      g.lineStyle(1.5, C.PURPLE, 0.9);
      g.strokeRect(x + 3, y + 3, w - 6, h - 6);
      g.fillStyle(C.MAGENTA, 0.22);
      g.fillRect(x + 6, y + 6, w - 12, h - 12);
      g.fillStyle(C.PURPLE, 0.9);
      g.fillRect(this.x - 3, this.y - 3, 6, 6);
      g.fillStyle(C.ACCENT_BRIGHT, 0.9);
      g.fillRect(this.x - 1, this.y - 1, 2, 2);
      g.fillStyle(0x0a1016, 1);
      g.fillRect(x + 2, y + 2, 3, 3);
      g.fillRect(x + w - 5, y + 2, 3, 3);
      return;
    }

    if (this.visual === 'memory') {
      g.fillStyle(0x0b141b, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, C.WARNING, 0.78);
      g.strokeRect(x, y, w, h);
      g.fillStyle(0x18232b, 1);
      g.fillRect(x + 4, y + 4, w - 8, h - 8);
      for (let i = 0; i < 4; i++) {
        g.fillStyle(i % 2 ? C.PURPLE : C.ACCENT, 0.5);
        g.fillRect(x + 7 + i * 7, y + 8, 4, h - 16);
      }
      g.fillStyle(C.WARNING, 0.9);
      g.fillRect(x + 7, y + 4, w - 14, 3);
      g.fillStyle(C.MAGENTA, 0.65);
      g.fillRect(x + w - 9, y + h - 8, 4, 4);
      return;
    }

    if (this.visual === 'observer') {
      g.fillStyle(0x0a1219, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, C.ACCENT_BRIGHT, 0.85);
      g.strokeRect(x, y, w, h);
      g.fillStyle(0x16242d, 1);
      g.fillRect(x + 4, y + 4, w - 8, h - 16);
      g.fillStyle(C.PURPLE, 0.30);
      g.fillRect(x + 7, y + 7, w - 14, 5);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(i === 1 ? C.MAGENTA : C.ACCENT, 0.72);
        g.fillRect(x + 8 + i * 12, y + 17, 7, 5);
      }
      g.fillStyle(0x526a75, 0.8);
      g.fillRect(x + 7, y + h - 9, w - 14, 3);
      return;
    }

    if (this.visual === 'door') {
      const frameX = x - 7;
      const frameY = y - 7;
      const frameW = w + 14;
      const frameH = h + 14;
      const unlocked = color === C.ACCENT;

      // Moldura grossa, recuada, para a porta parecer parte da arquitetura.
      g.fillStyle(0x050a0f, 1);
      g.fillRect(frameX, frameY, frameW, frameH);
      g.lineStyle(2, unlocked ? C.ACCENT : 0x65747c, 0.98);
      g.strokeRect(frameX, frameY, frameW, frameH);
      g.lineStyle(1, unlocked ? C.PURPLE : 0x303d45, 0.72);
      g.strokeRect(frameX + 4, frameY + 4, frameW - 8, frameH - 8);

      // Porta dupla com leitura de "elevador/airlock".
      g.fillGradientStyle(
        unlocked ? 0x17363f : 0x18232a,
        unlocked ? 0x0b1a22 : 0x0c1217,
        unlocked ? 0x102832 : 0x111a20,
        0x060b10, 1, 1, 1, 1
      );
      g.fillRect(x, y, w, h);

      g.lineStyle(1, unlocked ? C.ACCENT_BRIGHT : 0x52626b, 0.82);
      g.strokeRect(x, y, w, h);

      // Trilhos e folhas deslizantes.
      g.lineStyle(1, unlocked ? C.PURPLE : 0x43525a, 0.7);
      g.lineBetween(x + 7, this.y - 6, x + w - 7, this.y - 6);
      g.lineBetween(x + 7, this.y + 6, x + w - 7, this.y + 6);
      g.lineStyle(2, unlocked ? C.ACCENT : 0x35434b, 0.9);
      g.lineBetween(this.x, y + 4, this.x, y + h - 4);

      // Leitor vertical.
      const readerX = x + w - 10;
      g.fillStyle(0x091118, 1);
      g.fillRect(readerX - 3, y + 5, 6, h - 10);
      g.lineStyle(1, unlocked ? C.ACCENT_BRIGHT : C.WARNING, 0.85);
      g.strokeRect(readerX - 3, y + 5, 6, h - 10);
      g.fillStyle(unlocked ? C.GREEN : C.WARNING, 0.95);
      g.fillRect(readerX - 1, this.y - 8, 2, 4);
      g.fillStyle(0x52646e, 0.9);
      g.fillRect(readerX - 1, this.y, 2, 4);
      g.fillRect(readerX - 1, this.y + 8, 2, 4);

      // Faixa de piso/threshold.
      g.fillStyle(unlocked ? C.ACCENT : C.WARNING, 0.20);
      g.fillRect(x - 4, y + h + 4, w + 8, 4);
      return;
    }

    if (this.visual === 'camera') {
      const bodyW = w - 6;
      const bodyH = h - 8;
      const bx = this.x - bodyW / 2;
      const by = this.y - bodyH / 2 + 2;

      // Suporte em dois degraus, como sprite de equipamento.
      g.fillStyle(0x151f27, 1);
      g.fillRect(this.x - 8, by - 12, 16, 5);
      g.fillStyle(0x080e13, 1);
      g.fillRect(this.x - 3, by - 18, 6, 8);

      g.fillStyle(0x202e37, 1);
      g.fillRect(bx, by, bodyW, bodyH);
      g.lineStyle(1.5, 0x6d808a, 0.92);
      g.strokeRect(bx, by, bodyW, bodyH);

      // Visor e lente.
      g.fillStyle(0x0a1218, 1);
      g.fillRect(this.x - 15, by + 6, 30, 18);
      g.lineStyle(1, C.PURPLE, 0.78);
      g.strokeRect(this.x - 15, by + 6, 30, 18);
      g.fillStyle(0x02070b, 1);
      g.fillRect(this.x - 8, by + 10, 16, 10);
      g.fillStyle(C.ACCENT_BRIGHT, 0.88);
      g.fillRect(this.x - 4, by + 11, 3, 3);
      g.fillStyle(C.MAGENTA, 0.65);
      g.fillRect(this.x + 2, by + 16, 3, 3);

      // LED de gravação e parafusos.
      g.fillStyle(C.DANGER, 0.95);
      g.fillRect(bx + bodyW - 7, by + 5, 3, 3);
      g.fillStyle(0x7b8b93, 0.7);
      g.fillRect(bx + 5, by + 5, 2, 2);
      g.fillRect(bx + 5, by + bodyH - 7, 2, 2);
      return;
    }

    if (this.visual === 'rack') {
      g.fillStyle(0x111a21, 1);
      g.fillRect(x, y, w, h);
      g.lineStyle(1.5, 0x667983, 0.85);
      g.strokeRect(x, y, w, h);
      for (let row = 0; row < 5; row++) {
        const ry = y + 5 + row * 9;
        g.fillStyle(0x202d36, 1);
        g.fillRect(x + 4, ry, w - 8, 6);
        g.fillStyle(row % 2 ? C.ACCENT : C.PURPLE, 0.7);
        g.fillRect(x + 8, ry + 2, 12, 2);
        g.fillStyle(row % 3 ? C.GREEN : C.MAGENTA, 0.8);
        g.fillRect(x + w - 9, ry + 2, 3, 3);
      }
      return;
    }

    // Visual padrão.
    g.fillStyle(color, 0.85);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, C.ACCENT_DIM, 0.9);
    g.strokeRect(x, y, w, h);
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
