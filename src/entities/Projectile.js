import * as Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet_1');
    this.damage = 6;
    this.isEnemyBullet = false;
    this.splashRadius = 0;
  }

  fire(x, y, angle, textureKey, speed, damage, isEnemy = false, splashRadius = 0) {
    this.enableBody(true, x, y, true, true);
    this.setTexture(textureKey);
    this.damage = damage;
    this.isEnemyBullet = isEnemy;
    this.splashRadius = splashRadius;
    this.setRotation(angle);

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);

    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;

    this.setDepth(5);
  }

  deactivate() {
    if (this.active) {
      this.disableBody(true, true);
    }
  }

  /**
   * Call from GameScene when a rocket hits something.
   * Triggers an animated explosion at the current position.
   */
  explode() {
    if (!this.scene) return;
    const scene = this.scene;
    const { x, y } = this;
    this.deactivate();

    // Play explosion frames via tweens on temporary images
    let frame = 0;
    const next = () => {
      if (frame >= 5) return;
      const img = scene.add.image(x, y, `explosion_${frame}`).setDepth(8);
      scene.time.delayedCall(60, () => { img.destroy(); next(); });
      frame++;
    };
    next();
  }
}
