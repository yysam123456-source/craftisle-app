/**
 * Camera.js
 *
 * A simple 2D camera with pan & zoom.
 * Maps world coordinates ↔ screen coordinates via offset + zoom.
 */

import { CONFIG } from '../config/index.js';

export class Camera {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = CONFIG.camera.defaultZoom;
        // View size (set by renderer on resize)
        this.viewW = 800;
        this.viewH = 600;
        this._onChange = null;
    }

    onChange(cb) { this._onChange = cb; }
    _notify() { if (this._onChange) this._onChange(); }

    /** Update view size (called on canvas resize). */
    setViewSize(w, h) {
        if (w !== this.viewW || h !== this.viewH) {
            this.viewW = w;
            this.viewH = h;
            this._notify();
        }
    }

    /** World point → screen pixel. */
    worldToScreen(wx, wy) {
        return {
            x: wx * this.zoom + this.offsetX,
            y: wy * this.zoom + this.offsetY,
        };
    }

    /** Screen pixel → world point. */
    screenToWorld(sx, sy) {
        return {
            x: (sx - this.offsetX) / this.zoom,
            y: (sy - this.offsetY) / this.zoom,
        };
    }

    /** Helper: screen X → world X. */
    screenToWorldX(sx) {
        return (sx - this.offsetX) / this.zoom;
    }

    /** Helper: screen Y → world Y. */
    screenToWorldY(sy) {
        return (sy - this.offsetY) / this.zoom;
    }

    /** Helper: world X → screen X. */
    worldToScreenX(wx) {
        return wx * this.zoom + this.offsetX;
    }

    /** Helper: world Y → screen Y. */
    worldToScreenY(wy) {
        return wy * this.zoom + this.offsetY;
    }

    pan(dx, dy) {
        if (dx === 0 && dy === 0) return;
        this.offsetX += dx;
        this.offsetY += dy;
        this._notify();
    }

    zoomAt(screenX, screenY, factor) {
        const next = Math.max(CONFIG.camera.minZoom,
                         Math.min(CONFIG.camera.maxZoom, this.zoom * factor));
        if (next === this.zoom) return;
        const before = this.screenToWorld(screenX, screenY);
        this.zoom = next;
        const after = this.screenToWorld(screenX, screenY);
        this.offsetX += (after.x - before.x) * this.zoom;
        this.offsetY += (after.y - before.y) * this.zoom;
        this._notify();
    }

    /** Center camera on a world point. */
    centerOn(wx, wy) {
        this.offsetX = this.viewW / 2 - wx * this.zoom;
        this.offsetY = this.viewH / 2 - wy * this.zoom;
        this._notify();
    }
}
