// ============================================================
// FORK — UIManager.js
// Modal centralizado para código, palavra e sequência.
// ============================================================

class UIManager {
  constructor(scene, loopManager) {
    this.scene = scene;
    this.loopManager = loopManager;
    this.current = null;
    this._keyHandler = null;
  }

  get isOpen() { return !!this.current; }

  _destroyObject(obj) {
    if (obj && !obj.destroyed && obj.destroy) obj.destroy();
  }

  openModal(config = {}) {
    this.closeModal(true);

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    const container = this.scene.add.container(0, 0)
      .setDepth(config.depth || 200)
      .setScrollFactor(0);

    const overlay = this.scene.add.rectangle(0, 0, W, H, 0x000000, config.overlayAlpha ?? 0.78)
      .setOrigin(0, 0)
      .setInteractive();

    const boxW = config.width || 420;
    const boxH = config.height || 240;

    const box = this.scene.add.rectangle(W / 2, H / 2, boxW, boxH, C.TERMINAL_BG, 0.98)
      .setStrokeStyle(1, config.color || C.ACCENT_DIM);

    const title = this.scene.add.text(
      W / 2,
      H / 2 - boxH / 2 + 18,
      config.title || '// SYSTEM',
      {
        fontFamily: F.FAMILY_TITLE,
        fontSize: '19px',
        color: config.titleColor || F.COLOR_PRIMARY,
      }
    ).setOrigin(0.5, 0);

    const close = this.scene.add.text(
      W / 2 + boxW / 2 - 12,
      H / 2 - boxH / 2 + 10,
      '[X]',
      {
        fontFamily: F.FAMILY,
        fontSize: '11px',
        color: F.COLOR_DIM,
      }
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    container.add([overlay, box, title, close]);

    this.current = {
      container,
      overlay,
      box,
      title,
      close,
      objects: [],
      cleanup: null,
      paused: !!this.loopManager,
    };

    if (this.loopManager) this.loopManager.pause();

    overlay.on('pointerdown', () => {
      if (config.closeOnOverlay !== false) this.closeModal();
    });

    close.on('pointerdown', () => this.closeModal());

    container.setAlpha(0);
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 180,
      ease: 'Quad.easeOut',
    });

    this._keyHandler = (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        e.stopPropagation?.();
        this.closeModal();
      }
    };

    this.scene.input.keyboard.on('keydown', this._keyHandler);
    GameState.volatile.modal_open = true;

    return this.current;
  }

  add(obj) {
    if (!this.current) return obj;
    this.current.container.add(obj);
    this.current.objects.push(obj);
    return obj;
  }

  closeModal(immediate = false, callback = null) {
    const modal = this.current;
    if (!modal) return;

    this.current = null;

    if (this._keyHandler) {
      this.scene.input.keyboard.off('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    if (modal.cleanup) modal.cleanup();

    GameState.volatile.modal_open = false;

    const finish = () => {
      modal.objects.slice().reverse().forEach(obj => this._destroyObject(obj));
      this._destroyObject(modal.close);
      this._destroyObject(modal.title);
      this._destroyObject(modal.box);
      this._destroyObject(modal.overlay);
      this._destroyObject(modal.container);

      if (modal.paused && this.loopManager) this.loopManager.resume();
      if (callback) callback();
    };

    if (immediate) finish();
    else {
      this.scene.tweens.add({
        targets: modal.container,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: finish,
      });
    }
  }

  _openTextInput(config, validator, success) {
    const modal = this.openModal({
      title: config.title,
      width: config.width || 420,
      height: config.height || 250,
    });

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;

    let value = '';

    const display = this.add(this.scene.add.text(W / 2, H / 2 - 30, '_', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: config.fontSize || '42px',
      color: F.COLOR_PRIMARY,
      letterSpacing: 5,
    }).setOrigin(0.5));

    const feedback = this.add(this.scene.add.text(W / 2, H / 2 + 36, '', {
      fontFamily: F.FAMILY,
      fontSize: '11px',
      color: F.COLOR_DANGER,
    }).setOrigin(0.5));

    this.add(this.scene.add.text(
      W / 2,
      H / 2 + 68,
      '[ ENTER ] confirm   [ ESC ] cancel',
      {
        fontFamily: F.FAMILY,
        fontSize: '10px',
        color: F.COLOR_DIM,
      }
    ).setOrigin(0.5));

    const update = () => display.setText(value || '_');

    const handler = (e) => {
      if (!this.current) return;

      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
        value = value.slice(0, -1);
        update();
        return;
      }

      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        const ok = validator(value);

        if (ok) {
          feedback.setColor(F.COLOR_PRIMARY).setText('// ACCESS GRANTED');
          if (window.AudioManagerInstance) window.AudioManagerInstance.playSuccess();
          if (window.AnimationManagerInstance) window.AnimationManagerInstance.flash('success');

          this.scene.time.delayedCall(260, () => {
            this.closeModal(false, () => success(value));
          });
        } else {
          feedback.setText(config.errorText || '// INVALID INPUT');
          value = '';
          update();
          if (window.AudioManagerInstance) window.AudioManagerInstance.playError();
        }

        return;
      }

      if (e.key && e.key.length === 1 && value.length < (config.maxLength || 32)) {
        if (config.numeric && !/[0-9]/.test(e.key)) return;

        value += config.uppercase ? e.key.toUpperCase() : e.key;
        update();
      }
    };

    this.scene.input.keyboard.on('keydown', handler);

    modal.cleanup = () => {
      this.scene.input.keyboard.off('keydown', handler);
    };

    return modal;
  }

  openCodeInput(config = {}) {
    const length = config.length || 4;

    return this._openTextInput(
      {
        ...config,
        title: config.title || '// CODE INPUT',
        numeric: true,
        maxLength: length,
      },
      value => value.length === length && config.validator(value),
      config.onSuccess || (() => {})
    );
  }

  openWordInput(config = {}) {
    return this._openTextInput(
      {
        ...config,
        title: config.title || '// WORD INPUT',
        uppercase: true,
        maxLength: config.maxLength || 24,
      },
      value => !!value && config.validator(value),
      config.onSuccess || (() => {})
    );
  }

  openSequence(config = {}) {
    const modal = this.openModal({
      ...config,
      title: config.title || '// SEQUENCE',
      height: config.height || 300,
    });

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;
    const selected = [];
    const buttons = [];

    const display = this.add(this.scene.add.text(
      W / 2,
      H / 2 + 58,
      'sequence: []',
      { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_MID }
    ).setOrigin(0.5));

    const feedback = this.add(this.scene.add.text(
      W / 2,
      H / 2 + 84,
      '',
      { fontFamily: F.FAMILY, fontSize: '11px', color: F.COLOR_DANGER }
    ).setOrigin(0.5));

    (config.items || []).forEach((item, i, items) => {
      const x = W / 2 - ((items.length - 1) * 30) + i * 60;
      const y = H / 2 - 12;

      const btn = this.add(this.scene.add.rectangle(
        x, y, 44, 44, FORK_CONFIG.COLORS.ACCENT_DIM, 0.3
      ).setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_DIM)
       .setInteractive({ useHandCursor: true }));

      const label = this.add(this.scene.add.text(x, y, String(item), {
        fontFamily: F.FAMILY_TITLE,
        fontSize: '28px',
        color: F.COLOR_PRIMARY,
      }).setOrigin(0.5));

      buttons.push({ item, btn, label });

      btn.on('pointerover', () => {
        if (!selected.includes(item)) btn.setFillStyle(FORK_CONFIG.COLORS.ACCENT, 0.2);
      });

      btn.on('pointerout', () => {
        if (!selected.includes(item)) btn.setFillStyle(FORK_CONFIG.COLORS.ACCENT_DIM, 0.3);
      });

      btn.on('pointerdown', () => {
        if (selected.includes(item) || !this.current) return;

        selected.push(item);
        btn.setFillStyle(FORK_CONFIG.COLORS.ACCENT, 0.55);
        label.setColor(F.COLOR_BRIGHT);
        display.setText('sequence: [' + selected.join(' > ') + ']');

        if (window.AudioManagerInstance) window.AudioManagerInstance.playBeep();

        if (selected.length === items.length) {
          const ok = config.validator(selected);

          feedback
            .setColor(ok ? F.COLOR_PRIMARY : F.COLOR_DANGER)
            .setText(ok ? '// SEQUENCE ACCEPTED' : '// SEQUENCE REJECTED');

          if (ok && window.AudioManagerInstance) window.AudioManagerInstance.playSuccess();
          if (!ok && window.AudioManagerInstance) window.AudioManagerInstance.playError();

          this.scene.time.delayedCall(350, () => {
            if (ok) {
              this.closeModal(false, () => (config.onSuccess || (() => {}))(selected));
            } else {
              selected.length = 0;
              buttons.forEach(b => {
                b.btn.setFillStyle(FORK_CONFIG.COLORS.ACCENT_DIM, 0.3);
                b.label.setColor(F.COLOR_PRIMARY);
              });
              display.setText('sequence: []');
            }
          });
        }
      });
    });

    return modal;
  }
}
