// ============================================================
// FORK — Player.js
// O jogador é uma partícula do sistema.
// ============================================================

class Player {

  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = FORK_CONFIG.PLAYER_SPEED;

    // O próprio corpo do jogador é a partícula. Não existe "bolinha"
    // separada: ele é um fragmento luminoso minúsculo dentro da máquina.
    this._textureKey = '__fork_player_particle_core';
    if (!scene.textures.exists(this._textureKey)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 0.10);
      g.fillCircle(6, 6, 6);
      g.fillStyle(0xffffff, 0.24);
      g.fillCircle(6, 6, 4);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(6, 6, 1.8);
      g.generateTexture(this._textureKey, 12, 12);
      g.destroy();
    }

    this._sprite = scene.add.image(x, y, this._textureKey)
      .setDepth(12)
      .setScale(1);

    scene.physics.add.existing(this._sprite);
    this._sprite.body.setCircle(4, 2, 2);
    this.body = this._sprite.body;
    this.body.setCollideWorldBounds(true);

    // O rastro é parte do personagem: o movimento deixa pequenas falhas
    // de informação para trás, reforçando a ideia de que ele é uma anomalia.
    this._trailTextureKey = '__fork_player_trail';
    if (!scene.textures.exists(this._trailTextureKey)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 0.75);
      g.fillCircle(3, 3, 3);
      g.generateTexture(this._trailTextureKey, 6, 6);
      g.destroy();
    }

    this._trail = scene.add.particles(x, y, this._trailTextureKey, {
      speed: { min: 4, max: 18 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 180, max: 420 },
      scale: { start: 0.65, end: 0 },
      alpha: { start: 0.45, end: 0 },
      frequency: 70,
      quantity: 1,
      tint: [0x8fe8ff, 0xffffff],
      blendMode: 'ADD',
      emitting: true,
    });
    this._trail.setDepth(11);
    this._trail.startFollow(this._sprite, 0, 0, true);

    this._pulse = scene.tweens.add({
      targets: this._sprite,
      scale: { from: 0.85, to: 1.18 },
      alpha: { from: 0.72, to: 1 },
      duration: 430,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.direction = 'down';
    this._nearestObject = null;

    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this._keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._lastMoving = false;
  }

  get x() { return this._sprite.x; }
  get y() { return this._sprite.y; }

  update(objects = []) {
    const blocked = GameState.volatile.dialog_open ||
      GameState.volatile.terminal_open ||
      GameState.volatile.modal_open;

    if (!blocked) this._handleMovement();
    else this._stopMovement();

    this._nearestObject = this._findNearest(objects);

    if (!blocked && Phaser.Input.Keyboard.JustDown(this._keyE) && this._nearestObject) {
      this._nearestObject.interact();
    }
  }

  _handleMovement() {
    const speed = this.speed;
    let vx = 0, vy = 0;

    const left = this._cursors.left.isDown || this._wasd.left.isDown;
    const right = this._cursors.right.isDown || this._wasd.right.isDown;
    const up = this._cursors.up.isDown || this._wasd.up.isDown;
    const down = this._cursors.down.isDown || this._wasd.down.isDown;

    if (left) { vx = -speed; this.direction = 'left'; }
    if (right) { vx = speed; this.direction = 'right'; }
    if (up) { vy = -speed; this.direction = 'up'; }
    if (down) { vy = speed; this.direction = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this._sprite.body.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;
    if (moving && !this._lastMoving && window.AudioManagerInstance) {
      window.AudioManagerInstance.playBeep();
    }
    this._lastMoving = moving;
  }

  _stopMovement() {
    this._sprite.body.setVelocity(0, 0);
    this._lastMoving = false;
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

  getNearestObject() {
    return this._nearestObject;
  }

  setPosition(x, y) {
    this._sprite.setPosition(x, y);
  }

  getPhysicsBody() {
    return this._sprite;
  }

  destroy() {
    if (this._pulse) this._pulse.remove();
    this._sprite.destroy();
    if (this._trail) this._trail.destroy();
  }
}
