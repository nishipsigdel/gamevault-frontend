import { useEffect, useRef, useCallback } from "react";

export default function GameCursor() {
  const cursorRef = useRef(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailCanvasRef = useRef(null);
  
  const mouse = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0 });
  const outerPos = useRef({ x: 0, y: 0 });
  const trailPoints = useRef([]);
  const rafId = useRef(null);
  const isHovering = useRef(false);
  const glitchIntensity = useRef(0);

  // Configuration
  const CONFIG = {
    trailLength: 40,
    baseSpeed: 0.15,
    fastSpeed: 0.08,
    neonColor: "0,245,255",
    glitchColor: "255,0,128",
    magneticStrength: 0.3,
    maxVelocity: 50
  };

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouch) return;

    const stopBg = startBgCanvas();
    const stopTrail = startTrailCanvas();
    
    // Initialize position to center
    outerPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2, prevX: 0, prevY: 0, vx: 0, vy: 0 };

    const updatePosition = (x, y) => {
      mouse.current.prevX = mouse.current.x;
      mouse.current.prevY = mouse.current.y;
      mouse.current.x = x;
      mouse.current.y = y;
      
      // Calculate velocity
      mouse.current.vx = mouse.current.x - mouse.current.prevX;
      mouse.current.vy = mouse.current.y - mouse.current.prevY;
      
      const speed = Math.sqrt(mouse.current.vx ** 2 + mouse.current.vy ** 2);
      
      // Add trail points with velocity data
      trailPoints.current.push({ 
        x, 
        y, 
        age: 0, 
        vx: mouse.current.vx * 0.5, 
        vy: mouse.current.vy * 0.5,
        speed 
      });
      
      // Dynamic trail length based on speed
      const dynamicLength = Math.min(CONFIG.trailLength + speed * 2, 80);
      if (trailPoints.current.length > dynamicLength) {
        trailPoints.current.shift();
      }

      // Glitch mode on high speed
      if (speed > 30) {
        glitchIntensity.current = Math.min(glitchIntensity.current + 0.2, 1);
        if (Math.random() > 0.7) spawnGlitchSparks(x, y, speed);
      } else {
        glitchIntensity.current *= 0.95;
      }

      // Regular sparks based on speed
      if (speed > 5 && Math.random() > 0.8) {
        spawnSparks(x, y, Math.min(speed / 10, 3));
      }
    };

    const onMouseMove = (e) => updatePosition(e.clientX, e.clientY);
    
    const onDown = () => {
      cursorRef.current?.classList.add("clicking");
      spawnClickBurst(mouse.current.x, mouse.current.y);
      // Screen shake effect
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

    // Run once then observe DOM changes
    detectInteractiveElements();
    const observer = new MutationObserver(detectInteractiveElements);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    // Main animation loop with spring physics
    const loop = () => {
      const targetSpeed = isHovering.current ? CONFIG.fastSpeed : CONFIG.baseSpeed;
      
      // Spring physics for outer cursor
      const dx = mouse.current.x - outerPos.current.x;
      const dy = mouse.current.y - outerPos.current.y;
      
      outerPos.current.x += dx * targetSpeed;
      outerPos.current.y += dy * targetSpeed;

      // Calculate rotation based on movement
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const velocity = Math.sqrt(dx*dx + dy*dy);
      const tilt = Math.min(velocity * 0.5, 15); // Max 15deg tilt

      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) rotate(${angle}deg)`;
      }

      if (outerRef.current) {
        // Add scale breathing effect when idle
        const time = Date.now() * 0.003;
        const breathe = isHovering.current ? 1.2 : 1 + Math.sin(time) * 0.05;
        const scale = breathe + (glitchIntensity.current * 0.2);
        
        outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) rotate(${angle}deg) scale(${scale})`;
        
        // RGB split effect on high speed
        if (glitchIntensity.current > 0.3) {
          outerRef.current.style.filter = `
            drop-shadow(${glitchIntensity.current * 3}px 0 0 rgba(255,0,0,0.5))
            drop-shadow(-${glitchIntensity.current * 3}px 0 0 rgba(0,255,255,0.5))
          `;
        } else {
          outerRef.current.style.filter = 'none';
        }
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
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Enhanced sparks with physics
  function spawnSparks(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 3 + 1;
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
        box-shadow:0 0 ${size * 3}px rgb(${color}), 0 0 ${size * 6}px rgb(${color});
        transform:translate(-50%,-50%);
        mix-blend-mode: screen;
      `;

      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40 + 20;
      const duration = Math.random() * 400 + 300;

      // Physics-based animation
      const keyframes = [];
      const steps = 10;
      let currentX = 0;
      let currentY = 0;
      let vx = Math.cos(angle) * (dist / 10);
      let vy = Math.sin(angle) * (dist / 10);
      
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        vy += 0.5; // Gravity
        vx *= 0.95; // Friction
        vy *= 0.95;
        currentX += vx;
        currentY += vy;
        
        keyframes.push({
          transform: `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${1 - t})`,
          opacity: 1 - t
        });
      }

      el.animate(keyframes, { duration, easing: "linear" }).onfinish = () => el.remove();
    }
  }

  // Glitch variant sparks
  function spawnGlitchSparks(x, y, intensity) {
    const count = Math.min(Math.floor(intensity / 5), 5);
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed; left:${x}px; top:${y}px;
        width:2px; height:15px;
        background:rgb(${CONFIG.glitchColor});
        pointer-events:none; z-index:99996;
        mix-blend-mode: exclusion;
      `;
      document.body.appendChild(el);
      
      const angle = Math.random() * Math.PI * 2;
      el.animate([
        { transform: `translate(-50%,-50%) rotate(${angle}rad) translateX(0)`, opacity: 1 },
        { transform: `translate(-50%,-50%) rotate(${angle}rad) translateX(${Math.random()*50+20}px)`, opacity: 0 }
      ], { duration: 200, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  // Enhanced click burst with shockwave
  function spawnClickBurst(x, y) {
    // Shockwave ring
    const shockwave = document.createElement("div");
    shockwave.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      width: 10px; height: 10px;
      border: 3px solid rgb(${CONFIG.neonColor});
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none; z-index: 99998;
      box-shadow: 0 0 20px rgb(${CONFIG.neonColor}), inset 0 0 20px rgb(${CONFIG.neonColor});
    `;
    document.body.appendChild(shockwave);
    
    shockwave.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1, borderWidth: "3px" },
      { transform: "translate(-50%,-50%) scale(8)", opacity: 0, borderWidth: "0px" }
    ], { duration: 600, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }).onfinish = () => shockwave.remove();

    // Particle explosion
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnSparks(x, y, 2), i * 30);
    }
  }

  // Bezier curve trail with glow
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
      // Fade effect for trail persistence
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, w, h);

      const pts = trailPoints.current;
      pts.forEach(p => p.age++);

      // Dynamic aging based on speed
      trailPoints.current = pts.filter(p => p.age < 25 + (p.speed || 0));

      const alive = trailPoints.current;
      if (alive.length < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // Draw bezier curve through points
      ctx.beginPath();
      ctx.moveTo(alive[0].x, alive[0].y);

      for (let i = 1; i < alive.length - 1; i++) {
        const xc = (alive[i].x + alive[i + 1].x) / 2;
        const yc = (alive[i].y + alive[i + 1].y) / 2;
        ctx.quadraticCurveTo(alive[i].x, alive[i].y, xc, yc);
      }

      // Gradient stroke
      const gradient = ctx.createLinearGradient(
        alive[0].x, alive[0].y, 
        alive[alive.length - 1].x, alive[alive.length - 1].y
      );
      
      const isGlitch = glitchIntensity.current > 0.3;
      const color = isGlitch ? CONFIG.glitchColor : CONFIG.neonColor;
      
      gradient.addColorStop(0, `rgba(${color},0)`);
      gradient.addColorStop(0.5, `rgba(${color},${0.3 + glitchIntensity.current * 0.4})`);
      gradient.addColorStop(1, `rgba(${color},0.8)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + (alive[alive.length - 1]?.speed || 0) * 0.1;
      ctx.lineCap = "round";
      ctx.shadowBlur = 15 + glitchIntensity.current * 20;
      ctx.shadowColor = `rgb(${color})`;
      
      ctx.stroke();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }

  // Enhanced background with connections
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

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      vy: -0.1 - Math.random() * 0.2,
      vx: (Math.random() - 0.5) * 0.2
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Update and draw particles
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
        ctx.fillStyle = `rgba(${CONFIG.neonColor},${0.3 + Math.sin(Date.now()*0.001 + i)*0.2})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${CONFIG.neonColor},${0.1 * (1 - dist/100)})`;
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
          width: 8px;
          height: 8px;
          background: rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s;
          box-shadow: 0 0 10px rgb(${CONFIG.neonColor}), 0 0 20px rgb(${CONFIG.neonColor});
        }
        
        .cursor-inner.hovering {
          width: 4px;
          height: 4px;
          opacity: 0.5;
        }
        
        .cursor-outer {
          width: 40px;
          height: 40px;
          border: 2px solid rgb(${CONFIG.neonColor});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s, border-color 0.3s;
          box-shadow: 0 0 15px rgba(${CONFIG.neonColor}, 0.3), inset 0 0 15px rgba(${CONFIG.neonColor}, 0.1);
        }
        
        .cursor-outer.hovering {
          width: 60px;
          height: 60px;
          border-color: rgba(${CONFIG.neonColor}, 0.5);
          background: rgba(${CONFIG.neonColor}, 0.05);
        }
        
        .cursor-outer::before,
        .cursor-outer::after {
          content: '';
          position: absolute;
          border: 1px solid rgba(${CONFIG.neonColor}, 0.3);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
        }
        
        .cursor-outer::after {
          width: 60px;
          height: 60px;
          animation-delay: 0.5s;
        }
        
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        
        #game-cursor.clicking .cursor-inner {
          transform: translate(-50%, -50%) scale(0.8);
        }
        
        #game-cursor.clicking .cursor-outer {
          transform: translate(-50%, -50%) scale(0.9);
          border-color: rgb(${CONFIG.glitchColor});
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />
      <canvas ref={trailCanvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2, mixBlendMode: "screen" }} />

      <div id="game-cursor" ref={cursorRef}>
        <div ref={outerRef} className="cursor-outer" style={{ position: "fixed", left: 0, top: 0 }} />
        <div ref={innerRef} className="cursor-inner" style={{ position: "fixed", left: 0, top: 0 }} />
      </div>
    </>
  );
}