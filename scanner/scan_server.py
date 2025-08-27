import os
import sys
import subprocess
from datetime import datetime
from flask import Flask, send_file, jsonify, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SCAN_DIR = os.path.join(BASE_DIR, "scans")
NAPS2_PATH = os.path.join(BASE_DIR, "naps2.console.exe")
os.makedirs(SCAN_DIR, exist_ok=True)

# --- أضف أسطر الطباعة هنا ---
print("BASE_DIR:", BASE_DIR)
print("SCAN_DIR:", SCAN_DIR)
print("NAPS2_PATH:", NAPS2_PATH)
# ---------------------------

def cors_error(msg, code=500):
    r = make_response(jsonify({"error": msg}), code)
    r.headers["Access-Control-Allow-Origin"] = "*"
    return r

@app.route("/scan", methods=["POST"])
def scan():
    filename = f"scan_{datetime.now():%Y%m%d_%H%M%S}.jpg"
    filepath = os.path.join(SCAN_DIR, filename)

    if not os.path.isfile(NAPS2_PATH):
        return cors_error(f"NAPS2 not found: {NAPS2_PATH}")

    cmd = [
        NAPS2_PATH,
        "--driver", "wia",
        "--device", "CANON DR-M160 USB",
        "--source", "glass",
        "-o", filepath,
        "-f", "jpg",
    ]
    print("تشغيل الأمر:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)

    if res.returncode != 0 or not os.path.exists(filepath):
        return cors_error(res.stdout or res.stderr or "No pages scanned")

    return send_file(filepath, mimetype="image/jpeg")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5123)
