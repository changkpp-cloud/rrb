"use client";

import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";

interface Props {
  phone: string;
  size?: number;
}

export default function PromptPayQR({ phone, size = 112 }: Props) {
  // Clean phone: remove dashes and spaces, keep digits
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return null;

  try {
    const payload = generatePayload(cleaned, { amount: undefined });
    return (
      <QRCodeSVG
        value={payload}
        size={size}
        level="M"
        includeMargin={false}
        style={{ width: "100%", height: "100%" }}
      />
    );
  } catch {
    return null;
  }
}
