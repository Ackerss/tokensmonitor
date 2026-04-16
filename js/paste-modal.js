// js/paste-modal.js
import { detectPlatform, parseAntigravity, parseClaudeCode } from './parser.js';
import { appData, setAppData } from './app.js';
import { saveData } from './gist.js';
import { getToken, getGistId } from './settings.js';
import { renderDashboard } from './dashboard.js';

let modalCtx = {
  rawText: '',
  platform: 'unknown',
  parsedData: null,
  selectedAccId: null,
  level: 'empty' // pro antigravity default picker
};

export function initPasteModal() {
  const modalObj = document.getElementById('modal-paste');
  const body = document.getElementById('modal-paste-body');
  
  modalObj.classList.remove('hidden');
  
  // Render step 1
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <p style="font-size:0.85rem; color:var(--text-secondary)">Cole o texto copiado da plataforma (CTRL+V ou use o campo abaixo).</p>
      <textarea id="modal-input-text" class="modal-textarea" placeholder="Cole aqui seu texto da quota..."></textarea>
    </div>
  `;

  const input = document.getElementById('modal-input-text');
  input.focus();

  input.addEventListener('input', (e) => {
    const text = e.target.value.trim();
    if (text) processPaste(text);
  });

  // Fecha
  document.getElementById('modal-paste-close').onclick = closeModal;
}

function closeModal() {
  document.getElementById('modal-paste').classList.add('hidden');
  modalCtx = { rawText: '', platform: 'unknown', parsedData: null, selectedAccId: null, level: 'empty' };
}

function processPaste(text) {
  modalCtx.rawText = text;
  modalCtx.platform = detectPlatform(text);
  
  if (modalCtx.platform === 'antigravity') {
    modalCtx.parsedData = parseAntigravity(text);
  } else if (modalCtx.platform === 'claudecode') {
    modalCtx.parsedData = parseClaudeCode(text);
  }

  renderStep2();
}

function renderStep2() {
  const body = document.getElementById('modal-paste-body');
  const isAnti = modalCtx.platform === 'antigravity';
  const accounts = Object.keys(appData.accounts).filter(k => appData.accounts[k].provider === modalCtx.platform);

  let accOptions = accounts.map(k => `<option value="${k}">${appData.accounts[k].name}</option>`).join('');

  body.innerHTML = `
    <div class="modal-body">
      <div style="display:flex; align-items:center; gap:0.5rem">
        <span class="detect-badge ${modalCtx.platform}">
          ${modalCtx.platform === 'antigravity' ? '⚡ Antigravity Detectado' : 
           (modalCtx.platform === 'claudecode' ? '🧠 Claude Code Detectado' : '❓ Desconhecido')}
        </span>
      </div>
      
      <div class="field-group">
        <label>Qual conta?</label>
        <select id="modal-acc-select" class="modal-textarea" style="min-height:38px; padding:0.5rem">
          ${accOptions}
        </select>
      </div>

      ${isAnti ? `
      <div class="field-group">
        <label>Nível dos Tokens</label>
        <div class="usage-picker" id="modal-level-picker">
          <div class="usage-option full" data-val="full">
            <span class="usage-option-icon">🟢</span> Cheio
          </div>
          <div class="usage-option medium" data-val="medium">
            <span class="usage-option-icon">🟡</span> Médio
          </div>
          <div class="usage-option low" data-val="low">
            <span class="usage-option-icon">🔴</span> Baixo
          </div>
          <div class="usage-option empty selected" data-val="empty">
            <span class="usage-option-icon">⚫</span> Zerado
          </div>
        </div>
      </div>
      ` : ''}

      <div class="field-group">
        <label>Preview (O que será salvo)</label>
        <div style="background:var(--bg-input); padding:0.5rem; border-radius:6px; font-size:0.8rem; font-family:monospace; white-space:pre-wrap; max-height:150px; overflow-y:auto; border:1px solid var(--border)">
          ${JSON.stringify(modalCtx.parsedData, null, 2)}
        </div>
      </div>

      <button id="modal-btn-confirm" class="btn btn-primary btn-full">Salvar Atualização</button>
    </div>
  `;

  // Attach events
  if (isAnti) {
    const pickerEls = document.querySelectorAll('#modal-level-picker .usage-option');
    pickerEls.forEach(el => {
      el.onclick = () => {
        pickerEls.forEach(p => p.classList.remove('selected'));
        el.classList.add('selected');
        modalCtx.level = el.dataset.val;
      };
    });
  }

  document.getElementById('modal-btn-confirm').onclick = handleConfirm;
}

async function handleConfirm() {
  const btn = document.getElementById('modal-btn-confirm');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const accId = document.getElementById('modal-acc-select').value;
  const newData = JSON.parse(JSON.stringify(appData)); // clone

  try {
    if (modalCtx.platform === 'antigravity') {
      const gModels = newData.accounts[accId].models || {};
      Object.keys(modalCtx.parsedData).forEach(mName => {
        if (!gModels[mName]) gModels[mName] = { notifEnabled: false };
        gModels[mName] = {
           ...gModels[mName],
           name: mName,
           level: modalCtx.level,
           resetsAt: modalCtx.parsedData[mName].resetsAt,
           lastUpdated: modalCtx.parsedData[mName].lastUpdated
        };
      });
      newData.accounts[accId].models = gModels;
    } else if (modalCtx.platform === 'claudecode') {
      const merge = modalCtx.parsedData;
      newData.accounts[accId] = {
        ...newData.accounts[accId],
        session: merge.session || newData.accounts[accId].session,
        sessionRefresh: merge.sessionRefresh || newData.accounts[accId].sessionRefresh,
        weekly: merge.weekly || newData.accounts[accId].weekly,
        weeklyRefresh: merge.weeklyRefresh || newData.accounts[accId].weeklyRefresh,
      };
    }

    await saveData(getToken(), getGistId(), newData);
    renderDashboard(newData);
    closeModal();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar no Gist: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Tentar novamente';
  }
}
