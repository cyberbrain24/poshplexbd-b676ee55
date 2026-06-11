import jsPDF from "jspdf";
import type { Order } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatusType, type PaymentStatusType } from "@/constants";
import { format } from "date-fns";

const csvEscape = (val: unknown): string => {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadOrdersCsv = (orders: Order[]) => {
  const headers = [
    "Order Number", "Date", "Customer", "Phone", "Email",
    "Status", "Payment Status", "Payment Method", "Items",
    "Subtotal", "Discount", "Shipping", "Total", "Paid", "Due",
    "Division", "Thana", "Address", "Parcel ID", "Notes",
  ];
  const rows = orders.map((o) => [
    o.order_number,
    o.created_at ? format(new Date(o.created_at), "yyyy-MM-dd HH:mm") : "",
    o.shipping_name || o.customer?.name || "",
    o.shipping_phone || o.customer?.phone || "",
    o.shipping_email || o.customer?.email || "",
    ORDER_STATUS_LABELS[o.order_status as OrderStatusType] || o.order_status,
    PAYMENT_STATUS_LABELS[o.payment_status as PaymentStatusType] || o.payment_status,
    o.payment_method?.name || o.payment_method_type || "",
    (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0),
    o.subtotal ?? 0,
    o.discount_amount ?? 0,
    o.shipping_cost ?? 0,
    o.total_amount ?? 0,
    o.paid_amount ?? 0,
    Math.max((o.total_amount ?? 0) - (o.paid_amount ?? 0), 0),
    o.shipping_division?.name || "",
    o.shipping_thana?.name || "",
    o.shipping_address || "",
    o.consignment_id || o.tracking_number || "",
    o.customer_notes || "",
  ]);

  const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `orders-${format(new Date(), "yyyyMMdd-HHmm")}.csv`);
};

export const generateOrdersReportPdf = (orders: Order[]) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 24;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Orders Report", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 14;
  doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}  •  Orders: ${orders.length}`, margin, y);
  y += 6;

  // Totals summary
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (o.paid_amount || 0), 0);
  const totalDue = Math.max(totalRevenue - totalPaid, 0);
  y += 12;
  doc.setFontSize(9);
  doc.text(`Revenue: ৳${totalRevenue.toFixed(0)}    Paid: ৳${totalPaid.toFixed(0)}    Due: ৳${totalDue.toFixed(0)}`, margin, y);
  y += 12;

  // Column setup
  const cols = [
    { key: "order_number", label: "Order #", w: 70 },
    { key: "date", label: "Date", w: 70 },
    { key: "customer", label: "Customer", w: 100 },
    { key: "phone", label: "Phone", w: 80 },
    { key: "status", label: "Status", w: 80 },
    { key: "payment", label: "Payment", w: 75 },
    { key: "location", label: "Location", w: 110 },
    { key: "total", label: "Total", w: 50 },
    { key: "paid", label: "Paid", w: 50 },
    { key: "due", label: "Due", w: 50 },
    { key: "parcel", label: "Parcel ID", w: 60 },
  ];

  const drawHeader = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageW - margin * 2, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = margin + 4;
    for (const c of cols) {
      doc.text(c.label, x, y + 12);
      x += c.w;
    }
    y += 18;
    doc.setFont("helvetica", "normal");
  };

  drawHeader();

  doc.setFontSize(8);
  for (const o of orders) {
    if (y > pageH - 30) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFontSize(8);
    }
    const due = Math.max((o.total_amount || 0) - (o.paid_amount || 0), 0);
    const row: Record<string, string> = {
      order_number: o.order_number || "",
      date: o.created_at ? format(new Date(o.created_at), "yy-MM-dd HH:mm") : "",
      customer: (o.shipping_name || o.customer?.name || "").slice(0, 22),
      phone: o.shipping_phone || o.customer?.phone || "",
      status: ORDER_STATUS_LABELS[o.order_status as OrderStatusType] || o.order_status,
      payment: PAYMENT_STATUS_LABELS[o.payment_status as PaymentStatusType] || o.payment_status,
      location: `${o.shipping_division?.name || ""}${o.shipping_thana?.name ? ` / ${o.shipping_thana.name}` : ""}`.slice(0, 26),
      total: `${(o.total_amount || 0).toFixed(0)}`,
      paid: `${(o.paid_amount || 0).toFixed(0)}`,
      due: `${due.toFixed(0)}`,
      parcel: (o.consignment_id || o.tracking_number || "").slice(0, 14),
    };
    let x = margin + 4;
    for (const c of cols) {
      doc.text(row[c.key] || "", x, y + 11);
      x += c.w;
    }
    y += 16;
    doc.setDrawColor(230);
    doc.line(margin, y - 2, pageW - margin, y - 2);
  }

  doc.save(`orders-report-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
};
