import * as Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// Event name constants
export const EVT = {
  PLAYER_STATS_CHANGED:  'player-stats-changed',
  AMMO_CHANGED:          'ammo-changed',
  WEAPON_SWITCHED:       'weapon-switched',
  PICKUP_MESSAGE:        'pickup-message',
  ENEMY_KILLED:          'enemy-killed',
  BOSS_KILLED:           'boss-killed',
  PLAYER_DIED:           'player-died',
  GAME_OVER:             'game-over',
  LEVEL_COMPLETE:        'level-complete',
  ELEVATOR_UNLOCKED:     'elevator-unlocked',
};
