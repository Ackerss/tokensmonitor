// js/time-utils.js

export function isPast(isoDateStr) {
  if (!isoDateStr) return true;
  return new Date(isoDateStr) < new Date();
}

/**
 * Retorna uma string descritiva visual "In Xh Ym"
 */
export function getRelativeTimeString(isoDateStr) {
  if (!isoDateStr) return 'Pronto';
  
  const now = new Date();
  const target = new Date(isoDateStr);
  const diffMs = target - now;
  
  if (diffMs <= 0) return 'Pronto';

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `In ${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) return `In ${hours}h ${mins}m`;
  if (mins === 0) return 'In < 1m';
  return `In ${mins}m`;
}

/**
 * Calcula quanto tempo falta de uma forma pura e retorna classificação
 * (pronto, shortly, future, etc) para colorir ou disparar alertas.
 */
export function getTimeStatus(isoDateStr) {
  if (!isoDateStr) return 'ready';
  const now = new Date();
  const target = new Date(isoDateStr);
  const diffMs = target - now;

  if (diffMs <= 0) return 'ready';
  
  const diffMins = diffMs / 60000;
  if (diffMins <= 30) return 'very-soon'; // <= 30 mins
  if (diffMins <= 120) return 'soon'; // <= 2 horas
  return 'future';
}

/**
 * Pega string literal guardada (ex: "Reinicia sex., 22:00")
 * Se for uma valid ISO string tenta renderizar via relativa, senão exibe como string pura.
 */
export function getRefreshDisplay(value) {
  if (!value) return 'N/A';
  
  // Tentar dar parse apenas para ver se é data iso válida puramente (como as do antigravity)
  const d = new Date(value);
  // Se for ISO válido tipo 2026-X
  if (!isNaN(d.getTime()) && value.includes('T')) {
      return getRelativeTimeString(value);
  }

  // É string avulsa (Claude "Reinicia sex., 22:00")
  return value;
}
