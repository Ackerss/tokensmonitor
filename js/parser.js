// js/parser.js

export function detectPlatform(text) {
  if (text.includes('Sessão atual') || text.includes('Limites semanais')) {
    return 'claudecode';
  }
  // Antigravity models
  if (text.includes('Model Quota') || text.includes('Refreshes in') || text.includes('Gemini') || text.includes('Claude Sonnet') || text.includes('Claude Opus')) {
    return 'antigravity';
  }
  return 'unknown';
}

function parseRelativeTime(agoStr) {
  // Converte "1 hour ago", "15 minutes ago" para um Date
  const now = new Date();
  
  const mHour = agoStr.match(/(\d+)\s*hour/i);
  if (mHour) {
    now.setHours(now.getHours() - parseInt(mHour[1], 10));
    return now.toISOString();
  }
  
  const mMin = agoStr.match(/(\d+)\s*minute/i);
  if (mMin) {
    now.setMinutes(now.getMinutes() - parseInt(mMin[1], 10));
    return now.toISOString();
  }
  
  const mSec = agoStr.match(/(\d+)\s*second/i);
  if (mSec) {
    now.setSeconds(now.getSeconds() - parseInt(mSec[1], 10));
    return now.toISOString();
  }

  // Se for datetime, tenta parse date
  const parsed = new Date(agoStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  
  return null; // fall back a null
}

function parseNextResetDelay(delayStr) {
  // delayStr ex: "In 14 hours, 51 minutes", "In 55 minutes, 36 seconds", "Tomorrow at ..."
  // Esta função tenta jogar a string solta na lógica e inferir o tempo exato de renovação real.
  const now = new Date();
  
  // "In 14 hours, 51 minutes"
  let hours = 0, mins = 0, secs = 0;
  
  const hMatch = delayStr.match(/(\d+)\s*hour/i);
  if (hMatch) hours = parseInt(hMatch[1], 10);
  
  const mMatch = delayStr.match(/(\d+)\s*minute/i);
  if (mMatch) mins = parseInt(mMatch[1], 10);
  
  const sMatch = delayStr.match(/(\d+)\s*second/i);
  if (sMatch) secs = parseInt(sMatch[1], 10);

  if (hours > 0 || mins > 0 || secs > 0) {
    now.setHours(now.getHours() + hours);
    now.setMinutes(now.getMinutes() + mins);
    now.setSeconds(now.getSeconds() + secs);
    return now.toISOString();
  }

  // Se não tem info clara de "in", e tentarmos Date() (ex: "Tomorrow at 7:59 PM")
  const maybeDate = new Date(delayStr);
  if (!isNaN(maybeDate.getTime()) && maybeDate > now) {
    return maybeDate.toISOString();
  }
  
  // Se for "In a few seconds" ou similar
  if (delayStr.toLowerCase().includes('in a few seconds')) {
    now.setSeconds(now.getSeconds() + 10);
    return now.toISOString();
  }

  return null;
}

export function parseAntigravity(text) {
  // Antigravity text line ex:
  // Claude Sonnet 4.6 (Thinking) (High)\n15 resets\nIn 14 hours, 51 minutes\nUpdated 5 hours ago
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let parsedModels = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let modelName = '';

    // Identificar apenas os modelos permitidos
    const isAllowed = 
      line.startsWith('Gemini 3.1 Pro (High)') || 
      line.startsWith('Gemini 3 Flash') || 
      line.startsWith('Claude Sonnet 4.6') || 
      line.startsWith('Claude Opus 4.6');

    if (isAllowed) {
      modelName = line;
    }

    if (modelName) {
      const modelData = { name: modelName, level: '0', resetsAt: null, lastUpdated: new Date().toISOString() };
      
      // Lookahead up to 3 lines pra caçar os tempos
      for (let j = 1; j <= 4 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        
        if (nextLine.toLowerCase().includes('in ') || nextLine.toLowerCase().includes('refreshes')) {
          modelData.resetsAt = parseNextResetDelay(nextLine);
        } else if (nextLine.toLowerCase().startsWith('updated ')) {
          const ago = nextLine.replace(/updated\s+/i, '');
          const realAgodt = parseRelativeTime(ago);
          if (realAgodt) modelData.lastUpdated = realAgodt;
        } else if (nextLine.includes('resets')) {
           // Info ignorada do qty resets do antigravity. Nao salva.
        } else if (nextLine.includes('Gemini') || nextLine.includes('Claude')) {
          break; // Chegou no próximo modelo
        }
      }
      
      parsedModels[modelName] = modelData;
    }
  }
  
  return parsedModels;
}

export function parseClaudeCode(text) {
  // text parse example:
  // "Sessão atual ... 0% usado ... Limites semanais ... Reinicia sex., 22:00 ... 73% usado"
  // Temos que achar 0% e 73%. Qual é qual? 
  // Na UI, aparece sessão atual primeiro, e depois limite semanal.
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const result = { session: 0, sessionRefresh: null, weekly: 0, weeklyRefresh: null };

  let inWeekly = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    
    if (l.includes('semanais') || l.includes('semanal')) {
      inWeekly = true;
    }

    // Achar porcentagem
    const m = l.match(/(\d+)%\s*usado/);
    if (m) {
      const val = 100 - parseInt(m[1], 10); // A gente salva "Tokens restantes", se for 73% usado -> 27% restantes
      if (inWeekly) {
        result.weekly = val;
      } else {
        result.session = val;
      }
    }

    // Achar "Reinicia ..."
    if (l.includes('reinicia')) {
      // Ex: "Reinicia sex., 22:00" -> Nós só trataremos como data aproximada ou podemos converter pra próxima sexta.
      // A UI vai só guardar a string original "Reinicia sex., 22:00" no bd JSON ou converte?
      // O requisito diz que pode ser uma string direto pra exibir se for semanal. É difícil cravar dia/ano do PT-BR exato sem library enorme.
      // Então guardamos a string original pra esse:
      let rawDt = lines[i].replace(/reinicia\s+/i, '').trim();
      
      // Provisoriamente: joga na weeklyRefresh (se estiver inWeekly)
      if (inWeekly) {
         result.weeklyRefresh = rawDt;
      } else {
         result.sessionRefresh = rawDt;
      }
    }
  }
  
  // Se não acho session/weekly claro
  if (!inWeekly && Object.keys(result).length === 4 && result.session === 0 && result.weekly === 0) {
     // tenta ver se tem regex solta
     const pMatches = text.match(/(\d+)%\s*usado/gi);
     if (pMatches && pMatches.length > 0) {
        result.session = 100 - parseInt(pMatches[0].match(/\d+/)[0], 10);
        if (pMatches.length > 1) {
          result.weekly = 100 - parseInt(pMatches[1].match(/\d+/)[0], 10);
        }
     }
  }

  return result;
}
