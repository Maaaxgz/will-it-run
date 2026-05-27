/* ============================================================
   compatibility.js — hardware comparison and result rendering

   Mejoras respecto a la versión anterior:
   1. Scores basados en PassMark G3D/CPU Mark normalizados
   2. VRAM como límite duro: si el juego requiere más VRAM de la
      disponible, la GPU falla independientemente del score
   3. CPU bottleneck: penaliza si el CPU es mucho más débil que
      la GPU, ya que limita el rendimiento real en juego
   4. Calidad estimada por ratio continuo en vez de 3 buckets
      fijos, dando resultados más granulares
   ============================================================ */

/* ── Helpers ─────────────────────────────────────────────── */

/** Case-insensitive exact → partial → reverse-partial match */
function getScore(name, db) {
  const n = normalize(name);
  return db.find(x => normalize(x.name) === n)
      || db.find(x => normalize(x.name).includes(n))
      || db.find(x => n.includes(normalize(x.name)))
      || null;
}

/** Extrae un número de un string de requisitos buscando keywords */
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

/** Extrae VRAM requerida del texto de requisitos (ej: "4 GB VRAM") */
function parseVRAM(str) {
  return parseNum(str, ['gb vram', 'vram: ', 'video ram', 'video memory', 'dedicated video'])
      || parseNum(str, ['vram']);
}

/** Encuentra el hardware de mayor score mencionado en un string de requisitos */
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

/**
 * Calcula el factor de bottleneck del CPU.
 * Si el CPU es mucho más débil que la GPU, el rendimiento real
 * queda limitado por el CPU en juegos CPU-bound.
 * Retorna un multiplicador entre 0.6 y 1.0.
 *
 * Lógica: si cpu_score < gpu_score * 0.5 hay bottleneck severo.
 * Esta es una heurística — el bottleneck real depende del juego.
 */
function cpuBottleneckFactor(cpuScore, gpuScore) {
  if (!cpuScore || !gpuScore) return 1.0;
  const ratio = cpuScore / gpuScore;
  if (ratio >= 0.7) return 1.0;          // sin bottleneck notable
  if (ratio >= 0.5) return 0.85;         // bottleneck leve (~15% perf lost)
  if (ratio >= 0.35) return 0.72;        // bottleneck moderado
  return 0.60;                           // bottleneck severo
}

/**
 * Determina el nivel de calidad estimado a partir del ratio
 * entre el score efectivo del usuario y el score recomendado.
 * Usa una escala continua en vez de 3 buckets fijos.
 */
function estimateQuality(effectiveGpuScore, recGpuScore, s) {
  if (!recGpuScore) return { label: s.qualityNoData, cls: '' };

  const ratio = effectiveGpuScore / recGpuScore;

  if (ratio >= 1.5)  return { label: s.qualityUltra,    cls: 'q-ok'  };
  if (ratio >= 1.0)  return { label: s.qualityHigh,     cls: 'q-ok'  };
  if (ratio >= 0.75) return { label: s.qualityMedium,   cls: 'q-warn' };
  if (ratio >= 0.5)  return { label: s.qualityLow,      cls: 'q-warn' };
  return               { label: s.qualityCannotRun, cls: 'q-no'  };
}

/* ── Main function ────────────────────────────────────────── */

function checkCompatibility() {
  if (!selectedGame) return;

  const s       = t();
  const gpuName = document.getElementById('gpu-input').value.trim();
  const cpuName = document.getElementById('cpu-input').value.trim();
  const ram     = parseFloat(document.getElementById('ram-input').value) || 0;
  const userVram = parseFloat(document.getElementById('vram-input').value) || 0;

  const pc     = selectedGame.platforms.find(p => p.platform.id === 4);
  const minReq = pc.requirements.minimum     || '';
  const recReq = pc.requirements.recommended || '';

  /* ── Parsear requisitos ── */
  const reqRamMin  = parseRAM(minReq)  || 8;
  const reqRamRec  = parseRAM(recReq)  || 16;
  // VRAM requerida: toma el valor más alto entre mínimos y recomendados
  const reqVramMin = parseVRAM(minReq) || 0;
  const reqVramRec = parseVRAM(recReq) || 0;

  /* ── Obtener hardware del usuario y del juego ── */
  const userGpu = getScore(gpuName, GPU_DB);
  const userCpu = getScore(cpuName, CPU_DB);
  const minGpu  = findBestHardwareScore(minReq, GPU_DB);
  const recGpu  = findBestHardwareScore(recReq, GPU_DB);
  const minCpu  = findBestHardwareScore(minReq, CPU_DB);
  const recCpu  = findBestHardwareScore(recReq, CPU_DB);

  /* ── VRAM efectiva: usa la del input si se proporcionó,
        si no usa la del GPU_DB si se reconoció la GPU ── */
  const effectiveVram = userVram > 0 ? userVram : (userGpu ? userGpu.vram : 0);

  /* ── Límite duro de VRAM ──
     Si el juego especifica VRAM requerida y la GPU no llega, falla.
     Independiente del score de rendimiento. */
  const vramOkMin = reqVramMin === 0 || effectiveVram === 0 || effectiveVram >= reqVramMin;
  const vramOkRec = reqVramRec === 0 || effectiveVram === 0 || effectiveVram >= reqVramRec;

  /* ── Score vs requisitos ── */
  const gpuOkMin = userGpu && minGpu ? userGpu.score >= minGpu.score : !!userGpu;
  const gpuOkRec = userGpu && recGpu ? userGpu.score >= recGpu.score : false;
  const cpuOkMin = userCpu && minCpu ? userCpu.score >= minCpu.score : !!userCpu;
  const cpuOkRec = userCpu && recCpu ? userCpu.score >= recCpu.score : false;
  const ramOkMin = ram >= reqRamMin;
  const ramOkRec = ram >= reqRamRec;

  /* ── Fallo por VRAM sobreescribe el resultado de GPU ──
     Si la GPU pasa el score pero no tiene suficiente VRAM, falla igual */
  const gpuPassesMin = gpuOkMin && vramOkMin;
  const gpuPassesRec = gpuOkRec && vramOkRec;

  const canPlay  = gpuPassesMin && cpuOkMin && ramOkMin;
  const meetsRec = gpuPassesRec && cpuOkRec && ramOkRec;

  /* ── Score efectivo del usuario con factor de bottleneck CPU ──
     Ajusta el score de GPU según qué tan bien lo acompaña el CPU */
  const bottleneck = cpuBottleneckFactor(
    userCpu ? userCpu.score : null,
    userGpu ? userGpu.score : null
  );
  const effectiveGpuScore = userGpu ? userGpu.score * bottleneck : 0;

  /* ── Calidad estimada ── */
  const quality = canPlay
    ? estimateQuality(effectiveGpuScore, recGpu ? recGpu.score : null, s)
    : { label: s.qualityCannotRun, cls: 'q-no' };

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

  /* ── Determinar estado de cada componente para el display ── */
  // GPU: falla si no pasa score O si no pasa VRAM
  const gpuStatus = gpuPassesMin ? 'q-status-ok' : 'q-status-no';
  const gpuColor  = gpuPassesMin ? 'q-ok' : 'q-no';
  const cpuStatus = cpuOkMin ? 'q-status-ok' : 'q-status-no';
  const cpuColor  = cpuOkMin ? 'q-ok' : 'q-no';
  const ramStatus = ramOkMin ? 'q-status-ok' : 'q-status-no';
  const ramColor  = ramOkMin ? 'q-ok' : 'q-no';

  // Nota de bottleneck — solo si canPlay y hay penalización real
  const bottleneckNote = (canPlay && bottleneck < 1.0 && userCpu && userGpu)
    ? `<p style="font-size:11px; color:var(--amber); font-family:var(--font-mono);
        letter-spacing:0.04em; margin-top:0.6rem;">
        ⚠ ${s.bottleneckWarning}
       </p>`
    : '';

  // Nota de VRAM insuficiente — si la VRAM es el factor que hace fallar
  const vramNote = (!vramOkMin && effectiveVram > 0 && reqVramMin > 0)
    ? `<p style="font-size:11px; color:var(--red); font-family:var(--font-mono);
        letter-spacing:0.04em; margin-top:0.6rem;">
        ✕ ${s.vramWarning(effectiveVram, reqVramMin)}
       </p>`
    : '';

  /* ── HTML del resultado ── */
  let html = `
    <div class="quality-grid">
      <div class="quality-item ${gpuStatus}">
        <div class="q-label">GPU</div>
        <div class="q-value ${gpuColor}">${userGpu ? userGpu.name : gpuName || '—'}</div>
      </div>
      <div class="quality-item ${cpuStatus}">
        <div class="q-label">CPU</div>
        <div class="q-value ${cpuColor}">${userCpu ? userCpu.name : cpuName || '—'}</div>
      </div>
      <div class="quality-item ${ramStatus}">
        <div class="q-label">RAM</div>
        <div class="q-value ${ramColor}">${ram > 0 ? ram + ' GB' : '—'}</div>
      </div>
    </div>

    <div class="quality-level-block">
      <span class="ql-label">${s.estimatedQuality}</span>
      <span class="ql-value ${quality.cls}">${quality.label}</span>
    </div>

    ${bottleneckNote}
    ${vramNote}

    <p class="req-section-title">${s.detectedReqs}</p>
    <div class="req-grid">
      <div class="req-box">
        <div class="req-box-title">${s.reqMinimum}</div>
        ${minGpu ? `<div>GPU: ${minGpu.name}</div>` : ''}
        ${minCpu ? `<div>CPU: ${minCpu.name}</div>` : ''}
        ${reqVramMin ? `<div>VRAM: ${reqVramMin} GB</div>` : ''}
        <div>RAM: ${reqRamMin} GB</div>
      </div>
      <div class="req-box">
        <div class="req-box-title">${s.reqRecommended}</div>
        ${recGpu ? `<div>GPU: ${recGpu.name}</div>` : ''}
        ${recCpu ? `<div>CPU: ${recCpu.name}</div>` : ''}
        ${reqVramRec ? `<div>VRAM: ${reqVramRec} GB</div>` : ''}
        <div>RAM: ${reqRamRec} GB</div>
      </div>
    </div>
  `;

  /* ── Sugerencias de upgrade ── */
  if (!canPlay || !meetsRec) {
    html += `<div class="upgrade-section"><p class="upgrade-title">${s.upgradeTitle}</p>`;

    if (!gpuPassesMin || (!gpuPassesRec && canPlay)) {
      const tier = (!userGpu || userGpu.score < 25) ? 'low'
                 : userGpu.score < 45 ? 'mid'
                 : userGpu.score < 65 ? 'high'
                 : 'ultra';
      html += `<div class="upgrade-item">
        <span class="upgrade-component">GPU</span>
        <span class="upgrade-suggestion">${GPU_UPGRADES[tier] ? GPU_UPGRADES[tier].join(' · ') : GPU_UPGRADES.high.join(' · ')}</span>
      </div>`;
    }
    if (!cpuOkMin || (!cpuOkRec && canPlay)) {
      const tier = (!userCpu || userCpu.score < 40) ? 'low'
                 : userCpu.score < 65 ? 'mid'
                 : 'high';
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