import { useEffect, useRef, useState } from "react";

export default function GameCursor() {
  const cursorRef      = useRef(null);
  const outerRef       = useRef(null);
  const innerRef       = useRef(null);
  const canvasRef      = useRef(null);
  const trailCanvasRef = useRef(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const mouse          = useRef({ x: -100, y: -100 });
  const outerPos       = useRef({ x: -100, y: -100 });
  const trailPoints    = useRef([]);
  const rafId          = useRef(null);

  const CONFIG = {
    trailLength: 12,
    followSpeed: 0.12,
    neonColor: "0,245,255",
    plasmaColor: "160,48,240"
  };

  // Unified cursor update function
  const updateCursorPosition = (x, y) => {
    mouse.current = { x, y };
    trailPoints.current.push({ x, y, age: 0 });
    if (trailPoints.current.length > CONFIG.trailLength) {
      trailPoints.current.shift();
    }
  };

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const stopBg    = startBgCanvas();
    const stopTrail = startTrailCanvas();

    // Show custom cursor
    if (cursorRef.current) cursorRef.current.style.display = "block";

    if (isTouch) {
      // TOUCH: Same visual style as desktop, but follows finger
      let hideTimer = null;
      
      const onTouchStart = (e) => {
        clearTimeout(hideTimer);
        setIsVisible(true);
        const t = e.touches[0];
        updateCursorPosition(t.clientX, t.clientY);
        outerPos.current = { x: t.clientX, y: t.clientY }; // Snap immediately on touch
        spawnClickBurst(t.clientX, t.clientY);
        cursorRef.current?.classList.add("clicking");
      };

      const onTouchMove = (e) => {
        const t = e.touches[0];
        updateCursorPosition(t.clientX, t.clientY);
      };

      const onTouchEnd = () => {
        cursorRef.current?.classList.remove("clicking");
        hideTimer = setTimeout(() => {
          setIsVisible(false);
          trailPoints.current = [];
        }, 800);
      };

      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove",  onTouchMove,  { passive: true });
      document.addEventListener("touchend",   onTouchEnd,   { passive: true });

      // Animation loop for touch (same physics as desktop)
      let raf;
      const loop = () => {
        outerPos.current.x += (mouse.current.x - outerPos.current.x) * CONFIG.followSpeed;
        outerPos.current.y += (mouse.current.y - outerPos.current.y) * CONFIG.followSpeed;
        
        if (innerRef.current) {
          innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`;
          innerRef.current.style.opacity = isVisible ? 1 : 0;
        }
        if (outerRef.current) {
          outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)`;
          outerRef.current.style.opacity = isVisible ? 1 : 0;
        }
        
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(raf);
        stopBg(); stopTrail();
        clearTimeout(hideTimer);
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove",  onTouchMove);
        document.removeEventListener("touchend",   onTouchEnd);
      };
    }

    // DESKTOP: Same as before
    const onMouseMove = (e) => {
      if (!isVisible) setIsVisible(true);
      updateCursorPosition(e.clientX, e.clientY);
    };
    
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = (e) => {
      updateCursorPosition(e.clientX, e.clientY);
      setIsVisible(true);
    };

    const onDown = () => {
      cursorRef.current?.classList.add("clicking");
      spawnClickBurst(mouse.current.x, mouse.current.y);
    };
    const onUp = () => cursorRef.current?.classList.remove("clicking");

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    // Hover effects on interactive elements
    const interactive = document.querySelectorAll('a, button, input, [role="button"], [data-cursor]');
    const onElEnter = () => {
      outerRef.current?.classList.add('hovering');
      innerRef.current?.classList.add('hovering');
    };
    const onElLeave = () => {
      outerRef.current?.classList.remove('hovering');
      innerRef.current?.classList.remove('hovering');
    };
    
    interactive.forEach((el) => {
      el.addEventListener("mouseenter", onElEnter);
      el.addEventListener("mouseleave", onElLeave);
    });

    let raf;
    const loop = () => {
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * CONFIG.followSpeed;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * CONFIG.followSpeed;
      
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`;
        innerRef.current.style.opacity = isVisible ? 1 : 0;
      }
      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)`;
        outerRef.current.style.opacity = isVisible ? 1 : 0;
      }
      
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopBg(); stopTrail();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
      interactive.forEach((el) => {
        el.removeEventListener("mouseenter", onElEnter);
        el.removeEventListener("mouseleave", onElLeave);
      });
    };
  }, [isVisible]);

  // Unified click/tap burst effect
  function spawnClickBurst(x, y) {
    // Hexagon burst lines
    const numLines = 6;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const line  = document.createElement("div");
      line.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: 50px; height: 2px;
        background: linear-gradient(90deg, rgb(${CONFIG.neonColor}), transparent);
        transform-origin: 0 50%;
        transform: translate(0, -50%) rotate(${angle}rad);
        pointer-events: none; z-index: 99998;
        box-shadow: 0 0 8px rgb(${CONFIG.neonColor});
      `;
      document.body.appendChild(line);
      line.animate([
        { opacity: 1, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(0)` },
        { opacity: 0, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(1.5)` }
      ], { duration: 400, easing: "ease-out" }).onfinish = () => line.remove();
    }

    // Expanding rings
    const rings = [
      { color: `rgb(${CONFIG.neonColor})`, size: 6, delay: 0 },
      { color: `rgb(${CONFIG.plasmaColor})`, size: 4, delay: 100 },
    ];
    rings.forEach(({ color, size, delay }) => {
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        border: 2px solid ${color}; border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none; z-index: 99998;
        box-shadow: 0 0 12px ${color};
      `;
      document.body.appendChild(ring);
      ring.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(6)", opacity: 0 }
      ], { duration: 500, delay, easing: "ease-out" }).onfinish = () => ring.remove();
    });

    // Center flash
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 8px; height: 8px; background: white;
      border-radius: 50%; transform: translate(-50%, -50%);
      pointer-events: none; z-index: 99999;
      box-shadow: 0 0 20px white, 0 0 40px rgb(${CONFIG.neonColor});
    `;
    document.body.appendChild(flash);
    flash.animate([
      { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(2)", opacity: 0 }
    ], { duration: 300, easing: "ease-out" }).onfinish = () => flash.remove();

    // Orbital particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: 3px; height: 3px; background: rgb(${CONFIG.neonColor});
        border-radius: 50%; pointer-events: none; z-index: 99998;
        box-shadow: 0 0 6px rgb(${CONFIG.neonColor});
      `;
      document.body.appendChild(particle);
      const flyDist = 60 + Math.random() * 40;
      particle.animate([
        { transform: "translate(-50%,-50%)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*flyDist}px), calc(-50% + ${Math.sin(angle)*flyDist}px))`, opacity: 0 }
      ], { duration: 500, delay: i * 30, easing: "ease-out" }).onfinish = () => particle.remove();
    }
  }

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
      trailPoints.current = pts.filter(p => p.age < 15);

      const alive = trailPoints.current;
      if (alive.length < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }

      for (let i = 1; i < alive.length; i++) {
        const t = i / alive.length;
        const op = t * (1 - alive[i].age / 15);
        
        ctx.beginPath();
        ctx.moveTo(alive[i-1].x, alive[i-1].y);
        ctx.lineTo(alive[i].x, alive[i].y);
        
        ctx.strokeStyle = `rgba(${CONFIG.neonColor},${op * 0.6})`;
        ctx.lineWidth = t * 1.5;
        ctx.lineCap = "round";
        ctx.shadowBlur = 4;
        ctx.shadowColor = `rgba(${CONFIG.neonColor},${op})`;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }

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
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 - 0.1,
      size: Math.random() * 1.2 + 0.3,
      reset() {
        this.x = Math.random() * w; this.y = Math.random() * h;
      }
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < 0 || p.x < 0 || p.x > w) p.reset();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CONFIG.neonColor},0.4)`;
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
      <style>{`
        #game-cursor {
          position: fixed; top: 0; left: 0;
          pointer-events: none; z-index: 99999;
          display: none;
        }
        
        .cursor-inner {
          position: fixed; left: 0; top: 0;
          width: 6px; height: 6px;
          background: rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgb(${CONFIG.neonColor});
          transition: transform 0.1s;
          opacity: 0;
        }
        
        .cursor-outer {
          position: fixed; left: 0; top: 0;
          width: 32px; height: 32px;
          border: 1.5px solid rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 15px rgba(${CONFIG.neonColor},0.3);
          transition: all 0.2s ease;
          opacity: 0;
        }
        
        .cursor-outer::before,
        .cursor-outer::after {
          content: ''; position: absolute;
          background: rgb(${CONFIG.neonColor});
          transform: translate(-50%, -50%);
        }
        
        /* Crosshair lines */
        .cursor-outer::before {
          width: 8px; height: 1px;
          left: 50%; top: 0;
        }
        .cursor-outer::after {
          width: 1px; height: 8px;
          left: 0; top: 50%;
        }
        
        .cursor-outer.hovering {
          width: 48px; height: 48px;
          border-color: rgba(${CONFIG.neonColor},0.6);
          background: rgba(${CONFIG.neonColor},0.05);
        }
        
        #game-cursor.clicking .cursor-inner {
          transform: translate(-50%, -50%) scale(0.5) !important;
        }
        #game-cursor.clicking .cursor-outer {
          transform: translate(-50%, -50%) scale(0.9) !important;
          border-color: rgb(${CONFIG.plasmaColor});
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.4 }} />
      <canvas ref={trailCanvasRef} style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2 }} />
      
      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" />
        <div ref={innerRef} className="cursor-inner" />
      </div>
    </>
  );
}