"use client";

import LotusIcon from "@/components/LotusIcon";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export default function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
      <div className="relative w-full max-w-xs bg-cream-50 rounded-3xl gold-border card-shadow px-8 py-8 flex flex-col items-center gap-4">
        <LotusIcon className="w-12 h-12 text-gold-500 animate-pulse" />
        {message && (
          <p className="text-sm font-semibold text-gold-800 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
