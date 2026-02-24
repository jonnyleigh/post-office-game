import * as Phaser from 'phaser';

const TILE_NAMES = { 0: 'Floor', 1: 'Wall', 2: 'Desk' };
const TOOL_TILE  = 'tile';
const TOOL_ENTITY = 'entity';

// Entity placement types
const ENTITY_TYPES = [
  { id: 'playerStart', label: 'Player Start', color: 0x3498db },
  { id: 'elevator',    label: 'Elevator',     color: 0x2980b9 },
  { id: 'boss',        label: 'Boss',         color: 0xe74c3c },
  { id: 'soldier',     label: 'Soldier',      color: 0x27ae60 },
  { id: 'innocent',    label: 'Innocent',     color: 0xf39c12 },
  { id: 'pickup_health',  label: 'Health',    color: 0x2ecc71 },
  { id: 'pickup_armor',   label: 'Armor',     color: 0x2980b9 },
  { id: 'pickup_ammo',    label: 'Ammo',      color: 0x7f8c8d },
  { id: 'pickup_life',    label: 'Life',      color: 0xe74c3c },
  { id: 'pickup_weapon1', label: 'Handgun',   color: 0x8e44ad },
  { id: 'pickup_weapon2', label: 'Shotgun',   color: 0x8e44ad },
  { id: 'pickup_weapon3', label: 'Machine Gun', color: 0x8e44ad },
  { id: 'pickup_weapon4', label: 'Rocket',    color: 0x8e44ad },
];

export class LevelBuilderScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelBuilderScene' }); }

  create() {
    this._cols = 20;
    this._rows = 15;
    this._tileSize = 40;
    this._tiles = this._emptyGrid();
    this._entities = {
      playerStart: null, elevator: null, boss: null,
      soldiers: [], innocents: [], pickups: [],
    };

    this._currentTool = TOOL_TILE;
    this._currentTileVal = 1;
    this._currentEntity  = ENTITY_TYPES[0];
    this._levelId = 1;
    this._levelName = 'New Floor';

    this._gridOffX = 220;
    this._gridOffY = 40;

    this._overlayGraphics = this.add.graphics().setDepth(20);
    this._entityGraphics  = this.add.graphics().setDepth(15);

    this._buildUI();
    this._redrawGrid();
    this._redrawEntities();

    this.input.on('pointerdown',  this._onPointerDown, this);
    this.input.on('pointermove',  this._onPointerMove, this);
    this.input.keyboard.on('keydown-G', () => this._randomGenerate());
    this.input.keyboard.on('keydown-S', () => this._saveLevel());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

    // File input for loading
    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { try { this._loadFromJSON(JSON.parse(ev.target.result)); } catch(err) { console.error(err); } };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // ─── Grid helpers ──────────────────────────────────────────────────────────

  _emptyGrid() {
    const grid = [];
    for (let r = 0; r < this._rows; r++) {
      const row = [];
      for (let c = 0; c < this._cols; c++) {
        row.push((r === 0 || r === this._rows - 1 || c === 0 || c === this._cols - 1) ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  _redrawGrid() {
    const g = this._overlayGraphics;
    g.clear();
    const T = this._tileSize;
    const ox = this._gridOffX;
    const oy = this._gridOffY;

    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const val = this._tiles[r][c];
        const colors = { 0: 0x2d2d4e, 1: 0x5a5a7a, 2: 0x6b4226 };
        g.fillStyle(colors[val] || 0x222222, 1);
        g.fillRect(ox + c * T, oy + r * T, T - 1, T - 1);
      }
    }

    // Grid lines
    g.lineStyle(1, 0x444444, 0.5);
    for (let r = 0; r <= this._rows; r++)
      g.lineBetween(ox, oy + r * T, ox + this._cols * T, oy + r * T);
    for (let c = 0; c <= this._cols; c++)
      g.lineBetween(ox + c * T, oy, ox + c * T, oy + this._rows * T);
  }

  _redrawEntities() {
    const g = this._entityGraphics;
    g.clear();
    const T = this._tileSize;
    const ox = this._gridOffX;
    const oy = this._gridOffY;

    const draw = (col, row, color, label) => {
      if (col == null || row == null) return;
      const px = ox + col * T + T / 2;
      const py = oy + row * T + T / 2;
      g.fillStyle(color, 0.85);
      g.fillCircle(px, py, T * 0.35);
      g.lineStyle(1, 0xffffff, 0.6);
      g.strokeCircle(px, py, T * 0.35);
    };

    const e = this._entities;
    if (e.playerStart) draw(e.playerStart.col, e.playerStart.row, 0x3498db, 'P');
    if (e.elevator)    draw(e.elevator.col,    e.elevator.row,    0x2980b9, 'EL');
    if (e.boss)        draw(e.boss.col,        e.boss.row,        0xe74c3c, 'B');
    e.soldiers.forEach(s  => draw(s.col, s.row, 0x27ae60, 'S'));
    e.innocents.forEach(n => draw(n.col, n.row, 0xf39c12, 'I'));
    e.pickups.forEach(p   => draw(p.col, p.row, 0xf1c40f, 'PU'));
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  _cellAt(pointer) {
    const T  = this._tileSize;
    const ox = this._gridOffX;
    const oy = this._gridOffY;
    const col = Math.floor((pointer.x - ox) / T);
    const row = Math.floor((pointer.y - oy) / T);
    if (col < 0 || col >= this._cols || row < 0 || row >= this._rows) return null;
    return { col, row };
  }

  _onPointerDown(pointer) {
    const cell = this._cellAt(pointer);
    if (!cell) return;

    if (pointer.rightButtonDown()) {
      // Erase
      this._tiles[cell.row][cell.col] = 0;
      this._removeEntityAt(cell.col, cell.row);
      this._redrawGrid();
      this._redrawEntities();
      return;
    }

    if (this._currentTool === TOOL_TILE) {
      this._tiles[cell.row][cell.col] = this._currentTileVal;
      this._redrawGrid();
    } else {
      this._placeEntity(cell.col, cell.row, this._currentEntity.id);
      this._redrawEntities();
    }
  }

  _onPointerMove(pointer) {
    if (!pointer.isDown || pointer.rightButtonDown()) return;
    if (this._currentTool !== TOOL_TILE) return;
    const cell = this._cellAt(pointer);
    if (!cell) return;
    this._tiles[cell.row][cell.col] = this._currentTileVal;
    this._redrawGrid();
  }

  _placeEntity(col, row, type) {
    const e = this._entities;
    if (type === 'playerStart') { e.playerStart = { col, row }; return; }
    if (type === 'elevator')    { e.elevator    = { col, row }; return; }
    if (type === 'boss')        { e.boss        = { col, row }; return; }
    if (type === 'soldier')     { e.soldiers.push({ col, row }); return; }
    if (type === 'innocent')    { e.innocents.push({ col, row }); return; }
    if (type.startsWith('pickup_')) {
      const sub = type.replace('pickup_', '');
      if (sub.startsWith('weapon')) {
        const weapType = parseInt(sub.replace('weapon', ''));
        e.pickups.push({ type: 'weapon', weaponType: weapType, col, row });
      } else {
        e.pickups.push({ type: sub, col, row });
      }
    }
  }

  _removeEntityAt(col, row) {
    const e = this._entities;
    if (e.playerStart?.col === col && e.playerStart?.row === row) e.playerStart = null;
    if (e.elevator?.col    === col && e.elevator?.row    === row) e.elevator    = null;
    if (e.boss?.col        === col && e.boss?.row        === row) e.boss        = null;
    e.soldiers  = e.soldiers.filter(s => !(s.col === col && s.row === row));
    e.innocents = e.innocents.filter(n => !(n.col === col && n.row === row));
    e.pickups   = e.pickups.filter(p   => !(p.col === col && p.row === row));
  }

  // ─── Random generator ─────────────────────────────────────────────────────

  _randomGenerate() {
    // Reset
    this._tiles = this._emptyGrid();
    this._entities = { playerStart: null, elevator: null, boss: null, soldiers: [], innocents: [], pickups: [] };

    const rows = this._rows;
    const cols = this._cols;

    // Place a few random wall clusters and desks
    for (let i = 0; i < 8; i++) {
      const r = Phaser.Math.Between(2, rows - 3);
      const c = Phaser.Math.Between(2, cols - 3);
      const len = Phaser.Math.Between(2, 5);
      const horiz = Math.random() > 0.5;
      for (let j = 0; j < len; j++) {
        const tr = horiz ? r : r + j;
        const tc = horiz ? c + j : c;
        if (tr > 0 && tr < rows - 1 && tc > 0 && tc < cols - 1)
          this._tiles[tr][tc] = 1;
      }
    }
    for (let i = 0; i < 6; i++) {
      const r = Phaser.Math.Between(2, rows - 3);
      const c = Phaser.Math.Between(2, cols - 3);
      this._tiles[r][c] = 2;
    }

    // Entities
    this._entities.playerStart = { col: 2,        row: 2 };
    this._entities.elevator    = { col: cols - 3,  row: Math.floor(rows / 2) };
    this._entities.boss        = { col: cols - 4,  row: Math.floor(rows / 2) };
    // Ensure those cells are floor
    this._clearCell(2, 2);
    this._clearCell(cols - 3, Math.floor(rows / 2));
    this._clearCell(cols - 4, Math.floor(rows / 2));

    // Soldiers
    const solCount = Phaser.Math.Between(2, 4);
    for (let i = 0; i < solCount; i++) {
      const { col, row } = this._randomFloorCell();
      this._entities.soldiers.push({ col, row });
    }

    // Innocents
    const innCount = Phaser.Math.Between(1, 3);
    for (let i = 0; i < innCount; i++) {
      const { col, row } = this._randomFloorCell();
      this._entities.innocents.push({ col, row });
    }

    // Pickups
    ['health', 'ammo', 'armor'].forEach(type => {
      const { col, row } = this._randomFloorCell();
      this._entities.pickups.push({ type, col, row });
    });

    this._redrawGrid();
    this._redrawEntities();
  }

  _clearCell(col, row) {
    if (row >= 0 && row < this._rows && col >= 0 && col < this._cols)
      this._tiles[row][col] = 0;
  }

  _randomFloorCell() {
    let col, row;
    let attempts = 0;
    do {
      col = Phaser.Math.Between(1, this._cols - 2);
      row = Phaser.Math.Between(1, this._rows - 2);
      attempts++;
    } while (this._tiles[row][col] !== 0 && attempts < 100);
    return { col, row };
  }

  // ─── Save / Load ───────────────────────────────────────────────────────────

  _saveLevel() {
    const e = this._entities;
    const data = {
      id:          this._levelId,
      name:        this._levelName,
      tileSize:    64,
      cols:        this._cols,
      rows:        this._rows,
      tiles:       this._tiles,
      playerStart: e.playerStart || { col: 1, row: 1 },
      elevator:    e.elevator    || { col: this._cols - 2, row: 1 },
      boss:        e.boss        || { col: this._cols - 3, row: 1 },
      soldiers:    e.soldiers,
      innocents:   e.innocents,
      pickups:     e.pickups,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `level${this._levelId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _loadFromJSON(data) {
    this._cols      = data.cols;
    this._rows      = data.rows;
    this._tiles     = data.tiles;
    this._levelId   = data.id;
    this._levelName = data.name;
    this._entities  = {
      playerStart: data.playerStart,
      elevator:    data.elevator,
      boss:        data.boss,
      soldiers:    data.soldiers  || [],
      innocents:   data.innocents || [],
      pickups:     data.pickups   || [],
    };
    this._redrawGrid();
    this._redrawEntities();
  }

  // ─── UI sidebar ────────────────────────────────────────────────────────────

  _buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Sidebar background
    const sb = this.add.graphics();
    sb.fillStyle(0x111122, 1);
    sb.fillRect(0, 0, 210, H);
    sb.lineStyle(1, 0x333355, 1);
    sb.lineBetween(210, 0, 210, H);

    this.add.text(8, 8, 'LEVEL BUILDER', { fontSize: '13px', fontFamily: 'monospace', color: '#85c1e9' });
    this.add.text(8, 24, 'ESC=Menu  G=Random  S=Save', { fontSize: '10px', fontFamily: 'monospace', color: '#555' });

    let y = 50;
    this.add.text(8, y, '— TILES —', { fontSize: '11px', fontFamily: 'monospace', color: '#888' });
    y += 16;
    [0, 1, 2].forEach(val => {
      const btn = this.add.text(12, y, `[${val}] ${TILE_NAMES[val]}`, {
        fontSize: '13px', fontFamily: 'monospace',
        color: this._currentTool === TOOL_TILE && this._currentTileVal === val ? '#f4d03f' : '#bbbbbb',
        backgroundColor: '#1a1a33', padding: { x: 4, y: 2 },
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this._currentTool    = TOOL_TILE;
        this._currentTileVal = val;
        this._rebuildUI();
      });
      y += 22;
    });

    y += 6;
    this.add.text(8, y, '— ENTITIES —', { fontSize: '11px', fontFamily: 'monospace', color: '#888' });
    y += 16;
    ENTITY_TYPES.forEach(et => {
      const btn = this.add.text(12, y, et.label, {
        fontSize: '12px', fontFamily: 'monospace',
        color: this._currentTool === TOOL_ENTITY && this._currentEntity.id === et.id ? '#f4d03f' : '#bbbbbb',
        backgroundColor: '#1a1a33', padding: { x: 4, y: 2 },
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this._currentTool   = TOOL_ENTITY;
        this._currentEntity = et;
        this._rebuildUI();
      });
      y += 20;
    });

    y += 8;
    const loadBtn = this.add.text(12, y, '[ Load JSON ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#f4d03f',
      backgroundColor: '#222244', padding: { x: 6, y: 3 },
    }).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerdown', () => document.getElementById('file-input').click());

    // Instructions overlay
    this.add.text(W - 4, H - 4, 'Left click=paint  Right click=erase', {
      fontSize: '11px', fontFamily: 'monospace', color: '#555',
    }).setOrigin(1, 1);
  }

  _rebuildUI() {
    // Simplest approach: restart the scene UI by reinitialising
    // Since this is dev tooling, we just restart the scene keeping data
    const snapshot = {
      cols: this._cols, rows: this._rows, tiles: this._tiles,
      id: this._levelId, name: this._levelName,
      playerStart: this._entities.playerStart,
      elevator:    this._entities.elevator,
      boss:        this._entities.boss,
      soldiers:    this._entities.soldiers,
      innocents:   this._entities.innocents,
      pickups:     this._entities.pickups,
    };
    this._loadFromJSON(snapshot);
  }
}
