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

/** Called by the check button */
function checkCompatibility() {
  if (!selectedGame) return;

  const s        = t(); // active language strings
  const gpuName  = document.getElementById('gpu-input').value.trim();
  const cpuName  = document.getElementById('cpu-input').value.trim();
  const ram      = parseFloat(document.getElementById('ram-input').value) || 0;

  const pc     = selectedGame.platforms.find(p => p.platform.id === 4);
  const minReq = pc.requirements.minimum     || '';
  const recReq = pc.requirements.recommended || '';

  const reqRamMin = parseRAM(minReq) || 8;
  const reqRamRec = parseRAM(recReq) || 16;

  const userGpu = getScore(gpuName, GPU_DB);
  const userCpu = getScore(cpuName, CPU_DB);
  const minGpu  = findBestHardwareScore(minReq, GPU_DB);
  const recGpu  = findBestHardwareScore(recReq, GPU_DB);
  const minCpu  = findBestHardwareScore(minReq, CPU_DB);
  const recCpu  = findBestHardwareScore(recReq, CPU_DB);

  const gpuOkMin = userGpu && minGpu ? userGpu.score >= minGpu.score : !!userGpu;
  const gpuOkRec = userGpu && recGpu ? userGpu.score >= recGpu.score : false;
  const cpuOkMin = userCpu && minCpu ? userCpu.score >= minCpu.score : !!userCpu;
  const cpuOkRec = userCpu && recCpu ? userCpu.score >= recCpu.score : false;
  const ramOkMin = ram >= reqRamMin;
  const ramOkRec = ram >= reqRamRec;

  const canPlay  = gpuOkMin && cpuOkMin && ramOkMin;
  const meetsRec = gpuOkRec && cpuOkRec && ramOkRec;

  /* ── Quality level ── */
  let qualityLevel = s.qualityNoData;
  let qualityClass = '';
  if (canPlay) {
    if (meetsRec && userGpu && recGpu && userGpu.score >= recGpu.score * 1.3) {
      qualityLevel = s.qualityUltra; qualityClass = 'q-ok';
    } else if (meetsRec) {
      qualityLevel = s.qualityHigh;  qualityClass = 'q-ok';
    } else {
      qualityLevel = s.qualityLow;   qualityClass = 'q-warn';
    }
  } else {
    qualityLevel = s.qualityCannotRun; qualityClass = 'q-no';
  }

  /* ── Badge ── */
  const badge    = document.getElementById('result-badge');
  const gameName = document.getElementById('result-game-name');
  const body     = document.getElementById('result-body');
  const card     = document.getElementById('result-card');

  gameName.textContent = selectedGame.name;

  if (!canPlay) {
    badge.textContent = s.badgeNo;
    badge.className   = 'result-badge badge-no';
  } else if (meetsRec) {
    badge.textContent = s.badgeYes;
    badge.className   = 'result-badge badge-yes';
  } else {
    badge.textContent = s.badgeWarn;
    badge.className   = 'result-badge badge-warn';
  }

  /* ── Result HTML ── */
  let html = `
    <div class="quality-grid">
      <div class="quality-item ${gpuOkMin ? 'q-status-ok' : 'q-status-no'}">
        <div class="q-label">GPU</div>
        <div class="q-value ${gpuOkMin ? 'q-ok' : 'q-no'}">${userGpu ? userGpu.name : gpuName || '—'}</div>
      </div>
      <div class="quality-item ${cpuOkMin ? 'q-status-ok' : 'q-status-no'}">
        <div class="q-label">CPU</div>
        <div class="q-value ${cpuOkMin ? 'q-ok' : 'q-no'}">${userCpu ? userCpu.name : cpuName || '—'}</div>
      </div>
      <div class="quality-item ${ramOkMin ? 'q-status-ok' : 'q-status-no'}">
        <div class="q-label">RAM</div>
        <div class="q-value ${ramOkMin ? 'q-ok' : 'q-no'}">${ram > 0 ? ram + ' GB' : '—'}</div>
      </div>
    </div>

    <div class="quality-level-block">
      <span class="ql-label">${s.estimatedQuality}</span>
      <span class="ql-value ${qualityClass}">${qualityLevel}</span>
    </div>

    <p class="req-section-title">${s.detectedReqs}</p>
    <div class="req-grid">
      <div class="req-box">
        <div class="req-box-title">${s.reqMinimum}</div>
        ${minGpu ? `<div>GPU: ${minGpu.name}</div>` : ''}
        ${minCpu ? `<div>CPU: ${minCpu.name}</div>` : ''}
        <div>RAM: ${reqRamMin} GB</div>
      </div>
      <div class="req-box">
        <div class="req-box-title">${s.reqRecommended}</div>
        ${recGpu ? `<div>GPU: ${recGpu.name}</div>` : ''}
        ${recCpu ? `<div>CPU: ${recCpu.name}</div>` : ''}
        <div>RAM: ${reqRamRec} GB</div>
      </div>
    </div>
  `;

  /* ── Upgrade suggestions ── */
  if (!canPlay || !meetsRec) {
    html += `<div class="upgrade-section"><p class="upgrade-title">${s.upgradeTitle}</p>`;

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
        <span class="upgrade-suggestion">${s.upgradeRam(reqRamMin, reqRamRec)}</span>
      </div>`;
    }
    html += `</div>`;
  }

  body.innerHTML = html;
  card.classList.remove('visible');
  void card.offsetWidth;
  card.classList.add('visible');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
