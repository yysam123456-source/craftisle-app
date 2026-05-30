# 最后的微光 - Canvas 引擎改造方案

## 现状问题
- 当前：纯 DOM + CSS 实现，性能差，动画受限
- 目标：基于 island-builder 的 Canvas 引擎改造为 2D 网格引擎

## 引擎架构分析

### 可复用模块
1. **Renderer.js** - 分层缓存渲染（terrain/objects/live）
2. **Camera.js** - pan/zoom 相机系统
3. **InputManager.js** - 鼠标/触摸输入抽象
4. **Audio.js** - 音效系统

### 需要改造的模块
1. **IsoGrid.js** - 等距坐标 → 2D 正交网格
2. **Game.js** - 岛屿建造逻辑 → 回合制桌游逻辑
3. **渲染系统** - 等距精灵 → 2D 网格 + 海洋背景

## 改造方案

### 第一阶段：引擎适配（2小时）
1. 创建 `FlatGrid.js` - 2D 正交网格坐标系统
2. 修改 `Renderer.js` - 支持 2D 网格渲染
3. 修改 `Camera.js` - 适配 2D 视角
4. 创建 `GameBoard.js` - 游戏棋盘渲染器

### 第二阶段：游戏逻辑移植（3小时）
1. 创建 `GlimmerGame.js` - 主游戏类
2. 移植游戏状态管理（光亮/结构/风暴/回合/积分）
3. 移植船员系统（5个角色）
4. 移植行动系统（移动/修复/添油/抗击）
5. 移植教程系统（7步引导）

### 第三阶段：视觉升级（2小时）
1. Canvas 海洋背景（粒子波浪）
2. Canvas 灯塔光束（旋转渐变）
3. Canvas 风暴云（帧动画）
4. 船员精灵（简单几何图形 + 主题图标）
5. 网格高亮动画

### 第四阶段：UI 重写（1小时）
1. 资源栏（Canvas 渲染）
2. 行动按钮（Canvas 渲染 + 点击检测）
3. 手牌区（Canvas 渲染）
4. 日志区（Canvas 渲染）

## 文件结构
```
the-last-glimmer/
├── index.html          # 入口
├── css/
│   └── style.css       # 仅页面容器样式
├── js/
│   ├── core/           # 从 island-builder 复制并改造
│   │   ├── Renderer.js
│   │   ├── Camera.js
│   │   ├── InputManager.js
│   │   ├── FlatGrid.js # 新增：2D 网格
│   │   └── Audio.js
│   ├── game/
│   │   ├── GlimmerGame.js  # 主游戏类
│   │   ├── GameBoard.js    # 棋盘渲染
│   │   ├── Crew.js         # 船员系统
│   │   ├── Card.js         # 卡牌系统
│   │   └── Tutorial.js     # 教程系统
│   ├── ui/
│   │   ├── ResourceBar.js  # 资源栏
│   │   ├── ActionBar.js    # 行动按钮
│   │   └── LogPanel.js     # 日志面板
│   └── main.js         # 入口
└── assets/
    └── icons/          # SVG 图标（可选，Canvas 绘制优先）
```

## 技术方案

### 坐标系统
```javascript
// FlatGrid.js - 2D 正交网格
export function cellToScreen(gx, gy, tileW, tileH) {
    return {
        x: gx * tileW,
        y: gy * tileH
    };
}

export function screenToCell(px, py, tileW, tileH) {
    return {
        gx: Math.floor(px / tileW),
        gy: Math.floor(py / tileH)
    };
}
```

### 渲染层
```javascript
// Renderer.js 改造 - 3 层渲染
LAYER_TERRAIN: 海洋背景 + 网格线
LAYER_OBJECTS: 船员 + 建筑 + 高亮
LAYER_UI: 资源栏 + 行动按钮 + 日志
```

### 性能优化
- 脏标记：只有状态变化时才重绘
- 分层缓存：背景层不常变，单独缓存
- requestAnimationFrame：空闲时 CPU 0%

## 时间估算
- 第一阶段：2 小时
- 第二阶段：3 小时
- 第三阶段：2 小时
- 第四阶段：1 小时
- **总计：8 小时**

## 风险控制
- 先跑通最小可玩版本（只有网格 + 船员 + 移动）
- 逐步添加功能，每步可验证
- 保留 DOM 版本作为 fallback

## 下一步
1. 创建新目录结构
2. 复制并改造引擎核心
3. 实现最小可玩版本
4. 迭代功能
