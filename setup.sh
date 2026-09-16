#!/bin/bash
# One-time setup for md2pdf-cv. Run with: bash setup.sh
set -e

cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install Python 3 (e.g. from python.org) and re-run this script."
  exit 1
fi

# Prefer the framework-build python3 if available — better Cocoa/WebKit
# compatibility for pywebview on macOS than pyenv-shimmed builds.
PY=python3
if [ -x "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3" ]; then
  PY="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"
fi

if command -v brew >/dev/null 2>&1; then
  echo "Installing/checking system libraries WeasyPrint needs (pango, cairo, gdk-pixbuf, libffi)..."
  brew install pango cairo gdk-pixbuf libffi || true
else
  echo "Warning: Homebrew not found. WeasyPrint requires pango, cairo, gdk-pixbuf, and libffi."
  echo "Install Homebrew (https://brew.sh) then run: brew install pango cairo gdk-pixbuf libffi"
fi

echo "Creating virtual environment (.venv)..."
"$PY" -m venv .venv

echo "Installing Python dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

chmod +x run.command
mkdir -p output

echo ""
echo "Setup complete. Double-click run.command to launch md2pdf-cv."
echo "(If WeasyPrint fails to load with a library-load error on Apple Silicon,"
echo " see the comment in run.command about DYLD_FALLBACK_LIBRARY_PATH.)"
