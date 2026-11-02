import { NextRequest, NextResponse } from "next/server";
import { loadAccess } from "@/lib/auth/access";
import { dailyPdf, dailyWorkbook, type ExportSale } from "@/lib/reports/export";
import { getDailyLedger } from "@/services/sales.service";

function toExport(sales: Awaited<ReturnType<typeof getDailyLedger>>["sales"]): ExportSale[] {
  return sales.map((sale) => ({
    saleNumber: sale.saleNumber,
    createdAt: sale.createdAt,
    total: Number(sale.total),
    employeeName: sale.employee.name,
    items: sale.items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }));
}

export async function GET(req: NextRequest) {
  const access = await loadAccess();
  if (!access?.ability.can("read", "SalesLedger")) {
    return NextResponse.json({ error: "You don't have permission to export the daily ledger." }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date") || undefined;
  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xls";
  const ledger = await getDailyLedger(date);
  const sales = toExport(ledger.sales);

  if (format === "pdf") {
    const bytes = await dailyPdf(ledger.label, sales, ledger.revenue, ledger.units);
    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="aletheia-sales-${ledger.label}.pdf"`,
      },
    });
  }

  const xml = dailyWorkbook(ledger.label, sales, ledger.revenue, ledger.units);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="aletheia-sales-${ledger.label}.xls"`,
    },
  });
}
