/* ============================================================
   api/games.js — Vercel serverless function
   Proxies requests to RAWG so the API key never reaches the browser.

   Vercel detecta automáticamente este archivo y lo expone en:
     GET /api/games?query=cyberpunk       → búsqueda de juegos
     GET /api/games?id=3498               → detalle de un juego
   ============================================================ */

const RAWG_BASE = 'https://api.rawg.io/api';
const PC_PLATFORM_ID = 4;

export default async function handler(req, res) {
  // La key vive en las variables de entorno de Vercel, nunca en el código
  const key = process.env.RAWG_API_KEY;

  if (!key) {
    return res.status(500).json({ error: 'RAWG_API_KEY no configurada en el servidor.' });
  }

  const { query, id } = req.query;

  // Valida que venga exactamente uno de los dos parámetros
  if (!query && !id) {
    return res.status(400).json({ error: 'Se requiere el parámetro "query" o "id".' });
  }

  try {
    let rawgUrl;

    if (id) {
      // Detalle completo de un juego (incluye requisitos de sistema)
      rawgUrl = `${RAWG_BASE}/games/${encodeURIComponent(id)}?key=${key}`;
    } else {
      // Búsqueda por nombre, filtrada a PC (plataforma 4)
      rawgUrl = `${RAWG_BASE}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=15&platforms=${PC_PLATFORM_ID}`;
    }

    const rawgRes = await fetch(rawgUrl);

    if (!rawgRes.ok) {
      return res.status(rawgRes.status).json({ error: `Error de RAWG: ${rawgRes.status}` });
    }

    const data = await rawgRes.json();

    // Cache de 5 minutos en el CDN de Vercel para reducir llamadas a RAWG
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Error interno al contactar RAWG.' });
  }
}
