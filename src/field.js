const SCENE_MODES = [
  { amp: 1.0, freq: 1.0, speed: 1.0, alpha: 1.0, accent: 0.62 },
  { amp: 0.56, freq: 0.72, speed: 0.68, alpha: 0.78, accent: 0.5 },
  { amp: 0.82, freq: 1.05, speed: 0.86, alpha: 0.84, accent: 0.42 },
  { amp: 0.64, freq: 0.9, speed: 0.78, alpha: 0.7, accent: 0.52 },
];

const parseRgb = (value, fallback) => {
  const parts = String(value || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return fallback;
  return parts.slice(0, 3);
};

export function createField(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = null;
  let started = false;
  let paused = false;
  let last = 0;
  let clock = 0;

  const palette = {
    line: [23, 22, 19],
    accent: [198, 70, 36],
  };

  const state = { ...SCENE_MODES[0] };
  let target = { ...SCENE_MODES[0] };

  const readPalette = () => {
    const styles = getComputedStyle(document.documentElement);
    palette.line = parseRgb(styles.getPropertyValue("--field"), palette.line);
    palette.accent = parseRgb(styles.getPropertyValue("--accent-rgb"), palette.accent);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    if (width < 2 || height < 2) return;

    const rows = Math.max(24, Math.round(height / 27));
    const step = Math.max(9, Math.round(width / 170));
    const amplitude = height * 0.022 * state.amp;
    const accentRow = Math.round(rows * 0.63);
    const accentRowTwo = Math.round(rows * 0.31);
    const [lr, lg, lb] = palette.line;
    const [ar, ag, ab] = palette.accent;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let row = 0; row < rows; row += 1) {
      const baseY = ((row + 0.5) / rows) * height;
      const phase = row * 0.43;
      const isAccent = row === accentRow;
      const isAccentTwo = row === accentRowTwo;

      ctx.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const nx = x / width;
        const y =
          baseY +
          Math.sin(nx * 5.6 * state.freq + clock * 0.66 + phase) * amplitude * 0.62 +
          Math.sin(nx * 2.15 * state.freq - clock * 0.4 + phase * 1.7) * amplitude +
          Math.sin(nx * 12.4 * state.freq + clock * 0.92 + row * 0.07) * amplitude * 0.16;

        if (x <= 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (isAccent) {
        ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${0.38 * state.alpha})`;
        ctx.lineWidth = 1.25;
      } else if (isAccentTwo) {
        ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${0.1 * state.alpha})`;
        ctx.lineWidth = 0.85;
      } else {
        const depth = 0.036 + 0.038 * Math.sin((row / rows) * Math.PI);
        ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${depth * state.alpha})`;
        ctx.lineWidth = 0.65;
      }

      ctx.stroke();
    }
  };

  const tick = (now) => {
    if (!started) return;
    if (!paused) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      clock += dt * state.speed;

      const ease = 0.035;
      state.amp += (target.amp - state.amp) * ease;
      state.freq += (target.freq - state.freq) * ease;
      state.speed += (target.speed - state.speed) * ease;
      state.alpha += (target.alpha - state.alpha) * ease;
      state.accent += (target.accent - state.accent) * ease;

      draw();
    }
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (started) return;
    started = true;
    last = 0;
    if (reduced) {
      draw();
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (paused) return;
    paused = true;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };

  const resume = () => {
    if (!paused) return;
    paused = false;
    last = 0;
    if (started && !reduced) frame = requestAnimationFrame(tick);
  };

  const refreshPalette = () => {
    readPalette();
    draw();
  };

  const setScene = (index) => {
    target = { ...(SCENE_MODES[index] || SCENE_MODES[0]) };
  };

  const destroy = () => {
    started = false;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };

  readPalette();
  resize();
  draw();
  start();

  window.addEventListener("resize", () => {
    resize();
    draw();
  });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      resize();
      draw();
    }, 120);
  });

  return {
    setScene,
    pause,
    resume,
    refreshPalette,
    destroy,
    get paused() {
      return paused;
    },
  };
}
