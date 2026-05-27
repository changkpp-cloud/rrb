import React from "react";

interface LotusIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function LotusIcon({ className = "", style }: LotusIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M32 52C32 52 14 42 14 26C14 18 20 12 28 12C29.4 12 30.7 12.2 32 12.6C33.3 12.2 34.6 12 36 12C44 12 50 18 50 26C50 42 32 52 32 52Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M32 48C32 48 20 40 20 28C20 22 24 18 30 18C30.7 18 31.4 18.1 32 18.3C32.6 18.1 33.3 18 34 18C40 18 44 22 44 28C44 40 32 48 32 48Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M32 44C32 44 24 37 24 29C24 25 27 22 32 22C37 22 40 25 40 29C40 37 32 44 32 44Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M32 40C32 40 27 35 27 30C27 27.2 29.2 25 32 25C34.8 25 37 27.2 37 30C37 35 32 40 32 40Z"
        fill="currentColor"
      />
      <path
        d="M32 52L30 56H34L32 52Z"
        fill="currentColor"
        opacity="0.5"
      />
      <line
        x1="32"
        y1="52"
        x2="32"
        y2="58"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}
