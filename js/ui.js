/**
 * ui.js
 * Maneja todos los eventos del DOM: autocomplete de hardware,
 * búsqueda de juegos, selección y botón de verificar.
 */

// Estado global del juego seleccionado
let selectedGame      = null;
let gameSearchTimeout = null;

// --- Referencias al DOM ---
const gameInput    = document.getElementById('game-input');
const gameDropdown = document.getElementById('game-dropdown');
const gameStatus   = document.getElementById('game-status');
const checkBtn     = document.getElementById('check-btn');
const gameChip     = document.getElementById('selected-game-chip');

// --- Helpers de normalización y búsqueda fuzzy ---

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Busca coincidencias parciales de `query` en `db` por nombre.
 * @param {string} query
 * @param {Array}  db
 * @returns {Array} - Hasta 8 resultados
 */
function fuzzySearch(query, db) {
  const q = normalize(query);
  if (q.length < 2) return [];
  return db.filter(item => normalize(item.name).includes(q)).slice(0, 8);
}

// --- Autocomplete de GPU y CPU ---

/**
 * Configura el comportamiento de autocompletado para un campo de hardware.
 * @param {string} inputId    - ID del input
 * @param {string} dropdownId - ID del dropdown
 * @param {Array}  db         - Base de datos a buscar (GPU_DB o CPU_DB)
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
      // mousedown en lugar de click evita que el blur cierre el dropdown antes
      el.addEventListener('mousedown', e => {
        input.value = e.currentTarget.dataset.name;
        dropdown.style.display = 'none';
      });
    });
  });

  // Cierra al perder foco (con pequeño delay para que el mousedown pueda ejecutarse)
  input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 150));
}

setupAutocomplete('gpu-input', 'gpu-dropdown', GPU_DB);
setupAutocomplete('cpu-input', 'cpu-dropdown', CPU_DB);

// --- Búsqueda de juegos ---

gameInput.addEventListener('input', () => {
  clearTimeout(gameSearchTimeout);

  // Resetea estado al modificar el campo
  selectedGame = null;
  checkBtn.disabled = true;
  gameChip.classList.remove('visible', 'loading');
  gameChip.textContent = '';

  const q = gameInput.value.trim();
  if (q.length < 3) {
    gameDropdown.style.display = 'none';
    gameStatus.innerHTML = '';
    return;
  }

  gameStatus.innerHTML = '<p class="game-status-msg loading">Buscando juegos...</p>';

  // Debounce: espera 400ms tras la última tecla antes de llamar a la API
  gameSearchTimeout = setTimeout(() => handleGameSearch(q), 400);
});

/**
 * Llama a searchGames() y muestra el dropdown con los resultados.
 * @param {string} query
 */
async function handleGameSearch(query) {
  try {
    const results = await searchGames(query);
    gameStatus.innerHTML = '';

    if (!results.length) {
      gameDropdown.style.display = 'none';
      gameStatus.innerHTML = '<p class="game-status-msg info">No se encontraron juegos para ese nombre.</p>';
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
      el.addEventListener('mousedown', () => handleGameSelect(results[i]));
    });
  } catch (e) {
    gameStatus.innerHTML = '<p class="game-status-msg error">Error al conectar con la API. Verifica tu API key.</p>';
    gameDropdown.style.display = 'none';
  }
}

/**
 * Al elegir un juego, obtiene sus detalles completos (con requisitos) antes de habilitar el botón.
 * @param {Object} game - Resultado básico del listado de RAWG
 */
async function handleGameSelect(game) {
  gameInput.value = game.name;
  gameDropdown.style.display = 'none';
  selectedGame = null;
  checkBtn.disabled = true;

  // Muestra chip en estado "cargando"
  gameChip.textContent = `Cargando requisitos de ${game.name}...`;
  gameChip.className = 'selected-game-chip loading visible';
  gameStatus.innerHTML = '';

  try {
    const detail = await fetchGameDetails(game.id);

    if (!hasPcRequirements(detail)) {
      gameChip.textContent = `${game.name} — sin requisitos de PC disponibles`;
      gameChip.className = 'selected-game-chip visible';
      return; // El botón permanece deshabilitado
    }

    selectedGame = detail;
    gameChip.textContent = `${game.name} — requisitos disponibles`;
    gameChip.className = 'selected-game-chip visible';
    checkBtn.disabled = false;
  } catch (e) {
    gameChip.textContent = 'Error al obtener detalles del juego.';
    gameChip.className = 'selected-game-chip visible';
  }
}

// Cierra el dropdown de juegos al perder foco
gameInput.addEventListener('blur', () => setTimeout(() => gameDropdown.style.display = 'none', 150));

// --- Botón verificar ---

checkBtn.addEventListener('click', () => {
  if (!selectedGame) return;
  checkCompatibility(selectedGame);
});
