type Status = "pending" | "confirmed" | "rejected" | "active" | "draft" | "closed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const CFG: Record<Status, { label: string; cls: string }> = {
  pending:   { label: "รอตรวจสลิป", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "ยืนยันแล้ว", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  rejected:  { label: "ปฏิเสธ",     cls: "bg-red-50 text-red-600 border border-red-200" },
  active:    { label: "เปิดงาน",    cls: "bg-gold-50 text-gold-700 border border-gold-200" },
  draft:     { label: "ร่าง",       cls: "bg-cream-100 text-gold-500 border border-gold-100" },
  closed:    { label: "ปิดแล้ว",    cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { label, cls } = CFG[status];
  return (
    <span
      className={[
        "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full",
        cls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
}
