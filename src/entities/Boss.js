import * as Phaser from 'phaser';
import { NPC } from './NPC.js';
import { EventBus, EVT } from '../EventBus.js';

const ALERT_RANGE  = 400;
const PERCEPTION_INTERVAL = 150;

export class Boss extends NPC {
  constructor(scene, x, y, levelNum = 1) {
    const health  = 100 + (levelNum - 1) * 80;
    const weapCat = Math.min(levelNum - 1, 4);
    super(scene, x, y, 'boss', { maxHealth: health, speed: 50, weaponCat: weapCat });
    this.npcType    = 'boss';
    this.levelNum   = levelNum;
    this.spawnX     = x;
    this.spawnY     = y;
    this.enemyBulletGroup = null;
    this._fireRate        = Math.max(300, 900 - (levelNum - 1) * 100);
    this._lastFired       = 0;
    this.setScale(1.3);
  }

  state_idle(time, delta) {
    // Boss starts in guard mode, near its spawn point
    this.transitionTo('guard');
  }

  state_guard(time, delta) {
    if (this.stateTimer < PERCEPTION_INTERVAL) return;
    this.stateTimer = 0;

    if (this.target && this.distToTarget() < ALERT_RANGE) {
      this.transitionTo('alert');
      return;
    }

    // Slowly patrol back toward spawn
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);
    if (dist > 40) {
      this.scene.physics.moveTo(this, this.spawnX, this.spawnY, 30);
    } else {
      this.body.stop();
    }
  }

  _onHit() {
    if (this.state === 'guard' || this.state === 'idle') {
      this.transitionTo('alert');
    }
  }

  state_alert(time, delta) {
    if (!this.target) return;

    if (this.stateTimer > PERCEPTION_INTERVAL) {
      this.stateTimer = 0;
      if (this.distToTarget() > ALERT_RANGE * 1.4) {
        this.transitionTo('guard');
        this.body.stop();
        return;
      }
    }

    this.body.stop();
    this.setRotation(this.angleToTarget());

    if (time - this._lastFired > this._fireRate) {
      this._lastFired = time;
      this._fireBurst(time);
    }
  }

  _fireBurst(time) {
    if (!this.enemyBulletGroup) return;
    const shots = 1 + Math.floor(this.levelNum / 2);
    const spread = 0.12;
    const baseAngle = this.angleToTarget();
    for (let i = 0; i < shots; i++) {
      const offset = (i - (shots - 1) / 2) * spread;
      const bullet = this.enemyBulletGroup.getFirstDead(false);
      if (!bullet) continue;
      const dmg = 10 + this.levelNum * 3;
      bullet.fire(this.x, this.y, baseAngle + offset, 'bullet_enemy', 380, dmg, true, 0);
    }
  }

  _onDeath() {
    super._onDeath();
    EventBus.emit(EVT.BOSS_KILLED, { level: this.levelNum });
  }
}
