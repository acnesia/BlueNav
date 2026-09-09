const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blueNav', {
  getShieldStats: () => ipcRenderer.invoke('shield:get-stats'),
  toggleShield: (state) => ipcRenderer.invoke('shield:toggle', state),
  onShieldUpdate: (callback) => {
    ipcRenderer.on('shield:stats-updated', (event, data) => callback(data));
  },
  askAI: (options) => ipcRenderer.invoke('ai:query', options)
});
