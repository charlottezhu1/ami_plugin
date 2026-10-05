import re

from flask import Flask, request, jsonify
from flask_cors import CORS
from py4j.java_gateway import JavaGateway

app = Flask(__name__)
CORS(app)

gateway = JavaGateway()  # connects to the SentiStrengthService gateway on port 25333

SCORE_PATTERN = re.compile(r'(-?\d+)\s+(-?\d+)')


def parse_score(raw):
    """Parse a SentiStrength 'pos neg' string (e.g. '3 -1') into its raw
    scores. Returned as-is (positive 1-5, negative -1 to -5, neutral
    baseline is 1/-1) — content.js classifies these with AffectFilter's own
    thresholds, kept separate from the AFINN engine's classification."""
    match = SCORE_PATTERN.search(str(raw or ''))
    if not match:
        return 1, -1
    return int(match.group(1)), int(match.group(2))


@app.route('/analyze', methods=['POST'])
def analyze():
    body = request.get_json(force=True, silent=True) or {}
    texts = body.get('texts') or []

    java_texts = gateway.jvm.java.util.ArrayList()
    for text in texts:
        java_texts.append(text or '')

    raw_scores = list(gateway.entry_point.getScores(java_texts))

    results = []
    for raw in raw_scores:
        positive, negative = parse_score(raw)
        results.append({'positive': positive, 'negative': negative})

    return jsonify({'results': results})


if __name__ == '__main__':
    app.run('127.0.0.1', port=5050, debug=True, use_reloader=False)
