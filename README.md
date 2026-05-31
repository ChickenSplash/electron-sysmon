# electron-sysmon

A deliberately small system monitor, built to learn how Electron fits together.
Shows live CPU usage (overall + per core), memory usage, and CPU temperature.

## Run it

You need Node.js installed (you'll have this already). From this folder:

```bash
npm install     # pulls electron + systeminformation
npm start       # launches the app
```

That's it — a window should appear updating once per second.

## How it's wired (the bit worth understanding)

Electron apps have two processes that talk over **IPC**:

```
  main.js  ──────────────►  preload.js  ──────────────►  renderer.js
  (Node,                    (secure bridge)               (the UI,
   full OS access)                                         a Chromium page)

  renderer asks  ──►  window.sysmon.getStats()
  preload forwards ──►  ipcRenderer.invoke('get-stats')
  main answers   ──►  ipcMain.handle('get-stats', ...) reads the OS, returns data
```

- **main.js** — runs in Node, can touch the OS. Creates the window and uses the
  `systeminformation` library to gather stats. This is your "backend."
- **preload.js** — a small, safe seam. It exposes *only* `getStats()` to the page
  rather than handing the UI full Node access. (`contextIsolation: true`)
- **renderer.js** — plain web JS. It can't read the OS itself, so once a second it
  calls `getStats()`, gets data back, and updates the DOM.
- **index.html / styles.css** — the UI. Just a web page.

## Things to try next

- Add a **network panel** — `systeminformation` has `si.networkStats()`
  (gives you rx/tx per second). Add a panel in `index.html` and read it in
  `main.js`'s handler.
- Add **disk usage** with `si.fsSize()`.
- Add a **GPU panel** — `si.graphics()` reports your RTX 3080's usage/temp.
- Make the poll interval configurable.

## Notes for your setup (Hyprland / Wayland)

Electron uses Chromium, which has solid Wayland support — but Electron sometimes
still defaults to XWayland. To force native Wayland you can launch with flags:

```bash
electron . --enable-features=UseOzonePlatform --ozone-platform=wayland
```

If you ever see a blank/black window on Wayland, that flag (or removing it) is the
first thing to try — same family of issue as the VRCT/WebKitGTK thing, just far
less painful because Chromium's Wayland support is good.
