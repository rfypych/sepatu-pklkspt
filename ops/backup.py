import os
import sys
import subprocess
from datetime import datetime
from urllib.parse import urlparse

DEST = "/var/backups/sepatu"
LOG = "/var/log/sepatu-backup.log"
LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = "51555"
LOCAL_DB = "sepatu_db"
LOCAL_USER = "sepatu_user"

os.makedirs(f"{DEST}/harian", exist_ok=True)
os.makedirs(f"{DEST}/mingguan", exist_ok=True)
os.makedirs(f"{DEST}/bulanan", exist_ok=True)

def log(msg):
    t = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"{t} | {msg}"
    print(line)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

env_file = "/root/sepatu-pklkspt/.env"
neon_url = None
local_pass = None

if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEON_DATABASE_URL="):
                raw = line.split("=", 1)[1].strip()
                neon_url = raw.strip('"').strip("'").strip()
            elif line.startswith("POSTGRES_PASSWORD="):
                raw = line.split("=", 1)[1].strip()
                local_pass = raw.strip('"').strip("'").strip()

stamp = datetime.now().strftime("%Y%m%d-%H%M")
filename = f"sepatu_db-{stamp}.dump"
target = os.path.join(DEST, "harian", filename)

log(f"Memulai proses backup database (Neon URL detected: {bool(neon_url)})...")

dump_ok = False

if neon_url:
    try:
        u = urlparse(neon_url)
        log(f"Parsed Neon URL -> Scheme: {u.scheme}, Host: {u.hostname}, Path: {u.path}")
        if u.hostname:
            log(f"Mengambil backup dump langsung dari Neon Cloud ({u.hostname})...")
            env_cloud = os.environ.copy()
            env_cloud["PGHOST"] = u.hostname
            env_cloud["PGPORT"] = str(u.port or 5432)
            env_cloud["PGDATABASE"] = u.path.lstrip("/")
            if u.username: env_cloud["PGUSER"] = u.username
            if u.password: env_cloud["PGPASSWORD"] = u.password
            env_cloud["PGSSLMODE"] = "require"

            cmd = ["pg_dump", "-Fc", "-f", target]
            res = subprocess.run(cmd, env=env_cloud, capture_output=True, text=True)
            if res.returncode == 0:
                dump_ok = True
                log("Berhasil dump langsung dari Neon Cloud PostgreSQL!")
            else:
                log(f"Gagal dump dari Neon Cloud (code {res.returncode}): {res.stderr.strip()}")
    except Exception as e:
        log(f"Error koneksi Neon Cloud: {e}")

if not dump_ok:
    log("Mengambil dump dari database lokal VPS...")
    my_env = os.environ.copy()
    if local_pass:
        my_env["PGPASSWORD"] = local_pass
    cmd = [
        "pg_dump",
        "-h", LOCAL_HOST,
        "-p", LOCAL_PORT,
        "-U", LOCAL_USER,
        "-d", LOCAL_DB,
        "-Fc",
        "-f", target
    ]
    res = subprocess.run(cmd, env=my_env, capture_output=True, text=True)
    if res.returncode == 0:
        dump_ok = True
        log("Berhasil dump dari database lokal VPS!")
    else:
        log(f"GAGAL TOTAL pg_dump: {res.stderr.strip()}")
        sys.exit(1)

# Verifikasi file
size = os.path.getsize(target) if os.path.exists(target) else 0
if size < 512:
    log(f"GAGAL: Hasil dump terlalu kecil ({size} bytes)")
    sys.exit(1)

# Uji integritas
chk = subprocess.run(["pg_restore", "--list", target], capture_output=True, text=True)
if chk.returncode != 0:
    log("GAGAL: File dump korup")
    sys.exit(1)

obj_count = len([l for l in chk.stdout.splitlines() if l and l[0].isdigit()])
log(f"Dump valid: {obj_count} objek ({size} bytes)")

# Replikasi ke local database VPS jika dump berasal dari cloud
if dump_ok and neon_url:
    log("Menyinkronkan salinan Cloud ke database lokal VPS (Port 51555)...")
    my_env = os.environ.copy()
    if local_pass:
        my_env["PGPASSWORD"] = local_pass
    subprocess.run([
        "pg_restore",
        "-h", LOCAL_HOST,
        "-p", LOCAL_PORT,
        "-U", LOCAL_USER,
        "-d", LOCAL_DB,
        "--clean",
        "--if-exists",
        target
    ], env=my_env, capture_output=True)

# Salinan mingguan & bulanan
today = datetime.now()
if today.weekday() == 0: # Senin
    weekly_target = os.path.join(DEST, "mingguan", filename)
    try: os.link(target, weekly_target)
    except: pass

if today.day == 1:
    monthly_target = os.path.join(DEST, "bulanan", filename)
    try: os.link(target, monthly_target)
    except: pass

# Rotasi file lama
def rotate(subdir, keep):
    p = os.path.join(DEST, subdir)
    if not os.path.exists(p): return
    files = sorted([os.path.join(p, f) for f in os.listdir(p) if f.endswith(".dump")], key=os.path.getmtime)
    excess = len(files) - keep
    if excess > 0:
        for f in files[:excess]:
            try:
                os.remove(f)
                log(f"Rotasi: hapus {os.path.basename(f)}")
            except: pass

rotate("harian", 14)
rotate("mingguan", 8)
rotate("bulanan", 6)

log(f"SELESAI: Backup & Sync sukses disimpan di {target}")

# Simpan riwayat log ke database (Neon Cloud dan/atau VPS Local)
try:
    import urllib.request
    import json
    
    summary_text = f"Backup & Sync sukses: {obj_count} objek ({size} bytes) disimpan di {filename} & direplikasi ke local port 51555"
    payload = json.dumps({
        "status": "SUCCESS",
        "source": "Neon Cloud PostgreSQL",
        "destination": "VPS Local Vault (/var/backups/sepatu)",
        "file_name": filename,
        "file_size_bytes": size,
        "object_count": obj_count,
        "summary": summary_text,
        "log_output": f"Dump valid: {obj_count} objek ({size} bytes)\nTarget: {target}\nReplikasi ke database lokal VPS 51555 berhasil."
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "https://server-eta-six-49.vercel.app/api/dev/backup-logs",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    urllib.request.urlopen(req, timeout=10)
    log("Riwayat backup berhasil dicatat ke dashboard developer!")
except Exception as ex:
    log(f"Catatan log ke dashboard dilewati: {ex}")

