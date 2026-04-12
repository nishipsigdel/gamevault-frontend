import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef = useRef(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailCanvasRef = useRef(null);

  const mouse = useRef({ x: -100, y: -100 });
  const outerPos = useRef({ x: -100, y: -100 });
  const trailPoints = useRef([]);

  useEffect(() => {
    const stopBg = startBgCanvas();
    const stopTrail = startTrailCanvas();

    const updatePosition = (x, y) => {
      mouse.current = { x, y };
      
      // Add to trail
      trailPoints.current.push({ x, y, age: 0 });
      if (trailPoints.current.length > 25) trailPoints.current.shift();

      // Small sparks on move
      spawnSparks(x, y, 1);
    };

    // --- MOUSE EVENTS ---
    const onMouseMove = (e) => updatePosition(e.clientX, e.clientY);
    const onMouseDown = (e) => spawnClickBurst(e.clientX, e.clientY);

    // --- TOUCH EVENTS ---
    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };
    const onTouchStart = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
        spawnClickBurst(touch.clientX, touch.clientY);
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchstart", onTouchStart, { passive: false });

    let raf;
    const loop = () => {
      const s = 0.15; // Smoothness
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * s;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * s;

      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopBg();
      stopTrail();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  // --- HELPER FUNCTIONS (Logic remains mostly same, optimized for performance) ---

  function aestheticTap(x, y) {
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 10px; height: 10px; border: 2px solid var(--neon, #00f5ff);
      border-radius: 50%; pointer-events: none; z-index: 99998;
      box-shadow: 0 0 12px var(--neon, #00f5ff); transform: translate(-50%, -50%);
    `;
    document.body.appendChild(ring);
    ring.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(6)", opacity: 0 }
    ], { duration: 500 }).onfinish = () => ring.remove();
  }

  function spawnClickBurst(x, y) {
    aestheticTap(x, y);
    spawnSparks(x, y, 6);
  }

  function spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 3 + 2;
      el.style.cssText = `
        position:fixed; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
        background:var(--neon, #00f5ff); border-radius:50%; pointer-events:none;
        z-index:99997; box-shadow:0 0 6px var(--neon, #00f5ff); transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40 + 10;
      el.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`, opacity: 0 }
      ], { duration: 400 }).onfinish = () => el.remove();
    }
  }

  function startTrailCanvas() {
    const canvas = trailCanvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pts = trailPoints.current;
      pts.forEach(p => p.age++);
      trailPoints.current = pts.filter(p => p.age < 25);
      const alive = trailPoints.current;
      if (alive.length > 1) {
        for (let i = 1; i < alive.length; i++) {
          const t = i / alive.length;
          const op = t * (1 - alive[i].age / 25);
          ctx.beginPath();
          ctx.moveTo(alive[i - 1].x, alive[i - 1].y);
          ctx.lineTo(alive[i].x, alive[i].y);
          ctx.strokeStyle = `rgba(0,245,255,${op})`;
          ctx.lineWidth = t * 3;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  function startBgCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.fillStyle = "rgba(0,245,255,0.2)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:2 }} />
      <div ref={cursorRef} style={{ pointerEvents: "none" }}>
        <div ref={outerRef} className="cursor-outer" style={{ position:"fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999 }} />
        <div ref={innerRef} className="cursor-inner" style={{ position:"fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 10000 }} />
      </div>
    </>
  );
}