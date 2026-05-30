/**
 * FlatGrid.js - 2D 正交网格坐标转换
 * 格子 (gx, gy) 对应世界坐标 (gx * TILE_SIZE, gy * TILE_SIZE)
 */

import { CONFIG } from '../config/index.js';

const TILE = CONFIG.tile.w; // 格子像素大小（正方形）

/**
 * 网格坐标 → 世界像素坐标（格子左上角）
 */
export function cellToScreen(gx, gy) {
    return {
        x: gx * TILE,
        y: gy * TILE,
    };
}

/**
 * 世界像素坐标 → 网格坐标（浮点）
 */
export function screenToCell(wx, wy) {
    return {
        gx: wx / TILE,
        gy: wy / TILE,
    };
}

/**
 * 判断网格坐标是否在边界内
 */
export function inBounds(gx, gy, w = CONFIG.grid.width, h = CONFIG.grid.height) {
    return gx >= 0 && gy >= 0 && gx < w && gy < h;
}

/**
 * 绘制网格线（在世界坐标系中调用，已应用相机变换）
 */
export function drawGrid(ctx) {
    const W = CONFIG.grid.width;
    const H = CONFIG.grid.height;
    const T = TILE;

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.25)';
    ctx.lineWidth = 1;

    // 竖线
    for (let gx = 0; gx <= W; gx++) {
        ctx.beginPath();
        ctx.moveTo(gx * T, 0);
        ctx.lineTo(gx * T, H * T);
        ctx.stroke();
    }
    // 横线
    for (let gy = 0; gy <= H; gy++) {
        ctx.beginPath();
        ctx.moveTo(0, gy * T);
        ctx.lineTo(W * T, gy * T);
        ctx.stroke();
    }
}
