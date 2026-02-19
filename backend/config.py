import os
import shutil
import tempfile
import uuid
import datetime

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
    return r"C:apache-jmeter-5.6.3\bin"