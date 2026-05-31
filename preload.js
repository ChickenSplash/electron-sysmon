// ============================================================
//  PRELOAD SCRIPT
// ------------------------------------------------------------
//  Runs in a privileged context BEFORE the renderer's web page
//  loads. It's the safe seam between the two worlds: it exposes
//  a tiny, controlled API to the UI instead of handing the
//  renderer full access to Node/Electron internals.
//
//  After this, the renderer can call:  window.sysmon.getStats()
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sysmon', {
  // Asks the main process for a fresh snapshot of system stats.
  // Returns a Promise that resolves with the data object.
  getStats: () => ipcRenderer.invoke('get-stats'),
});
