const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blueNav', {
  getShieldStats: () => ipcRenderer.invoke('shield:get-stats'),
  toggleShield: (state) => ipcRenderer.invoke('shield:toggle', state),
  onShieldUpdate: (callback) => {
    ipcRenderer.on('shield:stats-updated', (event, data) => callback(data));
  },
  checkUpdate: () => ipcRenderer.invoke('app:check-update'),
  runGitPull: () => ipcRenderer.invoke('app:git-pull-update'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  clearData: () => ipcRenderer.invoke('settings:clear-data')
});
