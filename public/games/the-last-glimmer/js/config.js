// 游戏全局配置
const CONFIG = {
  canvas: {
    width: 1280,
    height: 720,
    bgColor: '#0a0e27'
  },

  levels: [
    { // 第1关 - 教学
      level: 1,
      light: 6,
      structure: 12,
      vpTarget: 10,
      stormPressure: 1,
      stormSpeed: 1,
      lightDecay: 1,
      unlockedActions: ['light', 'repair']
    },
    { // 第2关 - 半开放
      level: 2,
      light: 5,
      structure: 10,
      vpTarget: 15,
      stormPressure: 1,
      stormSpeed: [1, 2],
      lightDecay: 1,
      unlockedActions: ['light', 'repair', 'hunt', 'send']
    },
    { // 第3关 - 全开放
      level: 3,
      light: 5,
      structure: 10,
      vpTarget: 20,
      stormPressure: 2,
      stormSpeed: [1, 2],
      lightDecay: 1,
      unlockedActions: ['light', 'repair', 'hunt', 'send', 'maneuver', 'trade']
    }
  ],

  // 布局参数
  layout: {
    topBar: { y: 0, h: 64 },
    track: { y: 64, h: 200 },
    crew: { y: 264, h: 220 },
    actionPanel: { y: 484, h: 180 },
    footer: { y: 664, h: 56 }
  },

  // 轨道参数
  track: {
    x: 80,
    w: 1120,
    segments: 40,
    lighthouseStart: 5,
    stormEyeStart: 35
  },

  // 颜色
  colors: {
    light: '#f4d03f',
    structure: '#58d68d',
    vp: '#85c1e9',
    soother: '#bb8fce',
    danger: '#e74c3c',
    warning: '#f39c12',
    safe: '#2ecc71',
    idle: 'rgba(255,255,255,0.1)',
    selected: 'rgba(52,152,219,0.4)',
    done: 'rgba(46,204,113,0.3)',
    text: '#e0e0e0',
    textDim: '#7f8c8d',
    panel: 'rgba(20,24,50,0.95)',
    panelBorder: 'rgba(255,255,255,0.1)'
  }
};
