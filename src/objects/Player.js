// ============================================================
// FORK — Player.js  [FIXED]
// Jogador: movimento top-down + detecção de interação
// ============================================================

class Player {

  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = FORK_CONFIG.PLAYER_SPEED;

    // O jogador não é uma pessoa desenhada: é uma partícula intrusa,
    // pequena demais para competir visualmente com a escala do sistema.
    this._sprite = scene.add.circle(x, y, 7, FORK_CONFIG.COLORS.WHITE, 1)
      .setStrokeStyle(2, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 0.95)
      .setDepth(12);
    scene.physics.add.existing(this._sprite);
    this._sprite.body.setCircle(7, 0, 0);

    this._coreGlow = scene.add.circle(x, y, 13, FORK_CONFIG.COLORS.ACCENT, 0.12)
      .setStrokeStyle(1, FORK_CONFIG.COLORS.ACCENT_BRIGHT, 0.35)
      .setDepth(10);

    this._shadow = scene.add.ellipse(x, y + 10, 14, 6, 0x000000, 0.35).setDepth(9);

    // Pequenas partículas acompanham o fragmento e se soltam quando ele se move.
    this._particleTextureKey = '__fork_player_particle';
    if (!scene.textures.exists(this._particleTextureKey)) {
      const g = scene.add.graphics();
      g.fillStyle(FORK_CONFIG.COLORS.WHITE, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(this._particleTextureKey, 8, 8);
      g.destroy();
    }

    this._trail = scene.add.particles(x, y, this._particleTextureKey, {
      speed: { min: 8, max: 24 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 220, max: 480 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.75, end: 0 },
      frequency: 85,
      quantity: 1,
      tint: [FORK_CONFIG.COLORS.ACCENT_BRIGHT, FORK_CONFIG.COLORS.WHITE],
      blendMode: 'ADD',
      emitting: true,
    });
    this._trail.setDepth(11);
    this._trail.startFollow(this._sprite, 0, 0, true);

    this._movePulse = scene.tweens.add({
      targets: this._coreGlow,
      scale: { from: 0.85, to: 1.18 },
      alpha: { from: 0.10, to: 0.28 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.direction = 'down';
    this._nearestObject = null;

    // Física
    this.body = this._sprite.body;
    this.body.setCollideWorldBounds(true);

    // Teclas
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd = {
      up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this._keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  get x() { return this._sprite.x; }
  get y() { return this._sprite.y; }

  update(objects = []) {
    const blocked = GameState.volatile.dialog_open || GameState.volatile.terminal_open || GameState.volatile.modal_open;

    if (!blocked) {
      this._handleMovement();
    } else {
      this._stopMovement();
    }

    this._shadow.setPosition(this.x, this.y + 10);
    this._coreGlow.setPosition(this.x, this.y);

    this._nearestObject = this._findNearest(objects);

    if (!blocked && Phaser.Input.Keyboard.JustDown(this._keyE) && this._nearestObject) {
      this._nearestObject.interact();
    }
  }

  _handleMovement() {
    const speed = this.speed;
    let vx = 0, vy = 0;

    const left  = this._cursors.left.isDown  || this._wasd.left.isDown;
    const right = this._cursors.right.isDown || this._wasd.right.isDown;
    const up    = this._cursors.up.isDown    || this._wasd.up.isDown;
    const down  = this._cursors.down.isDown  || this._wasd.down.isDown;

    if (left)  { vx = -speed; this.direction = 'left'; }
    if (right) { vx =  speed; this.direction = 'right'; }
    if (up)    { vy = -speed; this.direction = 'up'; }
    if (down)  { vy =  speed; this.direction = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this._sprite.body.setVelocity(vx, vy);
  }

  _stopMovement() {
    this._sprite.body.setVelocity(0, 0);
  }

  _findNearest(objects) {
    let nearest = null;
    let minDist = FORK_CONFIG.INTERACT_RANGE;

    objects.forEach(obj => {
      if (!obj.enabled) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y);
      if (d < minDist) { minDist = d; nearest = obj; }
    });

    return nearest;
  }

  setPosition(x, y) {
    this._sprite.setPosition(x, y);
    this._coreGlow.setPosition(x, y);
    this._shadow.setPosition(x, y + 10);
  }

  // FIX: retorna o rectangle (que agora tem physics via existing)
  getPhysicsBody() { return this._sprite; }

  destroy() {
    this._sprite.destroy();
    this._coreGlow.destroy();
    this._shadow.destroy();
    if (this._trail) this._trail.destroy();
  }
}
