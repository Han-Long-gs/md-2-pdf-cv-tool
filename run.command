#!/bin/bash
# Double-click launcher for md2pdf-cv. Run setup.sh once before using this.
cd "$(dirname "$0")"

# Defensive fallback for Apple Silicon Homebrew installs, in case WeasyPrint's
# cffi bindings can't auto-locate pango/cairo/gdk-pixbuf dylibs.
export DYLD_FALLBACK_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_FALLBACK_LIBRARY_PATH"

if [ ! -d ".venv" ]; then
  echo "No .venv found. Run setup.sh first (bash setup.sh)."
  read -p "Press enter to close..."
  exit 1
fi

source .venv/bin/activate
python app.py
