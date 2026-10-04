// Screen-only preview chrome, inlined into every rendered document by
// render.py's build_html_document(). WeasyPrint never executes <script>
// tags, so none of this runs during PDF export — it exists purely to make
// the live preview (an iframe with this same HTML as its srcdoc) more
// useful than a static rendering.
//
// Runs synchronously at the end of <body>, after the document has already
// been parsed and laid out, so no load/DOMContentLoaded listener is needed.
(function () {
  function injectDeleteButtons() {
    document.querySelectorAll(".entry[data-entry-index]").forEach(function (entryEl) {
      var idx = entryEl.getAttribute("data-entry-index");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "entry-delete-btn";
      btn.textContent = "×";
      btn.setAttribute("aria-label", "Delete this entry");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Delete this entry from the resume?")) {
          window.parent.postMessage(
            { type: "md2pdf-cv:delete-entry", entryIndex: Number(idx) },
            "*"
          );
        }
      });
      entryEl.appendChild(btn);
    });
  }

  // Fixed PDF content-box width from @page in style.css: 8.5in (612pt) page
  // width minus 3pt left/right margins = 606pt. Keep in sync with the
  // "body { width: 606pt }" rule in the @media screen block there.
  var PAGE_WIDTH_PT = 606;
  // Page content height budget, kept in sync with @page/body{padding} in
  // style.css: 792pt page height - 5pt top margin - 3pt bottom margin -
  // 7.2pt top body padding (0.1in) - 7.2pt bottom body padding (0.1in).
  // Approximation: applies both top+bottom body padding on every simulated
  // page, while WeasyPrint only applies top padding on page 1 and bottom
  // padding on the last page (worth under one line of text — negligible for
  // a 1-2 page resume).
  var PAGE_CONTENT_HEIGHT_PT = 792 - 5 - 3 - 7.2 - 7.2;
  var PT_TO_PX = 96 / 72;

  function applyFitScale() {
    var pageWidthPx = PAGE_WIDTH_PT * PT_TO_PX;
    var viewportWidth = document.documentElement.clientWidth;
    var scale = Math.min(1, viewportWidth / pageWidthPx);
    document.body.style.transform = "scale(" + scale + ")";
    return scale;
  }

  function computeAndDrawPageBreaks(scale) {
    var thresholdPx = PAGE_CONTENT_HEIGHT_PT * PT_TO_PX * scale;
    var body = document.body;
    var bodyTop = body.getBoundingClientRect().top;

    // Walk top-level content in document order. A non-.entry <ul>/<ol> is
    // expanded into its <li> children so freeform bullet lists (outside any
    // entry) can still break between items; everything else — especially
    // .entry blocks — is treated as one indivisible unit, which is what
    // enforces "never break inside an entry" (mirrors the PDF's
    // page-break-inside: avoid on .entry).
    var units = [];
    Array.prototype.forEach.call(body.children, function (child) {
      if (child.classList.contains("page-break-line")) return;
      if (child.tagName === "SCRIPT") return;
      var isTopLevelList = (child.tagName === "UL" || child.tagName === "OL") &&
        !child.classList.contains("entry");
      if (isTopLevelList) {
        Array.prototype.forEach.call(child.children, function (li) {
          units.push(li);
        });
      } else {
        units.push(child);
      }
    });

    var pageStart = 0;
    units.forEach(function (unit) {
      var r = unit.getBoundingClientRect();
      var top = r.top - bodyTop;
      var bottom = r.bottom - bodyTop;
      // If this unit doesn't fit in the remaining space on the current
      // simulated page, and it isn't already the first thing on this page
      // (an oversized single entry stays put — it can't be pushed further
      // and the real PDF can't split it either), start a new page here.
      if (bottom - pageStart > thresholdPx && top > pageStart) {
        var line = document.createElement("div");
        line.className = "page-break-line";
        line.style.top = top + "px";
        body.appendChild(line);
        pageStart = top;
      }
    });
  }

  try {
    injectDeleteButtons();
  } catch (e) {
    // Never let a preview-chrome bug block the preview from rendering.
  }
  try {
    var scale = applyFitScale();
    computeAndDrawPageBreaks(scale);
  } catch (e) {
    // Never let a preview-chrome bug block the preview from rendering.
  }
})();
