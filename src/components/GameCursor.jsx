import { useEffect, useRef, useState } from "react";

export default function GameCursor() {
  const cursorRef = useRef(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailCanvasRef = useRef(null);
  
  // Hide cursor until mouse enters viewport
  const [isVisible, setIsVisible] = useState(false);
  const mouse = useRef({ x: -100, y: -100, prevX: -100, prevY: -100, vx: 0, vy: 0 });
  const outerPos = useRef({ x: -100, y: -100 });
  const trailPoints = useRef([]);
  const rafId = useRef(null);
  const isHovering = useRef(false);
  const glitchIntensity = useRef(0);

  const CONFIG = {
    trailLength: 12,        // Reduced from 40
    baseSpeed: 0.15,
    fastSpeed: 0.08,
    neonColor: "0,245,255",
    glitchColor: "255,0,128",
    maxVelocity: 50
  };

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouch) return;

    const stopBg = startBgCanvas();
    const stopTrail = startTrailCanvas();

    const updatePosition = (x, y) => {
      // Show cursor on first movement
      if (!isVisible) setIsVisible(true);
      
      mouse.current.prevX = mouse.current.x;
      mouse.current.prevY = mouse.current.y;
      mouse.current.x = x;
      mouse.current.y = y;
      
      mouse.current.vx = mouse.current.x - mouse.current.prevX;
      mouse.current.vy = mouse.current.y - mouse.current.prevY;
      
      const speed = Math.sqrt(mouse.current.vx ** 2 + mouse.current.vy ** 2);
      
      trailPoints.current.push({ 
        x, 
        y, 
        age: 0, 
        vx: mouse.current.vx * 0.3, 
        vy: mouse.current.vy * 0.3,
        speed 
      });
      
      // Shorter trail
      const dynamicLength = Math.min(CONFIG.trailLength + speed * 0.5, 20);
      if (trailPoints.current.length > dynamicLength) {
        trailPoints.current.shift();
      }

      if (speed > 30) {
        glitchIntensity.current = Math.min(glitchIntensity.current + 0.2, 1);
        if (Math.random() > 0.8) spawnGlitchSparks(x, y, speed);
      } else {
        glitchIntensity.current *= 0.95;
      }

      if (speed > 5 && Math.random() > 0.85) {
        spawnSparks(x, y, Math.min(speed / 10, 2));
      }
    };

    const onMouseMove = (e) => updatePosition(e.clientX, e.clientY);
    
    // Hide when mouse leaves window
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = (e) => {
      updatePosition(e.clientX, e.clientY);
      setIsVisible(true);
    };

    const onDown = () => {
      cursorRef.current?.classList.add("clicking");
      spawnClickBurst(mouse.current.x, mouse.current.y);
      document.body.style.transform = `translate(${Math.random()*2-1}px, ${Math.random()*2-1}px)`;
      setTimeout(() => document.body.style.transform = "", 50);
    };

    const onUp = () => {
      cursorRef.current?.classList.remove("clicking");
    };

    // Magnetic effect detection
    const detectInteractiveElements = () => {
      const interactive = document.querySelectorAll('a, button, [data-cursor="pointer"], input, textarea');
      
      interactive.forEach(el => {
        el.addEventListener('mouseenter', () => {
          isHovering.current = true;
          outerRef.current?.classList.add('hovering');
          innerRef.current?.classList.add('hovering');
        });
        
        el.addEventListener('mouseleave', () => {
          isHovering.current = false;
          outerRef.current?.classList.remove('hovering');
          innerRef.current?.classList.remove('hovering');
        });
      });
    };

    detectInteractiveElements();
    const observer = new MutationObserver(detectInteractiveElements);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    const loop = () => {
      const targetSpeed = isHovering.current ? CONFIG.fastSpeed : CONFIG.baseSpeed;
      
      const dx = mouse.current.x - outerPos.current.x;
      const dy = mouse.current.y - outerPos.current.y;
      
      outerPos.current.x += dx * targetSpeed;
      outerPos.current.y += dy * targetSpeed;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const velocity = Math.sqrt(dx*dx + dy*dy);
      
      // Only render if visible
      if (isVisible) {
        if (innerRef.current) {
          innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) rotate(${angle}deg)`;
          innerRef.current.style.opacity = 1;
        }

        if (outerRef.current) {
          const time = Date.now() * 0.003;
          const breathe = isHovering.current ? 1.2 : 1 + Math.sin(time) * 0.05;
          const scale = breathe + (glitchIntensity.current * 0.2);
          
          outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) rotate(${angle}deg) scale(${scale})`;
          outerRef.current.style.opacity = 1;
          
          if (glitchIntensity.current > 0.3) {
            outerRef.current.style.filter = `
              drop-shadow(${glitchIntensity.current * 3}px 0 0 rgba(255,0,0,0.5))
              drop-shadow(-${glitchIntensity.current * 3}px 0 0 rgba(0,255,255,0.5))
            `;
          } else {
            outerRef.current.style.filter = 'none';
          }
        }
      } else {
        // Hide when mouse leaves
        if (innerRef.current) innerRef.current.style.opacity = 0;
        if (outerRef.current) outerRef.current.style.opacity = 0;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId.current);
      stopBg();
      stopTrail();
      observer.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isVisible]);

  function spawnSparks(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 2 + 1;
      const isGlitch = glitchIntensity.current > 0.5;
      const color = isGlitch ? CONFIG.glitchColor : CONFIG.neonColor;

      el.style.cssText = `
        position:fixed; 
        left:${x}px; 
        top:${y}px;
        width:${size}px; 
        height:${size}px;
        background:rgb(${color});
        border-radius:50%;
        pointer-events:none; 
        z-index:99997;
        box-shadow:0 0 ${size * 2}px rgb(${color});
        transform:translate(-50%,-50%);
        mix-blend-mode: screen;
      `;

      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30 + 10;
      const duration = Math.random() * 300 + 200;

      el.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`, opacity: 0 }
      ], { duration, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  function spawnGlitchSparks(x, y, intensity) {
    const count = Math.min(Math.floor(intensity / 8), 3);
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed; left:${x}px; top:${y}px;
        width:2px; height:10px;
        background:rgb(${CONFIG.glitchColor});
        pointer-events:none; z-index:99996;
        mix-blend-mode: exclusion;
      `;
      document.body.appendChild(el);
      
      const angle = Math.random() * Math.PI * 2;
      el.animate([
        { transform: `translate(-50%,-50%) rotate(${angle}rad) translateX(0)`, opacity: 1 },
        { transform: `translate(-50%,-50%) rotate(${angle}rad) translateX(${Math.random()*40+10}px)`, opacity: 0 }
      ], { duration: 150, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  function spawnClickBurst(x, y) {
    const shockwave = document.createElement("div");
    shockwave.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 8px; height: 8px;
      border: 2px solid rgb(${CONFIG.neonColor});
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none; z-index: 99998;
      box-shadow: 0 0 15px rgb(${CONFIG.neonColor});
    `;
    document.body.appendChild(shockwave);
    
    shockwave.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(-50%,-50%) scale(6)", opacity: 0 }
    ], { duration: 500, easing: "ease-out" }).onfinish = () => shockwave.remove();

    for (let i = 0; i < 6; i++) {
      setTimeout(() => spawnSparks(x, y, 1), i * 20);
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

      // Shorter life for thinner, shorter trail
      trailPoints.current = pts.filter(p => p.age < 12);

      const alive = trailPoints.current;
      if (alive.length < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // Thinner lines
      for (let i = 1; i < alive.length; i++) {
        const t = i / alive.length;
        const op = t * (1 - alive[i].age / 12);
        
        // Skip some points for thinner appearance
        if (i % 2 === 0) continue;

        ctx.beginPath();
        ctx.moveTo(alive[i-1].x, alive[i-1].y);
        ctx.lineTo(alive[i].x, alive[i].y);

        const isGlitch = glitchIntensity.current > 0.3;
        const color = isGlitch ? CONFIG.glitchColor : CONFIG.neonColor;
        
        ctx.strokeStyle = `rgba(${color},${op * 0.6})`;
        ctx.lineWidth = t * 1.5; // Thinner: max 1.5px
        ctx.lineCap = "round";
        ctx.shadowBlur = 4; // Reduced glow
        ctx.shadowColor = `rgba(${color},${op})`;
        
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

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.5,
      vy: -0.1 - Math.random() * 0.2,
      vx: (Math.random() - 0.5) * 0.2
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p, i) => {
        p.y += p.vy;
        p.x += p.vx;
        
        if (p.y < 0) {
          p.y = h;
          p.x = Math.random() * w;
        }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CONFIG.neonColor},${0.2 + Math.sin(Date.now()*0.001 + i)*0.1})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${CONFIG.neonColor},${0.05 * (1 - dist/80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
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
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 99999;
          mix-blend-mode: difference;
        }
        
        .cursor-inner {
          width: 6px;
          height: 6px;
          background: rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, opacity 0.2s;
          box-shadow: 0 0 8px rgb(${CONFIG.neonColor});
          opacity: 0; /* Start hidden */
        }
        
        .cursor-inner.hovering {
          width: 4px;
          height: 4px;
          opacity: 0.5;
        }
        
        .cursor-outer {
          width: 32px;
          height: 32px;
          border: 1.5px solid rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s, border-color 0.3s, opacity 0.2s;
          box-shadow: 0 0 10px rgba(${CONFIG.neonColor}, 0.2);
          opacity: 0; /* Start hidden */
        }
        
        .cursor-outer.hovering {
          width: 48px;
          height: 48px;
          border-color: rgba(${CONFIG.neonColor}, 0.6);
          background: rgba(${CONFIG.neonColor}, 0.03);
        }
        
        #game-cursor.clicking .cursor-inner {
          transform: translate(-50%, -50%) scale(0.8);
        }
        
        #game-cursor.clicking .cursor-outer {
          transform: translate(-50%, -50%) scale(0.9);
          border-color: rgb(${CONFIG.glitchColor});
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.3 }} />
      <canvas ref={trailCanvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2, mixBlendMode: "screen" }} />

      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position: "fixed", left: 0, top: 0 }} />
        <div ref={innerRef} className="cursor-inner" style={{ position: "fixed", left: 0, top: 0 }} />
      </div>
    </>
  );
}