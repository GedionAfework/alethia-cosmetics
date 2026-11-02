"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" className="no-print" onClick={() => window.print()}>
      Print receipt
    </Button>
  );
}
