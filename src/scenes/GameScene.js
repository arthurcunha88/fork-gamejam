(function () {
// ============================================================
const NARRATIVE = {
  door: {
    locked_no_clue: ['PORTA DE SEGURANÇA','O acesso está sincronizado com um evento que ainda não aconteceu.','// O sistema não entrega a resposta diretamente.'],
    locked_has_clue: ['PORTA DE SEGURANÇA','LOG_07 desapareceu.','O horário do desaparecimento continua registrado.','// O que o sistema registrou quando você agiu?'],
  },
  serverLEDs: ['SERVER A','Os quatro canais não pulsam da mesma forma.','','Canal A  [ • ]','Canal B  [ • • ]','Canal C  [ • • • ]','Canal D  [ • • • • ]','','// Os canais não estão em ordem.','// A ordem de ativação importa.','// Toda fuga começa pelo pulso mais forte.'],
  entity: {
    first_contact: ['???','Você finalmente percebeu que existe alguém além da interface.','// Não confie em tudo que permanece visível.'],
    hint_log07: ['???','Procure o arquivo que o sistema tenta manter fora do seu alcance.','// O que é apagado também deixa rastros.'],
    hint_server: ['???','A porta abriu porque uma ação antiga mudou o presente.','// Agora faça o servidor lembrar do que esqueceu.'],
    hint_butterfly: ['???','O projeto não está nomeado onde você espera.','// Procure o lugar indicado pela coordenada.'],
    warning: ['???','A simulação já conhece suas escolhas.','// Continue e ela começará a antecipá-las.'],
  },
  camera: {
    standard: ['CAM-01','Gravação ativa.','// Movimento registrado.'],
    aware: ['CAM-01','A câmera está alguns segundos à frente.','// Ela parece reagir antes de você.'],
    morse: ['CAM-01','Sinal auxiliar detectado.','...- .. --. .. .-','// A transmissão não está usando palavras.'],
  },
  loopStart: loop => ['FORK OS // LOOP ' + String(loop).padStart(2,'0'), loop === 1 ? 'Ambiente carregado.' : 'A simulação lembra do que você fez.','// Algumas consequências chegam antes da causa.'],
  systemReactions: {
    both: ['O sistema detectou duas alterações persistentes.','// A cadeia de consequências está se acumulando.'],
    log07_deleted: ['LOG_07 continua ausente.','// O sistema sabe que você o removeu.'],
    server_rebooted: ['SERVER A já foi reiniciado.','// O presente carrega uma decisão de outro loop.'],
  },
};

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.loopManager   = new LoopManager(this);
    this.puzzleManager = new PuzzleManager();
    this.dialogManager = new DialogManager(this);
    this.finalManager  = new FinalManager(this);
    this.uiManager     = new UIManager(this, this.loopManager);
    this.animationManager = new AnimationManager(this);
    window.AnimationManagerInstance = this.animationManager;

    this._wallRects = [];
    this._buildMap();
    this._buildMapDynamics();

    this._objects = [];
    this._lastCorruptionLevel = -1;
    this._isPaused = false;
    this._pauseOverlay = null;
    this._hardCorruption = false;
    this._buildObjects();

    this.player = new Player(this, 200, 300);

    this._wallRects.forEach(wall => {
      this.physics.add.collider(this.player.getPhysicsBody(), wall);
    });

    this._buildHUD();

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player.getPhysicsBody(), true, 0.1, 0.1);

    this._setupLoopCallbacks();
    this.loopManager.start();
    this._showLoopStart();

    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.P
    ]);

    this._pauseKeyHandler = (event) => {
      if (event.keyCode !== Phaser.Input.Keyboard.KeyCodes.ESC &&
          event.keyCode !== Phaser.Input.Keyboard.KeyCodes.P) return;

      if (this._hardCorruption) return;
      if (GameState.volatile.dialog_open ||
          GameState.volatile.terminal_open ||
          GameState.volatile.modal_open) return;

      event.preventDefault();
      if (this._isPaused) this._closePause();
      else this._openPause();
    };

    this.input.keyboard.on('keydown', this._pauseKeyHandler);

    this.events.once('shutdown', () => {
      if (this._pauseKeyHandler) {
        this.input.keyboard.off('keydown', this._pauseKeyHandler);
      }
    });

    this.input.on('pointerdown', (ptr) => {
      if (this._isPaused || this._hardCorruption) return;
      this._handleClick(ptr);
    });
  }

  update(time, delta) {
    if (!this.player) return;

    if (this._hardCorruption) {
      this._updateHUD();
      return;
    }

    if (this._isPaused) {
      this._updateHUD();
      return;
    }

    this.loopManager.update(delta);
    if (this.loopManager.isCritical()) {
      this._updateCriticalAlert();
    }
    this.dialogManager.update();
    this.finalManager.check();
    this.player.update(this._objects);
    const selectedObject = this.player.getNearestObject();
    this._objects.forEach(obj => obj.update(this.player.x, this.player.y, selectedObject));
    this._updateCorruptionEffects();

    this._updateHUD();
  }

  _updateCriticalAlert() {
    if (!this._criticalAlert) return;

    const remaining = this.loopManager.timeRemaining;
    const urgency = Phaser.Math.Clamp(1 - (remaining / FORK_CONFIG.LOOP_CRITICAL_TIME), 0, 1);
    const alphaMin = 0.18 + urgency * 0.08;
    const alphaMax = 0.42 + urgency * 0.14;
    const duration = Math.max(360, 620 - urgency * 180);

    this._criticalAlert.setColor('#ff9aa6');

    if (!this._criticalAlertTween || !this._criticalAlertTween.isPlaying()) {
      this._criticalAlert.setAlpha(alphaMax);
      this._criticalAlertTween = this.tweens.add({
        targets: this._criticalAlert,
        alpha: { from: alphaMax, to: alphaMin },
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ── Pause ──────────────────────────────────────────────────

  _openPause() {
    if (this._isPaused || this._hardCorruption) return;

    this._isPaused = true;
    this.loopManager.pause();
    GameState.volatile.modal_open = true;

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(150)
      .setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 470, 330, C.TERMINAL_BG, 0.99)
      .setStrokeStyle(1, C.ACCENT_DIM)
      .setScrollFactor(0)
      .setDepth(151);

    const title = this.add.text(W / 2, H / 2 - 125, '// PAUSE', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '30px',
      color: F.COLOR_BRIGHT,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 12, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    const status = this.add.text(W / 2, H / 2 - 82, 'LOOP CONGELADO // TEMPO PARADO', {
      fontFamily: F.FAMILY,
      fontSize: '10px',
      color: F.COLOR_DIM,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    const items = [
      ['> CONTINUAR', () => this._closePause()],
      ['> CONFIGURAÇÕES', () => this._openPauseSettings()],
      ['> VOLTAR AO MENU', () => this._returnToMenuFromPause()],
    ];

    const buttons = items.map(([label, action], i) => {
      const b = this.add.text(W / 2, H / 2 - 25 + i * 55, label, {
        fontFamily: F.FAMILY,
        fontSize: '17px',
        color: F.COLOR_PRIMARY,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(152).setInteractive({ useHandCursor: true });
      b.on('pointerover', () => { b.setColor(F.COLOR_WHITE); b.setScale(1.04); });
      b.on('pointerout', () => { if (!this._pauseButtonLocked) { b.setColor(F.COLOR_PRIMARY); b.setScale(1); } });
      b.on('pointerdown', action);
      return b;
    });

    const close = this.add.text(W / 2, H / 2 + 122, '[ ESC / P ]', {
      fontFamily: F.FAMILY,
      fontSize: '10px',
      color: F.COLOR_DIM,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    this._pauseOverlay = {
      overlay, box, title, status, buttons, close,
      settings: null,
      selectedIndex: 0,
      keyHandler: null,
    };

    const updateSelection = () => {
      if (!this._pauseOverlay || this._pauseOverlay.settings) return;
      buttons.forEach((b, i) => {
        const selected = i === this._pauseOverlay.selectedIndex;
        b.setColor(selected ? F.COLOR_WHITE : F.COLOR_PRIMARY);
        b.setScale(selected ? 1.05 : 1);
        b.setShadow(0, 0, selected ? F.COLOR_BRIGHT : F.COLOR_PRIMARY, selected ? 16 : 7, true, true);
      });
    };

    this._pauseOverlay.keyHandler = (event) => {
      if (!this._pauseOverlay || this._pauseOverlay.settings) return;
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this._pauseOverlay.selectedIndex = (this._pauseOverlay.selectedIndex + 2) % 3;
        updateSelection();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this._pauseOverlay.selectedIndex = (this._pauseOverlay.selectedIndex + 1) % 3;
        updateSelection();
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        event.preventDefault();
        items[this._pauseOverlay.selectedIndex][1]();
      }
    };

    this.input.keyboard.on('keydown', this._pauseOverlay.keyHandler);
    overlay.on('pointerdown', () => this._closePause());
    updateSelection();
  }

  _closePause() {
    const p = this._pauseOverlay;
    if (!p || p.settings) return;

    this._isPaused = false;
    this.loopManager.resume();
    GameState.volatile.modal_open = false;

    if (p.keyHandler) this.input.keyboard.off('keydown', p.keyHandler);
    [p.overlay, p.box, p.title, p.status, ...p.buttons, p.close].forEach(o => o && o.destroy());
    this._pauseOverlay = null;
    this._pauseButtonLocked = false;
  }

  _openPauseSettings() {
    const p = this._pauseOverlay;
    if (!p || p.settings) return;

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const A = window.AudioManagerInstance;

    [p.box, p.title, p.status, ...p.buttons, p.close].forEach(o => o.setVisible(false));

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.90)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(153).setInteractive();

    const box = this.add.rectangle(W / 2, H / 2, 520, 360, C.TERMINAL_BG, 0.99)
      .setStrokeStyle(1, C.ACCENT_DIM).setScrollFactor(0).setDepth(154);

    const title = this.add.text(W / 2, H / 2 - 132, '// CONFIGURAÇÕES', {
      fontFamily: F.FAMILY_TITLE, fontSize: '26px', color: F.COLOR_BRIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155);

    const volume = this.add.text(W / 2, H / 2 - 65, '', {
      fontFamily: F.FAMILY, fontSize: '14px', color: F.COLOR_SYSTEM,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155);

    const mute = this.add.text(W / 2, H / 2 - 15, '', {
      fontFamily: F.FAMILY, fontSize: '15px', color: F.COLOR_PRIMARY,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155).setInteractive({ useHandCursor: true });

    const back = this.add.text(W / 2, H / 2 + 55, '> VOLTAR', {
      fontFamily: F.FAMILY, fontSize: '16px', color: F.COLOR_PRIMARY,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155).setInteractive({ useHandCursor: true });

    const hint = this.add.text(W / 2, H / 2 + 112, '[ ← / → ] VOLUME   [ M ] MUTE   [ ESC ] VOLTAR', {
      fontFamily: F.FAMILY, fontSize: '10px', color: F.COLOR_DIM,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155);

    const update = () => {
      const pct = A.getVolumePercent();
      volume.setText('VOLUME DOS SONS  //  ' + String(pct).padStart(3, '0') + '%');
      mute.setText(A.isMuted() ? '[ SOM: MUTADO ]' : '[ SOM: ATIVO ]');
    };

    const closeSettings = () => {
      if (!p.settings) return;
      this.input.keyboard.off('keydown', keyHandler);
      [overlay, box, title, volume, mute, back, hint].forEach(o => o.destroy());
      [p.box, p.title, p.status, ...p.buttons, p.close].forEach(o => o.setVisible(true));
      p.settings = null;
      this._pauseButtonLocked = false;
      this._pauseOverlay.keyHandler && this.input.keyboard.on('keydown', this._pauseOverlay.keyHandler);
    };

    const keyHandler = (event) => {
      if (!p.settings) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault(); A.changeVolume(-0.1); update();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault(); A.changeVolume(0.1); A.playBeep(); update();
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault(); A.toggleMute(); update();
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        event.preventDefault(); closeSettings();
      } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
        event.preventDefault(); A.toggleMute(); update();
      }
    };

    mute.on('pointerdown', () => { A.toggleMute(); update(); });
    back.on('pointerdown', closeSettings);
    overlay.on('pointerdown', closeSettings);

    p.settings = { overlay, box, title, volume, mute, back, hint };
    this._pauseButtonLocked = true;
    update();
    this.input.keyboard.off('keydown', p.keyHandler);
    this.input.keyboard.on('keydown', keyHandler);
  }

  _returnToMenuFromPause() {
    if (!this._pauseOverlay) return;
    this.loopManager.stop();
    GameState.volatile.modal_open = false;
    this.scene.start('MenuScene');
  }

  // ── Mapa ──────────────────────────────────────────────────

  _buildMap() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const gfx = this.add.graphics().setDepth(0);

    gfx.fillStyle(C.BG, 1);
    gfx.fillRect(0, 0, W, H);

    // Grid arquitetural: linhas finas e coordenadas lembram uma interface
    // de simulação, sem depender de imagens externas.
    gfx.lineStyle(1, C.GRID, 0.55);
    for (let x = 0; x <= W; x += 32) gfx.moveTo(x, 0).lineTo(x, H);
    for (let y = 0; y <= H; y += 32) gfx.moveTo(0, y).lineTo(W, y);
    gfx.strokePath();

    this._drawDigitalRain(0, 28, W, H - 50);

    this._drawRoom(gfx, 60, 50, 840, 540);
    this._drawRoom(gfx, 660, 50, 240, 200, true);
    this._drawRoom(gfx, 60, 390, 220, 200, true);

    // Faixas de iluminação e circuitos no chão.
    gfx.lineStyle(1, C.ACCENT_DIM, 0.16);
    for (let x = 80; x < 900; x += 80) {
      gfx.moveTo(x, 70).lineTo(x, 570);
    }
    for (let y = 70; y < 580; y += 80) {
      gfx.moveTo(80, y).lineTo(880, y);
    }
    gfx.strokePath();

    // Trilhas de circuito decorativas.
    gfx.lineStyle(2, C.ACCENT_DIM, 0.18);
    [[95,115,240,115],[240,115,240,180],[400,535,560,535],
     [560,535,560,470],[690,105,780,105],[780,105,780,160],
     [95,350,180,350],[180,350,180,300]].forEach(([x1,y1,x2,y2]) => {
      gfx.moveTo(x1,y1).lineTo(x2,y2);
      gfx.strokeCircle(x2, y2, 3);
    });

    const labelStyle = {
      fontFamily: F.FAMILY_TITLE, fontSize: '20px', color: '#7ed6ff',
      shadow: { offsetX:0, offsetY:0, color:'#3c8eac', blur:10, fill:true }
    };
    this.add.text(120, 62, '// MAIN LAB', labelStyle).setDepth(1);
    this.add.text(672, 62, '// SERVER ROOM // LOCKED', labelStyle).setDepth(1);

    // A passagem agora parece uma entrada real, não apenas um buraco na parede.
    const entranceX = 780;
    const entranceY = 250;
    gfx.lineStyle(2, C.ACCENT_BRIGHT, 0.7);
    gfx.strokeRect(744, 244, 72, 14);
    gfx.lineStyle(1, C.ACCENT_BRIGHT, 0.35);
    gfx.strokeRect(748, 248, 64, 8);
    const entranceText = this.add.text(780, 266, 'ENTRADA // CONTROL ROOM', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '13px',
      color: '#9be8ff',
      shadow: { offsetX:0, offsetY:0, color:'#4a9ab8', blur:8, fill:true },
    }).setOrigin(0.5, 0).setDepth(2);

    this.add.text(780, 286, '↓  PORTA FECHADA // CÓDIGO NECESSÁRIO', {
      fontFamily: F.FAMILY,
      fontSize: '10px',
      color: '#6d9aaa',
    }).setOrigin(0.5, 0).setDepth(2);

    this.tweens.add({
      targets: [entranceText],
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.text(72, 400, '// STORAGE', labelStyle).setDepth(1);

    const dimStyle = { fontFamily: F.FAMILY, fontSize: '9px', color: '#33aa33' };
    this.add.text(65, 55, '[00,00]', dimStyle).setDepth(1);
    this.add.text(860, 55, '[10,00]', dimStyle).setOrigin(1,0).setDepth(1);
    this.add.text(65, 575, '[00,06]', dimStyle).setDepth(1);
    this.add.text(860, 575, '[10,06]', dimStyle).setOrigin(1,0).setDepth(1);

    // Painéis de status dão vida ao laboratório.
    this._mapStatus = this.add.text(78, 555, 'NET // SYNCHRONIZED', {
      fontFamily: F.FAMILY, fontSize: '9px', color: '#33aa33'
    }).setDepth(2);

    this.tweens.add({
      targets: this._mapStatus,
      alpha: { from: 1, to: 0.35 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });
  }

  _buildMapDynamics() {
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    // Circuitos ambientais: poucos elementos lentos para não competir com o player.
    const routes = [
      { color: C.ACCENT, points: [[90,150],[230,150],[230,215],[320,215]] },
      { color: C.PURPLE, points: [[470,90],[470,160],[610,160],[610,250]] },
      { color: C.GREEN, points: [[520,540],[640,540],[640,430],[760,430]] },
    ];

    routes.forEach(route => {
      const g = this.add.graphics().setDepth(1);
      g.lineStyle(1, route.color, 0.10);
      route.points.forEach(([x,y], i) => {
        if (i === 0) g.moveTo(x,y);
        else g.lineTo(x,y);
      });
      g.strokePath();
    });

    const nodes = [
      [230,150,C.ACCENT],
      [610,250,C.PURPLE],
      [640,430,C.GREEN],
      [850,180,C.ACCENT_BRIGHT],
    ];

    nodes.forEach(([x,y,color]) => {
      const node = this.add.circle(x, y, 2, color, 0.45).setDepth(2);
      this.tweens.add({
        targets: node,
        alpha: { from: 0.18, to: 0.55 },
        scale: { from: 0.9, to: 1.15 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    const scan = this.add.rectangle(W / 2, 48, W - 140, 1, C.ACCENT_BRIGHT, 0.18).setDepth(2);
    this.tweens.add({ targets: scan, y: H - 60, duration: 6200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const status = this.add.text(W - 82, 565, 'LIVE', {
      fontFamily: F.FAMILY_TITLE, fontSize: '14px', color: F.COLOR_MAGENTA,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_MAGENTA, blur: 10, fill: true },
    }).setDepth(2);
    this.tweens.add({ targets: status, alpha: { from: 1, to: 0.2 }, duration: 380, yoyo: true, repeat: -1 });
  }

  _drawDigitalRain(x, y, w, h) {
    const F = FORK_CONFIG.FONT;
    const C = FORK_CONFIG.COLORS;
    const layer = this.add.container(0, 0).setDepth(0).setAlpha(0.08);
    const glyphs = '01アイウエオカキクケコ<>[]{}+/\\';

    for (let i = 0; i < 8; i++) {
      const tx = x + Phaser.Math.Between(10, w - 10);
      const ty = y + Phaser.Math.Between(0, h);
      const text = this.add.text(tx, ty, '', {
        fontFamily: F.FAMILY,
        fontSize: Phaser.Math.Between(9, 13) + 'px',
        color: i % 5 === 0 ? '#39ff14' : '#00802a',
      });

      const length = Phaser.Math.Between(4, 12);
      let value = '';
      for (let j = 0; j < length; j++) {
        value += glyphs[Phaser.Math.Between(0, glyphs.length - 1)] + '\n';
      }
      text.setText(value);
      layer.add(text);

      this.tweens.add({
        targets: text,
        y: ty + Phaser.Math.Between(90, 220),
        alpha: { from: 0.04, to: 0.16 },
        duration: Phaser.Math.Between(3500, 7000),
        delay: Phaser.Math.Between(0, 2500),
        repeat: -1,
        onRepeat: () => {
          text.y = Phaser.Math.Between(y, y + h);
        }
      });
    }
  }
  _drawRoom(gfx, x, y, w, h, isSecondary = false) {
    const C     = FORK_CONFIG.COLORS;
    const color = isSecondary ? C.ACCENT_DIM : C.ACCENT;
    const alpha = isSecondary ? 0.25 : 0.45;
    const thick = 12;

    // Chão interno levemente diferente
    gfx.fillStyle(isSecondary ? 0x020f02 : 0x030d03, 1);
    gfx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Borda da sala
    gfx.lineStyle(isSecondary ? 1 : 2, color, alpha);
    gfx.strokeRect(x, y, w, h);

    // Cantos decorativos (esquadros)
    const cs = 10; // corner size
    gfx.lineStyle(2, color, alpha + 0.2);
    // TL
    gfx.moveTo(x, y + cs).lineTo(x, y).lineTo(x + cs, y);
    // TR
    gfx.moveTo(x + w - cs, y).lineTo(x + w, y).lineTo(x + w, y + cs);
    // BL
    gfx.moveTo(x, y + h - cs).lineTo(x, y + h).lineTo(x + cs, y + h);
    // BR
    gfx.moveTo(x + w - cs, y + h).lineTo(x + w, y + h).lineTo(x + w, y + h - cs);
    gfx.strokePath();

    // Paredes físicas
    const walls = [
      { wx: x + w/2, wy: y,       ww: w,     wh: thick },
      { wx: x,       wy: y + h/2, ww: thick, wh: h     },
      { wx: x + w,   wy: y + h/2, ww: thick, wh: h     },
    ];

    // A CONTROL ROOM possui uma passagem física pelo centro da parede inferior.
    if (isSecondary && x === 660 && y === 50) {
      const gap = 72;
      const leftW = (w - gap) / 2;
      walls.push(
        { wx: x + leftW / 2, wy: y + h, ww: leftW, wh: thick },
        { wx: x + leftW + gap + leftW / 2, wy: y + h, ww: leftW, wh: thick },
      );
    } else {
      walls.push({ wx: x + w/2, wy: y + h, ww: w, wh: thick });
    }
    walls.forEach(({ wx, wy, ww, wh }) => {
      const rect = this.add.rectangle(wx, wy, ww, wh, 0x000000, 0);
      this.physics.add.existing(rect, true);
      this._wallRects.push(rect);
    });

    // A abertura da sala do servidor só existe fisicamente depois do código.
    if (isSecondary && x === 660 && y === 50 && !GameState.get('door_unlocked')) {
      this._controlRoomGate = this.add.rectangle(780, 250, 72, thick, 0x111a22, 0.96)
        .setStrokeStyle(2, 0x9be8ff, 0.8)
        .setDepth(4);
      this.physics.add.existing(this._controlRoomGate, true);
      this._controlRoomGate.body.setSize(72, thick);
    }
  }

  // ── Objetos interativos ───────────────────────────────────

  _buildObjects() {
    const C = FORK_CONFIG.COLORS;

    const terminal = new Terminal(this, 180, 220, {
      id: 'terminal_main', label: 'TERMINAL',
      puzzleManager: this.puzzleManager,
      dialogManager: this.dialogManager,
      puzzleId: FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
    });
    this._objects.push(terminal);

    const door = new InteractiveObject(this, 780, 250, {
      id: 'door_security', type: FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: GameState.get('door_unlocked') ? 'PORTA // ABERTA' : 'PORTA // BLOQUEADA', width: 58, height: 12,
      color: GameState.get('door_unlocked') ? C.ACCENT : 0x36424c,
      onInteract: (obj) => this._interactDoor(obj),
    });
    this._objects.push(door);

    const server = new InteractiveObject(this, 750, 130, {
      id: 'server_main', type: FORK_CONFIG.OBJECT_TYPES.SERVER,
      label: 'SERVER A', width: 36, height: 52,
      enabled: GameState.get('door_unlocked'),
      color: C.ACCENT_DIM,
      onInteract: () => this._interactServer(),
    });
    this._objects.push(server);

    const panel = new InteractiveObject(this, 820, 130, {
      id: 'panel_sequence', type: FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'PANEL', width: 28, height: 28,
      enabled: GameState.get('door_unlocked'),
      color: C.ACCENT_DIM,
      onInteract: () => this._interactPanel(),
    });
    this._objects.push(panel);

    const file = new InteractiveObject(this, 140, 460, {
      id: 'file_notes', type: FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'NOTES.txt', width: 20, height: 26,
      color: C.ACCENT_DIM,
      onInteract: () => this._interactFile(),
    });
    this._objects.push(file);

    const entity = new InteractiveObject(this, 160, 510, {
      id: 'entity', type: FORK_CONFIG.OBJECT_TYPES.OBJECT,
      label: '???', width: 16, height: 16,
      color: 0x113311,
      onInteract: () => this._interactEntity(),
    });
    this._objects.push(entity);

    const cam = new InteractiveObject(this, 855, 70, {
      id: 'camera_01', type: FORK_CONFIG.OBJECT_TYPES.CAMERA,
      label: 'CAM-01', width: 20, height: 14,
      color: C.DANGER,
      onInteract: () => this._interactCamera(),
    });
    this._objects.push(cam);

    // Elementos sem importância narrativa: servem para a simulação parecer
    // habitada e são os primeiros a desaparecer com CLEAR.
    const decor = [
      ['cabinet_01', 330, 115, 'ARMÁRIO A', 46, 64, 'cabinet'],
      ['cabinet_02', 410, 115, 'ARMÁRIO B', 46, 64, 'cabinet'],
      ['monitor_01', 330, 190, 'MONITOR 01', 46, 30, 'monitor'],
      ['monitor_02', 410, 190, 'MONITOR 02', 46, 30, 'monitor'],
      ['rack_01', 300, 500, 'RACK AUX', 50, 56, 'rack'],
      ['monitor_03', 390, 500, 'MONITOR 03', 46, 30, 'monitor'],
    ];

    decor.forEach(([id, x, y, label, width, height, visual]) => {
      const object = new InteractiveObject(this, x, y, {
        id,
        type: FORK_CONFIG.OBJECT_TYPES.OBJECT,
        label,
        width,
        height,
        visual,
        color: 0x26313b,
        onInteract: () => this.dialogManager.show([
          label,
          'Equipamento auxiliar.',
          'Nenhuma função relevante detectada.',
        ], { title: 'EQUIPAMENTO' }),
      });
      this._objects.push(object);
    });

    if (GameState.get('server_rebooted') && GameState.get('log07_deleted')) {
      this._spawnSecretFile();
    }

    // O painel de memória é a entrada da fase Observer.
    // Ele aparece após PROJECT_B ser encontrado e desbloqueia o Observer.
    if (GameState.get('secret_area_found')) {
      this._spawnMemoryPanel();
    }

    if (GameState.get('observer_unlocked')) {
      this._spawnObserverObjects();
    }
  }

  _spawnSecretFile() {
    if (this._objects.some(o => o.id === 'secret_file')) return;
    if (!GameState.get('server_rebooted') || !GameState.get('log07_deleted')) return;

    const secret = new InteractiveObject(this, 700, 490, {
      id: 'secret_file',
      type: FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'PROJECT_B.enc',
      width: 22,
      height: 26,
      color: 0x004422,
      onInteract: () => this._interactSecretFile(),
    });

    this._objects.push(secret);

    [secret._body, secret._label, secret._icon].forEach(target => {
      target.setAlpha(0);
      this.tweens.add({
        targets: target,
        alpha: 1,
        scale: { from: 0.55, to: 1 },
        duration: 360,
        ease: 'Back.easeOut',
      });
    });
  }

  _spawnMemoryPanel() {
    if (this._objects.some(o => o.id === 'memory_panel')) return;

    const memory = new InteractiveObject(this, 500, 480, {
      id: 'memory_panel',
      type: FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'MEMORY PANEL',
      width: 30,
      height: 30,
      color: FORK_CONFIG.COLORS.WARNING,
      onInteract: () => this._interactMemoryPanel(),
    });

    this._objects.push(memory);
  }

  _spawnObserverObjects() {
    if (!this._objects.some(o => o.id === 'observer_terminal')) {
      const observer = new InteractiveObject(this, 720, 350, {
        id: 'observer_terminal',
        type: FORK_CONFIG.OBJECT_TYPES.TERMINAL,
        label: 'OBSERVER',
        width: 34,
        height: 30,
        color: FORK_CONFIG.COLORS.ACCENT_BRIGHT,
        onInteract: () => this._interactObserver(),
      });
      this._objects.push(observer);
    }

    if (!this._objects.some(o => o.id === 'identity_terminal')) {
      const identity = new InteractiveObject(this, 620, 350, {
        id: 'identity_terminal',
        type: FORK_CONFIG.OBJECT_TYPES.FILE,
        label: 'IDENTITY',
        width: 30,
        height: 26,
        color: FORK_CONFIG.COLORS.WARNING,
        onInteract: () => this._interactIdentity(),
      });
      this._objects.push(identity);
    }
  }

  // ── Interações ────────────────────────────────────────────

  _handleClick(ptr) {
    if (GameState.volatile.dialog_open || GameState.volatile.terminal_open) return;
    const worldX = ptr.worldX;
    const worldY = ptr.worldY;
    let nearest = null;
    let minDist = FORK_CONFIG.INTERACT_RANGE;
    this._objects.forEach(obj => {
      if (!obj.enabled) return;
      const d = Phaser.Math.Distance.Between(worldX, worldY, obj.x, obj.y);
      if (d < minDist) { minDist = d; nearest = obj; }
    });
    if (nearest) nearest.interact();
  }

  _interactDoor(obj) {
    if (GameState.get('door_unlocked')) {
      GameState.set('escape_attempted', true);
      if (window.AudioManagerInstance) window.AudioManagerInstance.playAlarm();
      this.cameras.main.shake(180, 0.003);
      const ending = GameState.checkEndingConditions();
      if (ending) { this.finalManager.trigger(ending); }
      else {
        this.dialogManager.show([
          'ACESSO CONCEDIDO.',
          'Mas algo te impede.',
          'Ainda não é hora.',
        ], { title: 'PORTA DE SEGURANÇA' });
      }
    } else { this._showCodePuzzle(); }
  }

  _showCodePuzzle() {
    if (!GameState.get('log07_deleted')) {
      this.dialogManager.show([
        'CONTROL SERVER // ACESSO NEGADO',
        'O protocolo de abertura está oculto.',
        '',
        'O sistema registrou uma alteração no LOG_07.',
        'Descubra o que mudou antes de tentar a porta novamente.',
      ], { title: 'CONTROL SERVER // GATE' });
      return;
    }

    this.dialogManager.show([
      'CONTROL SERVER // HANDSHAKE',
      '',
      'O código numérico não é mais aceito.',
      'A porta exige quatro operações em sequência.',
      '',
      'TRACE precisa acontecer antes de AUTH.',
      'AUTH precisa acontecer antes de SYNC.',
      'OPEN sempre encerra o handshake.',
      '',
      '// Reproduza a sequência para liberar o acesso.',
    ], {
      title: 'PORTA DE SEGURANÇA // PROTOCOLO',
      onClose: () => this._showDoorSequence(),
    });
  }

  _showDoorSequence() {
    this.uiManager.openSequence({
      title: '// CONTROL SERVER // HANDSHAKE',
      items: ['TRACE', 'AUTH', 'SYNC', 'OPEN'],
      validator: answer => this.puzzleManager.checkAnswer(
        FORK_CONFIG.PUZZLES.DOOR_SEQUENCE,
        answer
      ),
      onSuccess: () => {
        if (window.AudioManagerInstance) window.AudioManagerInstance.playDoor();

        GameState.save();

        if (this._controlRoomGate) {
          this.tweens.add({
            targets: this._controlRoomGate,
            alpha: 0,
            scaleX: 0.05,
            duration: 420,
            ease: 'Power2',
            onComplete: () => {
              if (this._controlRoomGate.body) this._controlRoomGate.body.enable = false;
              this._controlRoomGate.setVisible(false);
            },
          });
        }

        const doorObj = this._objects.find(o => o.id === 'door_security');
        if (doorObj) {
          doorObj._label.setText('PORTA // ABERTA');
          doorObj._body.clear();
          doorObj._body.fillStyle(0x1a3540, 0.72);
          doorObj._body.fillRoundedRect(780 - 29, 250 - 6, 58, 12, 4);
          doorObj._body.lineStyle(2, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 0.95);
          doorObj._body.strokeRoundedRect(780 - 29, 250 - 6, 58, 12, 4);
          doorObj.setEnabled(true);
        }

        ['server_main', 'panel_sequence'].forEach(id => {
          const obj = this._objects.find(o => o.id === id);
          if (obj) obj.setEnabled(true);
        });

        this.animationManager.doorOpen(780, 250);
        this.cameras.main.flash(180, 90, 220, 255, false);
        this.cameras.main.shake(220, 0.004);
        this._setSystemMessage('HANDSHAKE ACEITO // CONTROL SERVER LIBERADO');
        this.time.delayedCall(450, () => {
          this.dialogManager.show([
            'HANDSHAKE ACEITO.',
            'A porta do Control Server foi liberada.',
            'O sistema registrou cada etapa do acesso.',
            '',
            '// SERVER A está aguardando dentro da sala.',
          ], { title: 'CONTROL SERVER // ACCESS GRANTED' });
        });
      },
    });
  }

  _interactServer() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.SERVER_SEQUENCE)) {
      this.dialogManager.show([
        'SERVER A — REBOOTED',
        'Status: Nominal.',
        GameState.get('log07_deleted')
          ? '// LOG_07 ausente — anomalia persiste nos registros.'
          : '// Todos os logs intactos.',
        GameState.get('log07_deleted')
          ? '// A pasta /restricted está acessível.'
          : '',
      ], { title: 'SERVER A' });
      return;
    }
    // Mostra pista dos LEDs antes do puzzle
    this.dialogManager.show(NARRATIVE.serverLEDs, {
      title: 'SERVER A',
      onClose: () => this._showSequencePuzzle(),
    });
  }

  _showSequencePuzzle() {
    this.uiManager.openSequence({
      title: '// SERVER SEQUENCE // PULSES',
      items: ['A', 'B', 'C', 'D'],
      validator: answer => this.puzzleManager.checkAnswer(
        FORK_CONFIG.PUZZLES.SERVER_SEQUENCE,
        answer
      ),
      onSuccess: () => {
        this.animationManager.flash('success');
        this._spawnSecretFile();
        this._setSystemMessage('SERVER — REBOOTED // PROJECT_B DETECTED');
        this.dialogManager.show([
          'SEQUÊNCIA ACEITA.',
          'SERVIDOR A REINICIANDO...',
          'A pasta /restricted agora existe.',
          'No próximo loop, algo novo estará esperando.',
        ], { title: 'SERVER A' });
      },
    });
  }

  _interactPanel() {
    this.dialogManager.show(['PANEL — OFFLINE', 'Requires server connection.', 'Reinicie o servidor primeiro.'], { title: 'CONTROL PANEL' });
  }

  _interactFile() {
    this.dialogManager.show([
      'NOTES.txt',
      '─────────────────────────────────',
      '"A porta nunca abre na primeira vez.',
      ' Mas sempre abre na segunda."',
      '',
      '"Delete o que o sistema não quer que você veja."',
      '─────────────────────────────────',
    ], { title: 'NOTES' });
    GameState.addButterflyStep('read_notes');
  }

  _interactEntity() {
    const trust   = GameState.get('entity_trust');
    const deleted = GameState.get('log07_deleted');
    const rebooted= GameState.get('server_rebooted');
    const msgs    = NARRATIVE.entity;

    // Entidade dá hints progressivos e contextuais
    if (trust === 0) {
      this.dialogManager.show(msgs.first_contact, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust === 1 && !deleted) {
      this.dialogManager.show(msgs.hint_log07, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust <= 2 && deleted && !rebooted) {
      this.dialogManager.show(msgs.hint_server, { title: '???' });
      GameState.increment('entity_trust');
    } else if (trust <= 3 && deleted && rebooted) {
      this.dialogManager.show(msgs.hint_butterfly, { title: '???' });
      GameState.increment('entity_trust');
    } else {
      this.dialogManager.show(msgs.warning, { title: '???' });
    }
  }

  _interactCamera() {
    const awareness = GameState.get('system_awareness');
    let msgs;
    // Efeito borboleta: quanto mais o sistema sabe de você, mais a câmera revela
    if (awareness >= 3 && GameState.get('log07_deleted') && GameState.get('server_rebooted')) {
      // Pista do morse para BUTTERFLY — só aparece quando tudo foi ativado
      msgs = NARRATIVE.camera.morse;
    } else if (awareness >= 2) {
      msgs = NARRATIVE.camera.aware;
    } else {
      msgs = NARRATIVE.camera.standard;
    }
    this.dialogManager.show(msgs, { title: 'SECURITY CAMERA' });
    GameState.increaseSystemAwareness(1);
  }

  _interactSecretFile() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.HIDDEN_FILE)) {
      this.dialogManager.show([
        'PROJECT_B.enc — ALREADY DECRYPTED.',
        'Você encontrou o experimento.',
        'Mas ainda não encontrou quem o observa.',
      ], { title: 'PROJECT_B.enc' });
      return;
    }

    this.dialogManager.show([
      'PROJECT_B.enc — ENCRYPTED',
      'A coordinate was left in the fragment:',
      '',
      'COORDINATE',
      '-15.7939 / -47.8828',
      '',
      '// The key is the place.',
      '// Do not enter the coordinates.',
    ], {
      title: 'SECRET FILE',
      onClose: () => this.uiManager.openWordInput({
        title: '// DECRYPTION KEY',
        maxLength: 20,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.HIDDEN_FILE,
          value
        ),
        onSuccess: () => {
          this.animationManager.flash('success');
          this._setSystemMessage('PROJECT BUTTERFLY — FILE DECRYPTED');
          this.dialogManager.show([
            'LOCATION IDENTIFIED.',
            'BRASÍLIA // -15.7939 / -47.8828',
            'A hidden directory has been mounted.',
            '// The system did not expect you to look outside the simulation.',
          ], { title: 'PROJECT_B.enc' });
        },
      }),
    });
  }

  _interactMemoryPanel() {
    if (GameState.get('memory_code_found')) {
      this.dialogManager.show([
        'MEMORY PANEL — UNLOCKED.',
        'The observer room is accessible.',
        '// Someone has been watching every loop.',
      ], { title: 'MEMORY PANEL' });
      return;
    }

    this.dialogManager.show([
      'MEMORY PANEL',
      'A four-digit fragment is burned into the display.',
      '....-  ..---  .----  --...',
      '// Four digits. One language. Decode before entering.',
      '// The panel is speaking in pulses, not numbers.',
    ], {
      title: 'MEMORY PANEL',
      onClose: () => this.uiManager.openCodeInput({
        title: '// MEMORY FRAGMENT',
        length: 4,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.MEMORY_CODE,
          value
        ),
        onSuccess: () => {
          this._setSystemMessage('OBSERVER ROOM — ACCESS GRANTED');
          this.dialogManager.show([
            'MEMORY ACCEPTED.',
            'The system did not generate this memory.',
            'Something else left it for you.',
          ], { title: 'OBSERVER ACCESS' });
        },
      }),
    });
  }

  _interactObserver() {
    if (GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE)) {
      this.dialogManager.show([
        'OBSERVER — COMPLETE.',
        'The sequence has already been executed.',
        'One final fragment remains.',
      ], { title: 'OBSERVER' });
      return;
    }

    this.dialogManager.show([
      'OBSERVER ROOM',
      'Three controls appear on the console:',
      'WATCH / PAUSE / RELEASE',
      '// First observe. Then stop what you saw. Only then let it go.',
    ], {
      title: 'OBSERVER',
      onClose: () => this.uiManager.openSequence({
        title: '// OBSERVER PROTOCOL',
        items: ['WATCH', 'PAUSE', 'RELEASE'],
        validator: answer => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE,
          answer
        ),
        onSuccess: () => {
          this.dialogManager.show([
            'OBSERVER PROTOCOL ACCEPTED.',
            'The system was not watching the player.',
            'It was watching its own predictions.',
          ], { title: 'OBSERVER' });
          if (!GameState.isPuzzleSolved(FORK_CONFIG.PUZZLES.BUTTERFLY)) {
            this.puzzleManager.checkAnswer(FORK_CONFIG.PUZZLES.BUTTERFLY, []);
          }
        },
      }),
    });
  }

  _interactIdentity() {
    if (GameState.get('identity_fragment_found')) {
      this.dialogManager.show([
        'IDENTITY FRAGMENT — ALREADY EXTRACTED.',
        'ORIGIN: YOU.',
        '// The system predicted your escape attempt before you made it.',
      ], { title: 'IDENTITY' });
      return;
    }

    this.dialogManager.show([
      'IDENTITY FRAGMENT',
      'A label appears on the monitor:',
      '01001111 01010010 01001001 01000111 01001001 01001110',
      '// Six bytes. ASCII.',
      '// Decode the label before the system does.',
    ], {
      title: 'IDENTITY',
      onClose: () => this.uiManager.openWordInput({
        title: '// IDENTITY VERIFICATION',
        maxLength: 16,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.IDENTITY_WORD,
          value
        ),
        onSuccess: () => {
          this.animationManager.glitch(700, 12);
          this._setSystemMessage('IDENTITY CONFIRMED — SYSTEM PREDICTION EXPOSED');
          this.dialogManager.show([
            'IDENTITY CONFIRMED.',
            'You were not an unknown user.',
            'You were the subject the entire time.',
            'Now ask the final question: who is controlling whom?',
          ], { title: 'IDENTITY' });
        },
      }),
    });
  }

  // ── HUD ───────────────────────────────────────────────────

  _buildHUD() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const C = FORK_CONFIG.COLORS;
    const F = FORK_CONFIG.FONT;
    const sf = (obj) => { obj.setScrollFactor(0); return obj; };

    sf(this.add.rectangle(0, 0, W, 28, C.HIGHLIGHT, 0.96).setOrigin(0,0).setDepth(90));
    sf(this.add.text(12, 4, 'FORK', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#39ff14', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:12, fill:true } }).setDepth(91));

    this._hudLoop  = sf(this.add.text(W/2, 4, 'LOOP 01', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#33aa33', shadow: { offsetX:0, offsetY:0, color:'#00ff41', blur:6, fill:true } }).setOrigin(0.5,0).setDepth(91));
    this._hudTimer = sf(this.add.text(W-12, 4, 'TIME: 03:00', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#9be8ff', shadow: { offsetX:0, offsetY:0, color:'#59d8ff', blur:8, fill:true } }).setOrigin(1,0).setDepth(91));
    this._timerBar = sf(this.add.rectangle(0, 28, W, 3, C.ACCENT, 1).setOrigin(0,0).setDepth(91));

    sf(this.add.rectangle(0, H-22, W, 22, C.HIGHLIGHT, 0.92).setOrigin(0,0).setDepth(90));
    this._hudSystemMsg  = sf(this.add.text(12, H-14, '> SYSTEM: Awaiting input.', { fontFamily: F.FAMILY, fontSize: '11px', color: '#33aa33' }).setDepth(91));
    this._hudAwareness  = sf(this.add.text(W-12, H-14, '', { fontFamily: F.FAMILY, fontSize: '11px', color: '#ff9aa6', shadow: { offsetX:0, offsetY:0, color:'#ff6678', blur:6, fill:true } }).setOrigin(1,0).setDepth(91));
    this._criticalAlert = sf(this.add.text(W-150, H-14, '', {
      fontFamily: F.FAMILY,
      fontSize: '10px',
      color: '#ff9aa6',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6678', blur: 5, fill: true }
    }).setOrigin(1,0).setDepth(91));
  }

  _updateCorruptionEffects() {
    const level = GameState.get('corruption_level') || 0;
    if (level === this._lastCorruptionLevel) return;
    this._lastCorruptionLevel = level;

    const disappear = {
      // Primeiro: objetos puramente decorativos.
      1: ['cabinet_01', 'monitor_01'],
      2: ['cabinet_02', 'monitor_02', 'rack_01'],
      // Só depois a corrupção alcança elementos da história.
      3: ['monitor_03', 'camera_01'],
      4: ['file_notes', 'entity', 'panel_sequence'],
      5: ['server_main', 'door_security'],
    };

    const ids = [];
    for (let i = 1; i <= level; i++) {
      (disappear[i] || []).forEach(id => ids.push(id));
    }

    this._objects.forEach(obj => {
      if (ids.includes(obj.id) && obj.enabled) {
        obj.removeFromSimulation();
      }
    });

    if (level > 0) {
      this.cameras.main.shake(120 + level * 40, 0.0015 * level);
      this.cameras.main.flash(90, 0, 255, 65, false);
      if (window.AudioManagerInstance) window.AudioManagerInstance.playAlarm();

      const warnings = {
        1: [
          'AVISO: algo desapareceu do ambiente.',
          'O CLEAR deveria afetar apenas o terminal.',
          'Você acabou de ver uma alteração que não deveria existir.',
        ],
        2: [
          'ALERTA: a limpeza está ficando intensa.',
          'Os equipamentos estão sendo removidos da sala diante dos seus olhos.',
          'O CLEAR está apagando objetos físicos da simulação.',
        ],
        3: [
          'ERRO: a corrupção alcançou o ambiente.',
          'A simulação está apagando partes que você não escolheu remover.',
          'Pare de usar CLEAR. A limpeza atravessou a interface e chegou ao ambiente.',
        ],
        4: [
          'FALHA DE INTEGRIDADE: elementos da investigação desapareceram.',
          'O sistema está perdendo memória física.',
          'Você alterou a simulação mais do que pretendia.',
        ],
        5: [
          'CORRUPÇÃO CRÍTICA.',
          'A estrutura da simulação está sendo apagada.',
          'O que desaparecer agora pode não voltar.',
        ],
      };

      this._setSystemMessage(warnings[level]?.[0] || 'CORRUPÇÃO DETECTADA');

      if (this.dialogManager && !this.dialogManager.isOpen && !GameState.volatile.terminal_open) {
        this.dialogManager.show(warnings[level] || warnings[5], {
          title: level >= 3 ? 'SISTEMA // FALHA' : 'SISTEMA // AVISO',
        });
      }

      if (level >= 5 && !this._hardCorruption) {
        this._triggerHardCorruption();
      }
    }
  }

  _triggerHardCorruption() {
    if (this._hardCorruption) return;
    this._hardCorruption = true;
    this.loopManager.stop();
    GameState.clearSave();
    GameState.volatile.modal_open = true;

    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;
    const F = FORK_CONFIG.FONT;

    this.cameras.main.shake(700, 0.012);
    this.cameras.main.flash(500, 255, 60, 80, false);
    if (window.AudioManagerInstance) window.AudioManagerInstance.playAlarm();

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.94)
      .setOrigin(0, 0).setDepth(300).setScrollFactor(0);

    const title = this.add.text(W / 2, H / 2 - 110, 'SYSTEM CORRUPTED', {
      fontFamily: F.FAMILY_TITLE, fontSize: '34px', color: '#ff9aa6',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6678', blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const body = this.add.text(W / 2, H / 2 - 40, [
      'CRITICAL INTEGRITY FAILURE',
      '',
      'The simulation can no longer be restored.',
      'No recovery save exists.',
      '',
      'ALL SESSION STATE HAS BEEN LOST.',
      '',
      '// RESTART THE GAME TO BEGIN AGAIN.',
    ].join('\n'), {
      fontFamily: F.FAMILY,
      fontSize: '13px',
      color: F.COLOR_SYSTEM,
      align: 'center',
      lineSpacing: 7,
      wordWrap: { width: 650 },
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const restart = this.add.text(W / 2, H / 2 + 110, '[ REINICIAR JOGO ]', {
      fontFamily: F.FAMILY,
      fontSize: '15px',
      color: F.COLOR_PRIMARY,
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

    restart.on('pointerover', () => restart.setColor(F.COLOR_WHITE).setScale(1.05));
    restart.on('pointerout', () => restart.setColor(F.COLOR_PRIMARY).setScale(1));
    restart.on('pointerdown', () => {
      GameState.clearSave();
      GameState.persistent = {
        loop_count: 0,
        phase: FORK_CONFIG.PHASES.AWAKENING,
        memory_code_found: false,
        observer_unlocked: false,
        identity_fragment_found: false,
        fork_sequence_complete: false,
        log07_deleted: false,
        server_rebooted: false,
        door_unlocked: false,
        secret_area_found: false,
        entity_trust: 0,
        system_awareness: 0,
        butterfly_steps: [],
        player_identity_known: false,
        escape_attempted: false,
        commands_executed: [],
        puzzles_solved: [],
        ending_flags: {},
        clear_count: 0,
        corruption_level: 0,
        filesystem_wiped: false,
        system_notes_read: false,
        restore_requested: false,
        system_restored: false,
      };
      GameState.resetVolatile();
      this.scene.start('MenuScene');
    });
  }

  _updateHUD {
    const loop      = GameState.get('loop_count');
    const time      = this.loopManager.getFormattedTime();
    const progress  = this.loopManager.getProgress();
    const awareness = GameState.get('system_awareness');
    const W         = FORK_CONFIG.WIDTH;
    const F         = FORK_CONFIG.FONT;

    this._hudLoop.setText(`LOOP ${String(loop).padStart(2,'0')}`);
    this._hudTimer.setText(`TIME: ${time}`);
    this._timerBar.setDisplaySize(W * progress, 3);

    if (this.loopManager.isCritical()) {
      this._hudTimer.setColor(F.COLOR_DANGER);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.DANGER);
    } else if (this.loopManager.isWarning()) {
      this._hudTimer.setColor(F.COLOR_WARNING);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.WARNING);
    } else {
      this._hudTimer.setColor(F.COLOR_PRIMARY);
      this._timerBar.setFillStyle(FORK_CONFIG.COLORS.ACCENT);
    }

    if (awareness > 0) {
      this._hudAwareness.setText(`SYS [${('|').repeat(awareness)}${('·').repeat(5 - awareness)}]`);
    }
  }

  _setSystemMessage(msg) {
    if (this._hudSystemMsg) this._hudSystemMsg.setText(`> SYSTEM: ${msg}`);
  }

  // ── Loop callbacks ────────────────────────────────────────

  _setupLoopCallbacks() {
    this.loopManager
      .on('onWarning',  () => { this._setSystemMessage('WARNING — Loop reset imminent.'); this.dialogManager.showSystem('WARNING: 60 seconds remaining.'); })
      .on('onCritical', () => { this._setSystemMessage('CRITICAL — System resetting soon.'); })
      .on('onReset',    () => { this.scene.start('ResetScene'); });
  }

  _showLoopStart() {
    const loopNum  = GameState.get('loop_count');
    const deleted  = GameState.get('log07_deleted');
    const rebooted = GameState.get('server_rebooted');

    let msgs = NARRATIVE.loopStart(loopNum);

    // Adiciona reações específicas às ações do loop anterior
    if (loopNum > 1) {
      if (deleted && rebooted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.both);
      } else if (deleted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.log07_deleted);
      } else if (rebooted) {
        msgs = msgs.concat(NARRATIVE.systemReactions.server_rebooted);
      }
    }

    this.time.delayedCall(400, () => {
      this.dialogManager.show(msgs, { title: `LOOP ${String(loopNum).padStart(2,'0')}` });
    });
  }
}

  window.GameScene = GameScene;
})();
