# Features

md2pdf-cv converts a Markdown-authored CV/resume into a styled, print-ready
PDF. The on-screen preview and the exported PDF are rendered from the exact
same code path (`render.build_html_document`), so what you see in the app is
what you get in the PDF.

## Core workflow

1. Paste or drop your Markdown CV into the left-hand editor.
2. The right-hand preview updates automatically as you type.
3. Adjust the font size with the slider (9–18pt); the preview re-renders
   after a short debounce.
4. Set a title and click **Accept → Save PDF**.

PDFs are written to `~/Desktop/md2pdf-cv` (change it via `output_dir` in `config.json`; see the README). If a file with the chosen
title already exists, the app appends `(2)`, `(3)`, etc. rather than
overwriting it.

## Editing your CV

- The Markdown source lives in a plain textarea on the left.
- You can drag and drop a `.md` file onto the dropzone in the toolbar to load
  it instead of pasting.
- See [`RESUME_FORMAT_GUIDE.md`](../RESUME_FORMAT_GUIDE.md) for the full
  authoring syntax: headings, the `Left | Right` split-line format used for
  entry headers (company/location, role/dates), tech-stack lines, tables,
  and more.

## Live preview

- The preview is rendered by the same function used to build the exported
  PDF, and works even if WeasyPrint isn't installed (only PDF export needs
  it).
- **Page-break indicator**: dashed blue lines in the preview mark where
  WeasyPrint would start a new physical page on export. The simulation
  honors the same "never split an entry across a page" rule the PDF itself
  uses (`page-break-inside: avoid` on each entry) — an entry is always kept
  whole, and the break is pushed to before it if it wouldn't fit on the
  current page. This is computed client-side from the actual rendered
  layout, so it stays fast on every keystroke and doesn't require invoking
  WeasyPrint. It's an approximation, not a pixel-identical rendering of
  WeasyPrint's own fragmentation: content outside of entries (freeform
  paragraphs, standalone bullet lists) can only break between block
  elements or list items, not mid-paragraph, and the per-page content-height
  budget is computed the same way for every page even though WeasyPrint's
  real budget differs slightly between the first, middle, and last page.
- **Delete an entry**: hovering over an Education, Experience, or Project
  entry reveals a small "×" button. Clicking it asks for confirmation, then
  removes that entry's Markdown from the source text (not just a visual
  hide) and re-renders. There's no dedicated undo for this beyond the
  textarea's native Cmd-Z, since the underlying source is a normal
  `<textarea>`.

## Auto-filled PDF title

Dropping a `.md` file fills the Title field with a cleaned-up version of the
filename (underscores and hyphens become spaces, e.g. `Jane_Doe_CV.md` →
`Jane Doe CV`) — but only if the Title field is currently empty. An existing
title you've typed is never overwritten.

## Exporting to PDF

Clicking **Accept → Save PDF** renders the current Markdown through
WeasyPrint and writes it to `~/Desktop/md2pdf-cv` (change it via `output_dir` in `config.json`; see the README) using the sanitized
title as the filename. The preview's page-break lines and delete buttons are
screen-only chrome and never appear in the exported PDF.

## Dependency check

On startup, the app checks whether WeasyPrint/Pango is available. If not, a
banner explains the gap and suggests:

```
brew install pango cairo gdk-pixbuf libffi && pip install --force-reinstall weasyprint
```

The live preview keeps working without WeasyPrint installed — only PDF
export requires it.

## Markdown authoring format

See [`RESUME_FORMAT_GUIDE.md`](../RESUME_FORMAT_GUIDE.md) for the complete
syntax reference.

## Known limitations

- Page size is fixed at US Letter (8.5" × 11").
- Output is strictly black/white/grayscale.
- The preview's page-break simulation is an approximation of WeasyPrint's
  actual text fragmentation, not a pixel-identical match in every edge case.
