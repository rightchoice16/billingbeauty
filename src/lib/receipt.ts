import QRCode from "qrcode";
import { upiLink } from "./upi-qr";
import { invNo, type Bill, type Branch } from "./billing";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const rs = (n: number) => "Rs." + Number(n).toLocaleString("en-IN");

async function qrFor(bill: Bill, branch: Branch | undefined) {
  if (!branch?.upi_id) return "";
  return QRCode.toDataURL(upiLink(branch.upi_id, branch.name, Number(bill.total)), {
    width: 300,
    margin: 1,
  });
}

/** Opens the system print dialog with an 80mm thermal-printer receipt. */
export async function printThermal(bill: Bill, branch: Branch | undefined) {
  const qr = await qrFor(bill, branch);
  const d = new Date(bill.date);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invNo(bill.number)}</title>
<style>
@page{size:80mm auto;margin:0}
*{box-sizing:border-box}
body{width:80mm;margin:0;padding:4mm 4mm 8mm;font-family:'Courier New',monospace;font-size:12px;color:#000;background:#fff}
.c{text-align:center}.b{font-weight:bold}.row{display:flex;justify-content:space-between;gap:6px}
hr{border:0;border-top:1px dashed #000;margin:6px 0}
.logo{max-width:40mm;max-height:20mm;display:block;margin:0 auto 4px}
.qr{width:38mm;height:38mm;display:block;margin:4px auto}
.big{font-size:16px}
</style></head><body>
${branch?.logo_url ? `<img class="logo" src="${branch.logo_url}">` : ""}
<div class="c b big">${esc(branch?.name ?? "Glow & Go")}</div>
${branch?.address ? `<div class="c">${esc(branch.address)}</div>` : ""}
${branch?.phone ? `<div class="c">Ph: ${esc(branch.phone)}</div>` : ""}
<hr>
<div class="row"><span>${invNo(bill.number)}</span><span>${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></div>
<div>Customer: ${esc(bill.customer_name)}</div>
${bill.customer_phone ? `<div>Phone: ${esc(bill.customer_phone)}</div>` : ""}
<div>Staff: ${esc(bill.staff_name)}</div>
<hr>
${bill.lines
  .map(
    (l) =>
      `<div>${esc(l.name)}</div><div class="row"><span>&nbsp;${l.qty} x ${rs(l.price)}</span><span>${rs(l.price * l.qty)}</span></div>`,
  )
  .join("")}
<hr>
<div class="row"><span>Subtotal</span><span>${rs(Number(bill.subtotal))}</span></div>
<div class="row"><span>Tax 18%</span><span>${rs(Number(bill.tax))}</span></div>
${Number(bill.discount) > 0 ? `<div class="row"><span>Discount</span><span>-${rs(Number(bill.discount))}</span></div>` : ""}
<hr>
<div class="row b big"><span>TOTAL</span><span>${rs(Number(bill.total))}</span></div>
<hr>
${qr ? `<div class="c">Scan to pay via UPI</div><img class="qr" src="${qr}"><div class="c">${esc(branch!.upi_id)}</div><hr>` : ""}
<div class="c">Thank you! Visit again.</div>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((i) => (i.complete ? null : new Promise((r) => ((i.onload = r), (i.onerror = r))))),
  );
  iframe.contentWindow!.focus();
  iframe.contentWindow!.print();
  setTimeout(() => iframe.remove(), 60_000);
}

/** Downloads the bill as an 80mm-wide PDF receipt. */
export async function downloadBillPdf(bill: Bill, branch: Branch | undefined) {
  const { jsPDF } = await import("jspdf");
  const qr = await qrFor(bill, branch);
  const W = 80;
  const lineH = 4.5;
  let height = 70 + bill.lines.length * lineH * 2 + (qr ? 50 : 0) + (branch?.logo_url ? 22 : 0);
  const doc = new jsPDF({ unit: "mm", format: [W, height] });
  let y = 6;
  const center = (t: string, size = 9, bold = false) => {
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.setFontSize(size);
    for (const part of doc.splitTextToSize(t, W - 8)) {
      doc.text(part, W / 2, y, { align: "center" });
      y += lineH;
    }
  };
  const row = (l: string, r: string, bold = false) => {
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.text(l, 4, y);
    doc.text(r, W - 4, y, { align: "right" });
    y += lineH;
  };
  const hr = () => {
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, y - 2, W - 4, y - 2);
    y += 2;
  };

  if (branch?.logo_url) {
    try {
      const fmt = branch.logo_url.includes("image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(branch.logo_url, fmt, W / 2 - 10, y - 2, 20, 20);
      y += 21;
    } catch {
      /* ignore bad logo */
    }
  }
  center(branch?.name ?? "Glow & Go", 13, true);
  if (branch?.address) center(branch.address, 8);
  if (branch?.phone) center("Ph: " + branch.phone, 8);
  hr();
  const d = new Date(bill.date);
  row(invNo(bill.number), d.toLocaleDateString("en-IN"));
  row("Customer:", bill.customer_name);
  if (bill.customer_phone) row("Phone:", bill.customer_phone);
  row("Staff:", bill.staff_name);
  hr();
  for (const l of bill.lines) {
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(l.name, W - 8)[0], 4, y);
    y += lineH;
    row(`  ${l.qty} x ${rs(l.price)}`, rs(l.price * l.qty));
  }
  hr();
  row("Subtotal", rs(Number(bill.subtotal)));
  row("Tax 18%", rs(Number(bill.tax)));
  if (Number(bill.discount) > 0) row("Discount", "-" + rs(Number(bill.discount)));
  hr();
  row("TOTAL", rs(Number(bill.total)), true);
  hr();
  if (qr && branch) {
    center("Scan to pay via UPI", 8);
    doc.addImage(qr, "PNG", W / 2 - 19, y - 2, 38, 38);
    y += 39;
    center(branch.upi_id, 8);
    hr();
  }
  center("Thank you! Visit again.", 9);
  doc.save(`${invNo(bill.number)}.pdf`);
  height = y;
}
