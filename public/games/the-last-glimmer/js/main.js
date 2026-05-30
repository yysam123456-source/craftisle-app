/**
 * main.js
 *
 * "最后的微光"Canvas 版本入口
 */

import { GlimmerGame } from './game/GlimmerGame.js';

function initGame() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas #game-canvas not found!');
        return;
    }

    // 强制设置 canvas 尺寸（防止 CSS 未加载时 clientWidth=0）
    const W = 1280;
    const H = 720;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);

    // 创建游戏实例
    const game = new GlimmerGame(canvas);

    // 暴露到全局（用于调试）
    window.game = game;

    console.log('"最后的微光"Canvas 版本已启动！', {
        canvas: `${canvas.width}x${canvas.height}`,
        crewCount: game.state.crew.length,
    });
}

// 等待 DOM 加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
