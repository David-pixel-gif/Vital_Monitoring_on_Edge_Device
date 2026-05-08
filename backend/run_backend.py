import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
SITE_PACKAGES = BASE_DIR / "myenv" / "Lib" / "site-packages"

if SITE_PACKAGES.exists():
    sys.path.append(str(SITE_PACKAGES))
sys.path.append(str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

from django.core.management import execute_from_command_line


if __name__ == "__main__":
    execute_from_command_line(sys.argv)
