import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface Room { name: string; x: number; y: number; width: number; length: number; floor: number; color?: string; }
interface Props { result: FloorPlanResult; }

const WALL = 1.4;
const PAD  = 22;

function ftIn(n: number) { return `${n}'-0"`; }

function roomFill(name: string) {
  const n = name.toLowerCase();
  if (n.includes("bath") || n.includes("toilet") || n.includes("wash")) return "#c8dff0";
  if (n.includes("garden") || n.includes("lawn") || n.includes("court")) return "#7ab648";
  if (n.includes("parking") || n.includes("garage") || n.includes("car porch") || n.includes("porch")) return "#b5bcc4";
  if (n.includes("kitchen")) return "#e8d5b0";
  if (n.includes("pooja") || n.includes("mandir") || n.includes("puja")) return "#f5d9a8";
  if (n.includes("stair")) return "#ddd8d0";
  return "#f5ede0";
}

/* ── Furniture ─────────────────────────────── */

function BedFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const bw = Math.min(w * 0.72, 6.5), bl = Math.min(l * 0.68, 8.5);
  const bx = x + (w - bw) / 2, by = y + l * 0.12;
  const hh = Math.min(bl * 0.14, 1.0);
  return (
    <g stroke="#555" strokeWidth="0.22" fill="none">
      <rect x={bx} y={by} width={bw} height={bl} rx="0.4" fill="#e8ddd0" stroke="#666" strokeWidth="0.28"/>
      <rect x={bx} y={by} width={bw} height={hh} rx="0.25" fill="#c0a888" stroke="#777" strokeWidth="0.22"/>
      <ellipse cx={bx + bw * 0.28} cy={by + hh * 0.55} rx={bw * 0.14} ry={hh * 0.36} fill="#d4b896"/>
      <ellipse cx={bx + bw * 0.72} cy={by + hh * 0.55} rx={bw * 0.14} ry={hh * 0.36} fill="#d4b896"/>
      <rect x={bx + bw * 0.06} y={by + hh + 0.2} width={bw * 0.88} height={bl - hh - 0.3} rx="0.2" fill="#ede4d8"/>
      <line x1={bx + bw * 0.5} y1={by + hh + 0.2} x2={bx + bw * 0.5} y2={by + bl - 0.2} stroke="#ccc0b0" strokeWidth="0.15"/>
      <rect x={x + w * 0.04} y={y + l * 0.84} width={w * 0.38} height={l * 0.13} fill="#ddd4c4" stroke="#888" strokeWidth="0.2"/>
      <line x1={x + w * 0.23} y1={y + l * 0.84} x2={x + w * 0.23} y2={y + l * 0.97} stroke="#aaa" strokeWidth="0.15"/>
    </g>
  );
}

function SofaFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const sw = Math.min(w * 0.68, 9), sd = Math.min(l * 0.24, 3.2);
  const sx = x + (w - sw) / 2, sy = y + l * 0.5;
  const lw = Math.min(w * 0.28, 3.8), ld = Math.min(l * 0.45, 6);
  const lx = x + w * 0.05, ly = y + l * 0.48;
  return (
    <g stroke="#666" strokeWidth="0.22" fill="none">
      <rect x={x + w * 0.12} y={y + l * 0.06} width={w * 0.76} height={l * 0.1} rx="0.3" fill="#c8c0b4" stroke="#888" strokeWidth="0.25"/>
      <rect x={x + w * 0.3} y={sy - l * 0.13} width={w * 0.4} height={l * 0.12} rx="0.3" fill="#ddd8cc"/>
      <rect x={sx} y={sy} width={sw} height={sd} rx="0.4" fill="#c8bfb0" stroke="#777" strokeWidth="0.28"/>
      <rect x={sx} y={sy} width={sw} height={sd * 0.28} rx="0.3" fill="#b0a898"/>
      {[0, 1, 2].map(i => (
        <rect key={i} x={sx + i * (sw / 3) + 0.25} y={sy + sd * 0.3} width={sw / 3 - 0.5} height={sd * 0.62} rx="0.25" fill="#d8cfc0"/>
      ))}
      <rect x={lx} y={ly} width={lw} height={ld} rx="0.4" fill="#c8bfb0" stroke="#777" strokeWidth="0.25"/>
      <rect x={lx} y={ly} width={lw * 0.28} height={ld} rx="0.3" fill="#b0a898"/>
    </g>
  );
}

function KitchenFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const cw = w - WALL * 2;
  return (
    <g stroke="#666" strokeWidth="0.22" fill="none">
      <rect x={x + WALL} y={y + WALL} width={cw} height={l * 0.26} fill="#c4a878" stroke="#888" strokeWidth="0.28"/>
      <rect x={x + WALL + cw * 0.62} y={y + WALL + l * 0.03} width={cw * 0.28} height={l * 0.18} rx="0.2" fill="#d8d4ce" stroke="#999" strokeWidth="0.2"/>
      <circle cx={x + WALL + cw * 0.76} cy={y + WALL + 0.6} r={0.28} fill="#888"/>
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={x + WALL + cw * (0.16 + (i % 2) * 0.18)} cy={y + WALL + l * (0.08 + Math.floor(i / 2) * 0.1)} r={l * 0.037} fill="none" stroke="#555" strokeWidth="0.22"/>
      ))}
      <rect x={x + WALL} y={y + l * 0.68} width={w - WALL * 2} height={l * 0.26} fill="#c4a878" stroke="#888" strokeWidth="0.25"/>
    </g>
  );
}

function BathroomFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  return (
    <g stroke="#555" strokeWidth="0.2" fill="none">
      <rect x={x + WALL} y={y + WALL} width={w * 0.44} height={l * 0.36} rx="0.5" fill="#e8f0f8" stroke="#88aacc" strokeWidth="0.25"/>
      <ellipse cx={x + WALL + w * 0.22} cy={y + WALL + l * 0.24} rx={w * 0.16} ry={l * 0.09} fill="#d8e8f4"/>
      <rect x={x + WALL} y={y + WALL + l * 0.38} width={w * 0.44} height={0.35} fill="#7aaccf"/>
      <ellipse cx={x + w * 0.75} cy={y + l * 0.75} rx={w * 0.18} ry={l * 0.12} fill="#e8f0f8" stroke="#88aacc" strokeWidth="0.22"/>
      <circle cx={x + w * 0.75} cy={y + l * 0.75} r={0.22} fill="#77aacc"/>
      <rect x={x + w * 0.52} y={y + WALL} width={w * 0.44} height={l * 0.36} rx="0.2" fill="none" stroke="#88aacc" strokeWidth="0.22" strokeDasharray="0.5,0.4"/>
      <circle cx={x + w * 0.74} cy={y + l * 0.17} r={0.45} fill="none" stroke="#88aacc" strokeWidth="0.2"/>
    </g>
  );
}

function DiningFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const tw = Math.min(w * 0.58, 6), td = Math.min(l * 0.52, 5.5);
  const tx = x + (w - tw) / 2, ty = y + (l - td) / 2;
  const cw = Math.min(tw * 0.3, 1.6), ch = 0.7;
  const cs: [number, number, number, number][] = [
    [tx + tw * 0.5 - cw / 2, ty - ch - 0.15, cw, ch],
    [tx + tw * 0.5 - cw / 2, ty + td + 0.15, cw, ch],
    [tx - cw - 0.15, ty + td * 0.2, ch, cw],
    [tx + tw + 0.15, ty + td * 0.2, ch, cw],
    [tx + tw * 0.18, ty - ch - 0.15, cw, ch],
    [tx + tw * 0.82 - cw, ty - ch - 0.15, cw, ch],
    [tx + tw * 0.18, ty + td + 0.15, cw, ch],
    [tx + tw * 0.82 - cw, ty + td + 0.15, cw, ch],
    [tx - cw - 0.15, ty + td * 0.6, ch, cw],
    [tx + tw + 0.15, ty + td * 0.6, ch, cw],
  ];
  return (
    <g stroke="#666" strokeWidth="0.2" fill="none">
      <rect x={tx} y={ty} width={tw} height={td} rx="0.4" fill="#ddd4c0" stroke="#888" strokeWidth="0.28"/>
      {cs.map(([cx2, cy2, cw2, ch2], i) => (
        <rect key={i} x={cx2} y={cy2} width={cw2} height={ch2} rx="0.15" fill="#c4baa8" stroke="#888" strokeWidth="0.18"/>
      ))}
    </g>
  );
}

function CarFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const cw = Math.min(w * 0.68, 4.8), cl = Math.min(l * 0.62, 5.8);
  const cx2 = x + (w - cw) / 2, cy2 = y + (l - cl) / 2;
  return (
    <g stroke="#555" strokeWidth="0.25" fill="none">
      <rect x={cx2} y={cy2} width={cw} height={cl} rx={cw * 0.12} fill="#d0d8dc" stroke="#777" strokeWidth="0.3"/>
      <rect x={cx2 + cw * 0.1} y={cy2 + cl * 0.15} width={cw * 0.8} height={cl * 0.55} rx={cw * 0.06} fill="#b8c0c8" stroke="#666" strokeWidth="0.25"/>
      {[[0.1, 0.04], [0.9 - 0.18, 0.04], [0.1, 0.88], [0.9 - 0.18, 0.88]].map(([px, py], i) => (
        <ellipse key={i} cx={cx2 + cw * (px + 0.09)} cy={cy2 + cl * (py + 0.05)} rx={cw * 0.09} ry={cl * 0.05} fill="#444"/>
      ))}
    </g>
  );
}

function GardenFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const trees = [
    { cx: x + w * 0.15, cy: y + l * 0.2 },
    { cx: x + w * 0.82, cy: y + l * 0.18 },
    { cx: x + w * 0.12, cy: y + l * 0.75 },
    { cx: x + w * 0.78, cy: y + l * 0.8 },
    { cx: x + w * 0.45, cy: y + l * 0.35 },
  ];
  const steps = Math.max(3, Math.round(l / 5));
  const sw = Math.min(w * 0.22, 3.5);
  const sx = x + (w - sw) / 2;
  return (
    <g fill="none">
      <rect x={x} y={y} width={w} height={l} fill="#90c04a" opacity="0.7"/>
      {Array.from({ length: steps }).map((_, i) => (
        <rect key={i} x={sx} y={y + l * 0.12 + i * (l * 0.72 / steps)} width={sw} height={l * 0.08} rx="0.3" fill="#e8e0c8" stroke="#c8c0a8" strokeWidth="0.2"/>
      ))}
      {trees.map((t, i) => (
        <g key={i}>
          <circle cx={t.cx} cy={t.cy} r={Math.min(w, l) * 0.08} fill="#3d7a2a" opacity="0.85"/>
          <circle cx={t.cx} cy={t.cy} r={Math.min(w, l) * 0.04} fill="#5a9a40" opacity="0.9"/>
        </g>
      ))}
    </g>
  );
}

function StairFurniture({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const steps = 8;
  const sh = (l - WALL * 2) / steps;
  return (
    <g stroke="#888" strokeWidth="0.2" fill="none">
      {Array.from({ length: steps }).map((_, i) => (
        <line key={i} x1={x + WALL} y1={y + WALL + i * sh} x2={x + w - WALL} y2={y + WALL + i * sh} strokeWidth="0.2"/>
      ))}
      <polygon points={`${x + w * 0.44},${y + WALL} ${x + w * 0.56},${y + WALL} ${x + w * 0.5},${y + WALL + 1.2}`} fill="#888" opacity="0.7"/>
    </g>
  );
}

function getFurniture(room: Room) {
  const n = room.name.toLowerCase();
  const { x, y, width: w, length: l } = room;
  if (n.includes("bedroom") || n.includes("master")) return <BedFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("family") || n.includes("living") || n.includes("lounge") || n.includes("hall")) return <SofaFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("drawing") && !n.includes("room")) return <SofaFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("drawing")) return <DiningFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("kitchen")) return <KitchenFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("dining")) return <DiningFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("bath") || n.includes("toilet") || n.includes("wash")) return <BathroomFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("parking") || n.includes("garage") || n.includes("car porch") || n.includes("porch")) return <CarFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("garden") || n.includes("lawn") || n.includes("court")) return <GardenFurniture x={x} y={y} w={w} l={l}/>;
  if (n.includes("stair")) return <StairFurniture x={x} y={y} w={w} l={l}/>;
  return null;
}

/* ── Door arc ────────────────────────────── */
function DoorArc({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  if (n.includes("stair") || n.includes("parking") || n.includes("garden") || n.includes("lawn") || n.includes("porch")) return null;
  const dw = Math.min(room.width * 0.32, 3.0);
  const dx = room.x + room.width * 0.12;
  const dy = room.y + room.length;
  return (
    <g stroke="#333" strokeWidth="0.28" fill="none">
      <line x1={dx} y1={dy} x2={dx} y2={dy - dw}/>
      <path d={`M ${dx} ${dy - dw} A ${dw} ${dw} 0 0 1 ${dx + dw} ${dy}`} strokeDasharray="0.5,0.35"/>
    </g>
  );
}

/* ── Window symbol ───────────────────────── */
function WindowSymbol({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  if (n.includes("bath") || n.includes("stair") || n.includes("parking") || n.includes("garage") || n.includes("foyer")) return null;
  const ww = Math.min(room.width * 0.42, 4.0);
  const wx = room.x + (room.width - ww) / 2;
  const wy = room.y;
  return (
    <g>
      <rect x={wx} y={wy - 0.2} width={ww} height={0.85} fill="#c8e8f8" stroke="#333" strokeWidth="0.28"/>
      <line x1={wx + ww * 0.33} y1={wy - 0.2} x2={wx + ww * 0.33} y2={wy + 0.65} stroke="#333" strokeWidth="0.18"/>
      <line x1={wx + ww * 0.66} y1={wy - 0.2} x2={wx + ww * 0.66} y2={wy + 0.65} stroke="#333" strokeWidth="0.18"/>
    </g>
  );
}

/* ── North arrow ─────────────────────────── */
function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y + 5} x2={x} y2={y - 2} stroke="#111" strokeWidth="0.6"/>
      <polygon points={`${x},${y - 5} ${x - 1.4},${y + 1} ${x},${y - 1} ${x + 1.4},${y + 1}`} fill="#111"/>
      <text x={x} y={y - 7} textAnchor="middle" fontSize="3.8" fontWeight="900" fill="#111" fontFamily="Arial, sans-serif">NORTH</text>
    </g>
  );
}

/* ── Dimension line ──────────────────────── */
function DimLine({ x1, y1, x2, y2, label, vertical }: {
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean;
}) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const tick = 2.2;
  return (
    <g stroke="#333" strokeWidth="0.35" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2}/>
      {vertical ? (
        <>
          <line x1={x1 - tick} y1={y1} x2={x1 + tick} y2={y1}/>
          <line x1={x2 - tick} y1={y2} x2={x2 + tick} y2={y2}/>
          <text
            x={mx - 3.5} y={my} textAnchor="middle" dominantBaseline="middle"
            fontSize="3.4" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700"
            transform={`rotate(-90, ${mx - 3.5}, ${my})`} stroke="none">
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - tick} x2={x1} y2={y1 + tick}/>
          <line x1={x2} y1={y2 - tick} x2={x2} y2={y2 + tick}/>
          <text x={mx} y={my - 3.5} textAnchor="middle" fontSize="3.4" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700" stroke="none">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

/* ── Main component ──────────────────────── */
export function FloorPlan2D({ result }: Props) {
  const [activeFloor, setActiveFloor] = React.useState(0);
  const totalFloors = useMemo(() => Math.max(1, ...result.rooms.map(r => r.floor + 1)), [result.rooms]);
  const rooms = useMemo(() => result.rooms.filter(r => r.floor === activeFloor) as Room[], [result.rooms, activeFloor]);

  const vw = result.plotWidth + PAD * 2;
  const vh = result.plotLength + PAD * 2 + 14;
  const coveredArea = useMemo(() => rooms.reduce((s, r) => s + r.width * r.length, 0), [rooms]);
  const facing = (result as any).facing ?? "North";

  const gateX = PAD + result.plotWidth / 2;
  const gateY = PAD;

  return (
    <div className="flex flex-col gap-3 w-full">
      {totalFloors > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: totalFloors }).map((_, i) => (
            <button key={i} onClick={() => setActiveFloor(i)}
              className={`px-4 py-1.5 text-sm font-semibold border transition-all ${
                activeFloor === i ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-400 hover:bg-gray-50"
              }`}>
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </button>
          ))}
        </div>
      )}

      <div className="w-full overflow-hidden shadow-xl border border-gray-300 bg-white">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", background: "#ffffff" }}>

          <defs>
            <clipPath id="plot-clip">
              <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}/>
            </clipPath>
          </defs>

          {/* White background */}
          <rect width={vw} height={vh} fill="#f8f6f2"/>

          {/* Plot area white fill */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength} fill="#ffffff"/>

          {/* Room fills (garden/parking get special fills, others are interior) */}
          <g clipPath="url(#plot-clip)">
            {rooms.map((room, i) => {
              const n = room.name.toLowerCase();
              const isOutdoor = n.includes("garden") || n.includes("lawn") || n.includes("court") || n.includes("parking") || n.includes("garage") || n.includes("porch");
              return (
                <rect key={i}
                  x={PAD + room.x + WALL / 2} y={PAD + room.y + WALL / 2}
                  width={room.width - WALL} height={room.length - WALL}
                  fill={roomFill(room.name)}
                />
              );
            })}
          </g>

          {/* Walls: draw outer black border per room */}
          <g clipPath="url(#plot-clip)">
            {rooms.map((room, i) => (
              <rect key={i}
                x={PAD + room.x} y={PAD + room.y}
                width={room.width} height={room.length}
                fill="none" stroke="#1a1a1a" strokeWidth={WALL}
              />
            ))}
          </g>

          {/* Windows, Doors, Furniture, Labels — inside plot */}
          <g clipPath="url(#plot-clip)" transform={`translate(${PAD}, ${PAD})`}>
            {rooms.map((room, i) => (
              <g key={i}>
                <WindowSymbol room={room}/>
                <DoorArc room={room}/>
                {getFurniture(room)}
                {/* Room name */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.length / 2 - Math.max(1.5, Math.min(room.width, room.length) * 0.065)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(1.7, Math.min(room.width, room.length) * 0.13)}
                  fill="#111" fontWeight="800" fontFamily="Arial, sans-serif" stroke="none">
                  {room.name.toUpperCase()}
                </text>
                {/* Room dimensions */}
                {room.width >= 5 && room.length >= 5 && (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.length / 2 + Math.max(1.5, Math.min(room.width, room.length) * 0.075)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(1.3, Math.min(room.width, room.length) * 0.095)}
                    fill="#444" fontFamily="Arial, sans-serif" stroke="none">
                    {ftIn(room.width)} X {ftIn(room.length)}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Plot border thick */}
          <rect x={PAD} y={PAD} width={result.plotWidth} height={result.plotLength}
            fill="none" stroke="#1a1a1a" strokeWidth={WALL * 1.5}/>

          {/* Gate marker at facing side */}
          <g>
            <rect x={gateX - 3.5} y={gateY - 0.5} width={7} height={WALL * 2} fill="#f8f6f2" stroke="none"/>
            <line x1={gateX - 3.5} y1={gateY} x2={gateX - 3.5} y2={gateY + WALL * 1.5} stroke="#1a1a1a" strokeWidth="0.7"/>
            <line x1={gateX + 3.5} y1={gateY} x2={gateX + 3.5} y2={gateY + WALL * 1.5} stroke="#1a1a1a" strokeWidth="0.7"/>
            <text x={gateX} y={gateY - 2} textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#111" fontFamily="Arial, sans-serif">GATE</text>
          </g>

          {/* North arrow above plot center */}
          <NorthArrow x={gateX} y={PAD - 12}/>

          {/* Dimension lines */}
          <DimLine
            x1={PAD} y1={PAD - 10} x2={PAD + result.plotWidth} y2={PAD - 10}
            label={`${ftIn(result.plotWidth)}`}/>
          <DimLine
            x1={PAD - 10} y1={PAD} x2={PAD - 10} y2={PAD + result.plotLength}
            label={`${ftIn(result.plotLength)}`} vertical/>

          {/* Bottom info bar */}
          <rect x={PAD} y={PAD + result.plotLength + 2} width={result.plotWidth} height={11} fill="#f0ece4" stroke="#1a1a1a" strokeWidth="0.5"/>
          <text x={PAD + result.plotWidth / 2} y={PAD + result.plotLength + 8.5}
            textAnchor="middle" fontSize="3.6" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700" stroke="none">
            PLOT SIZE : {ftIn(result.plotWidth)} X {ftIn(result.plotLength)}  |  COVERED AREA : APPROX. {coveredArea.toLocaleString()} SQ.FT
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1 pt-1">
        {rooms.map((room, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border border-gray-300 bg-white shadow-sm">
            <span style={{ width: 10, height: 10, display: "inline-block", background: roomFill(room.name), border: "1px solid #aaa" }}/>
            {room.name} · {room.width * room.length} sq ft
          </div>
        ))}
      </div>
    </div>
  );
}
