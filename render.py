"""Shared markdown -> styled HTML -> PDF rendering core.

Both the live preview and the final PDF export call build_html_document()
so the preview always matches what gets written to disk.
"""
import os
import re

import markdown as md

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STYLE_PATH = os.path.join(BASE_DIR, "gui", "style.css")
INTERACTIVE_SCRIPT_PATH = os.path.join(BASE_DIR, "gui", "preview_interactive.js")

MD_EXTENSIONS = ["extra", "sane_lists", "md_in_html"]

_style_cache = None
_interactive_script_cache = None

# A line "Left text | Right text" becomes a flex row with Left on the far
# left and Right on the far right — e.g. "### Acme Corp | City, ST" for
# a company/location line, or "*Software Engineer* | 2021 - Present" for a
# role/dates line. Heading lines keep their heading level; plain lines
# become a paragraph. Table rows/separators and fenced code are left alone.
_HEADING_PIPE_RE = re.compile(r"^(#{1,6})\s+(.+?)\s\|\s(.+)$")
_PLAIN_PIPE_RE = re.compile(r"^(?!\s*[-*+]\s)(?!\s*\d+[.)]\s)(?!\s*\|)(\S.*?)\s\|\s(\S.*)$")
_TABLE_ROW_RE = re.compile(r"^\s*\|")
_TABLE_SEP_RE = re.compile(r"^[\s:|-]+$")

# Any heading line — used to find entry (H3) boundaries: an entry runs from
# an H3 heading up to (but not including) the next heading of any level, or
# end of document. Kept separate from _HEADING_PIPE_RE, which only matches
# headings that also have a "| Right" side.
_HEADING_LEVEL_RE = re.compile(r"^(#{1,6})\s+")


def _load_style() -> str:
    global _style_cache
    if _style_cache is None:
        with open(STYLE_PATH, "r", encoding="utf-8") as f:
            _style_cache = f.read()
    return _style_cache


def _load_interactive_script() -> str:
    """Screen-only preview JS (delete-entry buttons, page-break simulation).
    Inlined into every rendered document like the CSS is; WeasyPrint never
    executes <script> tags, so this is a no-op for PDF export."""
    global _interactive_script_cache
    if _interactive_script_cache is None:
        with open(INTERACTIVE_SCRIPT_PATH, "r", encoding="utf-8") as f:
            _interactive_script_cache = f.read()
    return _interactive_script_cache


def _render_inline(text: str) -> str:
    """Renders a single-line markdown fragment (bold/italic/links) without
    the wrapping <p> that markdown.markdown() normally adds."""
    html = md.markdown(text.strip(), extensions=MD_EXTENSIONS)
    return re.sub(r"^<p>|</p>\s*$", "", html.strip())


def _expand_split_lines(markdown_text: str):
    """Returns (expanded_markdown, entries). entries is a list of
    {"index", "start_line", "end_line"} dicts (raw line numbers, 0-indexed,
    inclusive) marking each H3-anchored resume entry (education/experience/
    project block), used to let the preview delete a whole entry and to
    simulate page breaks without splitting one across a page."""
    lines = markdown_text.split("\n")
    out = []
    in_fence = False
    entries = []
    current_entry = None
    next_entry_index = 0

    for i, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith("```"):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence or _TABLE_ROW_RE.match(line) or (stripped and _TABLE_SEP_RE.match(stripped)):
            out.append(line)
            continue

        heading_m = _HEADING_LEVEL_RE.match(line)
        if heading_m and current_entry is not None:
            current_entry["end_line"] = i - 1
            entries.append(current_entry)
            current_entry = None
            out.append("")
            out.append("</div>")
            out.append("")
        if heading_m and len(heading_m.group(1)) == 3:
            current_entry = {"index": next_entry_index, "start_line": i, "end_line": None}
            out.append("")
            out.append(f'<div class="entry" data-entry-index="{next_entry_index}" markdown="1">')
            next_entry_index += 1

        m = _HEADING_PIPE_RE.match(line)
        if m:
            level = len(m.group(1))
            left_html = _render_inline(m.group(2))
            right_html = _render_inline(m.group(3))
            out.append("")
            out.append(
                f'<h{level} class="split-line">'
                f'<span class="split-left">{left_html}</span>'
                f'<span class="split-right">{right_html}</span>'
                f"</h{level}>"
            )
            out.append("")
            continue

        m = _PLAIN_PIPE_RE.match(line) if stripped else None
        if m:
            left_html = _render_inline(m.group(1))
            right_html = _render_inline(m.group(2))
            out.append("")
            out.append(
                '<p class="split-line">'
                f'<span class="split-left">{left_html}</span>'
                f'<span class="split-right">{right_html}</span>'
                "</p>"
            )
            out.append("")
            continue

        out.append(line)

    if current_entry is not None:
        current_entry["end_line"] = len(lines) - 1
        entries.append(current_entry)
        out.append("")
        out.append("</div>")

    return "\n".join(out), entries


def build_html_document(markdown_text: str, font_size: int):
    """Returns (html, entries). entries is the list of {index, start_line,
    end_line} dicts from _expand_split_lines, passed through so the preview
    can offer per-entry deletion. Both the live preview and the final PDF
    export call this so the preview always matches what gets written to
    disk; the embedded <script> is screen-only chrome (see
    _load_interactive_script) and is inert during WeasyPrint's PDF render."""
    expanded, entries = _expand_split_lines(markdown_text)
    body_html = md.markdown(expanded, extensions=MD_EXTENSIONS)
    style = _load_style()
    interactive_js = _load_interactive_script()
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>{style}</style>
<style>:root{{--base-font-size: {font_size}pt;}}</style>
</head>
<body>
{body_html}
<script>
{interactive_js}
</script>
</body>
</html>"""
    return html, entries


def sanitize_title(title: str) -> str:
    import re

    cleaned = re.sub(r"[^A-Za-z0-9 _-]", "", title or "").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned[:100]


def next_available_path(output_dir: str, title: str) -> str:
    base = os.path.join(output_dir, f"{title}.pdf")
    if not os.path.exists(base):
        return base
    n = 2
    while True:
        candidate = os.path.join(output_dir, f"{title} ({n}).pdf")
        if not os.path.exists(candidate):
            return candidate
        n += 1


def render_pdf(markdown_text: str, font_size: int, title: str, output_dir: str) -> str:
    """Builds the HTML doc, renders it to PDF with WeasyPrint, writes it to
    output_dir under a sanitized/collision-safe filename. Returns the path."""
    from weasyprint import HTML  # imported lazily so preview works w/o WeasyPrint

    os.makedirs(output_dir, exist_ok=True)
    html_doc, _entries = build_html_document(markdown_text, font_size)
    target_path = next_available_path(output_dir, title)
    HTML(string=html_doc, base_url=BASE_DIR).write_pdf(target_path)
    return target_path
