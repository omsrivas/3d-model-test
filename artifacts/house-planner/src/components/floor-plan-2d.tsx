import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan2DProps {
  result: FloorPlanResult;
}

const ROOM_ICONS: Record<string, string> = {
  "living": "🛋️", "drawing": "🛋️", "hall": "🛋️",
  "master bedroom": "🛏️", "bedroom": "🛏️",
  "kitchen": "🍳", "dining": "🍽️",
  "bathroom": "🚿", "toilet": "🚽", "washroom": "🚿",
  "pooja": "🪔", "mandir": "🪔",
  "study": "📚", "office": "💻",
  "parking": "🚗", "garage": "🚗",
  "garden": "🌿", "lawn": "🌳", "courtyard": "🌸",
  "staircase": "🪜", "stairs": "🪜",
  "balcony": "🌅",
  "lobby": "🚪", "foyer": "🚪",
  "store": "📦", "utility": "🔧",
  "servant": "🏠", "passage": "〰️", "corridor": "〰️",
};

function getRoomIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ROOM_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "◻️";
}

function darken(hex: string, amount = 40): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const FACING_ARROWS: Record<string, { label: string; rotate: number }> = {
  North: { label: "N", rotate: 0 },
  South: { label: "S", rotate: 180 },
  East: { label: "E", rotate: 90 },
  West: { label: "W", rotate: 270 },
  "North-East": { label: "NE", rotate: 45 },
  "North-West": { label: "NW", rotate: 315 },
  "South-East": { label: "SE", rotate: 135 },
  "South-West": { label: "SW", rotate: 225 },
};

export function FloorPlan2D({ result }: FloorPlan2DProps) {
  const [activeFloor, setActiveFloor] = React.useState(0);
  const [hoveredRoom, setHoveredRoom] = React.useState<number | null>(null);

  const roomsOnFloor = useMemo(
    () => result.rooms.filter((r) => r.floor === activeFloor),
    [result.rooms, activeFloor]
  );

  const maxFloor = useMemo(
    () => Math.max(0, ...result.rooms.map((r) => r.floor)),
    [result.rooms]
  );

  const padding = 18;
  const viewBoxWidth = result.plotWidth + padding * 2;
  const viewBoxHeight = result.plotLength + padding * 2;

  const facing = (result as any).facing ?? "North";
  const facingInfo = FACING_ARROWS[facing] ?? { label: "N", rotate: 0 };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {result.floors > 1 && (
        <div className="flex gap-2 border-b border-border pb-2">
          {Array.from({ length: result.floors }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveFloor(i)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                activeFloor === i
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-orange-100"
              }`}
            >
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full border-2 border-gray-200 rounded-2xl bg-gray-50 overflow-hidden shadow-lg"
           style={{ aspectRatio: `${viewBoxWidth} / ${viewBoxHeight}` }}>

        {/* Blueprint grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99,102,241,0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99,102,241,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Shadow filter */}
            <filter id="room-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0.3" dy="0.5" stdDeviation="0.4" floodOpacity="0.25" />
            </filter>
            {/* Parking hatch pattern */}
            <pattern id="parking-hatch" patternUnits="userSpaceOnUse" width="4" height="4">
              <line x1="0" y1="4" x2="4" y2="0" stroke="#607D8B" strokeWidth="0.6" strokeOpacity="0.5" />
            </pattern>
            {/* Garden dots */}
            <pattern id="garden-dots" patternUnits="userSpaceOnUse" width="4" height="4">
              <circle cx="2" cy="2" r="0.7" fill="#4CAF50" fillOpacity="0.4" />
            </pattern>
            {/* Gradient overlays for rooms */}
            {roomsOnFloor.map((room, i) => (
              <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={room.color || "#E0E0E0"} stopOpacity="1" />
                <stop offset="100%" stopColor={darken(room.color || "#E0E0E0", 25)} stopOpacity="1" />
              </linearGradient>
            ))}
          </defs>

          {/* Outer plot shadow */}
          <rect
            x={padding + 1.5}
            y={padding + 2}
            width={result.plotWidth}
            height={result.plotLength}
            fill="rgba(0,0,0,0.08)"
            rx="1"
          />

          {/* Plot boundary */}
          <rect
            x={padding}
            y={padding}
            width={result.plotWidth}
            height={result.plotLength}
            fill="white"
            stroke="#1a1a2e"
            strokeWidth="1.5"
            rx="0.5"
          />

          {/* Dimension labels */}
          <text x={padding + result.plotWidth / 2} y={padding - 5} textAnchor="middle"
            fontSize="3.5" fill="#64748b" fontFamily="sans-serif" fontWeight="600">
            {result.plotWidth} ft
          </text>
          <text x={padding - 5} y={padding + result.plotLength / 2} textAnchor="middle"
            fontSize="3.5" fill="#64748b" fontFamily="sans-serif" fontWeight="600"
            transform={`rotate(-90, ${padding - 5}, ${padding + result.plotLength / 2})`}>
            {result.plotLength} ft
          </text>

          {/* Rooms */}
          {roomsOnFloor.map((room, i) => {
            const isHovered = hoveredRoom === i;
            const lower = room.name.toLowerCase();
            const isParking = lower.includes("parking") || lower.includes("garage");
            const isGarden = lower.includes("garden") || lower.includes("lawn") || lower.includes("courtyard");
            const isStair = lower.includes("stair");
            const icon = getRoomIcon(room.name);
            const borderColor = darken(room.color || "#E0E0E0", 50);
            const sqft = room.width * room.length;
            const fontSize = Math.max(2.2, Math.min(room.width, room.length) * 0.13);
            const iconSize = Math.max(3, Math.min(room.width, room.length) * 0.22);

            return (
              <g
                key={i}
                transform={`translate(${room.x + padding}, ${room.y + padding})`}
                onMouseEnter={() => setHoveredRoom(i)}
                onMouseLeave={() => setHoveredRoom(null)}
                style={{ cursor: "pointer" }}
                filter={isHovered ? "url(#room-shadow)" : undefined}
              >
                {/* Main room fill */}
                <rect
                  width={room.width}
                  height={room.length}
                  fill={`url(#grad-${i})`}
                  rx="0.5"
                />
                {/* Texture overlay for special rooms */}
                {isParking && (
                  <rect width={room.width} height={room.length} fill="url(#parking-hatch)" rx="0.5" />
                )}
                {isGarden && (
                  <rect width={room.width} height={room.length} fill="url(#garden-dots)" rx="0.5" />
                )}
                {/* Border */}
                <rect
                  width={room.width}
                  height={room.length}
                  fill="none"
                  stroke={borderColor}
                  strokeWidth={isHovered ? "0.8" : "0.5"}
                  rx="0.5"
                />
                {/* Wall thickness lines */}
                <line x1="0" y1="0" x2={room.width} y2="0" stroke={borderColor} strokeWidth="0.9" />
                <line x1="0" y1="0" x2="0" y2={room.length} stroke={borderColor} strokeWidth="0.9" />

                {/* Icon */}
                {!isStair && room.width > 5 && room.length > 5 && (
                  <text
                    x={room.width / 2}
                    y={room.length / 2 - fontSize * 0.9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={iconSize}
                  >
                    {icon}
                  </text>
                )}

                {/* Room name */}
                <text
                  x={room.width / 2}
                  y={room.length / 2 + (room.width > 5 && room.length > 5 ? iconSize * 0.6 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1a1a2e"
                  fontSize={fontSize}
                  fontWeight="700"
                  fontFamily="sans-serif"
                  style={{ textShadow: "0 0 2px rgba(255,255,255,0.8)" }}
                >
                  {room.name}
                </text>

                {/* Dimensions + area */}
                {room.width > 6 && room.length > 5 && (
                  <text
                    x={room.width / 2}
                    y={room.length / 2 + (room.width > 5 && room.length > 5 ? iconSize * 0.6 : 0) + fontSize * 1.4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#374151"
                    fontSize={fontSize * 0.78}
                    fontFamily="sans-serif"
                    opacity="0.85"
                  >
                    {room.width}×{room.length} · {sqft} sqft
                  </text>
                )}

                {/* Hover highlight ring */}
                {isHovered && (
                  <rect
                    width={room.width}
                    height={room.length}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.6"
                    strokeDasharray="1.5,1"
                    rx="0.5"
                    opacity="0.7"
                  />
                )}
              </g>
            );
          })}

          {/* Compass rose */}
          <g transform={`translate(${viewBoxWidth - 14}, 12)`}>
            <circle cx="0" cy="0" r="7" fill="white" stroke="#e2e8f0" strokeWidth="0.5" />
            {/* N arrow */}
            <g transform={`rotate(${facingInfo.rotate})`}>
              <polygon points="0,-5.5 1.5,1 0,-0.5 -1.5,1" fill="#ef4444" />
              <polygon points="0,5.5 1.5,-1 0,0.5 -1.5,-1" fill="#94a3b8" />
            </g>
            <text x="0" y="0" textAnchor="middle" dominantBaseline="middle"
              fontSize="2.2" fill="#1e293b" fontWeight="800" fontFamily="sans-serif">
              {facingInfo.label}
            </text>
          </g>

          {/* Facing label badge */}
          <g transform={`translate(${padding}, ${viewBoxHeight - 5})`}>
            <rect x="0" y="-4" width={`${facing.length * 2 + 12}`} height="5" rx="2" fill="#1a1a2e" opacity="0.8" />
            <text x="6" y="-1.5" fontSize="2.6" fill="white" fontFamily="sans-serif" fontWeight="600">
              {facing} Facing
            </text>
          </g>
        </svg>
      </div>

      {/* Room legend */}
      <div className="flex flex-wrap gap-2 px-1">
        {roomsOnFloor.map((room, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredRoom(i)}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
              hoveredRoom === i ? "scale-105 shadow-md border-gray-400" : "border-gray-200"
            }`}
            style={{ backgroundColor: room.color + "33", borderColor: room.color }}
          >
            <span>{getRoomIcon(room.name)}</span>
            <span style={{ color: darken(room.color || "#999", 60) }}>{room.name}</span>
            <span className="opacity-60" style={{ color: darken(room.color || "#999", 40) }}>
              {room.width * room.length} sqft
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
