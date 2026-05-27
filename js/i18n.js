/* ============================================================
   i18n.js — UI strings for ES and EN
   To add a language: duplicate one object and translate values.
   ============================================================ */

const TRANSLATIONS = {
  es: {
    /* Page */
    pageTitle:        'Will it run?',
    siteTitle:        'Will it run?',
    siteSubtitle:     '// ingresa tus componentes · busca un juego · verifica',

    /* Section labels */
    labelComponents:  'Tus componentes',
    labelSearch:      'Buscar juego',

    /* Field labels */
    labelGpu:         'GPU (tarjeta gráfica)',
    labelCpu:         'CPU (procesador)',
    labelRam:         'RAM (GB)',
    labelVram:        'VRAM (GB)',
    optional:         '(opcional)',

    /* Placeholders */
    phGpu:            'Ej: RTX 3060',
    phCpu:            'Ej: i5-12400F',
    phRam:            'Ej: 16',
    phVram:           'Ej: 8',
    phGame:           'Escribe el nombre del juego…',

    /* Button */
    btnCheck:         'Verificar compatibilidad',

    /* Search states */
    searching:        'Buscando juegos',
    noResults:        'No se encontraron juegos para ese nombre.',
    apiError:         'Error al conectar con la API. Verifica tu API key.',
    loadingReqs:      (name) => `Cargando requisitos de ${name}…`,
    noReqsFound:      (name) => `${name} — sin requisitos de PC en la base de datos`,
    reqsAvailable:    (name) => `✓ ${name} — requisitos de PC disponibles`,
    detailError:      'Error al obtener detalles del juego.',

    /* Result badges */
    badgeNo:          'No compatible',
    badgeYes:         'Totalmente compatible',
    badgeWarn:        'Compatible (ajustes necesarios)',

    /* Quality levels */
    qualityNoData:    'Sin datos suficientes',
    qualityUltra:     'Ultra / Alto',
    qualityHigh:      'Alto / Medio-Alto',
    qualityMedium:    'Medio',
    qualityLow:       'Bajo',
    qualityCannotRun: 'No puede correrlo',

    /* Warnings */
    bottleneckWarning: 'El CPU puede limitar el rendimiento de tu GPU en este juego.',
    vramWarning:      (has, req) => `Tu GPU tiene ${has} GB de VRAM — el juego requiere ${req} GB mínimo.`,

    /* Result sections */
    estimatedQuality: 'Calidad estimada',
    detectedReqs:     'Requisitos detectados del juego',
    reqMinimum:       'Mínimos',
    reqRecommended:   'Recomendados',
    upgradeTitle:     '// Componentes a actualizar',
    upgradeRam:       (min, rec) => `Necesitas al menos ${min} GB. Recomendado: ${rec} GB.`,
    footerCredit:     'Hecho por Maaaxgz',
  },

  en: {
    /* Page */
    pageTitle:        'Will it run?',
    siteTitle:        'Will it run?',
    siteSubtitle:     '// enter your components · search a game · verify',

    /* Section labels */
    labelComponents:  'Your components',
    labelSearch:      'Search game',

    /* Field labels */
    labelGpu:         'GPU (graphics card)',
    labelCpu:         'CPU (processor)',
    labelRam:         'RAM (GB)',
    labelVram:        'VRAM (GB)',
    optional:         '(optional)',

    /* Placeholders */
    phGpu:            'e.g. RTX 3060',
    phCpu:            'e.g. i5-12400F',
    phRam:            'e.g. 16',
    phVram:           'e.g. 8',
    phGame:           'Type the game name…',

    /* Button */
    btnCheck:         'Check compatibility',

    /* Search states */
    searching:        'Searching games',
    noResults:        'No games found for that name.',
    apiError:         'Failed to connect to the API. Check your API key.',
    loadingReqs:      (name) => `Loading requirements for ${name}…`,
    noReqsFound:      (name) => `${name} — no PC requirements in the database`,
    reqsAvailable:    (name) => `✓ ${name} — PC requirements available`,
    detailError:      'Failed to fetch game details.',

    /* Result badges */
    badgeNo:          'Not compatible',
    badgeYes:         'Fully compatible',
    badgeWarn:        'Compatible (adjustments needed)',

    /* Quality levels */
    qualityNoData:    'Not enough data',
    qualityUltra:     'Ultra / High',
    qualityHigh:      'High / Medium-High',
    qualityMedium:    'Medium',
    qualityLow:       'Low',
    qualityCannotRun: 'Cannot run it',

    /* Warnings */
    bottleneckWarning: 'Your CPU may limit GPU performance in this game.',
    vramWarning:      (has, req) => `Your GPU has ${has} GB VRAM — the game requires at least ${req} GB.`,

    /* Result sections */
    estimatedQuality: 'Estimated quality',
    detectedReqs:     'Detected game requirements',
    reqMinimum:       'Minimum',
    reqRecommended:   'Recommended',
    upgradeTitle:     '// Components to upgrade',
    upgradeRam:       (min, rec) => `You need at least ${min} GB. Recommended: ${rec} GB.`,
    footerCredit:     'Made by Maaaxgz',
  },
};

/* Active language — default español */
let currentLang = localStorage.getItem('lang') || 'es';

/** Returns the translation object for the active language */
function t() {
  return TRANSLATIONS[currentLang] || TRANSLATIONS.es;
}

/** Applies all i18n strings to the DOM */
function applyTranslations() {
  const s = t();

  document.documentElement.lang         = currentLang;
  document.title                        = s.pageTitle;
  document.getElementById('site-title').textContent    = s.siteTitle;
  document.getElementById('site-subtitle').textContent = s.siteSubtitle;
  document.getElementById('components-label').textContent = s.labelComponents;
  document.getElementById('game-label').textContent    = s.labelSearch;

  document.querySelector('label[for="gpu-input"]').textContent  = s.labelGpu;
  document.querySelector('label[for="cpu-input"]').textContent  = s.labelCpu;
  document.querySelector('label[for="ram-input"]').textContent  = s.labelRam;

  // VRAM label has an <span> child for "(optional)" — rebuild it
  const vramLabel = document.querySelector('label[for="vram-input"]');
  vramLabel.textContent = s.labelVram + ' ';
  const optSpan = document.createElement('span');
  optSpan.className = 'optional';
  optSpan.textContent = s.optional;
  vramLabel.appendChild(optSpan);

  document.getElementById('game-input').placeholder   = s.phGame;
  document.getElementById('gpu-input').placeholder    = s.phGpu;
  document.getElementById('cpu-input').placeholder    = s.phCpu;
  document.getElementById('ram-input').placeholder    = s.phRam;
  document.getElementById('vram-input').placeholder   = s.phVram;
  document.getElementById('check-btn').textContent    = s.btnCheck;

  // Update active state on lang buttons
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.classList.toggle('btn-lang--active', btn.dataset.lang === currentLang);
  });

  document.getElementById('footer-link').textContent = s.footerCredit;
}