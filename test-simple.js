const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, 'test-simple.log');

try {
  fs.writeFileSync(logPath, 'Starting, app type: ' + typeof app + '\n');
  
  if (!app) {
    fs.appendFileSync(logPath, 'app is null/undefined - wrong context\n');
    process.exit(1);
  }
  
  fs.appendFileSync(logPath, 'app exists, whenReady: ' + typeof app.whenReady + '\n');
  
  app.whenReady().then(() => {
    try {
      fs.appendFileSync(logPath, 'READY - creating window\n');
      const win = new BrowserWindow({ 
        width: 400, 
        height: 300,
        show: true,
        frame: true,
        backgroundColor: '#ff0000'
      });
      win.loadURL('data:text/html,<h1 style="color:white">Hello</h1>');
      fs.appendFileSync(logPath, 'Window created, visible=' + win.isVisible() + '\n');
    } catch(e) {
      fs.appendFileSync(logPath, 'ERROR in whenReady: ' + e.message + '\n');
    }
  });
  
  setTimeout(() => {
    fs.appendFileSync(logPath, '10s timer, windows: ' + BrowserWindow.getAllWindows().length + '\n');
  }, 10000);
  
} catch(e) {
  fs.appendFileSync(logPath, 'FATAL: ' + e.message + '\n');
}
