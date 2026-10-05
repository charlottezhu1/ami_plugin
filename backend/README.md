# AMI Backend — SentiStrength service

A local server that scores text with [SentiStrength](http://sentistrength.wlv.ac.uk/) for the AMI Chrome extension's *SentiStrength (local server)* engine. It is optional: the extension's built-in AFINN engine works without it.

## Architecture

```
Chrome extension ─► background.js ─► POST http://localhost:5050/analyze
                                          │
                                     app.py (Flask + CORS)
                                          │  py4j, port 25333
                                     py4j/src/calmfilter/SentiStrengthService.java
                                          │
                                     libs/SentiStrength.jar  +  en/ lexicon files
```

| Path | Purpose |
|------|---------|
| `app.py` | Flask app with one route, `POST /analyze`, listening on `127.0.0.1:5050`. It connects to the Java gateway and parses SentiStrength's `"pos neg"` strings into numbers. |
| `py4j/src/calmfilter/SentiStrengthService.java` | Loads SentiStrength with the `en/` data folder and exposes `getScore` and `getScores` through a py4j `GatewayServer` on port 25333. |
| `py4j/compile.sh`, `py4j/run.sh` | Compile the Java service into `classes/`, and run it. |
| `py4j/libs/` | `SentiStrength.jar` and `py4j-0.10.9.9.jar`. |
| `py4j/en/` | SentiStrength English lexicons (sentiment, booster, negation, emoticon, idiom, slang and others). |
| `requirements.txt` | Python dependencies: `flask`, `flask_cors` and `py4j==0.10.9.9`. The py4j version must match the jar. |
| `venv/` | Local virtualenv (not part of the source). |

## Requirements

- Python 3.9 or later (a Python 3.12 venv is used here)
- A JDK, which provides `java` and `javac`

## Setup (once)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`py4j/classes/` already holds a compiled class. To rebuild it after editing the Java source:

```bash
cd backend/py4j && ./compile.sh
```

## Run

Use two terminals and start the Java gateway first.

```bash
# Terminal 1: Java gateway (SentiStrength), port 25333
cd backend/py4j
./run.sh
```

```bash
# Terminal 2: Flask API, port 5050
cd backend
source venv/bin/activate
python3 app.py
```

Then choose *SentiStrength (local server)* in the AMI chart dropdown on twitter.com or x.com. If either process is down, the extension logs the error and retries on the next pass.

## API

`POST /analyze`

```json
{ "texts": ["I love this!", "This is awful"] }
```

Response, with one result per input, in the same order:

```json
{ "results": [ { "positive": 3, "negative": -1 }, { "positive": 1, "negative": -4 } ] }
```

- `positive` ranges from 1 to 5 and `negative` from -1 to -5. The neutral baseline is `1 / -1`, not `0 / 0`.
- Text that can't be parsed gives `{ "positive": 1, "negative": -1 }`.
- The server does no categorization. `chrome_extension/content.js` maps the scores to HAN, LAN, NEU, LAP or HAP in `classifySentiStrengthAffect`: neutral when the scores are 1 and -1, LAP for positive 2, HAP for positive 3 or more, LAN for negative -2, HAN for negative -3 or lower.

Quick test:

```bash
curl -s -X POST http://localhost:5050/analyze \
  -H 'Content-Type: application/json' \
  -d '{"texts":["I love this!","This is awful"]}'
```

## Notes

- The server binds to `127.0.0.1` only and enables CORS for all origins. It is meant for local use, not deployment. It runs with `debug=True`, so don't expose it.
- `chrome_extension/manifest.json` lists `http://localhost:5050/*` in `host_permissions`. If you change the port, update `app.py`, `background.js` and the manifest together.
- The Java service, SentiStrength jar and lexicon files were copied from the ThreadsFilter project (`Jeanne_Group_Projects/ThreadsFilter/backend/py4j/`). Check SentiStrength's license terms before redistributing the jar and data.
