// ============================================================
// FORK — Player.js
// Personagem principal com sprites de idle e caminhada.
// ============================================================

class Player {

  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = FORK_CONFIG.PLAYER_SPEED;

    this._createAnimations();

    this._sprite = scene.add.sprite(x, y, 'player_idle_down')
      .setDepth(12)
      .setScale(1)
      .setOrigin(0.5, 0.5);

    scene.physics.add.existing(this._sprite);

    this.body = this._sprite.body;
    this.body.enable = true;
    this.body.setAllowGravity(false);
    this.body.setSize(26, 22);
    this.body.setOffset(19, 30);
    this.body.setCollideWorldBounds(true);

    this.direction = 'down';
    this._nearestObject = null;
    this._lastMoving = false;
    this._currentAnimation = null;

    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this._keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this._playAnimation('idle_down');
  }

  _createAnimations() {
    const animations = [
      ['player_idle_down', 'player_idle_down', 0, 7, 6],
      ['player_idle_up', 'player_idle_up', 0, 7, 6],
      ['player_idle_left_down', 'player_idle_left_down', 0, 7, 6],
      ['player_idle_left_up', 'player_idle_left_up', 0, 7, 6],
      ['player_idle_right_down', 'player_idle_right_down', 0, 7, 6],
      ['player_idle_right_up', 'player_idle_right_up', 0, 7, 6],

      ['player_walk_down', 'player_walk_down', 0, 7, 8],
      ['player_walk_up', 'player_walk_up', 0, 7, 8],
      ['player_walk_left_down', 'player_walk_left_down', 0, 7, 8],
      ['player_walk_left_up', 'player_walk_left_up', 0, 7, 8],
      ['player_walk_right_down', 'player_walk_right_down', 0, 7, 8],
      ['player_walk_right_up', 'player_walk_right_up', 0, 7, 8],
    ];

    animations.forEach(([key, texture, start, end, frameRate]) => {
      if (this.scene.anims.exists(key)) return;

      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNumbers(texture, { start, end }),
        frameRate,
        repeat: -1,
      });
    });
  }

  _playAnimation(name) {
    const key = 'player_' + name;
    if (this._currentAnimation === key) return;

    this._sprite.anims.play(key, true);
    this._currentAnimation = key;
  }

  _showIdleFrame() {
    const key = 'player_idle_' + this.direction;
    this._sprite.anims.stop();
    this._sprite.setTexture(key);
    this._sprite.setFrame(0);
    this._currentAnimation = null;
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
    let vx = 0;
    let vy = 0;

    const left = this._cursors.left.isDown || this._wasd.left.isDown;
    const right = this._cursors.right.isDown || this._wasd.right.isDown;
    const up = this._cursors.up.isDown || this._wasd.up.isDown;
    const down = this._cursors.down.isDown || this._wasd.down.isDown;

    if (left) vx = -speed;
    if (right) vx = speed;
    if (up) vy = -speed;
    if (down) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;

      if (vy < 0 && vx < 0) this.direction = 'left_up';
      else if (vy < 0 && vx > 0) this.direction = 'right_up';
      else if (vy > 0 && vx < 0) this.direction = 'left_down';
      else this.direction = 'right_down';
    } else if (vx < 0) {
      this.direction = 'left_down';
    } else if (vx > 0) {
      this.direction = 'right_down';
    } else if (vy < 0) {
      this.direction = 'up';
    } else if (vy > 0) {
      this.direction = 'down';
    }

    this.body.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      this._playAnimation('walk_' + this.direction);
      if (!this._lastMoving && window.AudioManagerInstance) {
        window.AudioManagerInstance.playBeep();
      }
    } else {
      this._showIdleFrame();
    }

    this._lastMoving = moving;
  }

  _stopMovement() {
    this.body.setVelocity(0, 0);
    this._showIdleFrame();
    this._lastMoving = false;
  }

  _findNearest(objects) {
    let nearest = null;
    let minDist = FORK_CONFIG.INTERACT_RANGE;

    objects.forEach(obj => {
      if (!obj.enabled) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y);
      if (d < minDist) {
        minDist = d;
        nearest = obj;
      }
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
    this._sprite.destroy();
  }
}
