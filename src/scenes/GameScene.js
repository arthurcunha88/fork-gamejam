(function () {
// ============================================================
const NARRATIVE = {
  door: {
    locked_no_clue: ['PORTA DE SEGURANÇA','O acesso está sincronizado com um evento que ainda não aconteceu.','// O sistema não entrega a resposta diretamente.'],
    locked_has_clue: ['PORTA DE SEGURANÇA','Uma alteração anterior deixou um rastro no sistema.','O relógio continua registrando o momento da mudança.','// Descubra o que mudou antes de tentar abrir.'],
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
  playerIntro: [
    'Eu estava brincando com alguns servidores.',
    'Era só um teste. Eu estava explorando os limites da simulação.',
    'Então alguma coisa mudou — e eu fiquei preso dentro da própria Matrix.',
    '',
    'Quando consegui olhar ao redor, percebi que o sistema não estava igual.',
    'Existem alterações que não foram feitas por mim.',
    'Há processos suspeitos rodando nos servidores.',
    '',
    'E tem uma coisa pior: a própria saída pode ter sido modificada.',
    'Se alguém conseguiu alterar o caminho de saída, talvez também esteja controlando o que eu encontro.',
    '',
    'Preciso investigar o sistema antes que ele perceba que eu acordei.'
  ],
  systemReactions: {
    both: ['O sistema detectou duas alterações persistentes.','// A cadeia de consequências está se acumulando.'],
    log07_deleted: ['LOG_07 continua ausente.','// O sistema sabe que você o removeu.'],
    server_rebooted: ['SERVER A já foi reiniciado.','// O presente carrega uma decisão de outro loop.'],
  },
};

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  preload() {
    this.load.spritesheet('player_idle_down', 'player/Idle/idle_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_up', 'player/Idle/idle_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_left_down', 'player/Idle/idle_left_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_left_up', 'player/Idle/idle_left_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_right_down', 'player/Idle/idle_right_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_right_up', 'player/Idle/idle_right_up.png', { frameWidth: 48, frameHeight: 64 });

    this.load.spritesheet('player_walk_down', 'player/Walk/walk_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_walk_up', 'player/Walk/walk_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_walk_left_down', 'player/Walk/walk_left_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_walk_left_up', 'player/Walk/walk_left_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_walk_right_down', 'player/Walk/walk_right_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_walk_right_up', 'player/Walk/walk_right_up.png', { frameWidth: 48, frameHeight: 64 });

    // Tilemap pixel-art fornecido para enriquecer o ambiente sem substituir
    // a arquitetura procedural atual do mapa.
    this.load.spritesheet(
      'cosmic_tiles',
      'assets/tilemap/CosmicLilac_Tiles.png',
      { frameWidth: 16, frameHeight: 16 }
    );
    this.load.image('fork_lab_props', 'assets/fork-lab-props.svg');
    this.load.image('fork_emblem', 'assets/fork-emblem.svg');
  }

  create() {
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    this.loopManager   = new LoopManager(this);
    window.LoopManagerInstance = this.loopManager;
    this.puzzleManager = new PuzzleManager();
    this.dialogManager = new DialogManager(this);
    this.finalManager  = new FinalManager(this);
    this.uiManager     = new UIManager(this, this.loopManager);
    this.animationManager = new AnimationManager(this);
    window.AnimationManagerInstance = this.animationManager;

    this._wallRects = [];
    this._buildMap();
    this._buildRoomColliders();
    this._buildMapDynamics();
    this._buildAssetDecor();

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
    this.cameras.main.startFollow(this.player.getPhysicsBody(), true, 1, 1);
    this.cameras.main.roundPixels = true;

    this._setupLoopCallbacks();
    // O primeiro loop só começa depois da apresentação inicial.
    // Isso garante que a lore seja lida antes da exploração e que o tempo não corra durante a abertura.
    this._showLoopStart(() => this.loopManager.start());

    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.P
    ]);

    this._pauseKeyHandler = (event) => {
      if (event.keyCode !== Phaser.Input.Keyboard.KeyCodes.P) return;
      if (this._hardCorruption) return;

      // P é exclusivamente o atalho de pausa. O ESC fica reservado
      // para voltar/fechar a interação que estiver em primeiro plano.
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
      // Não deixa o clique do HUD atravessar para o mundo.
      if (ptr.y <= 34 && ptr.x >= FORK_CONFIG.WIDTH - 120) return;
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

    const close = this.add.text(W / 2, H / 2 + 122, '[ ESC ] VOLTAR   //   [ P ] PAUSAR', {
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
      if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
        event.preventDefault();
        this._closePause();
      } else if (event.key === 'ArrowUp') {
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

    // Grade discreta: arquitetura primeiro, efeitos depois.
    gfx.lineStyle(1, C.GRID, 0.34);
    for (let x = 0; x <= W; x += 32) gfx.moveTo(x, 28).lineTo(x, H - 22);
    for (let y = 28; y <= H - 22; y += 32) gfx.moveTo(0, y).lineTo(W, y);
    gfx.strokePath();

    // Novo layout:
    // MAIN LAB à esquerda, SERVER ROOM no alto à direita,
    // STORAGE embaixo à direita. O Server Room vira o ponto de passagem
    // para o Storage depois que a porta é liberada.
    this._drawRoom(gfx, 60, 52, 540, 528, false);
    this._drawRoom(gfx, 650, 52, 250, 228, true);
    this._drawRoom(gfx, 650, 328, 250, 252, true);
    this._drawRoomConnector(gfx);
    this._buildPixelFloorAccents();

    this._drawDigitalRain(0, 28, W, H - 50);

    // Piso da área central: linhas longas, pouco brilho.
    gfx.lineStyle(1, C.ACCENT_DIM, 0.10);
    for (let x = 92; x < 900; x += 96) {
      gfx.moveTo(x, 78).lineTo(x, 555);
    }
    for (let y = 92; y < 555; y += 88) {
      gfx.moveTo(82, y).lineTo(878, y);
    }
    gfx.strokePath();

    // Circuitos só nos cantos para não competir com os objetos.
    gfx.lineStyle(2, C.ACCENT_DIM, 0.13);
    [
      [[92,125],[220,125],[220,170],[300,170]],
      [[420,520],[520,520],[520,470],[580,470]],
      [[680,100],[760,100],[760,150]],
      [[700,500],[780,500],[780,450],[850,450]]
    ].forEach(route => {
      route.forEach(([px,py], i) => {
        if (i === 0) gfx.moveTo(px,py);
        else gfx.lineTo(px,py);
      });
      gfx.strokePath();
    });

    const labelStyle = {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '20px',
      color: '#7ed6ff',
      shadow: { offsetX:0, offsetY:0, color:'#3c8eac', blur:10, fill:true }
    };

    this.add.text(92, 66, '// MAIN LAB', labelStyle).setDepth(2);
    this.add.text(674, 66, '// SERVER ROOM', labelStyle).setDepth(2);
    this.add.text(674, 342, '// STORAGE // RESTRICTED', labelStyle).setDepth(2);


  }

  _buildAssetDecor() {
    if (!this.textures.exists('fork_lab_props')) return;

    // Ambientação: poucos assets, posicionados nos "vazios" do mapa.
    // A intenção é preencher os blocos escuros sem competir com puzzles,
    // personagens ou textos.
    const props = [
      // MAIN LAB — infraestrutura nas bordas.
      [118, 145, 0, 0.68],
      [520, 145, 64, 0.62],
      [118, 510, 128, 0.58],
      [520, 510, 192, 0.58],

      // SERVER ROOM — equipamentos nas extremidades.
      [692, 110, 64, 0.64],
      [850, 110, 128, 0.64],

      // STORAGE — caixas e terminais mais discretos.
      [690, 390, 0, 0.56],
      [850, 390, 64, 0.56],
      [690, 515, 128, 0.52],
      [850, 515, 192, 0.52],
    ];

    props.forEach(([x, y, sx, alpha]) => {
      this.add.image(x, y, 'fork_lab_props')
        .setOrigin(0.5)
        .setCrop(sx, 0, 64, 64)
        .setScale(0.66)
        .setAlpha(alpha)
        .setDepth(0.45);
    });

    // Emblema FORK no piso do laboratório: marca visual sutil, sem virar
    // mais um ponto de atenção durante os puzzles.
    if (this.textures.exists('fork_emblem')) {
      this.add.image(575, 530, 'fork_emblem')
        .setOrigin(0.5)
        .setScale(0.40)
        .setAlpha(0.12)
        .setDepth(0.18);
    }
  }

  _buildPixelFloorAccents() {
    // O tileset tem uma identidade lilás forte. Em vez de cobrir o mapa,
    // usamos pequenos módulos como detalhes de piso/infraestrutura e os
    // deixamos com baixa opacidade para conversar com a paleta FORK.
    if (!this.textures.exists('cosmic_tiles')) return;

    const accents = [
      // MAIN LAB — pequenos módulos preenchendo áreas vazias, sempre encostados
      // nas paredes para manter o centro livre para exploração.
      [96, 96, 4], [112, 96, 4], [128, 96, 4],
      [96, 112, 4], [112, 112, 4],
      [548, 96, 8], [564, 96, 8],
      [548, 112, 8], [564, 112, 8],
      [96, 544, 12], [112, 544, 12],
      [544, 544, 12], [560, 544, 12],

      // SERVER ROOM — duas pequenas faixas técnicas.
      [680, 92, 14], [696, 92, 14],
      [856, 92, 14], [872, 92, 14],
      [680, 252, 16], [696, 252, 16],
      [856, 252, 16], [872, 252, 16],

      // STORAGE — detalhes de piso junto às bordas.
      [680, 368, 20], [696, 368, 20],
      [856, 368, 20], [872, 368, 20],
      [680, 544, 24], [696, 544, 24],
      [856, 544, 24], [872, 544, 24],
    ];

    accents.forEach(([x, y, frame]) => {
      this.add.sprite(x, y, 'cosmic_tiles', frame)
        .setOrigin(0.5)
        .setAlpha(0.18)
        .setDepth(0.35);
    });
  }

  _drawRoomConnector(gfx) {
    const C = FORK_CONFIG.COLORS;

    // Corredor físico entre o laboratório e as salas restritas.
    gfx.fillStyle(0x0a1118, 1);
    gfx.fillRect(600, 146, 50, 76);

    gfx.fillStyle(0x101c25, 1);
    gfx.fillRect(604, 150, 42, 68);

    gfx.lineStyle(1, C.ACCENT_DIM, 0.34);
    gfx.strokeRect(600, 146, 50, 76);

    // Piso em módulos, inspirado em tiles pixelados.
    for (let i = 0; i < 4; i++) {
      gfx.fillStyle(i % 2 === 0 ? 0x16232c : 0x101a22, 1);
      gfx.fillRect(606 + i * 10, 154, 8, 60);
    }

    // Trilhas de energia e pequenos pontos de leitura.
    gfx.lineStyle(2, C.PURPLE, 0.18);
    gfx.lineBetween(606, 157, 644, 157);
    gfx.lineBetween(606, 211, 644, 211);
    gfx.fillStyle(C.MAGENTA, 0.55);
    gfx.fillRect(609, 160, 3, 3);
    gfx.fillStyle(C.ACCENT_BRIGHT, 0.65);
    gfx.fillRect(638, 208, 3, 3);

    // Moldura da porta: mais espessa e visualmente "conectada" às paredes.
    gfx.fillStyle(0x050a0f, 1);
    gfx.fillRect(601, 165, 48, 40);
    gfx.lineStyle(2, 0x4f6570, 0.9);
    gfx.strokeRect(601, 165, 48, 40);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.65);
    gfx.strokeRect(605, 169, 40, 32);

    // Leitor central e indicador de estado.
    gfx.fillStyle(0x0b1319, 1);
    gfx.fillRect(618, 172, 14, 26);
    gfx.lineStyle(1, C.ACCENT_DIM, 0.8);
    gfx.strokeRect(618, 172, 14, 26);
    gfx.fillStyle(GameState.get('door_unlocked') ? C.GREEN : C.WARNING, 0.95);
    gfx.fillRect(622, 177, 6, 3);
    gfx.fillStyle(0x263741, 1);
    for (let i = 0; i < 3; i++) gfx.fillRect(621, 183 + i * 4, 8, 2);

    // Setas deixam explícito que existe um espaço jogável do outro lado.
    gfx.fillStyle(C.ACCENT_BRIGHT, 0.55);
    gfx.fillRect(607, 210, 8, 2);
    gfx.fillRect(610, 207, 2, 8);
    gfx.fillRect(635, 210, 8, 2);
    gfx.fillRect(641, 207, 2, 8);

  }

  _buildMapDynamics() {
    const C = FORK_CONFIG.COLORS;
    const W = FORK_CONFIG.WIDTH;
    const H = FORK_CONFIG.HEIGHT;

    const nodes = [
      [220,125,C.ACCENT],
      [560,470,C.ACCENT_BRIGHT],
      [760,110,C.PURPLE],
      [820,430,C.GREEN],
    ];

    nodes.forEach(([x,y,color]) => {
      const node = this.add.circle(x, y, 2.5, color, 0.35).setDepth(2);
      this.tweens.add({
        targets: node,
        alpha: { from: 0.12, to: 0.5 },
        scale: { from: 0.85, to: 1.15 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    const scan = this.add.rectangle(W / 2, 42, W - 150, 1, C.ACCENT_BRIGHT, 0.12).setDepth(2);
    this.tweens.add({
      targets: scan,
      y: H - 48,
      duration: 7600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const status = this.add.text(W - 82, 565, 'LIVE', {
      fontFamily: "'VT323', monospace",
      fontSize: '14px',
      color: '#6e91a0',
    }).setDepth(2);
    this.tweens.add({
      targets: status,
      alpha: { from: 0.9, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  _buildRoomColliders() {
    // O mapa é dividido em três espaços físicos:
    // MAIN LAB -> SERVER ROOM -> STORAGE.
    // Cada passagem possui uma abertura única, controlada por uma barreira.
    const addWall = (x, y, width, height) => {
      const wall = this.add.rectangle(x, y, width, height, 0x000000, 0)
        .setVisible(false);
      this.physics.add.existing(wall, true);
      wall.body.setSize(width, height);
      this._wallRects.push(wall);
      return wall;
    };

    // MAIN LAB: fechado em todo o perímetro, exceto a passagem para o Server Room.
    addWall(330, 52, 540, 12);       // topo
    addWall(330, 580, 540, 12);      // base
    addWall(60, 316, 12, 528);       // esquerda
    addWall(600, 99, 12, 94);        // direita — acima da porta
    addWall(600, 401, 12, 358);      // direita — abaixo da porta

    // SERVER ROOM: única entrada pela porta da esquerda e única saída pelo Storage.
    addWall(775, 52, 250, 12);       // topo
    addWall(900, 166, 12, 228);      // direita
    addWall(650, 99, 12, 94);        // esquerda — acima da porta
    addWall(650, 250, 12, 60);       // esquerda — abaixo da porta
    addWall(700, 280, 50, 12);       // base — antes da porta do Storage
    addWall(825, 280, 75, 12);       // base — depois da porta do Storage

    // STORAGE: fechado, com uma única passagem no topo para o Server Room.
    addWall(700, 328, 100, 12);      // topo — antes da passagem
    addWall(850, 328, 50, 12);       // topo — depois da passagem
    addWall(775, 580, 250, 12);      // base
    addWall(650, 454, 12, 252);      // esquerda
    addWall(900, 454, 12, 252);      // direita
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
    const C = FORK_CONFIG.COLORS;
    const color = isSecondary ? C.ACCENT_DIM : C.ACCENT;
    const alpha = isSecondary ? 0.34 : 0.46;
    const thick = 12;

    gfx.fillStyle(isSecondary ? 0x080f15 : 0x071018, 0.98);
    gfx.fillRect(x + 2, y + 2, w - 4, h - 4);

    gfx.lineStyle(isSecondary ? 1.5 : 2, color, alpha);
    gfx.strokeRect(x, y, w, h);

    // Molduras em degraus: linguagem de pixel-art sem precisar de sprites.
    gfx.lineStyle(2, color, alpha + 0.14);
    const cs = 18;
    gfx.moveTo(x, y + cs).lineTo(x, y).lineTo(x + cs, y);
    gfx.moveTo(x + w - cs, y).lineTo(x + w, y).lineTo(x + w, y + cs);
    gfx.moveTo(x, y + h - cs).lineTo(x, y + h).lineTo(x + cs, y + h);
    gfx.moveTo(x + w - cs, y + h).lineTo(x + w, y + h).lineTo(x + w, y + h - cs);
    gfx.strokePath();

    // Faixa de piso por sala.
    if (x === 650 && y === 52) {
      gfx.lineStyle(1, 0x314c59, 0.18);
      for (let yy = y + 40; yy < y + h - 18; yy += 22) {
        gfx.moveTo(x + 18, yy).lineTo(x + w - 18, yy);
      }
      gfx.strokePath();
    } else if (x === 650 && y === 328) {
      gfx.lineStyle(1, 0x4a4a5d, 0.16);
      for (let xx = x + 18; xx < x + w - 18; xx += 34) {
        gfx.moveTo(xx, y + 40).lineTo(xx, y + h - 18);
      }
      for (let yy = y + 40; yy < y + h - 18; yy += 34) {
        gfx.moveTo(x + 18, yy).lineTo(x + w - 18, yy);
      }
      gfx.strokePath();
    } else {
      gfx.lineStyle(1, C.GRID, 0.20);
      for (let yy = y + 40; yy < y + h - 20; yy += 48) {
        gfx.moveTo(x + 18, yy).lineTo(x + w - 18, yy);
      }
      gfx.strokePath();
    }

    // Detalhamento visual: equipamentos fixos, prateleiras, cabos e painéis.
    if (x === 60 && y === 52) {
      // MAIN LAB — bancadas e painéis técnicos.
      gfx.fillStyle(0x111b23, 0.95);
      gfx.fillRect(86, 118, 138, 14);
      gfx.fillRect(86, 124, 8, 72);
      gfx.fillRect(216, 124, 8, 72);
      gfx.lineStyle(1, 0x536b78, 0.65);
      gfx.strokeRect(92, 102, 126, 28);

      gfx.fillStyle(C.PURPLE, 0.16);
      gfx.fillRect(98, 108, 36, 15);
      gfx.fillStyle(C.MAGENTA, 0.12);
      gfx.fillRect(139, 108, 36, 15);
      gfx.fillStyle(C.ACCENT, 0.24);
      gfx.fillRect(180, 108, 32, 15);

      gfx.fillStyle(0x1a2932, 1);
      gfx.fillRect(288, 106, 112, 10);
      gfx.fillRect(288, 106, 10, 58);
      gfx.fillRect(390, 106, 10, 58);
      gfx.lineStyle(1, 0x4e6672, 0.55);
      gfx.strokeRect(296, 116, 96, 44);

      // Cabos e nós decorativos.
      gfx.lineStyle(2, C.PURPLE, 0.18);
      gfx.moveTo(294, 160).lineTo(294, 190).lineTo(330, 190);
      gfx.moveTo(394, 160).lineTo(394, 190).lineTo(430, 190);
      gfx.fillStyle(C.MAGENTA, 0.35);
      gfx.fillRect(326, 187, 4, 4);
      gfx.fillStyle(C.ACCENT_BRIGHT, 0.45);
      gfx.fillRect(426, 187, 4, 4);

      // Faixa de diagnóstico inferior.
      gfx.fillStyle(0x101a22, 1);
      gfx.fillRect(90, 535, 250, 18);
      for (let i = 0; i < 9; i++) {
        gfx.fillStyle(i % 3 === 0 ? C.MAGENTA : C.ACCENT_DIM, 0.28);
        gfx.fillRect(98 + i * 26, 541, 14, 3);
      }
    }

    if (x === 650 && y === 52) {
      // SERVER ROOM — racks, barramentos e console central.
      for (let row = 0; row < 2; row++) {
        const rx = 670 + row * 70;
        gfx.fillStyle(0x101920, 1);
        gfx.fillRect(rx, 112, 58, 98);
        gfx.lineStyle(1, 0x5d727d, 0.65);
        gfx.strokeRect(rx, 112, 58, 98);
        for (let unit = 0; unit < 5; unit++) {
          const uy = 120 + unit * 17;
          gfx.fillStyle(0x1b2a34, 1);
          gfx.fillRect(rx + 6, uy, 46, 11);
          gfx.fillStyle(unit % 2 ? C.ACCENT : C.PURPLE, 0.65);
          gfx.fillRect(rx + 10, uy + 4, 7, 2);
          gfx.fillStyle(unit % 3 === 0 ? C.GREEN : C.MAGENTA, 0.52);
          gfx.fillRect(rx + 42, uy + 3, 3, 3);
        }
      }

      gfx.fillStyle(0x0b1319, 1);
      gfx.fillRect(738, 222, 74, 24);
      gfx.lineStyle(1, C.ACCENT_DIM, 0.55);
      gfx.strokeRect(738, 222, 74, 24);
      gfx.fillStyle(C.ACCENT, 0.22);
      gfx.fillRect(744, 228, 24, 3);
      gfx.fillStyle(C.MAGENTA, 0.20);
      gfx.fillRect(744, 235, 40, 3);
      gfx.fillStyle(C.GREEN, 0.55);
      gfx.fillRect(798, 228, 6, 6);

      gfx.lineStyle(2, C.PURPLE, 0.16);
      gfx.moveTo(680, 100).lineTo(680, 84).lineTo(720, 84);
      gfx.moveTo(790, 100).lineTo(790, 84).lineTo(842, 84);
    }

    if (x === 650 && y === 328) {
      // STORAGE — estantes, caixas, arquivo e uma área de descoberta.
      gfx.fillStyle(0x111a21, 0.96);
      gfx.fillRect(670, 392, 54, 126);
      gfx.lineStyle(1, 0x697783, 0.55);
      gfx.strokeRect(670, 392, 54, 126);
      for (let shelf = 0; shelf < 4; shelf++) {
        const sy = 400 + shelf * 29;
        gfx.fillStyle(0x202d35, 1);
        gfx.fillRect(676, sy, 42, 20);
        gfx.fillStyle(shelf % 2 ? C.PURPLE : C.ACCENT, 0.28);
        gfx.fillRect(681, sy + 4, 18, 3);
        gfx.fillStyle(C.MAGENTA, 0.30);
        gfx.fillRect(704, sy + 4, 8, 3);
      }

      // Caixas de arquivo.
      const boxes = [[748,405,34,28],[790,405,44,28],[748,444,50,30],[808,447,34,26]];
      boxes.forEach(([bx,by,bw,bh], i) => {
        gfx.fillStyle(i % 2 ? 0x202832 : 0x18222a, 1);
        gfx.fillRect(bx, by, bw, bh);
        gfx.lineStyle(1, i % 2 ? C.ACCENT_DIM : C.PURPLE, 0.58);
        gfx.strokeRect(bx, by, bw, bh);
        gfx.fillStyle(i % 2 ? C.MAGENTA : C.ACCENT, 0.38);
        gfx.fillRect(bx + 6, by + 7, Math.max(10, bw - 16), 3);
      });

      // Mesa de triagem e fita de segurança.
      gfx.fillStyle(0x0d151c, 1);
      gfx.fillRect(752, 492, 112, 42);
      gfx.lineStyle(1, 0x596a73, 0.65);
      gfx.strokeRect(752, 492, 112, 42);
      gfx.fillStyle(C.WARNING, 0.16);
      for (let i = 0; i < 7; i++) gfx.fillRect(756 + i * 16, 497, 9, 3);

      gfx.lineStyle(2, C.MAGENTA, 0.12);
      gfx.moveTo(676, 538).lineTo(740, 538).lineTo(740, 555).lineTo(842, 555);
      gfx.fillStyle(C.ACCENT_BRIGHT, 0.32);
      gfx.fillRect(838, 552, 5, 5);
    }
  }

  // ── Objetos interativos ───────────────────────────────────

  _buildObjects() {
    const C = FORK_CONFIG.COLORS;

    // Barreira física real: a partícula não atravessa a porta enquanto o código não for aceito.
    const gateLocked = !GameState.get('door_unlocked');
    this._controlRoomGate = this.add.rectangle(
      625, 185, 50, 76,
      0x050a0f, 0
    ).setDepth(3).setVisible(false);
    this.physics.add.existing(this._controlRoomGate, true);
    this._controlRoomGate.body.setSize(50, 76);
    this._controlRoomGate.body.enable = gateLocked;
    this._wallRects.push(this._controlRoomGate);

    const terminal = new Terminal(this, 185, 235, {
      id: 'terminal_main', label: 'TERMINAL',
      puzzleManager: this.puzzleManager,
      dialogManager: this.dialogManager,
      puzzleId: FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
    });
    this._objects.push(terminal);

    const door = new InteractiveObject(this, 625, 185, {
      id: 'door_security', type: FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: 'PORTA',
      width: 48, height: 40,
      visual: 'door',
      color: GameState.get('door_unlocked') ? C.ACCENT : 0x36424c,
      onInteract: (obj) => this._interactDoor(obj),
    });
    this._objects.push(door);

    const storageGateLocked = !GameState.get('server_rebooted');
    this._storageGate = this.add.rectangle(
      775, 304, 80, 48,
      0x050a0f, 0
    ).setVisible(false);
    this.physics.add.existing(this._storageGate, true);
    this._storageGate.body.setSize(50, 48);
    this._storageGate.body.enable = storageGateLocked;
    this._wallRects.push(this._storageGate);

    const storageDoor = new InteractiveObject(this, 775, 304, {
      id: 'storage_gate', type: FORK_CONFIG.OBJECT_TYPES.DOOR,
      label: 'PORTA STORAGE',
      width: 70, height: 42,
      visual: 'door',
      color: GameState.get('server_rebooted') ? C.ACCENT : 0x36424c,
      onInteract: () => this._interactStorageGate(),
    });
    this._objects.push(storageDoor);

    const server = new InteractiveObject(this, 720, 145, {
      id: 'server_main', type: FORK_CONFIG.OBJECT_TYPES.SERVER,
      label: 'SERVER A', width: 42, height: 60,
      visual: 'server',
      enabled: GameState.get('door_unlocked'),
      color: C.ACCENT_DIM,
      onInteract: () => this._interactServer(),
    });
    this._objects.push(server);

    const panel = new InteractiveObject(this, 835, 145, {
      id: 'panel_sequence', type: FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'PANEL', width: 34, height: 32,
      visual: 'panel',
      enabled: GameState.get('door_unlocked'),
      color: C.ACCENT_DIM,
      onInteract: () => this._interactPanel(),
    });
    this._objects.push(panel);

    const file = new InteractiveObject(this, 700, 470, {
      id: 'file_notes', type: FORK_CONFIG.OBJECT_TYPES.FILE,
      label: 'NOTES.txt', width: 22, height: 28,
      visual: 'file',
      color: C.ACCENT_DIM,
      onInteract: () => this._interactFile(),
    });
    this._objects.push(file);

    const entity = new InteractiveObject(this, 840, 470, {
      id: 'entity', type: FORK_CONFIG.OBJECT_TYPES.OBJECT,
      label: '???', width: 22, height: 22,
      visual: 'entity',
      color: 0x113311,
      onInteract: () => this._interactEntity(),
    });
    this._objects.push(entity);

    const cam = new InteractiveObject(this, 855, 98, {
      id: 'camera_01', type: FORK_CONFIG.OBJECT_TYPES.CAMERA,
      label: 'CAM-01', width: 44, height: 32,
      visual: 'camera',
      color: C.DANGER,
      onInteract: () => this._interactCamera(),
    });
    this._objects.push(cam);

    // Elementos sem importância narrativa: servem para a simulação parecer
    // habitada e são os primeiros a desaparecer com CLEAR.
    const decor = [
      ['cabinet_01', 330, 150, 'ARMÁRIO A', 46, 64, 'cabinet', null],
      ['cabinet_02', 430, 150, 'ARMÁRIO B', 46, 64, 'cabinet', null],
      ['monitor_01', 330, 250, 'MONITOR 01', 46, 30, 'monitor', () => this._interactMonitor(1)],
      ['monitor_02', 430, 250, 'MONITOR 02', 46, 30, 'monitor', () => this._interactMonitor(2)],
      ['rack_01', 330, 505, 'RACK AUX', 50, 56, 'rack', null],
      ['monitor_03', 455, 505, 'MONITOR 03', 46, 30, 'monitor', () => this._interactMonitor(3)],
    ];

    decor.forEach(([id, x, y, label, width, height, visual, onInteract]) => {
      const object = new InteractiveObject(this, x, y, {
        id,
        type: FORK_CONFIG.OBJECT_TYPES.OBJECT,
        label,
        width,
        height,
        visual,
        color: 0x26313b,
        showLabel: false,
        onInteract,
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

    const secret = new InteractiveObject(this, 820, 540, {
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

    const memory = new InteractiveObject(this, 500, 430, {
      id: 'memory_panel',
      type: FORK_CONFIG.OBJECT_TYPES.PANEL,
      label: 'MEMORY PANEL',
      width: 42,
      height: 30,
      visual: 'memory',
      color: FORK_CONFIG.COLORS.WARNING,
      onInteract: () => this._interactMemoryPanel(),
    });

    this._objects.push(memory);
  }

  _spawnObserverObjects() {
    if (!this._objects.some(o => o.id === 'observer_terminal')) {
      const observer = new InteractiveObject(this, 775, 405, {
        id: 'observer_terminal',
        type: FORK_CONFIG.OBJECT_TYPES.TERMINAL,
        label: 'OBSERVER',
        width: 52,
        height: 34,
        visual: 'observer',
        color: FORK_CONFIG.COLORS.ACCENT_BRIGHT,
        onInteract: () => this._interactObserver(),
      });
      this._objects.push(observer);
    }

    if (!this._objects.some(o => o.id === 'identity_terminal')) {
      const identity = new InteractiveObject(this, 700, 405, {
        id: 'identity_terminal',
        type: FORK_CONFIG.OBJECT_TYPES.FILE,
        label: 'IDENTITY',
        width: 42,
        height: 28,
        visual: 'monitor',
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
    if (!GameState.get('door_unlocked')) {
      this._showCodePuzzle();
      return;
    }

    if (!GameState.get('butterfly_steps').includes('read_notes')) {
      this.dialogManager.show([
        'SAÍDA BLOQUEADA.',
        'O sistema exige uma referência temporal.',
        '// NOTES.txt ainda não foi consultado.',
      ], { title: 'PORTA DE SAÍDA' });
      return;
    }

    this.dialogManager.show([
      'SAÍDA // ACCESS PROTOCOL',
      'A porta reconhece o evento de entrada.',
      'A referência temporal deve coincidir com o momento presente.',
      '',
      '// Quatro dígitos. HHMM.',
    ], {
      title: 'PORTA DE SAÍDA',
      onClose: () => this.uiManager.openCodeInput({
        title: '// CURRENT LOCAL TIME // EXIT',
        length: 4,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.EXIT_CODE,
          value
        ),
        onSuccess: () => {
          GameState.set('escape_attempted', true);
          if (window.AudioManagerInstance) window.AudioManagerInstance.playDoor();
          this.cameras.main.flash(220, 90, 220, 255, false);
          const ending = GameState.checkEndingConditions();
          if (ending) this.finalManager.trigger(ending);
          else {
            this.dialogManager.show([
              'EXIT PROTOCOL ACCEPTED.',
              'A última camada foi removida.',
              '// A saída ainda não terminou o processo.',
            ], { title: 'SYSTEM EXIT' });
          }
        },
      }),
    });
  }

  _showCodePuzzle() {
    if (!GameState.get('log07_deleted')) {
      this.dialogManager.show(NARRATIVE.door.locked_no_clue, { title: 'SERVER SECURITY' });
      return;
    }

    this.dialogManager.show(NARRATIVE.door.locked_has_clue, {
      title: 'PORTA DE SEGURANÇA',
      onClose: () => this.uiManager.openCodeInput({
        title: '// RESTRICTED WING // ACCESS CODE',
        length: 4,
        validator: value => this.puzzleManager.checkAnswer(
          FORK_CONFIG.PUZZLES.DOOR_CODE,
          value
        ),
        onSuccess: () => {
          this._unlockServerRoom();
        },
      }),
    });
  }

  _unlockServerRoom() {
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
      doorObj._label.setText('PORTA');
      doorObj._body.clear();
      doorObj._drawVisual(48, 40, FORK_CONFIG.COLORS.ACCENT);
      doorObj.setEnabled(true);
    }

    ['server_main', 'panel_sequence'].forEach(id => {
      const obj = this._objects.find(o => o.id === id);
      if (obj) obj.setEnabled(true);
    });

    this.animationManager.doorOpen(625, 185);
    this.cameras.main.flash(180, 90, 220, 255, false);
    this.cameras.main.shake(220, 0.004);
    this._setSystemMessage('ACCESS GRANTED // LOCAL TIME ACCEPTED // RESTRICTED WING OPEN');
    this.time.delayedCall(450, () => {
      this.dialogManager.show([
        'ACCESS GRANTED.',
        '07:31 accepted.',
        'The restricted wing is now open.',
        'SERVER ROOM → STORAGE',
        '',
        '// SERVER A is waiting inside.',
      ], { title: 'RESTRICTED WING // ACCESS GRANTED' });
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
          doorObj._label.setText('PORTA');
          doorObj._body.clear();
          doorObj._drawVisual(48, 40, FORK_CONFIG.COLORS.ACCENT);
          doorObj.setEnabled(true);
        }

        ['server_main', 'panel_sequence'].forEach(id => {
          const obj = this._objects.find(o => o.id === id);
          if (obj) obj.setEnabled(true);
        });

        this.animationManager.doorOpen(625, 185);
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

  _interactStorageGate() {
    if (GameState.get('server_rebooted')) {
      this._openStorageGate();
      return;
    }

    this.dialogManager.show([
      'PORTA STORAGE',
      'ACESSO BLOQUEADO.',
      'SERVER A precisa ser reiniciado antes que esta passagem seja liberada.',
    ], { title: 'STORAGE ACCESS' });
  }

  _openStorageGate() {
    if (this._storageGate && this._storageGate.body) {
      this._storageGate.body.enable = false;
    }

    const doorObj = this._objects.find(o => o.id === 'storage_gate');
    if (doorObj) {
      doorObj._body.clear();
      doorObj._drawVisual(70, 42, FORK_CONFIG.COLORS.ACCENT);
      doorObj.setEnabled(true);
    }

    this.animationManager.doorOpen(775, 304);
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
        this._openStorageGate();
        this._spawnSecretFile();
        this._setSystemMessage('SERVER — REBOOTED // STORAGE ACCESS OPEN');
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

  _getServerLocalTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }

  _interactFile() {
    const now = new Date();
    const localTime =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');

    GameState.set('system_notes_read', true);
    GameState.addButterflyStep('read_notes');

    this.dialogManager.show([
      'NOTES.txt',
      '─────────────────────────────────',
      'LOCAL TIME // ' + localTime,
      '',
      '“fugir é a complexidade da existencia, deixe tudo para tras.',
      ' se existe uma hora, a hora é agora.”',
      '',
      '// O sistema registrou o momento presente.',
      '// Use esta referência quando chegar à saída.',
      '─────────────────────────────────',
    ], { title: 'NOTES' });
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

  _interactMonitor(index) {
    const easterEggs = {
      1: 'essa aula de aed tava barril sacana...',
      2: 'certinhooooooo!!!!!',
      3: 'o careca nem desconfia disso...',
    };

    const message = easterEggs[index] || 'Nenhum registro relevante encontrado.';
    this.dialogManager.show([
      'MONITOR ' + String(index).padStart(2, '0'),
      '',
      message,
      '',
      '// Registro local — sem sincronização com o sistema.',
    ], { title: 'MONITOR ' + String(index).padStart(2, '0') });
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
      'Um exploit estava sendo sugerido no fragmento:',
      '',
      '-15.7939 / -47.8828',
      '',
      '// A disposição dos números não parece acidental.',
      '// Talvez você já saiba o que eles estão sugerindo.',
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
            'BRASÍLIA IDENTIFICADA.',
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
          GameState.save();
          this._spawnObserverObjects();
          this.dialogManager.show([
            'MEMORY ACCEPTED.',
            'The system did not generate this memory.',
            'Something else left it for you.',
            '',
            'OBSERVER // ONLINE',
            '// Someone has been watching every loop.',
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
    this._hudTimer = sf(this.add.text(W-132, 4, 'TIME: 07:31', { fontFamily: F.FAMILY_TITLE, fontSize: '22px', color: '#9be8ff', shadow: { offsetX:0, offsetY:0, color:'#59d8ff', blur:8, fill:true } }).setOrigin(1,0).setDepth(91));

    // Controle de pausa fixo no HUD. O botão não depende da câmera do mundo.
    const pauseButton = sf(this.add.rectangle(W - 54, 14, 92, 22, 0x0b151d, 0.94)
      .setStrokeStyle(1, C.ACCENT_DIM, 0.85)
      .setDepth(92)
      .setInteractive({ useHandCursor: true }));
    const pauseIcon = sf(this.add.graphics().setDepth(93));
    pauseIcon.fillStyle(C.ACCENT_BRIGHT, 1);
    pauseIcon.fillRoundedRect(W - 69, 8, 4, 12, 1);
    pauseIcon.fillRoundedRect(W - 61, 8, 4, 12, 1);
    const pauseLabel = sf(this.add.text(W - 50, 6, 'PAUSE', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '12px',
      color: F.COLOR_PRIMARY,
      shadow: { offsetX: 0, offsetY: 0, color: F.COLOR_PRIMARY, blur: 6, fill: true },
    }).setOrigin(0, 0).setDepth(93));

    pauseButton.on('pointerover', () => {
      pauseButton.setFillStyle(0x11232d, 1).setStrokeStyle(1, C.ACCENT_BRIGHT, 1);
      pauseLabel.setColor(F.COLOR_BRIGHT);
      pauseIcon.setAlpha(1);
    });
    pauseButton.on('pointerout', () => {
      pauseButton.setFillStyle(0x0b151d, 0.94).setStrokeStyle(1, C.ACCENT_DIM, 0.85);
      pauseLabel.setColor(F.COLOR_PRIMARY);
    });
    pauseButton.on('pointerdown', () => {
      if (this._hardCorruption || GameState.volatile.dialog_open ||
          GameState.volatile.terminal_open || GameState.volatile.modal_open) return;
      if (this._isPaused) this._closePause();
      else this._openPause();
    });

    this._pauseButton = pauseButton;
    this._pauseButtonIcon = pauseIcon;
    this._pauseButtonLabel = pauseLabel;

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

    // Layout fixo: cada bloco possui uma área própria para impedir
    // sobreposição mesmo quando a tela é redimensionada pelo navegador.
    const title = this.add.text(W / 2, H / 2 - 150, 'SYSTEM CORRUPTED', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '34px',
      color: '#ff9aa6',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6678', blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const status = this.add.text(W / 2, H / 2 - 92, 'CRITICAL INTEGRITY FAILURE', {
      fontFamily: F.FAMILY_TITLE,
      fontSize: '18px',
      color: F.COLOR_DANGER,
      align: 'center',
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const body = this.add.text(W / 2, H / 2 - 18, [
      'The simulation can no longer be restored.',
      'No recovery save exists.',
      '',
      'ALL SESSION STATE HAS BEEN LOST.',
      '',
      '// RESTART THE GAME TO BEGIN AGAIN.',
    ].join('\\n'), {
      fontFamily: F.FAMILY,
      fontSize: '13px',
      color: F.COLOR_SYSTEM,
      align: 'center',
      lineSpacing: 7,
      wordWrap: { width: 650 },
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const restart = this.add.text(W / 2, H / 2 + 128, '[ REINICIAR JOGO ]', {
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
        exit_code_anchor: null,
        restore_requested: false,
        system_restored: false,
      };
      GameState.resetVolatile();
      this.scene.start('MenuScene');
    });
  }

  _updateHUD() {
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
      .on('onWarning',  () => { this._setSystemMessage('WARNING — Tempo baixo. O loop continua ativo.'); this.dialogManager.showSystem('WARNING: 02:00 remaining.'); })
      .on('onCritical', () => { this._setSystemMessage('CRITICAL — Tempo baixo. Erros ainda determinam o loop.'); })
      .on('onReset',    (reason) => { this.scene.start('ResetScene', { reason }); });
  }

  _showLoopStart(onComplete = null) {
    const loopNum  = GameState.get('loop_count');
    const deleted  = GameState.get('log07_deleted');
    const rebooted = GameState.get('server_rebooted');

    let msgs = NARRATIVE.loopStart(loopNum);

    if (loopNum === 1) {
      msgs = msgs.concat(NARRATIVE.playerIntro);
    }

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
      this.dialogManager.show(msgs, {
        title: loopNum === 1 ? 'AWAKENING // PRIMEIRO CONTATO' : `LOOP ${String(loopNum).padStart(2,'0')}`,
        onClose: () => {
          if (onComplete) onComplete();
        },
      });
    });
  }
}

  window.GameScene = GameScene;
})();
