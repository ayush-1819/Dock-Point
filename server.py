"""Dock Point local server (Python 3 standard library only).
Serves the site and saves changes into the JSON files in /data.
Run:  python server.py   ->  open http://localhost:8000"""
import json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(ROOT, 'data')

# Load the private API key from .env (server-side only; never send it to browser JS).
def load_env():
    env_path = os.path.join(ROOT, '.env')
    if not os.path.isfile(env_path):
        return
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip().strip('\\"').strip("'"))
load_env()
AI_API_KEY = os.environ.get('AI_API_KEY', '')

def rd(n):
    with open(os.path.join(D, n + '.json'), encoding='utf-8') as f: return json.load(f)
def wr(n, v):
    with open(os.path.join(D, n + '.json'), 'w', encoding='utf-8') as f: json.dump(v, f, indent=2)
# Create the local registrations file on first run (it is intentionally not tracked by Git).
os.makedirs(D, exist_ok=True)
if not os.path.exists(os.path.join(D, 'new_users.json')):
    wr('new_users', [])
class H(SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def js(s, code, obj):
        b = json.dumps(obj).encode(); s.send_response(code)
        s.send_header('Content-Type', 'application/json'); s.send_header('Content-Length', str(len(b))); s.end_headers(); s.wfile.write(b)
    def do_GET(s):
        # Never allow private environment files to be downloaded over HTTP.
        if s.path.split('?', 1)[0] in ('/.env', '/.env.example'):
            return s.send_error(404)
        if s.path == '/api/db': return s.js(200, {k: rd(k) for k in ('clients', 'new_users', 'authority', 'port')})
        super().do_GET()
    def do_POST(s):
        p = s.path.split('/')
        # authority.json is read-only: there is no way to create or change an authority account
        if len(p) != 4 or p[1] != 'api' or p[2] != 'save' or p[3] not in ('clients', 'new_users', 'port'):
            return s.js(403, {'error': 'not allowed'})
        data = json.loads(s.rfile.read(int(s.headers.get('Content-Length', 0))))
        if p[3] in ('clients', 'new_users'):
            other = rd('new_users' if p[3] == 'clients' else 'clients')
            em = [u['email'].lower() for u in data + other]
            if len(em) != len(set(em)): return s.js(409, {'error': 'duplicate email id'})
        wr(p[3], data); s.js(200, {'ok': True})
if __name__ == '__main__':
    print('Dock Point running at http://localhost:8000  (Ctrl+C to stop)')
    ThreadingHTTPServer(('', 8000), H).serve_forever()
