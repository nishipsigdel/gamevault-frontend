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
    const stopBg    = startBgCanvas();
    const stopTrail = startTrailCanvas();

    if (isTouch) {
      // Finger dot
      const dot = document.createElement("div");
      dot.style.cssText = `
        position:fixed; width:18px; height:18px;
        border:2px solid var(--neon); border-radius:50%;
        pointer-events:none; z-index:99999;
        transform:translate(-50%,-50%);
        box-shadow:0 0 12px var(--neon),0 0 24px rgba(0,245,255,0.4);
        display:none; transition:opacity 0.3s;
      `;
      document.body.appendChild(dot);

      const dotCore = document.createElement("div");
      dotCore.style.cssText = `
        position:fixed; width:5px; height:5px;
        background:var(--neon); border-radius:50%;
        pointer-events:none; z-index:99999;
        transform:translate(-50%,-50%);
        box-shadow:0 0 8px var(--neon); display:none;
      `;
      document.body.appendChild(dotCore);

      let hideTimer = null;

      const moveTo = (x, y) => {
        dot.style.display    = "block";
        dotCore.style.display = "block";
        dot.style.left    = x + "px"; dot.style.top    = y + "px";
        dotCore.style.left = x + "px"; dotCore.style.top = y + "px";
        trailPoints.current.push({ x, y, age: 0 });
        if (trailPoints.current.length > 60) trailPoints.current.shift();
      };

      const onTouchStart = (e) => {
        clearTimeout(hideTimer);
        const t = e.touches[0];
        moveTo(t.clientX, t.clientY);
        aestheticTap(t.clientX, t.clientY); // Effect only on initial touch
      };

      const onTouchMove = (e) => {
        const t = e.touches[0];
        moveTo(t.clientX, t.clientY);
        // SPARK INTERVAL REMOVED: Cursor stays clean while moving
      };

      const onTouchEnd = () => {
        hideTimer = setTimeout(() => {
          dot.style.display = dotCore.style.display = "none";
          trailPoints.current = [];
        }, 600);
      };

      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove",  onTouchMove,  { passive: true });
      document.addEventListener("touchend",   onTouchEnd,   { passive: true });

      return () => {
        stopBg(); stopTrail();
        dot.remove(); dotCore.remove();
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove",  onTouchMove);
        document.removeEventListener("touchend",   onTouchEnd);
      };
    }

    // ── DESKTOP ──
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "block";

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      trailPoints.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailPoints.current.length > 60) trailPoints.current.shift();
      // SPAWN SPARKS REMOVED: No more clicking effect on move
    };

    const onEnter = () => cursor?.classList.add("hovering");
    const onLeave = () => cursor?.classList.remove("hovering");
    const onDown  = () => { 
      cursor?.classList.add("clicking"); 
      spawnClickBurst(mouse.current.x, mouse.current.y); 
    };
    const onUp    = () => cursor?.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);
    
    const targets = "a,button,input,select,textarea,[role='button']";
    document.querySelectorAll(targets).forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    let raf;
    const loop = () => {
      const s = 0.12;
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * s;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * s;
      if (innerRef.current) { 
        innerRef.current.style.left = mouse.current.x + "px"; 
        innerRef.current.style.top = mouse.current.y + "px"; 
      }
      if (outerRef.current) { 
        outerRef.current.style.left = outerPos.current.x + "px"; 
        outerRef.current.style.top = outerPos.current.y + "px"; 
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
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ══════════════════════════════════════════
  //  AESTHETIC TAP EFFECT (Visuals on Click)
  // ══════════════════════════════════════════
  function aestheticTap(x, y) {
    const numLines = 6;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const line  = document.createElement("div");
      const len   = 60;
      line.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: ${len}px; height: 2px;
        background: linear-gradient(90deg, var(--neon), transparent);
        transform-origin: 0 50%;
        transform: translate(0, -50%) rotate(${angle}rad);
        pointer-events: none; z-index: 99998;
        border-radius: 2px; box-shadow: 0 0 8px var(--neon);
      `;
      document.body.appendChild(line);
      line.animate([
        { opacity: 1, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(0)` },
        { opacity: 1, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(1)` },
        { opacity: 0, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(1.2)` },
      ], { duration: 500, easing: "ease-out" }).onfinish = () => line.remove();
    }

    const rings = [
      { color: "var(--neon)",  size: 8,  delay: 0,   duration: 600 },
      { color: "var(--plasma)", size: 6,  delay: 80,  duration: 700 },
      { color: "#fbbf24",       size: 4,  delay: 160, duration: 550 },
    ];
    rings.forEach(({ color, size, delay, duration }) => {
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        border: 2px solid ${color}; border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        pointer-events: none; z-index: 99998;
        box-shadow: 0 0 12px ${color}, inset 0 0 8px ${color}33;
      `;
      document.body.appendChild(ring);
      ring.animate([
        { transform: "translate(-50%,-50%) scale(1)",  opacity: 1 },
        { transform: "translate(-50%,-50%) scale(8)",  opacity: 0 },
      ], { duration, delay, easing: "cubic-bezier(0.2,0,0.8,1)", fill: "forwards" }).onfinish = () => ring.remove();
    });

    const diamond = document.createElement("div");
    diamond.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 14px; height: 14px; background: white;
      transform: translate(-50%,-50%) rotate(45deg) scale(0);
      pointer-events: none; z-index: 99999;
      box-shadow: 0 0 20px white, 0 0 40px var(--neon); border-radius: 2px;
    `;
    document.body.appendChild(diamond);
    diamond.animate([
      { transform: "translate(-50%,-50%) rotate(45deg) scale(0)", opacity: 1 },
      { transform: "translate(-50%,-50%) rotate(45deg) scale(1.5)", opacity: 1 },
      { transform: "translate(-50%,-50%) rotate(45deg) scale(0)", opacity: 0 },
    ], { duration: 400, easing: "ease-out" }).onfinish = () => diamond.remove();

    const shock = document.createElement("div");
    shock.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 6px; height: 6px;
      background: radial-gradient(circle, rgba(0,245,255,0.8) 0%, transparent 70%);
      border-radius: 50%; transform: translate(-50%,-50%);
      pointer-events: none; z-index: 99997;
    `;
    document.body.appendChild(shock);
    shock.animate([
      { transform: "translate(-50%,-50%) scale(1)",  opacity: 0.8 },
      { transform: "translate(-50%,-50%) scale(15)", opacity: 0 },
    ], { duration: 600, easing: "ease-out" }).onfinish = () => shock.remove();
  }

  function spawnClickBurst(x, y) {
    aestheticTap(x, y);
  }

  // ── Trail canvas (Smooth Line) ──
  function startTrailCanvas() {
    const canvas = trailCanvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pts = trailPoints.current;
      pts.forEach((p) => p.age++);
      trailPoints.current = pts.filter((p) => p.age < 40);
      const alive = trailPoints.current;
      if (alive.length >= 2) {
        for (let i = 1; i < alive.length; i++) {
          const t  = i / alive.length;
          const op = t * (1 - alive[i].age / 40);
          ctx.beginPath();
          ctx.moveTo(alive[i-1].x, alive[i-1].y);
          ctx.lineTo(alive[i].x,   alive[i].y);
          ctx.strokeStyle = `rgba(0,245,255,${op})`;
          ctx.lineWidth   = t * 4;
          ctx.lineCap     = "round";
          ctx.shadowBlur  = 14;
          ctx.shadowColor = `rgba(0,245,255,${op})`;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  // ── Background Particle Starfield ──
  function startBgCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const particles = Array.from({ length: 80 }, () => {
      const p = { reset() {
        this.x = Math.random()*w; this.y = Math.random()*h;
        this.size = Math.random()*1.5+0.3;
        this.vx = (Math.random()-0.5)*0.4; this.vy = (Math.random()-0.5)*0.4-0.1;
        this.twinkle = Math.random()*Math.PI*2;
        this.twinkleSpeed = Math.random()*0.02+0.005;
        this.color = Math.random()>0.5?"0,245,255":"160,48,240";
      }};
      p.reset(); return p;
    });

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x+=p.vx; p.y+=p.vy; p.twinkle+=p.twinkleSpeed;
        const op=Math.sin(p.twinkle)*0.3+0.4;
        if(p.y<-5||p.x<-5||p.x>w+5) p.reset();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.color},${op})`;
        ctx.shadowBlur=6; ctx.shadowColor=`rgba(${p.color},0.8)`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.45 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />
      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position:"fixed" }}>
          <div className="cursor-crosshair-h" />
          <div className="cursor-crosshair-v" />
        </div>
        <div ref={innerRef} className="cursor-inner" style={{ position:"fixed" }} />
      </div>
    </>
  );
}