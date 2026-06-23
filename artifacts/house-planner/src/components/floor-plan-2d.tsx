import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan2DProps {
  result: FloorPlanResult;
}

const ROOM_COLORS: Record<string, string> = {
  "living": "#FF6B6B", "drawing": "#FF6B6B", "hall": "#FF6B6B",
  "master bedroom": "#4ECDC4", "bedroom 1": "#4ECDC4",
  "bedroom": "#45B7D1",
  "bathroom": "#96CEB4", "toilet": "#96CEB4", "washroom": "#96CEB4",
  "kitchen": "#FFEAA7",
  "dining": "#DDA0DD",
  "pooja": "#FFB347", "mandir": "#FFB347",
  "study": "#B39DDB", "office": "#B39DDB",
  "parking": "#90A4AE", "garage": "#90A4AE",
  "garden": "#81C784", "lawn": "#81C784", "courtyard": "#A5D6A7",
  "staircase": "#BCAAA4", "stairs": "#BCAAA4",
  "balcony": "#F48FB1",
  "lobby": "#FFD54F", "foyer": "#FFD54F",
  "passage": "#CE93D8", "corridor": "#CE93D8",
  "utility": "#80CBC4", "store": "#A1887F",
};

const ROOM_ICONS: Record<string, string> = {
  "living": "🛋", "drawing": "🛋", "hall": "🛋",
  "master bedroom": "🛏", "bedroom": "🛏",
  "kitchen": "🍳", "dining": "🍽",
  "bathroom": "🚿", "toilet": "🚽", "washroom": "🚿",
  "pooja": "🪔", "mandir": "🪔",
  "study": "📚", "office": "💻",
  "parking": "🚗", "garage": "🚗",
  "garden": "🌿", "lawn": "🌳", "courtyard": "🌸",
  "staircase": "🪜", "stairs": "🪜",
  "balcony": "🌅",
  "lobby": "🚪", "foyer": "🚪",
  "store": "📦", "utility": "🔧",
};

function getRoomColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  const palette = ["#FF8A80","#82B1FF","#CCFF90","#FFD180","#EA80FC","#80D8FF"];
  let h = 0; for (const c of lower) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
  return palette[Math.abs(h) % palette.length];
}

function getRoomIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ROOM_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "";
}

function darken(hex: string, pct = 0.35): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - pct)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - pct)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - pct)));
  return `rgb(${r},${g},${b})`;
}

export function FloorPlan2D({ result }: FloorPlan2DProps) {
  const [activeFloor, setActiveFloor] = React.useState(0);
  const [hovered, setHovered] = React.useState<number | null>(null);

  const floors = useMemo(() => Math.max(1, ...result.rooms.map(r => r.floor + 1)), [result.rooms]);
  const roomsOnFloor = useMemo(() => result.rooms.filter(r => r.floor === activeFloor), [result.rooms, activeFloor]);

  // SVG coordinate system: 1 plot-unit = scale px
  const PAD = 14;
  const vw = result.plotWidth + PAD * 2;
  const vh = result.plotLength + PAD * 2;

  const facing = (result as any).facing ?? "North";
  const facingColors: Record<string, string> = {
    North: "#3B82F6", South: "#EF4444", East: "#F59E0B", West: "#10B981",
    "North-East": "#8B5CF6", "North-West": "#06B6D4", "South-East": "#F97316", "South-West": "#EC4899",
  };
  const fColor = facingColors[facing] ?? "#374151";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Floor tabs */}
      {floors > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: floors }).map((_, i) => (
            <button key={i} onClick={() => setActiveFloor(i)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                activeFloor === i ? "bg-orange-500 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-orange-50"
              }`}>
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </button>
          ))}
        </div>
      )}

      {/* SVG Plan */}
      <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-md bg-slate-50">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          className="w-full"
          style={{ display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Clip all rooms to plot area */}
            <clipPath id="plot-clip">
              <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength} />
            </clipPath>

            {/* Grid background */}
            <pattern id="grid-bg" patternUnits="userSpaceOnUse" width="5" height="5">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="0.4"/>
            </pattern>

            {/* Parking hatch */}
            <pattern id="hatch-parking" patternUnits="userSpaceOnUse" width="3" height="3">
              <line x1="0" y1="3" x2="3" y2="0" stroke="#607D8B" strokeWidth="0.5" strokeOpacity="0.4"/>
            </pattern>

            {/* Garden dots */}
            <pattern id="dots-garden" patternUnits="userSpaceOnUse" width="3" height="3">
              <circle cx="1.5" cy="1.5" r="0.5" fill="#4CAF50" fillOpacity="0.4"/>
            </pattern>

            {/* Room gradients */}
            {roomsOnFloor.map((room, i) => {
              const c = room.color || getRoomColor(room.name);
              return (
                <linearGradient key={i} id={`rg-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={c} stopOpacity="1" />
                  <stop offset="100%" stopColor={darken(c, 0.18)} stopOpacity="1" />
                </linearGradient>
              );
            })}

            {/* Shadow */}
            <filter id="fshadow">
              <feDropShadow dx="1" dy="1.5" stdDeviation="1.2" floodOpacity="0.15"/>
            </filter>
          </defs>

          {/* Background */}
          <rect width={vw} height={vh} fill="url(#grid-bg)" />

          {/* Plot outer shadow */}
          <rect x={PAD+1} y={PAD+1.5} width={result.plotWidth} height={result.plotLength}
            fill="rgba(0,0,0,0.06)" rx="1" />

          {/* Plot area (white base) */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}
            fill="white" stroke="#1e293b" strokeWidth="1.2" rx="0.5" />

          {/* Dimension arrows */}
          {/* Width (top) */}
          <g>
            <line x1={PAD} y1={PAD - 4} x2={PAD + result.plotWidth} y2={PAD - 4} stroke="#94a3b8" strokeWidth="0.5" markerEnd="url(#arr)" markerStart="url(#arr)"/>
            <text x={PAD + result.plotWidth / 2} y={PAD - 5.5} textAnchor="middle" fontSize="3.8" fill="#64748b" fontFamily="sans-serif" fontWeight="700">{result.plotWidth} ft</text>
          </g>
          {/* Length (left) */}
          <text x={PAD - 5} y={PAD + result.plotLength / 2} textAnchor="middle" fontSize="3.8" fill="#64748b" fontFamily="sans-serif" fontWeight="700"
            transform={`rotate(-90, ${PAD - 5}, ${PAD + result.plotLength / 2})`}>{result.plotLength} ft</text>

          {/* ── ROOMS (clipped to plot boundary) ── */}
          <g clipPath="url(#plot-clip)">
            {roomsOnFloor.map((room, i) => {
              const rx = room.x + PAD;
              const ry = room.y + PAD;
              const rw = room.width;
              const rl = room.length;
              const sqft = rw * rl;
              const lower = room.name.toLowerCase();
              const isParking = lower.includes("parking") || lower.includes("garage");
              const isGarden = lower.includes("garden") || lower.includes("lawn") || lower.includes("courtyard");
              const isStair = lower.includes("stair");
              const icon = getRoomIcon(room.name);
              const baseColor = room.color || getRoomColor(room.name);
              const borderColor = darken(baseColor, 0.4);
              const fs = Math.max(2, Math.min(rw, rl) * 0.14);
              const iconFs = Math.max(2.5, Math.min(rw, rl) * 0.22);
              const isHov = hovered === i;

              return (
                <g key={i}
                  onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                  filter={isHov ? "url(#fshadow)" : undefined}
                >
                  {/* Fill */}
                  <rect x={rx} y={ry} width={rw} height={rl} fill={`url(#rg-${i})`} />
                  {/* Texture overlay */}
                  {isParking && <rect x={rx} y={ry} width={rw} height={rl} fill="url(#hatch-parking)" />}
                  {isGarden && <rect x={rx} y={ry} width={rw} height={rl} fill="url(#dots-garden)" />}
                  {/* Staircase diagonal lines */}
                  {isStair && Array.from({ length: Math.ceil(rl / 2) }).map((_, si) => (
                    <line key={si} x1={rx} y1={ry + si * 2 + 1} x2={rx + rw} y2={ry + si * 2 + 1}
                      stroke="#78716c" strokeWidth="0.4" strokeOpacity="0.6"/>
                  ))}

                  {/* Border — thicker on hover */}
                  <rect x={rx} y={ry} width={rw} height={rl} fill="none"
                    stroke={isHov ? "#1e293b" : borderColor} strokeWidth={isHov ? "0.9" : "0.5"} />

                  {/* Wall accent lines (top + left) */}
                  <line x1={rx} y1={ry} x2={rx + rw} y2={ry} stroke={borderColor} strokeWidth="1.0" />
                  <line x1={rx} y1={ry} x2={rx} y2={ry + rl} stroke={borderColor} strokeWidth="1.0" />

                  {/* Icon */}
                  {!isStair && icon && rw > 5 && rl > 5 && (
                    <text x={rx + rw / 2} y={ry + rl / 2 - fs * 1.0}
                      textAnchor="middle" dominantBaseline="middle" fontSize={iconFs}>{icon}</text>
                  )}

                  {/* Room name */}
                  <text x={rx + rw / 2}
                    y={ry + rl / 2 + (icon && rw > 5 && rl > 5 ? iconFs * 0.55 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#1e293b" fontSize={fs} fontWeight="700" fontFamily="sans-serif">
                    {room.name}
                  </text>

                  {/* Dimensions */}
                  {rw > 7 && rl > 5 && (
                    <text x={rx + rw / 2}
                      y={ry + rl / 2 + (icon && rw > 5 && rl > 5 ? iconFs * 0.55 : 0) + fs * 1.5}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="#374151" fontSize={fs * 0.75} fontFamily="sans-serif" opacity="0.8">
                      {rw}×{rl} · {sqft} sqft
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── OUTER WALL BORDER (drawn on top of rooms) ── */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}
            fill="none" stroke="#1e293b" strokeWidth="1.5" rx="0.5" />

          {/* Facing badge pill (bottom-left, inside plot) */}
          <g transform={`translate(${PAD + 2}, ${PAD + result.plotLength - 7})`}>
            <rect x="0" y="0" width={facing.length * 2.2 + 10} height="6" rx="3" fill={fColor} />
            <text x={(facing.length * 2.2 + 10) / 2} y="3" textAnchor="middle" dominantBaseline="middle"
              fontSize="2.8" fill="white" fontFamily="sans-serif" fontWeight="700">
              {facing} Facing
            </text>
          </g>

          {/* Compass rose (top-right, inside plot) */}
          <g transform={`translate(${PAD + result.plotWidth - 9}, ${PAD + 9})`}>
            <circle cx="0" cy="0" r="7" fill="white" fillOpacity="0.92" stroke="#e2e8f0" strokeWidth="0.6"/>
            {/* N pointer red */}
            <polygon points="0,-5.5 1.2,0.5 0,-1.5 -1.2,0.5" fill="#ef4444"/>
            {/* S pointer gray */}
            <polygon points="0,5.5 1.2,-0.5 0,1.5 -1.2,-0.5" fill="#94a3b8"/>
            {/* Cardinal labels */}
            <text x="0" y="-6.5" textAnchor="middle" dominantBaseline="middle" fontSize="2" fill="#ef4444" fontWeight="800" fontFamily="sans-serif">N</text>
            <text x="0" y="7.2" textAnchor="middle" dominantBaseline="middle" fontSize="2" fill="#94a3b8" fontWeight="700" fontFamily="sans-serif">S</text>
            <text x="7.2" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="2" fill="#64748b" fontWeight="700" fontFamily="sans-serif">E</text>
            <text x="-7.2" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="2" fill="#64748b" fontWeight="700" fontFamily="sans-serif">W</text>
          </g>
        </svg>
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-1.5">
        {roomsOnFloor.map((room, i) => {
          const c = room.color || getRoomColor(room.name);
          const icon = getRoomIcon(room.name);
          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${hovered === i ? "scale-105 shadow" : ""}`}
              style={{ backgroundColor: c + "30", borderColor: c, color: darken(c, 0.5) }}>
              {icon && <span>{icon}</span>}
              <span>{room.name}</span>
              <span className="opacity-60">{room.width * room.length}sqft</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
