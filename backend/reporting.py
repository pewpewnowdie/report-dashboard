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

def generate_html_report_robot(run_id, rebot_bin, xml_path):
    run_dir = Path("data/run") / run_id
    xml = Path(xml_path)
    full_xml = os.path.join(os.getcwd(), xml)
    report_dir = run_dir / "report"
    full_report_dir = os.path.join(os.getcwd(), report_dir)

    report_dir.mkdir(parents=True, exist_ok=True)

    cmd = rebot_bin + [
        "--outputdir", str(full_report_dir),
        str(full_xml)
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )

    report_path = report_dir / "report.html"
    log_path = report_dir / "log.html"

    if result.returncode > 250:
      raise RuntimeError(
          f"Report generation failed: {result.stderr}"
      )
    
    return str(report_path), str(log_path)

if __name__ == "__main__":
    run_id = "65af00f5-ebe9-485b-9617-57458a9e9417"
    robot_bin = ['C:\\Users\\Kshitij\\AppData\\Local\\Programs\\Python\\Python313\\Scripts\\rebot.exe']
    xml_path = "data\\run\\65af00f5-ebe9-485b-9617-57458a9e9417\\output.xml"

    report_path, log_path = generate_html_report_robot(run_id, robot_bin, xml_path)
    print(f"Report generated at: {report_path}")
    print(f"Log generated at: {log_path}")