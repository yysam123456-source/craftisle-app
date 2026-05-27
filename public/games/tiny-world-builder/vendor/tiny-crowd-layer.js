/**
 * TinyCrowdLayer stub — minimal implementation so the game runs
 * without the full crowd system. People/crowd features are disabled.
 */
window.TinyCrowdLayer = class TinyCrowdLayer {
  constructor(options) {
    this.options = options || {};
    this.people = new Map();
    this.loaded = true;
    this.scale = 1;
  }
  configure(a, b) { /* no-op */ }
  async load() { return Promise.resolve(); }
  clear() { this.people.clear(); }
  addPerson(opts) { this.people.set(Math.random().toString(36).slice(2), opts); }
  update(dt, camera) { /* no-op */ }
};
