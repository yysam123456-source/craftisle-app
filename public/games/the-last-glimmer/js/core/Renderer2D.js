/**
 * Renderer2D.js
 *
 * 简化的 2D 正交网格渲染器 - 专为"最后的微光"设计
 * 分层架构：背景层 / 世界层（网格+对象）/ UI层
 * 脏标记模式：只有状态变化时才重绘
 */

import { CONFIG } from "../config/index.js";
import { cellToScreen } from './FlatGrid.js';

export class Renderer2D {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;

        // 渲染层缓存
        this._bgCanvas = null;

        // 脏标记
        this._dirty = true;
        this._bgDirty = true;

        // 游戏状态引用（由 Game 设置）
        this.gameState = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.camera.setViewSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this._bgDirty = true;
        this._dirty = true;
    }

    markDirty() {
        this._dirty = true;
    }

    /** 主渲染循环 */
    render() {
        if (!this._dirty && !this._hasAnimations()) {
            return;
        }

        const ctx = this.ctx;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);

        // 1. 背景层（离屏缓存）
        if (this._bgDirty) {
            this._buildBackgroundCache(w, h);
            this._bgDirty = false;
        }
        if (this._bgCanvas) {
            ctx.drawImage(this._bgCanvas, 0, 0);
        }

        // 2. 应用相机变换
        // worldToScreen(wx, wy) = wx*zoom + offsetX
        // 所以渲染时：先 translate(offsetX, offsetY)，再 scale(zoom)
        ctx.save();
        ctx.translate(this.camera.offsetX, this.camera.offsetY);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        // 3. 绘制网格 + 游戏对象
        this._drawGrid(ctx);
        if (this.gameState) {
            this._drawHighlights(ctx);
            this._drawCrew(ctx);
        }

        ctx.restore();

        this._dirty = false;
    }

    /** 绘制正交网格 */
    _drawGrid(ctx) {
        const W = CONFIG.grid.width;
        const H = CONFIG.grid.height;
        const T = CONFIG.tile.w;

        ctx.strokeStyle = 'rgba(100, 200, 255, 0.25)';
        ctx.lineWidth = 1;

        // 可见区域裁剪
        const camL = -this.camera.offsetX / this.camera.zoom;
        const camR = camL + this.canvas.clientWidth / this.camera.zoom;
        const camT = -this.camera.offsetY / this.camera.zoom;
        const camB = camT + this.canvas.clientHeight / this.camera.zoom;

        // 竖线
        const startGx = Math.max(0, Math.floor(camL / T));
        const endGx = Math.min(W, Math.ceil(camR / T));
        for (let gx = startGx; gx <= endGx; gx++) {
            ctx.beginPath();
            ctx.moveTo(gx * T, Math.max(0, camT));
            ctx.lineTo(gx * T, Math.min(H * T, camB));
            ctx.stroke();
        }

        // 横线
        const startGy = Math.max(0, Math.floor(camT / T));
        const endGy = Math.min(H, Math.ceil(camB / T));
        for (let gy = startGy; gy <= endGy; gy++) {
            ctx.beginPath();
            ctx.moveTo(Math.max(0, camL), gy * T);
            ctx.lineTo(Math.min(W * T, camR), gy * T);
            ctx.stroke();
        }
    }

    /** 绘制船员 */
    _drawCrew(ctx) {
        const T = CONFIG.tile.w;
        const R = CONFIG.crew.radius;

        (this.gameState.crew || []).forEach(crew => {
            const { x: sx, y: sy } = cellToScreen(crew.x, crew.y);
            const cx = sx + T / 2;
            const cy = sy + T / 2;

            // 阴影
            ctx.beginPath();
            ctx.arc(cx + 2, cy + 2, R, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();

            // 船员圆
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.crew.colors[crew.type] || '#fff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 首字母
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = { captain: 'C', firstMate: 'F', sailor: 'S', engineer: 'E', medic: 'M' }[crew.type] || '?';
            ctx.fillText(label, cx, cy);

            // HP 条
            if (crew.hp < crew.maxHp) {
                const barW = T * 0.8;
                const barH = 4;
                const barX = sx + (T - barW) / 2;
                const barY = sy + T - 6;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = crew.hp / crew.maxHp > 0.5 ? '#6bcb77' : '#ff6b6b';
                ctx.fillRect(barX, barY, barW * (crew.hp / crew.maxHp), barH);
            }
        });
    }

    /** 绘制高亮格子 */
    _drawHighlights(ctx) {
        const T = CONFIG.tile.w;
        (this.gameState.highlights || []).forEach(h => {
            const { x: sx, y: sy } = cellToScreen(h.gx, h.gy);
            ctx.fillStyle = h.color || 'rgba(100, 200, 255, 0.3)';
            ctx.fillRect(sx, sy, T, T);
            ctx.strokeStyle = h.borderColor || 'rgba(100, 200, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, T, T);
        });
    }

    /** 构建背景缓存 */
    _buildBackgroundCache(w, h) {
        this._bgCanvas = document.createElement('canvas');
        this._bgCanvas.width = w * (window.devicePixelRatio || 1);
        this._bgCanvas.height = h * (window.devicePixelRatio || 1);
        const ctx = this._bgCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        this._drawOceanBackground(ctx, w, h);
    }

    /** 绘制海洋背景 */
    _drawOceanBackground(ctx, w, h) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a1628');
        grad.addColorStop(0.5, '#0d2137');
        grad.addColorStop(1, '#134267');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 波浪粒子
        const time = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            const y = h * 0.3 + Math.sin(time * 2 + i * 0.5) * 50;
            const x1 = (i / 20) * w;
            const x2 = x1 + 100 + Math.sin(time + i) * 30;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.bezierCurveTo(
                x1 + 30, y + Math.sin(time + i) * 10,
                x2 - 30, y + Math.cos(time + i) * 10,
                x2, y
            );
            ctx.stroke();
        }
    }

    _hasAnimations() {
        return false;
    }
}
