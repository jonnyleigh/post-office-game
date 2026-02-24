import * as Phaser from 'phaser';
import { EventBus, EVT } from '../EventBus.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { Projectile } from './Projectile.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(14, 2, 2);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setDrag(900);
    this.setMaxVelocity(200);

    // Stats
    this.health = 100;
    this.armor  = 0;
    this.lives  = 3;
    this._dead  = false;
    this._invincibleUntil = 0;

    // Create projectile pool (shared player bullets)
    this.projectileGroup = scene.physics.add.group({
      classType: Projectile,
      maxSize: 60,
      runChildUpdate: false,
    });
    this.projectileGroup.createMultiple({ key: 'bullet_1', quantity: 60, active: false, visible: false });

    this.weapons = new WeaponManager(scene, this.projectileGroup);

    // World-bounds bullet cleanup
    scene.physics.world.on('worldbounds', (body) => {
      if (body.gameObject && body.gameObject instanceof Projectile && !body.gameObject.isEnemyBullet) {
        body.gameObject.deactivate();
      }
    });

    // Input
    this._cursors    = scene.input.keyboard.createCursorKeys();
    this._wasd       = scene.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
    this._fireKey    = scene.input.keyboard.addKey('SPACE');
    this._isFiring   = false;
  }

  /** Called every frame by GameScene.update */
  update(time, delta) {
    if (this._dead) return;
    this._move();
    this._aim();
    this._handleFire(time);
    // Walk animation
    const moving = Math.abs(this.body.velocity.x) > 5 || Math.abs(this.body.velocity.y) > 5;
    if (moving) {
      this.play('player_walk', true);
    } else if (this.anims.isPlaying) {
      this.stop();
      this.setFrame(0);
    }
  }

  _move() {
    const speed  = 180;
    const fwd  = this._cursors.up.isDown    || this._wasd.up.isDown;
    const back = this._cursors.down.isDown  || this._wasd.down.isDown;
    const strafeL = this._cursors.left.isDown  || this._wasd.left.isDown;
    const strafeR = this._cursors.right.isDown || this._wasd.right.isDown;

    let vx = 0, vy = 0;
    const angle = this.rotation;
    if (fwd)    { vx += Math.cos(angle);                   vy += Math.sin(angle); }
    if (back)   { vx -= Math.cos(angle);                   vy -= Math.sin(angle); }
    if (strafeL){ vx += Math.cos(angle - Math.PI / 2);     vy += Math.sin(angle - Math.PI / 2); }
    if (strafeR){ vx += Math.cos(angle + Math.PI / 2);     vy += Math.sin(angle + Math.PI / 2); }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    }
  }

  _aim() {
    const pointer = this.scene.input.activePointer;
    const worldPt = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle   = Phaser.Math.Angle.Between(this.x, this.y, worldPt.x, worldPt.y);
    this.setRotation(angle);
  }

  _handleFire(time) {
    const firing = this.scene.input.activePointer.isDown || this._fireKey.isDown;
    if (!firing) { this._isFiring = false; return; }

    const cat = this.weapons.currentCat;
    // Machine gun: auto-repeat. Others: single shot per press.
    if (cat !== 3 && this._isFiring) return;
    this._isFiring = true;

    const muzzleOffset = cat === 0 ? 0 : 20;
    const muzzleX = this.x + Math.cos(this.rotation) * muzzleOffset;
    const muzzleY = this.y + Math.sin(this.rotation) * muzzleOffset;

    const fired = this.weapons.fire(muzzleX, muzzleY, this.rotation, time);

    // Melee: emit hit zone event for GameScene to resolve
    if (fired && cat === 0) {
      this.emit('melee', { x: this.x, y: this.y, angle: this.rotation, time });
    }
  }

  /**
   * Apply damage to the player.
   * @param {number} amount
   * @param {number} now – scene time
   */
  takeDamage(amount, now) {
    if (this._dead) return;
    if (now < this._invincibleUntil) return;

    // Armor absorbs first
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }

    this.health -= amount;
    this._invincibleUntil = now + 400; // brief invincibility frames

    if (this.health <= 0) {
      this.health = 0;
      this._onDeath();
    }

    this._emitStats();

    // Flash red
    this.scene.tweens.add({
      targets: this, alpha: 0.3, duration: 80,
      yoyo: true, repeat: 2,
      onComplete: () => this.setAlpha(1),
    });
  }

  _onDeath() {
    this._dead = true;
    this.lives--;
    EventBus.emit(EVT.PLAYER_DIED, { lives: this.lives });
  }

  addHealth(amount) {
    this.health = Math.min(100, this.health + amount);
    this._emitStats();
  }

  addArmor(amount) {
    this.armor = Math.min(100, this.armor + amount);
    this._emitStats();
  }

  addLife() {
    this.lives++;
    this._emitStats();
  }

  respawn(x, y) {
    this._dead = false;
    this.health = 100;
    this.armor  = 0;
    this._invincibleUntil = 0;
    this.setPosition(x, y);
    this.setAlpha(1);
    this._emitStats();
  }

  _emitStats() {
    EventBus.emit(EVT.PLAYER_STATS_CHANGED, {
      health: this.health,
      armor:  this.armor,
      lives:  this.lives,
    });
  }

  getStats() {
    return { health: this.health, armor: this.armor, lives: this.lives };
  }
}
