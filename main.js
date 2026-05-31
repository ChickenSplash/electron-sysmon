// ============================================================
//  MAIN PROCESS
// ------------------------------------------------------------
//  This runs in Node.js and has full access to the OS.
//  It creates the window and answers data requests from the
//  renderer (the UI) over IPC. The renderer can't touch the
//  OS directly — it has to ask the main process.
// ============================================================

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const si = require('systeminformation');

function createWindow() {
  const win = new BrowserWindow({
    width: 780,
    height: 680,
    minWidth: 640,
    minHeight: 560,
    backgroundColor: '#0c0e12',
    title: 'sysmon',
    webPreferences: {
      // preload.js is the secure bridge between OS-land and UI-land
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // keep the renderer sandboxed
      nodeIntegration: false,   // renderer cannot require() Node modules directly
    },
  });

  win.loadFile('index.html');
  // Uncomment to open Chromium devtools while learning:
  win.webContents.openDevTools();
}

Menu.setApplicationMenu(null);

// ------------------------------------------------------------
//  IPC: the renderer calls window.sysmon.getStats() and this
//  handler runs here in the main process, gathers the data,
//  and returns it. systeminformation does the heavy lifting.
// ------------------------------------------------------------
ipcMain.handle('get-stats', async () => {
  const [load, mem, temp, cpu, osInfo, network] = await Promise.all([
    si.currentLoad(),     // overall + per-core CPU usage
    si.mem(),             // memory totals/used/available
    si.cpuTemperature(),  // CPU temp (may be null on some hardware)
    si.cpu(),             // static CPU info (brand, core count)
    si.osInfo(),          // distro / OS info
    si.networkStats(),
  ]);

  return { load, mem, temp, cpu, osInfo, network };
});

// ------------------------------------------------------------
//  Standard Electron app lifecycle boilerplate.
// ------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS: re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Quit when all windows are closed, except on macOS
  if (process.platform !== 'darwin') app.quit();
});
