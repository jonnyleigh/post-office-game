import * as Phaser from 'phaser';
import { LevelLoader } from '../level/LevelLoader.js';
import { Player } from '../entities/Player.js';
import { Soldier } from '../entities/Soldier.js';
import { Boss } from '../entities/Boss.js';
import { Innocent } from '../entities/Innocent.js';
import { Projectile } from '../entities/Projectile.js';
import { HealthPickup, ArmorPickup, LifePickup, AmmoPickup, WeaponPickup } from '../pickups/Pickup.js';
import { EventBus, EVT } from '../EventBus.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.levelNum     = data.level || 1;
    this._bossKilled  = false;
    this._transitioning = false;
    // Carry over player state between levels
    this._savedPlayer = data.savedPlayer || null;
  }

  create() {
    // ── Load level ──────────────────────────────────────────────────────────
    const { levelData, wallGroup, worldW, worldH } = LevelLoader.load(this, this.levelNum);
    this._levelData = levelData;
    this._wallGroup = wallGroup;
    const T = levelData.tileSize;

    // World + camera bounds
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // ── Enemy bullet pool ───────────────────────────────────────────────────
    this._enemyBulletGroup = this.physics.add.group({
      classType: Projectile, maxSize: 80, runChildUpdate: false,
    });
    this._enemyBulletGroup.createMultiple({ key: 'bullet_enemy', quantity: 80, active: false, visible: false });

    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject instanceof Projectile && body.gameObject.isEnemyBullet) {
        body.gameObject.deactivate();
      }
    });

    // ── Player ──────────────────────────────────────────────────────────────
    const { x: px, y: py } = LevelLoader.toWorld(levelData.playerStart.col, levelData.playerStart.row, T);
    this._player = new Player(this, px, py);
    if (this._savedPlayer) {
      this._restorePlayer(this._savedPlayer);
    }
    this._player._emitStats();

    // Camera follows player
    this.cameras.main.startFollow(this._player, true, 0.1, 0.1);

    // ── Elevator ────────────────────────────────────────────────────────────
    const { x: ex, y: ey } = LevelLoader.toWorld(levelData.elevator.col, levelData.elevator.row, T);
    this._elevator  = this.add.sprite(ex, ey, 'elevator').setDepth(4);
    this._elevatorX = ex;
    this._elevatorY = ey;
    this._elevatorActive = false;
    this._eKey = this.input.keyboard.addKey('E');

    // ── Cheats ───────────────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-F1', () => {
      this._player.health = 100;
      this._player.armor  = 100;
      this._player._emitStats();
      EventBus.emit(EVT.PICKUP_MESSAGE, '🩹 CHEAT: Full health & armor');
    });
    this.input.keyboard.on('keydown-F2', () => {
      for (let cat = 1; cat <= 4; cat++) this._player.weapons.addWeapon(cat);
      EventBus.emit(EVT.PICKUP_MESSAGE, '🔫 CHEAT: All weapons unlocked');
    });
    this.input.keyboard.on('keydown-F3', () => {
      for (let cat = 1; cat <= 4; cat++) this._player.weapons.addAmmo(cat, 999);
      EventBus.emit(EVT.PICKUP_MESSAGE, '📦 CHEAT: Full ammo');
    });

    // ── NPCs ────────────────────────────────────────────────────────────────
    this._soldierGroup  = this.physics.add.group();
    this._innocentGroup = this.physics.add.group();

    levelData.soldiers.forEach(s => {
      const { x, y } = LevelLoader.toWorld(s.col, s.row, T);
      const soldier = new Soldier(this, x, y, this.levelNum);
      soldier.target = this._player;
      soldier.enemyBulletGroup = this._enemyBulletGroup;
      this._soldierGroup.add(soldier);
    });

    levelData.innocents.forEach(n => {
      const { x, y } = LevelLoader.toWorld(n.col, n.row, T);
      const innocent = new Innocent(this, x, y);
      innocent.target = this._player;
      this._innocentGroup.add(innocent);
    });

    const { x: bx, y: by } = LevelLoader.toWorld(levelData.boss.col, levelData.boss.row, T);
    this._boss = new Boss(this, bx, by, this.levelNum);
    this._boss.target        = this._player;
    this._boss.enemyBulletGroup = this._enemyBulletGroup;
    this._bossGroup = this.physics.add.group();
    this._bossGroup.add(this._boss);

    // ── Pickups ──────────────────────────────────────────────────────────────
    this._pickupGroup = this.physics.add.group();
    levelData.pickups.forEach(p => {
      const { x, y } = LevelLoader.toWorld(p.col, p.row, T);
      let pickup;
      switch (p.type) {
        case 'health': pickup = new HealthPickup(this, x, y); break;
        case 'armor':  pickup = new ArmorPickup(this, x, y);  break;
        case 'life':   pickup = new LifePickup(this, x, y);   break;
        case 'ammo':   pickup = new AmmoPickup(this, x, y);   break;
        case 'weapon': pickup = new WeaponPickup(this, x, y, p.weaponType); break;
        default: return;
      }
      this._pickupGroup.add(pickup);
    });

    // ── Physics colliders ───────────────────────────────────────────────────
    this.physics.add.collider(this._player, wallGroup);
    this.physics.add.collider(this._soldierGroup, wallGroup);
    this.physics.add.collider(this._innocentGroup, wallGroup);
    this.physics.add.collider(this._soldierGroup, this._soldierGroup);
    this.physics.add.collider(this._boss, wallGroup);

    // Player bullets → walls & enemies
    this.physics.add.collider(
      this._player.projectileGroup, wallGroup,
      (a, b) => { const p = (a instanceof Projectile) ? a : b; p.deactivate(); },
    );
    this.physics.add.overlap(
      this._player.projectileGroup, this._soldierGroup,
      this._onPlayerBulletHitEnemy, null, this,
    );
    this.physics.add.overlap(
      this._player.projectileGroup, this._bossGroup,
      this._onPlayerBulletHitEnemy, null, this,
    );
    this.physics.add.overlap(
      this._player.projectileGroup, this._innocentGroup,
      this._onPlayerBulletHitInnocent, null, this,
    );

    // Enemy bullets → walls & player
    this.physics.add.collider(
      this._enemyBulletGroup, wallGroup,
      (a, b) => { const p = (a instanceof Projectile) ? a : b; p.deactivate(); },
    );
    this.physics.add.overlap(
      this._enemyBulletGroup, this._player,
      this._onEnemyBulletHitPlayer, null, this,
    );

    // Pickups → player
    this.physics.add.overlap(
      this._player, this._pickupGroup,
      (player, pickup) => { if (pickup.active) pickup.collect(player); },
    );

    // Melee
    this._player.on('melee', this._handleMelee, this);

    // ── EventBus ─────────────────────────────────────────────────────────────
    EventBus.on(EVT.BOSS_KILLED,  this._onBossKilled,  this);
    EventBus.on(EVT.PLAYER_DIED,  this._onPlayerDied,  this);
    this.events.on('shutdown', this._cleanup, this);

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.scene.launch('HUDScene');
    this.scene.bringToTop('HUDScene');

    // Defer initial HUD state until HUDScene.create() has run (next frame)
    this.time.delayedCall(50, () => {
      EventBus.emit('hud-level', this.levelNum);
      this._player._emitStats();
      EventBus.emit(EVT.AMMO_CHANGED, this._player.weapons._ammoSnapshot());
      EventBus.emit(EVT.WEAPON_SWITCHED, { cat: this._player.weapons.currentCat });
    });
  }

  update(time, delta) {
    if (!this._player) return;

    this._player.update(time, delta);

    // Update all living NPCs
    this._soldierGroup.getChildren().forEach(s => {
      if (s.active) s.update(time, delta);
    });
    if (this._boss?.active && !this._boss.isDead()) {
      this._boss.update(time, delta);
    }
    this._innocentGroup.getChildren().forEach(n => {
      if (n.active) n.update(time, delta);
    });

    // Elevator interaction
    if (this._elevatorActive && !this._transitioning) {
      const dist = Phaser.Math.Distance.Between(
        this._player.x, this._player.y, this._elevatorX, this._elevatorY
      );
      if (dist < 80 && Phaser.Input.Keyboard.JustDown(this._eKey)) {
        this._levelComplete();
      }
    }
  }

  // ─── Hit callbacks ──────────────────────────────────────────────────────────

  _onPlayerBulletHitEnemy(bullet, npc) {
    if (!bullet.active || !npc.active) return;
    if (bullet.splashRadius > 0) {
      bullet.explode();
      this._applySplash(bullet.x, bullet.y, bullet.splashRadius, bullet.damage, false);
    } else {
      npc.takeDamage(bullet.damage);
      bullet.deactivate();
    }
  }

  _onPlayerBulletHitInnocent(bullet, npc) {
    if (!bullet.active || !npc.active) return;
    npc.takeDamage(bullet.damage);
    bullet.deactivate();
    EventBus.emit(EVT.PICKUP_MESSAGE, 'Innocent hurt! Watch out!');
  }

  _onEnemyBulletHitPlayer(player, bullet) {
    if (!bullet.active || player._dead) return;
    bullet.deactivate();
    player.takeDamage(bullet.damage || 8, this.time.now);
  }

  _applySplash(cx, cy, radius, damage, isEnemy) {
    const targets = isEnemy
      ? [this._player]
      : [...this._soldierGroup.getChildren(), this._boss];

    targets.forEach(t => {
      if (!t || !t.active) return;
      const dist = Phaser.Math.Distance.Between(cx, cy, t.x, t.y);
      if (dist < radius) {
        const scaled = Math.round(damage * (1 - dist / radius));
        if (isEnemy) this._player.takeDamage(scaled, this.time.now);
        else t.takeDamage(scaled);
      }
    });
  }

  _handleMelee({ x, y, angle, time }) {
    const reach = 55;
    const mx = x + Math.cos(angle) * reach;
    const my = y + Math.sin(angle) * reach;
    const targets = [...this._soldierGroup.getChildren(), this._boss, ...this._innocentGroup.getChildren()];
    targets.forEach(t => {
      if (!t || !t.active) return;
      const dist = Phaser.Math.Distance.Between(mx, my, t.x, t.y);
      if (dist < 40) t.takeDamage(30);
    });
    // Visual swing arc
    const flash = this.add.graphics();
    flash.fillStyle(0x85c1e9, 0.4);
    flash.beginPath();
    flash.arc(x, y, 50, angle - 0.5, angle + 0.5, false);
    flash.lineTo(x, y);
    flash.closePath();
    flash.fillPath();
    this.time.delayedCall(120, () => flash.destroy());
  }

  // ─── Level events ───────────────────────────────────────────────────────────

  _onBossKilled() {
    this._bossKilled = true;
    this._elevatorActive = true;
    // Light up elevator
    this.tweens.add({
      targets: this._elevator, alpha: 0.5, duration: 400,
      yoyo: true, repeat: -1,
    });
  }

  _levelComplete() {
    if (this._transitioning) return;
    this._transitioning = true;

    const saved = this._snapshotPlayer();
    this.scene.stop('HUDScene');
    this.scene.start('LevelCompleteScene', {
      level: this.levelNum,
      nextLevel: this.levelNum + 1,
      savedPlayer: saved,
    });
  }

  _onPlayerDied({ lives }) {
    if (this._transitioning) return;
    if (lives <= 0) {
      // Game over
      this._transitioning = true;
      this.time.delayedCall(800, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { level: this.levelNum });
      });
    } else {
      // Respawn after a delay
      this.time.delayedCall(1200, () => {
        const T = this._levelData.tileSize;
        const { x, y } = LevelLoader.toWorld(
          this._levelData.playerStart.col,
          this._levelData.playerStart.row, T,
        );
        this._player.respawn(x, y);
      });
    }
  }

  // ─── Player save/restore (between levels) ─────────────────────────────────

  _snapshotPlayer() {
    const p = this._player;
    return {
      health:  p.health,
      armor:   p.armor,
      lives:   p.lives,
      ammo:    [...p.weapons.ammo],
      held:    [...p.weapons.held],
      currentCat: p.weapons.currentCat,
    };
  }

  _restorePlayer(saved) {
    this._player.health = saved.health;
    this._player.armor  = saved.armor;
    this._player.lives  = saved.lives;
    this._player.weapons.ammo = [...saved.ammo];
    this._player.weapons.held = [...saved.held];
    this._player.weapons.currentCat = saved.currentCat;
  }

  _cleanup() {
    EventBus.off(EVT.BOSS_KILLED, this._onBossKilled, this);
    EventBus.off(EVT.PLAYER_DIED, this._onPlayerDied, this);
  }
}
