import os
import shutil
import tempfile
import uuid
import datetime
import subprocess

def get_work_dir(run_id=None):
    if not run_id:
        run_id = f"{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    base = os.path.join(tempfile.gettempdir(), "jmctl")
    if run_id:
        return os.path.join(base, run_id)
    return base

def get_jmeter():
    jmeter_cmd = shutil.which("jmeter") or shutil.which("jmeter.bat")
    if jmeter_cmd:
        return jmeter_cmd
    return r"C:\apache-jmeter-5.6.3\bin\jmeter"

def get_rebot():
    rebot_path = subprocess.run(["where", "rebot"], capture_output=True, text=True).stdout.strip()
    for path in rebot_path.splitlines():
        if "Scripts" in path and ".venv" in path.lower():
            continue
        if "AppData" in path and "Temp" in path:
            continue
        return [path]
    raise FileNotFoundError("rebot not found in PATH. Please install robot framework to use rctl.")
