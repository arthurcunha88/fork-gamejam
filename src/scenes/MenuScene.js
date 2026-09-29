// ============================================================
// FORK — MenuScene.js
// ============================================================

class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  preload() {
    // Emblema oficial do FORK usado também como elemento de identidade
    // na tela inicial.
    this.load.image('fork_emblem_menu', 'assets/fork-emblem.svg');
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    this._selectedIndex = 0;
    this._menuItems = [];
    this._settingsOpen = false;

    this.add.rectangle(0, 0, W, H, C.BG).setOrigin(0, 0);
    this._drawGrid();

    // Emblema FORK no topo da tela inicial. Ele substitui o elemento
    // decorativo anterior e reforça a identidade visual do jogo.
    if (this.textures.exists('fork_emblem_menu')) {
      const emblem = this.add.image(W / 2, 96, 'fork_emblem_menu')
        .setOrigin(0.5)
        .setScale(0.58)
        .setAlpha(0.96)
        .setDepth(4);

      this.tweens.add({
        targets: emblem,
        alpha: { from: 0.96, to: 0.70 },
        scale: { from: 0.58, to: 0.62 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const titleY = H / 2 - 164;
    const title = this.add.text(W / 2, titleY, 'F O R K', {
      fontFamily: F.FAMILY_TITLE, fontSize: '112px', color: F.COLOR_BRIGHT,
      stroke: F.COLOR_PRIMARY, strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 22, stroke: true, fill: true },
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.72 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(W / 2, titleY + 100, 'DIGITAL ESCAPE ROOM', {
      fontFamily: F.FAMILY, fontSize: '12px', color: F.COLOR_MID,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 7, fill: true },
    }).setOrigin(0.5, 0);

    this.add.rectangle(W / 2, titleY + 124, 420, 1, C.ACCENT, 0.5).setOrigin(0.5, 0);

    const menuY = H / 2 + 2;

    this._makeButton(W / 2, menuY, '> NOVO JOGO', () => this._startGame(), true);
    this._makeButton(W / 2, menuY + 42, '> CONFIGURAÇÕES', () => this._showSettings(), true);

    this._selectionArrow = this.add.text(W / 2 - 156, menuY + 2, '▶', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '24px',
      color: F.COLOR_BRIGHT,
    }).setOrigin(0.5);

    this._selectionPulse = this.add.text(W / 2 + 156, menuY + 2, '◀', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '24px',
      color: F.COLOR_BRIGHT,
    }).setOrigin(0.5);

    this._selectionHint = this.add.text(W / 2, menuY + 132, '[ ↑ / ↓ ] NAVEGAR    [ ENTER ] EXECUTAR    [ MOUSE ] ALTERNATIVA', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(0.5);

    this.add.text(W / 2, menuY + 156, 'SEMCOMP GAME JAM 2026', {
      fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_MID,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [this._selectionArrow, this._selectionPulse],
      alpha: { from: 1, to: 0.25 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(W / 2, H - 14, 'NPCboPe  //  GAME JAM', {
      fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM,
    }).setOrigin(0.5, 1);

    this._updateSelection();

    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
      Phaser.Input.Keyboard.KeyCodes.ESC,
    ]);

    this._keyHandler = (event) => {
      // Enquanto um modal estiver aberto, o menu principal não pode receber
      // ENTER/SETAS. Isso evita que o mesmo ENTER ative o menu por trás.
      if (this._settingsOpen) return;

      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) {
        event.preventDefault();
        this._moveSelection(-1);
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) {
        event.preventDefault();
        this._moveSelection(1);
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        event.preventDefault();
        this._activateSelection();
      }
    };

    this.input.keyboard.on('keydown', this._keyHandler);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this._keyHandler));
  }

  _makeButton(x, y, label, onClick, enabled = true) {
    const F = FORK_CONFIG.FONT;
    const btn = this.add.text(x, y, label, {
      fontFamily: F.FAMILY,
      fontSize: '17px',
      color: enabled ? F.COLOR_PRIMARY : F.COLOR_DIM,
      shadow: enabled ? { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 8, fill: true } : undefined,
    }).setOrigin(0.5, 0);

    const item = { btn, onClick, enabled };
    this._menuItems.push(item);

    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        this._selectedIndex = this._menuItems.indexOf(item);
        this._updateSelection();
      });
      btn.on('pointerdown', onClick);
    }

    return btn;
  }

  _moveSelection(direction) {
    if (!this._menuItems.length) return;

    let next = this._selectedIndex;
    for (let i = 0; i < this._menuItems.length; i++) {
      next = (next + direction + this._menuItems.length) % this._menuItems.length;
      if (this._menuItems[next].enabled) {
        this._selectedIndex = next;
        this._updateSelection();
        return;
      }
    }
  }

  _updateSelection() {
    this._menuItems.forEach((item, index) => {
      if (!item.enabled) {
        item.btn.setColor(FORK_CONFIG.FONT.COLOR_DIM).setAlpha(0.45);
        return;
      }

      const selected = index === this._selectedIndex;
      item.btn.setColor(selected ? FORK_CONFIG.FONT.COLOR_WHITE : FORK_CONFIG.FONT.COLOR_PRIMARY);
      item.btn.setShadow(
        0, 0,
        selected ? FORK_CONFIG.FONT.COLOR_BRIGHT : FORK_CONFIG.FONT.COLOR_PRIMARY,
        selected ? 16 : 7,
        true, true
      );
      item.btn.setScale(selected ? 1.04 : 1);
    });

    if (this._selectionArrow && this._menuItems[this._selectedIndex]) {
      const targetY = this._menuItems[this._selectedIndex].btn.y + 9;
      this._selectionArrow.y = targetY;
      this._selectionPulse.y = targetY;
    }
  }

  _activateSelection() {
    const item = this._menuItems[this._selectedIndex];
    if (item && item.enabled) item.onClick();
  }

  _drawPixelButterfly(cx, cy) {
    const C = FORK_CONFIG.COLORS;
    const g = this.add.graphics().setDepth(3);

    const blocks = [
      [-28,-18,18,12,C.PURPLE],[-42,-8,24,14,C.MAGENTA],[-48,7,18,12,C.ACCENT],
      [10,-18,18,12,C.PURPLE],[18,-8,24,14,C.MAGENTA],[30,7,18,12,C.ACCENT],
      [-34,22,22,9,C.PURPLE],[12,22,22,9,C.PURPLE],
      [-5,-22,10,16,C.ORANGE],[-5,-5,10,18,C.GREEN],
      [-11,-29,6,6,C.GREEN],[5,-29,6,6,C.GREEN],[-18,-38,5,5,C.ACCENT],[13,-38,5,5,C.ACCENT],
    ];

    blocks.forEach(([x,y,w,h,color]) => g.fillRect(cx+x, cy+y, w, h));

    const glow = this.add.rectangle(cx, cy, 112, 86, C.PURPLE, 0)
      .setStrokeStyle(1, C.PURPLE, 0.28).setDepth(2);

    const core = this.add.rectangle(cx, cy - 2, 8, 8, C.WHITE, 0.9).setDepth(4);

    this.tweens.add({
      targets: g,
      scaleX: { from: 0.92, to: 1.08 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: [glow, core],
      alpha: { from: 0.2, to: 0.9 },
      scale: { from: 0.9, to: 1.12 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const colors = [C.ACCENT, C.MAGENTA, C.PURPLE, C.GREEN];

    for (let i = 0; i < 12; i++) {
      const p = this.add.rectangle(
        cx + Phaser.Math.Between(-58, 58),
        cy + Phaser.Math.Between(-42, 42),
        Phaser.Math.Between(2, 4),
        Phaser.Math.Between(2, 4),
        colors[i % colors.length],
        0.8
      ).setDepth(4);

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(10, 28),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1700),
        delay: i * 90,
        repeat: -1,
        onRepeat: () => {
          p.x = cx + Phaser.Math.Between(-58, 58);
          p.y = cy + Phaser.Math.Between(-42, 42);
          p.alpha = 0.8;
        },
      });
    }
  }

  _drawMatrixRain() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;
    const glyphs = '01アイウエオカキクケコ<>[]{}+/\\';
    const layer = this.add.container(0, 30).setAlpha(0.16);

    for (let i = 0; i < 34; i++) {
      const x = Phaser.Math.Between(8, W - 8);
      const y = Phaser.Math.Between(35, H);
      const length = Phaser.Math.Between(5, 15);
      let value = '';

      for (let j = 0; j < length; j++) {
        value += glyphs[Phaser.Math.Between(0, glyphs.length - 1)] + '\n';
      }

      const column = this.add.text(x, y, value, {
        fontFamily: F.FAMILY,
        fontSize: Phaser.Math.Between(8, 12) + 'px',
        color: i % 6 === 0 ? F.COLOR_BRIGHT : F.COLOR_DIM
      });

      layer.add(column);

      this.tweens.add({
        targets: column,
        y: y + Phaser.Math.Between(70, 190),
        duration: Phaser.Math.Between(3500, 7000),
        delay: Phaser.Math.Between(0, 2500),
        repeat: -1,
        onRepeat: () => { column.y = Phaser.Math.Between(35, H); }
      });
    }
  }

  _drawServerVisuals() {
    const W = FORK_CONFIG.WIDTH;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const gfx = this.add.graphics();

    gfx.fillStyle(0x010501, 0.92);
    gfx.fillRect(34, 170, 150, 230);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.8);
    gfx.strokeRect(34, 170, 150, 230);

    this.add.text(46, 180, 'SERVER RACK // A', {
      fontFamily: F.FAMILY_TITLE, fontSize: '16px', color: F.COLOR_MID
    });

    for (let i = 0; i < 7; i++) {
      const y = 210 + i * 25;
      gfx.fillStyle(0x030d03, 1);
      gfx.fillRect(46, y, 126, 18);
      gfx.lineStyle(1, C.ACCENT_DIM, 0.45);
      gfx.strokeRect(46, y, 126, 18);

      this.add.text(52, y + 3, 'NODE-' + String(i + 1).padStart(2, '0'), {
        fontFamily: F.FAMILY, fontSize: '8px', color: F.COLOR_DIM
      });

      const led = this.add.circle(
        158, y + 9, 3,
        i === 0 ? C.ACCENT_BRIGHT : C.ACCENT_DIM,
        1
      );

      this.tweens.add({
        targets: led,
        alpha: { from: 1, to: 0.25 },
        duration: 500 + i * 100,
        yoyo: true,
        repeat: -1
      });
    }

    gfx.fillStyle(0x010501, 0.92);
    gfx.fillRect(W - 190, 170, 150, 230);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.8);
    gfx.strokeRect(W - 190, 170, 150, 230);

    this.add.text(W - 178, 180, 'NETWORK // CORE', {
      fontFamily: F.FAMILY_TITLE, fontSize: '16px', color: F.COLOR_MID
    });

    ['CORE','MEMORY','OBSERVER','LOOP','GATE'].forEach((name, i) => {
      const y = 220 + i * 30;

      this.add.text(W - 176, y, name, {
        fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM
      });

      this.add.text(W - 58, y, i === 2 ? 'LOCKED' : 'ONLINE', {
        fontFamily: F.FAMILY,
        fontSize: '9px',
        color: i === 2 ? F.COLOR_WARNING : F.COLOR_MID
      }).setOrigin(1, 0);
    });

    gfx.lineStyle(1, C.ACCENT_DIM, 0.35);
    gfx.moveTo(184, 285).lineTo(330, 285);
    gfx.moveTo(W - 190, 285).lineTo(810, 285);
    gfx.strokePath();

    this.add.text(W / 2, 308, ':: SYSTEM STATUS ::', {
      fontFamily: F.FAMILY, fontSize: '9px', color: F.COLOR_DIM
    }).setOrigin(0.5);
  }

  _drawGrid() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const gfx = this.add.graphics();

    gfx.lineStyle(1, FORK_CONFIG.COLORS.GRID, 0.4);
    for (let x = 0; x < W; x += 40) gfx.moveTo(x, 0).lineTo(x, H);
    for (let y = 0; y < H; y += 40) gfx.moveTo(0, y).lineTo(W, y);
    gfx.strokePath();
  }

  _startGame() {
    GameState.clearSave();
    GameState.persistent = {
      loop_count: 0, boot_code_found: false, log07_deleted: false, server_rebooted: false,
      door_unlocked: false, secret_area_found: false, entity_trust: 0,
      system_awareness: 0, butterfly_steps: [], player_identity_known: false,
      phase: FORK_CONFIG.PHASES.AWAKENING,
      escape_attempted: false, memory_code_found: false,
      observer_unlocked: false, identity_fragment_found: false,
      fork_sequence_complete: false, commands_executed: [], puzzles_solved: [], ending_flags: {},
      clear_count: 0, corruption_level: 0, filesystem_wiped: false,
      loop_error_count: 0, last_loop_error: null,
      system_notes_read: false, restore_requested: false, system_restored: false,
    };

    GameState.nextLoop();
    GameState.save();
    this.scene.start('GameScene');
  }

  _showSettings() {
    if (this._settingsOpen) return;
    this._settingsOpen = true;

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;
    const C = FORK_CONFIG.COLORS;
    const A = window.AudioManagerInstance;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.9)
      .setOrigin(0, 0)
      .setDepth(50)
      .setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 620, 460, C.TERMINAL_BG, 0.99)
      .setStrokeStyle(1, C.ACCENT_DIM)
      .setDepth(51);

    this._animatePanel(box);

    const title = this.add.text(W / 2, H / 2 - 194, '// CONFIGURAÇÕES', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '30px',
      color: F.COLOR_BRIGHT,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(52);

    const volumeLabel = this.add.text(W / 2, H / 2 - 132, '', {
      fontFamily: F.FAMILY,
      fontSize: '15px',
      color: F.COLOR_SYSTEM,
    }).setOrigin(0.5).setDepth(52);

    const volumeBar = this.add.rectangle(W / 2, H / 2 - 91, 360, 10, C.HIGHLIGHT, 1)
      .setStrokeStyle(1, C.ACCENT_DIM)
      .setDepth(52);

    const volumeFill = this.add.rectangle(W / 2 - 178, H / 2 - 91, 4, 6, C.ACCENT, 1)
      .setOrigin(0, 0.5)
      .setDepth(53);

    const volumeHint = this.add.text(W / 2, H / 2 - 60, '[ ← / → ] AJUSTAR VOLUME     [ M ] MUTE / UNMUTE', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM
    }).setOrigin(0.5).setDepth(52);

    const muteButton = this._panelButton(W / 2, H / 2 - 22, '', () => {
      A.toggleMute();
      updateVolume();
    });

    const tutorialButton = this._panelButton(W / 2, H / 2 + 38, '> TUTORIAL', () => {
      close();
      this._showTutorial(true);
    });

    const creditsButton = this._panelButton(W / 2, H / 2 + 82, '> CRÉDITOS', () => {
      close();
      this._showCredits(true);
    });

    const aboutButton = this._panelButton(W / 2, H / 2 + 126, '> SOBRE O JOGO', () => {
      close();
      this._showAbout(true);
    });

    const closeButton = this._panelButton(W / 2, H / 2 + 180, '> VOLTAR', () => close());

    const selectable = [
      { type: 'volume', target: volumeLabel },
      { type: 'button', target: muteButton },
      { type: 'button', target: tutorialButton },
      { type: 'button', target: creditsButton },
      { type: 'button', target: aboutButton },
      { type: 'button', target: closeButton },
    ];

    let selectedIndex = 0;

    const close = () => {
      if (!this._settingsOpen) return;
      this._settingsOpen = false;
      overlay.destroy();
      box.destroy();
      title.destroy();
      volumeLabel.destroy();
      volumeBar.destroy();
      volumeFill.destroy();
      volumeHint.destroy();
      [muteButton, tutorialButton, creditsButton, aboutButton, closeButton].forEach(b => b.destroy());
      if (this._settingsSelectionArrow) {
        this._settingsSelectionArrow.destroy();
        this._settingsSelectionArrow = null;
      }
      this.input.keyboard.off('keydown', keyHandler);
    };

    const updateVolume = () => {
      const pct = A.getVolumePercent();
      volumeLabel.setText('VOLUME DOS SONS  //  ' + String(pct).padStart(3, '0') + '%');
      muteButton.setText(A.isMuted() ? '[ SOM: MUTADO ]' : '[ SOM: ATIVO ]');
      volumeFill.displayWidth = Math.max(4, 356 * (pct / 100));
      volumeFill.setFillStyle(A.isMuted() ? C.DANGER : C.ACCENT);
    };

    const updateSelection = () => {
      selectable.forEach((item, index) => {
        const selected = index === selectedIndex;

        if (item.type === 'volume') {
          item.target.setColor(selected ? F.COLOR_WHITE : F.COLOR_SYSTEM);
          item.target.setShadow(
            0, 0,
            selected ? F.COLOR_BRIGHT : F.COLOR_PRIMARY,
            selected ? 16 : 8,
            true, true
          );
          item.target.setScale(selected ? 1.04 : 1);
        } else {
          item.target.setColor(selected ? F.COLOR_WHITE : F.COLOR_PRIMARY);
          item.target.setShadow(
            0, 0,
            selected ? F.COLOR_BRIGHT : F.COLOR_PRIMARY,
            selected ? 16 : 8,
            true, true
          );
          item.target.setScale(selected ? 1.04 : 1);
        }
      });

      const selected = selectable[selectedIndex];
      const arrowX = W / 2 - 205;
      const arrowY = selected.type === 'volume'
        ? H / 2 - 132
        : selected.target.y;

      if (!this._settingsSelectionArrow) {
        this._settingsSelectionArrow = this.add.text(arrowX, arrowY, '▶', {
          fontFamily: F.FAMILY_TITLE,
          fontSize: '18px',
          color: F.COLOR_BRIGHT,
        }).setOrigin(0.5).setDepth(54);
      } else {
        this._settingsSelectionArrow.setPosition(arrowX, arrowY);
        this._settingsSelectionArrow.setVisible(true);
      }
    };

    const moveSelection = (direction) => {
      selectedIndex = (selectedIndex + direction + selectable.length) % selectable.length;
      updateSelection();
    };

    const activateSelection = () => {
      const selected = selectable[selectedIndex];

      if (selected.type === 'volume') {
        A.playBeep();
        return;
      }

      selected.target.emit('pointerdown');
    };

    const keyHandler = (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSelection(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSelection(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (selectable[selectedIndex].type === 'volume') {
          A.changeVolume(-0.1);
          updateVolume();
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (selectable[selectedIndex].type === 'volume') {
          A.changeVolume(0.1);
          updateVolume();
          A.playBeep();
        }
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        A.toggleMute();
        updateVolume();
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        event.preventDefault();
        activateSelection();
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        event.preventDefault();
        close();
      }
    };

    overlay.on('pointerdown', close);

    updateVolume();
    updateSelection();
    this.input.keyboard.on('keydown', keyHandler);

    [overlay, box, title, volumeLabel, volumeBar, volumeFill, volumeHint].forEach(o => o.setAlpha(0));
    [muteButton, tutorialButton, creditsButton, aboutButton, closeButton].forEach(b => b.setAlpha(0));
    if (this._settingsSelectionArrow) this._settingsSelectionArrow.setAlpha(0);

    this.tweens.add({
      targets: [overlay, box, title, volumeLabel, volumeBar, volumeFill, volumeHint, muteButton, tutorialButton, creditsButton, aboutButton, closeButton, this._settingsSelectionArrow],
      alpha: 1, duration: 180, ease: 'Quad.easeOut'
    });
  }

  _panelButton(x, y, label, onClick) {
    const F = FORK_CONFIG.FONT;
    const btn = this.add.text(x, y, label, {
      fontFamily: F.FAMILY,
      fontSize: '16px',
      color: F.COLOR_PRIMARY,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(53).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(F.COLOR_WHITE).setScale(1.04));
    btn.on('pointerout', () => btn.setColor(F.COLOR_PRIMARY).setScale(1));
    btn.on('pointerdown', onClick);
    return btn;
  }

  _showTutorial(returnToSettings = false) {
    this._showInfoPanel(
      '// TUTORIAL',
      [
        'FORK // COMO JOGAR',
        '',
        'OBJETIVO',
        'Você está preso dentro de uma Matrix instável.',
        'Explore, investigue os sinais do sistema e descubra',
        'o que aconteceu. Escapar é apenas parte do objetivo.',
        '',
        'CONTROLES',
        '',
        '[ W / A / S / D ]  ou  [ SETAS ]',
        'Movimentar o personagem.',
        '',
        '[ E ]  INTERAGIR',
        'Interaja com objetos próximos para encontrar pistas,',
        'arquivos, terminais, portas e outros elementos.',
        '',
        '[ P ]  PAUSAR',
        'Abre o menu de pausa e congela o tempo do loop.',
        '',
        'PUZZLES',
        'A progressão depende de pistas, sequências, arquivos',
        'e consequências. Nem toda resposta é direta.',
        '',
        'EFEITO BORBOLETA',
        'Pequenas ações podem alterar eventos posteriores',
        'e influenciar o caminho da história e o final.',
        '',
        'CUIDADO COM O CLEAR',
        'O CLEAR pode apagar informações e causar mudanças',
        'persistentes. Pense nas consequências antes de usá-lo.',
        '',
        'MÚLTIPLOS FINAIS',
        'Existem cinco finais. Suas ações e descobertas',
        'determinam qual consequência será revelada.'
      ].join('\\n'),
      returnToSettings
    );
  }

  _showCredits(returnToSettings = false) {
    this._showInfoPanel(
      '// CRÉDITOS',
      [
        'FORK  //  SEMCOMP GAME JAM 2026',
        'TEMA: EFEITO BORBOLETA',
        '',
        'EQUIPE',
        '',
        'Arthur Andrade Cunha  —  Design e Desenvolvimento',
        'Pedro Andrade  —  Desenvolvimento',
        'Andre Rangel  —  Design',
        '',
        'COLABORADORES',
        '',
        'Gustavo Maia  —  Colaborador',
        'Maria Eduarda Lombardi  —  Colaboradora',
        '',
        'PROCESSO CRIATIVO',
        'O projeto nasceu do tema Efeito Borboleta e evoluiu',
        'para um escape room sobre decisão, consequência,',
        'repetição e controle.',
        '',
        'A equipe combinou narrativa ambiental, puzzles, loops',
        'e múltiplos finais em uma estética de laboratório digital,',
        'mantendo o escopo adequado à Game Jam.',
        '',
        'TECNOLOGIA',
        'JavaScript  •  Phaser 3  •  HTML5  •  CSS',
        'Web Audio API  •  Git / GitHub',
        '',
        'APOIO DE IA',
        'ChatGPT / OpenAI apoiou brainstorming, programação,',
        'depuração, arquitetura, narrativa, puzzles e documentação.'
      ].join('\\n'),
      returnToSettings
    );
  }

  _showAbout(returnToSettings = false) {
    this._showInfoPanel(
      '// SOBRE O JOGO',
      [
        'FORK  //  SEMCOMP GAME JAM 2026',
        'BETA // VERSÃO EM DESENVOLVIMENTO',
        '',
        'POR QUE “FORK”?',
        'Fork significa bifurcação: um caminho que pode se',
        'dividir em outros caminhos. O conceito representa',
        'as consequências, os loops e os diferentes finais.',
        '',
        'EFEITO BORBOLETA',
        'O tema está presente na narrativa, nos puzzles e',
        'na estrutura do jogo. Pequenas ações podem alterar',
        'eventos posteriores e modificar o final.',
        '',
        'A EXPERIÊNCIA',
        'Você está dentro de uma Matrix instável, marcada por',
        'loops, processos ocultos e alterações no sistema.',
        'As pistas formam uma cadeia de consequências.',
        '',
        'OBJETIVO',
        'Encontrar a saída é apenas parte da experiência.',
        'Investigue o que aconteceu, descubra por que a Matrix',
        'foi alterada e conecte as pistas deixadas pelo sistema.',
        '',
        'MÚLTIPLOS FINAIS',
        'FORK possui cinco finais possíveis. Cada um revela',
        'uma consequência diferente do caminho percorrido.',
        '',
        'BETA',
        'Esta versão representa o estado atual do projeto',
        'para a Game Jam e ainda pode receber ajustes de',
        'gameplay, narrativa, arte e interface.'
      ].join('\\n'),
      returnToSettings
    );
  }

  _showInfoPanel(titleText, bodyText, returnToSettings = false) {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;
    const C = FORK_CONFIG.COLORS;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.94)
      .setOrigin(0, 0)
      .setDepth(60)
      .setInteractive();

    // Painéis informativos usam quase toda a altura útil da resolução 960x640.
    // O tamanho do texto se adapta à quantidade de linhas para evitar overflow.
    const box = this.add.rectangle(W / 2, H / 2, 720, 600, C.TERMINAL_BG, 0.99)
      .setStrokeStyle(1, C.ACCENT_DIM)
      .setDepth(61);

    const title = this.add.text(W / 2, 46, titleText, {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '27px',
      color: F.COLOR_BRIGHT,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 10, fill: true },
    }).setOrigin(0.5, 0).setDepth(62);

    const lines = bodyText.split('\\n').length;
    const fontSize = lines >= 32 ? '10px' : '11px';
    const lineSpacing = 2;

    const text = this.add.text(W / 2 - 320, 88, bodyText, {
      fontFamily: F.FAMILY,
      fontSize,
      color: F.COLOR_SYSTEM,
      lineSpacing,
      wordWrap: { width: 640 },
    }).setDepth(62);

    const closeButton = this._panelButton(W / 2, 606, '> FECHAR', () => close());
    closeButton.setDepth(63);

    const close = () => {
      overlay.destroy();
      box.destroy();
      title.destroy();
      text.destroy();
      closeButton.destroy();
      this.input.keyboard.off('keydown', esc);
      if (returnToSettings) this._showSettings();
    };

    const esc = (event) => {
      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) close();
    };

    overlay.on('pointerdown', close);
    this.input.keyboard.on('keydown', esc);

    this._animatePanel(box);
    [overlay, box, title, text, closeButton].forEach(o => o.setAlpha(0));

    this.tweens.add({
      targets: [overlay, box, title, text, closeButton],
      alpha: 1,
      duration: 180,
      ease: 'Quad.easeOut'
    });
  }

  _animatePanel(box) {
    box.setScale(0.96);
    this.tweens.add({
      targets: box,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }
}
