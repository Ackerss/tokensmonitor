// js/gist.js
import { setAppData } from './app.js';

const GIST_FILENAME = 'tokensmonitor-data.json';

const API_URL = 'https://api.github.com/gists';

const defaultData = {
  accounts: {
    "Antigravity: jacsonsax": { provider: "antigravity", name: "jacsonsax", models: {} },
    "Antigravity: JacsonADuarte": { provider: "antigravity", name: "JacsonADuarte", models: {} },
    "Antigravity: Natubrava": { provider: "antigravity", name: "Natubrava", models: {} },
    "Antigravity: fenixbrj": { provider: "antigravity", name: "fenixbrj", models: {} },
    "Antigravity: ANA": { provider: "antigravity", name: "ANA", models: {} },
    "Claude Code: jacsonsax": { provider: "claudecode", name: "jacsonsax", session: 0, sessionRefresh: null, weekly: 0, weeklyRefresh: null }
  }
};

/**
 * Cria um novo gist apenas se o Gist ID não existir ainda.
 */
export async function createGist(token) {
  const payload = {
    description: "TokensMonitor App Data (DO NOT DELETE)",
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(defaultData, null, 2)
      }
    }
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to create gist: ${res.statusText}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Retorna os dados; injeta estrutura se o gist for limpo.
 */
export async function loadData(token, gistId) {
  const res = await fetch(`${API_URL}/${gistId}?t=${Date.now()}`, { // cache buster
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (res.status === 404) {
    throw new Error('Gist não encontrado. Ele pode ter sido apagado.');
  }

  if (!res.ok) {
    throw new Error(`Failed to read gist: ${res.statusText}`);
  }

  const gist = await res.json();
  const file = gist.files[GIST_FILENAME];
  
  if (!file) throw new Error('Arquivo tokensmonitor-data.json não encontrado no gist.');
  
  let parsed = JSON.parse(file.content);

  // Mantém estrutura default garantida se faltarem as chaves
  const merged = { accounts: { ...defaultData.accounts, ...(parsed.accounts || {}) } };
  
  // Limpeza: remove contas default que vieram repetidas com maiuscula/minuscula caso existam
  return merged;
}

export async function saveData(token, gistId, appData) {
  const payload = {
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(appData, null, 2)
      }
    }
  };

  const res = await fetch(`${API_URL}/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to save gist: ${res.statusText}`);
  }
  
  // Update state memory immediately
  setAppData(appData);
}

// Para testar conexão usando um token avulso
export async function testConnection(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!res.ok) throw new Error('Token inválido ou sem acesso.');
  return await res.json();
}
