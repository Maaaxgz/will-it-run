/* ============================================================
   compatibility.js — hardware comparison and result rendering
   ============================================================ */

/* ── Helpers ─────────────────────────────────────────────── */

/** Case-insensitive exact → partial → reverse-partial match in a DB */
function getScore(name, db) {
  const n = normalize(name);
  return db.find(x => normalize(x.name) === n)
      || db.find(x => normalize(x.name).includes(n))
      || db.find(x => n.includes(normalize(x.name)))
      || null;
}

/**
 * Parses a RAM number from a requirements string.
 * Looks for patterns like "8 GB RAM", "RAM: 16", "Memory: 8 GB".
 */
function parseNum(str, keywords) {
  if (!str) return null;
  const lower = str.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      const before = lower.slice(Math.max(0, idx - 8), idx).match(/(\d+(\.\d+)?)/g);
      if (before) return parseFloat(before[before.length - 1]);
    }
  }
  return null;
}

function parseRAM(str) {
  return parseNum(str, ['gb ram', 'gb de ram', 'ram: ', 'memory: ', 'memoria: '])
      || parseNum(str, ['ram', 'memory', 'memoria']);
}

/** Finds the highest-scoring GPU or CPU mentioned in a requirements string */
function findBestHardwareScore(reqText, db) {
  const lower = reqText.toLowerCase();
  let best = null;
  for (const entry of db) {
    if (lower.includes(entry.name.toLowerCase())) {
      if (!best || entry.score > best.score) best = entry;
    }
  }
  return best;
}

/* ── Main function ────────────────────────────────────────── */

/** Called by the "Verificar compatibilidad" button */
function checkCompatibility() {
  if (!selectedGame) return;

  const gpuName  = document.getElementById('gpu-input').value.trim();
  const cpuName  = document.getElementById('cpu-input').value.trim();
  const ram      = parseFloat(document.getElementById('ram-input').value) || 0;
  const userVram = parseFloat(document.getElementById('vram-input').value) || 0;

  /* Pull the PC platform entry from the detailed game object */
  const pc     = selectedGame.platforms.find(p => p.platform.id === 4);
  const minReq = pc.requirements.minimum    || '';
  const recReq = pc.requirements.recommended || '';

  /* Parse RAM requirements; fall back to common defaults */
  const reqRamMin = parseRAM(minReq) || 8;
  const reqRamRec = parseRAM(recReq) || 16;

  /* Match user hardware against DB */
  const userGpu = getScore(gpuName, GPU_DB);
  const userCpu = getScore(cpuName, CPU_DB);

  /* Match hardware mentioned in requirement strings */
  const minGpu = findBestHardwareScore(minReq, GPU_DB);
  const recGpu = findBestHardwareScore(recReq, GPU_DB);
  const minCpu = findBestHardwareScore(minReq, CPU_DB);
  const recCpu = findBestHardwareScore(recReq, CPU_DB);

  /* ── Evaluate each component ── */
  // If we can't find the required component in the text, we give the user benefit of the doubt
  const gpuOkMin = userGpu && minGpu ? userGpu.score >= minGpu.score : !!userGpu;
  const gpuOkRec = userGpu && recGpu ? userGpu.score >= recGpu.score : false;
  const cpuOkMin = userCpu && minCpu ? userCpu.score >= minCpu.score : !!userCpu;
  const cpuOkRec = userCpu && recCpu ? userCpu.score >= recCpu.score : false;
  const ramOkMin = ram >= reqRamMin;
  const ramOkRec = ram >= reqRamRec;

  const issues   = [!gpuOkMin && 'gpu', !cpuOkMin && 'cpu', !ramOkMin && 'ram'].filter(Boolean);
  const canPlay  = issues.length === 0;
  const meetsRec = gpuOkRec && cpuOkRec && ramOkRec;

  /* ── Estimated quality level ── */
  let qualityLevel = 'Sin datos suficientes';
  let qualityClass = '';
  if (canPlay) {
    if (meetsRec && userGpu && recGpu && userGpu.score >= recGpu.score * 1.3) {
      qualityLevel = 'Ultra / Alto';   qualityClass = 'q-ok';
    } else if (meetsRec) {
      qualityLevel = 'Alto / Medio-Alto'; qualityClass = 'q-ok';
    } else {
      qualityLevel = 'Bajo / Medio';   qualityClass = 'q-warn';
    }
  } else {
    qualityLevel = 'No puede correrlo'; qualityClass = 'q-no';
  }

  /* ── Badge ── */
  const badge    = document.getElementById('result-badge');
  const gameName = document.getElementById('result-game-name');
  const body     = document.getElementById('result-body');
  const card     = document.getElementById('result-card');

  gameName.textContent = selectedGame.name;

  if (!canPlay) {
    badge.textContent = 'No compatible';
    badge.className   = 'result-badge badge-no';
  } else if (meetsRec) {
    badge.textContent = 'Totalmente compatible';
    badge.className   = 'result-badge badge-yes';
  } else {
    badge.textContent = 'Compatible (ajustes necesarios)';
    badge.className   = 'result-badge badge-warn';
  }

  /* ── Build result HTML ── */
  const gpuStatusClass = gpuOkMin ? 'q-status-ok' : 'q-status-no';
  const cpuStatusClass = cpuOkMin ? 'q-status-ok' : 'q-status-no';
  const ramStatusClass = ramOkMin ? 'q-status-ok' : 'q-status-no';

  let html = `
    <div class="quality-grid">
      <div class="quality-item ${gpuStatusClass}">
        <div class="q-label">GPU</div>
        <div class="q-value ${gpuOkMin ? 'q-ok' : 'q-no'}">${userGpu ? userGpu.name : gpuName || '—'}</div>
      </div>
      <div class="quality-item ${cpuStatusClass}">
        <div class="q-label">CPU</div>
        <div class="q-value ${cpuOkMin ? 'q-ok' : 'q-no'}">${userCpu ? userCpu.name : cpuName || '—'}</div>
      </div>
      <div class="quality-item ${ramStatusClass}">
        <div class="q-label">RAM</div>
        <div class="q-value ${ramOkMin ? 'q-ok' : 'q-no'}">${ram > 0 ? ram + ' GB' : '—'}</div>
      </div>
    </div>

    <div class="quality-level-block">
      <span class="ql-label">Calidad estimada</span>
      <span class="ql-value ${qualityClass}">${qualityLevel}</span>
    </div>

    <p class="req-section-title">Requisitos detectados del juego</p>
    <div class="req-grid">
      <div class="req-box">
        <div class="req-box-title">Mínimos</div>
        ${minGpu ? `<div>GPU: ${minGpu.name}</div>` : ''}
        ${minCpu ? `<div>CPU: ${minCpu.name}</div>` : ''}
        <div>RAM: ${reqRamMin} GB</div>
      </div>
      <div class="req-box">
        <div class="req-box-title">Recomendados</div>
        ${recGpu ? `<div>GPU: ${recGpu.name}</div>` : ''}
        ${recCpu ? `<div>CPU: ${recCpu.name}</div>` : ''}
        <div>RAM: ${reqRamRec} GB</div>
      </div>
    </div>
  `;

  /* ── Upgrade suggestions ── */
  if (!canPlay || !meetsRec) {
    html += `<div class="upgrade-section"><p class="upgrade-title">// Componentes a actualizar</p>`;

    if (!gpuOkMin || (!gpuOkRec && canPlay)) {
      const tier = (!userGpu || userGpu.score < 35) ? 'low' : userGpu.score < 55 ? 'mid' : 'high';
      html += `<div class="upgrade-item">
        <span class="upgrade-component">GPU</span>
        <span class="upgrade-suggestion">${GPU_UPGRADES[tier].join(' · ')}</span>
      </div>`;
    }
    if (!cpuOkMin || (!cpuOkRec && canPlay)) {
      const tier = (!userCpu || userCpu.score < 40) ? 'low' : userCpu.score < 60 ? 'mid' : 'high';
      html += `<div class="upgrade-item">
        <span class="upgrade-component">CPU</span>
        <span class="upgrade-suggestion">${CPU_UPGRADES[tier].join(' · ')}</span>
      </div>`;
    }
    if (!ramOkMin) {
      html += `<div class="upgrade-item">
        <span class="upgrade-component">RAM</span>
        <span class="upgrade-suggestion">Necesitas al menos ${reqRamMin} GB. Recomendado: ${reqRamRec} GB.</span>
      </div>`;
    }
    html += `</div>`;
  }

  body.innerHTML = html;
  // Force animation replay by removing and re-adding the class
  card.classList.remove('visible');
  void card.offsetWidth; // reflow
  card.classList.add('visible');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
