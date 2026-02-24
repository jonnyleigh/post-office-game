import * as Phaser from 'phaser';
import { EventBus, EVT } from '../EventBus.js';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, label) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);  // dynamic body — overlap works fine
    this.body.setImmovable(true);
    this.body.allowGravity = false;
    this.setDepth(3);
    this._label = label;
    // Gentle scale pulse
    scene.tweens.add({
      targets: this, scaleX: 1.15, scaleY: 1.15, duration: 700,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  /** Override in subclasses */
  applyTo(player) {}

  collect(player) {
    this.applyTo(player);
    EventBus.emit(EVT.PICKUP_MESSAGE, this._label);
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }
}

// ─── concrete pickups ────────────────────────────────────────────────────────

export class HealthPickup extends Pickup {
  constructor(scene, x, y) {
    super(scene, x, y, 'pickup_health', '+25 Health');
  }
  applyTo(player) { player.addHealth(25); }
}

export class ArmorPickup extends Pickup {
  constructor(scene, x, y) {
    super(scene, x, y, 'pickup_armor', '+30 Armor');
  }
  applyTo(player) { player.addArmor(30); }
}

export class LifePickup extends Pickup {
  constructor(scene, x, y) {
    super(scene, x, y, 'pickup_life', '+1 Life!');
  }
  applyTo(player) { player.addLife(); }
}

export class AmmoPickup extends Pickup {
  constructor(scene, x, y) {
    super(scene, x, y, 'pickup_ammo', 'Ammo picked up');
  }
  applyTo(player) {
    // Give ammo for all held weapons (handgun/shotgun/machinegun/rocket)
    const amounts = [0, 12, 8, 40, 4];
    [1, 2, 3, 4].forEach(cat => {
      if (player.weapons.held[cat]) {
        player.weapons.addAmmo(cat, amounts[cat]);
      }
    });
  }
}

export class WeaponPickup extends Pickup {
  constructor(scene, x, y, weaponType) {
    super(scene, x, y, 'pickup_weapon', `Picked up ${['', 'Handgun', 'Shotgun', 'Machine Gun', 'Rocket Launcher'][weaponType]}`);
    this.weaponType = weaponType;
  }
  applyTo(player) {
    player.weapons.addWeapon(this.weaponType);
  }
}
