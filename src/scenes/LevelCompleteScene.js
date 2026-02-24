import * as Phaser from 'phaser';

const MAX_LEVEL = 5;

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelCompleteScene' }); }

  init(data) {
    this.levelNum   = data.level;
    this.nextLevel  = data.nextLevel;
    this.savedPlayer = data.savedPlayer;
  }

  create() {
    const { width: W, height: H } = this.scale;
    const cx = W / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, W, H);

    this.add.text(cx, H * 0.25, 'FLOOR CLEARED!', {
      fontSize: '56px', fontFamily: 'monospace', color: '#f4d03f',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.42, `Floor ${this.levelNum} — Survived`, {
      fontSize: '22px', fontFamily: 'monospace', color: '#85c1e9',
    }).setOrigin(0.5);

    if (this.nextLevel > MAX_LEVEL) {
      this.add.text(cx, H * 0.58, 'YOU WIN!\nYou escaped the building.', {
        fontSize: '28px', fontFamily: 'monospace', color: '#2ecc71',
        align: 'center',
      }).setOrigin(0.5);

      const btn = this.add.text(cx, H * 0.78, '[ MAIN MENU ]', {
        fontSize: '26px', fontFamily: 'monospace', color: '#f4d03f',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.scene.start('MenuScene'));
    } else {
      this.add.text(cx, H * 0.58, `Next: Floor ${this.nextLevel}`, {
        fontSize: '26px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0.5);

      const btn = this.add.text(cx, H * 0.74, '[ CONTINUE ]', {
        fontSize: '30px', fontFamily: 'monospace', color: '#f4d03f',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.tweens.add({ targets: btn, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

      const proceed = () => {
        this.scene.start('GameScene', { level: this.nextLevel, savedPlayer: this.savedPlayer });
      };
      btn.on('pointerdown', proceed);
      this.input.keyboard.once('keydown-ENTER', proceed);
      this.input.keyboard.once('keydown-SPACE', proceed);
    }
  }
}
