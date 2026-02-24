import * as Phaser from 'phaser';
import { NPC } from './NPC.js';

const PANIC_RANGE = 250;
const WANDER_INTERVAL = 2000;

export class Innocent extends NPC {
  constructor(scene, x, y) {
    super(scene, x, y, 'innocent', { maxHealth: 30, speed: 100 });
    this.npcType = 'innocent';
    this._wanderTarget = null;
    this._wanderTimer  = 0;
    this.setTint(0xfad7a0);
  }

  state_idle(time, delta) {
    this.transitionTo('wander');
  }

  state_wander(time, delta) {
    // Check for nearby danger
    if (this.target && this.distToTarget() < PANIC_RANGE) {
      this.transitionTo('panic');
      return;
    }

    this._wanderTimer += delta;
    if (this._wanderTimer > WANDER_INTERVAL || !this._wanderTarget) {
      this._wanderTimer = 0;
      this._setRandomWanderTarget();
    }

    if (this._wanderTarget) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this._wanderTarget.x, this._wanderTarget.y);
      if (dist < 10) {
        this.body.stop();
        this._wanderTarget = null;
      } else {
        this.scene.physics.moveTo(this, this._wanderTarget.x, this._wanderTarget.y, 40);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this._wanderTarget.x, this._wanderTarget.y);
        this.setRotation(angle);
      }
    }
  }

  state_panic(time, delta) {
    // Run away from the player
    if (this.target) {
      const awayAngle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
      const speed = 110;
      this.setVelocity(Math.cos(awayAngle) * speed, Math.sin(awayAngle) * speed);
      this.setRotation(awayAngle);

      // Calm down if player is far enough
      if (this.distToTarget() > PANIC_RANGE * 1.5) {
        this.transitionTo('wander');
      }
    } else {
      this.transitionTo('wander');
    }
  }

  _setRandomWanderTarget() {
    const range = 150;
    this._wanderTarget = {
      x: this.x + Phaser.Math.Between(-range, range),
      y: this.y + Phaser.Math.Between(-range, range),
    };
  }

  // Innocents can be shot (no combat back)
  _onDeath() {
    super._onDeath();
  }
}
