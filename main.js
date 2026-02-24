import * as Phaser from 'phaser';
import { BootScene } from './src/scenes/BootScene.js';
import { MenuScene } from './src/scenes/MenuScene.js';
import { GameScene } from './src/scenes/GameScene.js';
import { HUDScene } from './src/scenes/HUDScene.js';
import { LevelCompleteScene } from './src/scenes/LevelCompleteScene.js';
import { GameOverScene } from './src/scenes/GameOverScene.js';
import { LevelBuilderScene } from './src/scenes/LevelBuilderScene.js';

const params = new URLSearchParams(window.location.search);
const devMode = params.get('devmode') === '1';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: devMode
    ? [BootScene, LevelBuilderScene, GameScene, HUDScene, LevelCompleteScene, GameOverScene, MenuScene]
    : [BootScene, MenuScene, GameScene, HUDScene, LevelCompleteScene, GameOverScene, LevelBuilderScene]
};

new Phaser.Game(config);
