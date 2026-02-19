from pathlib import Path

DATA_DIR = Path("data")
RUNS_DIR = DATA_DIR / "run"

RUNS_DIR.mkdir(parents=True, exist_ok=True)