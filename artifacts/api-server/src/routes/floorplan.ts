import { Router } from "express";
import Groq from "groq-sdk";
import { GenerateFloorPlanBody } from "@workspace/api-zod";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

function clampRooms(rooms: any[], plotWidth: number, plotLength: number) {
  return rooms.map(r => {
    const x = Math.max(1, Math.min(r.x, plotWidth - 4));
    const y = Math.max(1, Math.min(r.y, plotLength - 4));
    const width = Math.max(4, Math.min(r.width, plotWidth - 1 - x));
    const length = Math.max(4, Math.min(r.length, plotLength - 1 - y));
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

  const vastuZones = input.vastuCompliant ? `
VASTU PLACEMENT RULES (mandatory):
- Pooja/Mandir: North-East corner (x near 1, y near 1)
- Kitchen: South-East zone (x high, y high) — fire element
- Master Bedroom: South-West corner (large room, x high, y high)
- Drawing Room / Living: North or North-East zone (near entrance)
- Bathrooms: South or West zones, never North-East
- Staircase if any: South, West, or South-West
- Garden/Lawn: North or East side
- Study Room: West or North-West
- Garage/Parking: South-East or North-West` : "";

  const facingDesc =
    input.facing === "North" ? "Main entrance (GATE) is on the NORTH side — rooms at y=1 face the street" :
    input.facing === "South" ? "Main entrance (GATE) is on the SOUTH side — rooms at y high face the street" :
    input.facing === "East"  ? "Main entrance (GATE) is on the EAST side — rooms at x high face the street" :
    "Main entrance (GATE) is on the WEST side — rooms at x=1 face the street";

  // compute example row heights for guidance
  const r1L = Math.round(usableL * 0.28);
  const r2L = Math.round(usableL * 0.35);
  const r3L = Math.round(usableL * 0.22);
  const r4L = usableL - r1L - r2L - r3L;

  const prompt = `You are a highly experienced Indian residential architect. Design a COMPLETE, PROFESSIONAL floor plan for the following plot. The result should look like a real architectural drawing with proper room proportions, good flow, and Vastu compliance.

PLOT: ${input.plotWidth} ft wide × ${input.plotLength} ft long (usable interior: ${usableW} × ${usableL} ft = ${totalArea} sq ft)
FACING: ${facingDesc}
FLOORS: ${input.floors}
REQUIRED ROOMS: ${input.bedrooms} Bedrooms, ${input.bathrooms} Bathrooms/Attached Baths${input.hasParking ? ", Car Porch/Parking" : ""}${input.hasGarden ? ", Garden/Lawn" : ""}${input.hasPooja ? ", Pooja Room" : ""}${input.hasStudyRoom ? ", Study Room" : ""}
${input.additionalNotes ? `SPECIAL NOTES: ${input.additionalNotes}` : ""}
${vastuZones}

LAYOUT RULES (FOLLOW STRICTLY):
1. Every room MUST be a rectangle — provide x, y, width, length as integers (in feet)
2. Coordinate system: x goes LEFT→RIGHT (0 to ${input.plotWidth}), y goes TOP→BOTTOM (0 to ${input.plotLength})
3. ALL rooms must be WITHIN plot boundaries: x ≥ 1, y ≥ 1, x+width ≤ ${input.plotWidth - 1}, y+length ≤ ${input.plotLength - 1}
4. NO two rooms may OVERLAP — verify every pair
5. Rooms in each row MUST share the same y and same length value, and their widths must sum exactly to ${usableW}
6. Total room area must cover ≥ 90% of ${totalArea} sq ft
7. Bathroom/attached bath must be ADJACENT (shares x or y boundary) with its bedroom
8. Include a Foyer/Entrance near the facing side
9. Car Porch/Parking should be accessible from the gate side

TYPICAL ROOM SIZES (adapt to fit your design):
- Master Bedroom: 14–16 ft wide × 13–15 ft long
- Bedroom: 12–14 ft wide × 12–14 ft long
- Attached Bath: 7–8 ft wide × 6–7 ft long
- Family Lounge / Living: 18–22 ft wide × 15–18 ft long
- Drawing Room: 14–16 ft wide × 12–14 ft long
- Kitchen: 12–14 ft wide × 10–12 ft long
- Dining: 10–12 ft wide × 10–12 ft long
- Foyer: 6–8 ft wide × 7–9 ft long
- Pooja Room: 5–7 ft wide × 6–8 ft long
- Car Porch: 14–18 ft wide × 16–20 ft long
- Garden/Lawn: remaining front/side space

EXAMPLE STRUCTURE for ${input.plotWidth}×${input.plotLength} (adapt sizes creatively):
Row 1 (y=1, length=${r1L}): Foyer + Bedroom + Drawing Room across ${usableW} ft
Row 2 (y=${1 + r1L}, length=${r2L}): Family Lounge + Kitchen across ${usableW} ft
Row 3 (y=${1 + r1L + r2L}, length=${r3L}): Bedrooms + Bathrooms across ${usableW} ft
Row 4 (y=${1 + r1L + r2L + r3L}, length=${r4L}): Garden + Car Porch across ${usableW} ft

Return ONLY valid raw JSON — NO markdown, NO explanation, NO code fences:
{
  "rooms": [
    {"name":"Foyer","x":1,"y":1,"width":8,"length":9,"floor":0},
    {"name":"Bedroom 1","x":9,"y":1,"width":14,"length":13,"floor":0},
    ...
  ],
  "description": "3-sentence professional description of the design concept and key features",
  "vastuNotes": "Vastu compliance summary or null if not applicable"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.55,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsedResult: any;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });
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
