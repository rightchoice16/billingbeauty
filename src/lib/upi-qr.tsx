import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const UPI_ID = "udhayaraj24-9@okicici";
export const PAYEE_NAME = "Glow & Go";

export function upiLink(amount: number) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    cu: "INR",
  });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export function UpiQr({ amount, size = 140 }: { amount: number; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(upiLink(amount), {
      width: size * 2,
      margin: 1,
      color: { dark: "#3a1f3f", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [amount, size]);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blush p-3 ring-1 ring-border">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`UPI QR for ${UPI_ID}`}
          style={{ width: size, height: size }}
          className="rounded-xl ring-1 ring-border"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="animate-pulse rounded-xl bg-lilac-soft"
        />
      )}
      <div className="min-w-0 text-sm">
        <div className="font-medium">Scan to pay</div>
        <div className="truncate text-xs text-foreground/50">{UPI_ID}</div>
        <div className="mt-1 text-xs text-foreground/50">
          GPay · PhonePe · Paytm · BHIM
        </div>
      </div>
    </div>
  );
}
