// Flower frame overlays for memorial portrait — 10 designs, cycles per memorial ID

// normalized viewBox: 0 0 100 133 (matches 3:4 ratio)
const VW = 100;
const VH = 133;
const CX = VW / 2;           // 50
const CY = VH / 2;           // 66.5
const ORX = 48.5;            // oval radius X — flower centers placed here
const ORY = 64.5;            // oval radius Y

// Deterministic 0-9 frame selector from memorial UUID
export function getFrameIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 10;
}

// Bezier teardrop petal pointing from origin upward
function petal(h: number, w: number): string {
  return `M 0,0 C ${w},${-h * 0.35} ${w * 0.85},${-h * 0.72} 0,${-h} C ${-w * 0.85},${-h * 0.72} ${-w},${-h * 0.35} 0,0 Z`;
}

// N positions evenly spaced around the portrait oval
function ring(n: number, offset = 0): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * 2 * Math.PI;
    return { x: CX + ORX * Math.cos(a), y: CY + ORY * Math.sin(a) };
  });
}

interface Cfg {
  n: number;        // flower count
  pc: number;       // petal count per flower
  ph: number;       // petal height (viewBox units)
  pw: number;       // petal half-width
  pf: string;       // petal fill
  po: number;       // petal opacity
  cf: string;       // center fill
  cr: number;       // center radius
  off?: number;     // ring start-angle offset (radians)
}

const FRAMES: Cfg[] = [
  // 1 เบญจมาศขาว (white chrysanthemum) — 16 flowers, 8 petals
  { n: 16, pc: 8, ph: 7.5, pw: 2.6, pf: "#ffffff", po: 0.92, cf: "#f0d060", cr: 2.2 },
  // 2 บัวขาว (white lotus) — 10 flowers, 6 petals, cream tint
  { n: 10, pc: 6, ph: 11, pw: 4.0, pf: "#fff8f2", po: 0.90, cf: "#e8c868", cr: 3.0, off: 0.3 },
  // 3 ลีลาวดี (plumeria) — 12 flowers, 5 petals
  { n: 12, pc: 5, ph: 9.5, pw: 3.8, pf: "#fffbf5", po: 0.88, cf: "#f5e080", cr: 2.6 },
  // 4 มะลิ (jasmine) — 8 large flowers, 5 petals, white
  { n: 8, pc: 5, ph: 13, pw: 5.0, pf: "#ffffff", po: 0.94, cf: "#f8e870", cr: 3.4, off: 0.2 },
  // 5 ดอกเล็กหนาแน่น (dense tiny) — 22 flowers, 5 petals
  { n: 22, pc: 5, ph: 5.5, pw: 2.0, pf: "#ffffff", po: 0.86, cf: "#f5d858", cr: 1.8 },
  // 6 กุหลาบ (rose style) — 10 flowers, 8 petals, warm cream
  { n: 10, pc: 8, ph: 8.5, pw: 3.0, pf: "#fff5f0", po: 0.90, cf: "#f0c880", cr: 2.4, off: 0.16 },
  // 7 กล้วยไม้ (orchid) — 6 large flowers, 5 petals, soft white-purple
  { n: 6, pc: 5, ph: 15, pw: 5.5, pf: "#fdf8ff", po: 0.92, cf: "#e8d0f8", cr: 4.0, off: 0.5 },
  // 8 ดอกลิลลี่ (lily) — 14 flowers, 6 petals, bright white
  { n: 14, pc: 6, ph: 8, pw: 2.8, pf: "#fffffe", po: 0.88, cf: "#e8c858", cr: 2.3, off: 0.22 },
  // 9 ดอกหลายกลีบ (multi-petal daisy) — 16 flowers, 10 petals
  { n: 16, pc: 10, ph: 6.5, pw: 2.0, pf: "#ffffff", po: 0.90, cf: "#f8d860", cr: 2.0, off: 0.1 },
  // 10 ดาวเรือง (marigold style) — 12 flowers, 12 petals, golden cream
  { n: 12, pc: 12, ph: 7.0, pw: 2.2, pf: "#fff9e0", po: 0.88, cf: "#f0c040", cr: 2.0 },
];

interface Props {
  index: number; // 0-9
}

export default function MemorialPortraitFrame({ index }: Props) {
  const c = FRAMES[index % 10];
  const positions = ring(c.n, c.off ?? Math.PI / (c.n * 2));
  const p = petal(c.ph, c.pw);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {positions.map(({ x, y }, i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          {Array.from({ length: c.pc }, (_, k) => (
            <path
              key={k}
              d={p}
              fill={c.pf}
              opacity={c.po}
              transform={`rotate(${(k / c.pc) * 360})`}
            />
          ))}
          <circle cx={0} cy={0} r={c.cr} fill={c.cf} />
        </g>
      ))}
    </svg>
  );
}
