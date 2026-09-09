const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;

// Settings File Path
const settingsPath = path.join(app.getPath('userData'), 'bluenav-settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {}
  return {
    searchEngine: 'google',
    shieldsEnabled: true,
    blockTrackers: true,
    httpsOnly: false
  };
}

function saveSettings(data) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

let userSettings = loadSettings();

// BlueShields tracker & ad domains list
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

let shieldsEnabled = userSettings.shieldsEnabled !== false;
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
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#09090B',
    title: 'BlueNav',
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
  userSettings.shieldsEnabled = shieldsEnabled;
  saveSettings(userSettings);
  return shieldsEnabled;
});

// Settings Handlers
ipcMain.handle('settings:get', () => {
  return userSettings;
});

ipcMain.handle('settings:save', (event, newSettings) => {
  userSettings = { ...userSettings, ...newSettings };
  shieldsEnabled = userSettings.shieldsEnabled !== false;
  saveSettings(userSettings);
  return userSettings;
});

ipcMain.handle('settings:clear-data', async () => {
  try {
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'cache', 'localstorage', 'websql', 'indexdb']
    });
    return { success: true, message: 'Données effacées avec succès.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 1-Click Update Handlers
ipcMain.handle('app:check-update', async () => {
  const currentVersion = '1.0.0';
  return new Promise((resolve) => {
    const url = 'https://api.github.com/repos/acnesia/BlueNav/releases/latest?t=' + Date.now();
    const req = https.get(url, {
      headers: {
        'User-Agent': 'BlueNav-Browser',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestTag = json.tag_name || '';
          const latestVersion = latestTag.replace(/^v/, '');
          const hasUpdate = latestVersion && latestVersion !== currentVersion;
          
          let downloadUrl = '';
          if (json.assets && json.assets.length > 0) {
            const setupAsset = json.assets.find(a => a.name.endsWith('.exe'));
            if (setupAsset) downloadUrl = setupAsset.browser_download_url;
          }

          resolve({
            success: true,
            currentVersion,
            latestVersion: latestVersion || currentVersion,
            hasUpdate: Boolean(hasUpdate),
            releaseUrl: json.html_url || 'https://github.com/acnesia/BlueNav/releases',
            downloadUrl,
            releaseNotes: json.body || 'Aucune note de version.'
          });
        } catch (e) {
          resolve({
            success: false,
            currentVersion,
            latestVersion: currentVersion,
            hasUpdate: false,
            message: 'Impossible de vérifier les mises à jour pour le moment.'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        message: err.message
      });
    });

    req.setTimeout(8000, () => {
      req.abort();
      resolve({
        success: false,
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        message: 'Délai d attente dépassé.'
      });
    });
  });
});

// 1-Click Git Pull Update (Direct local source pull)
ipcMain.handle('app:git-pull-update', () => {
  return new Promise((resolve) => {
    const repoRoot = path.join(__dirname, '..');
    exec('git pull origin main', { cwd: repoRoot }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          output: stderr || error.message
        });
      } else {
        resolve({
          success: true,
          output: stdout || 'BlueNav est déjà à jour.'
        });
      }
    });
  });
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
