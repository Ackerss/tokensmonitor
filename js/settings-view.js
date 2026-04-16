// js/settings-view.js
import { loadSettings, saveSettings, getToken, getGistId } from './settings.js';
import { testConnection } from './gist.js';
import { showView } from './app.js';

export function initSettingsView() {
  const current = loadSettings();
  
  const tokenInput = document.getElementById('settings-token');
  const gistIdInput = document.getElementById('settings-gist-id');
  const msgEl = document.getElementById('settings-msg');
  
  tokenInput.value = current.token || '';
  gistIdInput.value = current.gistId || '';

  // Advange buttons logic
  const notifGroup = document.querySelectorAll('#notif-advance-group .btn');
  notifGroup.forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.value) === current.notifAdvance) {
      btn.classList.add('active');
    }
    btn.onclick = () => {
      notifGroup.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });

  // Action test
  document.getElementById('btn-settings-test').onclick = async () => {
    const tk = tokenInput.value.trim();
    msgEl.classList.remove('hidden', 'success', 'error');
    msgEl.textContent = 'Testando...';
    try {
      const u = await testConnection(tk);
      msgEl.textContent = `OK! Conectado como ${u.login}.`;
      msgEl.classList.add('success');
    } catch (e) {
      msgEl.textContent = 'Falha: ' + e.message;
      msgEl.classList.add('error');
    }
  };

  // Action save
  document.getElementById('btn-settings-save').onclick = () => {
    const actBtn = document.querySelector('#notif-advance-group .btn.active');
    const notifAdv = actBtn ? parseInt(actBtn.dataset.value) : 0;
    
    saveSettings({
      token: tokenInput.value.trim(),
      notifAdvance: notifAdv
    });
    
    msgEl.classList.remove('hidden', 'success', 'error');
    msgEl.textContent = 'Salvo! (Talvez precise recarregar para aplicar tudo)';
    msgEl.classList.add('success');
  };

  document.getElementById('btn-settings-back').onclick = () => {
    msgEl.classList.add('hidden');
    showView('view-dashboard');
  };
}
