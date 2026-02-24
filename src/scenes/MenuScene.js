import * as Phaser from 'phaser';
import { MusicManager } from '../audio/MusicManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background image, scaled to fill screen
    const bg = this.add.image(cx, height / 2, 'title_bg');
    bg.setDisplaySize(width, height);

    // Dark overlay for readability
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, width, height);

    // Title
    this.add.text(cx, height * 0.22, 'POST OFFICE', {
      fontSize: '72px', fontFamily: 'monospace',
      color: '#e74c3c', stroke: '#000', strokeThickness: 6,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.36, 'A Tower of Carnage', {
      fontSize: '22px', fontFamily: 'monospace', color: '#85c1e9'
    }).setOrigin(0.5);

    // Controls info
    const controls = [
      'W / Up Arrow       — Move Forward',
      'S / Down Arrow     — Move Backward',
      'A / Left Arrow     — Strafe Left',
      'D / Right Arrow    — Strafe Right',
      'Mouse              — Aim',
      'Left Click / Space — Fire',
      '1-5                — Switch Weapon',
      'E                  — Enter Elevator',
      '',
      'F1  — Cheat: Full Health & Armor',
      'F2  — Cheat: All Weapons',
      'F3  — Cheat: Full Ammo',
    ];
    controls.forEach((line, i) => {
      this.add.text(cx, height * 0.43 + i * 22, line, {
        fontSize: '14px', fontFamily: 'monospace',
        color: line.startsWith('F') ? '#f4d03f' : '#aaaaaa',
      }).setOrigin(0.5);
    });

    // Music toggle button
    const musicLabel = () => `[ MUSIC: ${MusicManager.isEnabled() ? 'ON  🔊' : 'OFF 🔇'} ]`;
    const musicBtn = this.add.text(cx, height * 0.82, musicLabel(), {
      fontSize: '20px', fontFamily: 'monospace',
      color: MusicManager.isEnabled() ? '#44dd44' : '#888888',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    musicBtn.on('pointerdown', () => {
      const on = MusicManager.toggle();
      musicBtn.setText(musicLabel());
      musicBtn.setStyle({ color: on ? '#44dd44' : '#888888' });
    });
    musicBtn.on('pointerover',  () => musicBtn.setAlpha(0.75));
    musicBtn.on('pointerout',   () => musicBtn.setAlpha(1));

    // Start button
    const startBtn = this.add.text(cx, height * 0.88, '[ PRESS ENTER TO START ]', {
      fontSize: '28px', fontFamily: 'monospace', color: '#f4d03f',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: startBtn, alpha: 0, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Version
    this.add.text(width - 8, height - 8, 'v1.0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#444'
    }).setOrigin(1, 1);

    // Input — keyboard only (avoids music button click starting game)
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
  }

  startGame() {
    this.scene.start('GameScene', { level: 1 });
  }
}
