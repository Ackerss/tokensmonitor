// js/settings.js

const StorageKey = {
  TOKEN: 'tokensmonitor_pat',
  GIST_ID: 'tokensmonitor_gist',
  NOTIF_ADVANCE: 'tokensmonitor_notif_advance'
};

let currentSettings = {
  token: '',
  gistId: '',
  notifAdvance: 0 // minutos
};

export function loadSettings() {
  currentSettings = {
    token: localStorage.getItem(StorageKey.TOKEN) || '',
    gistId: localStorage.getItem(StorageKey.GIST_ID) || '',
    notifAdvance: parseInt(localStorage.getItem(StorageKey.NOTIF_ADVANCE) || '0', 10)
  };
  return currentSettings;
}

export function saveSettings(settings) {
  if (settings.token !== undefined) {
    localStorage.setItem(StorageKey.TOKEN, settings.token);
    currentSettings.token = settings.token;
  }
  if (settings.gistId !== undefined) {
    localStorage.setItem(StorageKey.GIST_ID, settings.gistId);
    currentSettings.gistId = settings.gistId;
  }
  if (settings.notifAdvance !== undefined) {
    localStorage.setItem(StorageKey.NOTIF_ADVANCE, settings.notifAdvance.toString());
    currentSettings.notifAdvance = settings.notifAdvance;
  }
}

export function getToken() { return currentSettings.token; }
export function getGistId() { return currentSettings.gistId; }
export function setGistId(id) { saveSettings({ gistId: id }); }
export function getNotifAdvance() { return currentSettings.notifAdvance; }
