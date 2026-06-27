import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface Room { name: string; x: number; y: number; width: number; length: number; floor: number; color?: string; }
interface Props { result: FloorPlanResult; }

const S    = 9;     // SVG units per foot — everything multiplied by this
const PAD  = 20;    // padding in feet around the plot
const WALL = 1.0;   // wall thickness in feet

function ftIn(n: number) { return `${n}'-0"`; }

function roomColor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("bath") || n.includes("toilet") || n.includes("wash")) return "#b8d8ee";
  if (n.includes("garden") || n.includes("lawn") || n.includes("court") || n.includes("yard")) return "#78b840";
  if (n.includes("parking") || n.includes("garage") || n.includes("car porch") || n.includes("porch")) return "#a8b4bc";
  if (n.includes("kitchen")) return "#d8c89e";
  if (n.includes("pooja") || n.includes("mandir") || n.includes("puja")) return "#f0c878";
  if (n.includes("stair")) return "#d0c8c0";
  if (n.includes("foyer") || n.includes("lobby") || n.includes("entry")) return "#e8dcc8";
  if (n.includes("dining")) return "#e8dcc8";
  return "#f0e8d8"; // warm cream for bedrooms, living, drawing, etc.
}

/* ─── Furniture ─────────────────────────────────────────────── */
// All coordinates in feet; rendered inside <g transform="scale(S)">

function Bed({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const bw = Math.min(w * 0.70, 7.5), bl = Math.min(l * 0.65, 9);
  const bx = x + (w - bw) / 2, by = y + l * 0.1;
  const hh = Math.min(bl * 0.13, 1.1);
  return (
    <g stroke="#6b5540" strokeWidth="0.2" fill="none">
      <rect x={bx} y={by} width={bw} height={bl} rx="0.35" fill="#e2d4c0" stroke="#8a6a50" strokeWidth="0.25"/>
      <rect x={bx} y={by} width={bw} height={hh} rx="0.2" fill="#b89870" stroke="#8a6a50" strokeWidth="0.2"/>
      <ellipse cx={bx + bw * 0.28} cy={by + hh * 0.55} rx={bw * 0.13} ry={hh * 0.38} fill="#c8a880"/>
      <ellipse cx={bx + bw * 0.72} cy={by + hh * 0.55} rx={bw * 0.13} ry={hh * 0.38} fill="#c8a880"/>
      <rect x={bx + bw * 0.05} y={by + hh + 0.15} width={bw * 0.9} height={bl - hh - 0.25} rx="0.18" fill="#ede0d0"/>
      <line x1={bx + bw * 0.5} y1={by + hh + 0.2} x2={bx + bw * 0.5} y2={by + bl - 0.15} stroke="#d4c4b0" strokeWidth="0.14"/>
      {/* side table */}
      <rect x={x + w * 0.03} y={by + 0.3} width={w * 0.12} height={hh * 2.5} rx="0.1" fill="#d8c8b0" stroke="#8a6a50" strokeWidth="0.15"/>
      {/* wardrobe */}
      <rect x={x + w * 0.05} y={y + l * 0.82} width={w * 0.4} height={l * 0.14} fill="#ddd0c0" stroke="#8a6a50" strokeWidth="0.18"/>
      <line x1={x + w * 0.25} y1={y + l * 0.82} x2={x + w * 0.25} y2={y + l * 0.96} stroke="#aaa" strokeWidth="0.12"/>
    </g>
  );
}

function Sofa({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const sw = Math.min(w * 0.72, 11), sd = Math.min(l * 0.22, 3.2);
  const sx = x + (w - sw) / 2, sy = y + l * 0.52;
  const lsw = Math.min(w * 0.25, 3.5), lsl = Math.min(l * 0.44, 6.5);
  const lsx = x + w * 0.04, lsy = y + l * 0.46;
  return (
    <g stroke="#7a6a58" strokeWidth="0.18" fill="none">
      {/* TV / console unit */}
      <rect x={x + w * 0.1} y={y + l * 0.06} width={w * 0.8} height={l * 0.09} rx="0.25" fill="#c0b8a8" stroke="#8a7a68" strokeWidth="0.22"/>
      {/* coffee table */}
      <rect x={sx + sw * 0.18} y={sy - l * 0.13} width={sw * 0.64} height={l * 0.11} rx="0.25" fill="#d8cfc0" stroke="#9a8878" strokeWidth="0.18"/>
      {/* main sofa */}
      <rect x={sx} y={sy} width={sw} height={sd} rx="0.35" fill="#c4b8a8" stroke="#8a7a68" strokeWidth="0.25"/>
      <rect x={sx} y={sy} width={sw} height={sd * 0.28} rx="0.25" fill="#b0a494"/>
      {[0, 1, 2].map(i => (
        <rect key={i} x={sx + i * (sw / 3) + 0.22} y={sy + sd * 0.3} width={sw / 3 - 0.44} height={sd * 0.62} rx="0.22" fill="#d4c8b8"/>
      ))}
      {/* side sofa arm */}
      <rect x={lsx} y={lsy} width={lsw} height={lsl} rx="0.35" fill="#c4b8a8" stroke="#8a7a68" strokeWidth="0.22"/>
      <rect x={lsx} y={lsy} width={lsw * 0.3} height={lsl} rx="0.25" fill="#b0a494"/>
    </g>
  );
}

function Kitchen({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const cw = w - WALL * 2;
  return (
    <g stroke="#7a6048" strokeWidth="0.18" fill="none">
      {/* top counter */}
      <rect x={x + WALL} y={y + WALL} width={cw} height={l * 0.24} fill="#c4a86c" stroke="#9a7848" strokeWidth="0.25"/>
      {/* sink */}
      <rect x={x + WALL + cw * 0.6} y={y + WALL + l * 0.03} width={cw * 0.3} height={l * 0.17} rx="0.18" fill="#d8d0c4" stroke="#9a8878" strokeWidth="0.18"/>
      <circle cx={x + WALL + cw * 0.75} cy={y + WALL + 0.6} r={0.3} fill="#9a8878"/>
      {/* stove burners */}
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={x + WALL + cw * (0.14 + (i % 2) * 0.19)} cy={y + WALL + l * (0.07 + Math.floor(i / 2) * 0.1)} r={l * 0.04} fill="none" stroke="#555" strokeWidth="0.22"/>
      ))}
      {/* bottom counter */}
      <rect x={x + WALL} y={y + l * 0.7} width={cw} height={l * 0.24} fill="#c4a86c" stroke="#9a7848" strokeWidth="0.22"/>
    </g>
  );
}

function Bathroom({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  return (
    <g stroke="#5588aa" strokeWidth="0.18" fill="none">
      {/* WC */}
      <rect x={x + WALL} y={y + WALL} width={w * 0.44} height={l * 0.38} rx="0.45" fill="#deeef8" stroke="#6699bb" strokeWidth="0.22"/>
      <ellipse cx={x + WALL + w * 0.22} cy={y + WALL + l * 0.26} rx={w * 0.15} ry={l * 0.1} fill="#c8e0f0"/>
      <rect x={x + WALL} y={y + WALL + l * 0.38} width={w * 0.44} height={0.32} fill="#6699bb"/>
      {/* basin */}
      <ellipse cx={x + w * 0.76} cy={y + l * 0.75} rx={w * 0.18} ry={l * 0.12} fill="#deeef8" stroke="#6699bb" strokeWidth="0.2"/>
      <circle cx={x + w * 0.76} cy={y + l * 0.75} r={0.2} fill="#6699bb"/>
      {/* shower */}
      <rect x={x + w * 0.5} y={y + WALL} width={w * 0.45} height={l * 0.38} rx="0.18" fill="none" stroke="#6699bb" strokeWidth="0.2" strokeDasharray="0.45,0.35"/>
      <circle cx={x + w * 0.72} cy={y + l * 0.18} r={0.4} fill="none" stroke="#6699bb" strokeWidth="0.18"/>
    </g>
  );
}

function Dining({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const tw = Math.min(w * 0.56, 7), td = Math.min(l * 0.5, 6);
  const tx = x + (w - tw) / 2, ty = y + (l - td) / 2;
  const cw = Math.min(tw * 0.28, 1.8), ch = 0.72;
  const cs: [number, number, number, number][] = [
    [tx + tw * 0.5 - cw / 2, ty - ch - 0.12, cw, ch],
    [tx + tw * 0.5 - cw / 2, ty + td + 0.12, cw, ch],
    [tx - ch - 0.12, ty + td * 0.2, ch, cw],
    [tx + tw + 0.12, ty + td * 0.2, ch, cw],
    [tx + tw * 0.15, ty - ch - 0.12, cw, ch],
    [tx + tw * 0.85 - cw, ty - ch - 0.12, cw, ch],
    [tx + tw * 0.15, ty + td + 0.12, cw, ch],
    [tx + tw * 0.85 - cw, ty + td + 0.12, cw, ch],
    [tx - ch - 0.12, ty + td * 0.65, ch, cw],
    [tx + tw + 0.12, ty + td * 0.65, ch, cw],
  ];
  return (
    <g stroke="#7a6a50" strokeWidth="0.18" fill="none">
      <rect x={tx} y={ty} width={tw} height={td} rx="0.35" fill="#d8ceb8" stroke="#9a8a70" strokeWidth="0.25"/>
      {cs.map(([cx, cy, cw2, ch2], i) => (
        <rect key={i} x={cx} y={cy} width={cw2} height={ch2} rx="0.14" fill="#c4b8a0" stroke="#9a8a70" strokeWidth="0.16"/>
      ))}
    </g>
  );
}

function Car({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const cw = Math.min(w * 0.64, 5.5), cl = Math.min(l * 0.62, 6.5);
  const cx2 = x + (w - cw) / 2, cy2 = y + (l - cl) / 2;
  return (
    <g stroke="#556677" strokeWidth="0.22" fill="none">
      <rect x={cx2} y={cy2} width={cw} height={cl} rx={cw * 0.13} fill="#ccd4d8" stroke="#778899" strokeWidth="0.28"/>
      <rect x={cx2 + cw * 0.1} y={cy2 + cl * 0.15} width={cw * 0.8} height={cl * 0.52} rx={cw * 0.06} fill="#b8c4c8" stroke="#668" strokeWidth="0.22"/>
      {[[0.1, 0.04], [0.9 - 0.18, 0.04], [0.1, 0.88], [0.9 - 0.18, 0.88]].map(([px, py], i) => (
        <ellipse key={i} cx={cx2 + cw * (px + 0.09)} cy={cy2 + cl * (py + 0.05)} rx={cw * 0.09} ry={cl * 0.05} fill="#333"/>
      ))}
      <line x1={cx2 + cw * 0.1} y1={cy2 + cl * 0.67} x2={cx2 + cw * 0.9} y2={cy2 + cl * 0.67} stroke="#778899" strokeWidth="0.15"/>
    </g>
  );
}

function Garden({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const trees = [
    { cx: x + w * 0.13, cy: y + l * 0.18 },
    { cx: x + w * 0.84, cy: y + l * 0.16 },
    { cx: x + w * 0.1, cy: y + l * 0.78 },
    { cx: x + w * 0.82, cy: y + l * 0.8 },
    { cx: x + w * 0.48, cy: y + l * 0.3 },
  ].filter(t => w > 8 && l > 8);
  const steps = Math.max(3, Math.round(l / 6));
  const sw = Math.min(w * 0.2, 3.5);
  const sx = x + (w - sw) / 2;
  const tr = Math.min(w, l) * 0.075;
  return (
    <g fill="none">
      {Array.from({ length: steps }).map((_, i) => (
        <rect key={i} x={sx} y={y + l * 0.08 + i * (l * 0.78 / steps)} width={sw} height={Math.min(l * 0.1, 1.4)} rx="0.28" fill="#e8e0c0" stroke="#c8b888" strokeWidth="0.18"/>
      ))}
      {trees.map((t, i) => (
        <g key={i}>
          <circle cx={t.cx} cy={t.cy} r={tr} fill="#2e6e22" opacity="0.9"/>
          <circle cx={t.cx} cy={t.cy} r={tr * 0.55} fill="#4a9038" opacity="0.9"/>
          <circle cx={t.cx - tr * 0.2} cy={t.cy - tr * 0.2} r={tr * 0.25} fill="#5aa040" opacity="0.7"/>
        </g>
      ))}
    </g>
  );
}

function Staircase({ x, y, w, l }: { x: number; y: number; w: number; l: number }) {
  const steps = Math.max(6, Math.round(l * 0.6));
  const sh = (l - WALL * 2) / steps;
  return (
    <g stroke="#888" strokeWidth="0.18" fill="none">
      {Array.from({ length: steps }).map((_, i) => (
        <line key={i} x1={x + WALL} y1={y + WALL + i * sh} x2={x + w - WALL} y2={y + WALL + i * sh} strokeWidth="0.18"/>
      ))}
      <polygon points={`${x + w * 0.43},${y + WALL} ${x + w * 0.57},${y + WALL} ${x + w * 0.5},${y + WALL + 1.3}`} fill="#888" opacity="0.7"/>
    </g>
  );
}

function Furniture({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  const { x, y, width: w, length: l } = room;
  if (n.includes("bedroom") || n.includes("master")) return <Bed x={x} y={y} w={w} l={l}/>;
  if (n.includes("family") || n.includes("lounge") || n.includes("living")) return <Sofa x={x} y={y} w={w} l={l}/>;
  if (n.includes("drawing")) return <Dining x={x} y={y} w={w} l={l}/>;
  if (n.includes("kitchen")) return <Kitchen x={x} y={y} w={w} l={l}/>;
  if (n.includes("dining")) return <Dining x={x} y={y} w={w} l={l}/>;
  if (n.includes("bath") || n.includes("toilet") || n.includes("wash")) return <Bathroom x={x} y={y} w={w} l={l}/>;
  if (n.includes("parking") || n.includes("garage") || n.includes("car porch") || n.includes("porch")) return <Car x={x} y={y} w={w} l={l}/>;
  if (n.includes("garden") || n.includes("lawn") || n.includes("yard")) return <Garden x={x} y={y} w={w} l={l}/>;
  if (n.includes("stair")) return <Staircase x={x} y={y} w={w} l={l}/>;
  return null;
}

/* ─── Door ─────────────────────────────────────────────────── */
function Door({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  if (n.includes("stair") || n.includes("parking") || n.includes("garden") || n.includes("lawn") || n.includes("porch") || n.includes("garage")) return null;
  const dw = Math.min(room.width * 0.3, 3.2);
  const dx = room.x + room.width * 0.1;
  const dy = room.y + room.length;
  return (
    <g stroke="#222" strokeWidth="0.25" fill="none">
      <line x1={dx} y1={dy} x2={dx} y2={dy - dw}/>
      <path d={`M ${dx} ${dy - dw} A ${dw} ${dw} 0 0 1 ${dx + dw} ${dy}`} strokeDasharray="0.5,0.35"/>
    </g>
  );
}

/* ─── Window ────────────────────────────────────────────────── */
function Window({ room }: { room: Room }) {
  const n = room.name.toLowerCase();
  if (n.includes("bath") || n.includes("stair") || n.includes("parking") || n.includes("garage") || n.includes("foyer") || n.includes("porch")) return null;
  const ww = Math.min(room.width * 0.44, 4.5);
  const wx = room.x + (room.width - ww) / 2;
  return (
    <g>
      <rect x={wx} y={room.y - 0.22} width={ww} height={0.9} fill="#b8ddf0" stroke="#222" strokeWidth="0.25"/>
      <line x1={wx + ww * 0.33} y1={room.y - 0.22} x2={wx + ww * 0.33} y2={room.y + 0.68} stroke="#222" strokeWidth="0.16"/>
      <line x1={wx + ww * 0.66} y1={room.y - 0.22} x2={wx + ww * 0.66} y2={room.y + 0.68} stroke="#222" strokeWidth="0.16"/>
    </g>
  );
}

/* ─── North arrow ───────────────────────────────────────────── */
function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y + 5.5} x2={x} y2={y - 1.5} stroke="#111" strokeWidth="0.55"/>
      <polygon points={`${x},${y - 5.5} ${x - 1.6},${y + 1} ${x},${y - 0.8} ${x + 1.6},${y + 1}`} fill="#111"/>
      <text x={x} y={y - 7.2} textAnchor="middle" fontSize="4" fontWeight="900" fill="#111" fontFamily="Arial, sans-serif">NORTH</text>
    </g>
  );
}

/* ─── Dimension line ────────────────────────────────────────── */
function DimLine({ x1, y1, x2, y2, label, vertical }: {
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean;
}) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const tick = 2.0;
  return (
    <g stroke="#333" strokeWidth="0.35" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2}/>
      {vertical ? (
        <>
          <line x1={x1 - tick} y1={y1} x2={x1 + tick} y2={y1}/>
          <line x1={x2 - tick} y1={y2} x2={x2 + tick} y2={y2}/>
          <text x={mx - 3.8} y={my} textAnchor="middle" dominantBaseline="middle" fontSize="3.4" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700" transform={`rotate(-90, ${mx - 3.8}, ${my})`} stroke="none">{label}</text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - tick} x2={x1} y2={y1 + tick}/>
          <line x1={x2} y1={y2 - tick} x2={x2} y2={y2 + tick}/>
          <text x={mx} y={my - 3.8} textAnchor="middle" fontSize="3.4" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700" stroke="none">{label}</text>
        </>
      )}
    </g>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export function FloorPlan2D({ result }: Props) {
  const [activeFloor, setActiveFloor] = React.useState(0);
  const totalFloors = useMemo(() => Math.max(1, ...result.rooms.map(r => r.floor + 1)), [result.rooms]);
  const rooms = useMemo(() => result.rooms.filter(r => r.floor === activeFloor) as Room[], [result.rooms, activeFloor]);

  const facing = (result as any).facing ?? "North";
  const coveredArea = useMemo(() => rooms.reduce((s, r) => s + r.width * r.length, 0), [rooms]);

  // All drawing is in "feet" units. SVG viewBox scales to S units per foot.
  const plotW = result.plotWidth;
  const plotL = result.plotLength;
  const infoH = 14;  // info bar height in feet
  const vwFt = plotW + PAD * 2;
  const vhFt = plotL + PAD * 2 + infoH;

  // Gate position (center of facing edge)
  const gateX = PAD + plotW / 2;
  const gateY = PAD;

  // Font size for room label — readable even in small rooms
  function labelSize(w: number, l: number) {
    return Math.max(1.6, Math.min(w, l) * 0.115);
  }
  function dimSize(w: number, l: number) {
    return Math.max(1.25, Math.min(w, l) * 0.085);
  }

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

      <div className="w-full shadow-xl border border-gray-200 overflow-hidden bg-white">
        {/* S units per foot → viewBox in "pixels", drawn in "feet" via scale(S) */}
        <svg
          viewBox={`0 0 ${vwFt * S} ${vhFt * S}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}>

          {/* The entire drawing is scaled: 1 foot = S SVG pixels */}
          <g transform={`scale(${S})`}>

            {/* Page background */}
            <rect width={vwFt} height={vhFt} fill="#f5f2ec"/>

            {/* Plot white fill */}
            <rect x={PAD} y={PAD} width={plotW} height={plotL} fill="#ffffff"/>

            {/* ── Room color fills (inner, inset by half wall) ── */}
            {rooms.map((r, i) => (
              <rect key={`fill-${i}`}
                x={PAD + r.x + WALL * 0.5} y={PAD + r.y + WALL * 0.5}
                width={Math.max(0, r.width - WALL)} height={Math.max(0, r.length - WALL)}
                fill={roomColor(r.name)}
              />
            ))}

            {/* ── Walls (room borders, black) ── */}
            {rooms.map((r, i) => (
              <rect key={`wall-${i}`}
                x={PAD + r.x} y={PAD + r.y}
                width={r.width} height={r.length}
                fill="none" stroke="#1a1a1a" strokeWidth={WALL}
              />
            ))}

            {/* ── Furniture, windows, doors, labels ── */}
            <g transform={`translate(${PAD}, ${PAD})`}>
              {rooms.map((r, i) => (
                <g key={`room-${i}`}>
                  <Window room={r}/>
                  <Door room={r}/>
                  <Furniture room={r}/>
                  {/* Room name */}
                  <text
                    x={r.x + r.width / 2}
                    y={r.y + r.length / 2 - labelSize(r.width, r.length) * 0.7}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={labelSize(r.width, r.length)}
                    fill="#111" fontWeight="800" fontFamily="Arial, sans-serif" stroke="none">
                    {r.name.toUpperCase()}
                  </text>
                  {/* Dimensions */}
                  {r.width >= 5 && r.length >= 5 && (
                    <text
                      x={r.x + r.width / 2}
                      y={r.y + r.length / 2 + dimSize(r.width, r.length) * 1.1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={dimSize(r.width, r.length)}
                      fill="#444" fontFamily="Arial, sans-serif" stroke="none">
                      {ftIn(r.width)} X {ftIn(r.length)}
                    </text>
                  )}
                </g>
              ))}
            </g>

            {/* ── Plot outer border (thicker) ── */}
            <rect x={PAD} y={PAD} width={plotW} height={plotL}
              fill="none" stroke="#111111" strokeWidth={WALL * 1.8}/>

            {/* ── Gate break in outer wall ── */}
            <rect x={gateX - 4} y={gateY - WALL * 0.5} width={8} height={WALL * 2.5} fill="#f5f2ec"/>
            <line x1={gateX - 4} y1={gateY} x2={gateX - 4} y2={gateY + WALL * 1.8} stroke="#111" strokeWidth="0.65"/>
            <line x1={gateX + 4} y1={gateY} x2={gateX + 4} y2={gateY + WALL * 1.8} stroke="#111" strokeWidth="0.65"/>
            <text x={gateX} y={gateY + WALL * 0.6} textAnchor="middle" fontSize="2.6" fontWeight="700" fill="#333" fontFamily="Arial, sans-serif">GATE</text>

            {/* ── Dimension lines outside plot ── */}
            <DimLine x1={PAD} y1={PAD - 8} x2={PAD + plotW} y2={PAD - 8} label={ftIn(plotW)}/>
            <DimLine x1={PAD - 10} y1={PAD} x2={PAD - 10} y2={PAD + plotL} label={ftIn(plotL)} vertical/>

            {/* ── North arrow ── */}
            <NorthArrow x={gateX} y={PAD - 14}/>

            {/* ── Facing label ── */}
            <text x={PAD + plotW / 2} y={PAD + plotL + 3} textAnchor="middle" fontSize="2.8" fill="#555" fontFamily="Arial, sans-serif" fontStyle="italic">{facing} Facing</text>

            {/* ── Info bar at bottom ── */}
            <rect x={PAD} y={PAD + plotL + 5} width={plotW} height={infoH - 5} fill="#ede8e0" stroke="#333" strokeWidth="0.5"/>
            <text x={PAD + plotW / 2} y={PAD + plotL + 5 + (infoH - 5) / 2 + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="3.5" fill="#111" fontFamily="Arial, sans-serif" fontWeight="700" stroke="none">
              PLOT SIZE : {ftIn(plotW)} X {ftIn(plotL)}  |  COVERED AREA : APPROX. {coveredArea.toLocaleString()} SQ.FT
            </text>

          </g>{/* end scale(S) */}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1 pt-1">
        {rooms.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border border-gray-200 bg-white shadow-sm rounded-sm">
            <span style={{ width: 10, height: 10, display: "inline-block", background: roomColor(r.name), border: "1px solid #bbb", flexShrink: 0 }}/>
            {r.name} · {r.width * r.length} sq ft
          </div>
        ))}
      </div>
    </div>
  );
}
