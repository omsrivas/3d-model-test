import React, { useMemo } from "react";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan2DProps {
  result: FloorPlanResult;
}

export function FloorPlan2D({ result }: FloorPlan2DProps) {
  const [activeFloor, setActiveFloor] = React.useState(0);

  const roomsOnFloor = useMemo(() => {
    return result.rooms.filter(r => r.floor === activeFloor);
  }, [result.rooms, activeFloor]);

  const maxFloor = useMemo(() => {
    return Math.max(0, ...result.rooms.map(r => r.floor));
  }, [result.rooms]);

  // viewBox calculations
  const padding = 10;
  const viewBoxWidth = result.plotWidth + padding * 2;
  const viewBoxHeight = result.plotLength + padding * 2;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {result.floors > 1 && (
        <div className="flex gap-2 border-b border-border pb-2">
          {Array.from({ length: result.floors }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveFloor(i)}
              className={`px-4 py-2 text-sm font-medium ${
                activeFloor === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full aspect-square border border-border bg-white overflow-hidden p-4">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: `20px 20px`
          }}
        />
        
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full drop-shadow-sm"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Plot boundary */}
          <rect
            x={padding}
            y={padding}
            width={result.plotWidth}
            height={result.plotLength}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {roomsOnFloor.map((room, i) => (
            <g key={i} transform={`translate(${room.x + padding}, ${room.y + padding})`}>
              <rect
                width={room.width}
                height={room.length}
                fill={room.color || "hsl(var(--muted))"}
                stroke="hsl(var(--foreground))"
                strokeWidth="1"
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
              <text
                x={room.width / 2}
                y={room.length / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={Math.min(room.width, room.length) * 0.15}
                fontWeight="500"
                className="pointer-events-none select-none"
              >
                {room.name}
              </text>
              <text
                x={room.width / 2}
                y={room.length / 2 + Math.min(room.width, room.length) * 0.2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={Math.min(room.width, room.length) * 0.1}
                className="opacity-70 pointer-events-none select-none"
              >
                {room.width}x{room.length}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
