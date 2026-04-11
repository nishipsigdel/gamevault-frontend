import { useEffect, useRef } from "react";

export default function GameCursor() {
  const cursorRef = useRef(null);
  const outerRef  = useRef(null);
  const innerRef  = useRef(null);
  const canvasRef = useRef(null);
  const mouse     = useRef({ x: 0, y: 0 });
  const outer     = useRef({ x: 0, y: 0 });
  const trailTimeout = useRef(null);

  useEffect(() => {
    // ── Detect touch device ──
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouch) return; // don't show custom cursor on phones/tablets

    const cursor = cursorRef.current;
    if (!cursor) return;
    cursor.style.display = "block";

    // ── Mouse move ──
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // Spawn trail particle
      clearTimeout(trailTimeout.current);
      spawnTrail(e.clientX, e.clientY);
    };

    // ── Hover detection ──
    const onEnter = () => cursor.classList.add("hovering");
    const onLeave = () => cursor.classList.remove("hovering");

    // ── Click effect ──
    const onDown = () => { cursor.classList.add("clicking"); spawnClickBurst(mouse.current.x, mouse.current.y); };
    const onUp   = () => cursor.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    // Add hover class to all interactive elements
    const interactives = document.querySelectorAll("a,button,input,select,textarea,[role='button']");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // ── Smooth cursor animation loop ──
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

    // ── Background particle canvas ──
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext("2d");
    let   width   = canvas.width  = window.innerWidth;
    let   height  = canvas.height = window.innerHeight;

    const onResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Particle system
    const particles = [];
    const PARTICLE_COUNT = 80;

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x    = Math.random() * width;
        this.y    = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4 - 0.1;
        this.opacity  = Math.random() * 0.6 + 0.1;
        this.color    = Math.random() > 0.5 ? "0,245,255" : "160,48,240";
        this.twinkle  = Math.random() * Math.PI * 2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.twinkle += this.twinkleSpeed;
        this.opacity = (Math.sin(this.twinkle) * 0.3 + 0.4);
        if (this.y < -5 || this.x < -5 || this.x > width + 5) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = `rgba(${this.color},0.8)`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    // Shooting stars
    const stars = [];
    class ShootingStar {
      constructor() { this.reset(); }
      reset() {
        this.x      = Math.random() * width;
        this.y      = Math.random() * height * 0.5;
        this.len    = Math.random() * 80 + 40;
        this.speed  = Math.random() * 4 + 2;
        this.angle  = Math.PI / 4;
        this.opacity = 1;
        this.active = false;
        this.timer  = Math.random() * 300;
      }
      update() {
        if (this.timer > 0) { this.timer--; return; }
        this.active = true;
        this.x     += Math.cos(this.angle) * this.speed;
        this.y     += Math.sin(this.angle) * this.speed;
        this.opacity -= 0.02;
        if (this.opacity <= 0) this.reset();
      }
      draw() {
        if (!this.active) return;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(this.angle) * this.len, this.y - Math.sin(this.angle) * this.len);
        const grad = ctx.createLinearGradient(
          this.x, this.y,
          this.x - Math.cos(this.angle) * this.len,
          this.y - Math.sin(this.angle) * this.len
        );
        grad.addColorStop(0, `rgba(0,245,255,${this.opacity})`);
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = "rgba(0,245,255,0.8)";
        ctx.stroke();
      }
    }

    for (let i = 0; i < 4; i++) stars.push(new ShootingStar());

    // Canvas animation loop
    let canvasRaf;
    const drawCanvas = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.shadowBlur = 0;
      particles.forEach((p) => { p.update(); p.draw(); });
      stars.forEach((s)    => { s.update(); s.draw(); });
      canvasRaf = requestAnimationFrame(drawCanvas);
    };
    canvasRaf = requestAnimationFrame(drawCanvas);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(canvasRaf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Spawn a trail particle
  function spawnTrail(x, y) {
    const el = document.createElement("div");
    el.className = "cursor-trail";
    el.style.left = x + "px";
    el.style.top  = y + "px";
    el.style.width  = Math.random() * 4 + 2 + "px";
    el.style.height = el.style.width;
    el.style.background = Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  // Burst particles on click
  function spawnClickBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const el    = document.createElement("div");
      el.className = "cursor-trail";
      el.style.left     = x + "px";
      el.style.top      = y + "px";
      el.style.background = Math.random() > 0.5 ? "var(--neon)" : "var(--plasma)";
      el.style.width    = "4px";
      el.style.height   = "4px";
      document.body.appendChild(el);

      const angle = (i / 8) * Math.PI * 2;
      const dist  = Math.random() * 30 + 10;
      el.animate([
        { transform: `translate(-50%,-50%) translate(0,0)`, opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`, opacity: 0 },
      ], { duration: 400, easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  return (
    <>
      {/* Background particle canvas */}
      <canvas
        ref={canvasRef}
        id="bg-canvas"
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.45 }}
      />

      {/* Custom cursor — hidden on touch devices via CSS */}
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
