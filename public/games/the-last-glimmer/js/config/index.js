/**
 * config/index.js
 * "最后的微光"Canvas 版本 - 游戏配置
 */

export const CONFIG = Object.freeze({
    grid: {
        width: 7,
        height: 7,
    },

    // 2D 正交网格瓦片尺寸
    tile: {
        w: 80,   // 格子宽度 px
        h: 80,   // 格子高度 px
    },

    camera: {
        minZoom: 0.5,
        maxZoom: 3.0,
        defaultZoom: 1.0,
    },

    // 游戏参数
    game: {
        maxLight: 20,
        maxStructure: 20,
        stormDamage: 1,
        victoryScore: 10,
        maxTurns: 10,
    },

    // 船员渲染配置
    crew: {
        radius: 24,
        colors: {
            captain:  '#4fc3f7',  // 蓝色 - 船长
            firstMate: '#81c784',  // 绿色 - 大副
            sailor:   '#ffb74d',  // 橙色 - 水手
            engineer: '#ba68c8',  // 紫色 - 工程师
            medic:    '#e57373',  // 红色 - 医疗兵
        },
    },

    // 船员类型
    crewTypes: Object.freeze({
        CAPTAIN:  'captain',
        FIRST_MATE: 'firstMate',
        SAILOR:   'sailor',
        ENGINEER: 'engineer',
        MEDIC:    'medic',
    }),

    // 行动类型
    actions: Object.freeze({
        LIGHT:  'light',
        REPAIR: 'repair',
        HUNT:   'hunt',
        OIL:    'oil',
        MOVE:   'move',
        FIGHT:  'fight',
    }),
});
