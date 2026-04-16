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
  selectedAccId: null
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
  modalCtx = { rawText: '', platform: 'unknown', parsedData: null, selectedAccId: null };
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
        <label>Nível dos Tokens por Modelo</label>
        <div id="modal-level-pickers" style="display:flex; flex-direction:column; gap:0.75rem">
        ${Object.values(modalCtx.parsedData).map(m => {
          let lvl = m.level || '0';
          if (lvl === 'empty') lvl = '0';
          if (lvl === 'low') lvl = '1';
          if (lvl === 'medium') lvl = '3';
          if (lvl === 'full') lvl = '5';
          m.level = lvl;

          return `
          <div class="model-picker-row">
            <div style="font-size:0.8rem; font-weight:600; margin-bottom:0.4rem">${m.name}</div>
            <div class="usage-picker" data-model="${m.name}">
              <div class="usage-option lvl0 ${lvl==='0'?'selected':''}" data-val="0">
                <div class="ag-segments lvl0">${[1,2,3,4,5].map(i=>'<div class="ag-seg"></div>').join('')}</div>
                Zerado
              </div>
              <div class="usage-option lvl1 ${lvl==='1'?'selected':''}" data-val="1">
                <div class="ag-segments lvl1">${[1,2,3,4,5].map(i=>`<div class="ag-seg ${i<=1?'filled':''}"></div>`).join('')}</div>
                1
              </div>
              <div class="usage-option lvl2 ${lvl==='2'?'selected':''}" data-val="2">
                <div class="ag-segments lvl2">${[1,2,3,4,5].map(i=>`<div class="ag-seg ${i<=2?'filled':''}"></div>`).join('')}</div>
                2
              </div>
              <div class="usage-option lvl3 ${lvl==='3'?'selected':''}" data-val="3">
                <div class="ag-segments lvl3">${[1,2,3,4,5].map(i=>`<div class="ag-seg ${i<=3?'filled':''}"></div>`).join('')}</div>
                3
              </div>
              <div class="usage-option lvl4 ${lvl==='4'?'selected':''}" data-val="4">
                <div class="ag-segments lvl4">${[1,2,3,4,5].map(i=>`<div class="ag-seg ${i<=4?'filled':''}"></div>`).join('')}</div>
                4
              </div>
              <div class="usage-option lvl5 ${lvl==='5'?'selected':''}" data-val="5">
                <div class="ag-segments lvl5">${[1,2,3,4,5].map(i=>`<div class="ag-seg ${i<=5?'filled':''}"></div>`).join('')}</div>
                Cheio
              </div>
            </div>
          </div>
          `;
        }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="field-group">
        <label>Preview (O que será salvo)</label>
        <div id="modal-preview-json" style="background:var(--bg-input); padding:0.5rem; border-radius:6px; font-size:0.8rem; font-family:monospace; white-space:pre-wrap; max-height:150px; overflow-y:auto; border:1px solid var(--border)">
          ${JSON.stringify(modalCtx.parsedData, null, 2)}
        </div>
      </div>

      <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
        <button id="modal-btn-cancel" class="btn btn-ghost btn-full">Cancelar</button>
        <button id="modal-btn-confirm" class="btn btn-primary btn-full">Salvar Atualização</button>
      </div>
    </div>
  `;

  // Attach events
  if (isAnti) {
    const pickerGroups = document.querySelectorAll('#modal-level-pickers .usage-picker');
    pickerGroups.forEach(group => {
      const modelName = group.dataset.model;
      const options = group.querySelectorAll('.usage-option');
      options.forEach(el => {
        el.onclick = () => {
          options.forEach(p => p.classList.remove('selected'));
          el.classList.add('selected');
          modalCtx.parsedData[modelName].level = el.dataset.val;
          document.getElementById('modal-preview-json').textContent = JSON.stringify(modalCtx.parsedData, null, 2);
        };
      });
    });
  }

  document.getElementById('modal-btn-cancel').onclick = closeModal;
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
      const newGModels = {};
      const allowed = ['Gemini 3.1 Pro (High)', 'Gemini 3 Flash', 'Claude Sonnet 4.6 (Thinking)', 'Claude Opus 4.6 (Thinking)'];
      
      // Keep only allowed previous models
      Object.keys(gModels).forEach(k => {
        if (allowed.includes(k)) newGModels[k] = gModels[k];
      });

      // Update with new data
      Object.keys(modalCtx.parsedData).forEach(mName => {
        if (!allowed.includes(mName)) return; // double check

        if (!newGModels[mName]) newGModels[mName] = { notifEnabled: false };
        newGModels[mName] = {
           ...newGModels[mName],
           name: mName,
           level: modalCtx.parsedData[mName].level,
           resetsAt: modalCtx.parsedData[mName].resetsAt,
           lastUpdated: modalCtx.parsedData[mName].lastUpdated
        };
      });
      newData.accounts[accId].models = newGModels;
    } else if (modalCtx.platform === 'claudecode') {
      const merge = modalCtx.parsedData;
      // IMPORTANTE: usar !== undefined em vez de ||, pois 0 é falsy e quebraria
      // o caso onde a sessão está zerada (0% usado)
      newData.accounts[accId] = {
        ...newData.accounts[accId],
        session: merge.session !== undefined ? merge.session : newData.accounts[accId].session,
        sessionRefresh: merge.sessionRefresh !== null ? merge.sessionRefresh : newData.accounts[accId].sessionRefresh,
        weekly: merge.weekly !== undefined ? merge.weekly : newData.accounts[accId].weekly,
        weeklyRefresh: merge.weeklyRefresh !== null ? merge.weeklyRefresh : newData.accounts[accId].weeklyRefresh,
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
