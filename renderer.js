// ============================================================
//  RENDERER PROCESS
// ------------------------------------------------------------
//  This is just a web page (Chromium). It CANNOT read the OS
//  directly. Once per second it calls window.sysmon.getStats()
//  — exposed by preload.js — which round-trips to the main
//  process over IPC, and then it paints the result.
// ============================================================

const $ = (id) => document.getElementById(id);

// format bytes -> human readable (GiB)
function gib(bytes) {
  return (bytes / 1024 ** 3).toFixed(1);
}

// build the per-core rows once, then just update widths each tick
let coresBuilt = false;
function buildCores(count) {
  const wrap = $('cores');
  wrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'core-row';
    row.innerHTML = `
      <span class="idx">c${i}</span>
      <div class="core-track"><div class="core-fill" id="core-${i}"></div></div>
      <span class="val" id="core-val-${i}">0%</span>`;
    wrap.appendChild(row);
  }
  coresBuilt = true;
}

async function tick() {
  try {
    const { load, mem, temp, cpu, osInfo, network } = await window.sysmon.getStats();

    console.log(cpu);
    
    // ---- header ----
    $('os-meta').textContent =
      `${osInfo.distro} ${osInfo.release} · ${osInfo.arch}`;

    // ---- CPU overall ----
    const cpuPct = load.currentLoad;
    $('cpu-pct').innerHTML = `${cpuPct.toFixed(0)}<small>%</small>`;
    $('cpu-bar').style.width = `${cpuPct}%`;
    $('cpu-name').textContent = `${cpu.manufacturer} ${cpu.brand}`.trim();

    // ---- CPU per-core ----
    const cores = load.cpus || [];
    if (!coresBuilt) buildCores(cores.length);
    cores.forEach((c, i) => {
      const fill = $(`core-${i}`);
      const val = $(`core-val-${i}`);
      if (fill) fill.style.width = `${c.load}%`;
      if (val) val.textContent = `${c.load.toFixed(0)}%`;
    });

    // ---- Memory ----
    const used = mem.active;                 // "active" = real in-use memory
    const memPct = (used / mem.total) * 100;
    $('mem-pct').innerHTML = `${memPct.toFixed(0)}<small>%</small>`;
    $('mem-bar').style.width = `${memPct}%`;
    $('mem-detail').textContent = `${gib(used)} / ${gib(mem.total)} GiB`;

    // ---- Temperature (not all hardware reports this) ----
    if (temp && temp.main != null) {
      const t = temp.main;
      $('temp-val').innerHTML = `${t.toFixed(0)}<small>°C</small>`;
      // scale bar against a ~95°C ceiling for a rough visual
      $('temp-bar').style.width = `${Math.min((t / 95) * 100, 100)}%`;
      $('temp-note').textContent = t > 80 ? 'running hot' : 'nominal';
    } else {
      $('temp-val').innerHTML = `n/a`;
      $('temp-bar').style.width = `0%`;
      $('temp-note').textContent = 'no sensor reported';
    }

    // ---- footer ----
    $('tick').textContent =
      'updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    $('status').textContent = '● error';
    $('status').style.color = 'var(--warn)';
    console.error(err);
  }
}

// first paint immediately, then every second
tick();
setInterval(tick, 1000);
