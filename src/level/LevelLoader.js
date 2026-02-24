import { LEVELS } from './data/Levels.js';
import { TileRenderer } from './TileRenderer.js';

/**
 * LevelLoader — returns level data from embedded JS module and renders the tilemap.
 * Synchronous — no async fetch needed.
 */
export class LevelLoader {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} levelId  1-based
   * @returns {{ levelData, wallGroup, worldW, worldH }}
   */
  static load(scene, levelId) {
    const levelData = LEVELS.find(l => l.id === levelId);
    if (!levelData) throw new Error(`Level ${levelId} not found`);

    const { wallGroup, worldW, worldH } = TileRenderer.build(scene, levelData);
    return { levelData, wallGroup, worldW, worldH };
  }

  /** Convert { col, row } to pixel centre coordinates */
  static toWorld(col, row, tileSize) {
    return {
      x: col * tileSize + tileSize / 2,
      y: row * tileSize + tileSize / 2,
    };
  }
}
