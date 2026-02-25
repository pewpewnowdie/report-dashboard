import subprocess
from pathlib import Path
import os
import shutil

def generate_html_report(run_id, jmeter_bin, jtl_path):
    run_dir = Path("data/run") / run_id
    jtl = Path(jtl_path)
    full_jtl = os.path.join(os.getcwd(), jtl)
    report_dir = run_dir / "report"
    full_report_dir = os.path.join(os.getcwd(), report_dir)

    report_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        jmeter_bin,
        "-g", str(full_jtl),
        "-o", str(full_report_dir)
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"Report generation failed: {result.stderr}"
        )
    
    return str(report_dir)