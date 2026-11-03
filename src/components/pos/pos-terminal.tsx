"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { createSaleAction } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Empty } from "@/components/ui/empty";
import { SearchInput } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";
import { stockTone } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n/client";
import { haptic } from "@/lib/telegram/client";
import { cn, roundMoney } from "@/lib/utils";

export type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  unitPrice: number;
  stockOnHand: number;
  reorderLevel: number;
};

type CartLine = {
  productId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  maxStock: number;
};

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

const stockDot = { ok: "bg-ok", low: "bg-warn", out: "bg-danger" } as const;

export function PosTerminal({ products }: { products: CatalogItem[] }) {
  const router = useRouter();
  const { t, fmt, money, err } = useI18n();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(q) ||
            product.sku.toLowerCase().includes(q) ||
            (product.barcode || "").toLowerCase().includes(q)
        )
      : products;
    return [...list].sort((a, b) => {
      const aOut = a.stockOnHand <= 0 ? 1 : 0;
      const bOut = b.stockOnHand <= 0 ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;
      return a.name.localeCompare(b.name);
    });
  }, [products, query]);

  const inCart = useMemo(() => new Map(cart.map((line) => [line.productId, line.quantity])), [cart]);

  function addProduct(product: CatalogItem) {
    if (product.stockOnHand <= 0) return;
    setError("");
    haptic.tap();
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (!existing) {
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.unitPrice.toFixed(2),
            quantity: 1,
            maxStock: product.stockOnHand,
          },
        ];
      }
      return current.map((line) =>
        line.productId === product.id ? { ...line, quantity: Math.min(line.maxStock, line.quantity + 1) } : line
      );
    });
  }

  function setQuantity(productId: string, quantity: number) {
    haptic.select();
    setCart((current) =>
      current.flatMap((line) => {
        if (line.productId !== productId) return [line];
        if (quantity < 1) return [];
        return [{ ...line, quantity: Math.min(line.maxStock, quantity) }];
      })
    );
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((product) => product.barcode?.toLowerCase() === q || product.sku.toLowerCase() === q);
    const match = exact || (filtered.length === 1 ? filtered[0] : null);
    if (!match) return;
    if (match.stockOnHand <= 0) {
      setError(fmt(t.pos.outOfStock, { name: match.name }));
      return;
    }
    addProduct(match);
    setQuery("");
  }

  function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScanNote(t.pos.scanUnavailable);
      return;
    }
    setScanNote("");
    setScanning(true);
  }

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let frame = 0;
    const Detector = (window as unknown as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
    if (!Detector) return;

    async function run() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new Detector!({ formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              setScanning(false);
              const match = products.find(
                (product) => product.barcode === value || product.sku.toLowerCase() === value.toLowerCase()
              );
              if (match && match.stockOnHand > 0) {
                addProduct(match);
                haptic.notify("success");
              } else {
                haptic.notify("error");
                setQuery(value);
                setError(match ? fmt(t.pos.outOfStock, { name: match.name }) : fmt(t.pos.noBarcode, { code: value }));
              }
              return;
            }
          } catch {
            // The next frame may be readable.
          }
          if (!cancelled) frame = requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        if (!cancelled) {
          setScanning(false);
          setScanNote(t.pos.cameraBlocked);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // addProduct is recreated each render; the scan should use the catalog from this pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const total = roundMoney(cart.reduce((sum, line) => sum + roundMoney(Number(line.unitPrice || 0) * line.quantity), 0));
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);

  async function submitSale() {
    setPending(true);
    setError("");
    const result = await createSaleAction(
      cart.map((line) => ({ productId: line.productId, quantity: line.quantity, unitPrice: Number(line.unitPrice) }))
    );
    if (!result.ok || !result.saleId) {
      haptic.notify("error");
      setError(result.error ? err(result.error) : t.pos.failed);
      setPending(false);
      return;
    }
    haptic.notify("success");
    router.push(`/pos/receipt/${result.saleId}`);
    router.refresh();
  }

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingCart className="size-5 text-accent" />
          {t.pos.cart}
          {units > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent">{units}</span>}
        </h2>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])}>
              {t.pos.clear}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSheetOpen(false)} aria-label={t.common.back}>
            <X />
          </Button>
        </div>
      </div>

      <div className="-mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1">
        {cart.length === 0 && (
          <div className="grid place-items-center rounded-2xl bg-surface-2 py-10 text-sm font-medium text-muted">{t.pos.emptyCart}</div>
        )}
        {cart.map((line) => (
          <div key={line.productId} className="rounded-2xl bg-surface-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm leading-snug font-semibold">{line.name}</p>
              <span className="tabular shrink-0 text-sm font-bold">
                {money(roundMoney(Number(line.unitPrice || 0) * line.quantity))}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center rounded-xl bg-surface ring-1 ring-line">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-l-xl text-muted transition hover:text-ink"
                  onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  aria-label="−"
                >
                  <Minus className="size-4" />
                </button>
                <span className="tabular w-8 text-center text-sm font-bold">{line.quantity}</span>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-r-xl text-muted transition hover:text-ink disabled:opacity-30"
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  disabled={line.quantity >= line.maxStock}
                  aria-label="+"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                {t.pos.unitPrice}
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) => {
                    const unitPrice = event.target.value;
                    setCart((current) =>
                      current.map((item) => (item.productId === line.productId ? { ...item, unitPrice } : item))
                    );
                  }}
                  className="tabular h-9 w-24 rounded-xl bg-surface px-2.5 text-right text-sm font-semibold text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-sm font-semibold text-muted">{t.common.total}</span>
          <span className="tabular text-3xl font-extrabold tracking-tight">{money(total)}</span>
        </div>
        {error && <Notice tone="danger" className="mb-3">{error}</Notice>}
        <Button size="lg" className="w-full" disabled={pending || cart.length === 0} onClick={submitSale}>
          {pending ? t.pos.submitting : t.pos.submit}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0">
        <div className="sticky top-[61px] z-20 -mx-4 mb-4 bg-canvas/85 px-4 py-2 backdrop-blur-xl lg:top-0 lg:mx-0 lg:px-0">
          <div className="flex gap-2">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={t.pos.search}
              aria-label={t.pos.search}
              autoFocus
            />
            <Button
              variant={scanning ? "danger" : "soft"}
              className="h-12 w-12 rounded-2xl px-0 sm:w-auto sm:px-5"
              onClick={() => (scanning ? setScanning(false) : startScan())}
              aria-label={scanning ? t.pos.stopScan : t.pos.scan}
            >
              {scanning ? <X /> : <Camera />}
              <span className="hidden sm:inline">{scanning ? t.pos.stopScan : t.pos.scan}</span>
            </Button>
          </div>
          {scanNote && <Notice className="mt-2">{scanNote}</Notice>}
          {error && !sheetOpen && <Notice tone="danger" className="mt-2 lg:hidden">{error}</Notice>}
        </div>

        {scanning && (
          <div className="relative mb-4 overflow-hidden rounded-3xl bg-black">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-accent shadow-[0_0_16px_var(--accent)]" />
          </div>
        )}

        {filtered.length === 0 ? (
          <Empty>{t.pos.noMatch}</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((product) => {
              const tone = stockTone(product.stockOnHand, product.reorderLevel);
              const count = inCart.get(product.id) ?? 0;
              const out = product.stockOnHand <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => addProduct(product)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-3xl bg-surface p-3.5 text-left ring-1 shadow-[var(--shadow)] transition active:scale-[0.97] disabled:opacity-45",
                    count > 0 ? "ring-2 ring-accent" : "ring-line hover:-translate-y-0.5"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <CategoryIcon category={product.category} />
                    {count > 0 ? (
                      <span className="tabular grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-on-accent">
                        {count}
                      </span>
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-muted">
                        <Plus className="size-4" />
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm leading-tight font-semibold">{product.name}</p>
                  <div className="flex items-end justify-between gap-2">
                    <span className="tabular text-[15px] font-extrabold">{money(product.unitPrice)}</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                      <span className={cn("size-1.5 rounded-full", stockDot[tone])} />
                      {out ? t.stockStatus.out : product.stockOnHand}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Desktop cart */}
      <aside className="hidden h-[calc(100dvh-5rem)] lg:sticky lg:top-10 lg:block">
        <div className="h-full rounded-3xl bg-surface p-5 ring-1 ring-line shadow-[var(--shadow)]">{cartPanel}</div>
      </aside>

      {/* Mobile checkout bar + sheet */}
      {cart.length > 0 && !sheetOpen && (
        <button
          type="button"
          onClick={() => {
            haptic.tap("medium");
            setSheetOpen(true);
          }}
          className="animate-rise no-print fixed inset-x-4 bottom-[6.25rem] z-40 flex items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-4 font-bold text-on-accent shadow-[0_16px_36px_-14px_var(--accent)] lg:hidden"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            {t.pos.checkout}
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{units}</span>
          </span>
          <span className="tabular">{money(total)}</span>
        </button>
      )}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t.common.back}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="animate-rise pb-safe absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[2rem] bg-surface px-5 pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-line" />
            {cartPanel}
          </div>
        </div>
      )}
    </div>
  );
}
