/* ============================================================
   main.js — inicialización: check button y theme toggle
   ============================================================ */

/* ── Verificar compatibilidad ────────────────────────────── */
document.getElementById('check-btn').addEventListener('click', checkCompatibility);

/* ── Theme toggle ────────────────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
const STORAGE_KEY = 'nier-theme';

/** Aplica el tema dado ('light' | 'dark') y actualiza el botón */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggle.textContent = '■ Claro';
  } else {
    document.documentElement.classList.remove('dark');
    themeToggle.textContent = '■ Oscuro';
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

// Restaura tema al cargar: primero localStorage, luego preferencia del sistema
const saved   = localStorage.getItem(STORAGE_KEY);
const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

applyTheme(saved ?? (sysDark ? 'dark' : 'light'));
