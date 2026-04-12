import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef      = useRef(null);
  const outerRef       = useRef(null);
  const innerRef       = useRef(null);
  const canvasRef      = useRef(null);
  const trailCanvasRef = useRef(null);
  const mouse          = useRef({ x: 0, y: 0 });
  const outerPos       = useRef({ x: 0, y: 0 });
  const trailPoints    = useRef([]);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const stopBg    = isTouch ? () => {} : startBgCanvas(); // disable bg on mobile
    const stopTrail = startTrailCanvas();

    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    // ── UNIFIED MOVE (mouse + touch) ──
    const updatePosition = (x, y) => {
      mouse.current = { x, y };
      trailPoints.current.push({ x, y, age: 0 });
      if (trailPoints.current.length > 30) trailPoints.current.shift(); // smaller trail

      spawnSparks(x, y, 1); // reduced sparks
    };

    const onMouseMove = (e) => updatePosition(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      const t = e.touches[0];
      updatePosition(t.clientX, t.clientY);
    };

    const onDown = () => {
      cursor?.classList.add("clicking");
      spawnClickBurst(mouse.current.x, mouse.current.y);
    };

    const onUp = () => {
      cursor?.classList.remove("clicking");
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("touchend", onUp, { passive: true });

    let raf;
    const loop = () => {
      const s = 0.18; // slightly faster follow
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * s;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * s;

      if (innerRef.current) {
        innerRef.current.style.left = mouse.current.x + "px";
        innerRef.current.style.top  = mouse.current.y + "px";
      }

      if (outerRef.current) {
        outerRef.current.style.left = outerPos.current.x + "px";
        outerRef.current.style.top  = outerPos.current.y + "px";
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopBg();
      stopTrail();

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("touchend", onUp);
    };
  }, []);

  // ── SMALLER SPARKS ──
  function spawnSparks(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 2 + 1.5;

      el.style.cssText = `
        position:fixed; left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        background:var(--neon); border-radius:50%;
        pointer-events:none; z-index:99997;
        box-shadow:0 0 ${size * 2}px var(--neon);
        transform:translate(-50%,-50%);
      `;

      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * 30 + 10;

      el.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`,
          opacity: 0
        }
      ], { duration: 300, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  function spawnClickBurst(x, y) {
    aestheticTap(x, y);
  }

  // ── CLEANER TAP ──
  function aestheticTap(x, y) {
    const ring = document.createElement("div");

    ring.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 6px; height: 6px;
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
    ], { duration: 400, easing: "ease-out" }).onfinish = () => ring.remove();
  }

  // ── SMALL TRAIL ──
  function startTrailCanvas() {
    const canvas = trailCanvasRef.current;
    if (!canvas) return () => {};

    const ctx = canvas.getContext("2d");

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", onResize);

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const pts = trailPoints.current;
      pts.forEach(p => p.age++);

      trailPoints.current = pts.filter(p => p.age < 20); // shorter life

      const alive = trailPoints.current;

      for (let i = 1; i < alive.length; i++) {
        const t  = i / alive.length;
        const op = t * (1 - alive[i].age / 20);

        ctx.beginPath();
        ctx.moveTo(alive[i-1].x, alive[i-1].y);
        ctx.lineTo(alive[i].x, alive[i].y);

        ctx.strokeStyle = `rgba(0,245,255,${op})`;
        ctx.lineWidth   = t * 2; // smaller width
        ctx.lineCap     = "round";

        ctx.shadowBlur  = 6; // less glow
        ctx.shadowColor = `rgba(0,245,255,${op})`;

        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }

  // ── BACKGROUND (UNCHANGED) ──
  function startBgCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const ctx = canvas.getContext("2d");

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", onResize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random()*w,
      y: Math.random()*h,
      size: Math.random()*1.2,
      vy: -0.2
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < 0) p.y = h;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,245,255,0.4)";
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.3 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />

      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position:"fixed" }} />
        <div ref={innerRef} className="cursor-inner" style={{ position:"fixed" }} />
      </div>
    </>
  );
}