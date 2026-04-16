// js/app.js
import { loadSettings, saveSettings, getToken, getGistId, setGistId } from './settings.js';
import { loadData, saveData, createGist } from './gist.js';
import { renderDashboard } from './dashboard.js';
import { initPasteModal } from './paste-modal.js';
import { initNotifications } from './notifications.js';
import { initSettingsView } from './settings-view.js';

export let appData = { accounts: {} };

export function setAppData(data) {
  appData = data;
}

export function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

export function showLoading(on) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !on);
}

// Inicializa a aplicação
async function init() {
  loadSettings();
  const token = getToken();

  if (!token) {
    showView('view-setup');
    setupFirstRun();
    return;
  }

  showLoading(true);
  try {
    let gistId = getGistId();
    if (!gistId) {
      gistId = await createGist(token);
      setGistId(gistId);
    }
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

  // Atualiza contadores visualmente a cada minuto
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

// Botões do header
document.getElementById('btn-paste').addEventListener('click', () => {
  initPasteModal();
});

document.getElementById('btn-settings').addEventListener('click', () => {
  initSettingsView();
  showView('view-settings');
});

// Começar
init();
