"""Shared markdown -> styled HTML -> PDF rendering core.

Both the live preview and the final PDF export call build_html_document()
so the preview always matches what gets written to disk.
"""
import os
import re

import markdown as md

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STYLE_PATH = os.path.join(BASE_DIR, "gui", "style.css")

MD_EXTENSIONS = ["extra", "sane_lists"]

_style_cache = None

# A line "Left text | Right text" becomes a flex row with Left on the far
# left and Right on the far right — e.g. "### Acme Corp | Vancouver, BC" for
# a company/location line, or "*Software Engineer* | 2021 - Present" for a
# role/dates line. Heading lines keep their heading level; plain lines
# become a paragraph. Table rows/separators and fenced code are left alone.
_HEADING_PIPE_RE = re.compile(r"^(#{1,6})\s+(.+?)\s\|\s(.+)$")
_PLAIN_PIPE_RE = re.compile(r"^(?!\s*[-*+]\s)(?!\s*\d+[.)]\s)(?!\s*\|)(\S.*?)\s\|\s(\S.*)$")
_TABLE_ROW_RE = re.compile(r"^\s*\|")
_TABLE_SEP_RE = re.compile(r"^[\s:|-]+$")


def _load_style() -> str:
    global _style_cache
    if _style_cache is None:
        with open(STYLE_PATH, "r", encoding="utf-8") as f:
            _style_cache = f.read()
    return _style_cache


def _render_inline(text: str) -> str:
    """Renders a single-line markdown fragment (bold/italic/links) without
    the wrapping <p> that markdown.markdown() normally adds."""
    html = md.markdown(text.strip(), extensions=MD_EXTENSIONS)
    return re.sub(r"^<p>|</p>\s*$", "", html.strip())


def _expand_split_lines(markdown_text: str) -> str:
    lines = markdown_text.split("\n")
    out = []
    in_fence = False
    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence or _TABLE_ROW_RE.match(line) or (stripped and _TABLE_SEP_RE.match(stripped)):
            out.append(line)
            continue

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
    return "\n".join(out)


def build_html_document(markdown_text: str, font_size: int) -> str:
    expanded = _expand_split_lines(markdown_text)
    body_html = md.markdown(expanded, extensions=MD_EXTENSIONS)
    style = _load_style()
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>{style}</style>
<style>:root{{--base-font-size: {font_size}pt;}}</style>
</head>
<body>
{body_html}
</body>
</html>"""


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
    html_doc = build_html_document(markdown_text, font_size)
    target_path = next_available_path(output_dir, title)
    HTML(string=html_doc, base_url=BASE_DIR).write_pdf(target_path)
    return target_path
