import subprocess
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
log_path = project_root / "dev-server.log"

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200

with log_path.open("ab") as log_file:
    subprocess.Popen(
        ["C:\\Windows\\System32\\cmd.exe", "/c", "npm run dev -- --host 127.0.0.1 --port 8081"],
        cwd=project_root,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
        stderr=log_file,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
    )

print(log_path)
