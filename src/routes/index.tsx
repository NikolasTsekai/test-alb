import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import storyMountains from "@/assets/story-mountains.jpg";
import { useCart } from "@/context/CartContext";
import { products, fmtPrice } from "@/lib/store";
import type { Product, Variant, CartItem } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});


const testimonials = [
  {
    quote:
      "Mjalti është thjesht i jashtëzakonshëm. Shija është e thellë dhe autentike — nuk e kam provuar kurrë diçka të tillë. Porosi të shpejtë, dorëzim të nesërmen.",
    name: "Elira M.",
    city: "Tiranë",
  },
  {
    quote:
      "Arrat janë të freskëta dhe plot shije. Është e vështirë të gjesh produkte kaq cilësore. Do t'i porosis përsëri — dhe pagesa me cash ishte shumë e lehtë.",
    name: "Arben K.",
    city: "Shkodër",
  },
  {
    quote:
      "Dërgesa ishte e shpejtë dhe paketa shumë elegante. Bajames i dha një tjetër dimension kuzhinës sime. Rekomandoj me zemër të plotë.",
    name: "Teuta P.",
    city: "Durrës",
  },
];

// ── Canvas Hero ───────────────────────────────────────────────────────────────

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const blobs = [
      { cx: 0.15, cy: 0.55, ax: 0.28, ay: 0.18, fx: 0.22, fy: 0.31, px: 0.0, py: 1.3, r: 0.46, a: 0.14 },
      { cx: 0.82, cy: 0.35, ax: 0.20, ay: 0.28, fx: 0.18, fy: 0.19, px: 2.1, py: 0.4, r: 0.40, a: 0.11 },
      { cx: 0.50, cy: 0.82, ax: 0.30, ay: 0.22, fx: 0.14, fy: 0.24, px: 1.0, py: 3.1, r: 0.52, a: 0.09 },
      { cx: 0.08, cy: 0.18, ax: 0.18, ay: 0.27, fx: 0.28, fy: 0.21, px: 3.2, py: 1.6, r: 0.34, a: 0.10 },
      { cx: 0.92, cy: 0.88, ax: 0.14, ay: 0.20, fx: 0.20, fy: 0.27, px: 0.5, py: 2.5, r: 0.37, a: 0.12 },
      { cx: 0.60, cy: 0.25, ax: 0.22, ay: 0.16, fx: 0.25, fy: 0.35, px: 4.0, py: 0.8, r: 0.30, a: 0.08 },
    ];
    type Pt = { x: number; y: number; vy: number; size: number; a: number; drift: number };
    const pts: Pt[] = Array.from({ length: 65 }, () => ({
      x: Math.random(), y: Math.random(),
      vy: 0.00025 + Math.random() * 0.00055,
      size: 0.4 + Math.random() * 1.3,
      a: 0.15 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.00018,
    }));
    let raf: number;
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) * 0.001;
      ctx.fillStyle = "#0a0807";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const x = (b.cx + Math.sin(t * b.fx + b.px) * b.ax) * W;
        const y = (b.cy + Math.sin(t * b.fy + b.py) * b.ay) * H;
        const r = b.r * Math.min(W, H) * 0.52;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(197,131,43,${b.a})`);
        g.addColorStop(0.38, `rgba(155,85,12,${b.a * 0.48})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      for (const p of pts) {
        p.y -= p.vy; p.x += p.drift;
        if (p.y < -0.01) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < 0 || p.x > 1) p.drift *= -1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.a})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

// ── Pse Ne Section Canvas ─────────────────────────────────────────────────────

function PseNeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let scrollY = 0;

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Almond blossom
    const drawBlossom = (x: number, y: number, size: number, t: number, phase: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.006 + phase);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const wave = 1 + Math.sin(t * 0.38 + phase + i * 0.9) * 0.032;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -size * 0.52 * wave);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.21, size * 0.37, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(162, 155, 148, 0.10)";
        ctx.fill();
        ctx.strokeStyle = "rgba(142, 132, 122, 0.20)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, size * 0.30); ctx.lineTo(0, -size * 0.28);
        ctx.strokeStyle = "rgba(128, 118, 108, 0.12)";
        ctx.lineWidth = 0.35;
        ctx.stroke();
        ctx.restore();
      }
      // Centre disc
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(188, 172, 148, 0.26)";
      ctx.fill();
      // Stamens
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const sr = size * 0.23;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * size * 0.13, Math.sin(a) * size * 0.13);
        ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
        ctx.strokeStyle = "rgba(152, 132, 108, 0.20)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(Math.cos(a) * sr, Math.sin(a) * sr, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(182, 152, 105, 0.26)";
        ctx.fill();
      }
      ctx.restore();
    };

    // ── Honey bee
    const drawBee = (x: number, y: number, size: number, t: number, phase: number) => {
      const dx = Math.cos(t * 0.5 + phase + 0.02) - Math.cos(t * 0.5 + phase);
      const dy = Math.sin(t * 0.38 + phase + 0.02) - Math.sin(t * 0.38 + phase);
      const dir = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(dir);
      const flap = Math.sin(t * 14 + phase);
      // Wings
      for (const [sx, wr] of [[-1, -0.38], [1, 0.38]] as [number, number][]) {
        ctx.save();
        ctx.rotate(wr + flap * 0.18 * sx);
        ctx.beginPath();
        ctx.ellipse(sx * size * 0.32, -size * 0.52, size * 0.58, size * 0.26, wr * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(192, 187, 182, 0.14)";
        ctx.fill();
        ctx.strokeStyle = "rgba(150, 140, 130, 0.19)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.restore();
      }
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.28, size * 0.52, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(152, 142, 132, 0.46)";
      ctx.fill();
      ctx.strokeStyle = "rgba(98, 88, 78, 0.28)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Stripes
      for (let i = 0; i < 3; i++) {
        const sy = -size * 0.20 + i * size * 0.20;
        ctx.beginPath();
        ctx.moveTo(-size * 0.24, sy); ctx.lineTo(size * 0.24, sy);
        ctx.strokeStyle = "rgba(72, 62, 52, 0.18)";
        ctx.lineWidth = size * 0.13;
        ctx.stroke();
      }
      // Head
      ctx.beginPath();
      ctx.arc(0, -size * 0.58, size * 0.19, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(92, 82, 72, 0.52)";
      ctx.fill();
      // Antennae
      ctx.beginPath();
      ctx.moveTo(-size * 0.07, -size * 0.74);
      ctx.quadraticCurveTo(-size * 0.22, -size * 1.02, -size * 0.16, -size * 1.16);
      ctx.moveTo(size * 0.07, -size * 0.74);
      ctx.quadraticCurveTo(size * 0.22, -size * 1.02, size * 0.16, -size * 1.16);
      ctx.strokeStyle = "rgba(78, 68, 58, 0.32)";
      ctx.lineWidth = 0.45;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    };

    // ── Aerial grove grid
    const drawGrove = (scrollOff: number) => {
      const pOff = scrollOff * 0.04;
      const cols = 16, rows = 12;
      const cellW = W * 0.078;
      const cellH = H * 0.10;
      const ox = W * 0.5, oy = H * 0.5 + pOff;

      for (let r = 0; r <= rows; r++) {
        const fy = r / rows;
        const sp = 0.82 + fy * 0.32;
        const y = oy - (rows / 2) * cellH + r * cellH;
        ctx.beginPath();
        ctx.moveTo(ox - (cols / 2) * cellW * sp, y);
        ctx.lineTo(ox + (cols / 2) * cellW * sp, y);
        ctx.strokeStyle = `rgba(145, 138, 130, ${0.028 + fy * 0.018})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        let first = true;
        for (let r = 0; r <= rows; r++) {
          const fy = r / rows;
          const sp = 0.82 + fy * 0.32;
          const y = oy - (rows / 2) * cellH + r * cellH;
          const x = ox + (c - cols / 2) * cellW * sp;
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(142, 135, 127, 0.035)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      // Tree canopies at intersections
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const fy = (r + 0.5) / rows;
          const sp = 0.82 + fy * 0.32;
          const x = ox + (c + 0.5 - cols / 2) * cellW * sp;
          const y = oy - (rows / 2) * cellH + (r + 0.5) * cellH;
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
          const tr = cellW * sp * 0.20;
          ctx.beginPath();
          ctx.arc(x, y, tr, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(145, 138, 130, 0.048)";
          ctx.fill();
          ctx.strokeStyle = "rgba(132, 124, 115, 0.09)";
          ctx.lineWidth = 0.35;
          ctx.stroke();
          // Inner shadow
          ctx.beginPath();
          ctx.arc(x + tr * 0.16, y + tr * 0.16, tr * 0.50, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(112, 104, 96, 0.062)";
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
    };

    // ── Tiny beekeeper
    const drawBeekeeper = (t: number, scrollOff: number) => {
      const x = W * 0.66;
      const y = H * 0.48 + scrollOff * 0.032;
      const s = 10;
      const walk = Math.sin(t * 0.10) * 2.2;
      ctx.save();
      ctx.translate(x, y);
      // Suit
      ctx.beginPath();
      ctx.roundRect(-s * 0.36, -s * 0.68, s * 0.72, s * 0.92, 2);
      ctx.fillStyle = "rgba(226, 220, 214, 0.70)";
      ctx.fill();
      ctx.strokeStyle = "rgba(135, 125, 115, 0.30)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 0.92, s * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(218, 212, 206, 0.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(128, 118, 108, 0.30)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Brim
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.60, s * 0.50, s * 0.10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(172, 162, 152, 0.48)";
      ctx.fill();
      // Arms
      ctx.lineCap = "round";
      ctx.lineWidth = s * 0.16;
      ctx.strokeStyle = "rgba(208, 202, 196, 0.82)";
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, -s * 0.40); ctx.lineTo(-s * 0.70, -s * 0.04 + walk * 0.26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.36, -s * 0.40); ctx.lineTo(s * 0.70, -s * 0.04 - walk * 0.26);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(-s * 0.17, s * 0.24); ctx.lineTo(-s * 0.21, s * 0.75 + walk);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.17, s * 0.24); ctx.lineTo(s * 0.21, s * 0.75 - walk);
      ctx.stroke();
      ctx.restore();
    };

    const blossoms = [
      { x: 0.04, y: 0.10, size: 34, phase: 0.0 },
      { x: 0.13, y: 0.05, size: 24, phase: 1.3 },
      { x: 0.08, y: 0.20, size: 20, phase: 2.6 },
      { x: 0.87, y: 0.07, size: 30, phase: 0.7 },
      { x: 0.94, y: 0.18, size: 22, phase: 2.0 },
      { x: 0.81, y: 0.12, size: 18, phase: 3.3 },
      { x: 0.04, y: 0.82, size: 28, phase: 1.5 },
      { x: 0.11, y: 0.91, size: 22, phase: 0.3 },
      { x: 0.91, y: 0.86, size: 32, phase: 2.7 },
      { x: 0.97, y: 0.74, size: 20, phase: 1.1 },
      { x: 0.84, y: 0.94, size: 18, phase: 3.7 },
    ];

    const beeOrbs = [
      { cx: 0.09, cy: 0.11, rx: 0.055, ry: 0.038, spd: 0.14, phase: 0.0, sz: 1.00 },
      { cx: 0.89, cy: 0.10, rx: 0.050, ry: 0.048, spd: 0.11, phase: 2.0, sz: 0.88 },
      { cx: 0.06, cy: 0.86, rx: 0.048, ry: 0.036, spd: 0.17, phase: 4.1, sz: 0.92 },
      { cx: 0.92, cy: 0.84, rx: 0.055, ry: 0.046, spd: 0.12, phase: 1.4, sz: 1.04 },
    ];

    let raf: number;
    const t0 = performance.now();

    const draw = (now: number) => {
      const t = (now - t0) * 0.001;
      ctx.clearRect(0, 0, W, H);
      // Grove (parallax)
      drawGrove(scrollY);
      // Beekeeper
      drawBeekeeper(t, scrollY);
      // Blossoms
      for (const b of blossoms) drawBlossom(b.x * W, b.y * H, b.size, t, b.phase);
      // Bees
      for (const b of beeOrbs) {
        const bx = (b.cx + Math.cos(t * b.spd + b.phase) * b.rx) * W;
        const by = (b.cy + Math.sin(t * b.spd * 0.72 + b.phase) * b.ry) * H;
        drawBee(bx, by, 9 * b.sz, t, b.phase);
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

// ── 3D Tilt Card ──────────────────────────────────────────────────────────────

function TiltCard({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const el = ref.current; if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      el.style.transition = "transform 0.06s ease-out";
      el.style.transform = `perspective(900px) rotateX(${(ny - 0.5) * -18}deg) rotateY(${(nx - 0.5) * 18}deg) scale3d(1.04,1.04,1.04)`;
      const s = el.querySelector<HTMLDivElement>(".card-shine");
      if (s) { s.style.opacity = "1"; s.style.background = `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(212,175,55,0.22) 0%, transparent 60%)`; }
    });
  }, [canHover]);
  const onLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = ref.current; if (!el) return;
    el.style.transition = "transform 0.65s cubic-bezier(0.16,1,0.3,1)";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    const s = el.querySelector<HTMLDivElement>(".card-shine");
    if (s) { s.style.opacity = "0"; s.style.background = "transparent"; }
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={`relative ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}>
      {children}
      <div className="card-shine absolute inset-0 pointer-events-none" style={{ opacity: 0, transition: "opacity 0.3s ease-out", zIndex: 20 }} />
    </div>
  );
}

// ── Floating Orbs ─────────────────────────────────────────────────────────────

function FloatingOrbs() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const h = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY)); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div className="orb orb-1" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
      <div className="orb orb-2" style={{ transform: `translateY(${-scrollY * 0.12}px)` }} />
      <div className="orb orb-3" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
      <div className="orb orb-4" style={{ transform: `translateY(${-scrollY * 0.06}px)` }} />
      <div className="orb orb-5" style={{ transform: `translateY(${scrollY * 0.10}px)` }} />
    </div>
  );
}

// ── WhatsApp Button ───────────────────────────────────────────────────────────

function WhatsAppButton() {
  return (
    <a href="https://wa.me/355000000000" target="_blank" rel="noopener noreferrer"
      aria-label="Kontaktoni përmes WhatsApp"
      className="fixed bottom-6 right-6 z-[45] size-14 bg-[#25D366] flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300"
      style={{ boxShadow: "0 4px 24px rgba(37,211,102,0.4)" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center py-5 text-left group" aria-expanded={open}>
        <span className="text-[11px] uppercase tracking-[0.22em] font-medium group-hover:text-honey transition-colors duration-200">{title}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
          className={`text-muted-foreground flex-shrink-0 transition-transform duration-350 ${open ? "rotate-180" : ""}`}>
          <path d="M1 4l5 5 5-5" />
        </svg>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ overflow: "hidden" }}>
          <div className="pb-7 pr-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(true);
  const switchImage = (i: number) => {
    if (i === active) return;
    setFade(false);
    setTimeout(() => { setActive(i); setFade(true); }, 200);
  };
  return (
    <div className="h-full flex flex-col bg-[#0f0e0c]">
      <div className="flex-1 overflow-hidden relative">
        <img src={images[active]} alt={alt} className="w-full h-full object-cover"
          style={{ opacity: fade ? 1 : 0, transition: "opacity 0.25s ease" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 p-3 bg-[#0f0e0c]">
          {images.map((img, i) => (
            <button key={i} onClick={() => switchImage(i)}
              className="relative overflow-hidden flex-shrink-0 transition-all duration-300"
              style={{ width: 56, height: 56, outline: i === active ? "1.5px solid #C5832B" : "1.5px solid transparent", outlineOffset: 2, opacity: i === active ? 1 : 0.5 }}
              aria-label={`Foto ${i + 1}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({ items, open, onClose, onRemove, onUpdateQty, onCheckout, total }: {
  items: CartItem[];
  open: boolean;
  onClose: () => void;
  onRemove: (productId: string, variantWeight: string) => void;
  onUpdateQty: (productId: string, variantWeight: string, delta: number) => void;
  onCheckout: () => void;
  total: number;
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-ink/60 backdrop-blur-sm"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.4s ease" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Shporta"
        aria-modal="true"
        className="fixed right-0 top-0 bottom-0 z-[60] w-full sm:max-w-[430px] bg-canvas flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "-8px 0 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-honey mb-0.5">Shporta</p>
            <h2 className="font-display text-xl">
              {items.length === 0 ? "Bosh" : `${items.reduce((s, i) => s + i.quantity, 0)} artikuj`}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Mbyll shportën"
            className="size-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-16">
              {/* Empty bag illustration */}
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="text-border">
                <path d="M10 18l4-6h24l4 6" />
                <rect x="6" y="18" width="40" height="28" rx="2" />
                <path d="M19 26a7 7 0 0014 0" />
              </svg>
              <div>
                <p className="text-[12px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Shporta është bosh</p>
                <p className="text-[11px] text-muted-foreground/60">Shto produkte për të vazhduar</p>
              </div>
              <button onClick={onClose}
                className="text-[10px] uppercase tracking-[0.25em] text-honey hover:text-honey-dark transition-colors border-b border-honey/40 pb-0.5">
                Kthehu në Koleksion →
              </button>
            </div>
          ) : (
            <ul className="space-y-0 divide-y divide-border">
              {items.map((item) => {
                const key = `${item.product.id}-${item.variant.weight}`;
                return (
                  <li key={key} className="py-5 flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-[72px] h-[88px] flex-shrink-0 bg-muted overflow-hidden">
                      <img src={item.product.images[0]} alt={item.product.alt}
                        className="w-full h-full object-cover" loading="lazy" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-snug truncate">{item.product.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{item.variant.weight}</p>
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => onRemove(item.product.id, item.variant.weight)}
                          aria-label={`Hiq ${item.product.name}`}
                          className="flex-shrink-0 size-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                            <path d="M1 1l11 11M12 1L1 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty stepper */}
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => onUpdateQty(item.product.id, item.variant.weight, -1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Ul sasinë">
                            <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M1 1h8" />
                            </svg>
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-[12px] font-mono border-x border-border select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQty(item.product.id, item.variant.weight, 1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Rrit sasinë">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M5 1v8M1 5h8" />
                            </svg>
                          </button>
                        </div>
                        {/* Line total */}
                        <span className="font-mono text-[13px] text-foreground">
                          {fmtPrice(item.variant.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Drawer footer: subtotal + checkout */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-border px-6 pt-5 pb-7 space-y-4">
            {/* COD notice */}
            <div className="flex items-center gap-2.5 bg-honey/8 border border-honey/25 px-3.5 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey flex-shrink-0">
                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M14 12h4M6 12h.01" />
              </svg>
              <p className="text-[10px] text-honey uppercase tracking-[0.15em] font-medium">
                Pa parapagim · Cash me dorëzim
              </p>
            </div>

            {/* Subtotal row */}
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nëntotali</span>
              <span className="font-mono text-xl tracking-tight">{fmtPrice(total)}</span>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={onCheckout}
              className="w-full py-4 text-white text-[11px] uppercase tracking-[0.35em] font-medium inline-flex items-center justify-center gap-3 group transition-opacity hover:opacity-88"
              style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)", boxShadow: "0 4px 28px rgba(197,131,43,0.32)" }}
            >
              <span>Finalizo · Paguaj me Dorëzim</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Checkout Page ─────────────────────────────────────────────────────────────

function CheckoutPage({ items, total, onBack, onSuccess }: {
  items: CartItem[];
  total: number;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    onSuccess();
  };

  const inputCls =
    "w-full border-0 border-b border-border bg-transparent px-0 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-honey transition-colors duration-200 rounded-none";
  const labelCls =
    "block text-[9px] uppercase tracking-[0.3em] text-honey font-medium mb-1.5";

  const summaryContent = (
    <div>
      <div className="flex items-center gap-3 bg-honey/10 border border-honey/30 px-4 py-3 mb-7">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey flex-shrink-0">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M14 12h4M6 12h.01" />
        </svg>
        <p className="text-[10px] text-honey uppercase tracking-[0.15em] font-medium">Pa parapagim · Cash me dorëzim</p>
      </div>
      <ul className="space-y-5 mb-8">
        {items.map(item => (
          <li key={`${item.product.id}-${item.variant.weight}`} className="flex gap-4">
            <div className="w-16 h-20 flex-shrink-0 bg-muted overflow-hidden">
              <img src={item.product.images[0]} alt={item.product.alt} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium leading-snug">{item.product.name}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                {item.variant.weight} × {item.quantity}
              </p>
              <p className="font-mono text-[13px] mt-2">{fmtPrice(item.variant.price * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-5 space-y-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Nëntotali</span>
          <span className="font-mono text-[13px]">{fmtPrice(total)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dërgimi</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-honey">Falas</span>
        </div>
        <div className="flex justify-between items-baseline pt-4 border-t border-border">
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium">Totali</span>
          <span className="font-mono text-xl"
            style={{ background: "linear-gradient(135deg, #C5832B, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {fmtPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-canvas/96 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-center">
            <span className="font-display text-xl italic tracking-tight">Mjaltë &amp; Arra</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-sm animate-reveal">
            <div className="size-16 rounded-full border border-honey/60 flex items-center justify-center mx-auto mb-8">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey">
                <path d="M23 7L11 19l-6-6" />
              </svg>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey mb-4">Konfirmim</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">Porosia u pranua!</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-10 max-w-[30ch] mx-auto">
              Do t'ju kontaktojmë brenda pak orësh. Pagesa bëhet me cash kur produkti arrin te dera juaj.
            </p>
            <button onClick={onBack}
              className="px-10 py-3.5 text-white text-[10px] uppercase tracking-[0.25em] hover:opacity-88 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)" }}>
              Kthehu në Dyqan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col animate-reveal" style={{ animationDuration: "0.5s" }}>
      {/* Simplified checkout header */}
      <header className="sticky top-0 z-50 bg-canvas/96 backdrop-blur-md border-b border-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] flex items-center justify-between">
          <button onClick={onBack}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-honey transition-colors group">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-x-1">
              <path d="M10 3L5 8l5 5" />
            </svg>
            <span className="hidden sm:inline">Kthehu</span>
          </button>
          <span className="font-display text-xl italic tracking-tight">Mjaltë &amp; Arra</span>
          <div className="w-16 sm:w-24" />
        </div>
      </header>

      {/* Mobile: collapsible order summary */}
      <div className="md:hidden border-b border-border" style={{ background: "oklch(0.975 0.009 75)" }}>
        <button type="button" onClick={() => setSummaryOpen(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="text-[11px] uppercase tracking-[0.2em] text-honey font-medium">
              {summaryOpen ? "Mbyll rezymën" : "Shfaq rezymën"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] font-medium">{fmtPrice(total)}</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
              className={`text-muted-foreground transition-transform duration-300 ${summaryOpen ? "rotate-180" : ""}`}>
              <path d="M1 4l5 5 5-5" />
            </svg>
          </div>
        </button>
        <div style={{ display: "grid", gridTemplateRows: summaryOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ overflow: "hidden" }}>
            <div className="px-5 pb-6 pt-1">{summaryContent}</div>
          </div>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col md:flex-row flex-1">

        {/* LEFT 60%: Delivery form */}
        <div className="flex-1 md:w-[60%] px-5 sm:px-8 md:px-12 lg:px-20 py-10 md:py-16">
          <div className="max-w-lg">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey mb-3">Finalizim</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-1.5">Detajet e Dorëzimit</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-10">
              Pa parapagim · Cash me dorëzim
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className={labelCls}>Emri i plotë</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="p.sh. Arben Hoxha" className={inputCls} autoComplete="name" />
              </div>
              <div>
                <label className={labelCls}>Numri i Telefonit</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  placeholder="p.sh. 069 123 4567" className={inputCls} autoComplete="tel" />
              </div>
              <div>
                <label className={labelCls}>Adresa e Dorëzimit</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                  placeholder="Rruga, numri i shtëpisë" className={inputCls} autoComplete="street-address" />
              </div>
              <div>
                <label className={labelCls}>Qyteti</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} required
                  placeholder="p.sh. Tiranë, Shkodër..." className={inputCls} autoComplete="address-level2" />
              </div>
              <div>
                <label className={labelCls}>Shënim (opsional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Ndonjë detaj shtesë për dorëzimin..." className={`${inputCls} resize-none`} />
              </div>

              <div className="pt-4">
                <button type="submit"
                  className="w-full py-5 text-white text-[11px] uppercase tracking-[0.35em] font-medium inline-flex items-center justify-center gap-3 group transition-opacity hover:opacity-88"
                  style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)", boxShadow: "0 6px 36px rgba(197,131,43,0.3)" }}>
                  <span>Konfirmo · Paguaj me Dorëzim</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <p className="text-center text-[10px] text-muted-foreground mt-5">
                  Do t'ju kontaktojmë brenda pak orësh për konfirmim.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT 40%: Order summary (desktop only) */}
        <div className="hidden md:block md:w-[40%] border-l border-border px-10 lg:px-14 py-16"
          style={{ background: "oklch(0.975 0.009 75)" }}>
          <div className="sticky top-[4.5rem] pt-4">
            <h2 className="font-display text-2xl mb-8">Rezymë e Porosisë</h2>
            {summaryContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bag Icon ──────────────────────────────────────────────────────────────────

function BagIcon({ count, onClick, lightMode }: {
  count: number; onClick: () => void; lightMode: boolean;
}) {
  const [ping, setPing] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setPing(true);
      const t = setTimeout(() => setPing(false), 500);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <button
      onClick={onClick}
      aria-label={`Shporta — ${count} artikuj`}
      className={`relative flex items-center gap-2 transition-colors hover:text-honey ${lightMode ? "text-white/80" : "text-foreground"}`}
    >
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className={ping ? "cart-ping" : ""}
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-honey text-white text-[9px] font-mono rounded-full flex items-center justify-center leading-none"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
      <span className={`hidden lg:inline text-[10px] uppercase tracking-[0.2em] font-medium ${lightMode ? "text-white/65" : "text-muted-foreground"}`}>
        Shporta
      </span>
    </button>
  );
}

// ── Shared Header ─────────────────────────────────────────────────────────────

function Header({ solid, menuOpen, setMenuOpen, cartCount, onCartOpen, pdpActive, onBack }: {
  solid: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  cartCount: number;
  onCartOpen: () => void;
  pdpActive: boolean;
  onBack: () => void;
}) {
  const lightText = !solid;
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      solid ? "bg-canvas/96 backdrop-blur-md border-b border-border text-foreground" : "bg-transparent border-b border-white/10 text-white"
    }`}>
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] sm:h-20 flex items-center justify-between gap-4">

        {/* Left */}
        {pdpActive ? (
          <button onClick={onBack}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] transition-colors hover:text-honey group ${lightText ? "text-white/70" : "text-muted-foreground"}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-x-1">
              <path d="M10 3L5 8l5 5" />
            </svg>
            <span className="hidden sm:inline">Koleksioni</span>
          </button>
        ) : (
          <a href="#" className="font-display text-xl sm:text-2xl tracking-tight italic">Mjaltë &amp; Arra</a>
        )}

        {/* Center: logo on PDP */}
        {pdpActive && (
          <a href="#" onClick={e => { e.preventDefault(); onBack(); }}
            className="font-display text-xl sm:text-2xl tracking-tight italic absolute left-1/2 -translate-x-1/2 hidden sm:block">
            Mjaltë &amp; Arra
          </a>
        )}

        {/* Right */}
        <div className="flex items-center gap-5 sm:gap-7">
          {!pdpActive && (
            <div className={`hidden md:flex items-center text-[11px] uppercase tracking-[0.2em] font-medium ${lightText ? "text-white/65" : "text-muted-foreground"}`}>
              <Link
                to="/products"
                className="hover:text-honey transition-colors pr-7"
                activeProps={{ className: "text-honey hover:text-honey transition-colors pr-7" }}
              >
                Produkte
              </Link>
              <span className={`w-px h-3.5 mr-7 flex-shrink-0 ${lightText ? "bg-white/20" : "bg-border"}`} />
              <a href="#why" className="hover:text-honey transition-colors pr-7">Pse Ne</a>
              <a href="#reviews" className="hover:text-honey transition-colors pr-7">Opinione</a>
              <a href="#faq" className="hover:text-honey transition-colors pr-7">Pyetje</a>
              <a href="#contact" className="hover:text-honey transition-colors">Kontakt</a>
            </div>
          )}

          {/* Cart icon */}
          <BagIcon count={cartCount} onClick={onCartOpen} lightMode={lightText} />

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"
            className="md:hidden size-9 flex flex-col items-center justify-center gap-1.5">
            {["", "", ""].map((_, i) => {
              const extra = i === 0 ? (menuOpen ? "rotate-45 translate-y-[5px]" : "") : i === 1 ? (menuOpen ? "opacity-0" : "") : (menuOpen ? "-rotate-45 -translate-y-[5px]" : "");
              return <span key={i} className={`block h-px w-6 transition-all duration-300 ${extra} ${solid ? "bg-foreground" : "bg-white"}`} />;
            })}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-ink border-t border-white/10 px-5 py-6 flex flex-col gap-5 text-[12px] uppercase tracking-[0.2em] text-white/70">
          {pdpActive ? (
            <button onClick={() => { setMenuOpen(false); onBack(); }} className="text-left hover:text-honey transition-colors">← Kthehu në Koleksion</button>
          ) : (
            <>
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="hover:text-honey transition-colors"
                activeProps={{ className: "text-honey hover:text-honey transition-colors" }}
              >
                Produkte Produktet
              </Link>
              <span className="w-full h-px bg-white/10" />
              <a href="#why" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Pse Ne</a>
              <a href="#reviews" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Opinione</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Pyetje</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Kontakt</a>
            </>
          )}
          <button onClick={() => { setMenuOpen(false); onCartOpen(); }}
            className="mt-2 py-3 text-white text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Shporta {cartCount > 0 ? `(${cartCount})` : ""}
          </button>
        </div>
      )}
    </header>
  );
}

// ── Product Detail Page ───────────────────────────────────────────────────────

function ProductDetailPage({ product, onBack, onAddToBag }: {
  product: Product;
  onBack: () => void;
  onAddToBag: (product: Product, variant: Variant) => void;
}) {
  const [activeVariant, setActiveVariant] = useState(Math.min(1, product.variants.length - 1));
  const [addedFeedback, setAddedFeedback] = useState(false);
  const variant = product.variants[activeVariant];

  const handleAddToBag = () => {
    onAddToBag(product, variant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <main className="pt-[4.5rem] sm:pt-20 animate-reveal" style={{ animationDuration: "0.6s" }}>
      {/* Mobile breadcrumb */}
      <div className="md:hidden px-5 py-4 border-b border-border flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-honey transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
          Koleksioni
        </button>
        <span className="text-border text-xs">·</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 truncate">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* ── Image gallery (sticky left) */}
        <div className="w-full md:w-[55%] aspect-[4/5] md:aspect-auto md:sticky md:top-20 md:self-start md:h-[calc(100vh-80px)]">
          <ImageGallery images={product.images} alt={product.alt} />
        </div>

        {/* ── Product info (scrollable right) */}
        <div className="w-full md:w-[45%] bg-background px-6 sm:px-10 md:px-12 lg:px-16 py-10 md:py-14 md:min-h-[calc(100vh-80px)]">

          {/* Desktop back */}
          <button onClick={onBack}
            className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-honey transition-colors mb-10 group">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-x-1">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Kthehu në Koleksion
          </button>

          <span className="font-mono text-[9px] uppercase tracking-[0.42em] text-honey block mb-4">{product.meta}</span>
          <h1 className="font-display text-[clamp(1.9rem,3.5vw,3rem)] leading-[1.08] mb-2">{product.name}</h1>
          <p className="text-muted-foreground text-[13px] font-light tracking-wide mb-8">{product.subtitle}</p>

          <div className="w-10 h-px mb-8" style={{ background: "linear-gradient(90deg, #C5832B, #D4AF37)" }} />
          <p className="text-[14px] leading-relaxed text-foreground/70 mb-10">{product.shortDesc}</p>

          {/* Variant selector */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Zgjidhni Gramaturën</p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v, i) => (
                <button key={v.weight} onClick={() => setActiveVariant(i)}
                  className={`px-5 py-2.5 border text-[11px] uppercase tracking-[0.18em] transition-all duration-200 ${
                    i === activeVariant
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
                  }`}>
                  {v.weight}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic price */}
          <div className="mb-8 py-5 border-t border-b border-border">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono text-3xl font-medium tracking-tight"
                  style={{ background: "linear-gradient(135deg, #C5832B, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {fmtPrice(variant.price)}
                </span>
                <span className="text-[11px] text-muted-foreground ml-2 font-mono">/ {variant.weight}</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-honey">✓ COD</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1.5">
              Paguaj vetëm kur të arrijë dorëzimi
            </p>
          </div>

          {/* Add to Bag CTA */}
          <button
            onClick={handleAddToBag}
            className="w-full py-4 sm:py-5 text-white text-[11px] uppercase tracking-[0.35em] font-medium mb-4 inline-flex items-center justify-center gap-3 transition-all duration-300"
            style={{
              background: addedFeedback
                ? "linear-gradient(135deg, #3a7a3a 0%, #4caf50 100%)"
                : "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)",
              boxShadow: addedFeedback ? "0 4px 28px rgba(76,175,80,0.28)" : "0 4px 28px rgba(197,131,43,0.3)",
            }}
          >
            {addedFeedback ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 4L6 11l-3-3" />
                </svg>
                <span>U Shtua në Shportë</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M12 11v6M9 14h6" />
                </svg>
                <span>Shto në Shportë</span>
              </>
            )}
          </button>

          {/* Accordions */}
          <div className="border-t border-border">
            <Accordion title="Përshkrimi" defaultOpen>
              <div className="space-y-4 text-[13px] text-muted-foreground leading-relaxed">
                {product.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Accordion>
            <Accordion title="Origjina &amp; Burimet">
              <div className="space-y-4 text-[13px] text-muted-foreground leading-relaxed">
                {product.origin.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Accordion>
            <Accordion title="Vlerat Ushqyese (për 100g)">
              <table className="w-full text-[12px]">
                <tbody>
                  {product.nutrition.map(row => (
                    <tr key={row.label} className="border-b border-border/50 last:border-0">
                      <td className="py-2 text-muted-foreground">{row.label}</td>
                      <td className="py-2 text-right font-mono text-foreground/80">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Accordion>
          </div>

          {/* Trust strip */}
          <div className="mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4 text-center">
            {[["✦", "100% Natyrale"], ["◈", "Cash me Dorëzim"], ["◎", "Dërgim 24h"]].map(([icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-honey text-[10px]">{icon}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────

// ── Custom Dark Dropdown ──────────────────────────────────────────────────────

const productOptions = [
  { value: "honey",   label: "Mjaltë" },
  { value: "walnuts", label: "Arra" },
  { value: "almonds", label: "Bajame" },
  { value: "other",   label: "Të tjera" },
];

function DarkDropdown({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = productOptions.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border-b border-white/15 py-3 pr-1 text-[14px] transition-colors duration-200 focus:outline-none"
        style={{ color: selected ? "#ede8df" : "rgba(237,232,223,0.28)", borderColor: open ? "#C5832B" : undefined }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          width="12" height="8" viewBox="0 0 12 8" fill="none"
          className="flex-shrink-0 transition-transform duration-300 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M1 1l5 5 5-5" stroke="#C5832B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#1c1915",
          border: "1px solid rgba(197,131,43,0.25)",
          zIndex: 50,
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {productOptions.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-[13px] transition-colors duration-150"
            style={{
              color: value === opt.value ? "#C5832B" : "#ede8df",
              background: value === opt.value ? "rgba(197,131,43,0.08)" : "transparent",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
            onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = value === opt.value ? "rgba(197,131,43,0.08)" : "transparent"; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Partner Form ──────────────────────────────────────────────────────────────

function PartnerForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [comments, setComments] = useState("");
  const [product, setProduct] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputCls =
    "w-full bg-transparent border-0 border-b border-white/15 px-0 py-3 text-[14px] text-canvas placeholder:text-canvas/30 focus:outline-none focus:border-honey transition-colors duration-200 rounded-none text-left";
  const labelCls = "block text-[9px] uppercase tracking-[0.28em] text-honey font-medium mb-1.5";

  if (submitted) {
    return (
      <div className="py-10 text-center animate-reveal">
        <div className="size-14 rounded-full border border-honey/50 flex items-center justify-center mx-auto mb-6">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey">
            <path d="M18 5L9 15l-5-5" />
          </svg>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-honey mb-3">Faleminderit</p>
        <h3 className="font-display text-2xl mb-3">Kërkesa u dërgua!</h3>
        <p className="text-[13px] text-canvas/45 leading-relaxed">Do t'ju kontaktojmë së shpejti.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <label className={labelCls}>Emri dhe Mbiemri</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder="p.sh. Agim Berisha" className={inputCls} autoComplete="name" />
        </div>
        <div>
          <label className={labelCls}>Numri i Telefonit</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
            placeholder="p.sh. 069 123 4567" className={inputCls} autoComplete="tel" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Rajoni / Qyteti</label>
        <input type="text" value={region} onChange={e => setRegion(e.target.value)} required
          placeholder="p.sh. Shkodër, Tropojë, Korçë..." className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Çfarë prodhoni?</label>
        <DarkDropdown
          value={product}
          onChange={setProduct}
          placeholder="Zgjidhni produktin..."
        />
      </div>
      <div>
        <label className={labelCls}>Komente <span className="normal-case tracking-normal text-canvas/30 ml-1">(opsionale)</span></label>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Ndonjë detaj shtesë rreth prodhimit tuaj..."
          className="w-full bg-transparent border border-white/15 px-4 py-3 text-[14px] text-canvas placeholder:text-canvas/30 focus:outline-none focus:border-honey transition-colors duration-200 resize-none rounded-none"
          style={{ height: "120px" }}
        />
      </div>

      <div className="pt-4">
        <button type="submit"
          className="w-full py-4 text-white text-[11px] uppercase tracking-[0.35em] font-medium inline-flex items-center justify-center gap-3 group transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)", boxShadow: "0 6px 36px rgba(197,131,43,0.25)" }}>
          <span>Dërgo Kërkesën</span>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="transition-transform duration-300 group-hover:translate-x-1">
            <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────

function HomeView({ onProductClick }: { onProductClick: (id: string) => void }) {
  return (
    <>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ background: "#0a0807" }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)" }} />
        <div className="relative z-10 text-center max-w-4xl px-6 animate-reveal">
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.45em] text-white/45 block mb-7">
            Nga Alpet Shqiptare · 100% Natyrale
          </span>
          <h1 className="font-display text-[clamp(3rem,9vw,7rem)] tracking-tight leading-[1.02] mb-7 text-balance text-white">
            Shija{" "}
            <em style={{ fontStyle: "italic", background: "linear-gradient(135deg, #C5832B, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              autentike
            </em>
            <br />e malësisë sonë.
          </h1>
          <p className="text-white/45 text-sm sm:text-[15px] max-w-[44ch] mx-auto mb-11 leading-relaxed hidden sm:block font-light tracking-wide">
            Mjaltë gështenje, arra e bajame të vjelura me dorë — dorëzim i sigurt kudo në Shqipëri.
          </p>
          <Link to="/products"
            className="group inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 text-white text-[10px] sm:text-[11px] uppercase tracking-[0.35em] font-medium hover:opacity-88 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)", boxShadow: "0 6px 36px rgba(197,131,43,0.4)" }}>
            <span>Zbulo Koleksionin</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="mt-5 text-white/25 text-[10px] uppercase tracking-[0.2em]">Pa parapagim · Cash me dorëzim</p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/25">
          <span className="font-mono text-[9px] uppercase tracking-widest">Zbulo</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      {/* Pse Ne — Trust pillars + editorial split */}
      <section id="why" className="border-b border-border relative z-10 bg-background overflow-hidden">
        <PseNeCanvas />

        {/* Three trust pillars */}
        <div className="relative z-10 max-w-7xl mx-auto border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="15" cy="15" r="12" /><path d="M15 7c-3.8 0-6.5 2.8-5.5 6.5.55 2.2 2.2 3.8 5.5 5.5 3.3-1.7 4.95-3.3 5.5-5.5 1-3.7-1.7-6.5-5.5-6.5z" /></svg>, label: "100% Natyrale", desc: "Asnjë shtesë kimike. Vetëm pastërtia e natyrës shqiptare." },
              { icon: <svg width="22" height="22" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3l3 6.5 7 1-5 4.9 1.2 7L15 19.5l-6.2 3.4 1.2-7L5 11.5l7-1L15 3z" /></svg>, label: "Cilësi Premium", desc: "Përzgjedhur me dorë nga bletarë dhe fermerë vendas." },
              { icon: <svg width="22" height="22" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="24" height="14" rx="1.5" /><path d="M21 17h3M9 17h.01M3 14h24M8 10V8a7 7 0 0114 0v2" /></svg>, label: "Paguaj me Dorëzim", desc: "Zero risk. Cash vetëm kur produkti arrin te dera juaj." },
            ].map(b => (
              <div key={b.label} className="flex items-start gap-4 px-8 sm:px-10 lg:px-16 py-10 sm:py-12">
                <div className="text-honey flex-shrink-0 mt-0.5">{b.icon}</div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.28em] font-medium mb-2.5 text-honey">{b.label}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial split */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <div className="flex flex-col md:flex-row gap-12 md:gap-0">

            {/* LEFT: Body text */}
            <div className="md:w-[62%] md:pr-14 lg:pr-20 md:border-r border-border flex flex-col justify-center space-y-5">
              <p className="text-[14px] sm:text-[15px] leading-[1.85] text-foreground/75">
                Familja jonë ka jetuar dhe punuar në malet e Shqipërisë Veriore prej më shumë se tri brezash. Kemi rritur bletë, korrur arra dhe mbjellë bajame — jo si biznes, por si traditë e trashëguar.
              </p>
              <p className="text-[14px] sm:text-[15px] leading-[1.85] text-foreground/75">
                Asnjë nga produktet tona nuk kalon fabrikë. Çdo kavanoz mjalti mbushet me dorë, çdo arre zgjidhet me sy. Ne bashkëpunojmë drejtpërdrejt me prodhuesit vendas — duke garantuar çmim të drejtë për fermerët dhe cilësi absolute për ju.
              </p>
              <p className="text-[14px] sm:text-[15px] leading-[1.85] text-foreground/75">
                Besojmë se luksi i vërtetë nuk ka etiketa të rreme. Ka tokë, punë dhe pastërti.
              </p>
            </div>

            {/* RIGHT: Decorative title block */}
            <div className="md:w-[38%] flex flex-row items-start gap-5 md:pl-14 lg:pl-20 flex-shrink-0">
              <div>
                <h2 className="font-sans text-[clamp(1.5rem,3.5vw,2.4rem)] font-semibold uppercase tracking-[0.22em] leading-tight"
                  style={{ color: "#C5832B" }}>
                  PSE<br />NE
                </h2>
                <p className="font-display italic text-[clamp(1rem,2vw,1.35rem)] text-foreground/60 mt-2 tracking-wide">
                  Historia jonë
                </p>
              </div>
              <div className="self-stretch w-px mx-1 flex-shrink-0" style={{ background: "linear-gradient(to bottom, transparent, #C5832B 20%, #D4AF37 80%, transparent)" }} />
              <div className="flex items-center pt-1">
                <svg width="72" height="64" viewBox="0 0 90 80" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/25">
                  <circle cx="18" cy="18" r="7" />
                  <path d="M6 48c0-12 24-12 24 0" />
                  <line x1="18" y1="25" x2="18" y2="38" />
                  <line x1="18" y1="30" x2="9" y2="37" />
                  <line x1="18" y1="30" x2="27" y2="37" />
                  <circle cx="72" cy="18" r="7" />
                  <path d="M60 48c0-12 24-12 24 0" />
                  <line x1="72" y1="25" x2="72" y2="38" />
                  <line x1="72" y1="30" x2="63" y2="37" />
                  <line x1="72" y1="30" x2="81" y2="37" />
                  <circle cx="45" cy="28" r="5.5" />
                  <path d="M34 58c0-9 22-9 22 0" />
                  <line x1="45" y1="34" x2="45" y2="46" />
                  <line x1="45" y1="39" x2="38" y2="44" />
                  <line x1="45" y1="39" x2="52" y2="44" />
                  <path d="M27 37 Q36 42 38 44M63 37 Q54 42 52 44" strokeDasharray="3 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Product Grid */}
      <section id="products" className="py-24 sm:py-36 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey block mb-4">Koleksioni ynë</span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl">Produkte të zgjedhura</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12">
          {products.map((p, i) => (
            <TiltCard key={p.id} className="animate-reveal cursor-pointer" style={{ animationDelay: `${(i + 1) * 120}ms` }}>
              <div onClick={() => onProductClick(p.id)}>
                <div className="aspect-[4/5] bg-muted overflow-hidden mb-6">
                  <img src={p.images[0]} alt={p.alt} loading="lazy" width={800} height={1000}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="font-display text-xl mb-1">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{p.meta}</p>
                  </div>
                  <span className="font-mono text-sm whitespace-nowrap pt-0.5 text-honey">
                    {fmtPrice(p.variants[1]?.price ?? p.variants[0].price)}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">{p.shortDesc}</p>
              </div>
              <button onClick={() => onProductClick(p.id)}
                className="w-full py-3.5 text-white text-[10px] uppercase tracking-[0.25em] hover:opacity-85 transition-opacity font-medium"
                style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)" }}>
                Shiko Produktin →
              </button>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-ink text-canvas py-24 sm:py-36 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-mono text-[9px] text-honey uppercase tracking-[0.4em] block mb-8">Historia Jonë</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight mb-10 text-pretty italic">
            "Nga lulet e egra të Alpeve Shqiptare, direkt në tryezën tuaj."
          </h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-canvas/50 max-w-2xl mx-auto mb-14 text-pretty">
            Ne besojmë se luksi i vërtetë do të thotë pastërti. Duke punuar me bletarët e vegjël dhe fermerët vendas,
            sigurojmë që çdo produkt të jetë dëshmi e pasurisë së tokës sonë — pa procese industriale, pa nxitim.
          </p>
          <img src={storyMountains} alt="Alpet shqiptare" loading="lazy" width={1600} height={896} className="w-full aspect-video object-cover" />
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-24 sm:py-36 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey block mb-4">Ajo që thonë klientët</span>
          <h2 className="font-display text-4xl sm:text-5xl">Besimi i tyre, krenaria jonë</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="flex flex-col border border-border p-8 sm:p-10">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg key={s} width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-honey">
                    <path d="M6 1l1.4 3 3.1.4-2.3 2.2.6 3.1L6 8.3l-2.8 1.4.6-3.1L1.5 4.4l3.1-.4L6 1z" />
                  </svg>
                ))}
              </div>
              <p className="font-display text-lg sm:text-xl leading-snug italic text-foreground/85 mb-8 flex-1 text-pretty">"{t.quote}"</p>
              <footer className="flex items-center gap-3 mt-auto">
                <div className="size-8 bg-honey/20 flex items-center justify-center text-honey font-display text-sm italic">{t.name[0]}</div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.city}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Footer */}
      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 border-b border-border relative z-10 bg-background scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey block mb-4">Pyetje të shpeshta</span>
            <h2 className="font-display text-4xl sm:text-5xl">Keni pyetje?</h2>
          </div>

          {[
            {
              q: "Pse kristalizohet mjalti?",
              a: "Kristalizimi është një proces natyral dhe shenja absolute e një mjalti të pastër, të papërpunuar dhe pa shtesa artificiale. Për ta kthyer në gjendje të lëngshme, thjesht vendoseni kavanozin në ujë të ngrohtë (jo të valë).",
            },
            {
              q: "Sa kohë duhet për dërgesën?",
              a: "Dërgesat tona zakonisht mbërrijnë brenda 1–3 ditëve të punës në të gjithë Shqipërinë.",
            },
            {
              q: "Si funksionon pagesa në dorëzim?",
              a: "Për t'ju ofruar siguri maksimale, ju e paguani porosinë tuaj me para në dorë tek korrieri, vetëm në momentin që produktet mbërrijnë në derën tuaj.",
            },
          ].map((item) => (
            <Accordion key={item.q} title={item.q}>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{item.a}</p>
            </Accordion>
          ))}
        </div>
      </section>

      {/* Partner with Us */}
      <section id="contact" className="relative z-10 bg-ink text-canvas py-24 sm:py-32 overflow-hidden scroll-mt-24">
        {/* Subtle honey orb behind the form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(197,131,43,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-honey block mb-5">Bashkëpunim</span>
          <h2 className="font-display text-4xl sm:text-5xl italic mb-4 leading-tight">
            Keni prodhimin tuaj?
          </h2>
          <p className="text-[14px] text-canvas/50 leading-relaxed max-w-[48ch] mx-auto mb-12">
            Ne jemi gjithmonë në kërkim të mjaltit dhe arrave më të mira vendase. Na kontaktoni për të bashkëpunuar.
          </p>

          <PartnerForm />
        </div>
      </section>

      <footer id="contact" className="bg-ink text-canvas pt-20 pb-10 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="sm:col-span-2">
            <h2 className="font-display text-3xl italic mb-5">Mjaltë &amp; Arra</h2>
            <p className="text-[11px] text-canvas/40 max-w-xs uppercase tracking-wider leading-relaxed mb-6">
              Kuruar me dashuri në zemër të Shqipërisë. Cilësia nuk është kurrë një aksident.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-medium mb-6 text-honey">Info</h4>
            <ul className="space-y-3.5 text-[11px] text-canvas/50">
              <li><a href="#products" className="hover:text-white transition-colors">Koleksioni</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dërgesat</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kthimet</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privatësia</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-medium mb-6 text-honey">Kontakt</h4>
            <ul className="space-y-3.5 text-[11px] text-canvas/50">
              <li><a href="https://wa.me/355000000000" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp / Viber</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[9px] text-canvas/25 uppercase tracking-widest">© 2026 Mjaltë &amp; Arra · Tiranë, Shqipëri</span>
          <span className="font-mono text-[9px] text-canvas/25 uppercase tracking-widest">Asnjë pagesë online · Cash me dorëzim</span>
        </div>
      </footer>
    </>
  );
}

// ── Root Index ────────────────────────────────────────────────────────────────

function Index() {
  // ── View state
  const [pdpProductId, setPdpProductId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);

  // ── Cart state from shared context
  const {
    cartItems, cartOpen, setCartOpen,
    addToCart, removeFromCart, updateCartQty,
    cartTotal, cartCount,
    checkoutActive, checkoutSnapshot,
    handleCheckout, handleCheckoutBack, handleCheckoutSuccess,
  } = useCart();

  // Scroll-based header
  useEffect(() => {
    const check = () => setHeaderSolid(window.scrollY > window.innerHeight * 0.75);
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  // ── Navigation
  const openPDP = useCallback((id: string) => {
    setPdpProductId(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const closePDP = useCallback(() => {
    setPdpProductId(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const isHeaderSolid = headerSolid || !!pdpProductId;

  // Checkout page takes over the entire screen
  if (checkoutActive) {
    return (
      <CheckoutPage
        items={checkoutSnapshot.items}
        total={checkoutSnapshot.total}
        onBack={handleCheckoutBack}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingOrbs />

      <Header
        solid={isHeaderSolid}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        pdpActive={!!pdpProductId}
        onBack={closePDP}
      />

      {/* View switcher */}
      {pdpProductId ? (
        <ProductDetailPage
          product={products.find(p => p.id === pdpProductId)!}
          onBack={closePDP}
          onAddToBag={addToCart}
        />
      ) : (
        <HomeView onProductClick={openPDP} />
      )}

      {/* Cart drawer — always in DOM for smooth transitions */}
      <CartDrawer
        items={cartItems}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQty}
        onCheckout={handleCheckout}
        total={cartTotal}
      />

      <WhatsAppButton />
    </div>
  );
}
