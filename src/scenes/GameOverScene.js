import * as Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) { this.levelNum = data.level || 1; }

  create() {
    const { width: W, height: H } = this.scale;
    const cx = W / 2;

    // Background image
    const bg = this.add.image(cx, H / 2, 'title_bg');
    bg.setDisplaySize(W, H);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.68);
    overlay.fillRect(0, 0, W, H);

    this.add.text(cx, H * 0.22, 'GAME OVER', {
      fontSize: '72px', fontFamily: 'monospace', color: '#e74c3c',
      stroke: '#000', strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 10, fill: true },
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.42, `You fell on Floor ${this.levelNum}`, {
      fontSize: '24px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.54, 'The office building stands victorious.', {
      fontSize: '16px', fontFamily: 'monospace', color: '#666',
    }).setOrigin(0.5);

    const retry = this.add.text(cx, H * 0.70, '[ TRY AGAIN ]', {
      fontSize: '30px', fontFamily: 'monospace', color: '#f4d03f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: retry, alpha: 0, duration: 700, yoyo: true, repeat: -1 });
    retry.on('pointerdown', () => this.scene.start('GameScene', { level: 1 }));

    const menu = this.add.text(cx, H * 0.82, '[ MAIN MENU ]', {
      fontSize: '20px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene', { level: 1 }));
  }
}
