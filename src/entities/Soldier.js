import { NPC } from './NPC.js';

const DETECT_RANGE = 320;
const ATTACK_RANGE = 220;
const PERCEPTION_INTERVAL = 150; // ms between perception checks

export class Soldier extends NPC {
  constructor(scene, x, y, levelNum = 1) {
    const healthScale = 40 + (levelNum - 1) * 15;
    super(scene, x, y, 'soldier', { maxHealth: healthScale, speed: 70 + levelNum * 5 });
    this.npcType = 'soldier';
    this.levelNum = levelNum;
    this.enemyBulletGroup = null; // set by GameScene after creation
  }

  state_idle(time, delta) {
    if (this.stateTimer < PERCEPTION_INTERVAL) return;
    this.stateTimer = 0;
    if (this.target && this.distToTarget() < DETECT_RANGE) {
      this.transitionTo('chase');
    }
  }

  _onHit() {
    if (this.state === 'idle') {
      this.transitionTo('chase');
    }
  }

  state_chase(time, delta) {
    if (!this.target) return;

    const dist = this.distToTarget();

    // Perception gate
    if (this.stateTimer > PERCEPTION_INTERVAL) {
      this.stateTimer = 0;
      if (dist > DETECT_RANGE * 1.3) {
        this.transitionTo('idle');
        this.body.stop();
        return;
      }
      if (dist < ATTACK_RANGE) {
        this.transitionTo('attack');
        this.body.stop();
        return;
      }
    }

    this.scene.physics.moveToObject(this, this.target, this.speed);
    this.setRotation(this.angleToTarget());
  }

  state_attack(time, delta) {
    if (!this.target) return;

    const dist = this.distToTarget();
    if (this.stateTimer > PERCEPTION_INTERVAL) {
      this.stateTimer = 0;
      if (dist > ATTACK_RANGE * 1.2) {
        this.transitionTo('chase');
        return;
      }
    }

    this.body.stop();
    this.setRotation(this.angleToTarget());
    this._tryFireAtTarget(time, this.enemyBulletGroup);
  }
}
