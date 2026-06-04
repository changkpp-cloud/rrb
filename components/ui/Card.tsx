import type { HTMLAttributes } from "react";

type Padding = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

const PAD: Record<Padding, string> = {
  sm: "px-3 py-3",
  md: "px-4 py-4",
  lg: "px-5 py-5",
};

export default function Card({
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "bg-cream-50 rounded-2xl gold-border card-shadow",
        PAD[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
