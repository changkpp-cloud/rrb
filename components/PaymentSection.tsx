import Link from "next/link";
import { Landmark } from "lucide-react";

export default function PaymentSection({ basePath = "" }: { basePath?: string }) {
  return (
    <section className="px-4 py-3 pb-5 shrink-0">
      <div className="max-w-lg mx-auto">
        <Link
          href={`${basePath}/payment`}
          className="ios-cta w-full gold-gradient text-white font-bold flex items-center justify-center gap-3 shadow-lg hover:opacity-92 active:scale-[0.97] transition-all duration-150"
          style={{
            boxShadow: "0 6px 28px rgba(176,120,32,0.28), 0 2px 6px rgba(176,120,32,0.14), inset 0 1px 0 rgba(255,255,255,0.18)",
            fontSize: "16px",
            letterSpacing: "-0.01em",
          }}
        >
          <Landmark className="w-5 h-5" strokeWidth={2} />
          มอบหรีดร่วมบุญ
        </Link>
      </div>
    </section>
  );
}
