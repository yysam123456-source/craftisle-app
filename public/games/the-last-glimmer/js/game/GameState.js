// 游戏状态管理
class GameState {
  constructor(levelIndex = 0) {
    this.levelIndex = levelIndex;
    this.reset(levelIndex);
  }

  reset(levelIndex = 0) {
    const lv = CONFIG.levels[levelIndex];
    this.level = lv.level;
    this.round = 1;
    this.stormPressure = lv.stormPressure;
    this.vpTarget = lv.vpTarget;
    this.unlockedActions = [...lv.unlockedActions];
    this.lightDecay = lv.lightDecay;

    this.resources = {
      light: lv.light,
      structure: lv.structure,
      victoryPoints: 0,
      dreamSoothers: 0
    };

    this.lighthouse = {
      position: CONFIG.track.lighthouseStart,
      maxStructure: lv.structure
    };

    // 生成船员技能 (2固定 + 3随机)
    const skills = this._generateSkills();

    this.crew = [
      { id: 1, name: '船员A', status: 'IDLE', skill: skills[0], assignedAction: null },
      { id: 2, name: '船员B', status: 'IDLE', skill: skills[1], assignedAction: null },
      { id: 3, name: '船员C', status: 'IDLE', skill: skills[2], assignedAction: null },
      { id: 4, name: '船员D', status: 'IDLE', skill: skills[3], assignedAction: null },
      { id: 5, name: '船员E', status: 'IDLE', skill: skills[4], assignedAction: null }
    ];

    this.storm = {
      eyePosition: CONFIG.track.stormEyeStart,
      tiles: [],
      gameOver: null
    };

    this.priestUsedCount = 0;
    this.totalRounds = 0;
  }

  _generateSkills() {
    const pool = ['engineer', 'hunter', 'pilot', 'priest', 'emergency', 'lucky'];
    // 随机选2个固定技能
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const fixed = shuffled.slice(0, 2);
    // 随机3人可能无技能
    const random = [];
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.6) {
        random.push(pool[Math.floor(Math.random() * pool.length)]);
      } else {
        random.push(null);
      }
    }
    return [...fixed, ...random];
  }

  assignCrewAction(crewId, action, riskLevel = null) {
    const crew = this.crew.find(c => c.id === crewId);
    if (!crew || crew.status !== 'IDLE') return false;
    if (!this.unlockedActions.includes(action)) return false;

    // 检查资源前置条件
    if (action === 'send' && this.resources.dreamSoothers < 1) return false;
    if (action === 'trade' && this.resources.light < 2 && this.resources.structure < 1) return false;

    crew.status = 'ASSIGNED';
    crew.assignedAction = action;
    crew.riskLevel = riskLevel;
    return true;
  }

  resolveCrewActions() {
    // 执行所有已分配船员行动
    this.crew.forEach(c => {
      if (c.status !== 'ASSIGNED') return;
      this._executeAction(c);
      c.assignedAction = null;
      c.riskLevel = null;
    });

    // 所有船员恢复空闲
    this.crew.forEach(c => { c.status = 'IDLE'; });
  }

  _executeAction(crew) {
    const action = crew.assignedAction;
    const risk = crew.riskLevel;

    switch (action) {
      case 'light': {
        const bonus = crew.skill === 'emergency' ? 3 : 2;
        this.resources.light = Math.min(10, this.resources.light + bonus);
        break;
      }
      case 'repair': {
        const bonus = crew.skill === 'engineer' ? 3 : 2;
        this.resources.structure = Math.min(this.lighthouse.maxStructure, this.resources.structure + bonus);
        break;
      }
      case 'send': {
        if (this.resources.dreamSoothers < 1) return;
        this.resources.dreamSoothers--;
        const vp = crew.skill === 'priest' && this.priestUsedCount < 3 ? 4 : 3;
        if (crew.skill === 'priest') this.priestUsedCount++;
        this.resources.victoryPoints += vp;
        break;
      }
      case 'hunt': {
        let rate = risk === 'deep' ? 0.3 : 0.8;
        if (crew.skill === 'hunter') rate += risk === 'deep' ? 0.2 : 0.1;
        if (crew.skill === 'lucky') rate += 0.15;
        rate = Math.min(1, rate);

        if (Math.random() < rate) {
          const amount = risk === 'deep' ? 2 : 1;
          this.resources.dreamSoothers = Math.min(5, this.resources.dreamSoothers + amount);
        }
        break;
      }
      case 'maneuver': {
        let rate = risk === 'aggressive' ? 0.5 : 1.0;
        if (crew.skill === 'pilot') rate += 0.2;
        if (crew.skill === 'lucky') rate += 0.15;
        rate = Math.min(1, rate);

        if (Math.random() < rate) {
          const dist = risk === 'aggressive' ? (2 + Math.floor(Math.random() * 2)) : 1;
          const dir = Math.random() < 0.5 ? 1 : -1;
          this.lighthouse.position += dist * dir;
          this.lighthouse.position = Math.max(0, Math.min(39, this.lighthouse.position));
        } else if (risk === 'aggressive') {
          // 激进失败安慰奖
          this.resources.dreamSoothers = Math.min(5, this.resources.dreamSoothers + 1);
        }
        break;
      }
      case 'trade': {
        if (this.resources.light >= 2) {
          this.resources.light -= 2;
        } else if (this.resources.structure >= 1) {
          this.resources.structure -= 1;
        } else return;
        this.resources.dreamSoothers = Math.min(5, this.resources.dreamSoothers + 1);
        break;
      }
    }
  }

  // 风暴阶段
  resolveStormPhase() {
    // 1. 压力+1
    this.stormPressure++;

    // 压力>=3时生成风暴格子
    if (this.stormPressure >= 3) {
      const pos = Math.floor(Math.random() * 35) + 1; // 1~35
      this.storm.tiles.push({ position: pos });
      this.stormPressure = 0;
    }

    // 2. 风暴之眼移动
    const speed = this._getStormSpeed();
    this.storm.eyePosition -= speed;

    // 3. 爆炸判定
    if (this.storm.eyePosition === this.lighthouse.position) {
      let damage = 2 + this.stormPressure - this.resources.light;
      damage = Math.max(0, damage);
      this.resources.structure -= damage;
    }

    // 相邻风暴格子判定
    const adjacentToTile = this.storm.tiles.some(t =>
      Math.abs(t.position - this.lighthouse.position) <= 1
    );
    if (adjacentToTile) {
      this.resources.structure -= 1;
    }

    // 4. 亮度衰减
    this.resources.light = Math.max(0, this.resources.light - this.lightDecay);

    // 5. 胜负判定
    return this._checkGameOver();
  }

  _getStormSpeed() {
    const speed = CONFIG.levels[this.levelIndex].stormSpeed;
    if (Array.isArray(speed)) {
      return speed[Math.floor(Math.random() * speed.length)];
    }
    return speed;
  }

  _checkGameOver() {
    // 胜利
    if (this.resources.victoryPoints >= this.vpTarget) {
      this.storm.gameOver = 'WIN_VP';
      return 'WIN_VP';
    }
    if (this.round >= 10 && this.resources.structure >= 3) {
      this.storm.gameOver = 'WIN_SURVIVE';
      return 'WIN_SURVIVE';
    }
    // 失败
    if (this.resources.structure <= 0) {
      this.storm.gameOver = 'LOSE_STRUCTURE';
      return 'LOSE_STRUCTURE';
    }
    if (this.resources.light <= 0 && this.storm.eyePosition <= this.lighthouse.position) {
      this.storm.gameOver = 'LOSE_LIGHT';
      return 'LOSE_LIGHT';
    }
    if (this.round > 20) {
      this.storm.gameOver = 'LOSE_ROUNDS';
      return 'LOSE_ROUNDS';
    }
    return null;
  }

  advanceRound() {
    this.round++;
    this.totalRounds++;
  }

  toJSON() {
    return {
      levelIndex: this.levelIndex,
      level: this.level,
      round: this.round,
      stormPressure: this.stormPressure,
      vpTarget: this.vpTarget,
      unlockedActions: this.unlockedActions,
      resources: { ...this.resources },
      lighthouse: { ...this.lighthouse },
      crew: this.crew.map(c => ({ ...c })),
      storm: { ...this.storm, tiles: this.storm.tiles.map(t => ({ ...t })) },
      priestUsedCount: this.priestUsedCount,
      totalRounds: this.totalRounds
    };
  }

  static fromJSON(data) {
    const state = new GameState(data.levelIndex || 0);
    Object.assign(state, data);
    return state;
  }
}
