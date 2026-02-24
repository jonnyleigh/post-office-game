import { EventBus, EVT } from '../EventBus.js';

export const WEAPON_DEFS = [
  // cat 0: Hammer
  {
    name: 'Hammer', category: 0, icon: 'weapon_icon_0',
    damage: 30, range: 50, fireRate: 400,
    speed: 0, ammoPerPickup: Infinity, projectileKey: null,
    ammoLabel: '∞',
  },
  // cat 1: Handgun
  {
    name: 'Handgun', category: 1, icon: 'weapon_icon_1',
    damage: 6, range: 600, fireRate: 300,
    speed: 600, ammoPerPickup: 12, projectileKey: 'bullet_1',
  },
  // cat 2: Shotgun
  {
    name: 'Shotgun', category: 2, icon: 'weapon_icon_2',
    damage: 8, range: 400, fireRate: 700,
    speed: 500, ammoPerPickup: 8, projectileKey: 'bullet_2',
    pellets: 5, spread: 0.26,  // ~15 degrees in radians
  },
  // cat 3: Machine Gun
  {
    name: 'Machine Gun', category: 3, icon: 'weapon_icon_3',
    damage: 6, range: 550, fireRate: 80,
    speed: 700, ammoPerPickup: 30, projectileKey: 'bullet_3',
  },
  // cat 4: Rocket Launcher
  {
    name: 'Rocket Launcher', category: 4, icon: 'weapon_icon_4',
    damage: 50, range: 800, fireRate: 1200,
    speed: 350, ammoPerPickup: 3, projectileKey: 'bullet_4',
    splash: 120,
  },
];

export class WeaponManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Physics.Arcade.Group} projectileGroup – shared pool (player bullets)
   */
  constructor(scene, projectileGroup) {
    this.scene = scene;
    this.projectileGroup = projectileGroup;
    this.lastFired = new Array(5).fill(0);

    // [category] → ammo count (Infinity for hammer)
    this.ammo = [Infinity, 0, 0, 0, 0];
    this.held = [true, true, false, false, false]; // start with hammer + handgun

    // Give starting ammo for handgun
    this.ammo[1] = 20;

    this.currentCat = 1;

    // Keyboard slots
    this._setupKeys();
  }

  _setupKeys() {
    const keys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
    keys.forEach((k, i) => {
      this.scene.input.keyboard.on(`keydown-${k}`, () => this.switchTo(i));
    });
  }

  switchTo(cat) {
    if (cat < 0 || cat > 4) return;
    if (!this.held[cat]) return;
    this.currentCat = cat;
    EventBus.emit(EVT.WEAPON_SWITCHED, { cat, ammo: this.ammo[cat] });
  }

  getAmmo(cat) { return this.ammo[cat]; }

  addWeapon(cat) {
    if (cat < 0 || cat > 4) return;
    const def = WEAPON_DEFS[cat];
    this.held[cat] = true;
    if (cat > 0) {
      this.ammo[cat] += def.ammoPerPickup;
    }
    this.switchTo(cat);
    EventBus.emit(EVT.AMMO_CHANGED, this._ammoSnapshot());
  }

  addAmmo(cat, amount) {
    if (cat === 0) return;
    this.ammo[cat] = Math.min(this.ammo[cat] + amount, 999);
    EventBus.emit(EVT.AMMO_CHANGED, this._ammoSnapshot());
  }

  _ammoSnapshot() {
    return this.ammo.map((a, i) => ({ cat: i, ammo: a, held: this.held[i] }));
  }

  /**
   * Attempt to fire current weapon.
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} angle  radians
   * @param {number} now    scene time ms
   * @returns {boolean} fired
   */
  fire(fromX, fromY, angle, now) {
    const cat = this.currentCat;
    const def = WEAPON_DEFS[cat];

    if (now - this.lastFired[cat] < def.fireRate) return false;

    if (cat === 0) {
      // Hammer — handled separately in Player via melee hit detection
      this.lastFired[cat] = now;
      return true;
    }

    if (this.ammo[cat] <= 0) {
      // Auto-switch to first available weapon with ammo
      this._autoSwitch();
      return false;
    }

    const pellets = def.pellets || 1;
    const spread  = def.spread  || 0;

    for (let i = 0; i < pellets; i++) {
      const bullet = this.projectileGroup.getFirstDead(false);
      if (!bullet) continue;

      const a = pellets > 1
        ? angle + (i - (pellets - 1) / 2) * (spread / (pellets - 1))
        : angle;

      bullet.fire(
        fromX, fromY, a,
        def.projectileKey,
        def.speed, def.damage,
        false, def.splash || 0,
      );
    }

    if (cat !== 0) {
      this.ammo[cat]--;
      EventBus.emit(EVT.AMMO_CHANGED, this._ammoSnapshot());
    }

    this.lastFired[cat] = now;
    return true;
  }

  /** Fire an enemy bullet from an NPC toward the player */
  fireEnemy(projectileGroup, fromX, fromY, angle, cat, now) {
    const def = WEAPON_DEFS[Math.min(cat, 4)];
    if (now - (this._enemyLastFired || 0) < def.fireRate) return false;
    this._enemyLastFired = now;

    const bullet = projectileGroup.getFirstDead(false);
    if (!bullet) return false;
    bullet.fire(fromX, fromY, angle, 'bullet_enemy', def.speed * 0.85, def.damage * 0.8, true, 0);
    return true;
  }

  _autoSwitch() {
    for (let i = 0; i <= 4; i++) {
      if (this.held[i] && (this.ammo[i] > 0 || i === 0)) {
        this.switchTo(i);
        return;
      }
    }
  }

  getCurrentDef() { return WEAPON_DEFS[this.currentCat]; }
}
