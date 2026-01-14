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
            "python",
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


def test_hsts_settings_enabled_in_production():
    base_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["DJANGO_SECRET_KEY"] = "production-secret-key-for-test"
    env["DEBUG"] = "False"
    env["TESTING"] = "False"
    env["PYTHONPATH"] = str(base_dir)

    result = subprocess.run(
        [
            "python",
            "-c",
            (
                "import os; "
                "os.environ['DEBUG']='False'; "
                "os.environ['TESTING']='False'; "
                "import config.settings; "
                "print(f'SECURE_HSTS_INCLUDE_SUBDOMAINS={config.settings.SECURE_HSTS_INCLUDE_SUBDOMAINS}'); "
                "print(f'SECURE_HSTS_PRELOAD={config.settings.SECURE_HSTS_PRELOAD}')"
            ),
        ],
        cwd=base_dir,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, f"Script failed: {result.stderr}"
    assert "SECURE_HSTS_INCLUDE_SUBDOMAINS=True" in result.stdout
    assert "SECURE_HSTS_PRELOAD=True" in result.stdout
