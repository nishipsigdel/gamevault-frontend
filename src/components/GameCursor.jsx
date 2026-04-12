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
      // ── TOUCH: reuse exact same CSS classes as desktop ──
      const touchCursor = document.createElement("div");
      touchCursor.id = "game-cursor";
      touchCursor.style.cssText = `
        display: none;
        pointer-events: none;
        z-index: 99999;
      `;

      const touchOuter = document.createElement("div");
      touchOuter.className = "cursor-outer";
      touchOuter.style.position = "fixed";

      const crossH = document.createElement("div");
      crossH.className = "cursor-crosshair-h";
      const crossV = document.createElement("div");
      crossV.className = "cursor-crosshair-v";
      touchOuter.appendChild(crossH);
      touchOuter.appendChild(crossV);

      const touchInner = document.createElement("div");
      touchInner.className = "cursor-inner";
      touchInner.style.position = "fixed";

      touchCursor.appendChild(touchOuter);
      touchCursor.appendChild(touchInner);
      document.body.appendChild(touchCursor);

      const touchTarget = { x: 0, y: 0 };
      const touchOuPos  = { x: 0, y: 0 };
      let touchRaf      = null;

      const touchLoop = () => {
        const os = 0.10;
        touchOuPos.x += (touchTarget.x - touchOuPos.x) * os;
        touchOuPos.y += (touchTarget.y - touchOuPos.y) * os;
        // inner dot follows finger exactly
        touchInner.style.left = touchTarget.x + "px";
        touchInner.style.top  = touchTarget.y + "px";
        // outer ring lags behind
        touchOuter.style.left = touchOuPos.x + "px";
        touchOuter.style.top  = touchOuPos.y + "px";
        touchRaf = requestAnimationFrame(touchLoop);
      };

      let hideTimer      = null;
      let sparkInterval  = null;
      let touchStartX    = 0;
      let touchStartY    = 0;
      let hasMoved       = false;
      const SCROLL_THRESHOLD = 8;

      const moveTo = (x, y) => {
        touchTarget.x = x;
        touchTarget.y = y;
        touchCursor.style.display = "block";
        trailPoints.current.push({ x, y, age: 0 });
        if (trailPoints.current.length > 60) trailPoints.current.shift();
      };

      const onTouchStart = (e) => {
        clearTimeout(hideTimer);
        clearInterval(sparkInterval);
        const t = e.touches[0];
        touchStartX   = t.clientX;
        touchStartY   = t.clientY;
        hasMoved      = false;
        // snap outer ring to finger on first touch
        touchTarget.x = t.clientX;
        touchTarget.y = t.clientY;
        touchOuPos.x  = t.clientX;
        touchOuPos.y  = t.clientY;
        moveTo(t.clientX, t.clientY);
        touchOuter.classList.add("clicking");
        sparkInterval = setInterval(() => spawnSparks(t.clientX, t.clientY, 2), 60);
      };

      const onTouchMove = (e) => {
        clearInterval(sparkInterval);
        const t = e.touches[0];
        const dx = Math.abs(t.clientX - touchStartX);
        const dy = Math.abs(t.clientY - touchStartY);
        if (dx > SCROLL_THRESHOLD || dy > SCROLL_THRESHOLD) {
          hasMoved = true;
          touchOuter.classList.remove("clicking");
        }
        moveTo(t.clientX, t.clientY);
        if (!hasMoved) {
          spawnSparks(t.clientX, t.clientY, 1);
        }
      };

      const onTouchEnd = (e) => {
        clearInterval(sparkInterval);
        touchOuter.classList.remove("clicking");
        if (!hasMoved) {
          const t = e.changedTouches[0];
          aestheticTap(t.clientX, t.clientY);
        }
        hideTimer = setTimeout(() => {
          touchCursor.style.display = "none";
          trailPoints.current = [];
        }, 800);
      };

      touchRaf = requestAnimationFrame(touchLoop);
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove",  onTouchMove,  { passive: true });
      document.addEventListener("touchend",   onTouchEnd,   { passive: true });

      return () => {
        cancelAnimationFrame(touchRaf);
        stopBg(); stopTrail();
        touchCursor.remove();
        clearInterval(sparkInterval);
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove",  onTouchMove);
        document.removeEventListener("touchend",   onTouchEnd);
      };
    }

    // ── DESKTOP ──
    const cursor = cursorRef.current;
    if (cursor) cursor.style.display = "none";

    const onMove = (e) => {
      if (cursor && cursor.style.display === "none") {
        cursor.style.display = "block";
      }
      mouse.current = { x: e.clientX, y: e.clientY };
      trailPoints.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailPoints.current.length > 60) trailPoints.current.shift();
      spawnSparks(e.clientX, e.clientY, 2);
    };

    const onLeaveWindow = () => {
      if (cursor) cursor.style.display = "none";
      trailPoints.current = [];
    };

    const onEnter = () => cursor?.classList.add("hovering");
    const onLeave = () => cursor?.classList.remove("hovering");
    const onDown  = () => { cursor?.classList.add("clicking"); spawnClickBurst(mouse.current.x, mouse.current.y); };
    const onUp    = () => cursor?.classList.remove("clicking");

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mousedown",  onDown);
    document.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseleave", onLeaveWindow);
    document.querySelectorAll("a,button,input,select,textarea,[role='button']").forEach((el) => {
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
      cancelAnimationFrame(raf); stopBg(); stopTrail();
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, []);

  // ══════════════════════════════════════════
  //  AESTHETIC TAP EFFECT
  // ══════════════════════════════════════════
  function aestheticTap(x, y) {
    const numLines = 6;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const line  = document.createElement("div");
      const len   = 60;
      line.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: ${len}px; height: 2px;
        background: linear-gradient(90deg, var(--neon), transparent);
        transform-origin: 0 50%;
        transform: translate(0, -50%) rotate(${angle}rad);
        pointer-events: none;
        z-index: 99998;
        border-radius: 2px;
        box-shadow: 0 0 8px var(--neon);
      `;
      document.body.appendChild(line);
      line.animate([
        { opacity: 1, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(0)` },
        { opacity: 1, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(1)` },
        { opacity: 0, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(1.2)` },
      ], { duration: 500, easing: "ease-out" }).onfinish = () => line.remove();
    }

    const rings = [
      { color: "var(--neon)",   size: 8, delay: 0,   duration: 600 },
      { color: "var(--plasma)", size: 6, delay: 80,  duration: 700 },
      { color: "#fbbf24",       size: 4, delay: 160, duration: 550 },
    ];
    rings.forEach(({ color, size, delay, duration }) => {
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        border: 2px solid ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        pointer-events: none;
        z-index: 99998;
        box-shadow: 0 0 12px ${color}, inset 0 0 8px ${color}33;
      `;
      document.body.appendChild(ring);
      ring.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(8)", opacity: 0 },
      ], { duration, delay, easing: "cubic-bezier(0.2,0,0.8,1)", fill: "forwards" }).onfinish = () => ring.remove();
    });

    const diamond = document.createElement("div");
    diamond.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 14px; height: 14px;
      background: white;
      transform: translate(-50%,-50%) rotate(45deg) scale(0);
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 20px white, 0 0 40px var(--neon);
      border-radius: 2px;
    `;
    document.body.appendChild(diamond);
    diamond.animate([
      { transform: "translate(-50%,-50%) rotate(45deg) scale(0)",   opacity: 1 },
      { transform: "translate(-50%,-50%) rotate(45deg) scale(1.5)", opacity: 1 },
      { transform: "translate(-50%,-50%) rotate(45deg) scale(0)",   opacity: 0 },
    ], { duration: 400, easing: "ease-out" }).onfinish = () => diamond.remove();

    const coreDot = document.createElement("div");
    coreDot.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 10px; height: 10px;
      background: var(--neon);
      border-radius: 50%;
      transform: translate(-50%,-50%) scale(0);
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 20px var(--neon), 0 0 40px rgba(0,245,255,0.6);
    `;
    document.body.appendChild(coreDot);
    coreDot.animate([
      { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(2)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(0)", opacity: 0 },
    ], { duration: 350, easing: "ease-out" }).onfinish = () => coreDot.remove();

    for (let i = 0; i < 8; i++) {
      const angle    = (i / 8) * Math.PI * 2;
      const orbitR   = 30;
      const colors   = ["var(--neon)", "var(--plasma)", "#fbbf24", "#ff6b35", "#ffffff"];
      const color    = colors[i % colors.length];
      const px       = x + Math.cos(angle) * orbitR;
      const py       = y + Math.sin(angle) * orbitR;
      const particle = document.createElement("div");
      const pSize    = Math.random() * 4 + 3;
      particle.style.cssText = `
        position: fixed;
        left: ${x}px; top: ${y}px;
        width: ${pSize}px; height: ${pSize}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 99998;
        box-shadow: 0 0 ${pSize * 2}px ${color};
        transform: translate(-50%,-50%);
      `;
      document.body.appendChild(particle);
      const flyAngle = angle + (Math.random() - 0.5) * 0.8;
      const flyDist  = 80 + Math.random() * 60;
      particle.animate([
        { left: `${x}px`,  top: `${y}px`,  opacity: 1, transform: "translate(-50%,-50%) scale(1)"   },
        { left: `${px}px`, top: `${py}px`, opacity: 1, transform: "translate(-50%,-50%) scale(1.3)" },
        {
          left: `${x + Math.cos(flyAngle) * flyDist}px`,
          top:  `${y + Math.sin(flyAngle) * flyDist}px`,
          opacity: 0,
          transform: "translate(-50%,-50%) scale(0)",
        },
      ], { duration: 600, easing: "ease-out", delay: i * 20 }).onfinish = () => particle.remove();
    }

    const shock = document.createElement("div");
    shock.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 6px; height: 6px;
      background: radial-gradient(circle, rgba(0,245,255,0.8) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%,-50%);
      pointer-events: none;
      z-index: 99997;
    `;
    document.body.appendChild(shock);
    shock.animate([
      { transform: "translate(-50%,-50%) scale(1)",  opacity: 0.8 },
      { transform: "translate(-50%,-50%) scale(15)", opacity: 0   },
    ], { duration: 600, easing: "ease-out" }).onfinish = () => shock.remove();
  }

  function spawnSparks(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      const el     = document.createElement("div");
      const size   = Math.random() * 4 + 2;
      const colors = ["var(--neon)", "var(--plasma)", "#fff", "#fbbf24", "#ff6b35"];
      const color  = colors[Math.floor(Math.random() * colors.length)];
      el.style.cssText = `
        position:fixed; left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        background:${color}; border-radius:50%;
        pointer-events:none; z-index:99997;
        box-shadow:0 0 ${size*2}px ${color};
        transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * 50 + 20;
      const dur   = Math.random() * 400 + 300;
      el.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist + 15}px)) scale(0)`, opacity: 0 },
      ], { duration: dur, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  function spawnClickBurst(x, y) {
    aestheticTap(x, y);
  }

  function startTrailCanvas() {
    const canvas = trailCanvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width  = window.innerWidth;
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
          ctx.beginPath();
          ctx.moveTo(alive[i-1].x, alive[i-1].y);
          ctx.lineTo(alive[i].x,   alive[i].y);
          ctx.strokeStyle = `rgba(160,48,240,${op * 0.4})`;
          ctx.lineWidth   = t * 8;
          ctx.shadowBlur  = 20;
          ctx.shadowColor = `rgba(160,48,240,${op * 0.4})`;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  function startBgCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    let w = canvas.width  = window.innerWidth;
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

    const shooters = Array.from({ length: 4 }, () => {
      const s = { reset() {
        this.x=Math.random()*w; this.y=Math.random()*h*0.4;
        this.len=Math.random()*80+40; this.speed=Math.random()*4+2;
        this.angle=Math.PI/4; this.opacity=1; this.active=false;
        this.timer=Math.random()*300+100;
      }};
      s.reset(); return s;
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
      shooters.forEach((s) => {
        if(s.timer>0){s.timer--;return;}
        s.active=true; s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed;
        s.opacity-=0.018;
        if(s.opacity<=0){s.reset();return;}
        ctx.beginPath();
        ctx.moveTo(s.x,s.y);
        ctx.lineTo(s.x-Math.cos(s.angle)*s.len,s.y-Math.sin(s.angle)*s.len);
        const g=ctx.createLinearGradient(s.x,s.y,s.x-Math.cos(s.angle)*s.len,s.y-Math.sin(s.angle)*s.len);
        g.addColorStop(0,`rgba(0,245,255,${s.opacity})`);
        g.addColorStop(1,"transparent");
        ctx.strokeStyle=g; ctx.lineWidth=1.5;
        ctx.shadowBlur=10; ctx.shadowColor="rgba(0,245,255,0.8)";
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }

  return (
    <>
      <canvas ref={canvasRef}      style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.45 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />
      <div id="game-cursor" ref={cursorRef} style={{ display:"none" }}>
        <div ref={outerRef} className="cursor-outer" style={{ position:"fixed" }}>
          <div className="cursor-crosshair-h" />
          <div className="cursor-crosshair-v" />
        </div>
        <div ref={innerRef} className="cursor-inner" style={{ position:"fixed" }} />
      </div>
    </>
  );
}