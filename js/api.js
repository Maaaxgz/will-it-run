/* ============================================================
   api.js — calls to our own Vercel endpoint (/api/games)
   The API key never appears here; it lives in Vercel env vars.
   ============================================================ */

const PC_PLATFORM_ID = 4;

/**
 * Search games by name via our serverless proxy.
 * @param {string} query
 * @returns {Promise<Object[]>} array of game objects from RAWG
 */
async function searchGamesAPI(query) {
  const res = await fetch(`/api/games?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  // Keep only games that list PC as a platform
  return (data.results || []).filter(g =>
    (g.platforms || []).some(p => p.platform.id === PC_PLATFORM_ID)
  );
}

/**
 * Fetch full game detail (includes PC requirements) via our proxy.
 * @param {number} id - RAWG game id
 * @returns {Promise<Object>} detailed game object
 */
async function fetchGameDetail(id) {
  const res = await fetch(`/api/games?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
