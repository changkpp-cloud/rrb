import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ElementType, ReactNode } from "react";

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertBoxProps {
  variant: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const CFG: Record<
  AlertVariant,
  { icon: ElementType; bg: string; border: string; tc: string; bc: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border border-emerald-200",
    tc: "text-emerald-800",
    bc: "text-emerald-700",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border border-amber-200",
    tc: "text-amber-800",
    bc: "text-amber-700",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border border-red-200",
    tc: "text-red-800",
    bc: "text-red-600",
  },
  info: {
    icon: Info,
    bg: "bg-gold-50",
    border: "border border-gold-200",
    tc: "text-gold-800",
    bc: "text-gold-700",
  },
};

export default function AlertBox({
  variant,
  title,
  children,
  className = "",
}: AlertBoxProps) {
  const { icon: Icon, bg, border, tc, bc } = CFG[variant];
  return (
    <div
      className={[
        "rounded-2xl px-4 py-3 flex items-start gap-3",
        bg,
        border,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${bc}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-xs font-semibold ${tc} mb-0.5`}>{title}</p>
        )}
        {children && (
          <div className={`text-xs ${bc} leading-relaxed`}>{children}</div>
        )}
      </div>
    </div>
  );
}
