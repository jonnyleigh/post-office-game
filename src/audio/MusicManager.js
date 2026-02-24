/**
 * MusicManager – global singleton that cycles through MP3 tracks.
 *
 * Add MP3 files to /assets/music/ and list their keys below.
 * BootScene will preload whichever keys are listed here.
 */

/** Edit this list to match the files you put in /assets/music/ */
export const MUSIC_TRACKS = [
  { key: 'music_01', file: 'assets/music/track_01.mp3' },
  { key: 'music_02', file: 'assets/music/track_02.mp3' },
  { key: 'music_03', file: 'assets/music/track_03.mp3' },
  { key: 'music_04', file: 'assets/music/track_04.mp3' },
];

const STORAGE_KEY = 'postoffice_music_enabled';

export class MusicManager {
  static _enabled  = localStorage.getItem(STORAGE_KEY) !== 'false'; // on by default
  static _index    = 0;
  static _current  = null;  // Phaser Sound object
  static _soundMgr = null;  // game.sound reference

  /** Call once from BootScene.create() after textures are generated. */
  static init(scene) {
    MusicManager._soundMgr = scene.game.sound;
    if (MusicManager._enabled) MusicManager._playNext();
  }

  static isEnabled() { return MusicManager._enabled; }

  /** Toggle music on/off. Returns new state (boolean). */
  static toggle() {
    MusicManager._enabled = !MusicManager._enabled;
    localStorage.setItem(STORAGE_KEY, MusicManager._enabled);
    if (MusicManager._enabled) {
      MusicManager._playNext();
    } else {
      MusicManager._stop();
    }
    return MusicManager._enabled;
  }

  static _availableTracks() {
    if (!MusicManager._soundMgr) return [];
    return MUSIC_TRACKS.filter(t =>
      MusicManager._soundMgr.game.cache.audio.has(t.key),
    );
  }

  static _playNext() {
    const tracks = MusicManager._availableTracks();
    if (tracks.length === 0) return;

    MusicManager._stop();

    const track = tracks[MusicManager._index % tracks.length];
    MusicManager._index = (MusicManager._index + 1) % tracks.length;

    MusicManager._current = MusicManager._soundMgr.add(track.key, { volume: 0.55 });
    MusicManager._current.once('complete', () => {
      MusicManager._current = null;
      if (MusicManager._enabled) MusicManager._playNext();
    });
    MusicManager._current.play();
  }

  static _stop() {
    if (MusicManager._current) {
      try { MusicManager._current.stop(); } catch (_) {}
      try { MusicManager._current.destroy(); } catch (_) {}
      MusicManager._current = null;
    }
  }
}
