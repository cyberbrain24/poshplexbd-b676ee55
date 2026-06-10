/**
 * Shared report PDF generator using jsPDF + autotable.
 * Lazy-imported by report pages so the chunk loads only on export.
 */

export interface ReportKPI {
  label: string;
  value: string;
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  filters?: Array<{ label: string; value: string }>;
  kpis?: ReportKPI[];
  columns: string[];
  rows: Array<Array<string | number>>;
  filename: string;
  brand?: string;
}

export async function downloadReportPDF(opts: PdfReportOptions) {
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = (autoTableMod as any).default || (autoTableMod as any);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const brand = opts.brand || "POSHPLEX";

  // Header
  doc.setFillColor(47, 47, 47); // #2f2f2f
  doc.rect(0, 0, pageWidth, 48, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(brand, 32, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(opts.title.toUpperCase(), pageWidth - 32, 30, { align: "right" });

  let cursorY = 70;

  if (opts.subtitle) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(opts.subtitle, 32, cursorY);
    cursorY += 14;
  }

  // Filters
  if (opts.filters?.length) {
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(9);
    const line = opts.filters.map((f) => `${f.label}: ${f.value}`).join("  •  ");
    doc.text(line, 32, cursorY);
    cursorY += 14;
  }

  // KPI row
  if (opts.kpis?.length) {
    cursorY += 6;
    const gap = 10;
    const cardW = (pageWidth - 64 - gap * (opts.kpis.length - 1)) / opts.kpis.length;
    const cardH = 42;
    opts.kpis.forEach((k, i) => {
      const x = 32 + i * (cardW + gap);
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(250, 250, 250);
      doc.rect(x, cursorY, cardW, cardH, "FD");
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(k.label.toUpperCase(), x + 8, cursorY + 14);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(k.value, x + 8, cursorY + 32);
      doc.setFont("helvetica", "normal");
    });
    cursorY += cardH + 14;
  }

  // Table
  autoTable(doc, {
    startY: cursorY,
    head: [opts.columns],
    body: opts.rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [47, 47, 47], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 32, right: 32 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    const stamp = `Generated ${new Date().toLocaleString("en-BD")} • Page ${i}/${pageCount}`;
    doc.text(stamp, pageWidth / 2, doc.internal.pageSize.getHeight() - 16, { align: "center" });
  }

  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}
