# willitrun.cc

Check if your PC is compatible with a video game based on your hardware components and the system requirements, retrieved in real time from the RAWG API.

## Project Structure

```
can-i-run-it/
├── api/
│   └── games.js            # Serverless function (Vercel) saves the API key
├── css/
│   ├── main.css            # Design variables, reset, base, typography
│   ├── components.css      # Cards, inputs, dropdowns, buttons, results
│   ├── animations.css      # Keyframes and transitions
│   ├── base.css            # Keyframes and transitions
│   ├── layout.css          # Keyframes and transitions
│   └── animations.css      # Keyframes and transitions
├── js/
│   ├── animations.css      # Keyframes and transitions
│   ├── data.js             # GPU/CPU databases and upgrade suggestions
│   ├── api.js              # Calls to our own endpoint (/api/games)
│   ├── i18n.js             # Calls to our own endpoint (/api/games)
│   ├── ui.js               # Calls to our own endpoint (/api/games)
│   ├── search.js           # Hardware autocomplete and game search
│   ├── compatibility.js    # Comparison logic and result rendering
│   └── main.js             # Entry point: event initialization
├── index.html
├── .gitignore
├── favicon.svg
└── README.md
```

## Why api/games.js Exists

The RAWG API requires a key. If that key were in `js/api.js`, anyone
could view it by opening the browser's DevTools. The serverless function acts as an
intermediary: the frontend calls `/api/games`, Vercel executes `api/games.js` on the
server with the key securely stored, and returns the data to the browser without
exposing the key.

## How to get a RAWG API key

1. Go to rawg.io and create a free account
2. In your profile, go to **API keys**
3. Copy the key and use it in Vercel

## Notes

- GPU and CPU scores are relative performance metrics, not official benchmarks.
- RAWG does not guarantee system requirements for all games; if they are not available, the site will indicate this.
