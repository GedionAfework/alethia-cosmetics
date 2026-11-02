import { NextRequest, NextResponse } from "next/server";
import { loadAccess } from "@/lib/auth/access";
import { shopYear } from "@/lib/time";
import { monthlyPdf, monthlyWorkbook } from "@/lib/reports/export";
import { getMonthlyReport } from "@/services/sales.service";

export async function GET(req: NextRequest) {
  const access = await loadAccess();
  if (!access?.ability.can("read", "Report")) {
    return NextResponse.json({ error: "You don't have permission to export monthly reports." }, { status: 403 });
  }

  const requested = Number(req.nextUrl.searchParams.get("year") || shopYear());
  const year = Number.isInteger(requested) && requested >= 2020 && requested <= 2100 ? requested : shopYear();
  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xls";
  const report = await getMonthlyReport(year);
  const totals = { sales: report.sales, units: report.units, revenue: report.revenue };

  if (format === "pdf") {
    const bytes = await monthlyPdf(year, report.rows, totals);
    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="aletheia-monthly-${year}.pdf"`,
      },
    });
  }

  const xml = monthlyWorkbook(year, report.rows, totals);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="aletheia-monthly-${year}.xls"`,
    },
  });
}
