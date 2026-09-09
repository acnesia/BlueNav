const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

// BlueShields tracker & ad domains list (built-in fast heuristic filter)
const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'adservice.google.',
  'facebook.net/signals',
  'connect.facebook.net',
  'analytics.twitter.com',
  'ads.twitter.com',
  'adform.net',
  'criteo.com',
  'criteo.net',
  'outbrain.com',
  'taboola.com',
  'scorecardresearch.com',
  'quantserve.com',
  'amazon-adsystem.com',
  'hotjar.com',
  'clarity.ms',
  'segment.io',
  'mixpanel.com',
  'adservice.',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'casalemedia.com',
  'openx.net',
  'smartadserver.com'
];

let shieldsEnabled = true;
let totalBlocked = 0;
let sessionBlocked = 0;

function isTrackerOrAd(url) {
  if (!shieldsEnabled) return false;
  const lower = url.toLowerCase();
  for (const domain of TRACKER_DOMAINS) {
    if (lower.includes(domain)) return true;
  }
  return false;
}

function setupBlueShields() {
  const filter = { urls: ['*://*/*'] };

  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    // Check if url matches ad or tracker
    if (isTrackerOrAd(details.url)) {
      totalBlocked++;
      sessionBlocked++;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('shield:stats-updated', {
          totalBlocked,
          sessionBlocked,
          urlBlocked: details.url
        });
      }
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });

  // Anti-fingerprinting & header sanitization
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (shieldsEnabled) {
      delete details.requestHeaders['X-Client-Data'];
      details.requestHeaders['DNT'] = '1';
      details.requestHeaders['Sec-GPC'] = '1';
    }
    callback({ requestHeaders: details.requestHeaders });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0A0E17',
    title: 'BlueNav Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      spellcheck: true
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove default menu for clean, modern browser aesthetics
  Menu.setApplicationMenu(null);
}

// IPC Handlers
ipcMain.handle('shield:get-stats', () => {
  return {
    enabled: shieldsEnabled,
    totalBlocked,
    sessionBlocked
  };
});

ipcMain.handle('shield:toggle', (event, state) => {
  if (state !== undefined) {
    shieldsEnabled = Boolean(state);
  } else {
    shieldsEnabled = !shieldsEnabled;
  }
  return shieldsEnabled;
});
app.whenReady().then(() => {
  setupBlueShields();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
