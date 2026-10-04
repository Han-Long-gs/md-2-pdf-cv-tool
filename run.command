#!/bin/bash
# Double-click launcher for md2pdf-cv. Runs setup.sh automatically on first launch.
# Follow symlinks (e.g. a Desktop shortcut) back to the real project folder.
SCRIPT="$0"
while [ -L "$SCRIPT" ]; do
  LINK="$(readlink "$SCRIPT")"
  case "$LINK" in
    /*) SCRIPT="$LINK" ;;
    *) SCRIPT="$(dirname "$SCRIPT")/$LINK" ;;
  esac
done
cd "$(dirname "$SCRIPT")"

# Defensive fallback for Apple Silicon Homebrew installs, in case WeasyPrint's
# cffi bindings can't auto-locate pango/cairo/gdk-pixbuf dylibs.
export DYLD_FALLBACK_LIBRARY_PATH="/opt/homebrew/lib:/usr/local/lib:$DYLD_FALLBACK_LIBRARY_PATH"

if [ ! -x ".venv/bin/python" ]; then
  echo "First launch: running setup (this takes a few minutes)..."
  if ! bash setup.sh; then
    echo "Setup failed. See the messages above."
    read -p "Press enter to close..."
    exit 1
  fi
fi

source .venv/bin/activate
python app.py
