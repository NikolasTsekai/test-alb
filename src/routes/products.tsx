import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { products, fmtPrice } from "@/lib/store";
import type { Product, Variant, CartItem } from "@/lib/store";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "all" | "honey" | "nuts";
type SortKey = "default" | "price_asc" | "price_desc";

// ── TiltCard ──────────────────────────────────────────────────────────────────

function TiltCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const canHover =
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canHover) return;
      const el = ref.current;
      if (!el) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        el.style.transition = "transform 0.06s ease-out";
        el.style.transform = `perspective(900px) rotateX(${(ny - 0.5) * -18}deg) rotateY(${(nx - 0.5) * 18}deg) scale3d(1.04,1.04,1.04)`;
        const s = el.querySelector<HTMLDivElement>(".card-shine");
        if (s) {
          s.style.opacity = "1";
          s.style.background = `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(212,175,55,0.22) 0%, transparent 60%)`;
        }
      });
    },
    [canHover]
  );

  const onLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.65s cubic-bezier(0.16,1,0.3,1)";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    const s = el.querySelector<HTMLDivElement>(".card-shine");
    if (s) {
      s.style.opacity = "0";
      s.style.background = "transparent";
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}
    >
      {children}
      <div
        className="card-shine absolute inset-0 pointer-events-none"
        style={{ opacity: 0, transition: "opacity 0.3s ease-out", zIndex: 20 }}
      />
    </div>
  );
}

// ── BagIcon ───────────────────────────────────────────────────────────────────

function BagIcon({ count, onClick }: { count: number; onClick: () => void }) {
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
      className="relative flex items-center gap-2 text-foreground transition-colors hover:text-honey"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={ping ? "cart-ping" : ""}
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-honey text-white text-[9px] font-mono rounded-full flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
      <span className="hidden lg:inline text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
        Shporta
      </span>
    </button>
  );
}

// ── CartDrawer ────────────────────────────────────────────────────────────────

function CartDrawer({
  items,
  open,
  onClose,
  onRemove,
  onUpdateQty,
  onCheckout,
  total,
}: {
  items: CartItem[];
  open: boolean;
  onClose: () => void;
  onRemove: (productId: string, variantWeight: string) => void;
  onUpdateQty: (productId: string, variantWeight: string, delta: number) => void;
  onCheckout: () => void;
  total: number;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-ink/60 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-honey mb-0.5">Shporta</p>
            <h2 className="font-display text-xl">
              {items.length === 0
                ? "Bosh"
                : `${items.reduce((s, i) => s + i.quantity, 0)} artikuj`}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Mbyll shportën"
            className="size-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-16">
              <svg
                width="52"
                height="52"
                viewBox="0 0 52 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-border"
              >
                <path d="M10 18l4-6h24l4 6" />
                <rect x="6" y="18" width="40" height="28" rx="2" />
                <path d="M19 26a7 7 0 0014 0" />
              </svg>
              <div>
                <p className="text-[12px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Shporta është bosh</p>
                <p className="text-[11px] text-muted-foreground/60">Shto produkte për të vazhduar</p>
              </div>
              <button
                onClick={onClose}
                className="text-[10px] uppercase tracking-[0.25em] text-honey hover:text-honey-dark transition-colors border-b border-honey/40 pb-0.5"
              >
                Kthehu në Koleksion →
              </button>
            </div>
          ) : (
            <ul className="space-y-0 divide-y divide-border">
              {items.map((item) => {
                const key = `${item.product.id}-${item.variant.weight}`;
                return (
                  <li key={key} className="py-5 flex gap-4">
                    <div className="w-[72px] h-[88px] flex-shrink-0 bg-muted overflow-hidden">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-snug truncate">{item.product.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                            {item.variant.weight}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemove(item.product.id, item.variant.weight)}
                          aria-label={`Hiq ${item.product.name}`}
                          className="flex-shrink-0 size-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                            <path d="M1 1l11 11M12 1L1 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => onUpdateQty(item.product.id, item.variant.weight, -1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Ul sasinë"
                          >
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
                            aria-label="Rrit sasinë"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M5 1v8M1 5h8" />
                            </svg>
                          </button>
                        </div>
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

        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-border px-6 pt-5 pb-7 space-y-4">
            <div className="flex items-center gap-2.5 bg-honey/8 border border-honey/25 px-3.5 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey flex-shrink-0">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M14 12h4M6 12h.01" />
              </svg>
              <p className="text-[10px] text-honey uppercase tracking-[0.15em] font-medium">
                Pa parapagim · Cash me dorëzim
              </p>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nëntotali</span>
              <span className="font-mono text-xl tracking-tight">{fmtPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 text-white text-[11px] uppercase tracking-[0.35em] font-medium inline-flex items-center justify-center gap-3 group transition-opacity hover:opacity-88"
              style={{
                background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)",
                boxShadow: "0 4px 28px rgba(197,131,43,0.32)",
              }}
            >
              <span>Finalizo · Paguaj me Dorëzim</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── CheckoutPage ──────────────────────────────────────────────────────────────

function CheckoutPage({
  items,
  total,
  onBack,
  onSuccess,
}: {
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    onSuccess();
  };

  const inputCls =
    "w-full border-0 border-b border-border bg-transparent px-0 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-honey transition-colors duration-200 rounded-none";
  const labelCls = "block text-[9px] uppercase tracking-[0.3em] text-honey font-medium mb-1.5";

  const summaryContent = (
    <div>
      <div className="flex items-center gap-3 bg-honey/10 border border-honey/30 px-4 py-3 mb-7">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey flex-shrink-0">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M14 12h4M6 12h.01" />
        </svg>
        <p className="text-[10px] text-honey uppercase tracking-[0.15em] font-medium">
          Pa parapagim · Cash me dorëzim
        </p>
      </div>
      <ul className="space-y-5 mb-8">
        {items.map((item) => (
          <li
            key={`${item.product.id}-${item.variant.weight}`}
            className="flex gap-4"
          >
            <div className="w-16 h-20 flex-shrink-0 bg-muted overflow-hidden">
              <img
                src={item.product.images[0]}
                alt={item.product.alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium leading-snug">{item.product.name}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                {item.variant.weight} × {item.quantity}
              </p>
              <p className="font-mono text-[13px] mt-2">
                {fmtPrice(item.variant.price * item.quantity)}
              </p>
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
          <span
            className="font-mono text-xl"
            style={{
              background: "linear-gradient(135deg, #C5832B, #D4AF37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
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
            <button
              onClick={onBack}
              className="px-10 py-3.5 text-white text-[10px] uppercase tracking-[0.25em] hover:opacity-88 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)" }}
            >
              Kthehu në Dyqan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col animate-reveal" style={{ animationDuration: "0.5s" }}>
      <header className="sticky top-0 z-50 bg-canvas/96 backdrop-blur-md border-b border-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-honey transition-colors group"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-x-1">
              <path d="M10 3L5 8l5 5" />
            </svg>
            <span className="hidden sm:inline">Kthehu</span>
          </button>
          <span className="font-display text-xl italic tracking-tight">Mjaltë &amp; Arra</span>
          <div className="w-16 sm:w-24" />
        </div>
      </header>

      <div className="md:hidden border-b border-border" style={{ background: "oklch(0.975 0.009 75)" }}>
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          className="w-full px-5 py-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-honey">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="text-[11px] uppercase tracking-[0.2em] text-honey font-medium">
              {summaryOpen ? "Mbyll rezymën" : "Shfaq rezymën"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] font-medium">{fmtPrice(total)}</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              className={`text-muted-foreground transition-transform duration-300 ${summaryOpen ? "rotate-180" : ""}`}
            >
              <path d="M1 4l5 5 5-5" />
            </svg>
          </div>
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateRows: summaryOpen ? "1fr" : "0fr",
            transition: "grid-template-rows 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div className="px-5 pb-6 pt-1">{summaryContent}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="p.sh. Arben Hoxha" className={inputCls} autoComplete="name" />
              </div>
              <div>
                <label className={labelCls}>Numri i Telefonit</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="p.sh. 069 123 4567" className={inputCls} autoComplete="tel" />
              </div>
              <div>
                <label className={labelCls}>Adresa e Dorëzimit</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Rruga, numri i shtëpisë" className={inputCls} autoComplete="street-address" />
              </div>
              <div>
                <label className={labelCls}>Qyteti</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="p.sh. Tiranë, Shkodër..." className={inputCls} autoComplete="address-level2" />
              </div>
              <div>
                <label className={labelCls}>Shënim (opsional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ndonjë detaj shtesë për dorëzimin..." className={`${inputCls} resize-none`} />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-5 text-white text-[11px] uppercase tracking-[0.35em] font-medium inline-flex items-center justify-center gap-3 group transition-opacity hover:opacity-88"
                  style={{
                    background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)",
                    boxShadow: "0 6px 36px rgba(197,131,43,0.3)",
                  }}
                >
                  <span>Konfirmo · Paguaj me Dorëzim</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="transition-transform duration-300 group-hover:translate-x-1">
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
        <div
          className="hidden md:block md:w-[40%] border-l border-border px-10 lg:px-14 py-16"
          style={{ background: "oklch(0.975 0.009 75)" }}
        >
          <div className="sticky top-[4.5rem] pt-4">
            <h2 className="font-display text-2xl mb-8">Rezymë e Porosisë</h2>
            {summaryContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAddToCart,
  animDelay,
  visible,
}: {
  product: Product;
  onAddToCart: (product: Product, variant: Variant) => void;
  animDelay: number;
  visible: boolean;
}) {
  const [added, setAdded] = useState(false);
  const baseVariant = product.variants[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.soldOut) return;
    onAddToCart(product, baseVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.45s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms`,
      }}
    >
      <TiltCard className="cursor-pointer">
        {/* Image wrapper */}
        <div className="aspect-[4/5] bg-muted overflow-hidden mb-5 relative group">
          <img
            src={product.images[0]}
            alt={product.alt}
            loading="lazy"
            width={800}
            height={1000}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              product.soldOut ? "opacity-50" : ""
            }`}
          />

          {/* Sold-out overlay */}
          {product.soldOut && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="px-4 py-1.5 border border-foreground/30 bg-canvas/85 backdrop-blur-sm"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-foreground/60">
                  E Ezauruar
                </span>
              </div>
            </div>
          )}

          {/* Quick-add hover button (desktop only) */}
          {!product.soldOut && (
            <div className="hidden sm:block absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <button
                onClick={handleQuickAdd}
                className="w-full py-3.5 text-white text-[10px] uppercase tracking-[0.28em] font-medium flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
                style={{
                  background: added
                    ? "linear-gradient(135deg, #3a7a3a 0%, #4caf50 100%)"
                    : "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)",
                }}
              >
                {added ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 3L5 9l-3-3" />
                    </svg>
                    U Shtua
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M12 11v6M9 14h6" />
                    </svg>
                    Shto në Shportë
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Text info */}
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <h3 className="font-display text-xl mb-1 leading-tight">{product.name}</h3>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{product.meta}</p>
          </div>
          {product.soldOut ? (
            <span className="font-mono text-[11px] text-muted-foreground/50 whitespace-nowrap pt-0.5">—</span>
          ) : (
            <span className="font-mono text-sm whitespace-nowrap pt-0.5 text-honey">
              {fmtPrice(product.variants[1]?.price ?? product.variants[0].price)}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-4 sm:mb-0">{product.shortDesc}</p>

        {/* Mobile CTA — always visible on touch screens */}
        {!product.soldOut && (
          <button
            onClick={handleQuickAdd}
            className="sm:hidden w-full py-3.5 text-white text-[10px] uppercase tracking-[0.28em] font-medium flex items-center justify-center gap-2.5"
            style={{
              background: added
                ? "linear-gradient(135deg, #3a7a3a 0%, #4caf50 100%)"
                : "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)",
            }}
          >
            {added ? (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 3L5 9l-3-3" />
                </svg>
                U Shtua
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M12 11v6M9 14h6" />
                </svg>
                Shto në Shportë
              </>
            )}
          </button>
        )}
      </TiltCard>
    </div>
  );
}

// ── WhatsApp Button ───────────────────────────────────────────────────────────

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/355000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Kontaktoni përmes WhatsApp"
      className="fixed bottom-6 right-6 z-[45] size-14 bg-[#25D366] flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300"
      style={{ boxShadow: "0 4px 24px rgba(37,211,102,0.4)" }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ── Products Page ─────────────────────────────────────────────────────────────

function ProductsPage() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    updateCartQty,
    cartTotal,
    cartCount,
    checkoutActive,
    checkoutSnapshot,
    handleCheckout,
    handleCheckoutBack,
    handleCheckoutSuccess,
  } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<Category>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [visibleCards, setVisibleCards] = useState(true);

  // Animate grid when filters change
  const applyFilter = (newCat: Category, newSort: SortKey) => {
    setVisibleCards(false);
    setTimeout(() => {
      setCategory(newCat);
      setSortKey(newSort);
      setVisibleCards(true);
    }, 200);
  };

  const handleCategory = (cat: Category) => {
    if (cat === category) return;
    applyFilter(cat, sortKey);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as SortKey;
    applyFilter(category, val);
  };

  const filtered = products
    .filter((p) => category === "all" || p.category === category)
    .sort((a, b) => {
      const pa = a.variants[0].price;
      const pb = b.variants[0].price;
      if (sortKey === "price_asc") return pa - pb;
      if (sortKey === "price_desc") return pb - pa;
      return 0;
    });

  // Render checkout when active
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
      {/* ── Header ── */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-canvas/96 backdrop-blur-md border-b border-border text-foreground transition-all duration-500">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="font-display text-xl sm:text-2xl tracking-tight italic">
            Mjaltë &amp; Arra
          </Link>

          {/* Right: nav links + cart + hamburger */}
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="hidden md:flex items-center text-[11px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
              <Link
                to="/products"
                className="text-honey hover:text-honey transition-colors pr-7"
              >
                Produkte
              </Link>
              <span className="w-px h-3.5 mr-7 flex-shrink-0 bg-border" />
              <Link to="/" hash="why" className="hover:text-honey transition-colors pr-7">Pse Ne</Link>
              <Link to="/" hash="reviews" className="hover:text-honey transition-colors pr-7">Opinione</Link>
              <Link to="/" hash="faq" className="hover:text-honey transition-colors pr-7">Pyetje</Link>
              <Link to="/" hash="contact" className="hover:text-honey transition-colors mr-7">Kontakt</Link>
            </div>
            <BagIcon count={cartCount} onClick={() => setCartOpen(true)} />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              className="md:hidden size-9 flex flex-col items-center justify-center gap-1.5"
            >
              {["", "", ""].map((_, i) => {
                const extra =
                  i === 0
                    ? menuOpen ? "rotate-45 translate-y-[5px]" : ""
                    : i === 1
                    ? menuOpen ? "opacity-0" : ""
                    : menuOpen ? "-rotate-45 -translate-y-[5px]" : "";
                return (
                  <span
                    key={i}
                    className={`block h-px w-6 bg-foreground transition-all duration-300 ${extra}`}
                  />
                );
              })}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-ink border-t border-white/10 px-5 py-6 flex flex-col gap-5 text-[12px] uppercase tracking-[0.2em] text-white/70">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="text-honey">Produkte</Link>
            <span className="w-full h-px bg-white/10" />
            <Link to="/" hash="why" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Pse Ne</Link>
            <Link to="/" hash="reviews" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Opinione</Link>
            <Link to="/" hash="faq" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Pyetje</Link>
            <Link to="/" hash="contact" onClick={() => setMenuOpen(false)} className="hover:text-honey transition-colors">Kontakt</Link>
            <button
              onClick={() => { setMenuOpen(false); setCartOpen(true); }}
              className="mt-2 py-3 text-white text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C5832B 0%, #D4AF37 100%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              Shporta {cartCount > 0 ? `(${cartCount})` : ""}
            </button>
          </div>
        )}
      </header>

      {/* ── Page Header ── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10 sm:pt-24 sm:pb-14">
        <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-honey block mb-5">
          Koleksioni i Plotë
        </span>
        <h1 className="font-display text-[clamp(2rem,6vw,5rem)] leading-[1.04] tracking-tight">
          Produkte
        </h1>
        <div className="w-12 h-px mt-6" style={{ background: "linear-gradient(90deg, #C5832B, #D4AF37)" }} />
      </section>

      {/* ── Filter Bar ── */}
      <div className="sticky top-[4.5rem] sm:top-20 z-40 bg-canvas/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4 sm:h-14">
            {/* Category tabs */}
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide h-12 sm:h-14">
              {(
                [
                  { key: "all", label: "Të gjitha" },
                  { key: "honey", label: "Mjaltë" },
                  { key: "nuts", label: "Arra & Bajame" },
                ] as { key: Category; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleCategory(key)}
                  className={`relative flex-shrink-0 px-4 sm:px-5 h-12 sm:h-14 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors duration-200 ${
                    category === key
                      ? "text-honey"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {category === key && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-px"
                      style={{ background: "linear-gradient(90deg, #C5832B, #D4AF37)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Sort dropdown — desktop only */}
            <select
              value={sortKey}
              onChange={handleSort}
              aria-label="Renditja"
              className="hidden sm:block appearance-none bg-transparent border border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground pl-3 py-1.5 pr-8 cursor-pointer hover:border-honey/50 transition-colors duration-200 focus:outline-none focus:border-honey flex-shrink-0"
            >
              <option value="default">Renditja: Parazgjedhur</option>
              <option value="price_asc">Çmimi: Më i ulët</option>
              <option value="price_desc">Çmimi: Më i lartë</option>
            </select>
          </div>

          {/* Sort dropdown — mobile only row */}
          <div className="sm:hidden border-t border-border/50">
            <select
              value={sortKey}
              onChange={handleSort}
              aria-label="Renditja"
              className="w-full appearance-none bg-transparent text-[10px] uppercase tracking-[0.18em] text-muted-foreground py-3 cursor-pointer focus:outline-none"
            >
              <option value="default">Renditja: Parazgjedhur</option>
              <option value="price_asc">Çmimi: Më i ulët</option>
              <option value="price_desc">Çmimi: Më i lartë</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
              Asnjë produkt nuk u gjet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                animDelay={i * 80}
                visible={visibleCards}
              />
            ))}
          </div>
        )}

        {/* Result count */}
        <p className="mt-14 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/40">
          {filtered.length} produkt{filtered.length !== 1 ? "e" : ""}
        </p>
      </main>

      {/* ── Cart Drawer ── */}
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
