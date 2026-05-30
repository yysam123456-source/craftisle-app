/**
 * InputManager2D.js
 *
 * 简化的 2D 网格输入管理器 - 专为"最后的微光"设计
 * 处理鼠标/触摸事件，转换为网格坐标点击
 */

export class InputManager2D {
    constructor(canvas, camera, game) {
        this.canvas = canvas;
        this.camera = camera;
        this.game = game;

        this._bind();
    }

    _bind() {
        const c = this.canvas;

        // 鼠标事件
        c.addEventListener('mousedown', e => this._onMouseDown(e));
        c.addEventListener('mousemove', e => this._onMouseMove(e));
        c.addEventListener('mouseup', e => this._onMouseUp(e));
        c.addEventListener('contextmenu', e => e.preventDefault());

        // 滚轮缩放
        c.addEventListener('wheel', e => this._onWheel(e), { passive: false });

        // 触摸事件
        c.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
        c.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
        c.addEventListener('touchend', e => this._onTouchEnd(e), { passive: false });
    }

    _getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        return this.game.getCellAt(sx, sy);
    }

    _onMouseDown(e) {
        const cell = this._getCell(e);
        if (e.button === 0) {
            this.game.onCellClick(cell.gx, cell.gy);
        }
    }

    _onMouseMove(e) {
        // TODO: 悬停高亮
    }

    _onMouseUp(e) {
        // 处理拖拽结束等
    }

    _onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = Math.exp(-e.deltaY * 0.0015);
        this.camera.zoomAt(sx, sy, factor);
        this.game.renderer.markDirty();
    }

    _onTouchStart(e) {
        e.preventDefault();
        // 简单实现：单指点击 = 左键点击
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const sx = touch.clientX - rect.left;
        const sy = touch.clientY - rect.top;

        // 模拟鼠标点击
        const cell = this.game.getCellAt(sx, sy);
        this.game.onCellClick(cell.gx, cell.gy);
    }

    _onTouchMove(e) {
        e.preventDefault();
        // TODO: 触摸拖拽平移相机
    }

    _onTouchEnd(e) {
        e.preventDefault();
    }
}
