import json
from pathlib import Path
from db.models.run import Run

def save_run_files(run_id, run_data: Run, files):
    run_dir = Path("data/run") / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    run_data = run_data.__dict__

    (run_dir / "test.jmx").write_bytes(files["jmx"])
    (run_dir / "result.jtl").write_bytes(files["jtl"])
    (run_dir / "jmeter.log").write_bytes(files["log"])

    return {"jmx": str(run_dir / "test.jmx"), "jtl": str(run_dir / "result.jtl"), "log": str(run_dir / "jmeter.log")}