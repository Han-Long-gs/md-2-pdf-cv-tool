# md2pdf-cv

!!!NOTE: FULLY ONE SHOT VIBE-CODED TOOL ONLY FOR AUTOMATING PERSONAL JOB SEARCH WORKFLOW.!!!

A small macOS app that turns a Markdown resume into a clean, print-ready PDF,
with a live preview that matches the exported PDF exactly.

## Requirements

- macOS
- Python 3 (`python3 --version` in Terminal; install from [python.org](https://www.python.org/downloads/) if missing)
- [Homebrew](https://brew.sh), used to install the PDF libraries (pango, cairo)

## Quick start

```bash
git clone <this-repo-url> md2pdf-cv
cd md2pdf-cv
./run.command
```

The first launch installs everything it needs, which takes a few minutes. Later
launches open the app right away. After that you can also double-click
`run.command` in Finder.

> If macOS blocks the double-click ("unidentified developer"), right-click
> `run.command` → **Open** once, or just run `./run.command` from Terminal.

### Optional: Desktop shortcut

To launch the app from your Desktop, run this once from the project folder:

```bash
ln -s "$(pwd)/run.command" ~/Desktop/md2pdf-cv.command
```

After that, double-click `md2pdf-cv.command` on your Desktop. If you move the
project folder, delete the shortcut and run the command again.

## Using it

1. Paste your Markdown resume into the left pane, or drag a `.md` file onto
   **Drag .md file here**.
2. Adjust the font size and check the preview.
3. Enter a title and click **Accept → Save PDF**.

PDFs are saved to `~/Desktop/md2pdf-cv/` by default. To choose a different
folder, copy `config.example.json` to `config.json` and edit `output_dir`:

```json
{
  "output_dir": "~/Documents/CVs"
}
```

`config.json` is personal and not committed. Restart the app after changing it.

New here? [RESUME_CREATION_WORKFLOW.md](RESUME_CREATION_WORKFLOW.md) walks
through tailoring a resume with ChatGPT and turning it into a PDF with this app.

See [RESUME_FORMAT_GUIDE.md](RESUME_FORMAT_GUIDE.md) for how to write the
Markdown (headings, `Company | Location` split lines, and more), and
[docs/features.md](docs/features.md) for the full feature list.

## Troubleshooting

- **PDF export says WeasyPrint/Pango is not available**: run
  `brew install pango cairo gdk-pixbuf libffi`, then delete the `.venv` folder
  and launch again.
- **Start over from scratch**: delete `.venv` and run `./run.command`.
