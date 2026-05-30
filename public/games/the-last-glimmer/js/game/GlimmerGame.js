/**
 * GlimmerGame.js
 *
 * "最后的微光"主游戏类 - Canvas 版本
 * 管理游戏状态、渲染、输入处理
 */

import { CONFIG } from "../config/index.js";
import { Camera } from '../core/Camera.js';
import { Renderer2D } from '../core/Renderer2D.js';
import { InputManager2D } from '../core/InputManager2D.js';
import { cellToScreen } from '../core/FlatGrid.js';

export class GlimmerGame {
    constructor(canvas) {
        this.canvas = canvas;

        // 初始化引擎
        this.camera = new Camera();
        this.renderer = new Renderer2D(canvas, this.camera);
        this.input = new InputManager2D(canvas, this.camera, this);

        // 游戏状态
        this.state = {
            light: 10,
            structure: 10,
            storm: 0,
            turn: 1,
            score: 0,
            ship: { x: 3, y: 3 },
            crew: [
                { id: 'captain', type: 'captain', x: 3, y: 2, hp: 3, maxHp: 3 },
                { id: 'firstMate', type: 'firstMate', x: 2, y: 3, hp: 3, maxHp: 3 },
                { id: 'sailor', type: 'sailor', x: 4, y: 3, hp: 2, maxHp: 2 },
                { id: 'engineer', type: 'engineer', x: 3, y: 4, hp: 2, maxHp: 2 },
                { id: 'medic', type: 'medic', x: 3, y: 3, hp: 2, maxHp: 2 },
            ],
            selectedCrew: null,
            highlights: [],
            phase: 'select',
        };

        // 将游戏状态传给渲染器
        this.renderer.gameState = this.state;

        // 居中相机到船只位置
        const { x: sx, y: sy } = cellToScreen(this.state.ship.x, this.state.ship.y);
        this.camera.centerOn(sx, sy);

        // 启动渲染循环
        this._startRenderLoop();

        console.log('"最后的微光"Canvas 版本已启动', {
            camera: this.camera,
            canvas: `${canvas.width}x${canvas.height}`,
            crewCount: this.state.crew.length,
        });
    }

    _startRenderLoop() {
        const loop = () => {
            this.renderer.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /** 获取屏幕坐标对应的网格单元格 */
    getCellAt(screenX, screenY) {
        const world = this.camera.screenToWorld(screenX, screenY);
        const cell = { gx: world.x / CONFIG.tile.w, gy: world.y / CONFIG.tile.h };
        return {
            gx: Math.floor(cell.gx),
            gy: Math.floor(cell.gy),
        };
    }

    /** 点击网格单元格 */
    onCellClick(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= CONFIG.grid.width || gy >= CONFIG.grid.height) {
            return;
        }
        if (this.state.highlights.length > 0) {
            const highlighted = this.state.highlights.find(h => h.gx === gx && h.gy === gy);
            if (highlighted) {
                this._executeMove(gx, gy);
            }
        }
    }

    /** 选中船员 */
    onCrewClick(crewId) {
        const crew = this.state.crew.find(c => c.id === crewId);
        if (!crew) return;
        this.state.selectedCrew = crewId;
        this.state.highlights = this._getMoveRange(crew.x, crew.y, 3);
        this.renderer.markDirty();
    }

    _getMoveRange(gx, gy, range) {
        const highlights = [];
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= range) {
                    const nx = gx + dx;
                    const ny = gy + dy;
                    if (nx >= 0 && ny >= 0 && nx < CONFIG.grid.width && ny < CONFIG.grid.height) {
                        highlights.push({
                            gx: nx,
                            gy: ny,
                            color: 'rgba(100, 200, 255, 0.3)',
                            borderColor: 'rgba(100, 200, 255, 0.8)',
                        });
                    }
                }
            }
        }
        return highlights;
    }

    _executeMove(gx, gy) {
        const crew = this.state.crew.find(c => c.id === this.state.selectedCrew);
        if (!crew) return;
        crew.x = gx;
        crew.y = gy;
        this.state.highlights = [];
        this.state.selectedCrew = null;
        this.renderer.markDirty();
    }

    rollDice() {
        const dice = Math.floor(Math.random() * 6) + 1;
        this.state.phase = 'select';
        this.renderer.markDirty();
        return dice;
    }

    endTurn() {
        this.state.turn++;
        this.state.storm++;
        this.state.phase = 'roll';
        this.renderer.markDirty();
    }
}
