import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface Room { name: string; x: number; y: number; width: number; length: number; floor: number; color?: string; }
interface FloorPlan2DProps { result: FloorPlanResult; }

// ── palette ──────────────────────────────────────────────────
const BG        = "#2c3327";
const WALL_CLR  = "#a76a53";
const ROOM_FILL = "#f5f0e8";
const WALL_T    = 0.7;   // visual wall thickness in plot-units
const PAD       = 18;

// ── furniture helpers ─────────────────────────────────────────
type FEl = React.ReactElement;

function Bed(rx: number, ry: number, rw: number, rl: number): FEl {
  const bw = Math.min(rw * 0.62, 5.5), bl = Math.min(rl * 0.65, 7);
  const bx = rx + (rw - bw) / 2, by = ry + rl * 0.18;
  const hw = bw, hh = Math.min(rl * 0.12, 1.2);
  return (
    <g key="bed" stroke="#a76a53" strokeWidth="0.25" fill="none">
      <rect x={bx} y={by} width={bw} height={bl} rx="0.3" fill="#e8ddd0" stroke="#a76a53" strokeWidth="0.3"/>
      <rect x={bx} y={by} width={hw} height={hh} rx="0.2" fill="#c9b49a"/>
      <ellipse cx={bx + bw * 0.28} cy={by + bl * 0.12} rx={bw * 0.15} ry={hh * 0.4} fill="#d4c4b0"/>
      <ellipse cx={bx + bw * 0.72} cy={by + bl * 0.12} rx={bw * 0.15} ry={hh * 0.4} fill="#d4c4b0"/>
      <rect x={bx + bw * 0.08} y={by + hh + bl * 0.04} width={bw * 0.84} height={bl * 0.88} rx="0.2" fill="#ede4d8"/>
      {/* wardrobe */}
      <rect x={rx + rw * 0.05} y={ry + rl * 0.78} width={rw * 0.35} height={rl * 0.18} fill="#ddd4c8" stroke="#a76a53" strokeWidth="0.25"/>
      <line x1={rx + rw * 0.225} y1={ry + rl * 0.78} x2={rx + rw * 0.225} y2={ry + rl * 0.96} stroke="#a76a53" strokeWidth="0.2"/>
    </g>
  );
}

function Sofa(rx: number, ry: number, rw: number, rl: number): FEl {
  const sw = Math.min(rw * 0.65, 8), sd = Math.min(rl * 0.22, 2.8);
  const sx = rx + (rw - sw) / 2, sy = ry + rl * 0.55;
  return (
    <g key="sofa" stroke="#a76a53" strokeWidth="0.25" fill="none">
      {/* TV unit */}
      <rect x={rx + rw * 0.15} y={ry + rl * 0.08} width={rw * 0.7} height={rl * 0.1} fill="#c8bfb3" stroke="#a76a53" strokeWidth="0.3"/>
      {/* coffee table */}
      <rect x={sx + sw * 0.2} y={sy - rl * 0.12} width={sw * 0.6} height={rl * 0.1} rx="0.3" fill="#ddd4c0" stroke="#a76a53" strokeWidth="0.25"/>
      {/* sofa base */}
      <rect x={sx} y={sy} width={sw} height={sd} rx="0.4" fill="#c9bfb2" stroke="#a76a53" strokeWidth="0.3"/>
      {/* sofa back */}
      <rect x={sx} y={sy} width={sw} height={sd * 0.3} rx="0.3" fill="#b8aea0"/>
      {/* cushions */}
      {[0, 1, 2].map(i => (
        <rect key={i} x={sx + i * (sw / 3) + 0.2} y={sy + sd * 0.32} width={sw / 3 - 0.4} height={sd * 0.6} rx="0.3" fill="#d4c9b8"/>
      ))}
    </g>
  );
}

function Kitchen(rx: number, ry: number, rw: number, rl: number): FEl {
  const cw = Math.min(rw * 0.9, 12);
  return (
    <g key="kit" stroke="#a76a53" strokeWidth="0.25" fill="none">
      {/* counter top */}
      <rect x={rx + (rw - cw) / 2} y={ry + WALL_T} width={cw} height={rl * 0.22} fill="#c8bfb3" stroke="#a76a53" strokeWidth="0.3"/>
      {/* stove burners */}
      {[0, 1, 2, 3].map(i => <circle key={i} cx={rx + rw * 0.25 + (i % 2) * rw * 0.18} cy={ry + rl * 0.11 + Math.floor(i / 2) * rl * 0.09} r={rl * 0.04} fill="#888" stroke="#555" strokeWidth="0.2"/>)}
      {/* sink */}
      <rect x={rx + rw * 0.65} y={ry + rl * 0.04} width={rw * 0.2} height={rl * 0.14} rx="0.2" fill="#d4d0cc" stroke="#888" strokeWidth="0.2"/>
      <circle cx={rx + rw * 0.75} cy={ry + rl * 0.03} r={0.3} fill="#888"/>
    </g>
  );
}

function Bathroom(rx: number, ry: number, rw: number, rl: number): FEl {
  const cx = rx + rw / 2, cy = ry + rl / 2;
  return (
    <g key="bath" stroke="#a76a53" strokeWidth="0.25" fill="none">
      {/* WC */}
      <rect x={rx + WALL_T} y={ry + WALL_T} width={rw * 0.42} height={rl * 0.32} rx="0.4" fill="#e8e4e0" stroke="#a76a53" strokeWidth="0.25"/>
      <ellipse cx={rx + WALL_T + rw * 0.21} cy={ry + WALL_T + rl * 0.22} rx={rw * 0.16} ry={rl * 0.1} fill="#d4d0cc"/>
      {/* basin */}
      <ellipse cx={cx} cy={ry + rl * 0.75} rx={rw * 0.2} ry={rl * 0.12} fill="#e8e4e0" stroke="#a76a53" strokeWidth="0.25"/>
      <circle cx={cx} cy={ry + rl * 0.75} r={0.25} fill="#888"/>
      {/* shower area */}
      <rect x={rx + rw * 0.55} y={ry + WALL_T} width={rw * 0.4} height={rl * 0.35} strokeDasharray="0.4,0.3" stroke="#a76a53" strokeWidth="0.25" fill="#edf5f8"/>
      <circle cx={rx + rw * 0.75} cy={ry + rl * 0.18} r={0.5} fill="none" stroke="#a76a53" strokeWidth="0.2"/>
    </g>
  );
}

function DiningTable(rx: number, ry: number, rw: number, rl: number): FEl {
  const tw = Math.min(rw * 0.55, 5.5), td = Math.min(rl * 0.5, 4.5);
  const tx = rx + (rw - tw) / 2, ty = ry + (rl - td) / 2;
  const chairs = [
    [tx + tw / 2, ty - 0.8, tw * 0.28, 0.7],
    [tx + tw / 2, ty + td + 0.1, tw * 0.28, 0.7],
    [tx - 0.8,   ty + td / 2, 0.7, td * 0.28],
    [tx + tw + 0.1, ty + td / 2, 0.7, td * 0.28],
    [tx + tw * 0.22, ty - 0.8, tw * 0.22, 0.65],
    [tx + tw * 0.78 - tw * 0.22, ty - 0.8, tw * 0.22, 0.65],
  ];
  return (
    <g key="dining" stroke="#a76a53" strokeWidth="0.25" fill="none">
      <ellipse cx={tx + tw / 2} cy={ty + td / 2} rx={tw / 2} ry={td / 2} fill="#ddd4c0" stroke="#a76a53" strokeWidth="0.3"/>
      {chairs.map(([cx, cy, cw, ch], i) => <rect key={i} x={cx as number} y={cy as number} width={cw as number} height={ch as number} rx="0.15" fill="#c8bfb3" stroke="#a76a53" strokeWidth="0.2"/>)}
    </g>
  );
}

function Parking(rx: number, ry: number, rw: number, rl: number): FEl {
  const cw = Math.min(rw * 0.7, 4.5), cl = Math.min(rl * 0.55, 2.2);
  const cx = rx + (rw - cw) / 2, cy = ry + (rl - cl) / 2;
  return (
    <g key="park" stroke="#a76a53" strokeWidth="0.25" fill="none">
      <rect x={cx} y={cy} width={cw} height={cl} rx="0.4" fill="#c8d0d4" stroke="#a76a53" strokeWidth="0.3"/>
      <rect x={cx + cw * 0.15} y={cy + cl * 0.1} width={cw * 0.7} height={cl * 0.5} rx="0.3" fill="#d4dce0"/>
      {[0.18, 0.82].map(px => [0.08, 0.92].map((py, j) =>
        <ellipse key={`${px}-${j}`} cx={cx + cw * px} cy={cy + cl * py} rx={Math.min(cw * 0.06, 0.35)} ry={Math.min(cl * 0.09, 0.3)} fill="#555"/>
      ))}
      <text x={rx + rw / 2} y={ry + rl * 0.1} textAnchor="middle" fontSize="1.8" fill="#6b7c8a" fontWeight="700" fontFamily="sans-serif">P</text>
    </g>
  );
}

function Garden(rx: number, ry: number, rw: number, rl: number): FEl {
  const count = Math.min(Math.floor(rw * rl / 20), 6);
  const positions = Array.from({ length: count }, (_, i) => ({
    x: rx + 1.5 + (i % 3) * (rw - 3) / 2.5,
    y: ry + 1.5 + Math.floor(i / 3) * (rl - 3) / 1.5,
  }));
  return (
    <g key="garden" fill="none">
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={1.2} fill="#5a7a4a" opacity="0.6"/>
          <circle cx={p.x} cy={p.y} r={0.7} fill="#6a9a58" opacity="0.8"/>
        </g>
      ))}
    </g>
  );
}

function StaircaseSymbol(rx: number, ry: number, rw: number, rl: number): FEl {
  const steps = 8;
  const sh = (rl - WALL_T * 2) / steps;
  return (
    <g key="stair" stroke="#a76a53" strokeWidth="0.2" fill="none">
      {Array.from({ length: steps }).map((_, i) => (
        <line key={i} x1={rx + WALL_T} y1={ry + WALL_T + i * sh} x2={rx + rw - WALL_T} y2={ry + WALL_T + i * sh} stroke="#a76a53" strokeWidth="0.2"/>
      ))}
      <polygon points={`${rx + rw * 0.45},${ry + WALL_T} ${rx + rw * 0.55},${ry + WALL_T} ${rx + rw * 0.5},${ry + WALL_T + 1}`} fill="#a76a53" opacity="0.7"/>
    </g>
  );
}

function getRoomFurniture(room: Room): FEl | null {
  const n = room.name.toLowerCase();
  const { x, y, width: w, length: l } = room;
  if (n.includes("bedroom") || n.includes("master")) return Bed(x, y, w, l);
  if (n.includes("living") || n.includes("drawing") || n.includes("hall")) return Sofa(x, y, w, l);
  if (n.includes("kitchen")) return Kitchen(x, y, w, l);
  if (n.includes("bathroom") || n.includes("toilet") || n.includes("washroom")) return Bathroom(x, y, w, l);
  if (n.includes("dining")) return DiningTable(x, y, w, l);
  if (n.includes("parking") || n.includes("garage")) return Parking(x, y, w, l);
  if (n.includes("garden") || n.includes("lawn")) return Garden(x, y, w, l);
  if (n.includes("stair")) return StaircaseSymbol(x, y, w, l);
  return null;
}

// ── door arc ──────────────────────────────────────────────────
function DoorArc({ room, allRooms }: { room: Room; allRooms: Room[] }) {
  const n = room.name.toLowerCase();
  if (n.includes("stair") || n.includes("parking") || n.includes("garden") || n.includes("balcony")) return null;
  // Place door at center of front wall (smallest y side)
  const dw = 2.5;
  const dx = room.x + room.width / 2 - dw / 2;
  const dy = room.y;
  // Swing arc: quarter circle
  const r = dw;
  return (
    <g stroke={WALL_CLR} strokeWidth="0.25" fill="none" opacity="0.8">
      <line x1={dx} y1={dy} x2={dx} y2={dy + r} stroke={WALL_CLR} strokeWidth="0.2"/>
      <path d={`M ${dx} ${dy + r} A ${r} ${r} 0 0 1 ${dx + r} ${dy}`} strokeDasharray="0.4,0.3"/>
    </g>
  );
}

// ── window symbol ────────────────────────────────────────────
function WindowSymbol({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  if (n.includes("bathroom") || n.includes("stair") || n.includes("parking")) return null;
  const ww = Math.min(room.width * 0.4, 3.5);
  const wx = room.x + (room.width - ww) / 2;
  return (
    <g stroke={WALL_CLR} strokeWidth="0.3" fill="#87ceeb" fillOpacity="0.25">
      <rect x={wx} y={room.y - 0.15} width={ww} height={0.8}/>
      <line x1={wx + ww / 3} y1={room.y - 0.15} x2={wx + ww / 3} y2={room.y + 0.65} stroke={WALL_CLR} strokeWidth="0.15"/>
      <line x1={wx + ww * 2 / 3} y1={room.y - 0.15} x2={wx + ww * 2 / 3} y2={room.y + 0.65} stroke={WALL_CLR} strokeWidth="0.15"/>
    </g>
  );
}

// ── dimension line ────────────────────────────────────────────
function DimLine({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <g stroke="#8fb08a" strokeWidth="0.4" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2}/>
      <line x1={x1 - 1} y1={y1} x2={x1 + 1} y2={y1} strokeWidth="0.3"/>
      <line x1={x2 - 1} y1={y2} x2={x2 + 1} y2={y2} strokeWidth="0.3"/>
      <text x={mx} y={my - 1.2} textAnchor="middle" fontSize="3.2" fill="#8fb08a" fontFamily="sans-serif" fontWeight="600" stroke="none">{label}</text>
    </g>
  );
}

// ── compass ───────────────────────────────────────────────────
function Compass({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#1e2a1a" stroke="#8fb08a" strokeWidth="0.4"/>
      <circle cx={cx} cy={cy} r={r * 0.85} fill="none" stroke="#8fb08a" strokeWidth="0.2" strokeDasharray="1,1"/>
      {/* N pointer red */}
      <polygon points={`${cx},${cy - r * 0.7} ${cx - r * 0.18},${cy + r * 0.2} ${cx},${cy - r * 0.1} ${cx + r * 0.18},${cy + r * 0.2}`} fill="#c0392b"/>
      {/* S pointer white */}
      <polygon points={`${cx},${cy + r * 0.7} ${cx - r * 0.18},${cy - r * 0.2} ${cx},${cy + r * 0.1} ${cx + r * 0.18},${cy - r * 0.2}`} fill="#ecf0f1" opacity="0.8"/>
      <text x={cx} y={cy - r * 0.78} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.28} fill="#c0392b" fontWeight="900" fontFamily="sans-serif">N</text>
      <text x={cx} y={cy + r * 0.92} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.22} fill="#ecf0f1" fontFamily="sans-serif" opacity="0.9">S</text>
      <text x={cx + r * 0.92} y={cy + 0.3} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.2} fill="#8fb08a" fontFamily="sans-serif">E</text>
      <text x={cx - r * 0.92} y={cy + 0.3} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.2} fill="#8fb08a" fontFamily="sans-serif">W</text>
    </g>
  );
}

// ── main component ────────────────────────────────────────────
export function FloorPlan2D({ result }: FloorPlan2DProps) {
  const [activeFloor, setActiveFloor] = React.useState(0);
  const floors = useMemo(() => Math.max(1, ...result.rooms.map(r => r.floor + 1)), [result.rooms]);
  const roomsOnFloor = useMemo(() => result.rooms.filter(r => r.floor === activeFloor) as Room[], [result.rooms, activeFloor]);

  const vw = result.plotWidth + PAD * 2;
  const vh = result.plotLength + PAD * 2;
  const compassR = 5.5;
  const cX = vw - compassR - 2, cY = compassR + 2;

  return (
    <div className="flex flex-col gap-3 w-full">
      {floors > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: floors }).map((_, i) => (
            <button key={i} onClick={() => setActiveFloor(i)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                activeFloor === i ? "text-white shadow" : "text-amber-100 opacity-60 hover:opacity-90"
              }`}
              style={{ background: activeFloor === i ? "#a76a53" : "#2c3327", border: "1px solid #a76a53" }}>
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </button>
          ))}
        </div>
      )}

      <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: BG }}>
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
          <defs>
            <clipPath id="plot-clip-2d">
              <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}/>
            </clipPath>
            <filter id="drop-shadow-2d">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.35"/>
            </filter>
          </defs>

          {/* Background */}
          <rect width={vw} height={vh} fill={BG}/>

          {/* Plot fill */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength} fill="#3a4535"/>

          {/* Rooms with wall thickness */}
          <g clipPath="url(#plot-clip-2d)">
            {roomsOnFloor.map((room, i) => {
              const n = room.name.toLowerCase();
              const isGarden = n.includes("garden") || n.includes("lawn") || n.includes("courtyard");
              const isPark = n.includes("parking") || n.includes("garage");
              const isPooja = n.includes("pooja") || n.includes("mandir");
              const isUtil = n.includes("utility") || n.includes("store");
              const fill = isGarden ? "#3d5c2e" : isPark ? "#444c38" : isPooja ? "#5c4a2e" : isUtil ? "#3d3d35" : ROOM_FILL;

              return (
                <g key={i}>
                  {/* Outer wall (terracotta) */}
                  <rect
                    x={room.x + PAD} y={room.y + PAD}
                    width={room.width} height={room.length}
                    fill={WALL_CLR} />
                  {/* Inner room fill (inset by wall thickness) */}
                  <rect
                    x={room.x + PAD + WALL_T} y={room.y + PAD + WALL_T}
                    width={room.width - WALL_T * 2} height={room.length - WALL_T * 2}
                    fill={fill}/>
                </g>
              );
            })}
          </g>

          {/* Windows & Doors & Furniture — clipped */}
          <g clipPath="url(#plot-clip-2d)" transform={`translate(${PAD}, ${PAD})`}>
            {roomsOnFloor.map((room, i) => (
              <g key={i}>
                <WindowSymbol room={room}/>
                <DoorArc room={room} allRooms={roomsOnFloor}/>
                {getRoomFurniture(room)}
                {/* Room label */}
                <text
                  x={room.x + room.width / 2} y={room.y + room.length / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(1.8, Math.min(room.width, room.length) * 0.13)}
                  fill="#3a2e28" fontWeight="700" fontFamily="sans-serif">
                  {room.name}
                </text>
                {room.width > 6 && room.length > 5 && (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.length / 2 + Math.max(1.8, Math.min(room.width, room.length) * 0.13) * 1.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(1.4, Math.min(room.width, room.length) * 0.09)}
                    fill="#6b5a50" fontFamily="sans-serif">
                    {room.width}×{room.length} ft
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Plot outer border (thick terracotta) */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}
            fill="none" stroke={WALL_CLR} strokeWidth="1.8"/>

          {/* Dimension lines */}
          <DimLine
            x1={PAD} y1={PAD - 7} x2={PAD + result.plotWidth} y2={PAD - 7}
            label={`${result.plotWidth} ft`}/>
          <DimLine
            x1={PAD - 7} y1={PAD} x2={PAD - 7} y2={PAD + result.plotLength}
            label={`${result.plotLength} ft`}/>

          {/* Compass */}
          <Compass cx={cX} cy={cY} r={compassR}/>

          {/* Facing label */}
          <text x={PAD + result.plotWidth / 2} y={PAD + result.plotLength + 5}
            textAnchor="middle" fontSize="3" fill="#8fb08a" fontFamily="sans-serif" fontWeight="600">
            {(result as any).facing ?? "North"} Facing
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {roomsOnFloor.map((room, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "#2c332790", border: "1px solid #a76a53", color: "#e8ddd0" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: ROOM_FILL, display: "inline-block" }}/>
            {room.name} · {room.width * room.length} sqft
          </div>
        ))}
      </div>
    </div>
  );
}
