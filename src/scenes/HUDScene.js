import * as Phaser from 'phaser';
import { EventBus, EVT } from '../EventBus.js';
import { WEAPON_DEFS } from '../weapons/WeaponManager.js';

const SLOT_W = 62;
const SLOT_H = 54;
const SLOT_PAD = 6;

export class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create() {
    this.cameras.main.setScroll(0, 0);

    const W = this.scale.width;
    const H = this.scale.height;

    // Semi-transparent HUD bar at bottom
    const barH = 70;
    this._bg = this.add.graphics();
    this._bg.fillStyle(0x000000, 0.7);
    this._bg.fillRect(0, H - barH, W, barH);
    this._bg.lineStyle(1, 0x444488, 1);
    this._bg.lineBetween(0, H - barH, W, H - barH);

    const midY = H - barH / 2;

    // ── Health bar ───────────────────────────────────────────────────────────
    this._healthLabel = this.add.text(10, midY - 14, 'HP', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa'
    });
    this._healthBarBg = this.add.graphics();
    this._healthBarBg.fillStyle(0x333333, 1);
    this._healthBarBg.fillRect(32, midY - 15, 100, 12);
    this._healthBar = this.add.graphics();
    this._updateHealthBar(100);

    // ── Armor bar ────────────────────────────────────────────────────────────
    this._armorLabel = this.add.text(10, midY + 2, 'AR', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa'
    });
    this._armorBarBg = this.add.graphics();
    this._armorBarBg.fillStyle(0x333333, 1);
    this._armorBarBg.fillRect(32, midY + 4, 100, 10);
    this._armorBar = this.add.graphics();
    this._updateArmorBar(0);

    // ── Lives ────────────────────────────────────────────────────────────────
    this._livesContainer = this.add.container(148, midY - 4);
    this._renderLives(3);

    // ── Level display ────────────────────────────────────────────────────────
    this._levelText = this.add.text(W / 2, H - barH + 8, 'FLOOR 1', {
      fontSize: '14px', fontFamily: 'monospace', color: '#85c1e9',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0);

    // ── Weapon slots ─────────────────────────────────────────────────────────
    this._weaponSlots = [];
    this._slotStartX = W - (SLOT_W + SLOT_PAD) * 5 - 8;

    for (let i = 0; i < 5; i++) {
      this._createWeaponSlot(i);
    }
    this._updateWeaponSlots(null);
    this._highlightSlot(1);

    // ── Message system ───────────────────────────────────────────────────────
    this._messages  = [];
    this._messageY  = H - barH - 14;

    // ── Elevator hint ────────────────────────────────────────────────────────
    this._elevatorHint = this.add.text(W / 2, H - barH - 36, 'Boss defeated! Find the elevator — press E', {
      fontSize: '16px', fontFamily: 'monospace', color: '#f4d03f',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 1).setVisible(false);

    // ── Wire EventBus ────────────────────────────────────────────────────────
    EventBus.on(EVT.PLAYER_STATS_CHANGED, this._onStatsChanged, this);
    EventBus.on(EVT.AMMO_CHANGED,         this._onAmmoChanged,  this);
    EventBus.on(EVT.WEAPON_SWITCHED,      this._onWeaponSwitched, this);
    EventBus.on(EVT.PICKUP_MESSAGE,       this._showMessage,     this);
    EventBus.on(EVT.BOSS_KILLED,          this._onBossKilled,   this);
    EventBus.on('hud-level',              this._onLevelChanged, this);

    this.events.on('shutdown', this._cleanup, this);
  }

  // ── Weapon slot builders ───────────────────────────────────────────────────

  _createWeaponSlot(i) {
    const x = this._slotStartX + i * (SLOT_W + SLOT_PAD);
    const H = this.scale.height;
    const y = H - 68;

    const g = this.add.graphics();
    g.lineStyle(2, 0x555555, 1);
    g.fillStyle(0x111111, 0.8);
    g.fillRect(x, y, SLOT_W, SLOT_H);
    g.strokeRect(x, y, SLOT_W, SLOT_H);

    const icon = this.add.image(x + SLOT_W / 2, y + SLOT_H / 2 - 6, `weapon_icon_${i}`)
      .setAlpha(0.3).setScale(1.4);

    const numLabel = this.add.text(x + 3, y + 2, `${i + 1}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666'
    });

    const ammoText = this.add.text(x + SLOT_W / 2, y + SLOT_H - 10, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#f4d03f'
    }).setOrigin(0.5, 1);

    this._weaponSlots.push({ g, icon, numLabel, ammoText, x, y });
  }

  _updateWeaponSlots(ammoData) {
    this._weaponSlots.forEach((slot, i) => {
      const held = ammoData ? ammoData[i]?.held : (i <= 1);
      const ammo = ammoData ? ammoData[i]?.ammo : (i === 1 ? 12 : 0);

      if (!held) {
        slot.icon.setAlpha(0.15).setTint(0xffffff);
        slot.ammoText.setText('');
        return;
      }

      if (i === 0) {
        slot.icon.setAlpha(0.9).clearTint();
        slot.ammoText.setText('∞').setColor('#aaaaaa');
        return;
      }

      if (ammo <= 0) {
        slot.icon.setAlpha(0.4).setTint(0x666666);
        slot.ammoText.setText('EMPTY').setColor('#884444');
      } else {
        slot.icon.setAlpha(0.9).clearTint();
        slot.ammoText.setText(`${ammo}`).setColor('#f4d03f');
      }
    });
  }

  _highlightSlot(cat) {
    this._weaponSlots.forEach((slot, i) => {
      slot.g.clear();
      const isActive = i === cat;
      slot.g.lineStyle(isActive ? 2 : 1, isActive ? 0xf4d03f : 0x555555, 1);
      slot.g.fillStyle(isActive ? 0x332200 : 0x111111, 0.8);
      slot.g.fillRect(slot.x, slot.y, SLOT_W, SLOT_H);
      slot.g.strokeRect(slot.x, slot.y, SLOT_W, SLOT_H);
    });
  }

  // ── Bars ───────────────────────────────────────────────────────────────────

  _updateHealthBar(value) {
    const H = this.scale.height;
    const barH = 70;
    const midY = H - barH / 2;
    this._healthBar.clear();
    const color = value > 50 ? 0x2ecc71 : value > 25 ? 0xf39c12 : 0xe74c3c;
    this._healthBar.fillStyle(color, 1);
    this._healthBar.fillRect(32, midY - 15, Math.max(0, value), 12);
  }

  _updateArmorBar(value) {
    const H = this.scale.height;
    const barH = 70;
    const midY = H - barH / 2;
    this._armorBar.clear();
    this._armorBar.fillStyle(0x3498db, 1);
    this._armorBar.fillRect(32, midY + 4, Math.max(0, value), 10);
  }

  _renderLives(count) {
    this._livesContainer.removeAll(true);
    for (let i = 0; i < count; i++) {
      const heart = this.add.text(i * 18, 0, '❤', {
        fontSize: '16px', color: '#e74c3c'
      });
      this._livesContainer.add(heart);
    }
  }

  // ── Message system ─────────────────────────────────────────────────────────

  _showMessage(text) {
    const msg = this.add.text(
      this.scale.width / 2,
      this._messageY - this._messages.length * 22,
      text,
      { fontSize: '15px', fontFamily: 'monospace', color: '#f4d03f', stroke: '#000', strokeThickness: 3 }
    ).setOrigin(0.5, 1);

    this._messages.push(msg);

    this.tweens.add({
      targets: msg, alpha: 0, y: msg.y - 30,
      duration: 2500, delay: 1000, ease: 'Sine.easeIn',
      onComplete: () => {
        msg.destroy();
        this._messages = this._messages.filter(m => m !== msg);
      }
    });
  }

  // ── EventBus handlers ──────────────────────────────────────────────────────

  _onStatsChanged({ health, armor, lives }) {
    this._updateHealthBar(health);
    this._updateArmorBar(armor);
    this._renderLives(Math.max(0, lives));
  }

  _onAmmoChanged(ammoData) {
    this._updateWeaponSlots(ammoData);
  }

  _onWeaponSwitched({ cat }) {
    this._highlightSlot(cat);
  }

  _onBossKilled() {
    this._elevatorHint.setVisible(true);
    this.time.delayedCall(5000, () => {
      if (this._elevatorHint?.active) this._elevatorHint.setVisible(false);
    });
  }

  _onLevelChanged(levelNum) {
    this._levelText.setText(`FLOOR ${levelNum}`);
  }

  _cleanup() {
    EventBus.off(EVT.PLAYER_STATS_CHANGED, this._onStatsChanged, this);
    EventBus.off(EVT.AMMO_CHANGED,         this._onAmmoChanged,  this);
    EventBus.off(EVT.WEAPON_SWITCHED,      this._onWeaponSwitched, this);
    EventBus.off(EVT.PICKUP_MESSAGE,       this._showMessage,     this);
    EventBus.off(EVT.BOSS_KILLED,          this._onBossKilled,   this);
    EventBus.off('hud-level',              this._onLevelChanged, this);
  }
}
