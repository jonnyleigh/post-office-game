import * as Phaser from 'phaser';
import { EventBus, EVT } from '../EventBus.js';

/** Base NPC class with FSM skeleton */
export class NPC extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} textureKey
   * @param {object} opts  { maxHealth, speed, weaponCat }
   */
  constructor(scene, x, y, textureKey, opts = {}) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(13, 3, 3);
    this.setCollideWorldBounds(true);
    this.setDrag(600);
    this.setMaxVelocity(opts.speed || 80);
    this.setDepth(9);

    this.maxHealth  = opts.maxHealth || 100;
    this.health     = this.maxHealth;
    this.speed      = opts.speed     || 80;
    this.weaponCat  = opts.weaponCat || 1;
    this.npcType    = 'npc';

    this.state      = 'idle';
    this.stateTimer = 0;        // ms since last perception check
    this.target     = null;     // player ref (set by GameScene)
    this._lastFired = 0;

    this._dead = false;

    // ── Health bar (hidden until first hit) ──────────────────────────────────
    this._hpBar = scene.add.graphics();
    this._hpBar.setDepth(20);
    this._hpBar.setVisible(false);
    this._hpHideTimer = null;
  }

  // Subclasses override this to set up additional config
  init() {}

  /** Called every frame by GameScene.update — NPC must be alive */
  update(time, delta) {
    if (this._dead) return;
    this.stateTimer += delta;

    // Keep health bar positioned above the sprite
    if (this._hpBar.visible) {
      this._updateHpBar();
    }

    // Walk animation driven by actual velocity
    const animKey = this.npcType + '_walk';
    const moving  = this.body && this.body.speed > 10;
    if (moving) {
      if (this.scene.anims.exists(animKey)) this.play(animKey, true);
    } else if (this.anims.isPlaying) {
      this.stop();
      this.setFrame(0);
    }

    const method = `state_${this.state}`;
    if (typeof this[method] === 'function') {
      this[method](time, delta);
    }
  }

  transitionTo(newState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  distToTarget() {
    if (!this.target) return Infinity;
    return Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
  }

  angleToTarget() {
    if (!this.target) return 0;
    return Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
  }

  takeDamage(amount) {
    if (this._dead) return;
    this.health -= amount;
    // Flash
    this.scene.tweens.add({
      targets: this, alpha: 0.4, duration: 60,
      yoyo: true,
      onComplete: () => { if (this.active) this.setAlpha(1); },
    });

    // Show / refresh health bar
    this._hpBar.setVisible(true);
    this._updateHpBar();
    if (this._hpHideTimer) this._hpHideTimer.remove();
    this._hpHideTimer = this.scene.time.delayedCall(2000, () => {
      this._hpBar.setVisible(false);
      this._hpHideTimer = null;
    });

    this._onHit();

    if (this.health <= 0) {
      this._onDeath();
    }
  }

  /** Override in subclasses to react to being hit */
  _onHit() {}

  _updateHpBar() {
    const W = 36, H = 5, offsetY = -26;
    const pct = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    const g = this._hpBar;
    g.clear();
    // Background
    g.fillStyle(0x000000, 0.7);
    g.fillRect(this.x - W / 2, this.y + offsetY, W, H);
    // Fill — green → yellow → red
    const color = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xdddd00 : 0xdd2222;
    g.fillStyle(color, 1);
    g.fillRect(this.x - W / 2, this.y + offsetY, Math.round(W * pct), H);
  }

  _onDeath() {
    this._dead = true;
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    if (this._hpHideTimer) { this._hpHideTimer.remove(); this._hpHideTimer = null; }
    this._hpBar.setVisible(false);
    EventBus.emit(EVT.ENEMY_KILLED, { type: this.npcType, x: this.x, y: this.y });
  }

  /** Try to fire at target using shared enemy bullet pool */
  _tryFireAtTarget(now, enemyBulletGroup) {
    if (!this.target || !enemyBulletGroup) return;
    const FIRE_RATE = 800;
    if (now - this._lastFired < FIRE_RATE) return;
    this._lastFired = now;

    const angle = this.angleToTarget();
    const bullet = enemyBulletGroup.getFirstDead(false);
    if (!bullet) return;
    bullet.fire(this.x, this.y, angle, 'bullet_enemy', 350, 8, true, 0);
  }

  isDead() { return this._dead; }
}
