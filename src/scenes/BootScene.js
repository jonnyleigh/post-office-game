import * as Phaser from 'phaser';
import { TextureFactory } from '../graphics/TextureFactory.js';
import { MusicManager, MUSIC_TRACKS } from '../audio/MusicManager.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.load.image('title_bg', 'assets/images/title_bg.png');
    // Load music tracks (silently skipped if files don't exist yet)
    MUSIC_TRACKS.forEach(t => this.load.audio(t.key, t.file));
  }

  create() {
    TextureFactory.generate(this);
    MusicManager.init(this);

    const params = new URLSearchParams(window.location.search);
    if (params.get('devmode') === '1') {
      this.scene.start('LevelBuilderScene');
    } else {
      this.scene.start('MenuScene');
    }
  }
}
