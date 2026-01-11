import os
import subprocess
import sys
from pathlib import Path


def test_missing_secret_key_raises_in_production():
    base_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["DJANGO_SECRET_KEY"] = ""
    env["DEBUG"] = "False"
    env["TESTING"] = "False"
    env["PYTHONPATH"] = str(base_dir)

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "import os; "
                "os.environ['DEBUG']='False'; "
                "os.environ['TESTING']='False'; "
                "import config.settings"
            ),
        ],
        cwd=base_dir,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert "DJANGO_SECRET_KEY must be set in production" in result.stderr
