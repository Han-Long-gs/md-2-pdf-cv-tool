# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A macOS desktop app (pywebview) that converts a Markdown resume/CV into a styled, print-ready PDF. The live preview and the final PDF are rendered by the exact same code path, so what you see in the app is exactly what gets written to disk.

## Commands

Setup (one-time, macOS):
```bash
bash setup.sh          # installs Homebrew libs (pango/cairo/gdk-pixbuf/libffi), creates .venv, installs requirements.txt
```

Run the app:
```bash
./run.command           # or: source .venv/bin/activate && python app.py
```

JS tests (no package.json — Node's built-in test runner, run directly against the file):
```bash
node --test tests/startup.test.cjs
```

There is no Python test suite currently.

## Architecture

Three layers, each with one job:

- **`app.py`** — pywebview entry point. Defines `Api`, exposed to the frontend as `window.pywebview.api`. Only three methods: `check_dependencies`, `render_preview`, `generate_pdf`. Keep business logic out of this file — it should just validate inputs and delegate to `render.py`.
- **`render.py`** — the actual markdown → HTML → PDF pipeline. `build_html_document()` is the single source of truth used by *both* preview and PDF export; never let those two paths diverge. WeasyPrint is imported lazily inside `render_pdf()` so preview keeps working even if WeasyPrint/Pango isn't installed.
- **`gui/`** — the frontend: `index.html` (layout + chrome styles), `script.js` (vanilla JS, no framework/build step), `style.css` (the resume's own stylesheet — injected into both the preview iframe's `srcdoc` and the WeasyPrint-rendered PDF, so it must work identically in a browser iframe and in WeasyPrint's renderer).

### The pywebview readiness bridge

`window.pywebview.api` is injected asynchronously by the native shell some time after `gui/index.html` loads, so `script.js` cannot assume it's available immediately. The pattern in `script.js` (guarded by `tests/startup.test.cjs`):
- `apiReady()` checks the bridge exists *and* has real methods (not a stub `{}`) before trusting it.
- Actions taken before the bridge is ready are queued in `pendingActions` and flushed once by `onApiReady()` — calling it twice (e.g. duplicate `pywebviewready` events) must not double-fire queued actions.
- A `pywebviewready` event listener is the primary signal; a 100ms poll is the fallback for a missed event; a 10s timeout gives up and shows `showStartupError()` telling the user to launch via `run.command` instead of opening `index.html` directly (opening the HTML file in a browser has no Python backend at all).

Any change to this startup sequence must keep `tests/startup.test.cjs` passing — it exercises exactly these races (missed events, duplicate `pywebviewready`, stale queued saves after timeout).

### Markdown "split-line" extension

`render.py`'s `_expand_split_lines()` is a preprocessing pass run *before* the `markdown` library sees the text. A line matching `Left text | Right text` (literal ` | ` with spaces) is pulled out and rendered as two independently-formatted flex spans (`.split-left` / `.split-right`) so resume entries can show e.g. `### Company | Location` or `*Job Title* | Date Range` with the right side flush-right. Table rows, table separator lines, and fenced code blocks are explicitly excluded from this transform (see the regexes at the top of `render.py`) — any change to the pipe-detection regexes must not break table/code rendering. Full authoring rules for this format are documented in `RESUME_FORMAT_GUIDE.md` — update it if the split-line behavior changes.

### Output path

`app.py` sets `OUTPUT_DIR` to `~/Desktop/md2pdf-cv`, overridable per-user via `output_dir` in a gitignored `config.json` (template: `config.example.json`). PDF filenames are sanitized (`render.sanitize_title`) and collision-safe (`render.next_available_path` appends ` (2)`, ` (3)`, ...).
