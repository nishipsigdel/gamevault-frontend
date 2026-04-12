import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef  = useRef(null);
  const outerRef   = useRef(null);
  const innerRef   = useRef(null);
  const canvasRef  = useRef(null);
  const mouse      = useRef({ x: 0, y: 0 });
  const outerPos   = useRef({ x: 0, y: 0 });
  const touchDot   = useRef(null); // the finger-following dot on mobile

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const stopCanvas = startCanvas();

    if (isTouch) {
      // ── MOBILE: finger tracking dot ──
      const dot = document.createElement("div");
      dot.style.cssText = `
        position: fixed;
        width: 24px; height: 24px;
        border: 2px solid var(--neon);
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px var(--neon), 0 0 20px rgba(0,245,255,0.4);
        display: none;
        transition: width 0.15s, height 0.15s;
      `;
      document.body.appendChild(dot);
      touchDot.current = dot;

      // Inner glowing center
      const dotCenter = document.createElement("div");
      dotCenter.style.cssText = `
        position: fixed;
        width: 6px; height: 6px;
        background: var(--neon);
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 8px var(--neon);
        display: none;
      `;
      document.body.appendChild(dotCenter);

      let lastX = 0, lastY = 0;
      let hideTimer = null;

      const onTouchStart = (e) => {
        const t = e.touches[0];
        lastX = t.clientX; lastY = t.clientY;
        dot.style.display       = "block";
        dotCenter.style.display = "block";
        dot.style.left       = lastX + "px";
        dot.style.top        = lastY + "px";
        dotCenter.style.left = lastX + "px";
        dotCenter.style.top  = lastY + "px";
        // Tap ripple
        spawnTouchRipple(lastX, lastY);
        clearTimeout(hideTimer);
      };

      const onTouchMove = (e) => {
        const t = e.touches[0];
        lastX = t.clientX; lastY = t.clientY;
        dot.style.left       = lastX + "px";
        dot.style.top        = lastY + "px";
        dotCenter.style.left = lastX + "px";
        dotCenter.style.top  = lastY + "px";
        // Trail while moving
        spawnTrail(lastX, lastY);
        clearTimeout(hideTimer);
      };

      const onTouchEnd = () => {
        // Hide dot after finger lifts
        hideTimer = setTimeout(() => {
          dot.style.display       = "none";
          dotCenter.style.display = "none";
        }, 800);
      };

      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove",  onTouchMove,  { passive: true });
      document.addEventListener("touchend",   onTouchEnd,   { passive: true });

      return () => {
        stopCanvas();
        dot.remove();
        dotCenter.remove();
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove",  onTouchMove);
        document.removeEventListener("touchend",   onTouchEnd);
      };
    }

    // ── DESKTOP: custom mouse cursor ──
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      spawnTrail(e.clientX, e.clientY);
    };

    const onEnter = () => cursor?.classList.add("hovering");
    const onLeave = () => cursor?.classList.remove("hovering");
    const onDown  = () => {
      cursor?.classList.add("clicking");
      spawnClickBurst(mouse.current.x, mouse.current.y);
    };
    const onUp = () => cursor?.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    const interactives = document.querySelectorAll(
      "a, button, input, select, textarea, [role='button']"
    );
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    let raf;
    const animate = () => {
      const speed = 0.12;
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * speed;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * speed;
      if (innerRef.current) {
        innerRef.current.style.left = mouse.current.x + "px";
        innerRef.current.style.top  = mouse.current.y + "px";
      }
      if (outerRef.current) {
        outerRef.current.style.left = outerPos.current.x + "px";
        outerRef.current.style.top  = outerPos.current.y + "px";
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      stopCanvas();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Touch ripple on tap ──
  function spawnTouchRipple(x, y) {
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 10px; height: 10px;
      border: 2px solid var(--neon);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 99998;
      box-shadow: 0 0 10px var(--neon);
    `;
    document.body.appendChild(ring);
    ring.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(6)", opacity: 0 },
    ], { duration: 600, easing: "ease-out" }).onfinish = () => ring.remove();

    // Burst particles
    for (let i = 0; i < 6; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: 4px; height: 4px;
        background: ${Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)"};
        border-radius: 50%;
        pointer-events: none;
        z-index: 99998;
      `;
      document.body.appendChild(p);
      const angle = (i / 6) * Math.PI * 2;
      const dist  = Math.random() * 40 + 15;
      p.animate([
        { transform: "translate(-50%,-50%)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`, opacity: 0 },
      ], { duration: 500, easing: "ease-out" }).onfinish = () => p.remove();
    }
  }

  // ── Trail particle ──
  function spawnTrail(x, y) {
    const el = document.createElement("div");
    el.className    = "cursor-trail";
    el.style.left   = x + "px";
    el.style.top    = y + "px";
    el.style.width  = Math.random() * 4 + 2 + "px";
    el.style.height = el.style.width;
    el.style.background = Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  // ── Click burst ──
  function spawnClickBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement("div");
      el.className        = "cursor-trail";
      el.style.left       = x + "px";
      el.style.top        = y + "px";
      el.style.background = Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)";
      el.style.width      = "4px";
      el.style.height     = "4px";
      document.body.appendChild(el);
      const angle = (i / 8) * Math.PI * 2;
      const dist  = Math.random() * 30 + 10;
      el.animate([
        { transform: "translate(-50%,-50%)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`, opacity: 0 },
      ], { duration: 400, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  // ── Background canvas ──
  function startCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx  = canvas.getContext("2d");
    let width  = canvas.width  = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const onResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const particles = Array.from({ length: 80 }, () => {
      const p = { reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.3;
        this.vx   = (Math.random() - 0.5) * 0.4;
        this.vy   = (Math.random() - 0.5) * 0.4 - 0.1;
        this.twinkle = Math.random() * Math.PI * 2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.color = Math.random() > 0.5 ? "0,245,255" : "160,48,240";
      }};
      p.reset(); return p;
    });

    const shooters = Array.from({ length: 4 }, () => {
      const s = { reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.4;
        this.len    = Math.random() * 80 + 40;
        this.speed  = Math.random() * 4 + 2;
        this.angle  = Math.PI / 4;
        this.opacity = 1;
        this.active = false;
        this.timer  = Math.random() * 300 + 100;
      }};
      s.reset(); return s;
    });

    let canvasRaf;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.twinkle += p.twinkleSpeed;
        const op = Math.sin(p.twinkle) * 0.3 + 0.4;
        if (p.y < -5 || p.x < -5 || p.x > width + 5) p.reset();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(${p.color},${op})`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = `rgba(${p.color},0.8)`;
        ctx.fill();
      });
      shooters.forEach((s) => {
        if (s.timer > 0) { s.timer--; return; }
        s.active = true;
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.018;
        if (s.opacity <= 0) { s.reset(); return; }
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.angle)*s.len, s.y - Math.sin(s.angle)*s.len);
        const g = ctx.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle)*s.len, s.y - Math.sin(s.angle)*s.len);
        g.addColorStop(0, `rgba(0,245,255,${s.opacity})`);
        g.addColorStop(1, "transparent");
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = "rgba(0,245,255,0.8)";
        ctx.stroke();
      });
      canvasRaf = requestAnimationFrame(draw);
    };
    canvasRaf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(canvasRaf);
      window.removeEventListener("resize", onResize);
    };
  }

  return (
    <>
      {/* Background canvas — all devices */}
      <canvas ref={canvasRef} style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0, opacity: 0.45,
      }} />

      {/* Desktop cursor only */}
      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position: "fixed" }}>
          <div className="cursor-crosshair-h" />
          <div className="cursor-crosshair-v" />
        </div>
        <div ref={innerRef} className="cursor-inner" style={{ position: "fixed" }} />
      </div>
    </>
  );
}
