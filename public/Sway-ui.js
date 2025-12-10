// Sway-ui.js
// Tiny tilt-based balance game with touch fallback

(function () {
  const playfield = document.createElement("div");

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function initSway() {
    const playfieldEl = document.getElementById("playfield");
    const safeZoneEl = document.getElementById("safe-zone");
    const dotEl = document.getElementById("dot");
    const streakLabel = document.getElementById("streak-label");
    const bestLabel = document.getElementById("best-label");
    const hintLabel = document.getElementById("hint-label");
    const modeLabel = document.getElementById("mode-label");

    if (!playfieldEl || !safeZoneEl || !dotEl) {
      console.warn("Sway UI elements missing");
      return;
    }

    let mode = "tilt"; // or "touch"
    let dot = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
    let safe = { x: 0.5, y: 0.5, w: 0.35, h: 0.35 };
    let currentStreak = 0;
    let bestStreak = 0;
    let lastFrameTime = performance.now();

    function updateModeLabel() {
      if (!modeLabel) return;
      modeLabel.textContent = mode === "tilt" ? "Tilt mode" : "Touch mode";
    }

    function layout() {
      const rect = playfieldEl.getBoundingClientRect();
      const safeWidth = rect.width * safe.w;
      const safeHeight = rect.height * safe.h;
      safeZoneEl.style.width = `${safeWidth}px`;
      safeZoneEl.style.height = `${safeHeight}px`;
      safeZoneEl.style.left = `${safe.x * 100}%`;
      safeZoneEl.style.top = `${safe.y * 100}%`;
      dotEl.style.left = `${dot.x * 100}%`;
      dotEl.style.top = `${dot.y * 100}%`;
    }

    window.addEventListener("resize", layout);

    // Device motion handling
    let tiltSupported = false;

    function handleMotion(event) {
      if (!event.accelerationIncludingGravity) return;
      tiltSupported = true;
      mode = "tilt";
      updateModeLabel();
      const g = event.accelerationIncludingGravity;
      // Map gravity to velocity
      const ax = clamp(g.x || 0, -8, 8) / 100;
      const ay = clamp(g.y || 0, -8, 8) / 100;

      dot.vx += ax;
      dot.vy -= ay; // invert so tilting forward moves dot up
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", handleMotion, true);
    }

    // Touch fallback
    let isTouching = false;
    playfieldEl.addEventListener("pointerdown", (ev) => {
      isTouching = true;
      mode = tiltSupported ? "tilt" : "touch";
      updateModeLabel();
      moveDotToEvent(ev);
    });
    playfieldEl.addEventListener("pointermove", (ev) => {
      if (!isTouching) return;
      moveDotToEvent(ev);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
      playfieldEl.addEventListener(type, () => {
        isTouching = false;
      });
    });

    function moveDotToEvent(ev) {
      const rect = playfieldEl.getBoundingClientRect();
      const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
      dot.x = x;
      dot.y = y;
    }

    function updateLabels() {
      if (streakLabel) {
        streakLabel.textContent = `${Math.floor(currentStreak)}s streak`;
      }
      if (bestLabel) {
        bestLabel.textContent = `${Math.floor(bestStreak)}s`;
      }
    }

    function tick(now) {
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // Apply friction
      dot.vx *= 0.92;
      dot.vy *= 0.92;

      // Integrate
      dot.x = clamp(dot.x + dot.vx, 0.03, 0.97);
      dot.y = clamp(dot.y + dot.vy, 0.03, 0.97);

      const insideX = dot.x > safe.x - safe.w / 2 && dot.x < safe.x + safe.w / 2;
      const insideY = dot.y > safe.y - safe.h / 2 && dot.y < safe.y + safe.h / 2;
      const inside = insideX && insideY;

      if (inside) {
        currentStreak += dt;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        playfieldEl.classList.remove("outside");
      } else {
        currentStreak = 0;
        playfieldEl.classList.add("outside");
      }

      // Slowly drift safe zone
      const t = now / 1000;
      safe.x = 0.5 + Math.sin(t * 0.25) * 0.18;
      safe.y = 0.5 + Math.cos(t * 0.21) * 0.16;

      layout();
      updateLabels();
      requestAnimationFrame(tick);
    }

    layout();
    updateModeLabel();
    if (hintLabel) {
      hintLabel.textContent = "Tilt or drag to keep the dot in the glow.";
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSway);
  } else {
    initSway();
  }
})();
