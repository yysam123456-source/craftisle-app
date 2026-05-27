/**
 * Mykonos Island — Save / Load / Export / Share / Tutorial
 *
 * Hooks into the existing Game instance exposed at `window.game`
 * by main.js  (window.game = game).
 */

(function () {
  "use strict";

  /* ── 0. Inject toolbar-button styles (once) ────────────── */
  (function injectCSS() {
    if (document.getElementById("toolbar-btn-style")) return;
    const css = `
      .toolbar-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 2px 8px rgba(0,0,0,0.13);
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.12s, box-shadow 0.15s;
      }
      .toolbar-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      }
      .toolbar-btn:active { transform: scale(0.95); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      #tutorial-overlay { animation: fadeIn 0.3s ease; }
    `;
    const style = document.createElement("style");
    style.id = "toolbar-btn-style";
    style.textContent = css;
    document.head.appendChild(style);
  })();

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ── Toast (reuse game's own if available) ────────── */
  function showToast(msg) {
    if (window.game?.ui?.showToast) {
      window.game.ui.showToast(msg);
      return;
    }
    let el = $("#custom-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "custom-toast";
      Object.assign(el.style, {
        position: "fixed", bottom: "80px", left: "50%",
        transform: "translateX(-50%)", zIndex: "9998",
        background: "rgba(0,0,0,0.78)", color: "#fff",
        padding: "10px 22px", borderRadius: "10px",
        fontSize: "0.95rem", fontFamily: "sans-serif",
        pointerEvents: "none", opacity: "0", transition: "opacity 0.3s",
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = "0"; }, 2200);
  }

  /* ── 1. SAVE (delegates to Game.save) ─────────────── */
  function saveIsland() {
    try {
      if (!window.game) throw new Error("Game not ready");
      window.game.save();
    } catch (e) {
      console.warn("[save-share] save failed", e);
      showToast("❌ Save failed — place a tile first");
    }
  }

  /* ── 2. LOAD (delegates to Game.load) ─────────────── */
  function loadIsland() {
    try {
      if (!window.game) throw new Error("Game not ready");
      const ok = window.game.load();
      showToast(ok ? "✅ Island loaded!" : "ℹ️ No saved island found");
    } catch (e) {
      console.warn("[save-share] load failed", e);
      showToast("❌ Load failed");
    }
  }

  /* ── 3. EXPORT (canvas → PNG download, with watermark) ────────────── */
  function exportImage() {
    try {
      const watermarkedCanvas = generateWatermarkedCanvas();
      if (!watermarkedCanvas) { showToast("❌ Canvas not found"); return; }

      const dataUrl = watermarkedCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `my-island-${Date.now()}.png`;
      a.click();
      showToast("📷 Image with watermark downloaded!");
    } catch (e) {
      console.warn("[save-share] export failed", e);
      showToast("❌ Export failed");
    }
  }

  /* ── 3.5  Generate watermarked canvas (reused by export + share) ── */
  function generateWatermarkedCanvas() {
    const canvas = $("#game-canvas") || $("canvas");
    if (!canvas) return null;
    const watermarkHeight = 48;
    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height + watermarkHeight;
    const ctx = newCanvas.getContext("2d");

    // Draw original canvas content
    ctx.drawImage(canvas, 0, 0);

    // Draw watermark background
    ctx.fillStyle = "rgba(27,91,168,0.92)";
    ctx.fillRect(0, canvas.height, canvas.width, watermarkHeight);

    // Draw watermark text (site name + URL)
    const siteName = "Mykonos Island Voxels";
    const siteUrl = location.origin || "https://mykonos-island.example.com";
    ctx.fillStyle = "#e8e4d8";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${siteName} — ${siteUrl}`, canvas.width / 2, canvas.height + watermarkHeight / 2);

    return newCanvas;
  }

  /* ── 4. SHARE (Web Share API → Twitter fallback) ───── */
  async function shareIsland() {
    try {
      const watermarkedCanvas = generateWatermarkedCanvas();
      if (!watermarkedCanvas) throw new Error("Canvas generation failed");

      const blob = await new Promise((resolve) => {
        watermarkedCanvas.toBlob(resolve, "image/png");
      });
      if (!blob) throw new Error("blob is null");

      const file = new File([blob], "my-island.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Mykonos Island",
          text: "Check out my Mediterranean island! 🏝️",
          files: [file],
        });
        return;
      }
    } catch (e) { /* fall through */ }
    shareLinkOnly();
  }

  function shareLinkOnly() {
    // Build a share-picker overlay
    if (document.getElementById("share-picker")) return;

    const url = location.href;
    const text = "Check out this Mediterranean island builder! 🏝️";
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const overlay = document.createElement("div");
    overlay.id = "share-picker";
    Object.assign(overlay.style, {
      position: "fixed", inset: "0", zIndex: "9999",
      background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif",
    });

    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;padding:28px 24px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:fadeIn 0.2s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="margin:0;font-size:1.15rem;color:#1b5ba8;">Share Your Island</h3>
          <button id="share-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#888;">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener"
             style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;background:#000;color:#fff;text-decoration:none;font-size:0.9rem;font-weight:600;transition:transform 0.15s;">
            <span style="font-size:1.1rem;">𝕏</span> Twitter / X
          </a>
          <a href="https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}" target="_blank" rel="noopener"
             style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;background:#ff4500;color:#fff;text-decoration:none;font-size:0.9rem;font-weight:600;transition:transform 0.15s;">
            <span style="font-size:1.1rem;">🔴</span> Reddit
          </a>
          <a href="https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}" target="_blank" rel="noopener"
             style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;background:#bd081c;color:#fff;text-decoration:none;font-size:0.9rem;font-weight:600;transition:transform 0.15s;">
            <span style="font-size:1.1rem;">📌</span> Pinterest
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener"
             style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;background:#1877f2;color:#fff;text-decoration:none;font-size:0.9rem;font-weight:600;transition:transform 0.15s;">
            <span style="font-size:1.1rem;">📘</span> Facebook
          </a>
        </div>
        <button id="share-copy" style="width:100%;padding:12px;border-radius:10px;border:1.5px solid #1b5ba8;background:white;color:#1b5ba8;font-weight:600;cursor:pointer;font-size:0.9rem;transition:background 0.15s;">
          📋 Copy Link
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector("#share-close").onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    // Copy link handler
    overlay.querySelector("#share-copy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        showToast("✅ Link copied to clipboard!");
        overlay.remove();
      } catch (err) {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("✅ Link copied!");
        overlay.remove();
      }
    };

    // Hover effects via JS since inline styles don't support :hover
    const links = overlay.querySelectorAll("a");
    links.forEach((a) => {
      a.onmouseenter = () => { a.style.transform = "scale(1.03)"; };
      a.onmouseleave = () => { a.style.transform = "scale(1)"; };
    });
  }

  /* ── 5. TUTORIAL overlay ─────────────────────────── */
  function showTutorial(force = false) {
    if (!force && localStorage.getItem("mykonos-tutorial-done")) return;
    if (document.getElementById("tutorial-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "tutorial-overlay";
    Object.assign(overlay.style, {
      position: "fixed", inset: "0", zIndex: "9999",
      background: "rgba(0,0,0,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "#fff",
    });
    overlay.innerHTML = `
      <div style="max-width:520px;background:#1b5ba8;border-radius:16px;padding:32px 28px;line-height:1.7;">
        <h2 style="margin:0 0 12px;font-size:1.4rem;">🏝️ Welcome to Mykonos Island!</h2>
        <p style="margin:0 0 10px;">Build your dream Greek island in a beautiful isometric sandbox.</p>
        <h3 style="margin:14px 0 6px;font-size:1.05rem;">Quick controls</h3>
        <ul style="padding-left:18px;margin:0 0 10px;">
          <li><b>Click / Tap</b> — place selected building</li>
          <li><b>Right-click / Long-press</b> — erase a tile</li>
          <li><b>Scroll / Pinch</b> — zoom in and out</li>
          <li><b>Shift-drag / Two-finger drag</b> — pan the camera</li>
          <li><b>S</b> — save island</li>
          <li><b>L</b> — load saved island</li>
          <li><b>R</b> — reset (clear all)</li>
        </ul>
        <p style="margin:0 0 14px;font-size:0.9rem;opacity:0.8;">
          Your island is auto-saved in your browser. Use the 📷 button to export an image and share it!
        </p>
        <label style="display:flex;align-items:center;gap:8px;margin:0 0 16px;font-size:0.9rem;">
          <input type="checkbox" id="tut-dont-show" /> Don't show again
        </label>
        <button id="tut-close" style="padding:10px 28px;background:#0e8a6e;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
          Start Building →
        </button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector("#tut-close").onclick = () => {
      if (overlay.querySelector("#tut-dont-show")?.checked) {
        localStorage.setItem("mykonos-tutorial-done", "1");
      }
      overlay.remove();
    };
  }

  /* ── 6. Wire up action links in info dropdown ────── */
  function wireActions() {
    const dd = $("#info-dropdown");
    if (!dd) return;

    // Bind action links if they exist
    $("#act-load")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Load saved island? Unsaved changes will be lost.")) loadIsland();
    });
    $("#act-export")?.addEventListener("click", (e) => { e.preventDefault(); exportImage(); });
    $("#act-share")?.addEventListener("click", (e) => { e.preventDefault(); shareIsland(); });
    $("#act-tutorial")?.addEventListener("click", (e) => { e.preventDefault(); showTutorial(true); });

    // Keyboard shortcuts (skip when typing in inputs)
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "s" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); saveIsland(); }
      if (e.key === "l" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); loadIsland(); }
    });
  }

  /* ── 7. Init ──────────────────────────────────────── */
  function init() {
    const check = setInterval(() => {
      if (!window.game) return;
      clearInterval(check);
      wireActions();
      setTimeout(() => showTutorial(), 800);
      console.log("[save-share] C-features injected ✅");
    }, 300);

    // Safety: stop checking after 15 s
    setTimeout(() => clearInterval(check), 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 500));
  } else {
    setTimeout(init, 800);
  }
})();
