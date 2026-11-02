"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSaleAction } from "@/app/actions/sales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";
import { categoryLabel, stockLabel, stockTone } from "@/lib/catalog";
import { formatEtb, roundMoney } from "@/lib/utils";

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
  sku: string;
  unitPrice: string;
  quantity: number;
  maxStock: number;
};

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

export function PosTerminal({ products }: { products: CatalogItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cartRef = useRef<HTMLDivElement>(null);

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

  function addProduct(product: CatalogItem) {
    if (product.stockOnHand <= 0) return;
    setError("");
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (!existing) {
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.unitPrice.toFixed(2),
            quantity: 1,
            maxStock: product.stockOnHand,
          },
        ];
      }
      return current.map((line) =>
        line.productId === product.id
          ? { ...line, quantity: Math.min(line.maxStock, line.quantity + 1) }
          : line
      );
    });
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find(
      (product) => product.barcode?.toLowerCase() === q || product.sku.toLowerCase() === q
    );
    const match = exact || (filtered.length === 1 ? filtered[0] : null);
    if (!match) return;
    if (match.stockOnHand <= 0) {
      setError(`${match.name} is out of stock.`);
      return;
    }
    addProduct(match);
    setQuery("");
  }

  function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScanNote("Camera scanning is not available in this browser. Type the barcode, or use a USB scanner in the search box.");
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new Detector!({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"],
        });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              setScanning(false);
              setQuery(value);
              const match = products.find(
                (product) =>
                  product.barcode === value || product.sku.toLowerCase() === value.toLowerCase()
              );
              if (match && match.stockOnHand > 0) addProduct(match);
              else if (match) setError(`${match.name} is out of stock.`);
              else setError(`No item matches barcode ${value}.`);
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
          setScanNote("Camera permission was blocked. You can still type a barcode or use a USB scanner.");
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

  const total = roundMoney(
    cart.reduce((sum, line) => sum + roundMoney(Number(line.unitPrice || 0) * line.quantity), 0)
  );

  async function submitSale() {
    setPending(true);
    setError("");
    const lines = cart.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
    }));
    const result = await createSaleAction(lines);
    if (!result.ok || !result.saleId) {
      setError(result.error || "Could not submit the sale.");
      setPending(false);
      return;
    }
    router.push(`/pos/receipt/${result.saleId}`);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextField
            label="Find a product"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Name, SKU, or barcode"
            autoFocus
          />
          <Button type="button" variant="secondary" className="shrink-0" onClick={() => (scanning ? setScanning(false) : startScan())}>
            {scanning ? "Stop scan" : "Scan barcode"}
          </Button>
        </div>
        {scanNote && (
          <div className="mt-3">
            <Notice>{scanNote}</Notice>
          </div>
        )}
        {scanning && (
          <video ref={videoRef} className="mt-3 aspect-video w-full rounded-2xl bg-black object-cover" muted playsInline />
        )}
        <div className="mt-4 divide-y divide-[var(--border)]">
          {filtered.map((product) => {
            const tone = stockTone(product.stockOnHand, product.reorderLevel);
            return (
              <article key={product.id} className="flex items-center justify-between gap-3 py-4">
                <div>
                  <h2 className="font-semibold">{product.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {categoryLabel(product.category)} · {product.sku}
                    {product.barcode ? ` · ${product.barcode}` : ""}
                  </p>
                  <p className="mt-1 font-display text-2xl">{formatEtb(product.unitPrice)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={tone}>
                    {stockLabel(tone)} · {product.stockOnHand}
                  </Badge>
                  <Button type="button" disabled={product.stockOnHand <= 0} onClick={() => addProduct(product)}>
                    Add
                  </Button>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <Empty>No items match that search.</Empty>}
        </div>
      </section>

      <div ref={cartRef} className="h-fit lg:sticky lg:top-6">
      <Card>
        <h2 className="font-display text-2xl">Checkout</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Confirm the quantity and unit price, then submit.</p>
        <div className="mt-4 space-y-4">
          {cart.length === 0 && <p className="text-sm text-[var(--muted)]">No items yet.</p>}
          {cart.map((line) => (
            <div key={line.productId} className="space-y-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{line.name}</p>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setCart((current) => current.filter((item) => item.productId !== line.productId))}
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Qty"
                  type="number"
                  min={1}
                  max={line.maxStock}
                  value={line.quantity}
                  onChange={(event) => {
                    const quantity = Math.max(1, Math.min(line.maxStock, Number(event.target.value) || 1));
                    setCart((current) =>
                      current.map((item) => (item.productId === line.productId ? { ...item, quantity } : item))
                    );
                  }}
                />
                <TextField
                  label="Unit price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) => {
                    const unitPrice = event.target.value;
                    setCart((current) =>
                      current.map((item) => (item.productId === line.productId ? { ...item, unitPrice } : item))
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-sm text-[var(--muted)]">Total</span>
          <span className="font-display text-3xl">{formatEtb(total)}</span>
        </div>
        {error && (
          <div className="mt-3">
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
        <Button type="button" className="mt-4 w-full" disabled={pending || cart.length === 0} onClick={submitSale}>
          {pending ? "Submitting…" : "Submit sale"}
        </Button>
      </Card>
      </div>

      {cart.length > 0 && (
        <Button
          type="button"
          className="no-print fixed inset-x-4 bottom-4 z-30 lg:hidden"
          onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          Checkout · {formatEtb(total)}
        </Button>
      )}
    </div>
  );
}
