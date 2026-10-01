import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function upiLink(upiId: string, payee: string, amount: number) {
  const params = new URLSearchParams({ pa: upiId, pn: payee, cu: "INR" });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export function UpiQr({
  amount,
  upiId,
  payee,
  size = 140,
}: {
  amount: number;
  upiId: string;
  payee: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!upiId) return;
    let cancelled = false;
    QRCode.toDataURL(upiLink(upiId, payee, amount), { width: size * 2, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [amount, size, upiId, payee]);

  if (!upiId) {
    return (
      <p className="rounded-2xl bg-blush p-3 text-xs text-foreground/50 ring-1 ring-border">
        No UPI ID set for this branch — ask the admin to add one.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blush p-3 ring-1 ring-border">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`UPI QR for ${upiId}`}
          style={{ width: size, height: size }}
          className="rounded-xl ring-1 ring-border"
        />
      ) : (
        <div style={{ width: size, height: size }} className="animate-pulse rounded-xl bg-lilac-soft" />
      )}
      <div className="min-w-0 text-sm">
        <div className="font-medium">Scan to pay</div>
        <div className="truncate text-xs text-foreground/50">{upiId}</div>
        <div className="mt-1 text-xs text-foreground/50">GPay · PhonePe · Paytm · BHIM</div>
      </div>
    </div>
  );
}
