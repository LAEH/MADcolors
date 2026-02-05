/**
 * MADcolors - Color Visualization Web App
 *
 * A vanilla JavaScript application for exploring Munsell color system data,
 * CSS named colors, iOS 7 palette, and curated hex palettes.
 *
 * Expects a global `MADcolors` object to be loaded before this script runs
 * (from color-data.js). See README for the expected data structure.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    currentView: 'wheel',   // 'wheel' | 'palettes' | 'explorer'
    searchQuery: '',
    selectedHue: null,
    modalColor: null
  };

  // ---------------------------------------------------------------------------
  // Utility Functions
  // ---------------------------------------------------------------------------

  /**
   * Convert a hex colour string to an {r, g, b} object.
   * Accepts formats: #RGB, #RRGGBB, RGB, RRGGBB.
   * Returns null when the input cannot be parsed.
   */
  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return null;

    // Strip leading '#'
    let h = hex.replace(/^#/, '');

    // Expand shorthand (e.g. "03F" -> "0033FF")
    if (h.length === 3) {
      h = h.split('').map(function (c) { return c + c; }).join('');
    }

    if (h.length !== 6) return null;

    var num = parseInt(h, 16);
    if (isNaN(num)) return null;

    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /**
   * Convert a hex colour string to an {h, s, l} object.
   * h is in degrees [0-360], s and l are percentages [0-100].
   */
  function hexToHsl(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return null;

    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s;
    var l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) {
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / d + 2) / 6;
      } else {
        h = ((r - g) / d + 4) / 6;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Compute relative luminance of a hex colour (WCAG formula).
   * Returns a value between 0 (black) and 1 (white).
   */
  function luminance(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return 0;

    function channel(c) {
      var v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  /**
   * Return '#fff' or '#000' depending on which provides better contrast
   * against the given background hex colour.
   */
  function contrastColor(hex) {
    return luminance(hex) > 0.179 ? '#000' : '#fff';
  }

  /**
   * Ensure a hex string starts with '#'.
   */
  function normalizeHex(hex) {
    if (!hex || typeof hex !== 'string') return '#000000';
    return hex.charAt(0) === '#' ? hex : '#' + hex;
  }

  /**
   * Copy text to the clipboard and show brief visual feedback on the
   * provided button element (if supplied).
   */
  function copyToClipboard(text, btnEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopyFeedback(btnEl);
      }).catch(function () {
        fallbackCopy(text, btnEl);
      });
    } else {
      fallbackCopy(text, btnEl);
    }
  }

  /** Fallback copy method using a temporary textarea. */
  function fallbackCopy(text, btnEl) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* ignore */ }
    document.body.removeChild(ta);
    showCopyFeedback(btnEl);
  }

  /** Brief "Copied!" text swap on a button element. */
  function showCopyFeedback(btnEl) {
    if (!btnEl) return;
    var original = btnEl.textContent;
    btnEl.textContent = 'Copied!';
    btnEl.classList.add('copy-success');
    setTimeout(function () {
      btnEl.textContent = original;
      btnEl.classList.remove('copy-success');
    }, 1200);
  }

  /**
   * Classic debounce helper.
   */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /**
   * Safely count all individual hex colours inside MADcolors.munsell.flat.
   */
  function countFlatColors() {
    var count = 0;
    var flat = (MADcolors && MADcolors.munsell && MADcolors.munsell.flat) || [];
    for (var h = 0; h < flat.length; h++) {
      var rows = flat[h];
      if (!Array.isArray(rows)) continue;
      for (var r = 0; r < rows.length; r++) {
        if (Array.isArray(rows[r])) {
          count += rows[r].length;
        }
      }
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // Stats Bar
  // ---------------------------------------------------------------------------

  /**
   * Render a horizontal statistics bar.
   * @param {Object} counts - Key/value pairs to display.
   * @returns {string} HTML string.
   */
  function renderStats(counts) {
    var items = '';
    var keys = Object.keys(counts);
    for (var i = 0; i < keys.length; i++) {
      items += '<div class="stat-item">' +
        '<span class="stat-value">' + counts[keys[i]] + '</span>' +
        '<span class="stat-label">' + keys[i] + '</span>' +
        '</div>';
    }
    return '<div class="stats-bar">' + items + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Munsell Wheel View
  // ---------------------------------------------------------------------------

  function renderWheel() {
    var flat = (MADcolors.munsell && MADcolors.munsell.flat) || [];
    var names = (MADcolors.munsell && MADcolors.munsell.hueNames) || [];
    var parentHues = (MADcolors.munsell && MADcolors.munsell.codes) || [];

    var totalColors = countFlatColors();

    var html = renderStats({
      'Total Hues': names.length,
      'Total Colors': totalColors,
      'Hue Families': parentHues.length,
      'Palettes': 4
    });

    // Group every 4 hues under their parent hue code
    for (var i = 0; i < parentHues.length; i++) {
      var code = parentHues[i];
      html += '<div class="hue-group">' +
        '<h2 class="hue-group-title">' + escapeHtml(code) + '</h2>' +
        '<div class="hue-group-content">';

      for (var v = 0; v < 4; v++) {
        var idx = i * 4 + v;
        if (idx >= flat.length) break;

        var hueName = names[idx] || ('Hue ' + idx);
        var rows = flat[idx];

        html += '<div class="hue-section" data-hue="' + escapeAttr(hueName) + '">' +
          '<div class="hue-label">' + escapeHtml(hueName) + '</div>';

        if (Array.isArray(rows)) {
          for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            if (!Array.isArray(row)) continue;

            html += '<div class="value-row">';
            for (var ci = 0; ci < row.length; ci++) {
              var hex = normalizeHex(row[ci]);
              var textColor = contrastColor(hex);
              html += '<div class="color-cell" ' +
                'style="background:' + hex + ';color:' + textColor + '" ' +
                'data-hex="' + escapeAttr(hex) + '" ' +
                'data-hue="' + escapeAttr(hueName) + '" ' +
                'title="' + escapeAttr(hex) + '">' +
                '<span class="cell-tooltip">' + escapeHtml(hex) + '</span>' +
                '</div>';
            }
            html += '</div>';
          }
        }

        html += '</div>'; // .hue-section
      }

      html += '</div></div>'; // .hue-group-content, .hue-group
    }

    document.getElementById('main-content').innerHTML = html;
    attachColorCellListeners();
  }

  // ---------------------------------------------------------------------------
  // Palettes View
  // ---------------------------------------------------------------------------

  function renderPalettes() {
    var html = '';

    // -- Cool Hex palette --
    var coolhex = MADcolors.coolhex || [];
    html += '<section class="palette-section">' +
      '<h2 class="palette-title">Cool Hex <span class="palette-count">(' + coolhex.length + ')</span></h2>' +
      '<div class="palette-grid palette-grid--small">';
    for (var i = 0; i < coolhex.length; i++) {
      var hex = normalizeHex(coolhex[i]);
      var tc = contrastColor(hex);
      html += '<div class="palette-swatch" style="background:' + hex + ';color:' + tc + '" ' +
        'data-hex="' + escapeAttr(hex) + '" title="' + escapeAttr(hex) + '">' +
        '<span class="swatch-label">' + escapeHtml(hex) + '</span>' +
        '</div>';
    }
    html += '</div></section>';

    // -- Best CSS palette --
    var bestcss = MADcolors.bestcss || [];
    html += '<section class="palette-section">' +
      '<h2 class="palette-title">Best CSS Colors <span class="palette-count">(' + bestcss.length + ')</span></h2>' +
      '<div class="palette-grid palette-grid--css">';
    for (var j = 0; j < bestcss.length; j++) {
      var cssName = bestcss[j];
      // Use the CSS colour name directly as background
      html += '<div class="palette-swatch palette-swatch--css" style="background:' + escapeAttr(cssName) + '" ' +
        'data-hex="' + escapeAttr(cssName) + '" data-name="' + escapeAttr(cssName) + '" ' +
        'title="' + escapeAttr(cssName) + '">' +
        '<span class="swatch-name">' + escapeHtml(cssName) + '</span>' +
        '</div>';
    }
    html += '</div></section>';

    // -- iOS 7 palette --
    var ios7 = MADcolors.ios7 || [];
    html += '<section class="palette-section">' +
      '<h2 class="palette-title">iOS 7 <span class="palette-count">(' + ios7.length + ')</span></h2>' +
      '<div class="palette-grid palette-grid--large">';
    for (var k = 0; k < ios7.length; k++) {
      var iosHex = normalizeHex(ios7[k]);
      var iosTc = contrastColor(iosHex);
      html += '<div class="palette-swatch palette-swatch--large" style="background:' + iosHex + ';color:' + iosTc + '" ' +
        'data-hex="' + escapeAttr(iosHex) + '" title="' + escapeAttr(iosHex) + '">' +
        '<span class="swatch-label">' + escapeHtml(iosHex) + '</span>' +
        '</div>';
    }
    html += '</div></section>';

    // -- Munsell Named colours (first 50) --
    var detailed = MADcolors.munsellDetailed || [];
    var detailLimit = Math.min(detailed.length, 50);
    html += '<section class="palette-section">' +
      '<h2 class="palette-title">Munsell Named Colors <span class="palette-count">(showing ' + detailLimit + ' of ' + detailed.length + ')</span></h2>' +
      '<div class="palette-grid palette-grid--named">';
    for (var m = 0; m < detailLimit; m++) {
      var entry = detailed[m];
      if (!entry) continue;
      var dHex = normalizeHex(entry.hex);
      var dTc = contrastColor(dHex);
      var dName = entry.name || '';
      html += '<div class="palette-swatch palette-swatch--named" style="background:' + dHex + ';color:' + dTc + '" ' +
        'data-hex="' + escapeAttr(dHex) + '" data-name="' + escapeAttr(dName) + '" ' +
        'title="' + escapeAttr(dName + ' ' + dHex) + '">' +
        '<span class="swatch-label">' + escapeHtml(dHex) + '</span>' +
        '<span class="swatch-name">' + escapeHtml(dName) + '</span>' +
        '</div>';
    }
    html += '</div></section>';

    document.getElementById('main-content').innerHTML = html;
    attachPaletteSwatchListeners();
  }

  // ---------------------------------------------------------------------------
  // Explorer View
  // ---------------------------------------------------------------------------

  /** Build a unified colour list for the explorer (cached after first call). */
  var _allColors = null;

  function getAllColors() {
    if (_allColors) return _allColors;

    _allColors = [];
    var seen = {};

    // 1. Munsell flat colours
    var flat = (MADcolors.munsell && MADcolors.munsell.flat) || [];
    var names = (MADcolors.munsell && MADcolors.munsell.hueNames) || [];
    for (var h = 0; h < flat.length; h++) {
      var hueName = names[h] || '';
      var rows = flat[h];
      if (!Array.isArray(rows)) continue;
      for (var r = 0; r < rows.length; r++) {
        if (!Array.isArray(rows[r])) continue;
        for (var c = 0; c < rows[r].length; c++) {
          var hex = normalizeHex(rows[r][c]);
          var key = hex.toLowerCase();
          if (!seen[key]) {
            seen[key] = true;
            _allColors.push({ hex: hex, name: hueName, source: 'munsell' });
          }
        }
      }
    }

    // 2. munsellDetailed
    var detailed = MADcolors.munsellDetailed || [];
    for (var d = 0; d < detailed.length; d++) {
      var entry = detailed[d];
      if (!entry) continue;
      var dHex = normalizeHex(entry.hex);
      var dKey = dHex.toLowerCase();
      if (!seen[dKey]) {
        seen[dKey] = true;
        _allColors.push({ hex: dHex, name: entry.name || '', source: 'munsell-detail' });
      }
    }

    // 3. coolhex
    var coolhex = MADcolors.coolhex || [];
    for (var i = 0; i < coolhex.length; i++) {
      var chx = normalizeHex(coolhex[i]);
      var chKey = chx.toLowerCase();
      if (!seen[chKey]) {
        seen[chKey] = true;
        _allColors.push({ hex: chx, name: '', source: 'coolhex' });
      }
    }

    // 4. bestcss (these are CSS colour names, not hex)
    var bestcss = MADcolors.bestcss || [];
    for (var j = 0; j < bestcss.length; j++) {
      var cssName = bestcss[j];
      var cssKey = cssName.toLowerCase();
      if (!seen[cssKey]) {
        seen[cssKey] = true;
        _allColors.push({ hex: cssName, name: cssName, source: 'bestcss' });
      }
    }

    // 5. ios7
    var ios7 = MADcolors.ios7 || [];
    for (var k = 0; k < ios7.length; k++) {
      var iosHex = normalizeHex(ios7[k]);
      var iosKey = iosHex.toLowerCase();
      if (!seen[iosKey]) {
        seen[iosKey] = true;
        _allColors.push({ hex: iosHex, name: '', source: 'ios7' });
      }
    }

    return _allColors;
  }

  function renderExplorer() {
    var html = '<div class="explorer-header">' +
      '<input type="text" id="explorer-search" class="explorer-search" ' +
      'placeholder="Search by hex, name, hue code..." ' +
      'value="' + escapeAttr(state.searchQuery) + '">' +
      '</div>';

    html += '<div id="explorer-results" class="explorer-results">';
    html += buildExplorerResults(state.searchQuery);
    html += '</div>';

    document.getElementById('main-content').innerHTML = html;

    // Attach search listener with debounce
    var searchInput = document.getElementById('explorer-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(function () {
        state.searchQuery = searchInput.value;
        var resultsEl = document.getElementById('explorer-results');
        if (resultsEl) {
          resultsEl.innerHTML = buildExplorerResults(state.searchQuery);
          attachExplorerSwatchListeners();
        }
      }, 300));

      // Focus the search input for immediate use
      searchInput.focus();
    }

    attachExplorerSwatchListeners();
  }

  /**
   * Build HTML for the explorer results grid, filtered by query.
   */
  function buildExplorerResults(query) {
    var all = getAllColors();
    var q = (query || '').trim().toLowerCase();

    var filtered = all;
    if (q) {
      filtered = [];
      for (var i = 0; i < all.length; i++) {
        var item = all[i];
        if (
          item.hex.toLowerCase().indexOf(q) !== -1 ||
          item.name.toLowerCase().indexOf(q) !== -1 ||
          item.source.toLowerCase().indexOf(q) !== -1
        ) {
          filtered.push(item);
        }
      }
    }

    if (filtered.length === 0) {
      return '<div class="explorer-empty">No colours match your search.</div>';
    }

    var html = '<div class="explorer-count">' + filtered.length + ' colour' +
      (filtered.length !== 1 ? 's' : '') + ' found</div>' +
      '<div class="palette-grid palette-grid--explorer">';

    for (var j = 0; j < filtered.length; j++) {
      var item = filtered[j];
      var bg = item.hex;
      var tc = contrastColor(item.hex);
      var displayName = item.name || '';

      html += '<div class="palette-swatch palette-swatch--explorer" ' +
        'style="background:' + escapeAttr(bg) + ';color:' + tc + '" ' +
        'data-hex="' + escapeAttr(item.hex) + '" ' +
        'data-name="' + escapeAttr(displayName) + '" ' +
        'title="' + escapeAttr((displayName ? displayName + ' - ' : '') + item.hex) + '">' +
        '<span class="swatch-label">' + escapeHtml(item.hex) + '</span>' +
        (displayName ? '<span class="swatch-name">' + escapeHtml(displayName) + '</span>' : '') +
        '</div>';
    }

    html += '</div>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // Color Modal
  // ---------------------------------------------------------------------------

  /**
   * Show a detailed modal overlay for a given colour.
   * @param {string} hex - The hex value or CSS colour name.
   * @param {string} [name] - Optional human-readable name.
   */
  function showColorModal(hex, name) {
    state.modalColor = hex;

    var displayHex = hex || '';
    var rgb = hexToRgb(hex);
    var hsl = hexToHsl(hex);
    var lum = luminance(hex);
    var textRec = lum > 0.179 ? 'Dark text recommended' : 'Light text recommended';
    var tc = contrastColor(hex);
    var bgStyle = 'background:' + normalizeHex(hex);

    // If this is a CSS colour name (no '#'), use the name directly as bg
    if (hex && hex.charAt(0) !== '#' && !hex.match(/^[0-9a-f]{3,8}$/i)) {
      bgStyle = 'background:' + hex;
    }

    var rgbStr = rgb ? 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')' : 'N/A';
    var hslStr = hsl ? 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)' : 'N/A';

    var html = '<div class="modal-overlay" id="modal-overlay">' +
      '<div class="modal-card">' +

      // Large preview
      '<div class="modal-preview" style="' + bgStyle + ';color:' + tc + '">' +
      (name ? '<div class="modal-color-name">' + escapeHtml(name) + '</div>' : '') +
      '</div>' +

      '<div class="modal-details">' +

      // Colour name (if provided)
      (name ? '<div class="modal-row modal-row--name"><span class="modal-label">Name</span><span class="modal-value">' + escapeHtml(name) + '</span></div>' : '') +

      // Hex
      '<div class="modal-row">' +
      '<span class="modal-label">Hex</span>' +
      '<span class="modal-value">' + escapeHtml(displayHex) + '</span>' +
      '<button class="modal-copy-btn" data-copy="' + escapeAttr(displayHex) + '">Copy</button>' +
      '</div>' +

      // RGB
      '<div class="modal-row">' +
      '<span class="modal-label">RGB</span>' +
      '<span class="modal-value">' + rgbStr + '</span>' +
      '<button class="modal-copy-btn" data-copy="' + escapeAttr(rgbStr) + '">Copy</button>' +
      '</div>' +

      // HSL
      '<div class="modal-row">' +
      '<span class="modal-label">HSL</span>' +
      '<span class="modal-value">' + hslStr + '</span>' +
      '<button class="modal-copy-btn" data-copy="' + escapeAttr(hslStr) + '">Copy</button>' +
      '</div>' +

      // Luminance
      '<div class="modal-row">' +
      '<span class="modal-label">Luminance</span>' +
      '<span class="modal-value">' + lum.toFixed(4) + ' &mdash; ' + textRec + '</span>' +
      '</div>' +

      '</div>' + // .modal-details

      '<button class="modal-close-btn" id="modal-close-btn" title="Close">&times;</button>' +
      '</div>' + // .modal-card
      '</div>';  // .modal-overlay

    var container = document.getElementById('modal-container');
    container.innerHTML = html;

    // Attach modal event listeners
    var overlay = document.getElementById('modal-overlay');
    var closeBtn = document.getElementById('modal-close-btn');

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        // Close only when clicking the overlay background itself
        if (e.target === overlay) {
          closeModal();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal();
      });
    }

    // Copy buttons
    var copyBtns = container.querySelectorAll('.modal-copy-btn');
    for (var i = 0; i < copyBtns.length; i++) {
      copyBtns[i].addEventListener('click', function () {
        var text = this.getAttribute('data-copy');
        copyToClipboard(text, this);
      });
    }
  }

  /**
   * Close the colour modal.
   */
  function closeModal() {
    state.modalColor = null;
    var container = document.getElementById('modal-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Event Listener Helpers
  // ---------------------------------------------------------------------------

  /** Attach click listeners to all `.color-cell` elements in the wheel view. */
  function attachColorCellListeners() {
    var cells = document.querySelectorAll('.color-cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].addEventListener('click', function () {
        var hex = this.getAttribute('data-hex');
        var hue = this.getAttribute('data-hue');
        showColorModal(hex, hue);
      });
    }
  }

  /** Attach click listeners to palette swatches. */
  function attachPaletteSwatchListeners() {
    var swatches = document.querySelectorAll('.palette-swatch');
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener('click', function () {
        var hex = this.getAttribute('data-hex');
        var name = this.getAttribute('data-name') || '';
        showColorModal(hex, name);
      });
    }
  }

  /** Attach click listeners to explorer result swatches. */
  function attachExplorerSwatchListeners() {
    var swatches = document.querySelectorAll('.palette-swatch--explorer');
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener('click', function () {
        var hex = this.getAttribute('data-hex');
        var name = this.getAttribute('data-name') || '';
        showColorModal(hex, name);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Switch to a given view and update the active nav button.
   */
  function switchView(viewName) {
    state.currentView = viewName;

    // Update nav button active states
    var btns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-view') === viewName) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }

    // Render the appropriate view
    switch (viewName) {
      case 'wheel':
        renderWheel();
        break;
      case 'palettes':
        renderPalettes();
        break;
      case 'explorer':
        renderExplorer();
        break;
      default:
        renderWheel();
    }
  }

  // ---------------------------------------------------------------------------
  // Escape Helpers
  // ---------------------------------------------------------------------------

  /** Escape HTML entities for safe insertion as text content. */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Escape for use inside HTML attribute values. */
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  // ---------------------------------------------------------------------------
  // Keyboard Handling
  // ---------------------------------------------------------------------------

  function handleKeydown(e) {
    // Close modal on Escape
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (state.modalColor !== null) {
        closeModal();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    // Verify that MADcolors data is available
    if (typeof MADcolors === 'undefined') {
      document.getElementById('main-content').innerHTML =
        '<div class="error-message">' +
        '<h2>Data Not Loaded</h2>' +
        '<p>The MADcolors data object was not found. Make sure <code>color-data.js</code> ' +
        'is loaded before <code>app.js</code>.</p>' +
        '</div>';
      return;
    }

    // Set up nav button listeners
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].addEventListener('click', function () {
        var view = this.getAttribute('data-view');
        if (view) {
          switchView(view);
        }
      });
    }

    // Global keyboard listener
    document.addEventListener('keydown', handleKeydown);

    // Render default view
    switchView('wheel');
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }

})();
