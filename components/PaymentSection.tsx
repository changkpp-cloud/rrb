import Link from "next/link";
import { Landmark } from "lucide-react";

export default function PaymentSection({ basePath = "" }: { basePath?: string }) {
  return (
    <section className="px-4 py-2 shrink-0">
      <div className="max-w-lg mx-auto">
        <Link
          href={`${basePath}/payment`}
          className="w-full gold-gradient text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          <Landmark className="w-5 h-5" />
          <span className="text-base">มอบหรีดร่วมบุญ</span>
        </Link>
      </div>
    </section>
  );
}
