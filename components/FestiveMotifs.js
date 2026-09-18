// Hand-drawn decorative motifs echoing the poster: a marigold garland,
// hanging lanterns, crossed dandiya sticks, and a diya (oil lamp). Plain
// inline SVG so there's no extra image asset to host or optimize.

export function MarigoldGarland({ height = 46, style }) {
  const flowers = 22;
  const w = 1200;
  const spacing = w / flowers;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", ...style }}>
      <path
        d={Array.from({ length: flowers - 1 }).map((_, i) => {
          const x1 = i * spacing + spacing / 2;
          const x2 = (i + 1) * spacing + spacing / 2;
          return `M${x1},4 Q${(x1 + x2) / 2},${height - 6} ${x2},4`;
        }).join(" ")}
        fill="none"
        stroke="#3f8f52"
        strokeWidth="2"
        opacity="0.6"
      />
      {Array.from({ length: flowers }).map((_, i) => {
        const x = i * spacing + spacing / 2;
        const dip = Math.sin((i / (flowers - 1)) * Math.PI) * (height - 20);
        const cy = 6 + dip * 0.55 + (i % 2 === 0 ? 2 : 8);
        const color = i % 2 === 0 ? "var(--orange)" : "var(--gold)";
        return (
          <g key={i} transform={`translate(${x}, ${cy})`}>
            {Array.from({ length: 6 }).map((_, p) => (
              <circle key={p} cx={Math.cos((p / 6) * 2 * Math.PI) * 5} cy={Math.sin((p / 6) * 2 * Math.PI) * 5} r="4.2" fill={color} />
            ))}
            <circle r="3" fill="#7a2b12" />
          </g>
        );
      })}
    </svg>
  );
}

export function Lantern({ size = 40, color = "var(--magenta)", style }) {
  return (
    <svg viewBox="0 0 40 64" width={size} height={size * 1.6} style={style}>
      <line x1="20" y1="0" x2="20" y2="8" stroke="var(--gold)" strokeWidth="2" />
      <rect x="10" y="8" width="20" height="6" rx="2" fill="var(--gold)" />
      <path d="M12 14 Q10 34 12 46 Q20 52 28 46 Q30 34 28 14 Z" fill={color} opacity="0.92" />
      <path d="M12 14 Q10 34 12 46 Q20 52 28 46 Q30 34 28 14 Z" fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.7" />
      <line x1="12" y1="22" x2="28" y2="22" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="38" x2="28" y2="38" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
      <rect x="14" y="46" width="12" height="4" rx="1.5" fill="var(--gold)" />
      <line x1="20" y1="50" x2="20" y2="58" stroke="var(--gold)" strokeWidth="1.5" />
      <circle cx="20" cy="61" r="3" fill="var(--gold)" />
    </svg>
  );
}

export function DandiyaSticks({ size = 56, style }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={style}>
      <g transform="rotate(45 40 40)">
        <rect x="8" y="37" width="64" height="6" rx="3" fill="var(--gold)" />
        <rect x="8" y="37" width="12" height="6" rx="3" fill="var(--magenta)" />
        <rect x="60" y="37" width="12" height="6" rx="3" fill="var(--magenta)" />
      </g>
      <g transform="rotate(-45 40 40)">
        <rect x="8" y="37" width="64" height="6" rx="3" fill="var(--orange)" />
        <rect x="8" y="37" width="12" height="6" rx="3" fill="var(--gold)" />
        <rect x="60" y="37" width="12" height="6" rx="3" fill="var(--gold)" />
      </g>
      <circle cx="40" cy="40" r="5" fill="#7a2b12" />
    </svg>
  );
}

export function Diya({ size = 34, style }) {
  return (
    <svg viewBox="0 0 40 44" width={size} height={size} style={style}>
      <ellipse cx="20" cy="30" rx="16" ry="7" fill="var(--gold-dim)" />
      <ellipse cx="20" cy="27" rx="16" ry="7" fill="var(--gold)" />
      <ellipse cx="20" cy="27" rx="11" ry="4" fill="#7a2b12" opacity="0.5" />
      <path d="M20 22 Q16 14 20 6 Q24 14 20 22 Z" fill="var(--orange)">
        <animate attributeName="d" dur="1.6s" repeatCount="indefinite"
          values="M20 22 Q16 14 20 6 Q24 14 20 22 Z;M20 22 Q17 13 20 4 Q23 13 20 22 Z;M20 22 Q16 14 20 6 Q24 14 20 22 Z" />
      </path>
      <path d="M20 20 Q18 15 20 10 Q22 15 20 20 Z" fill="var(--gold)" />
    </svg>
  );
}
