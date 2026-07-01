"use client";

import { useRef, useEffect, useState } from "react";
import DynamicVirtualBoard, { type BoardDonation } from "./DynamicVirtualBoard";
import PaymentSection from "./PaymentSection";

export default function HomeScrollClient({
  basePath = "",
  boardImageUrl,
  boardCaption,
  boardDonations = [],
}: {
  basePath?: string;
  boardImageUrl?: string | null;
  boardCaption?: string | null;
  boardDonations?: BoardDonation[];
}) {
  const wreathRef = useRef<HTMLDivElement>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);

  useEffect(() => {
    const el = wreathRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPaymentVisible(true);
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={wreathRef}>
        <DynamicVirtualBoard
          boardImageUrl={boardImageUrl}
          boardCaption={boardCaption}
          donations={boardDonations}
        />
      </div>
      <div
        style={{
          opacity: paymentVisible ? 1 : 0,
          transform: paymentVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: paymentVisible ? "auto" : "none",
        }}
      >
        <PaymentSection basePath={basePath} />
      </div>
    </>
  );
}
