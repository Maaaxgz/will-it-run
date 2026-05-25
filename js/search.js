/* ============================================================
   search.js — GPU/CPU autocomplete and game search logic
   ============================================================ */

let selectedGame = null;
let gameSearchTimeout = null;

/* ── DOM refs ─────────────────────────────────────────────── */
const gameInput    = document.getElementById('game-input');
const gameDropdown = document.getElementById('game-dropdown');
const gameStatus   = document.getElementById('game-status');
const checkBtn     = document.getElementById('check-btn');

/* ── Helpers ─────────────────────────────────────────────── */

/** Lowercase + collapse whitespace for fuzzy comparison */
function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Returns DB entries whose name contains the query string */
function fuzzySearch(query, db) {
  const q = normalize(query);
  if (q.length < 2) return [];
  return db.filter(item => normalize(item.name).includes(q)).slice(0, 8);
}

/* ── Generic hardware autocomplete ───────────────────────── */

/**
 * Attaches autocomplete behaviour to a hardware input field.
 * @param {string} inputId
 * @param {string} dropdownId
 * @param {Object[]} db - GPU_DB or CPU_DB
 */
function setupAutocomplete(inputId, dropdownId, db) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);

  input.addEventListener('input', () => {
    const results = fuzzySearch(input.value, db);
    if (!results.length || !input.value) {
      dropdown.style.display = 'none';
      return;
    }
    dropdown.innerHTML = results.map(item =>
      `<div class="dropdown-item" data-name="${item.name}">${item.name}</div>`
    ).join('');
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.dropdown-item').forEach(el => {
      // mousedown fires before blur so the click registers correctly
      el.addEventListener('mousedown', e => {
        input.value = e.currentTarget.dataset.name;
        dropdown.style.display = 'none';
      });
    });
  });

  input.addEventListener('blur', () =>
    setTimeout(() => { dropdown.style.display = 'none'; }, 150)
  );
}

/* ── Game search ──────────────────────────────────────────── */

gameInput.addEventListener('input', () => {
  clearTimeout(gameSearchTimeout);
  selectedGame = null;
  checkBtn.disabled = true;
  document.getElementById('selected-game-display').style.display = 'none';

  const q = gameInput.value.trim();
  if (q.length < 3) {
    gameDropdown.style.display = 'none';
    gameStatus.innerHTML = '';
    return;
  }
  gameStatus.innerHTML = '<p class="loading-msg">Buscando juegos</p>';
  // Debounce: wait 400ms after last keystroke before hitting API
  gameSearchTimeout = setTimeout(() => searchGames(q), 400);
});

/** Calls RAWG search and renders the dropdown */
async function searchGames(query) {
  try {
    const results = await searchGamesAPI(query);
    gameStatus.innerHTML = '';

    if (!results.length) {
      gameDropdown.style.display = 'none';
      gameStatus.innerHTML = '<p class="loading-msg">No se encontraron juegos para ese nombre.</p>';
      return;
    }

    gameDropdown.innerHTML = results.map((g, i) =>
      `<div class="game-item" data-index="${i}">
         <span class="game-name">${g.name}</span>
         <span class="game-meta">${g.released ? g.released.slice(0, 4) : '—'} · ${(g.genres || []).map(x => x.name).slice(0, 2).join(', ')}</span>
       </div>`
    ).join('');
    gameDropdown.style.display = 'block';

    gameDropdown.querySelectorAll('.game-item').forEach((el, i) => {
      el.addEventListener('mousedown', () => selectGame(results[i]));
    });
  } catch (e) {
    gameStatus.innerHTML = '<p class="error-msg">Error al conectar con la API. Verifica tu API key.</p>';
    gameDropdown.style.display = 'none';
  }
}

/**
 * Fetches full game detail on selection to get PC requirements.
 * Shows loading state while the second API call completes.
 * @param {Object} game - lightweight game object from search results
 */
async function selectGame(game) {
  gameInput.value = game.name;
  gameDropdown.style.display = 'none';
  selectedGame = null;
  checkBtn.disabled = true;
  gameStatus.innerHTML = '';

  const disp = document.getElementById('selected-game-display');
  disp.style.display = 'block';
  disp.innerHTML = `<div class="selected-game-info loading">Cargando requisitos de ${game.name}…</div>`;

  try {
    const detail = await fetchGameDetail(game.id);
    const pc = (detail.platforms || []).find(p => p.platform.id === 4);
    const hasReqs = pc && pc.requirements && (pc.requirements.minimum || pc.requirements.recommended);

    if (!hasReqs) {
      disp.innerHTML = `<div class="selected-game-info no-reqs">${game.name} — sin requisitos de PC en la base de datos</div>`;
      return; // button stays disabled
    }

    selectedGame = detail;
    disp.innerHTML = `<div class="selected-game-info">✓ ${game.name} — requisitos de PC disponibles</div>`;
    checkBtn.disabled = false;
  } catch (e) {
    disp.innerHTML = `<div class="selected-game-info no-reqs">Error al obtener detalles del juego.</div>`;
  }
}

gameInput.addEventListener('blur', () =>
  setTimeout(() => { gameDropdown.style.display = 'none'; }, 150)
);

/* Init hardware autocomplete fields */
setupAutocomplete('gpu-input', 'gpu-dropdown', GPU_DB);
setupAutocomplete('cpu-input', 'cpu-dropdown', CPU_DB);
