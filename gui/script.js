(function () {
  const markdownInput = document.getElementById("markdown-input");
  const fontSizeInput = document.getElementById("font-size");
  const fontSizeLabel = document.getElementById("font-size-label");
  const titleInput = document.getElementById("title-input");
  const previewFrame = document.getElementById("preview-frame");
  const btnPreview = document.getElementById("btn-preview");
  const btnAccept = document.getElementById("btn-accept");
  const statusEl = document.getElementById("status");
  const depBanner = document.getElementById("dep-banner");
  const mdDropzone = document.getElementById("md-dropzone");

  let debounceTimer = null;

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.className = isError ? "error" : "ok";
  }

  function setBusy(busy) {
    btnPreview.disabled = busy;
    btnAccept.disabled = busy;
  }

  function apiReady() {
    const api = window.pywebview && window.pywebview.api;
    return !!(api && typeof api.render_preview === "function" &&
      typeof api.generate_pdf === "function");
  }

  // Coalesce repeated requests while the desktop bridge is starting.
  const pendingActions = new Set();
  let startupFailed = false;
  let initialized = false;
  let readinessPoll = null;
  let startupTimeout = null;

  function showStartupError() {
    setStatus("Desktop connection unavailable. Open run.command to launch the app.", true);
    depBanner.style.display = "block";
    depBanner.textContent =
      "Preview and PDF export require the desktop app. Double-click run.command " +
      "in the project folder; opening gui/index.html in a browser or editor preview " +
      "cannot connect to Python. If you already used run.command, close the app " +
      "and relaunch it, then check the Terminal window for errors.";
  }

  function runWhenReady(fn) {
    if (apiReady()) {
      fn();
    } else if (startupFailed) {
      showStartupError();
    } else {
      pendingActions.add(fn);
    }
  }

  function currentFontSize() {
    return parseInt(fontSizeInput.value, 10);
  }

  function updateFontLabel() {
    fontSizeLabel.textContent = currentFontSize() + "pt";
  }

  async function doPreview() {
    if (!apiReady()) {
      setStatus("Starting up — will preview automatically once ready...", false);
      runWhenReady(doPreview);
      return;
    }
    setBusy(true);
    setStatus("Rendering preview...", false);
    try {
      const result = await window.pywebview.api.render_preview(
        markdownInput.value,
        currentFontSize()
      );
      if (result.ok) {
        previewFrame.srcdoc = result.html;
        setStatus("Preview updated.", false);
      } else {
        setStatus(result.error, true);
      }
    } catch (e) {
      setStatus("Unexpected error: " + e, true);
    } finally {
      setBusy(false);
    }
  }

  async function doAccept() {
    if (!apiReady()) {
      setStatus("Starting up — will save automatically once ready...", false);
      runWhenReady(doAccept);
      return;
    }
    setBusy(true);
    setStatus("Generating PDF...", false);
    try {
      const result = await window.pywebview.api.generate_pdf(
        markdownInput.value,
        currentFontSize(),
        titleInput.value
      );
      if (result.ok) {
        setStatus("Saved to " + result.path, false);
      } else {
        setStatus(result.error, true);
      }
    } catch (e) {
      setStatus("Unexpected error: " + e, true);
    } finally {
      setBusy(false);
    }
  }

  function debouncedPreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doPreview, 300);
  }

  function loadDroppedFile(file) {
    if (!file.name.toLowerCase().endsWith(".md")) {
      setStatus("Please drop a .md file.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (evt) {
      markdownInput.value = evt.target.result;
      setStatus("Loaded " + file.name + ".", false);
      doPreview();
    };
    reader.onerror = function () {
      setStatus("Failed to read file " + file.name + ".", true);
    };
    reader.readAsText(file);
  }

  function setupDropzone() {
    ["dragenter", "dragover"].forEach(function (evt) {
      mdDropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        mdDropzone.classList.add("dragover");
      });
    });
    ["dragleave", "dragend"].forEach(function (evt) {
      mdDropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        mdDropzone.classList.remove("dragover");
      });
    });
    mdDropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      mdDropzone.classList.remove("dragover");
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) loadDroppedFile(file);
    });
    // Prevent an off-target drop from navigating the whole window away.
    ["dragover", "drop"].forEach(function (evt) {
      window.addEventListener(evt, function (e) {
        e.preventDefault();
      });
    });
  }

  async function checkDeps() {
    try {
      const result = await window.pywebview.api.check_dependencies();
      if (!result.ok) {
        depBanner.style.display = "block";
        depBanner.textContent =
          "PDF generation unavailable: " + result.error + " — " + (result.hint || "");
      }
    } catch (e) {
      // ignore; check_dependencies is best-effort
    }
  }

  btnPreview.addEventListener("click", doPreview);
  btnAccept.addEventListener("click", doAccept);
  fontSizeInput.addEventListener("input", function () {
    updateFontLabel();
    debouncedPreview();
  });
  setupDropzone();

  updateFontLabel();

  // Buttons stay disabled until pywebview's JS bridge (window.pywebview.api)
  // has actually been injected, avoiding a race where an early click throws.
  function onApiReady() {
    if (initialized || !apiReady()) return;
    initialized = true;
    clearInterval(readinessPoll);
    clearTimeout(startupTimeout);
    if (startupFailed) {
      depBanner.style.display = "none";
      depBanner.textContent = "";
    }
    startupFailed = false;
    setBusy(false);
    setStatus("Ready.", false);
    checkDeps();
    const queued = Array.from(pendingActions);
    pendingActions.clear();
    queued.forEach(function (fn) {
      fn();
    });
  }
  window.addEventListener("pywebviewready", onApiReady);
  if (apiReady()) {
    onApiReady();
  } else {
    setBusy(true);
    setStatus("Starting up...", false);
    // Poll briefly as a fallback if the readiness event was missed.
    readinessPoll = setInterval(onApiReady, 100);
    startupTimeout = setTimeout(function () {
      if (apiReady()) {
        onApiReady();
        return;
      }
      clearInterval(readinessPoll);
      startupFailed = true;
      pendingActions.clear();
      showStartupError();
    }, 10000);
  }
})();
