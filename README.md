# AMI — Affect Mix Index

AMI is a Chrome extension that shows the emotional ("affective") makeup of the posts on a Twitter/X page. It scores every tweet it sees, outlines each tweet with a color for its category, and draws a live bar chart of the mix in the page's side navigation.

Each tweet is placed in one of five categories:

| Code | Meaning |
|------|---------|
| HAN | High Arousal Negative |
| LAN | Low Arousal Negative |
| NEU | Neutral |
| LAP | Low Arousal Positive |
| HAP | High Arousal Positive |

## Repository layout

```
ami_plugin/
├── chrome_extension/   Manifest V3 extension (content script, background worker, AFINN lexicon)
└── backend/            Optional local server: Flask + py4j bridge to the Java SentiStrength library
```

## How it works

```
 twitter.com / x.com page
   content.js ── MutationObserver finds [data-testid='tweet'] nodes as you scroll
      │
      ├─► AFINN engine (sentiment.js, runs in the page, no network)
      │
      └─► chrome.runtime message ─► background.js ─► POST http://localhost:5050/analyze
                                                       │
                                  backend/app.py (Flask) ─ py4j ─► SentiStrengthService (Java, port 25333)
```

- **Two engines run on every tweet.** AFINN is built into the extension. SentiStrength is optional and needs the local backend. A dropdown in the chart switches which engine's counts and tweet borders are shown. The choice is saved in `chrome.storage.local`, and the two engines' counts are kept separate.
- **Classification** is done in `content.js`: `classifyAffect` for AFINN and `classifySentiStrengthAffect` for SentiStrength, each with its own thresholds. The backend only returns raw positive and negative scores.
- **Export:** clicking the extension's toolbar icon downloads two `.txt` files. One has the category counts and the other has the tweet text, both named after the current page.

## Quick start

1. **Extension (AFINN only):** open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked*, and select the `chrome_extension/` folder. Then open [twitter.com](https://twitter.com) or x.com. No account is needed. Reload the page when you move to a new feed so the chart restarts.
2. **SentiStrength (optional):** start the backend as described in [backend/README.md](backend/README.md), then pick *SentiStrength (local server)* in the chart dropdown.

See [chrome_extension/README.md](chrome_extension/README.md) for the screenshot-based install guide.

## Notes

- Supported sites are `*.twitter.com` and `*.x.com`. The tweet selectors depend on Twitter's current DOM and may break when it changes.
- The extension is written for Chrome only.
- Some leftovers from earlier versions remain in `chrome_extension/`. `main.html` and `popup.js` are an old demo pop-up titled "CALMFilter", and `badge.js` is a stub. The manifest does not use any of them.
- `backend/venv/` is a local virtualenv, not project source, and the repo has no `.gitignore` for it yet.
- The git status shows the old top-level extension files as deleted. The same files now live in `chrome_extension/`.
