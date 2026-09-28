// ============================================================
// FORK — Player.js  [FIXED]
// Jogador: movimento top-down + detecção de interação
// ============================================================

class Player {

  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = FORK_CONFIG.PLAYER_SPEED;

    // FIX: usar add.rectangle + physics.add.existing
    this._sprite = scene.add.rectangle(x, y, 18, 18, FORK_CONFIG.COLORS.ACCENT, 1);
    this._sprite.setDepth(10);
    scene.physics.add.existing(this._sprite);

    // Sombra visual
    this._shadow = scene.add.ellipse(x, y + 10, 16, 8, 0x000000, 0.4).setDepth(9);

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
    const blocked = GameState.volatile.dialog_open || GameState.volatile.terminal_open;

    if (!blocked) {
      this._handleMovement();
    } else {
      this._stopMovement();
    }

    this._shadow.setPosition(this.x, this.y + 10);

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

  setPosition(x, y) { this._sprite.setPosition(x, y); }

  // FIX: retorna o rectangle (que agora tem physics via existing)
  getPhysicsBody() { return this._sprite; }

  destroy() {
    this._sprite.destroy();
    this._shadow.destroy();
  }
}
