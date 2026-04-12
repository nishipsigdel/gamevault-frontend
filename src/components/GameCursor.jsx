import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef      = useRef(null);
  const outerRef       = useRef(null);
  const innerRef       = useRef(null);
  const canvasRef      = useRef(null);
  const trailCanvasRef = useRef(null);

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

    // ─────────────────────────────
    // 📱 TOUCH DEVICES (FIXED)
    // ─────────────────────────────
    if (isTouch) {
      const dot = document.createElement("div");
      dot.style.cssText = `
        position:fixed;
        width:16px;height:16px;
        border:2px solid var(--neon);
        border-radius:50%;
        pointer-events:none;
        z-index:99999;
        transform:translate(-50%,-50%);
        box-shadow:0 0 10px var(--neon);
        display:none;
      `;
      document.body.appendChild(dot);

      const core = document.createElement("div");
      core.style.cssText = `
        position:fixed;
        width:4px;height:4px;
        background:var(--neon);
        border-radius:50%;
        pointer-events:none;
        z-index:99999;
        transform:translate(-50%,-50%);
        display:none;
      `;
      document.body.appendChild(core);

      let hideTimer;

      const move = (x, y) => {
        dot.style.display = "block";
        core.style.display = "block";

        dot.style.left = x + "px";
        dot.style.top  = y + "px";
        core.style.left = x + "px";
        core.style.top  = y + "px";

        trailPoints.current.push({ x, y, age: 0 });
        if (trailPoints.current.length > 25) trailPoints.current.shift();
      };

      const onTouchStart = (e) => {
        clearTimeout(hideTimer);
        const t = e.touches[0];
        move(t.clientX, t.clientY);
        aestheticTap(t.clientX, t.clientY);
      };

      const onTouchMove = (e) => {
        const t = e.touches[0];
        move(t.clientX, t.clientY);
      };

      const onTouchEnd = () => {
        hideTimer = setTimeout(() => {
          dot.style.display = "none";
          core.style.display = "none";
          trailPoints.current = [];
        }, 400);
      };

      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("touchend", onTouchEnd);

      return () => {
        stopBg();
        stopTrail();
        dot.remove();
        core.remove();
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };
    }

    // ─────────────────────────────
    // 🖥 DESKTOP
    // ─────────────────────────────
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      trailPoints.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailPoints.current.length > 25) trailPoints.current.shift();

      spawnSparks(e.clientX, e.clientY, 1);
    };

    const onDown = () => {
      aestheticTap(mouse.current.x, mouse.current.y);
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
  }

  // ── Trail canvas ──
  function startTrailCanvas() {
    const canvas = trailCanvasRef.current;
    if (!canvas) return () => {};

    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

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
        ctx.lineWidth = t * 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }

  // ── Background ──
  function startBgCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 40 }, () => ({
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
        ctx.fillStyle = "rgba(0,245,255,0.4)";
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />

      <div ref={cursorRef}>
        <div ref={outerRef} style={{ position:"fixed" }} />
        <div ref={innerRef} style={{ position:"fixed" }} />
      </div>
    </>
  );
}