import subprocess
from pathlib import Path

def generate_html_report(run_id, jmeter_bin):
    run_dir = Path("data/run") / run_id
    jtl = run_dir / "result.jtl"
    report_dir = run_dir / "report"

    report_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        jmeter_bin,
        "-g", str(jtl),
        "-o", str(report_dir)
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