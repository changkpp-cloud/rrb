"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "gold-gradient text-white shadow-md hover:opacity-90 active:scale-[0.98]",
  secondary:
    "border-2 border-gold-300 bg-cream-50 text-gold-700 hover:bg-cream-100 active:scale-[0.98]",
  danger:
    "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98]",
  ghost:
    "bg-transparent text-gold-500 hover:bg-gold-50 active:scale-[0.98]",
};

const SIZE: Record<Size, string> = {
  sm: "py-2 px-3 text-xs rounded-xl min-h-[40px]",
  md: "py-3 px-4 text-sm rounded-2xl min-h-[44px]",
  lg: "py-3.5 px-5 text-base rounded-2xl min-h-[52px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
