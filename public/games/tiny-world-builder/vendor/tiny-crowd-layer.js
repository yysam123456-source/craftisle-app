/**
 * TinyCrowdLayer — simplified procedural crowd using Three.js primitives.
 * No external models required; each character is built from basic geometry.
 */
window.TinyCrowdLayer = class TinyCrowdLayer {
  constructor(options) {
    this.THREE = options.THREE;
    this.root = options.root;
    this.camera = options.camera;
    this.tileToWorld = options.tileToWorld;
    this.getTerrainHeight = options.getTerrainHeight;
    this._scale = options.scale || 1;
    this.config = options.config || {};
    this.worldConfig = options.worldConfig || {};

    this.people = new Map();
    this._loaded = false;
    this._geomCache = new Map();
  }

  get loaded() { return this._loaded; }

  get scale() { return this._scale; }
  set scale(v) {
    this._scale = v;
    this.people.forEach(p => {
      if (p.mesh) p.mesh.scale.setScalar(v * p.defScale);
    });
  }

  configure(config, worldConfig) {
    this.config = config || this.config;
    this.worldConfig = worldConfig || this.worldConfig;
  }

  async load() {
    const THREE = this.THREE;

    // Shared geometry
    this._bodyGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.30, 8);
    this._headGeo = new THREE.SphereGeometry(0.09, 8, 8);
    this._hatGeo  = new THREE.CylinderGeometry(0.10, 0.10, 0.04, 8);
    this._skirtGeo = new THREE.ConeGeometry(0.14, 0.22, 8);

    // Skin material (shared)
    this._skinMat = new THREE.MeshLambertMaterial({ color: 0xffd6a5 });

    // Character palettes
    this._palettes = {
      'townie':       { body: 0x3b82f6, hat: false, skirt: false }, // blue
      'little-girl':  { body: 0xf472b6, hat: false, skirt: true  }, // pink
      'dad':          { body: 0x8b5a2b, hat: false, skirt: false }, // brown
      'grandfather':  { body: 0x6b7280, hat: true,  skirt: false }, // grey + hat
      'grandmother':  { body: 0xa78bfa, hat: true,  skirt: true  }, // purple + hat
    };

    this._loaded = true;
    return Promise.resolve();
  }

  clear() {
    this.people.forEach(p => {
      if (p.mesh) {
        p.mesh.traverse(c => {
          if (c.geometry && c.geometry.dispose) c.geometry.dispose();
          if (c.material && c.material.dispose) c.material.dispose();
        });
        this.root.remove(p.mesh);
      }
    });
    this.people.clear();
  }

  addPerson(opts) {
    if (!this._loaded) return;
    const THREE = this.THREE;
    const palette = this._palettes[opts.character] || this._palettes['townie'];

    const group = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshLambertMaterial({ color: palette.body });
    const body = new THREE.Mesh(this._bodyGeo, bodyMat);
    body.position.y = 0.15;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(this._headGeo, this._skinMat);
    head.position.y = 0.37;
    head.castShadow = true;
    group.add(head);

    // Hat (grandparents)
    if (palette.hat) {
      const hatMat = new THREE.MeshLambertMaterial({ color: 0xe5e7eb });
      const hat = new THREE.Mesh(this._hatGeo, hatMat);
      hat.position.y = 0.47;
      group.add(hat);
    }

    // Skirt (females)
    if (palette.skirt) {
      const skirtMat = new THREE.MeshLambertMaterial({ color: palette.body });
      const skirt = new THREE.Mesh(this._skirtGeo, skirtMat);
      skirt.position.y = 0.06;
      group.add(skirt);
    }

    // Position
    const y = this.getTerrainHeight ? this.getTerrainHeight(opts.x, opts.z) : 0;
    group.position.set(opts.x, y, opts.z);
    group.rotation.y = opts.heading || 0;

    const s = this._scale * (opts.scale || 1);
    group.scale.setScalar(s);

    this.root.add(group);

    // Route state
    let routeIndex = 0;
    let routeDir = 1;
    let routeT = 0;

    this.people.set(opts.id, {
      mesh: group,
      defScale: opts.scale || 1,
      x: opts.x,
      z: opts.z,
      heading: opts.heading || 0,
      speed: opts.speed || 0,
      route: opts.route || null,
      routeIndex,
      routeDir,
      routeT,
      character: opts.character,
      animOffset: Math.random() * 100,
    });
  }

  update(dt, camera) {
    if (!this._loaded) return;
    const time = performance.now() * 0.001;

    this.people.forEach(p => {
      if (!p.mesh) return;

      // Route movement
      if (p.route && p.route.length > 1 && p.speed > 0) {
        const a = p.route[p.routeIndex];
        const b = p.route[(p.routeIndex + 1) % p.route.length];
        if (a && b) {
          p.routeT += (p.speed / (Math.hypot(b.x - a.x, b.z - a.z) + 0.01)) * dt;
          if (p.routeT >= 1) {
            p.routeT = 0;
            p.routeIndex++;
            if (p.routeIndex >= p.route.length - 1) p.routeIndex = 0;
          }
          const nx = a.x + (b.x - a.x) * p.routeT;
          const nz = a.z + (b.z - a.z) * p.routeT;
          const ny = this.getTerrainHeight ? this.getTerrainHeight(nx, nz) : 0;
          p.mesh.position.set(nx, ny, nz);
          p.mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        }
      }

      // Bobbing animation (idle walk)
      const bob = Math.sin((time + p.animOffset) * 8) * 0.015;
      p.mesh.position.y += bob;

      // Face camera (billboard-ish on Y only) — optional, disabled for now
      // p.mesh.rotation.y = camera.rotation.y;
    });
  }
};
