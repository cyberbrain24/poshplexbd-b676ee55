import jsPDF from "jspdf";
import type { Order } from "@/hooks/useOrders";

const loadImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

const imageToDataUrl = (img: HTMLImageElement): string | null => {
  try {
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, size, size);
    // cover
    const ratio = Math.max(size / img.width, size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
};

interface PackingItem {
  imageUrl: string | null;
  orderNumber: string;
  customerName: string;
  phone: string;
  productName: string;
  variant: string;
  quantity: number;
}

export async function generatePackingListPdf(orders: Order[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 30;

  // Aggregate
  const customerSet = new Set<string>();
  let totalQty = 0;
  const categoryQty: Record<string, number> = {};
  const items: PackingItem[] = [];

  for (const order of orders) {
    customerSet.add(order.customer?.phone || order.shipping_phone || order.id);
    for (const it of (order.items || []) as any[]) {
      totalQty += it.quantity || 0;
      const cats: any[] = it.product?.product_categories || [];
      if (cats.length > 0) {
        for (const c of cats) {
          const name = c.category?.name || "Uncategorized";
          categoryQty[name] = (categoryQty[name] || 0) + (it.quantity || 0);
        }
      } else {
        categoryQty["Uncategorized"] = (categoryQty["Uncategorized"] || 0) + (it.quantity || 0);
      }
      const imgs: any[] = it.product?.product_images || [];
      const main = imgs.find((i) => i.is_main) || imgs.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
      const variant = Object.values(it.variant_details || {}).filter(Boolean).join(" / ");
      items.push({
        imageUrl: main?.image_url || null,
        orderNumber: order.order_number,
        customerName: order.customer?.name || order.shipping_name || "—",
        phone: order.customer?.phone || order.shipping_phone || "—",
        productName: it.product_name,
        variant,
        quantity: it.quantity || 1,
      });
    }
  }

  // ===== Summary page =====
  let y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Packing List", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleString(), margin, y + 8);
  y += 30;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total Ordered Persons: ${customerSet.size}`, margin, y);
  y += 18;
  doc.text(`Total Quantity of Products: ${totalQty}`, margin, y);
  y += 24;

  doc.setFontSize(11);
  doc.text("Quantity by Category", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const sortedCats = Object.entries(categoryQty).sort((a, b) => b[1] - a[1]);
  for (const [cat, qty] of sortedCats) {
    if (y > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(`• ${cat}: ${qty} pcs`, margin + 8, y);
    y += 14;
  }

  // ===== Image grid =====
  doc.addPage();
  const cols = 4;
  const gap = 10;
  const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const imgH = cellW;
  const textH = 38;
  const cellH = imgH + textH + 6;

  let col = 0;
  let rowY = margin;

  for (const item of items) {
    if (col === 0 && rowY + cellH > pageH - margin) {
      doc.addPage();
      rowY = margin;
    }
    const x = margin + col * (cellW + gap);

    // Image
    let drew = false;
    if (item.imageUrl) {
      const img = await loadImage(item.imageUrl);
      if (img) {
        const dataUrl = imageToDataUrl(img);
        if (dataUrl) {
          doc.addImage(dataUrl, "JPEG", x, rowY, cellW, imgH);
          drew = true;
        }
      }
    }
    if (!drew) {
      doc.setFillColor(240);
      doc.rect(x, rowY, cellW, imgH, "F");
      doc.setTextColor(150);
      doc.setFontSize(8);
      doc.text("No image", x + cellW / 2, rowY + imgH / 2, { align: "center" });
    }

    // Caption
    let ty = rowY + imgH + 10;
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`#${item.orderNumber} × ${item.quantity}`, x, ty);
    ty += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const nameLine = doc.splitTextToSize(item.customerName, cellW)[0];
    doc.text(nameLine, x, ty);
    ty += 9;
    doc.setTextColor(100);
    doc.text(item.phone, x, ty);
    if (item.variant) {
      ty += 9;
      doc.setFontSize(6.5);
      const v = doc.splitTextToSize(item.variant, cellW)[0];
      doc.text(String(v), x, ty);
    }

    col++;
    if (col >= cols) {
      col = 0;
      rowY += cellH + 8;
    }
  }

  doc.save(`packing-list-${new Date().toISOString().slice(0, 10)}.pdf`);
}
