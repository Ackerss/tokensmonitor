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
      const hasFullAndReady = models.some(m => m.level === 'full' && isPast(m.resetsAt));
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
  
  // Acha o melhor status dot da conta global
  let globalDot = 'empty';
  const models = Object.values(acc.models || {});
  if (models.some(m => m.level === 'full' && isPast(m.resetsAt))) globalDot = 'full';
  else if (models.some(m => m.level === 'medium' && isPast(m.resetsAt))) globalDot = 'medium';
  else if (models.some(m => m.level === 'low' && isPast(m.resetsAt))) globalDot = 'low';

  div.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <div class="card-status-dot ${globalDot}"></div>
        ${acc.name}
      </div>
      <div class="card-updated">Antigravity</div>
    </div>
    <div class="card-body">
      ${Object.values(acc.models || {}).map(m => `
        <div class="model-row">
          <div class="model-row-top">
            <div class="model-name">${m.name}</div>
            <div class="model-refresh ${getTimeStatus(m.resetsAt)}">${getRefreshDisplay(m.resetsAt)}</div>
          </div>
          <div class="token-bar-container">
            <div class="token-bar-track">
              <div class="token-bar-fill ${m.level}"></div>
            </div>
            <div class="token-bar-label ${m.level}">${formatLevel(m.level)}</div>
            <button class="notif-btn ${m.notifEnabled ? 'active' : ''}" data-acc="${id}" data-model="${m.name}" title="Avisar quando renovar">🔔</button>
          </div>
        </div>
      `).join('')}
      ${models.length === 0 ? '<div style="padding:1rem">Nenhum dado colado ainda.</div>' : ''}
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
  div.className = 'account-card';
  
  let globalDot = acc.weekly < 80 ? (acc.session < 70 ? 'full' : 'low') : 'empty';

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
        <div class="claude-usage-bar"><div class="claude-usage-fill ${acc.session > 80 ? 'warning' : ''}" style="width: ${acc.session}%"></div></div>
        <div class="claude-usage-meta">
          <span>${acc.session}% usado</span>
          <span>${getRefreshDisplay(acc.sessionRefresh)}</span>
        </div>
      </div>
      <div class="claude-section weekly">
        <div class="claude-section-label">Limite Semanal</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill ${acc.weekly > 90 ? 'critical' : (acc.weekly > 70 ? 'warning' : '')}" style="width: ${acc.weekly}%"></div></div>
        <div class="claude-usage-meta">
          <span>${acc.weekly}% usado</span>
          <span>${getRefreshDisplay(acc.weeklyRefresh)}</span>
        </div>
      </div>
    </div>
  `;
  return div;
}

function formatLevel(level) {
  if (level === 'full') return 'Cheio';
  if (level === 'medium') return 'Médio';
  if (level === 'low') return 'Baixo';
  return 'Zerado';
}
