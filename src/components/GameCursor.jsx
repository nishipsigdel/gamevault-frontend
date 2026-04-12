import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef      = useRef(null);
  const outerRef       = useRef(null);
  const innerRef       = useRef(null);
  const canvasRef      = useRef(null);
  const trailCanvasRef = useRef(null);

  // ✅ FIX: start at center
  const mouse = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const outerPos = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const trailPoints = useRef([]);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const stopBg    = startBgCanvas();
    const stopTrail = startTrailCanvas();

    if (isTouch) {
      return () => {
        stopBg();
        stopTrail();
      };
    }

    // ── DESKTOP ──
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      trailPoints.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailPoints.current.length > 25) trailPoints.current.shift(); // ✅ smaller trail

      spawnSparks(e.clientX, e.clientY, 1); // reduced
    };

    const onDown = () => {
      spawnClickBurst(mouse.current.x, mouse.current.y);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);

    let raf;
    const loop = () => {
      const s = 0.12;

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
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // ✨ CLEAN CLICK EFFECT
  function aestheticTap(x, y) {
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
      box-shadow: 0 0 12px var(--neon);
    `;
    document.body.appendChild(ring);

    ring.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(6)", opacity: 0 },
    ], { duration: 500 }).onfinish = () => ring.remove();

    // small particles
    for (let i = 0; i < 5; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 3 + 2;

      p.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        background: var(--neon);
        border-radius: 50%;
        pointer-events: none;
        z-index: 99998;
        box-shadow: 0 0 8px var(--neon);
        transform: translate(-50%,-50%);
      `;
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40 + 20;

      p.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`,
          opacity: 0,
        },
      ], { duration: 400 }).onfinish = () => p.remove();
    }
  }

  function spawnClickBurst(x, y) {
    aestheticTap(x, y);
  }

  // ✨ lighter sparks
  function spawnSparks(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 3 + 2;

      el.style.cssText = `
        position:fixed;
        left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        background:var(--neon);
        border-radius:50%;
        pointer-events:none;
        z-index:99997;
        box-shadow:0 0 6px var(--neon);
        transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30 + 10;

      el.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`,
          opacity: 0,
        },
      ], { duration: 300 }).onfinish = () => el.remove();
    }
  }

  // ── Trail canvas (cleaner) ──
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
      pts.forEach((p) => p.age++);

      trailPoints.current = pts.filter((p) => p.age < 25);

      const alive = trailPoints.current;

      for (let i = 1; i < alive.length; i++) {
        const t = i / alive.length;
        const op = t * (1 - alive[i].age / 25);

        ctx.beginPath();
        ctx.moveTo(alive[i - 1].x, alive[i - 1].y);
        ctx.lineTo(alive[i].x, alive[i].y);
        ctx.strokeStyle = `rgba(0,245,255,${op})`;
        ctx.lineWidth = t * 2; // thinner
        ctx.lineCap = "round";
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

  // ── Background (unchanged but stable) ──
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
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,245,255,0.5)";
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
      <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.4 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />

      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position:"fixed" }} />
        <div ref={innerRef} className="cursor-inner" style={{ position:"fixed" }} />
      </div>
    </>
  );
}