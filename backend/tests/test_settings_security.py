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


def test_security_headers_in_production():
    """Verify that security headers are enabled when DEBUG=False."""
    import os

    # We can't easily reload settings in the same process with different env vars,
    # so we'll check the current state (which should be test-safe) and then
    # use a subprocess to check the production configuration.

    base_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["DJANGO_SECRET_KEY"] = "s3cr3t"
    env["DEBUG"] = "False"
    env["TESTING"] = "False"
    env["PYTHONPATH"] = str(base_dir)

    # Helper script to inspect settings
    script = (
        "import os; "
        "import django; "
        "from django.conf import settings; "
        "os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); "
        "django.setup(); "
        "print(f'HSTS_SUBDOMAINS={settings.SECURE_HSTS_INCLUDE_SUBDOMAINS}'); "
        "print(f'HSTS_PRELOAD={settings.SECURE_HSTS_PRELOAD}'); "
        "print(f'SSL_REDIRECT={settings.SECURE_SSL_REDIRECT}'); "
    )

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=base_dir,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, f"Script failed: {result.stderr}"
    assert "HSTS_SUBDOMAINS=True" in result.stdout
    assert "HSTS_PRELOAD=True" in result.stdout
    assert "SSL_REDIRECT=True" in result.stdout
