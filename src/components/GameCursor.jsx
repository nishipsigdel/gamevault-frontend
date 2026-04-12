import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef = useRef(null);
  const outerRef  = useRef(null);
  const innerRef  = useRef(null);
  const canvasRef = useRef(null);
  const mouse     = useRef({ x: 0, y: 0 });
  const outer     = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    // ── TOUCH DEVICES — show ripple on tap ──
    if (isTouch) {
      const onTouch = (e) => {
        Array.from(e.changedTouches).forEach((touch) => {
          spawnTouchRipple(touch.clientX, touch.clientY);
        });
      };
      document.addEventListener("touchstart", onTouch, { passive: true });

      // Background canvas still runs on mobile
      startCanvas();

      return () => {
        document.removeEventListener("touchstart", onTouch);
      };
    }

    // ── DESKTOP — custom cursor ──
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      spawnTrail(e.clientX, e.clientY);
    };

    const onEnter = () => cursor?.classList.add("hovering");
    const onLeave = () => cursor?.classList.remove("hovering");
    const onDown  = () => { cursor?.classList.add("clicking"); spawnClickBurst(mouse.current.x, mouse.current.y); };
    const onUp    = () => cursor?.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    const interactives = document.querySelectorAll("a,button,input,select,textarea,[role='button']");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // Smooth cursor follow loop
    let raf;
    const animate = () => {
      const speed = 0.12;
      outer.current.x += (mouse.current.x - outer.current.x) * speed;
      outer.current.y += (mouse.current.y - outer.current.y) * speed;
      if (innerRef.current) {
        innerRef.current.style.left = mouse.current.x + "px";
        innerRef.current.style.top  = mouse.current.y + "px";
      }
      if (outerRef.current) {
        outerRef.current.style.left = outer.current.x + "px";
        outerRef.current.style.top  = outer.current.y + "px";
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const stopCanvas = startCanvas();

    return () => {
      cancelAnimationFrame(raf);
      stopCanvas();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Touch ripple effect ──
  function spawnTouchRipple(x, y) {
    // Outer expanding ring
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 10px; height: 10px;
      border: 2px solid var(--neon);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(1);
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 10px var(--neon);
    `;
    document.body.appendChild(ring);
    ring.animate([
      { transform: "translate(-50%,-50%) scale(1)",  opacity: 1 },
      { transform: "translate(-50%,-50%) scale(5)",  opacity: 0 },
    ], { duration: 600, easing: "ease-out" }).onfinish = () => ring.remove();

    // Inner dot flash
    const dot = document.createElement("div");
    dot.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 8px; height: 8px;
      background: var(--neon);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 15px var(--neon), 0 0 30px var(--neon);
    `;
    document.body.appendChild(dot);
    dot.animate([
      { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
      { opacity: 0, transform: "translate(-50%,-50%) scale(0)" },
    ], { duration: 400, easing: "ease-out" }).onfinish = () => dot.remove();

    // Particle burst on tap
    for (let i = 0; i < 6; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: 4px; height: 4px;
        background: ${Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)"};
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
      `;
      document.body.appendChild(p);
      const angle = (i / 6) * Math.PI * 2;
      const dist  = Math.random() * 40 + 15;
      p.animate([
        { transform: `translate(-50%,-50%)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`, opacity: 0 },
      ], { duration: 500, easing: "ease-out" }).onfinish = () => p.remove();
    }
  }

  // ── Trail particle (desktop) ──
  function spawnTrail(x, y) {
    const el = document.createElement("div");
    el.className = "cursor-trail";
    el.style.left       = x + "px";
    el.style.top        = y + "px";
    el.style.width      = Math.random() * 4 + 2 + "px";
    el.style.height     = el.style.width;
    el.style.background = Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  // ── Click burst (desktop) ──
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
        { transform: `translate(-50%,-50%)`,                                                                                    opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`, opacity: 0 },
      ], { duration: 400, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  // ── Background canvas (runs on both desktop & mobile) ──
  function startCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx    = canvas.getContext("2d");
    let width    = canvas.width  = window.innerWidth;
    let height   = canvas.height = window.innerHeight;

    const onResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Floating star particles
    const particles = Array.from({ length: 80 }, () => {
      const p = {};
      const reset = () => {
        p.x    = Math.random() * width;
        p.y    = Math.random() * height;
        p.size = Math.random() * 1.5 + 0.3;
        p.vx   = (Math.random() - 0.5) * 0.4;
        p.vy   = (Math.random() - 0.5) * 0.4 - 0.1;
        p.twinkle = Math.random() * Math.PI * 2;
        p.twinkleSpeed = Math.random() * 0.02 + 0.005;
        p.color = Math.random() > 0.5 ? "0,245,255" : "160,48,240";
      };
      p.reset = reset;
      reset();
      return p;
    });

    // Shooting stars
    const shooters = Array.from({ length: 4 }, () => {
      const s = {};
      const reset = () => {
        s.x       = Math.random() * width;
        s.y       = Math.random() * height * 0.4;
        s.len     = Math.random() * 80 + 40;
        s.speed   = Math.random() * 4 + 2;
        s.angle   = Math.PI / 4;
        s.opacity = 1;
        s.active  = false;
        s.timer   = Math.random() * 300 + 100;
      };
      s.reset = reset;
      reset();
      return s;
    });

    let canvasRaf;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.twinkle += p.twinkleSpeed;
        const op = Math.sin(p.twinkle) * 0.3 + 0.4;
        if (p.y < -5 || p.x < -5 || p.x > width + 5) p.reset();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle    = `rgba(${p.color},${op})`;
        ctx.shadowBlur   = 6;
        ctx.shadowColor  = `rgba(${p.color},0.8)`;
        ctx.fill();
      });

      // Draw shooting stars
      shooters.forEach((s) => {
        if (s.timer > 0) { s.timer--; return; }
        s.active = true;
        s.x     += Math.cos(s.angle) * s.speed;
        s.y     += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.018;
        if (s.opacity <= 0) { s.reset(); return; }
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
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
      {/* Background canvas — visible on all devices */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 0, opacity: 0.45,
        }}
      />

      {/* Custom cursor — only shown on desktop via JS */}
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
