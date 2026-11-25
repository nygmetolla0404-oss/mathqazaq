#!/usr/bin/env python3
"""QAZAQ MATH — сынып серверi (тек Python 3, қосымша кiтапхана қажет емес).

Iске қосу:   python3 server.py          (немесе:  python3 server.py 8080)
Мұғалiм компьютерiнде iске қосылады. Оқушылар сол Wi-Fi желiсiнен экранда
көрсетiлген мекенжайға (мысалы http://192.168.1.15:8000) кiредi де,
бiрiн-бiрi картада көредi. Деректер data/students.json файлында сақталады.
"""
import csv, io, json, os, socket, sys, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data", "students.json")
ACCTS = os.path.join(ROOT, "data", "accounts.json")
ADMIN_LOGIN = "tetbenova"
ADMIN_HASH0 = "94e51fa6c5fdf661d005def6205dbad68ff77ac86aa358a66cedfc41f5a295fd"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
HEAD = ('<!doctype html><html lang="kk"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}'
        'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')

lock = threading.Lock()
students = {}
dirty = False
try:
    with open(DATA, encoding="utf-8") as f:
        for sid, s in json.load(f).items():
            s["presence"] = None
            students[sid] = s
except Exception:
    pass
accounts = {}
try:
    with open(ACCTS, encoding="utf-8") as f:
        accounts = json.load(f)
except Exception:
    pass


def admin_hash():
    return (accounts.get("__admin") or {}).get("hash") or ADMIN_HASH0


def save_accounts():
    os.makedirs(os.path.dirname(ACCTS), exist_ok=True)
    tmp = ACCTS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(accounts, f, ensure_ascii=False)
    os.replace(tmp, ACCTS)


def saver():
    global dirty
    while True:
        time.sleep(5)
        with lock:
            if not dirty:
                continue
            snap = {k: {"record": v.get("record"), "seen": v.get("seen", 0)} for k, v in students.items()}
            dirty = False
        os.makedirs(os.path.dirname(DATA), exist_ok=True)
        tmp = DATA + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(snap, f, ensure_ascii=False)
        os.replace(tmp, DATA)


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def send_json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/api/ping",):
            return self.send_json({"ok": True, "lan": f"http://{lan_ip()}:{PORT}/"})
        if path == "/api/export.csv":
            out = io.StringIO()
            w = csv.writer(out, delimiter=";")
            w.writerow(["Аты", "Тегі", "Сынып", "Уақыт (мин)", "Ұпай", "Жұлдыз", "Жол (км)", "Кеңес", "Соңғы белсенділік"])
            with lock:
                for s in students.values():
                    r = s.get("record") or {}
                    w.writerow([r.get("first", ""), r.get("last", ""), r.get("cls", ""), round((r.get("timeSec") or 0) / 60),
                                r.get("points", 0), r.get("stars", 0), r.get("km", 0), r.get("hints", 0),
                                time.strftime("%Y-%m-%d %H:%M", time.localtime(s.get("seen", 0) / 1000))])
            b = ("﻿" + out.getvalue()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="qazaq-math-students.csv"')
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            return self.wfile.write(b)
        if path.startswith("/data/") or path.startswith("/tools/") or path.startswith("/.git") or path.endswith(".py"):
            return self.send_error(404)
        if path in ("/", "/index.html"):
            with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
                page = f.read()
            b = (page if page.lstrip().lower().startswith("<!doctype") else HEAD + page + "</body></html>").encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            return self.wfile.write(b)
        return super().do_GET()

    def do_POST(self):
        global dirty
        if self.path.split("?")[0] == "/api/account":
            return self.account()
        if self.path.split("?")[0] != "/api/state":
            return self.send_error(404)
        n = int(self.headers.get("Content-Length") or 0)
        if n > 100_000:
            return self.send_error(413)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.send_error(400)
        rec, pres = body.get("record"), body.get("presence")
        now = int(time.time() * 1000)
        with lock:
            if isinstance(rec, dict) and isinstance(rec.get("sid"), str) and len(rec["sid"]) <= 40:
                s = students.setdefault(rec["sid"], {})
                s["record"], s["seen"] = rec, now
                if isinstance(pres, dict):
                    s["presence"] = pres
                dirty = True
            out = [{"sid": k, "record": v.get("record"), "presence": v.get("presence"), "seen": v.get("seen", 0)}
                   for k, v in students.items() if v.get("record")]
        return self.send_json({"now": now, "students": out})


def _account(self):
    global dirty
    n = int(self.headers.get("Content-Length") or 0)
    if n > 50_000:
        return self.send_error(413)
    try:
        b = json.loads(self.rfile.read(n) or b"{}")
    except Exception:
        return self.send_error(400)
    op = b.get("op")
    is_admin = b.get("admin") == admin_hash()
    with lock:
        if op == "login":
            a = accounts.get(str(b.get("login", "")).lower())
            if a and a.get("hash") == b.get("hash"):
                pub = {k: v for k, v in a.items() if k != "hash"}
                return self.send_json({"ok": True, "acc": pub})
            return self.send_json({"ok": False})
        if op == "register":
            acc = b.get("acc") or {}
            lg = str(acc.get("login", "")).lower()
            if not lg or lg == "__admin" or len(lg) > 24 or not isinstance(acc.get("hash"), str):
                return self.send_json({"ok": False, "err": "Логин дұрыс емес"})
            if lg in accounts:
                return self.send_json({"ok": False, "err": "Бұл логин бос емес"})
            accounts[lg] = {k: acc[k] for k in ("login", "hash", "first", "last", "cls", "char", "color", "sid", "createdAt") if k in acc}
            save_accounts()
            return self.send_json({"ok": True})
        if op == "admin":
            return self.send_json({"ok": is_admin})
        if not is_admin:
            return self.send_json({"ok": False, "err": "Рұқсат жоқ"})
        if op == "list":
            return self.send_json({"ok": True, "list": [{k: v for k, v in a.items() if k != "hash"} for lg, a in accounts.items() if lg != "__admin"]})
        if op == "delete":
            a = accounts.pop(str(b.get("login", "")).lower(), None)
            if a and a.get("sid") in students:
                students.pop(a["sid"], None)
                dirty = True
            save_accounts()
            return self.send_json({"ok": True})
        if op == "passwd":
            a = accounts.get(str(b.get("login", "")).lower())
            if not a:
                return self.send_json({"ok": False})
            a["hash"] = b.get("hash")
            save_accounts()
            return self.send_json({"ok": True})
        if op == "adminpw":
            accounts["__admin"] = {"login": "__admin", "hash": b.get("hash")}
            save_accounts()
            return self.send_json({"ok": True})
    return self.send_json({"ok": False})


H.account = _account


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    threading.Thread(target=saver, daemon=True).start()
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    print("\n  QAZAQ MATH сынып серверi iске қосылды!")
    print(f"  Мұғалiм:   http://localhost:{PORT}")
    print(f"  Оқушылар:  http://{lan_ip()}:{PORT}   (бiр Wi-Fi желiсiнде)")
    print("  Тоқтату: Ctrl+C\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
