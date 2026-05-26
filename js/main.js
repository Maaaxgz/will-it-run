/* ============================================================
   main.js — inicialización: check button, theme toggle, i18n
   ============================================================ */

/* ── Verificar compatibilidad ────────────────────────────── */
document.getElementById('check-btn').addEventListener('click', checkCompatibility);

/* ── Theme toggle ────────────────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggle.textContent = '■ ' + (currentLang === 'en' ? 'Light' : 'Claro');
  } else {
    document.documentElement.classList.remove('dark');
    themeToggle.textContent = '■ ' + (currentLang === 'en' ? 'Dark' : 'Oscuro');
  }
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

/* ── Language toggle ─────────────────────────────────────── */
document.querySelectorAll('.btn-lang').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem('lang', currentLang);
    applyTranslations();
    // Update theme button label to match new language
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'dark' : 'light');
  });
});

/* ── Init ────────────────────────────────────────────────── */
const savedTheme = localStorage.getItem('theme');
const sysDark    = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ?? (sysDark ? 'dark' : 'light'));
applyTranslations();
