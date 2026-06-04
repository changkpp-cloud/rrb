const SHIMMER_BG = {
  background:
    "linear-gradient(90deg,#f0e8d8 25%,#ecdcc4 50%,#f0e8d8 75%)",
  backgroundSize: "200% auto",
};

function Line({ w = "full" }: { w?: "full" | "3/4" | "1/2" | "1/3" }) {
  const wc = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
  }[w];
  return (
    <div
      className={`h-3 rounded-full ${wc} animate-shimmer`}
      style={SHIMMER_BG}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  hasAvatar?: boolean;
  className?: string;
}

export default function SkeletonCard({
  lines = 3,
  hasAvatar = false,
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={[
        "bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        {hasAvatar && (
          <div
            className="w-10 h-10 rounded-full shrink-0 animate-shimmer"
            style={SHIMMER_BG}
          />
        )}
        <div className="flex-1 space-y-2.5">
          <Line w="3/4" />
          {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
            <Line key={i} w={i % 2 === 0 ? "full" : "1/2"} />
          ))}
        </div>
      </div>
    </div>
  );
}
