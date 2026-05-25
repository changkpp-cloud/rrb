"use client";

import { useRef, useEffect, useState } from "react";
import WreathBoard from "./WreathBoard";
import PaymentSection from "./PaymentSection";

export default function HomeScrollClient() {
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
        <WreathBoard />
      </div>
      <div
        style={{
          opacity: paymentVisible ? 1 : 0,
          transform: paymentVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: paymentVisible ? "auto" : "none",
        }}
      >
        <PaymentSection />
      </div>
    </>
  );
}
