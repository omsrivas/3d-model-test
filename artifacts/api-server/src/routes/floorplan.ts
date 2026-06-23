import { Router } from "express";
import Groq from "groq-sdk";
import { GenerateFloorPlanBody } from "@workspace/api-zod";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const ROOM_COLORS: Record<string, string> = {
  "living room": "#FF6B6B",
  "drawing room": "#FF6B6B",
  "hall": "#FF6B6B",
  "master bedroom": "#4ECDC4",
  "bedroom 1": "#4ECDC4",
  "bedroom": "#45B7D1",
  "bathroom": "#96CEB4",
  "toilet": "#96CEB4",
  "washroom": "#96CEB4",
  "kitchen": "#FFEAA7",
  "dining room": "#DDA0DD",
  "dining": "#DDA0DD",
  "pooja room": "#FFB347",
  "pooja": "#FFB347",
  "mandir": "#FFB347",
  "study room": "#B39DDB",
  "study": "#B39DDB",
  "office": "#B39DDB",
  "parking": "#90A4AE",
  "garage": "#90A4AE",
  "garden": "#81C784",
  "lawn": "#81C784",
  "courtyard": "#A5D6A7",
  "staircase": "#BCAAA4",
  "stairs": "#BCAAA4",
  "balcony": "#F48FB1",
  "lobby": "#FFD54F",
  "foyer": "#FFD54F",
  "passage": "#CE93D8",
  "corridor": "#CE93D8",
  "utility": "#80CBC4",
  "store": "#A1887F",
  "servant": "#EF9A9A",
};

function getRoomColor(roomName: string): string {
  const lower = roomName.toLowerCase();
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  const hues = ["#FF8A80","#82B1FF","#CCFF90","#FFD180","#EA80FC","#80D8FF","#FFFF8D","#B9F6CA"];
  let hash = 0;
  for (const c of lower) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return hues[Math.abs(hash) % hues.length];
}

// Post-process: clamp rooms to plot boundaries
function clampRooms(rooms: any[], plotWidth: number, plotLength: number) {
  return rooms.map(r => {
    const x = Math.max(1, Math.min(r.x, plotWidth - 2));
    const y = Math.max(1, Math.min(r.y, plotLength - 2));
    const width = Math.max(3, Math.min(r.width, plotWidth - 1 - x));
    const length = Math.max(3, Math.min(r.length, plotLength - 1 - y));
    return { ...r, x, y, width, length };
  });
}

router.post("/floorplan/generate", async (req, res) => {
  const parsed = GenerateFloorPlanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const input = parsed.data;

  const usableW = input.plotWidth - 2;
  const usableL = input.plotLength - 2;
  const totalArea = usableW * usableL;
  const minArea = Math.round(totalArea * 0.92);

  // Build Vastu guidance
  const vastuRules = input.vastuCompliant ? `
VASTU RULES (strictly follow):
- Kitchen: South-East zone (right-bottom area of plot)
- Master Bedroom: South-West zone (left-bottom or right-bottom)
- Pooja Room: North-East zone (x near 1, y near 1)
- Living Room: North or East facing zone
- Bathrooms: avoid North-East corner; best in South or West
- Balcony/Garden: North or East side
- Study Room: West or South-West zone` : "";

  // Smart layout examples based on plot size
  const row1L = Math.round(usableL * 0.38);
  const row2L = Math.round(usableL * 0.32);
  const row3L = usableL - row1L - row2L;
  const col1W = Math.round(usableW * 0.45);
  const col2W = Math.round(usableW * 0.35);
  const col3W = usableW - col1W - col2W;

  const prompt = `You are a CREATIVE senior Indian architect with 30 years of experience. Design a UNIQUE, INTELLIGENT floor plan — NOT a boring cookie-cutter layout.

Plot: ${input.plotWidth}×${input.plotLength} ft (usable: ${usableW}×${usableL} = ${totalArea} sq ft)
Facing: ${input.facing} | Floors: ${input.floors}
Rooms needed: ${input.bedrooms} Bedrooms, ${input.bathrooms} Bathrooms${input.hasParking ? ", Parking" : ""}${input.hasGarden ? ", Garden" : ""}${input.hasPooja ? ", Pooja Room" : ""}${input.hasStudyRoom ? ", Study Room" : ""}
${input.additionalNotes ? `Special requirements: ${input.additionalNotes}` : ""}
${vastuRules}

DESIGN PRINCIPLES (make it feel like a real architect designed it):
1. Vary room proportions intelligently — living room should feel spacious (wide), bedrooms balanced, bathrooms compact
2. Create visual interest: use 3 columns of varying widths, not just 2
3. Group related rooms: kitchen+dining together, bedrooms+bathrooms together
4. Avoid identical room sizes — each room should have a distinct character
5. Balcony/garden near living room or main bedroom; NOT tucked in a corner
6. Passage/lobby near entrance as a transitional space
7. Think about privacy: bedrooms in quieter back zone, social spaces in front

COVERAGE RULES (MANDATORY — DO NOT SKIP):
- Total room area sum MUST be ≥ ${minArea} sq ft (92% of ${totalArea})
- Plot grid: x from 1 to ${input.plotWidth - 1}, y from 1 to ${input.plotLength - 1}
- NO room may exceed these boundaries: x+width ≤ ${input.plotWidth - 1}, y+length ≤ ${input.plotLength - 1}
- NO two rooms may overlap — check every pair
- All values must be integers
- Arrange rooms in rows; each row's rooms must share same y and same length; widths in a row must sum to ${usableW}

EXAMPLE STRUCTURE for ${input.plotWidth}×${input.plotLength} (adapt sizes, don't copy exactly):
Row 1 (y=1, length=${row1L}): col1 w=${col1W} | col2 w=${col2W} | col3 w=${col3W}
Row 2 (y=${1 + row1L}, length=${row2L}): different split e.g. ${Math.round(usableW * 0.6)} | ${usableW - Math.round(usableW * 0.6)}
Row 3 (y=${1 + row1L + row2L}, length=${row3L}): another creative split

Return ONLY valid raw JSON, no markdown, no explanation:
{
  "rooms": [
    {"name":"<room name>","x":<int>,"y":<int>,"width":<int>,"length":<int>,"floor":<int>}
  ],
  "description": "<2-3 sentence professional description highlighting unique features>",
  "vastuNotes": "<vastu compliance notes or null>"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsedResult: any;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    }

    const rawRooms = clampRooms(parsedResult.rooms || [], input.plotWidth, input.plotLength);

    const rooms = rawRooms.map((room: any) => ({
      name: String(room.name),
      x: Number(room.x),
      y: Number(room.y),
      width: Number(room.width),
      length: Number(room.length),
      floor: Number(room.floor ?? 0),
      color: getRoomColor(String(room.name)),
    }));

    return res.json({
      rooms,
      plotWidth: input.plotWidth,
      plotLength: input.plotLength,
      floors: input.floors,
      facing: input.facing,
      description: parsedResult.description || "Floor plan generated successfully.",
      vastuNotes: parsedResult.vastuNotes || null,
    });
  } catch (error: any) {
    console.error("Groq error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate floor plan" });
  }
});

export default router;
