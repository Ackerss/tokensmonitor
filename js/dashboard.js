// js/dashboard.js
import { isPast, getRelativeTimeString, getTimeStatus, getRefreshDisplay } from './time-utils.js';
import { saveData } from './gist.js';
import { getToken, getGistId } from './settings.js';

let _appDataRef = null;

export function renderDashboard(appData) {
  _appDataRef = appData;
  const grid = document.getElementById('dashboard-grid');
  const emptyState = document.getElementById('dashboard-empty');
  grid.innerHTML = '';
  
  const accIds = Object.keys(appData.accounts);
  if (accIds.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');

  // Ordenar contas: Antigravity primeiro, ou então as que estão com status mais alto primeiro.
  // Vamos usar um score de usabilidade.
  const scoredAccs = accIds.map(id => {
    const acc = appData.accounts[id];
    let score = 0;
    if (acc.provider === 'antigravity') {
      const models = Object.values(acc.models || {});
      // Se tem algum modelo FULL + ready = topo
      const hasFullAndReady = models.some(m => (m.level === 'full' || (m.resetsAt && isPast(m.resetsAt))) && isPast(m.resetsAt));
      if (hasFullAndReady) score = 100;
      else if (models.some(m => m.level === 'medium' && isPast(m.resetsAt))) score = 50;
    } else if (acc.provider === 'claudecode') {
      // 0% usado é score alto
      if (acc.session < 50) score = 80;
      else score = 10;
    }
    return { id, acc, score };
  });

  scoredAccs.sort((a, b) => b.score - a.score);

  scoredAccs.forEach(item => {
    if (item.acc.provider === 'antigravity') {
      grid.appendChild(buildAntigravityCard(item.id, item.acc));
    } else {
      grid.appendChild(buildClaudeCodeCard(item.id, item.acc));
    }
  });
}

function buildAntigravityCard(id, acc) {
  const div = document.createElement('div');
  div.className = 'account-card';
  
  const allowedOrder = [
    'Gemini 3.1 Pro (High)',
    'Claude Sonnet 4.6 (Thinking)',
    'Claude Opus 4.6 (Thinking)'
  ];
  
  const validModels = allowedOrder
    .map(name => acc.models && acc.models[name])
    .filter(m => m !== undefined);

  // Acha o melhor status dot da conta global baseando-se apenas nos permitidos
  let globalDot = 'empty';
  
  function safeLevel(oldLevel) {
    if (!oldLevel) return '0';
    if (oldLevel === 'full') return '5';
    if (oldLevel === 'medium') return '3';
    if (oldLevel === 'low') return '1';
    if (oldLevel === 'empty') return '0';
    return oldLevel; // "0" to "5"
  }

  function getEffectiveLevel(m) {
    if (m.resetsAt && isPast(m.resetsAt)) return '5';
    return safeLevel(m.level);
  }

  if (validModels.some(m => parseInt(getEffectiveLevel(m)) === 5 && isPast(m.resetsAt))) globalDot = 'full';
  else if (validModels.some(m => parseInt(getEffectiveLevel(m)) >= 3 && isPast(m.resetsAt))) globalDot = 'medium';
  else if (validModels.some(m => parseInt(getEffectiveLevel(m)) >= 1 && isPast(m.resetsAt))) globalDot = 'low';

  div.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <div class="card-status-dot ${globalDot}"></div>
        ${acc.name}
      </div>
      <div class="card-updated">Antigravity</div>
    </div>
    <div class="card-body">
      ${validModels.map(m => `
        <div class="model-row">
          <div class="model-row-top">
            <div class="model-name">${m.name}</div>
            <div class="model-refresh ${getTimeStatus(m.resetsAt)}">${getRefreshDisplay(m.resetsAt)}</div>
          </div>
          <div class="token-bar-container">
            <div class="ag-segments lvl${getEffectiveLevel(m)}">
              ${[1, 2, 3, 4, 5].map(i => `<div class="ag-seg ${i <= parseInt(getEffectiveLevel(m)) ? 'filled' : ''}"></div>`).join('')}
            </div>
            <div class="token-bar-label lvl${getEffectiveLevel(m)}">${formatLevel(getEffectiveLevel(m))}</div>
            <button class="notif-btn ${m.notifEnabled ? 'active' : ''}" data-acc="${id}" data-model="${m.name}" title="Avisar quando renovar">🔔</button>
          </div>
        </div>
      `).join('')}
      ${validModels.length === 0 ? '<div style="padding:1rem">Nenhum dado colado ainda.</div>' : ''}
    </div>
  `;

  // Attach events
  div.querySelectorAll('.notif-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const aId = e.currentTarget.dataset.acc;
      const mName = e.currentTarget.dataset.model;
      const model = _appDataRef.accounts[aId].models[mName];
      model.notifEnabled = !model.notifEnabled;
      
      // Update UI imediatamente locally e salvar
      e.currentTarget.classList.toggle('active', model.notifEnabled);
      try {
        await saveData(getToken(), getGistId(), _appDataRef);
      } catch (err) {
        alert("Erro ao salvar alerta: " + err.message);
      }
    });
  });

  return div;
}

function buildClaudeCodeCard(id, acc) {
  const div = document.createElement('div');
  div.className = 'account-card claude-card';
  
  const sessionRem = Math.max(0, 100 - acc.session);
  const weeklyRem = Math.max(0, 100 - acc.weekly);
  const designRem = Math.max(0, 100 - (acc.design || 0));

  let globalDot = weeklyRem > 20 ? (sessionRem > 30 ? 'full' : 'low') : 'empty';

  div.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <div class="card-status-dot ${globalDot}"></div>
        ${acc.name}
      </div>
      <div class="card-updated">Claude Code</div>
    </div>
    <div class="card-body">
      <div class="claude-section">
        <div class="claude-section-label">Sessão Atual</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill ${sessionRem < 20 ? 'warning' : ''}" style="width: ${sessionRem}%"></div></div>
        <div class="claude-usage-meta">
          <span>${sessionRem}% livre</span>
          <span>${acc.sessionRefresh ? getRefreshDisplay(acc.sessionRefresh) : 'Por sessão'}</span>
        </div>
      </div>
      <div class="claude-section weekly">
        <div class="claude-section-label">Limite Semanal</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill ${weeklyRem < 10 ? 'critical' : (weeklyRem < 30 ? 'warning' : '')}" style="width: ${weeklyRem}%"></div></div>
        <div class="claude-usage-meta">
          <span>${weeklyRem}% livre</span>
          <span>${getRefreshDisplay(acc.weeklyRefresh)}</span>
        </div>
      </div>
      <div class="claude-section design">
        <div class="claude-section-label">Claude Design</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill ${designRem < 10 ? 'critical' : (designRem < 30 ? 'warning' : '')}" style="width: ${designRem}%"></div></div>
        <div class="claude-usage-meta">
          <span>${designRem}% livre</span>
          <span>Semanal</span>
        </div>
      </div>
    </div>
  `;
  return div;
}

function formatLevel(lvlStr) {
  let level = parseInt(lvlStr);
  if (lvlStr === 'full') level = 5;
  if (lvlStr === 'medium') level = 3;
  if (lvlStr === 'low') level = 1;
  if (lvlStr === 'empty' || isNaN(level)) level = 0;

  if (level === 5) return 'Cheio';
  if (level === 4) return 'Alto';
  if (level === 3) return 'Médio';
  if (level === 2) return 'Baixo';
  if (level === 1) return 'Mínimo';
  return 'Zerado';
}
