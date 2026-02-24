/**
 * TileRenderer — builds the visual background and static collision bodies for a level.
 *
 * Tile values:  0 = floor,  1 = wall,  2 = desk
 */
export class TileRenderer {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} levelData – parsed level JSON
   * @returns {{ wallGroup: Phaser.Physics.Arcade.StaticGroup, worldW: number, worldH: number }}
   */
  static build(scene, levelData) {
    const { tileSize: T, cols, rows, tiles } = levelData;
    const worldW = cols * T;
    const worldH = rows * T;

    // ── Draw the background using a RenderTexture ───────────────────────────
    const rt = scene.add.renderTexture(0, 0, worldW, worldH);
    rt.setDepth(-10);
    rt.setOrigin(0, 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = tiles[r][c];
        const px = c * T;
        const py = r * T;
        switch (val) {
          case 0: rt.draw('tile_floor', px, py); break;
          case 1: rt.draw('tile_wall',  px, py); break;
          case 2: rt.draw('tile_desk',  px, py); break;
          default: rt.draw('tile_floor', px, py);
        }
      }
    }

    // ── Build static physics bodies for solid tiles ─────────────────────────
    const wallGroup = scene.physics.add.staticGroup();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = tiles[r][c];
        if (val === 1 || val === 2) {
          const px = c * T + T / 2;
          const py = r * T + T / 2;
          // Create an invisible static sprite sized to the tile
          const body = wallGroup.create(px, py, 'pixel');
          body.setDisplaySize(T, T);
          body.setAlpha(0);
          body.refreshBody();
        }
      }
    }

    return { wallGroup, worldW, worldH };
  }
}
