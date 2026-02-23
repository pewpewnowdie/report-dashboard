import json
from pathlib import Path
from db.models.jmeter_run import JmeterRun
from db.models.pytest_run import PytestRun

def save_run_files(run_id, run_data: JmeterRun, files):
    run_dir = Path("data/run") / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    run_data = run_data.__dict__

    (run_dir / "test.jmx").write_bytes(files["jmx"])
    (run_dir / "result.jtl").write_bytes(files["jtl"])
    (run_dir / "jmeter.log").write_bytes(files["log"])

    return {"jmx": str(run_dir / "test.jmx"), "jtl": str(run_dir / "result.jtl"), "log": str(run_dir / "jmeter.log")}

def save_run_files_pytest(run_id, run_data: PytestRun, files):
    run_dir = Path("data/run") / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    run_data = run_data.__dict__

    (run_dir / "result.json").write_bytes(files["json"])
    (run_dir / "pytest.log").write_bytes(files["log"])

    return {"json_path": str(run_dir / "result.json"), "log_path": str(run_dir / "pytest.log")}