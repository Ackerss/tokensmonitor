# TokensMonitor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um app web estático no GitHub Pages para monitorar quotas de modelos de IA (Antigravity + Claude Code) com atualização via colagem de texto e persistência no GitHub Gist.

**Architecture:** Single-page app (HTML + CSS + JS puro), sem framework nem build step. Dados em GitHub Gist privado via API REST. GitHub Pages para hospedagem. Módulos JS separados por responsabilidade.

**Tech Stack:** HTML5, CSS3 (variáveis CSS, flexbox, grid), JavaScript ES6 (módulos via `<script type="module">`), GitHub REST API v3, Web Notifications API.

**Spec:** `docs/superpowers/specs/2026-04-16-tokensmonitor-design.md`

**Repo:** https://github.com/Ackerss/tokensmonitor
**URL final:** https://ackerss.github.io/tokensmonitor

---

## Chunk 1: Estrutura do Projeto e Fundação Visual

### Task 1: Scaffold do Projeto

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `README.md`

- [ ] **Step 1: Criar index.html com estrutura base**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TokensMonitor — Monitor de Quotas de IA</title>
  <meta name="description" content="Monitore os tokens e quotas das suas contas Antigravity e Claude Code em um só lugar." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <header id="app-header">
    <div class="header-inner">
      <div class="header-brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">TokensMonitor</span>
      </div>
      <div class="header-actions">
        <button id="btn-paste" class="btn btn-primary">📋 Colar Atualização</button>
        <button id="btn-settings" class="btn btn-ghost">⚙️</button>
      </div>
    </div>
  </header>

  <main id="app-main">
    <section id="view-setup" class="view hidden">
      <div class="setup-card">
        <h1>Configurar TokensMonitor</h1>
        <p>Cole seu GitHub Personal Access Token para começar.</p>
        <div class="field-group">
          <label for="input-token">GitHub Personal Access Token</label>
          <input type="password" id="input-token" placeholder="ghp_..." />
          <small>Permissão necessária: <code>gist</code>. <a href="https://github.com/settings/tokens/new?scopes=gist&description=TokensMonitor" target="_blank">Criar token aqui ↗</a></small>
        </div>
        <button id="btn-setup-save" class="btn btn-primary btn-full">Salvar e Conectar</button>
        <p id="setup-error" class="error-msg hidden"></p>
      </div>
    </section>

    <section id="view-dashboard" class="view hidden">
      <div id="dashboard-grid" class="dashboard-grid"></div>
      <p id="dashboard-empty" class="empty-state hidden">
        Nenhuma conta ainda. Clique em "📋 Colar Atualização" para começar.
      </p>
    </section>

    <section id="view-settings" class="view hidden">
      <div class="settings-card">
        <h2>Configurações</h2>
        <div class="field-group">
          <label for="settings-token">GitHub Personal Access Token</label>
          <input type="password" id="settings-token" />
        </div>
        <div class="field-group">
          <label for="settings-gist-id">Gist ID (auto-gerenciado)</label>
          <input type="text" id="settings-gist-id" readonly />
        </div>
        <div class="field-group">
          <label>Aviso antecipado de notificações</label>
          <div class="btn-group" id="notif-advance-group">
            <button class="btn btn-sm" data-value="0">Desligado</button>
            <button class="btn btn-sm" data-value="15">15 min antes</button>
            <button class="btn btn-sm" data-value="30">30 min antes</button>
          </div>
        </div>
        <div class="settings-actions">
          <button id="btn-settings-test" class="btn btn-ghost">Testar Conexão</button>
          <button id="btn-settings-save" class="btn btn-primary">Salvar</button>
        </div>
        <button id="btn-settings-back" class="btn btn-ghost btn-full" style="margin-top:1rem">← Voltar ao Dashboard</button>
        <p id="settings-msg" class="msg hidden"></p>
      </div>
    </section>
  </main>

  <div id="modal-paste" class="modal-overlay hidden">
    <div class="modal">
      <div class="modal-header">
        <h3>Colar Atualização</h3>
        <button id="modal-paste-close" class="btn-icon">✕</button>
      </div>
      <div id="modal-paste-body"></div>
    </div>
  </div>

  <div id="loading-overlay" class="modal-overlay hidden">
    <div class="loading-spinner">⚡</div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar css/style.css com todo o design system**

O arquivo CSS deve incluir (na ordem abaixo):
1. Variáveis CSS (`:root`) — cores, espaçamentos, fontes, sombras
2. Reset e base
3. Header fixo com glassmorphism
4. Botões (primary, ghost, icon, sm, full, btn-group)
5. Dashboard grid responsivo
6. Account card + card-header + card-body
7. Model row com token-bar (fill da esquerda=vazio para direita=cheio)
8. Card especial Claude Code (claude-section session/weekly)
9. Setup card e Settings card
10. Modal overlay + modal inner
11. Modal textarea, detect badge, usage picker (4 opções em grid), preview table
12. Loading spinner com animação de rotação
13. Empty state
14. Media query mobile (max-width: 600px)

**Paleta de cores principais:**
```css
:root {
  --bg-base: #0d0f14;
  --bg-card: #161a24;
  --bg-card-hover: #1c2130;
  --bg-input: #1e2436;
  --border: #2a3045;
  --border-focus: #4a6fa5;
  --text-primary: #e8eaf0;
  --text-secondary: #8892a4;
  --text-muted: #555f74;
  --color-full: #22c55e;
  --color-medium: #eab308;
  --color-low: #ef4444;
  --color-empty: #374151;
  --accent: #4a6fa5;
  --font: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 3: Criar js/app.js (inicialização e roteamento)**

```javascript
// js/app.js
import { loadSettings, saveSettings, getToken, getGistId, setGistId } from './settings.js';
import { loadData, saveData, createGist } from './gist.js';
import { renderDashboard } from './dashboard.js';
import { initPasteModal } from './paste-modal.js';
import { initNotifications } from './notifications.js';
import { initSettingsView } from './settings-view.js';

export let appData = { accounts: {} };
export function setAppData(data) { appData = data; }

export function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

export function showLoading(on) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !on);
}

async function init() {
  loadSettings();
  const token = getToken();

  if (!token) { showView('view-setup'); setupFirstRun(); return; }

  showLoading(true);
  try {
    let gistId = getGistId();
    if (!gistId) { gistId = await createGist(token); setGistId(gistId); }
    appData = await loadData(token, gistId);
    renderDashboard(appData);
    showView('view-dashboard');
    initNotifications(appData);
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar. Verifique seu token em ⚙️ Configurações.');
    showView('view-setup');
    setupFirstRun();
  } finally {
    showLoading(false);
  }

  setInterval(() => renderDashboard(appData), 60_000);
}

function setupFirstRun() {
  document.getElementById('btn-setup-save').addEventListener('click', async () => {
    const token = document.getElementById('input-token').value.trim();
    const errEl = document.getElementById('setup-error');
    errEl.classList.add('hidden');
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      errEl.textContent = 'Token inválido. Deve começar com ghp_ ou github_pat_';
      errEl.classList.remove('hidden');
      return;
    }
    showLoading(true);
    try {
      const gistId = await createGist(token);
      saveSettings({ token, gistId, notifAdvance: 0 });
      setGistId(gistId);
      appData = await loadData(token, gistId);
      renderDashboard(appData);
      showView('view-dashboard');
      initNotifications(appData);
    } catch (err) {
      errEl.textContent = 'Falha ao conectar: ' + err.message;
      errEl.classList.remove('hidden');
    } finally {
      showLoading(false);
    }
  });
}

document.getElementById('btn-paste').addEventListener('click', () => initPasteModal());
document.getElementById('btn-settings').addEventListener('click', () => {
  initSettingsView();
  showView('view-settings');
});

init();
```

- [ ] **Step 4: Commit inicial**
```bash
git add index.html css/style.css js/app.js README.md
git commit -m "feat: scaffold — HTML, CSS design system, app.js"
```

---

## Chunk 2: Módulo de Dados (GitHub Gist API)

### Task 2: settings.js + gist.js

**Files:**
- Create: `js/settings.js`
- Create: `js/gist.js`

- [ ] **Step 1: Criar js/settings.js**

```javascript
// js/settings.js
const KEYS = { TOKEN: 'tm_token', GIST_ID: 'tm_gist_id', NOTIF_ADVANCE: 'tm_notif_advance' };
let _s = {};

export function loadSettings() {
  _s = {
    token: localStorage.getItem(KEYS.TOKEN) || '',
    gistId: localStorage.getItem(KEYS.GIST_ID) || '',
    notifAdvance: parseInt(localStorage.getItem(KEYS.NOTIF_ADVANCE) || '0'),
  };
  return _s;
}
export function saveSettings({ token, gistId, notifAdvance }) {
  if (token !== undefined)       { localStorage.setItem(KEYS.TOKEN, token); _s.token = token; }
  if (gistId !== undefined)      { localStorage.setItem(KEYS.GIST_ID, gistId); _s.gistId = gistId; }
  if (notifAdvance !== undefined){ localStorage.setItem(KEYS.NOTIF_ADVANCE, notifAdvance); _s.notifAdvance = notifAdvance; }
}
export const getToken        = () => _s.token;
export const getGistId       = () => _s.gistId;
export const getNotifAdvance = () => _s.notifAdvance;
export const setGistId       = (id) => saveSettings({ gistId: id });
```

- [ ] **Step 2: Criar js/gist.js**

```javascript
// js/gist.js
const FILENAME = 'tokensmonitor-data.json';
const API = 'https://api.github.com';

function h(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function createGist(token) {
  // Tenta encontrar gist existente
  const list = await fetch(`${API}/gists`, { headers: h(token) });
  if (!list.ok) throw new Error(`GitHub API ${list.status}: ${list.statusText}`);
  const gists = await list.json();
  const found = gists.find(g => g.files?.[FILENAME]);
  if (found) return found.id;

  // Cria novo
  const res = await fetch(`${API}/gists`, {
    method: 'POST', headers: h(token),
    body: JSON.stringify({
      description: 'TokensMonitor — quotas de modelos de IA',
      public: false,
      files: { [FILENAME]: { content: JSON.stringify({ accounts: {}, lastUpdated: new Date().toISOString() }, null, 2) } }
    })
  });
  if (!res.ok) throw new Error(`Erro ao criar Gist: ${res.status}`);
  return (await res.json()).id;
}

export async function loadData(token, gistId) {
  const res = await fetch(`${API}/gists/${gistId}`, { headers: h(token) });
  if (!res.ok) throw new Error(`Erro ao carregar: ${res.status}`);
  const gist = await res.json();
  const raw = gist.files[FILENAME]?.content;
  return raw ? JSON.parse(raw) : { accounts: {} };
}

export async function saveData(token, gistId, data) {
  data.lastUpdated = new Date().toISOString();
  const res = await fetch(`${API}/gists/${gistId}`, {
    method: 'PATCH', headers: h(token),
    body: JSON.stringify({ files: { [FILENAME]: { content: JSON.stringify(data, null, 2) } } })
  });
  if (!res.ok) throw new Error(`Erro ao salvar: ${res.status}`);
}

export async function testConnection(token) {
  const res = await fetch(`${API}/user`, { headers: h(token) });
  return res.ok;
}
```

- [ ] **Step 3: Commit**
```bash
git add js/settings.js js/gist.js
git commit -m "feat: settings.js + gist.js — localStorage e GitHub Gist API"
```

---

## Chunk 3: Parser de Texto

### Task 3: parser.js

**Files:**
- Create: `js/parser.js`

- [ ] **Step 1: Criar js/parser.js**

```javascript
// js/parser.js

export function detectPlatform(text) {
  const t = text.toLowerCase();
  if (t.includes('refreshes in'))                              return 'antigravity';
  if (t.includes('limites semanais') || t.includes('sessão atual') || t.includes('sessao atual')) return 'claudecode';
  return 'unknown';
}

const MODEL_MAP = {
  'gemini 3.1 pro (high)':        'gemini_pro_high',
  'gemini 3.1 pro':               'gemini_pro_high',
  'gemini 3 flash':               'gemini_flash',
  'claude sonnet 4.6 (thinking)': 'claude_sonnet',
  'claude sonnet 4.6':            'claude_sonnet',
  'claude opus 4.6 (thinking)':   'claude_opus',
  'claude opus 4.6':              'claude_opus',
};

export function parseAntigravity(text) {
  const results = [];
  const pattern = /^(.+?)\s*\nRefreshes in (.+)$/gim;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const rawName = match[1].trim();
    const modelKey = MODEL_MAP[rawName.toLowerCase()];
    if (!modelKey) continue;
    const ms = parseDuration(match[2].trim());
    if (ms === null) continue;
    results.push({ modelKey, modelName: rawName, refreshesAt: new Date(Date.now() + ms).toISOString() });
  }
  return results;
}

export function parseClaudeCode(text) {
  const sessionMatch = text.match(/Sess[aã]o atual[\s\S]*?(\d+)%\s*usado/i);
  const weeklyPctMatch = text.match(/Todos os modelos[\s\S]*?(\d+)%\s*usado/i);
  const refreshMatch = text.match(/Reinicia\s+(\w+)\.?,?\s*(\d{1,2}):(\d{2})/i);

  let refreshesAt = null;
  if (refreshMatch) {
    refreshesAt = nextWeekdayAt(
      refreshMatch[1].toLowerCase(),
      parseInt(refreshMatch[2]),
      parseInt(refreshMatch[3])
    ).toISOString();
  }

  return {
    session: { usagePercent: sessionMatch ? parseInt(sessionMatch[1]) : 0 },
    weekly:  { usagePercent: weeklyPctMatch ? parseInt(weeklyPctMatch[1]) : 0, refreshesAt }
  };
}

export function parseDuration(str) {
  let ms = 0;
  const d = str.match(/(\d+)\s+days?/i);
  const h = str.match(/(\d+)\s+hours?/i);
  const m = str.match(/(\d+)\s+minutes?/i);
  if (!d && !h && !m) return null;
  if (d) ms += parseInt(d[1]) * 86_400_000;
  if (h) ms += parseInt(h[1]) * 3_600_000;
  if (m) ms += parseInt(m[1]) * 60_000;
  return ms;
}

const DAY_MAP = {
  seg:1, mon:1, segunda:1, ter:2, tue:2, terca:2,
  qua:3, wed:3, quarta:3,  qui:4, thu:4, quinta:4,
  sex:5, fri:5, sexta:5,   sab:6, sat:6, sabado:6,
  dom:0, sun:0, domingo:0,
};

function nextWeekdayAt(dayName, hour, min) {
  const target = DAY_MAP[dayName.replace(/[.\s]/g, '')];
  if (target === undefined) return new Date(Date.now() + 7 * 86_400_000);
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, min, 0, 0);
  let diff = target - now.getDay();
  if (diff < 0 || (diff === 0 && d <= now)) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}
```

- [ ] **Step 2: Commit**
```bash
git add js/parser.js
git commit -m "feat: parser.js — parsing Antigravity e Claude Code"
```

---

## Chunk 4: Dashboard — Cards com Contadores ao Vivo

### Task 4: time-utils.js + dashboard.js

**Files:**
- Create: `js/time-utils.js`
- Create: `js/dashboard.js`

- [ ] **Step 1: Criar js/time-utils.js**

```javascript
// js/time-utils.js
export function formatRefreshTime(iso) {
  if (!iso) return 'Desconhecido';
  const date = new Date(iso);
  const now = new Date();
  const msLeft = date - now;
  if (msLeft < 0) return 'Renovado ✓';

  const days  = Math.floor(msLeft / 86_400_000);
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const mins  = Math.floor((msLeft % 3_600_000) / 60_000);
  const time  = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = date.toDateString() === now.toDateString();
  const tom   = date.toDateString() === new Date(now.getTime() + 86_400_000).toDateString();
  const wd    = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','');
  const dt    = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const when = today ? `hoje às ${time}` : tom ? `amanhã às ${time}` : `${wd}, ${dt} às ${time}`;
  const cd   = days > 0 ? `em ${days}d${hours>0?` ${hours}h`:''}` :
               hours > 0 ? `em ${hours}h${mins>0?` ${mins}min`:''}` :
               mins > 0  ? `em ${mins}min` : 'agora';
  return `${when} (${cd})`;
}

export function refreshClass(iso) {
  if (!iso) return '';
  const ms = new Date(iso) - Date.now();
  if (ms <= 0)              return 'very-soon';
  if (ms <= 3_600_000)      return 'very-soon';
  if (ms <= 2 * 3_600_000)  return 'soon';
  return '';
}
```

- [ ] **Step 2: Criar js/dashboard.js**

```javascript
// js/dashboard.js
import { formatRefreshTime, refreshClass } from './time-utils.js';
import { getToken, getGistId } from './settings.js';
import { saveData } from './gist.js';
import { appData, setAppData } from './app.js';

const MODELS = ['gemini_pro_high','gemini_flash','claude_sonnet','claude_opus'];
const MODEL_LABELS = {
  gemini_pro_high: 'Gemini 3.1 Pro (High)',
  gemini_flash:    'Gemini 3 Flash',
  claude_sonnet:   'Claude Sonnet 4.6 (Thinking)',
  claude_opus:     'Claude Opus 4.6 (Thinking)',
};
const USAGE = {
  full:   { label:'🟢 Cheio',       cls:'full',   w:'100%' },
  medium: { label:'🟡 Médio',       cls:'medium', w:'55%'  },
  low:    { label:'🔴 Quase vazio', cls:'low',    w:'15%'  },
  empty:  { label:'⚫ Zerado',      cls:'empty',  w:'3%'   },
};

export function renderDashboard(data) {
  const grid  = document.getElementById('dashboard-grid');
  const empty = document.getElementById('dashboard-empty');
  grid.innerHTML = '';
  const ids = Object.keys(data.accounts || {});
  if (!ids.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  ids.sort((a,b) => score(data.accounts[b]) - score(data.accounts[a]))
     .forEach(id => grid.appendChild(
       data.accounts[id].platform === 'claudecode'
         ? buildClaude(id, data.accounts[id])
         : buildAG(id, data.accounts[id])
     ));
}

function score(acct) {
  if (acct.platform === 'claudecode') return 100 - (acct.weekly?.usagePercent ?? 100);
  const vals = { full:3, medium:2, low:1, empty:0 };
  const ms = Object.values(acct.models || {});
  return ms.length ? ms.reduce((s,m) => s + (vals[m.usageLevel]??0), 0) / ms.length * 33 : 0;
}

function dot(acct) {
  if (acct.platform === 'claudecode') {
    const p = acct.weekly?.usagePercent ?? 0;
    return p>=90?'empty': p>=70?'low': p>=40?'medium':'full';
  }
  const ms = Object.values(acct.models||{});
  const c  = {full:0,medium:0,low:0,empty:0};
  ms.forEach(m => c[m.usageLevel||'empty']++);
  return ms.length && c.full >= ms.length/2 ? 'full' : c.medium>0?'medium': c.low>0?'low':'empty';
}

function updAt(acct) {
  if (!acct.updatedAt) return '';
  return new Date(acct.updatedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}

function buildAG(id, acct) {
  const card = document.createElement('div');
  card.className = 'account-card';
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span class="card-status-dot ${dot(acct)}"></span>${acct.displayName}
      </div>
      <span class="card-updated">${updAt(acct)}</span>
    </div>
    <div class="card-body" id="cb-${id}"></div>`;

  const body = card.querySelector(`#cb-${id}`);
  MODELS.forEach(key => {
    const m = (acct.models||{})[key] || {};
    const u = USAGE[m.usageLevel] || USAGE.empty;
    const rc = refreshClass(m.refreshesAt);
    const row = document.createElement('div');
    row.className = 'model-row';
    row.innerHTML = `
      <div class="model-row-top">
        <span class="model-name">${MODEL_LABELS[key]}</span>
        <button class="notif-btn ${m.notifyEnabled?'active':''}" data-acc="${id}" data-mod="${key}" title="Notificar">🔔</button>
      </div>
      <div class="token-bar-container">
        <div class="token-bar-track"><div class="token-bar-fill ${u.cls}" style="width:${u.w}"></div></div>
        <span class="token-bar-label ${u.cls}">${u.label}</span>
      </div>
      <span class="model-refresh ${rc}">${m.refreshesAt ? formatRefreshTime(m.refreshesAt) : 'Não atualizado'}</span>`;
    row.querySelector('.notif-btn').addEventListener('click', e => toggleN(e.currentTarget, id, key));
    body.appendChild(row);
  });
  return card;
}

function buildClaude(id, acct) {
  const sp  = acct.session?.usagePercent ?? 0;
  const wp  = acct.weekly?.usagePercent  ?? 0;
  const wcls = wp>=80?'critical': wp>=60?'warning':'';
  const card = document.createElement('div');
  card.className = 'account-card';
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span class="card-status-dot ${dot(acct)}"></span>${acct.displayName||'Claude Code'}
      </div>
      <span class="card-updated">${updAt(acct)}</span>
    </div>
    <div class="card-body">
      <div class="claude-section session">
        <div class="claude-section-label">⚡ Sessão Atual</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill" style="width:${sp}%"></div></div>
        <div class="claude-usage-meta"><span>${sp}% usado</span><span>Reseta em ~5h</span></div>
      </div>
      <div class="claude-section weekly">
        <div class="claude-section-label">🚨 Limite Semanal</div>
        <div class="claude-usage-bar"><div class="claude-usage-fill ${wcls}" style="width:${wp}%"></div></div>
        <div class="claude-usage-meta">
          <span>${wp}% usado</span>
          <div style="display:flex;align-items:center;gap:.4rem">
            <span>${acct.weekly?.refreshesAt ? formatRefreshTime(acct.weekly.refreshesAt) : 'Não atualizado'}</span>
            <button class="notif-btn ${acct.weekly?.notifyEnabled?'active':''}" data-acc="${id}" data-sec="weekly" title="Notificar">🔔</button>
          </div>
        </div>
      </div>
    </div>`;
  card.querySelector('.notif-btn').addEventListener('click', e => toggleNC(e.currentTarget, id));
  return card;
}

async function toggleN(btn, accId, modelKey) {
  const m = appData.accounts[accId].models[modelKey];
  m.notifyEnabled = !m.notifyEnabled;
  btn.classList.toggle('active', m.notifyEnabled);
  if (m.notifyEnabled && Notification.permission === 'default') await Notification.requestPermission();
  await saveData(getToken(), getGistId(), appData);
}
async function toggleNC(btn, accId) {
  const w = appData.accounts[accId].weekly;
  w.notifyEnabled = !w.notifyEnabled;
  btn.classList.toggle('active', w.notifyEnabled);
  if (w.notifyEnabled && Notification.permission === 'default') await Notification.requestPermission();
  await saveData(getToken(), getGistId(), appData);
}
```

- [ ] **Step 3: Commit**
```bash
git add js/time-utils.js js/dashboard.js
git commit -m "feat: dashboard.js + time-utils.js — cards e contadores ao vivo"
```

---

## Chunk 5: Modal de Colagem

### Task 5: paste-modal.js

**Files:**
- Create: `js/paste-modal.js`

- [ ] **Step 1: Criar js/paste-modal.js**

O modal tem 3 etapas sequenciais:

**Etapa 1** — Textarea para colar + detecção automática de plataforma ao digitar + botão "Próximo →"

**Etapa 2 Antigravity** — Badge de confirmação + dropdown de conta + usage picker (4 opções em grid, ordem: Zerado | Quase vazio | Médio | Cheio, esquerda→direita) + preview em tabela + botões Voltar/Confirmar

**Etapa 2 Claude Code** — Badge + preview direto (sessão %, semanal %, data de reinício) + botões Voltar/Confirmar

```javascript
// js/paste-modal.js
import { detectPlatform, parseAntigravity, parseClaudeCode } from './parser.js';
import { getToken, getGistId } from './settings.js';
import { saveData } from './gist.js';
import { appData, setAppData } from './app.js';
import { renderDashboard } from './dashboard.js';

const AG_ACCOUNTS = [
  { id:'jacsonsax',    name:'jacsonsax'     },
  { id:'jacsonduarte', name:'JacsonADuarte' },
  { id:'natubrava',    name:'Natubrava'      },
  { id:'fenixbrj',     name:'fenixbrj'       },
  { id:'ana',          name:'ANA'            },
];

let _platform='unknown', _parsed=null, _account=null, _usage=null;

export function initPasteModal() {
  _platform='unknown'; _parsed=null; _account=null; _usage=null;
  const modal = document.getElementById('modal-paste');
  modal.classList.remove('hidden');
  renderStep1();
  document.getElementById('modal-paste-close').onclick = closeModal;
  modal.onclick = e => { if(e.target===modal) closeModal(); };
}

function closeModal() {
  document.getElementById('modal-paste').classList.add('hidden');
}

function renderStep1() {
  const body = document.getElementById('modal-paste-body');
  body.innerHTML = `
    <div class="modal-body">
      <div>
        <label style="font-size:.85rem;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:.4rem">Cole o texto copiado da plataforma:</label>
        <textarea id="paste-ta" class="modal-textarea" placeholder="Cole aqui o texto da tela de quotas..."></textarea>
      </div>
      <div id="detect-result" style="min-height:28px"></div>
      <div style="display:flex;justify-content:flex-end">
        <button id="btn-next" class="btn btn-primary">Próximo →</button>
      </div>
    </div>`;

  document.getElementById('paste-ta').addEventListener('input', e => {
    const p = detectPlatform(e.target.value);
    const el = document.getElementById('detect-result');
    if (!el) return;
    if (p==='antigravity') el.innerHTML=`<span class="detect-badge antigravity">🔍 Detectado: Antigravity</span>`;
    else if (p==='claudecode') el.innerHTML=`<span class="detect-badge claudecode">🔍 Detectado: Claude Code</span>`;
    else if (e.target.value.length>20) el.innerHTML=`<span class="detect-badge unknown">⚠️ Formato não reconhecido</span>`;
    else el.innerHTML='';
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    const text = document.getElementById('paste-ta').value.trim();
    if (!text) return;
    _platform = detectPlatform(text);
    if (_platform === 'antigravity')  { _parsed = parseAntigravity(text); renderStep2AG(); }
    else if (_platform === 'claudecode') { _parsed = parseClaudeCode(text); renderStep2CC(); }
    else alert('Formato não reconhecido. Cole o texto exatamente como aparece na plataforma.');
  });
}

function renderStep2AG() {
  const body = document.getElementById('modal-paste-body');
  const opts = AG_ACCOUNTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  body.innerHTML = `
    <div class="modal-body">
      <span class="detect-badge antigravity">🔍 Antigravity — ${_parsed.length} modelo(s) detectado(s)</span>
      <div class="field-group">
        <label>Qual conta você está atualizando?</label>
        <select id="acct-sel" style="background:var(--bg-input);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);padding:.6rem .8rem;font-family:var(--font);font-size:.875rem;width:100%">
          <option value="">— Selecione —</option>${opts}
        </select>
      </div>
      <div class="field-group">
        <label>Como estavam as barras de uso?</label>
        <div class="usage-picker">
          <div class="usage-option" data-level="empty"><span class="usage-option-icon">⚫</span><span>Zerado</span></div>
          <div class="usage-option" data-level="low"><span class="usage-option-icon">🔴</span><span>Quase vazio</span></div>
          <div class="usage-option" data-level="medium"><span class="usage-option-icon">🟡</span><span>Médio</span></div>
          <div class="usage-option" data-level="full"><span class="usage-option-icon">🟢</span><span>Cheio</span></div>
        </div>
        <small style="color:var(--text-muted)">← vazio &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; cheio →</small>
      </div>
      <div id="ag-preview" class="hidden">
        <table class="preview-table">
          <thead><tr><th>Modelo</th><th>Renova em</th></tr></thead>
          <tbody id="ag-tbody"></tbody>
        </table>
      </div>
      <div style="display:flex;gap:.75rem;justify-content:flex-end">
        <button id="btn-back" class="btn btn-ghost">← Voltar</button>
        <button id="btn-confirm" class="btn btn-primary">✓ Confirmar</button>
      </div>
    </div>`;

  body.querySelectorAll('.usage-option').forEach(opt => {
    opt.addEventListener('click', () => {
      body.querySelectorAll('.usage-option').forEach(o => o.classList.remove('selected','full','medium','low','empty'));
      _usage = opt.dataset.level;
      opt.classList.add('selected', _usage);
      updatePreview();
    });
  });
  document.getElementById('acct-sel').addEventListener('change', e => { _account=e.target.value; updatePreview(); });
  document.getElementById('btn-back').addEventListener('click', initPasteModal);
  document.getElementById('btn-confirm').addEventListener('click', confirmAG);
}

function updatePreview() {
  if (!_account || !_usage) return;
  document.getElementById('ag-preview').classList.remove('hidden');
  document.getElementById('ag-tbody').innerHTML = _parsed.map(m=>`
    <tr><td>${m.modelName}</td><td>${new Date(m.refreshesAt).toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td></tr>
  `).join('');
}

async function confirmAG() {
  if (!_account) { alert('Selecione a conta.'); return; }
  if (!_usage)   { alert('Selecione o nível de uso.'); return; }
  const info = AG_ACCOUNTS.find(a=>a.id===_account);
  const data = appData;
  if (!data.accounts[_account]) data.accounts[_account] = { platform:'antigravity', displayName:info?.name||_account, models:{} };
  const acct = data.accounts[_account];
  acct.updatedAt = new Date().toISOString();
  _parsed.forEach(({modelKey, refreshesAt}) => {
    acct.models[modelKey] = { ...(acct.models[modelKey]||{}), usageLevel:_usage, refreshesAt, updatedAt:new Date().toISOString() };
  });
  try { await saveData(getToken(),getGistId(),data); setAppData(data); renderDashboard(data); closeModal(); }
  catch(e) { alert('Erro ao salvar: '+e.message); }
}

function renderStep2CC() {
  const body = document.getElementById('modal-paste-body');
  const {session,weekly} = _parsed;
  const dateStr = weekly.refreshesAt
    ? new Date(weekly.refreshesAt).toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
    : 'Desconhecido';
  body.innerHTML = `
    <div class="modal-body">
      <span class="detect-badge claudecode">🔍 Claude Code detectado</span>
      <table class="preview-table">
        <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Sessão atual</td><td>${session.usagePercent}% usado</td></tr>
          <tr><td>Limite semanal</td><td>${weekly.usagePercent}% usado</td></tr>
          <tr><td>Reinicia em</td><td>${dateStr}</td></tr>
        </tbody>
      </table>
      <div style="display:flex;gap:.75rem;justify-content:flex-end">
        <button id="btn-back" class="btn btn-ghost">← Voltar</button>
        <button id="btn-confirm" class="btn btn-primary">✓ Confirmar</button>
      </div>
    </div>`;
  document.getElementById('btn-back').addEventListener('click', initPasteModal);
  document.getElementById('btn-confirm').addEventListener('click', confirmCC);
}

async function confirmCC() {
  const data = appData;
  if (!data.accounts.claude_code) data.accounts.claude_code = { platform:'claudecode', displayName:'Claude Code' };
  const acct = data.accounts.claude_code;
  acct.updatedAt = new Date().toISOString();
  acct.session = { ...(acct.session||{}), usagePercent:_parsed.session.usagePercent, updatedAt:new Date().toISOString() };
  acct.weekly  = { ...(acct.weekly||{}),  usagePercent:_parsed.weekly.usagePercent, refreshesAt:_parsed.weekly.refreshesAt, updatedAt:new Date().toISOString() };
  try { await saveData(getToken(),getGistId(),data); setAppData(data); renderDashboard(data); closeModal(); }
  catch(e) { alert('Erro ao salvar: '+e.message); }
}
```

- [ ] **Step 2: Commit**
```bash
git add js/paste-modal.js
git commit -m "feat: paste-modal.js — colagem, parsing e confirmação"
```

---

## Chunk 6: Notificações e Tela de Configurações

### Task 6: notifications.js + settings-view.js

**Files:**
- Create: `js/notifications.js`
- Create: `js/settings-view.js`

- [ ] **Step 1: Criar js/notifications.js**

```javascript
// js/notifications.js
import { getNotifAdvance } from './settings.js';

const MODEL_LABELS = {
  gemini_pro_high:'Gemini 3.1 Pro (High)', gemini_flash:'Gemini 3 Flash',
  claude_sonnet:'Claude Sonnet 4.6',       claude_opus:'Claude Opus 4.6',
};
let _timers = [];

export function initNotifications(data) {
  _timers.forEach(clearInterval);
  _timers = [];
  if (Notification.permission !== 'granted') return;
  const adv = getNotifAdvance() * 60_000;

  Object.entries(data.accounts||{}).forEach(([id, acct]) => {
    if (acct.platform === 'antigravity') {
      Object.entries(acct.models||{}).forEach(([mkey, m]) => {
        if (!m.notifyEnabled || !m.refreshesAt) return;
        _timers.push(scheduleAt(
          new Date(m.refreshesAt), adv,
          `✅ Renovado: ${MODEL_LABELS[mkey]||mkey}`,
          `Conta ${acct.displayName} — ${MODEL_LABELS[mkey]} disponível!`
        ));
      });
    } else if (acct.platform === 'claudecode') {
      const wp = acct.weekly?.usagePercent ?? 0;
      if (wp >= 80) new Notification(wp>=100?'🚨 Limite semanal ESGOTADO':'⚠️ Limite semanal 80%+', {
        body: `Claude Code: ${wp}% do limite semanal usado.`
      });
      if (acct.weekly?.notifyEnabled && acct.weekly?.refreshesAt) {
        _timers.push(scheduleAt(
          new Date(acct.weekly.refreshesAt), adv,
          '✅ Claude Code semanal renovado',
          'Seu limite semanal foi reiniciado!'
        ));
      }
    }
  });
}

function scheduleAt(date, advance, title, body) {
  return setInterval(() => {
    const now = Date.now();
    const t   = date.getTime();
    if (advance > 0 && Math.abs(now - (t - advance)) < 60_000)
      new Notification(`⏰ ${title} em breve`, { body: `Faltam ${advance/60_000}min. ${body}` });
    if (Math.abs(now - t) < 60_000) new Notification(title, { body });
  }, 60_000);
}
```

- [ ] **Step 2: Criar js/settings-view.js**

```javascript
// js/settings-view.js
import { getToken, getGistId, getNotifAdvance, saveSettings } from './settings.js';
import { testConnection } from './gist.js';
import { showView } from './app.js';

export function initSettingsView() {
  document.getElementById('settings-token').value   = getToken();
  document.getElementById('settings-gist-id').value = getGistId();

  const adv = getNotifAdvance();
  document.querySelectorAll('#notif-advance-group .btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value) === adv);
    btn.addEventListener('click', () => {
      document.querySelectorAll('#notif-advance-group .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('btn-settings-test').addEventListener('click', async () => {
    const ok = await testConnection(document.getElementById('settings-token').value.trim());
    showMsg(ok ? '✅ Conexão OK!' : '❌ Token inválido.', ok ? 'success' : 'error');
  });

  document.getElementById('btn-settings-save').addEventListener('click', () => {
    const token = document.getElementById('settings-token').value.trim();
    const active = document.querySelector('#notif-advance-group .btn.active');
    saveSettings({ token, notifAdvance: active ? parseInt(active.dataset.value) : 0 });
    showMsg('✅ Configurações salvas!', 'success');
  });

  document.getElementById('btn-settings-back').addEventListener('click', () => showView('view-dashboard'));
}

function showMsg(text, cls) {
  const el = document.getElementById('settings-msg');
  el.textContent = text;
  el.className = `msg ${cls}`;
  el.classList.remove('hidden');
}
```

- [ ] **Step 3: Commit**
```bash
git add js/notifications.js js/settings-view.js
git commit -m "feat: notifications.js + settings-view.js"
```

---

## Chunk 7: Deploy GitHub Pages + Validação Final

### Task 7: Deploy e testes

- [ ] **Step 1: Push de todos os arquivos**
```bash
git push origin main
```

- [ ] **Step 2: Habilitar GitHub Pages**
```
GitHub → https://github.com/Ackerss/tokensmonitor/settings/pages
Source: Deploy from a branch → Branch: main → /(root) → Save
```
Aguardar ~2 minutos → URL disponível: `https://ackerss.github.io/tokensmonitor`

- [ ] **Step 3: Criar GitHub Personal Access Token**
```
https://github.com/settings/tokens/new
  Description: TokensMonitor App
  Scopes: ✅ gist
  Expiration: No expiration
→ Generate token → copiar o valor
```

- [ ] **Step 4: Validar fluxo completo**

1. Abrir `https://ackerss.github.io/tokensmonitor`
2. ✅ Tela de setup aparece
3. ✅ Inserir token → conectar → Gist criado → dashboard vazio aparece
4. ✅ Clicar "📋 Colar Atualização" → colar texto Antigravity → detecta → selecionar conta Natubrava → selecionar nível → confirmar → card aparece com barra e countdown
5. ✅ Colar texto Claude Code → detecta → preview → confirmar → card Claude aparece
6. ✅ Abrir em outro browser/computador com mesmo token → dados aparecem (carregados do Gist)
7. ✅ Contadores atualizam automaticamente a cada 60s
8. ✅ Clicar 🔔 → solicita permissão de notificação → ativa

- [ ] **Step 5: Commit final**
```bash
git add .
git commit -m "feat: TokensMonitor v1.0 completo"
git push origin main
```

---

## Resumo de Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura HTML — views, modal, loading |
| `css/style.css` | Design system completo — tema escuro, cards, barras |
| `js/app.js` | Inicialização, roteamento de views, estado global |
| `js/settings.js` | localStorage wrapper — token, gistId, config |
| `js/gist.js` | GitHub Gist API — create/load/save/test |
| `js/parser.js` | Parsing dos textos Antigravity e Claude Code |
| `js/time-utils.js` | Formatação de datas e classes de urgência |
| `js/dashboard.js` | Renderização dos cards com contadores ao vivo |
| `js/paste-modal.js` | Modal de colagem — detecção, seleção, preview, save |
| `js/notifications.js` | Web Notifications + timers de 60s |
| `js/settings-view.js` | Tela de configurações |
