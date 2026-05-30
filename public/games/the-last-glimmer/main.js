// 游戏主入口 - Canvas版本（绑定HTML叠加层按钮）
import { Renderer } from './js/engine/Renderer.js';
import { InputManager } from './js/engine/InputManager.js';
import { GameState } from './js/game/GameState.js';

let state;
let renderer;
let input;
let selectedCrewId = null;
let showRiskDialog = null;
let animFrameId;

function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return console.error('Canvas not found');

  renderer = new Renderer(canvas);
  input = new InputManager(canvas);

  // 加载存档或新建
  const saved = localStorage.getItem('last-glimmer-save');
  if (saved) {
    try { state = GameState.fromJSON(JSON.parse(saved)); }
    catch (e) { state = new GameState(0); }
  } else {
    state = new GameState(0);
  }

  setupInputHandlers();
  setupUIButtonHandlers();
  updateResourceBar();
  gameLoop();
}

// Canvas点击事件（选择队员、风险对话框）
function setupInputHandlers() {
  input.onClick((mx, my) => {
    if (state.storm.gameOver) { handleGameOverClick(mx, my); return; }
    if (showRiskDialog) { handleRiskDialogClick(mx, my); return; }

    // 点击队员卡片
    const cardW = 200, cardH = 180;
    const totalW = 5 * cardW + 4 * 24;
    const startX = (CONFIG.canvas.width - totalW) / 2;
    const startY = CONFIG.layout.crew.y + 20;

    state.crew.forEach((c, i) => {
      const x = startX + i * (cardW + 24);
      if (input.isInside(x, startY, cardW, cardH)) {
        if (c.status === 'ASSIGNED') return;
        selectedCrewId = c.id;
        showRiskDialog = null;
        updateActionButtons();
      }
    });
  });
}

// 绑定HTML叠加层按钮
function setupUIButtonHandlers() {
  const btnRoll = document.getElementById('btn-roll');
  const btnMove = document.getElementById('btn-move');
  const btnRepair = document.getElementById('btn-repair');
  const btnOil = document.getElementById('btn-oil');
  const btnFight = document.getElementById('btn-fight');
  const btnEnd = document.getElementById('btn-end');

  if (btnRoll) btnRoll.addEventListener('click', () => handleAction('roll'));
  if (btnMove) btnMove.addEventListener('click', () => handleAction('move'));
  if (btnRepair) btnRepair.addEventListener('click', () => handleAction('repair'));
  if (btnOil) btnOil.addEventListener('click', () => handleAction('oil'));
  if (btnFight) btnFight.addEventListener('click', () => handleAction('fight'));
  if (btnEnd) btnEnd.addEventListener('click', () => endTurn());
}

function handleAction(action) {
  if (!selectedCrewId) { log('请先选择一个队员'); return; }
  if (state.phase !== 'select') return;

  switch (action) {
    case 'roll':
      // 掷骰子：为选中队员掷骰
      const result = state.rollDiceForCrew(selectedCrewId);
      log(`${getCrewName(selectedCrewId)} 掷出了 ${result}`);
      updateResourceBar();
      break;

    case 'move':
      if (!state.canMove(selectedCrewId)) { log('无法移动'); return; }
      // 进入移动模式：下次Canvas点击为移动目标
      state.pendingMove = selectedCrewId;
      log(`移动 ${getCrewName(selectedCrewId)}：请点击目标格子`);
      break;

    case 'repair':
      if (state.assignCrewAction(selectedCrewId, 'repair')) {
        log(`${getCrewName(selectedCrewId)} 正在修复`);
        selectedCrewId = null;
      }
      break;

    case 'oil':
      if (state.assignCrewAction(selectedCrewId, 'oil')) {
        log(`${getCrewName(selectedCrewId)} 正在添油`);
        selectedCrewId = null;
      }
      break;

    case 'fight':
      if (state.assignCrewAction(selectedCrewId, 'fight')) {
        log(`${getCrewName(selectedCrewId)} 准备抗击风暴`);
        selectedCrewId = null;
      }
      break;
  }
  updateActionButtons();
  updateResourceBar();
}

function endTurn() {
  if (!state.allCrewAssigned && !confirm('还有队员未分配行动，确定结束回合？')) return;
  state.resolveCrewActions();
  state.resolveStormPhase();
  state.advanceRound();
  saveGame();
  selectedCrewId = null;
  showRiskDialog = null;
  updateResourceBar();
  updateActionButtons();
  log(`--- 第 ${state.round} 回合 ---`);
}

// 风险对话框点击（Canvas绘制）
function handleRiskDialogClick(mx, my) {
  // ... 保留原有逻辑
}

function handleGameOverClick(mx, my) {
  // ... 保留原有逻辑
}

function updateResourceBar() {
  const lightEl = document.getElementById('light-value');
  const structureEl = document.getElementById('structure-value');
  const stormEl = document.getElementById('storm-value');
  const turnEl = document.getElementById('turn-value');
  const scoreEl = document.getElementById('score-value');

  if (lightEl) lightEl.textContent = state.resources.light;
  if (structureEl) structureEl.textContent = state.resources.structure;
  if (stormEl) stormEl.textContent = state.resources.storm || 0;
  if (turnEl) turnEl.textContent = state.round;
  if (scoreEl) scoreEl.textContent = state.score || 0;
}

function updateActionButtons() {
  const hasSelection = selectedCrewId !== null;
  const btnRepair = document.getElementById('btn-repair');
  const btnOil = document.getElementById('btn-oil');
  const btnFight = document.getElementById('btn-fight');

  if (btnRepair) btnRepair.disabled = !hasSelection;
  if (btnOil) btnOil.disabled = !hasSelection;
  if (btnFight) btnFight.disabled = !hasSelection;
}

function log(msg) {
  const logContent = document.getElementById('log-content');
  if (logContent) {
    const div = document.createElement('div');
    div.textContent = msg;
    logContent.appendChild(div);
    logContent.scrollTop = logContent.scrollHeight;
  }
}

function saveGame() {
  try { localStorage.setItem('last-glimmer-save', JSON.stringify(state.toJSON())); }
  catch (e) {}
}

function getCrewName(id) {
  const names = { captain: '船长', firstMate: '大副', sailor: '水手', engineer: '工程师', medic: '医生' };
  return names[id] || id;
}

function gameLoop() {
  renderer.clear();
  renderer.drawTopBar(state);
  renderer.drawTrack(state);
  renderer.drawCrewCards(state, selectedCrewId);
  renderer.drawActionPanel(state, selectedCrewId, state.unlockedActions);

  if (showRiskDialog) {
    renderer.drawRiskDialog(state, showRiskDialog.crewId, showRiskDialog.actionType);
  }
  if (state.storm.gameOver) {
    renderer.drawResultDialog(state);
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);
