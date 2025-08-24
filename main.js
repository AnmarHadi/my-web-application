// main.js (داخل مشروع Electron)
const { app, BrowserWindow } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(__dirname, 'frontend/build/index.html'));
}

app.whenReady().then(() => {
  // شغل خادم الباكند
  execFile('node', [path.join(__dirname, 'backend/server.js')]);

  // شغل خادم السكنر EXE (لاحظ الامتداد الكامل)
  execFile(path.join(__dirname, 'scanner/scan_server.exe'));

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
