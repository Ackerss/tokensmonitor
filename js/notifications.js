// js/notifications.js
import { getNotifAdvance } from './settings.js';

let notifInterval = null;

export function initNotifications(appData) {
  if (notifInterval) clearInterval(notifInterval);
  
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Check every 30 seconds
  notifInterval = setInterval(() => checkAlerts(appData), 30_000);
}

function checkAlerts(appData) {
  if (Notification.permission !== 'granted') return;
  
  const advanceMins = getNotifAdvance(); // 0, 15, ou 30
  const now = new Date();

  Object.values(appData.accounts).forEach(acc => {
    if (acc.provider === 'antigravity') {
      const models = Object.values(acc.models || {});
      models.forEach(m => {
        if (m.notifEnabled && m.resetsAt) {
          checkAndFire(acc.name, m.name, m.resetsAt, advanceMins, m);
        }
      });
    }
    // Claude code doesn't have specific "notifEnabled" per model built strictly yet. 
    // We could add it, but requirement focused slightly more on Antigravity toggle.
  });
}

function checkAndFire(accName, modelName, resetsAt, advanceMins, modelRef) {
  const target = new Date(resetsAt);
  const diffMins = (target - new Date()) / 60000;

  // Se o diff for menor igual ao advanceMins E não enviou alerta recentemente
  // Para evitar spam, guardamos lastNotified no objeto de runtime (não persistido no json)
  // ou alteramos a flag para false no gist se for "one time".
  // Vamos usar uma flag in-memory
  
  if (diffMins <= advanceMins && diffMins > -60) {
    if (!modelRef._lastNotified || (new Date() - modelRef._lastNotified) > 1000 * 60 * 60) { // max 1 per hour per full reset
      
      let msg = `Quotas prontas!`;
      if (advanceMins > 0 && diffMins > 0) {
        msg = `Renova em ${Math.ceil(diffMins)} minutos!`;
      }

      new Notification(`TokensMonitor: ${accName}`, {
        body: `[${modelName}] ${msg}`,
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7imaE8L3RleHQ+PC9zdmc+',
        requireInteraction: true
      });

      modelRef._lastNotified = new Date();
    }
  }
}
