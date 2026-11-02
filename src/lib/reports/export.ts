import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatShopDateTime } from "@/lib/time";
import { formatEtb } from "@/lib/utils";
import type { MonthRow } from "@/services/sales.service";

export type ExportSale = {
  saleNumber: string;
  createdAt: Date;
  total: number;
  employeeName: string;
  items: {
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

function xml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function workbook(name: string, rows: (string | number)[][]) {
  const body = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const type = typeof cell === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${xml(cell)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${xml(name)}"><Table>${body}</Table></Worksheet>
</Workbook>`;
}

export function monthlyWorkbook(year: number, rows: MonthRow[], totals: { sales: number; units: number; revenue: number }) {
  const table: (string | number)[][] = [
    ["Aletheia Cosmo & Gift"],
    [`Monthly sales ${year}`],
    [],
    ["Month", "Sales", "Units", "Revenue ETB", "Change vs previous month"],
    ...rows.map((row) => [
      row.label,
      row.sales,
      row.units,
      row.revenue,
      row.change == null ? "" : Number(row.change.toFixed(1)),
    ]),
    [],
    ["Year total", totals.sales, totals.units, totals.revenue, ""],
  ];
  return workbook(`Monthly ${year}`, table);
}

export function dailyWorkbook(label: string, sales: ExportSale[], revenue: number, units: number) {
  const table: (string | number)[][] = [
    ["Aletheia Cosmo & Gift"],
    [`Daily sales ${label}`],
    [],
    ["Time", "Sale", "Employee", "Item", "SKU", "Qty", "Unit price", "Line total", "Sale total"],
  ];
  for (const sale of sales) {
    sale.items.forEach((item, index) => {
      table.push([
        formatShopDateTime(sale.createdAt),
        sale.saleNumber,
        sale.employeeName,
        item.productName,
        item.sku,
        item.quantity,
        item.unitPrice,
        item.subtotal,
        index === 0 ? sale.total : "",
      ]);
    });
  }
  table.push([]);
  table.push(["Day total", "", "", "", "", units, "", revenue, revenue]);
  return workbook(`Sales ${label}`, table);
}

async function drawPdf(title: string, lines: string[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const write = (text: string, strong = false) => {
    if (y < 48) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(text.slice(0, 110), {
      x: 40,
      y,
      size: strong ? 12 : 10,
      font: strong ? bold : font,
      color: rgb(0.11, 0.08, 0.09),
    });
    y -= strong ? 22 : 16;
  };
  write(title, true);
  write("Aletheia Cosmo & Gift");
  y -= 8;
  for (const line of lines) write(line);
  return await doc.save();
}

export async function monthlyPdf(year: number, rows: MonthRow[], totals: { sales: number; units: number; revenue: number }) {
  const lines = [
    ...rows.map(
      (row) =>
        `${row.label}: ${row.sales} sales, ${row.units} units, ${formatEtb(row.revenue)}` +
        (row.change == null ? "" : `, ${row.change >= 0 ? "+" : ""}${row.change.toFixed(1)}% vs prior month`)
    ),
    "",
    `Year total: ${totals.sales} sales, ${totals.units} units, ${formatEtb(totals.revenue)}`,
  ];
  return drawPdf(`Monthly sales ${year}`, lines);
}

export async function dailyPdf(label: string, sales: ExportSale[], revenue: number, units: number) {
  const lines: string[] = [];
  for (const sale of sales) {
    lines.push(`${formatShopDateTime(sale.createdAt)}  ${sale.saleNumber}  ${sale.employeeName}  ${formatEtb(sale.total)}`);
    for (const item of sale.items) {
      lines.push(`    ${item.quantity} x ${item.productName} @ ${formatEtb(item.unitPrice)} = ${formatEtb(item.subtotal)}`);
    }
    lines.push("");
  }
  lines.push(`Day total: ${sales.length} sales, ${units} units, ${formatEtb(revenue)}`);
  return drawPdf(`Daily sales ${label}`, lines);
}
