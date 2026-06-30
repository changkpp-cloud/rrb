import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="shrink-0 text-center pb-6 pt-2 px-4">
      <p
        className="text-gold-600 font-semibold"
        style={{ fontSize: "13px", letterSpacing: "0.04em" }}
      >
        เปลี่ยนพวงหรีดเป็นทุน ร่วมบุญเจ้าภาพ
      </p>
      <p
        className="text-gold-400 font-medium mt-1"
        style={{ fontSize: "11px", letterSpacing: "0.08em" }}
      >
        ลดขยะต้นทาง สร้างสวัสดิการผู้วายชนม์
      </p>
      <Link
        href="/privacy"
        className="mt-2 inline-block text-gold-500 underline underline-offset-2 hover:text-gold-700"
        style={{ fontSize: "11px" }}
      >
        นโยบายความเป็นส่วนตัว
      </Link>
    </footer>
  );
}
