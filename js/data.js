/* ============================================================
   data.js — hardware databases and upgrade tiers
   GPU scores basados en PassMark G3D Mark (videocardbenchmark.net)
   normalizados a escala 0-100 donde RTX 4090 = 100.
   CPU scores basados en PassMark CPU Mark (cpubenchmark.net)
   normalizados a escala 0-100 donde los mejores gaming CPUs = 100.
   Fuente: passmark.com — datos públicos, actualizados Mayo 2025.
   ============================================================ */

/*
  Escala GPU: RTX 4090 G3D = 38073 → 100
  Fórmula: Math.round(g3d / 38073 * 100)
  Ejemplo: RTX 3060 G3D ≈ 17000 → round(17000/38073*100) = 45
*/
const GPU_DB = [
  /* ── NVIDIA RTX 40 series ── */
  { name: 'RTX 4090',          score: 100, vram: 24 },
  { name: 'RTX 4080 Super',    score: 92,  vram: 16 },
  { name: 'RTX 4080',          score: 88,  vram: 16 },
  { name: 'RTX 4070 Ti Super', score: 84,  vram: 16 },
  { name: 'RTX 4070 Ti',       score: 83,  vram: 12 },
  { name: 'RTX 4070 Super',    score: 79,  vram: 12 },
  { name: 'RTX 4070',          score: 71,  vram: 12 },
  { name: 'RTX 4060 Ti',       score: 59,  vram: 8  },
  { name: 'RTX 4060',          score: 51,  vram: 8  },
  /* ── NVIDIA RTX 30 series ── */
  { name: 'RTX 3090 Ti',       score: 76,  vram: 24 },
  { name: 'RTX 3090',          score: 70,  vram: 24 },
  { name: 'RTX 3080 Ti',       score: 70,  vram: 12 },
  { name: 'RTX 3080',          score: 66,  vram: 10 },
  { name: 'RTX 3070 Ti',       score: 61,  vram: 8  },
  { name: 'RTX 3070',          score: 58,  vram: 8  },
  { name: 'RTX 3060 Ti',       score: 53,  vram: 8  },
  { name: 'RTX 3060',          score: 45,  vram: 12 },
  { name: 'RTX 3050',          score: 32,  vram: 8  },
  /* ── NVIDIA RTX 20 series ── */
  { name: 'RTX 2080 Ti',       score: 52,  vram: 11 },
  { name: 'RTX 2080 Super',    score: 46,  vram: 8  },
  { name: 'RTX 2080',          score: 44,  vram: 8  },
  { name: 'RTX 2070 Super',    score: 42,  vram: 8  },
  { name: 'RTX 2070',          score: 39,  vram: 8  },
  { name: 'RTX 2060 Super',    score: 36,  vram: 8  },
  { name: 'RTX 2060',          score: 33,  vram: 6  },
  /* ── NVIDIA GTX 10 series ── */
  { name: 'GTX 1080 Ti',       score: 41,  vram: 11 },
  { name: 'GTX 1080',          score: 32,  vram: 8  },
  { name: 'GTX 1070 Ti',       score: 28,  vram: 8  },
  { name: 'GTX 1070',          score: 26,  vram: 8  },
  { name: 'GTX 1660 Super',    score: 27,  vram: 6  },
  { name: 'GTX 1660 Ti',       score: 26,  vram: 6  },
  { name: 'GTX 1660',          score: 23,  vram: 6  },
  { name: 'GTX 1060 6GB',      score: 18,  vram: 6  },
  { name: 'GTX 1060 3GB',      score: 16,  vram: 3  },
  { name: 'GTX 1050 Ti',       score: 12,  vram: 4  },
  { name: 'GTX 1050',          score: 9,   vram: 2  },
  /* ── AMD RX 7000 series ── */
  { name: 'RX 7900 XTX',       score: 91,  vram: 24 },
  { name: 'RX 7900 XT',        score: 82,  vram: 20 },
  { name: 'RX 7800 XT',        score: 64,  vram: 16 },
  { name: 'RX 7700 XT',        score: 55,  vram: 12 },
  { name: 'RX 7600',           score: 43,  vram: 8  },
  /* ── AMD RX 6000 series ── */
  { name: 'RX 6950 XT',        score: 79,  vram: 16 },
  { name: 'RX 6900 XT',        score: 75,  vram: 16 },
  { name: 'RX 6800 XT',        score: 70,  vram: 16 },
  { name: 'RX 6800',           score: 63,  vram: 16 },
  { name: 'RX 6750 XT',        score: 55,  vram: 12 },
  { name: 'RX 6700 XT',        score: 52,  vram: 12 },
  { name: 'RX 6700',           score: 47,  vram: 10 },
  { name: 'RX 6600 XT',        score: 42,  vram: 8  },
  { name: 'RX 6600',           score: 38,  vram: 8  },
  /* ── AMD RX 5000 series ── */
  { name: 'RX 5700 XT',        score: 37,  vram: 8  },
  { name: 'RX 5700',           score: 34,  vram: 8  },
  { name: 'RX 5600 XT',        score: 30,  vram: 6  },
  /* ── AMD RX 500 series ── */
  { name: 'RX 580',            score: 16,  vram: 8  },
  { name: 'RX 570',            score: 13,  vram: 4  },
  /* ── Intel Arc ── */
  { name: 'Arc A770',          score: 44,  vram: 16 },
  { name: 'Arc A750',          score: 38,  vram: 8  },
];

/*
  Escala CPU: basada en PassMark CPU Mark normalizado.
  Los mejores CPUs gaming (i9-14900K, Ryzen 9 7950X) rondan 60000-70000 pts.
  Escala: top_gaming = 100, i5-9400F ≈ 18000 → ~28
*/
const CPU_DB = [
  /* ── Intel 14th gen ── */
  { name: 'Core i9-14900K',   score: 100 },
  { name: 'Core i7-14700K',   score: 95  },
  { name: 'Core i5-14600K',   score: 86  },
  /* ── Intel 13th gen ── */
  { name: 'Core i9-13900K',   score: 98  },
  { name: 'Core i7-13700K',   score: 90  },
  { name: 'Core i5-13600K',   score: 82  },
  /* ── Intel 12th gen ── */
  { name: 'Core i9-12900K',   score: 88  },
  { name: 'Core i7-12700K',   score: 82  },
  { name: 'Core i7-12700F',   score: 80  },
  { name: 'Core i5-12600K',   score: 74  },
  { name: 'Core i5-12400F',   score: 64  },
  { name: 'Core i5-12400',    score: 63  },
  { name: 'Core i3-12100F',   score: 52  },
  /* ── Intel 11th gen ── */
  { name: 'Core i9-11900K',   score: 72  },
  { name: 'Core i7-11700K',   score: 70  },
  { name: 'Core i5-11600K',   score: 62  },
  { name: 'Core i5-11400F',   score: 58  },
  /* ── Intel 10th gen ── */
  { name: 'Core i9-10900K',   score: 68  },
  { name: 'Core i7-10700K',   score: 65  },
  { name: 'Core i7-10700F',   score: 63  },
  { name: 'Core i5-10600K',   score: 58  },
  { name: 'Core i5-10400F',   score: 50  },
  { name: 'Core i3-10100F',   score: 40  },
  /* ── Intel 9th gen ── */
  { name: 'Core i9-9900K',    score: 60  },
  { name: 'Core i7-9700K',    score: 55  },
  { name: 'Core i5-9600K',    score: 46  },
  { name: 'Core i5-9400F',    score: 42  },
  /* ── AMD Ryzen 7000 series ── */
  { name: 'Ryzen 9 7950X',    score: 100 },
  { name: 'Ryzen 9 7900X',    score: 96  },
  { name: 'Ryzen 7 7700X',    score: 88  },
  { name: 'Ryzen 7 7700',     score: 84  },
  { name: 'Ryzen 5 7600X',    score: 82  },
  { name: 'Ryzen 5 7600',     score: 78  },
  /* ── AMD Ryzen 5000 series ── */
  { name: 'Ryzen 9 5950X',    score: 92  },
  { name: 'Ryzen 9 5900X',    score: 87  },
  { name: 'Ryzen 7 5800X3D',  score: 86  },
  { name: 'Ryzen 7 5800X',    score: 78  },
  { name: 'Ryzen 7 5700X',    score: 72  },
  { name: 'Ryzen 5 5600X',    score: 70  },
  { name: 'Ryzen 5 5600',     score: 66  },
  { name: 'Ryzen 5 5500',     score: 58  },
  /* ── AMD Ryzen 3000 series ── */
  { name: 'Ryzen 9 3900X',    score: 72  },
  { name: 'Ryzen 7 3800X',    score: 62  },
  { name: 'Ryzen 7 3700X',    score: 60  },
  { name: 'Ryzen 5 3600X',    score: 54  },
  { name: 'Ryzen 5 3600',     score: 52  },
  { name: 'Ryzen 5 3500X',    score: 44  },
  { name: 'Ryzen 3 3300X',    score: 42  },
  { name: 'Ryzen 3 3100',     score: 36  },
];

/* Sugerencias de upgrade agrupadas por tier de rendimiento actual */
const GPU_UPGRADES = {
  low:   ['RTX 3060', 'RX 6600 XT', 'RTX 3060 Ti'],
  mid:   ['RTX 3070', 'RX 6700 XT', 'RTX 4060 Ti'],
  high:  ['RTX 4070', 'RX 7700 XT', 'RTX 4070 Super'],
  ultra: ['RTX 4080', 'RX 7800 XT', 'RTX 4070 Ti Super'],
};

const CPU_UPGRADES = {
  low:  ['Ryzen 5 5600', 'Core i5-12400F', 'Ryzen 5 3600'],
  mid:  ['Ryzen 5 5600X', 'Core i5-12600K', 'Ryzen 7 5700X'],
  high: ['Ryzen 7 5800X', 'Core i7-12700F', 'Ryzen 7 7700'],
};

/*
  VRAM mínima requerida por resolución — límite duro independiente del score.
  Si el juego requiere más VRAM de la que tiene la GPU del usuario, falla
  sin importar qué tan alto sea el score de rendimiento.
*/
const VRAM_MINIMUMS = {
  '1080p': 4,
  '1440p': 8,
  '4k':    12,
};