// Canvas 2D 渲染器
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = CONFIG.canvas.width;
    this.h = CONFIG.canvas.height;
    canvas.width = this.w;
    canvas.height = this.h;

    // 离屏缓存层
    this.bgLayer = document.createElement('canvas');
    this.bgLayer.width = this.w;
    this.bgLayer.height = this.h;
    this.bgCtx = this.bgLayer.getContext('2d');
    this.bgDirty = true;
  }

  clear() {
    if (this.bgDirty) {
      this.drawBackground();
      this.bgDirty = false;
    }
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.drawImage(this.bgLayer, 0, 0);
  }

  drawBackground() {
    const ctx = this.bgCtx;
    const C = CONFIG.colors;

    // 深海渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#0a0e27');
    grad.addColorStop(0.4, '#0d1137');
    grad.addColorStop(0.7, '#141832');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    // 星星效果
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 80; i++) {
      const x = (i * 137.5 + 42) % this.w;
      const y = (i * 89.3 + 17) % (this.h * 0.6);
      const r = 0.5 + (i % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === 顶部信息栏 ===
  drawTopBar(state) {
    const ctx = this.ctx;
    const ly = CONFIG.layout.topBar;

    // 背景
    ctx.fillStyle = CONFIG.colors.panel;
    ctx.fillRect(0, ly.y, this.w, ly.h);
    ctx.strokeStyle = CONFIG.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ly.y + ly.h);
    ctx.lineTo(this.w, ly.y + ly.h);
    ctx.stroke();

    // 回合/关卡
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`第 ${state.level} 关  |  第 ${state.round} 回合`, 24, ly.y + 40);

    // 资源条
    const resources = [
      { label: '亮度', value: state.resources.light, max: 10, color: CONFIG.colors.light, icon: '☀' },
      { label: '结构', value: state.resources.structure, max: state.lighthouse.maxStructure, color: CONFIG.colors.structure, icon: '🏗' },
      { label: 'VP', value: state.resources.victoryPoints, max: state.vpTarget, color: CONFIG.colors.vp, icon: '⭐' },
      { label: '抚慰物', value: state.resources.dreamSoothers, max: 5, color: CONFIG.colors.soother, icon: '💎' }
    ];

    const barStartX = 300;
    const barW = 180;
    const barH = 14;
    const barGap = 30;
    const barY = ly.y + 14;

    resources.forEach((r, i) => {
      const x = barStartX + i * (barW + barGap);
      // 标签
      ctx.fillStyle = CONFIG.colors.textDim;
      ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`${r.icon} ${r.label}`, x, barY + 10);
      // 条背景
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x, barY + 16, barW, barH);
      // 条填充
      const pct = Math.min(r.value / r.max, 1);
      ctx.fillStyle = r.color;
      ctx.fillRect(x, barY + 16, barW * pct, barH);
      // 数值
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${r.value}/${r.max}`, x + barW / 2, barY + 40);
      ctx.textAlign = 'left';
    });

    // 风暴压力条
    const pressX = barStartX + 4 * (barW + barGap) + 20;
    const pressW = 150;
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('🌪 风暴压力', pressX, barY + 10);

    const pressGrad = ctx.createLinearGradient(pressX, 0, pressX + pressW, 0);
    pressGrad.addColorStop(0, '#2ecc71');
    pressGrad.addColorStop(0.5, '#f39c12');
    pressGrad.addColorStop(1, '#e74c3c');
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(pressX, barY + 16, pressW, barH);
    ctx.fillStyle = pressGrad;
    ctx.fillRect(pressX, barY + 16, pressW * (state.stormPressure / 5), barH);

    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.stormPressure}/5`, pressX + pressW / 2, barY + 40);
    ctx.textAlign = 'left';
  }

  // === 轨道区（风暴 + 灯塔） ===
  drawTrack(state) {
    const ctx = this.ctx;
    const ly = CONFIG.layout.track;
    const T = CONFIG.track;

    // 轨道区域背景
    ctx.fillStyle = 'rgba(10,14,39,0.6)';
    ctx.fillRect(0, ly.y, this.w, ly.h);

    // 轨道渐变线
    const trackY = ly.y + ly.h / 2;
    const grad = ctx.createLinearGradient(T.x, 0, T.x + T.w, 0);
    grad.addColorStop(0, '#2ecc71');
    grad.addColorStop(0.5, '#f39c12');
    grad.addColorStop(1, '#e74c3c');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(T.x, trackY);
    ctx.lineTo(T.x + T.w, trackY);
    ctx.stroke();

    // 刻度
    const segW = T.w / T.segments;
    for (let i = 0; i <= T.segments; i += 5) {
      const x = T.x + i * segW;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, trackY - 10);
      ctx.lineTo(x, trackY + 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i, x, trackY + 24);
      ctx.textAlign = 'left';
    }

    // 风暴格子
    state.storm.tiles.forEach(t => {
      const x = T.x + t.position * segW;
      ctx.fillStyle = 'rgba(155,89,182,0.4)';
      ctx.beginPath();
      ctx.arc(x, trackY - 24, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(155,89,182,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 闪电图标
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', x, trackY - 20);
      ctx.textAlign = 'left';
    });

    // 灯塔
    const lhX = T.x + state.lighthouse.position * segW;
    this._drawLighthouse(ctx, lhX, trackY - 28, state.resources.light);

    // 风暴之眼
    const eyeX = T.x + state.storm.eyePosition * segW;
    this._drawStormEye(ctx, eyeX, trackY - 50);

    // 安全区标记
    ctx.fillStyle = 'rgba(46,204,113,0.15)';
    ctx.fillRect(T.x, ly.y, segW * 3, ly.h);
    ctx.fillStyle = 'rgba(46,204,113,0.3)';
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('安全区', T.x + segW * 1.5, ly.y + 16);
    ctx.textAlign = 'left';
  }

  _drawLighthouse(ctx, x, y, light) {
    // 光晕（亮度越高越大）
    const glowR = 10 + light * 3;
    const glowGrad = ctx.createRadialGradient(x, y, 4, x, y, glowR);
    glowGrad.addColorStop(0, 'rgba(244,208,63,0.8)');
    glowGrad.addColorStop(0.5, 'rgba(244,208,63,0.2)');
    glowGrad.addColorStop(1, 'rgba(244,208,63,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 灯塔主体
    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 灯塔顶部
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 3, y - 18, 6, 12);
    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.arc(x, y - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawStormEye(ctx, x, y) {
    // 红色脉动光晕
    const time = Date.now() / 1000;
    const pulse = 1 + Math.sin(time * 3) * 0.2;
    const r = 14 * pulse;

    const glowGrad = ctx.createRadialGradient(x, y, 4, x, y, r * 1.5);
    glowGrad.addColorStop(0, 'rgba(231,76,60,0.6)');
    glowGrad.addColorStop(0.5, 'rgba(231,76,60,0.15)');
    glowGrad.addColorStop(1, 'rgba(231,76,60,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 眼球
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 3, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 4, y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // === 船员卡片区 ===
  drawCrewCards(state, selectedCrewId) {
    const ctx = this.ctx;
    const ly = CONFIG.layout.crew;

    // 区域背景
    ctx.fillStyle = 'rgba(10,14,39,0.4)';
    ctx.fillRect(0, ly.y, this.w, ly.h);

    const cardW = 200;
    const cardH = 180;
    const totalW = 5 * cardW + 4 * 24;
    const startX = (this.w - totalW) / 2;
    const startY = ly.y + 20;

    state.crew.forEach((c, i) => {
      const x = startX + i * (cardW + 24);
      const y = startY;
      const isSelected = c.id === selectedCrewId;
      const isAssigned = c.status === 'ASSIGNED';

      // 卡片背景
      ctx.fillStyle = isSelected ? CONFIG.colors.selected :
                      isAssigned ? CONFIG.colors.done :
                      CONFIG.colors.idle;
      this._roundRect(ctx, x, y, cardW, cardH, 12);
      ctx.fill();

      // 边框
      ctx.strokeStyle = isSelected ? 'rgba(52,152,219,0.8)' :
                        isAssigned ? 'rgba(46,204,113,0.5)' :
                        'rgba(255,255,255,0.15)';
      ctx.lineWidth = isSelected ? 2 : 1;
      this._roundRect(ctx, x, y, cardW, cardH, 12);
      ctx.stroke();

      // 状态图标
      const statusIcon = isAssigned ? '✓' : '○';
      ctx.fillStyle = isAssigned ? CONFIG.colors.safe : CONFIG.colors.textDim;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(statusIcon, x + cardW - 16, y + 28);
      ctx.textAlign = 'left';

      // 船员名字
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(c.name, x + 16, y + 32);

      // 技能
      if (c.skill) {
        const skillNames = {
          engineer: '🔧 工程师',
          hunter: '🏹 猎人',
          pilot: '🧭 领航员',
          priest: '⛪ 牧师',
          emergency: '🚨 应急员',
          lucky: '🍀 幸运儿'
        };
        ctx.fillStyle = CONFIG.colors.light;
        ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(skillNames[c.skill] || c.skill, x + 16, y + 56);
      } else {
        ctx.fillStyle = CONFIG.colors.textDim;
        ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('无技能', x + 16, y + 56);
      }

      // 状态文字
      const statusText = isAssigned ? `行动: ${c.assignedAction || ''}` : '空闲';
      ctx.fillStyle = isAssigned ? CONFIG.colors.safe : CONFIG.colors.textDim;
      ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(statusText, x + 16, y + 80);

      // 行动名称（已分配时）
      if (isAssigned && c.assignedAction) {
        const actionNames = {
          light: '点亮', repair: '修理', send: '发送',
          maneuver: '机动', hunt: '狩猎', trade: '交易'
        };
        ctx.fillStyle = CONFIG.colors.text;
        ctx.font = 'bold 15px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(actionNames[c.assignedAction] || c.assignedAction, x + cardW / 2, y + 120);
        ctx.textAlign = 'left';
      }

      // 提示文字
      if (!isAssigned) {
        ctx.fillStyle = CONFIG.colors.textDim;
        ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点击选择行动', x + cardW / 2, y + 140);
        ctx.textAlign = 'left';
      }
    });
  }

  // === 行动选择面板 ===
  drawActionPanel(state, selectedCrewId, unlockedActions) {
    const ctx = this.ctx;
    const ly = CONFIG.layout.actionPanel;

    if (!selectedCrewId) {
      // 无船员选中时显示提示
      ctx.fillStyle = 'rgba(10,14,39,0.3)';
      ctx.fillRect(0, ly.y, this.w, ly.h);
      ctx.fillStyle = CONFIG.colors.textDim;
      ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击船员卡片选择要分配的行动', this.w / 2, ly.y + ly.h / 2);
      ctx.textAlign = 'left';
      return;
    }

    const crew = state.crew.find(c => c.id === selectedCrewId);
    if (!crew || crew.status === 'ASSIGNED') return;

    // 面板背景
    ctx.fillStyle = CONFIG.colors.panel;
    ctx.fillRect(0, ly.y, this.w, ly.h);
    ctx.strokeStyle = CONFIG.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ly.y);
    ctx.lineTo(this.w, ly.y);
    ctx.stroke();

    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`为 ${crew.name} 选择行动`, this.w / 2, ly.y + 24);
    ctx.textAlign = 'left';

    const actions = [
      { id: 'light', name: '点亮', desc: '亮度+2', cost: '', color: CONFIG.colors.light, risk: false },
      { id: 'repair', name: '修理', desc: '结构+2', cost: '', color: CONFIG.colors.structure, risk: false },
      { id: 'send', name: '发送', desc: 'VP+3', cost: '需1抚慰物', color: CONFIG.colors.vp, risk: false },
      { id: 'maneuver', name: '机动', desc: '移动灯塔', cost: '', color: '#e67e22', risk: true },
      { id: 'hunt', name: '狩猎', desc: '获取抚慰物', cost: '', color: CONFIG.colors.soother, risk: true },
      { id: 'trade', name: '交易', desc: '换1抚慰物', cost: '需2亮度/1结构', color: '#1abc9c', risk: false }
    ];

    const btnW = 170;
    const btnH = 100;
    const gap = 18;
    const totalW = 6 * btnW + 5 * gap;
    const startX = (this.w - totalW) / 2;
    const btnY = ly.y + 40;

    actions.forEach((a, i) => {
      const x = startX + i * (btnW + gap);
      const unlocked = unlockedActions.includes(a.id);
      const canAfford = this._canAfford(state, crew, a);

      // 按钮背景
      ctx.fillStyle = unlocked && canAfford ? a.color : CONFIG.colors.textDim;
      ctx.globalAlpha = unlocked && canAfford ? 1 : 0.3;
      this._roundRect(ctx, x, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 边框
      ctx.strokeStyle = unlocked && canAfford ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, x, btnY, btnW, btnH, 10);
      ctx.stroke();

      // 名称
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(a.name, x + btnW / 2, btnY + 36);

      // 描述
      ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(a.desc, x + btnW / 2, btnY + 56);

      // 消耗
      if (a.cost && unlocked) {
        ctx.fillText(a.cost, x + btnW / 2, btnY + 74);
      }

      // 风险标记
      if (a.risk && unlocked) {
        ctx.fillStyle = CONFIG.colors.warning;
        ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('⚠ 需选风险', x + btnW / 2, btnY + 90);
      }

      // 锁定标记
      if (!unlocked) {
        ctx.fillStyle = CONFIG.colors.textDim;
        ctx.font = '20px sans-serif';
        ctx.fillText('🔒', x + btnW / 2, btnY + btnH / 2 + 6);
      }

      ctx.textAlign = 'left';
    });
  }

  // === 风险选择弹窗 ===
  drawRiskDialog(state, crewId, actionType) {
    const ctx = this.ctx;

    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.w, this.h);

    // 弹窗
    const dw = 400;
    const dh = actionType === 'hunt' ? 220 : 220;
    const dx = (this.w - dw) / 2;
    const dy = (this.h - dh) / 2;

    ctx.fillStyle = CONFIG.colors.panel;
    this._roundRect(ctx, dx, dy, dw, dh, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, dx, dy, dw, dh, 16);
    ctx.stroke();

    const title = actionType === 'hunt' ? '选择狩猎风险等级' : '选择机动风险等级';
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, this.w / 2, dy + 40);

    if (actionType === 'hunt') {
      // 浅层狩猎
      this._drawRiskOption(ctx, dx + 40, dy + 70, '浅层狩猎', '80% 成功率 · 获得 1 抚慰物', CONFIG.colors.safe, true);
      // 深层狩猎
      this._drawRiskOption(ctx, dx + 220, dy + 70, '深层狩猎', '30% 成功率 · 获得 2 抚慰物', CONFIG.colors.danger, false);
    } else {
      // 保守机动
      this._drawRiskOption(ctx, dx + 40, dy + 70, '保守移动', '100% 成功 · ±1 格', CONFIG.colors.safe, true);
      // 激动机动
      this._drawRiskOption(ctx, dx + 220, dy + 70, '激进移动', '50% 成功 · ±2~3 格', CONFIG.colors.danger, false);
    }

    // 取消按钮
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击外部取消', this.w / 2, dy + dh - 20);
    ctx.textAlign = 'left';
  }

  _drawRiskOption(ctx, x, y, name, desc, color, isSafe) {
    const w = 150;
    const h = 90;

    ctx.fillStyle = isSafe ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.15)';
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isSafe ? 'rgba(46,204,113,0.5)' : 'rgba(231,76,60,0.5)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + w / 2, y + 30);

    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(desc, x + w / 2, y + 55);
    ctx.textAlign = 'left';
  }

  // === 结束回合按钮 ===
  drawEndTurnButton(state) {
    const ctx = this.ctx;
    const ly = CONFIG.layout.footer;

    const allAssigned = state.crew.every(c => c.status === 'ASSIGNED');
    const btnW = 200;
    const btnH = 42;
    const btnX = (this.w - btnW) / 2;
    const btnY = ly.y + 8;

    ctx.fillStyle = allAssigned ? CONFIG.colors.warning : CONFIG.colors.textDim;
    ctx.globalAlpha = allAssigned ? 1 : 0.3;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = allAssigned ? 'rgba(243,156,18,0.6)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    const assignedCount = state.crew.filter(c => c.status === 'ASSIGNED').length;
    ctx.fillText(`结束回合 (${assignedCount}/5)`, this.w / 2, btnY + 30);
    ctx.textAlign = 'left';
  }

  // === 结算弹窗 ===
  drawResultDialog(state) {
    const ctx = this.ctx;
    if (!state.storm.gameOver) return;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.w, this.h);

    const dw = 500;
    const dh = 300;
    const dx = (this.w - dw) / 2;
    const dy = (this.h - dh) / 2;

    ctx.fillStyle = CONFIG.colors.panel;
    this._roundRect(ctx, dx, dy, dw, dh, 20);
    ctx.fill();
    ctx.strokeStyle = state.storm.gameOver.startsWith('WIN') ? 'rgba(46,204,113,0.6)' : 'rgba(231,76,60,0.6)';
    ctx.lineWidth = 3;
    this._roundRect(ctx, dx, dy, dw, dh, 20);
    ctx.stroke();

    const isWin = state.storm.gameOver.startsWith('WIN');
    ctx.fillStyle = isWin ? CONFIG.colors.safe : CONFIG.colors.danger;
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isWin ? '✦ 胜利 ✦' : '✖ 失败 ✖', this.w / 2, dy + 60);

    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
    const messages = {
      'WIN_VP': '灯塔成功稳定轨道！人类文明的微光得以延续。',
      'WIN_SURVIVE': '灯塔在风暴中屹立不倒，人类文明得以延续。',
      'LOSE_STRUCTURE': '灯塔结构彻底崩溃，在风暴中化为碎片。',
      'LOSE_LIGHT': '灯塔彻底失去能源，黑暗吞没了最后的光芒。',
      'LOSE_ROUNDS': '灯塔在风暴带中漂泊太久，希望已然消逝。'
    };
    ctx.fillText(messages[state.storm.gameOver] || '', this.w / 2, dy + 100);

    // 统计
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`回合数: ${state.round}  |  胜利点: ${state.resources.victoryPoints}  |  存活船员: ${state.crew.length}`, this.w / 2, dy + 140);

    // 按钮
    const btnW = 160;
    const btnH = 40;
    ctx.fillStyle = CONFIG.colors.warning;
    this._roundRect(ctx, this.w / 2 - btnW - 10, dy + 180, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('重新开始', this.w / 2 - btnW / 2 - 10, dy + 206);

    if (isWin && state.level < CONFIG.levels.length) {
      ctx.fillStyle = CONFIG.colors.safe;
      this._roundRect(ctx, this.w / 2 + 10, dy + 180, btnW, btnH, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('下一关', this.w / 2 + btnW / 2 + 10, dy + 206);
    }

    ctx.textAlign = 'left';
  }

  _canAfford(state, crew, action) {
    switch (action.id) {
      case 'send': return state.resources.dreamSoothers >= 1;
      case 'trade': return state.resources.light >= 2 || state.resources.structure >= 1;
      default: return true;
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
