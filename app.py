"""pywebview entry point. Exposes Api to the GUI (gui/index.html) via the
window.pywebview.api JS bridge."""
import os

import webview

import render

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_HOME = os.path.expanduser("~")
# OUTPUT_DIR = os.path.join(BASE_DIR, "output")
OUTPUT_DIR = os.path.join(USER_HOME, "Desktop", "2027-internship")
INDEX_PATH = os.path.join(BASE_DIR, "gui", "index.html")


class Api:
    def check_dependencies(self) -> dict:
        try:
            import weasyprint  # noqa: F401
            return {"ok": True}
        except Exception as e:
            return {
                "ok": False,
                "error": f"WeasyPrint/Pango not available: {e}",
                "hint": (
                    "Run: brew install pango cairo gdk-pixbuf libffi "
                    "&& pip install --force-reinstall weasyprint"
                ),
            }

    def render_preview(self, markdown_text: str, font_size: int) -> dict:
        try:
            if not markdown_text or not markdown_text.strip():
                return {"ok": False, "error": "Markdown text is empty — paste your CV content first."}
            html_doc = render.build_html_document(markdown_text, int(font_size))
            return {"ok": True, "html": html_doc}
        except Exception as e:
            return {"ok": False, "error": f"Unexpected error: {e}"}

    def generate_pdf(self, markdown_text: str, font_size: int, title: str) -> dict:
        try:
            if not markdown_text or not markdown_text.strip():
                return {"ok": False, "error": "Markdown text is empty — paste your CV content first."}

            clean_title = render.sanitize_title(title)
            if not clean_title:
                return {"ok": False, "error": "Please enter a valid title for the PDF filename."}

            path = render.render_pdf(markdown_text, int(font_size), clean_title, OUTPUT_DIR)
            return {"ok": True, "path": path}
        except Exception as e:
            return {"ok": False, "error": f"Unexpected error: {e}"}


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    api = Api()
    webview.create_window(
        "md2pdf-cv",
        INDEX_PATH,
        js_api=api,
        width=1200,
        height=800,
        min_size=(900, 600),
    )
    webview.start()


if __name__ == "__main__":
    main()
