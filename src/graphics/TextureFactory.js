import * as Phaser from 'phaser';

/**
 * TextureFactory — generates all named textures procedurally using Phaser Graphics.
 * Called once from BootScene.create() before any other scene starts.
 */
export class TextureFactory {

  static generate(scene) {
    TextureFactory._pixel(scene);
    TextureFactory._tiles(scene);
    TextureFactory._player(scene);
    TextureFactory._soldier(scene);
    TextureFactory._boss(scene);
    TextureFactory._innocent(scene);
    TextureFactory._projectiles(scene);
    TextureFactory._pickups(scene);
    TextureFactory._weaponIcons(scene);
    TextureFactory._elevator(scene);
    TextureFactory._muzzleFlash(scene);
    TextureFactory._explosion(scene);
    TextureFactory._createAnimations(scene);
  }

  // ─── helper ──────────────────────────────────────────────────────────────
  static _bake(scene, key, w, h, fn) {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ─── transparent 1×1 pixel (used for invisible physics bodies) ────────────
  static _pixel(scene) {
    if (scene.textures.exists('pixel')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture('pixel', 1, 1);
    g.destroy();
  }

  // ─── tiles ───────────────────────────────────────────────────────────────
  static _tiles(scene) {
    const T = 64;

    // floor
    TextureFactory._bake(scene, 'tile_floor', T, T, g => {
      g.fillStyle(0x2d2d4e);
      g.fillRect(0, 0, T, T);
      g.lineStyle(1, 0x3a3a5c, 0.6);
      g.strokeRect(0, 0, T, T);
    });

    // wall — staggered brickwork with 3-D shading
    TextureFactory._bake(scene, 'tile_wall', T, T, g => {
      // mortar background
      g.fillStyle(0x1c1c32);
      g.fillRect(0, 0, T, T);

      const bH = 13, bW = 27, mH = 3, mW = 3;

      for (let row = 0; row * (bH + mH) < T + bH; row++) {
        const y  = row * (bH + mH);
        const stagger = (row % 2) * Math.floor((bW + mW) / 2);

        for (let col = -1; col * (bW + mW) - stagger < T; col++) {
          const x  = col * (bW + mW) - stagger;
          const bx = Math.max(x, 0);
          const by = Math.max(y, 0);
          const bw = Math.min(x + bW, T) - bx;
          const bh = Math.min(y + bH, T) - by;
          if (bw < 2 || bh < 2) continue;

          // main face — alternate two brick shades
          g.fillStyle(row % 2 === 0 ? 0x48487a : 0x40406e);
          g.fillRect(bx, by, bw, bh);

          // top highlight
          g.fillStyle(0x6a6a9e);
          g.fillRect(bx, by, bw, Math.min(3, bh));

          // left highlight
          g.fillStyle(0x5c5c90);
          g.fillRect(bx, by, Math.min(2, bw), bh);

          // bottom shadow
          g.fillStyle(0x28284c);
          g.fillRect(bx, by + bh - Math.min(3, bh), bw, Math.min(3, bh));

          // right shadow
          g.fillStyle(0x30305a);
          g.fillRect(bx + bw - Math.min(3, bw), by, Math.min(3, bw), bh);
        }
      }

      // outer border — dark crisp edge
      g.lineStyle(2, 0x0e0e1e, 1);
      g.strokeRect(0, 0, T, T);

      // top/left outer highlight (light from upper-left)
      g.lineStyle(2, 0x7070a8, 0.7);
      g.lineBetween(0, T - 1, 0, 0);
      g.lineBetween(0, 0, T - 1, 0);
    });

    // desk — wood surface with grain, front face, and directional shading
    TextureFactory._bake(scene, 'tile_desk', T, T, g => {
      const faceH = 9; // visible front-face height at bottom

      // base shadow / underside
      g.fillStyle(0x2a1006);
      g.fillRect(0, 0, T, T);

      // top wood surface
      g.fillStyle(0x7a4218);
      g.fillRect(0, 0, T, T - faceH);

      // front face — darker brown for 3-D depth
      g.fillStyle(0x4a2a0c);
      g.fillRect(0, T - faceH, T, faceH);

      // front-face highlight stripe along the top edge of the front face
      g.fillStyle(0x6a3a14);
      g.fillRect(0, T - faceH, T, 2);

      // wood grain lines (horizontal, subtle variation)
      const grains = [0x8e5420, 0x6c3a10, 0x845018, 0x7c4816, 0x925824, 0x683810];
      for (let i = 0; i < 11; i++) {
        const gy = 4 + i * 5;
        if (gy >= T - faceH - 2) break;
        g.lineStyle(1, grains[i % grains.length], 0.55);
        g.lineBetween(3, gy, T - 3, gy);
      }

      // top-edge highlight (light from above)
      g.fillStyle(0x9e6030);
      g.fillRect(0, 0, T, 3);

      // left-edge highlight
      g.fillStyle(0x8e5224);
      g.fillRect(0, 0, 3, T - faceH);

      // right shadow edge
      g.fillStyle(0x3c2010);
      g.fillRect(T - 5, 0, 5, T - faceH);

      // bottom-right shadow on surface
      g.fillStyle(0x4e2a0e);
      g.fillRect(0, T - faceH - 6, T, 4);

      // subtle inset frame on top surface
      g.lineStyle(1, 0x3e1c08, 0.45);
      g.strokeRect(6, 6, T - 12, T - faceH - 8);

      // outer border
      g.lineStyle(2, 0x180802, 1);
      g.strokeRect(0, 0, T, T);
    });

    // elevator tile (floor with indicator)
    TextureFactory._bake(scene, 'tile_elevator', T, T, g => {
      g.fillStyle(0x1a3a5c);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x2a6aac);
      g.fillRect(8, 8, T - 16, T - 16);
      g.lineStyle(2, 0x4a9adc, 1);
      g.strokeRect(8, 8, T - 16, T - 16);
      // up arrow
      g.fillStyle(0x7adcff);
      g.fillTriangle(T / 2, 12, T / 2 - 10, T / 2, T / 2 + 10, T / 2);
      g.fillRect(T / 2 - 4, T / 2, 8, T / 2 - 12);
    });
  }

  // ─── characters (shared draw helper) ────────────────────────────────────
  /**
   * Draws one frame of a top-down walk cycle.
   * Character FACES RIGHT (Phaser rotation 0 = right).
   * Layout (facing →):  legs-back | torso+shoulders | head-front
   *
   * @param opts  shirtColor, pantsColor, skinColor, outlineColor,
   *              s (scale, default 1), helmet (bool), crown (bool)
   */
  static _drawPersonFrame(g, cx, cy, frameIdx, opts) {
    const {
      shirtColor, pantsColor,
      skinColor   = 0xf5cba7,   // warm skin tone
      outlineColor,
      s = 1,
      helmet = false,
      crown  = false,
    } = opts;

    const lw = Math.max(1, 1.3 * s);

    // Walk cycle: near-leg and far-leg swing along facing axis (±x)
    // Frame 0/2 = neutral; 1 = near leg forward; 3 = near leg back
    const swing = [0, 3.5, 0, -3.5][frameIdx % 4] * s;

    // ── Legs (drawn first so torso covers the tops) ──────────────────────
    // Near leg (toward screen top = cy − offset), far leg (cy + offset)
    const legX  = cx - 5 * s;
    const legOY = 5.5 * s;
    const lrW = 5 * s, lrH = 7 * s;
    g.fillStyle(pantsColor, 1);
    g.lineStyle(lw, outlineColor, 0.9);
    g.fillEllipse(legX + swing,  cy - legOY, lrW, lrH);
    g.strokeEllipse(legX + swing, cy - legOY, lrW, lrH);
    g.fillEllipse(legX - swing,  cy + legOY, lrW, lrH);
    g.strokeEllipse(legX - swing, cy + legOY, lrW, lrH);

    // ── Arms (perpendicular stubs, same layer as torso) ──────────────────
    const armX = cx + 1 * s;
    const armOY = 7.5 * s;
    const arW = 4.5 * s, arH = 6 * s;
    g.fillStyle(shirtColor, 1);
    g.lineStyle(lw, outlineColor, 0.8);
    g.fillEllipse(armX, cy - armOY, arW, arH);
    g.strokeEllipse(armX, cy - armOY, arW, arH);
    g.fillEllipse(armX, cy + armOY, arW, arH);
    g.strokeEllipse(armX, cy + armOY, arW, arH);

    // ── Torso / shoulders ────────────────────────────────────────────────
    // Shoulder band (wider, lighter)
    g.fillStyle(shirtColor, 1);
    g.lineStyle(lw, outlineColor, 1);
    g.fillEllipse(cx - 1 * s, cy, 15 * s, 13 * s);
    g.strokeEllipse(cx - 1 * s, cy, 15 * s, 13 * s);
    // Darker lower-torso strip suggestion
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx - 3 * s, cy, 9 * s, 8 * s);

    // ── Head ─────────────────────────────────────────────────────────────
    const hx = cx + 8 * s;
    const hr = 6 * s;

    if (helmet) {
      // Helmet base (over whole head, slightly larger)
      g.fillStyle(0x2d4a1e, 1);
      g.lineStyle(lw, 0x1a2e12, 1);
      g.fillCircle(hx, cy, hr * 1.1);
      g.strokeCircle(hx, cy, hr * 1.1);
      // Chin strap / visor gap — skin strip
      g.fillStyle(skinColor, 1);
      g.fillRect(hx - hr * 0.5, cy - hr * 0.3, hr, hr * 0.6);
    } else {
      g.fillStyle(skinColor, 1);
      g.lineStyle(lw, outlineColor, 1);
      g.fillCircle(hx, cy, hr);
      g.strokeCircle(hx, cy, hr);
      // Hair / shadow on back of head
      g.fillStyle(outlineColor, 0.35);
      g.fillCircle(hx - hr * 0.4, cy, hr * 0.65);
      // Eye dot (facing right = eye on right side of face)
      g.fillStyle(0x2c1a0e, 1);
      g.fillCircle(hx + hr * 0.35, cy - hr * 0.2, hr * 0.18);
    }

    // Crown (boss only)
    if (crown) {
      const topY = cy - (helmet ? hr * 1.1 : hr);
      g.fillStyle(0xf1c40f, 1);
      g.lineStyle(1, 0xb7950b, 1);
      g.fillTriangle(hx - 4 * s, topY, hx, topY - 5 * s, hx + 4 * s, topY);
      g.strokeTriangle(hx - 4 * s, topY, hx, topY - 5 * s, hx + 4 * s, topY);
    }
  }

  /** Build a 4-frame horizontal spritesheet and register integer frame keys 0-3. */
  static _makeSpritesheet(scene, key, W, H, drawFn) {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    for (let i = 0; i < 4; i++) drawFn(g, i * W, i);
    g.generateTexture(key, W * 4, H);
    g.destroy();
    const tex = scene.textures.get(key);
    for (let i = 0; i < 4; i++) tex.add(i, 0, i * W, 0, W, H);
  }

  static _player(scene) {
    // Blue shirt, dark jeans, warm skin head
    TextureFactory._makeSpritesheet(scene, 'player', 32, 32, (g, ox, f) => {
      TextureFactory._drawPersonFrame(g, ox + 14, 16, f, {
        shirtColor: 0x2e86c1, pantsColor: 0x1f3a5f,
        skinColor: 0xf5cba7, outlineColor: 0x1a2a3a, s: 1,
      });
    });
  }

  // ─── soldier ─────────────────────────────────────────────────────────────
  static _soldier(scene) {
    // Olive fatigues, skin face with green helmet
    TextureFactory._makeSpritesheet(scene, 'soldier', 32, 32, (g, ox, f) => {
      TextureFactory._drawPersonFrame(g, ox + 14, 16, f, {
        shirtColor: 0x4a7c3f, pantsColor: 0x2d4a1e,
        skinColor: 0xf5cba7, outlineColor: 0x1a2e0e, s: 1,
        helmet: true,
      });
    });
  }

  // ─── boss ────────────────────────────────────────────────────────────────
  static _boss(scene) {
    // Dark red coat, black trousers, skin face, gold crown
    TextureFactory._makeSpritesheet(scene, 'boss', 48, 48, (g, ox, f) => {
      TextureFactory._drawPersonFrame(g, ox + 19, 24, f, {
        shirtColor: 0x922b21, pantsColor: 0x1a1a1a,
        skinColor: 0xf5cba7, outlineColor: 0x400e0e, s: 1.45,
        crown: true,
      });
    });
  }

  // ─── innocent ────────────────────────────────────────────────────────────
  static _innocent(scene) {
    // Bright yellow shirt, brown chinos, skin head
    TextureFactory._makeSpritesheet(scene, 'innocent', 28, 28, (g, ox, f) => {
      TextureFactory._drawPersonFrame(g, ox + 12, 14, f, {
        shirtColor: 0xd4ac0d, pantsColor: 0x7d6608,
        skinColor: 0xf5cba7, outlineColor: 0x5d4e08, s: 0.88,
      });
    });
  }

  // ─── walk animations ─────────────────────────────────────────────────────
  static _createAnimations(scene) {
    const specs = [
      { prefix: 'player',   textureKey: 'player',   frameRate: 8 },
      { prefix: 'soldier',  textureKey: 'soldier',  frameRate: 7 },
      { prefix: 'boss',     textureKey: 'boss',     frameRate: 5 },
      { prefix: 'innocent', textureKey: 'innocent', frameRate: 8 },
    ];
    for (const { prefix, textureKey, frameRate } of specs) {
      const walkKey = prefix + '_walk';
      if (!scene.anims.exists(walkKey)) {
        scene.anims.create({
          key: walkKey,
          frames: [
            { key: textureKey, frame: 0 },
            { key: textureKey, frame: 1 },
            { key: textureKey, frame: 2 },
            { key: textureKey, frame: 3 },
          ],
          frameRate,
          repeat: -1,
        });
      }
    }
  }

  // ─── projectiles ─────────────────────────────────────────────────────────
  static _projectiles(scene) {
    // bullet_1 – handgun
    TextureFactory._bake(scene, 'bullet_1', 8, 4, g => {
      g.fillStyle(0xf4d03f);
      g.fillRect(0, 0, 8, 4);
    });

    // bullet_2 – shotgun pellet (round, smaller)
    TextureFactory._bake(scene, 'bullet_2', 6, 6, g => {
      g.fillStyle(0xe67e22);
      g.fillCircle(3, 3, 3);
    });

    // bullet_3 – machine gun (thin)
    TextureFactory._bake(scene, 'bullet_3', 10, 3, g => {
      g.fillStyle(0xf5f5f5);
      g.fillRect(0, 0, 10, 3);
    });

    // bullet_4 – rocket (larger)
    TextureFactory._bake(scene, 'bullet_4', 16, 8, g => {
      g.fillStyle(0xe74c3c);
      g.fillRect(0, 2, 12, 4);
      g.fillStyle(0xf39c12);
      g.fillTriangle(12, 0, 16, 4, 12, 8);
    });

    // enemy bullet (red)
    TextureFactory._bake(scene, 'bullet_enemy', 8, 4, g => {
      g.fillStyle(0xff4444);
      g.fillRect(0, 0, 8, 4);
    });
  }

  // ─── pickups ─────────────────────────────────────────────────────────────
  static _pickups(scene) {
    const box = (scene, key, color, fn) => {
      TextureFactory._bake(scene, key, 24, 24, g => {
        g.fillStyle(color, 0.9);
        g.fillRect(2, 2, 20, 20);
        g.lineStyle(2, 0xffffff, 0.8);
        g.strokeRect(2, 2, 20, 20);
        if (fn) fn(g);
      });
    };

    box(scene, 'pickup_ammo',   0x2c3e50, g => {
      g.fillStyle(0xf4d03f); g.fillRect(9, 6, 3, 12); g.fillRect(7, 9, 7, 2);
    });
    box(scene, 'pickup_health', 0x27ae60, g => {
      g.fillStyle(0xffffff); g.fillRect(10, 6, 4, 12); g.fillRect(6, 10, 12, 4);
    });
    box(scene, 'pickup_armor',  0x2980b9, g => {
      g.fillStyle(0xecf0f1);
      g.fillTriangle(12, 5, 5, 10, 5, 18);
      g.fillTriangle(12, 5, 19, 10, 19, 18);
      g.fillRect(5, 18, 14, 2);
    });
    box(scene, 'pickup_life',   0xe74c3c, g => {
      g.fillStyle(0xffffff);
      g.fillCircle(9, 10, 4); g.fillCircle(15, 10, 4);
      g.fillTriangle(5, 12, 19, 12, 12, 19);
    });
    box(scene, 'pickup_weapon', 0x8e44ad, g => {
      g.fillStyle(0xffffff);
      g.fillRect(6, 10, 12, 4); g.fillRect(16, 8, 3, 8);
    });
  }

  // ─── weapon icons for HUD ────────────────────────────────────────────────
  static _weaponIcons(scene) {
    const icons = {
      weapon_icon_0: (g) => { // hammer
        g.fillStyle(0x888888); g.fillRect(10, 4, 4, 16);
        g.fillStyle(0xaaaaaa); g.fillRect(4, 4, 16, 6);
      },
      weapon_icon_1: (g) => { // handgun
        g.fillStyle(0x777777); g.fillRect(4, 10, 14, 6);
        g.fillRect(14, 6, 6, 4); g.fillRect(10, 16, 4, 6);
      },
      weapon_icon_2: (g) => { // shotgun
        g.fillStyle(0x665544); g.fillRect(2, 11, 20, 4);
        g.fillRect(18, 9, 4, 8);
        g.fillStyle(0x887766); g.fillRect(4, 13, 6, 4);
      },
      weapon_icon_3: (g) => { // machine gun
        g.fillStyle(0x556677); g.fillRect(2, 10, 22, 6);
        g.fillRect(20, 8, 4, 4);
        g.fillRect(8, 16, 4, 6); g.fillRect(14, 16, 4, 4);
      },
      weapon_icon_4: (g) => { // rocket launcher
        g.fillStyle(0x446655); g.fillRect(2, 9, 18, 8);
        g.fillStyle(0xe74c3c); g.fillTriangle(20, 9, 26, 13, 20, 17);
        g.fillStyle(0x778866); g.fillRect(8, 17, 4, 5);
      },
    };
    for (const [key, fn] of Object.entries(icons)) {
      TextureFactory._bake(scene, key, 28, 28, g => {
        fn(g);
      });
    }
  }

  // ─── elevator sprite (in-world) ──────────────────────────────────────────
  static _elevator(scene) {
    TextureFactory._bake(scene, 'elevator', 48, 64, g => {
      g.fillStyle(0x1c2833);
      g.fillRect(0, 0, 48, 64);
      // door frame
      g.lineStyle(3, 0x5d6d7e, 1);
      g.strokeRect(4, 4, 40, 56);
      // door panels
      g.fillStyle(0x2e4057);
      g.fillRect(6, 6, 17, 52);
      g.fillRect(25, 6, 17, 52);
      g.lineStyle(1, 0x85c1e9, 0.6);
      g.strokeRect(6, 6, 17, 52);
      g.strokeRect(25, 6, 17, 52);
      // button
      g.fillStyle(0xf1c40f);
      g.fillCircle(42, 10, 4);
    });
  }

  // ─── muzzle flash ────────────────────────────────────────────────────────
  static _muzzleFlash(scene) {
    TextureFactory._bake(scene, 'muzzle_flash', 16, 16, g => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(8, 8, 4);
      g.fillStyle(0xf4d03f, 0.7);
      g.fillCircle(8, 8, 8);
    });
  }

  // ─── explosion ───────────────────────────────────────────────────────────
  static _explosion(scene) {
    for (let i = 0; i < 5; i++) {
      const r = 8 + i * 8;
      TextureFactory._bake(scene, `explosion_${i}`, r * 2, r * 2, g => {
        g.fillStyle(0xe74c3c, 1 - i * 0.15);
        g.fillCircle(r, r, r);
        g.fillStyle(0xf39c12, 0.8);
        g.fillCircle(r, r, r * 0.6);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(r, r, r * 0.3);
      });
    }
  }
}
