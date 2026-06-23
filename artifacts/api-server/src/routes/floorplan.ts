import { Router } from "express";
import Groq from "groq-sdk";
import { GenerateFloorPlanBody } from "@workspace/api-zod";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const ROOM_COLORS: Record<string, string> = {
  "living room": "#E8D5B7",
  "master bedroom": "#B7C5E8",
  "bedroom": "#C5E8B7",
  "bathroom": "#E8B7C5",
  "kitchen": "#E8E0B7",
  "dining room": "#D4B7E8",
  "pooja room": "#FFE4B5",
  "study room": "#B7E8E0",
  "parking": "#D0D0D0",
  "garden": "#90EE90",
  "staircase": "#C8C8C8",
  "balcony": "#DDA0DD",
  "lobby": "#F5DEB3",
  "utility": "#D2B48C",
};

function getRoomColor(roomName: string): string {
  const lower = roomName.toLowerCase();
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#E0E0E0";
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

  const prompt = `You are an expert Indian architect. Generate an OPTIMIZED floor plan that uses MAXIMUM available plot area.

Plot Size: ${input.plotWidth} x ${input.plotLength} feet (usable area: ${usableW} x ${usableL} = ${totalArea} sq ft)
Floors: ${input.floors}
Plot Facing: ${input.facing}
Bedrooms: ${input.bedrooms}
Bathrooms: ${input.bathrooms}
Parking: ${input.hasParking ? "Yes" : "No"}
Garden: ${input.hasGarden ? "Yes" : "No"}
Pooja Room: ${input.hasPooja ? "Yes" : "No"}
Study Room: ${input.hasStudyRoom ? "Yes" : "No"}
Vastu Compliant: ${input.vastuCompliant ? "Yes" : "No"}
${input.additionalNotes ? `Notes: ${input.additionalNotes}` : ""}

CRITICAL SPACE RULES — YOU MUST FOLLOW ALL:
1. ALL rooms together MUST cover at least 90% of the usable area (${Math.round(totalArea * 0.9)} sq ft minimum)
2. Rooms must tile like a grid — NO empty gaps between rooms
3. x must start at 1, y must start at 1
4. Every room: x+width <= ${input.plotWidth - 1}, y+length <= ${input.plotLength - 1}
5. Rooms must NOT overlap — verify each pair
6. All values must be integers
7. Rows of rooms must align: rooms in the same row share the same y and same length
8. Each floor must independently cover the full plot area
9. Include staircase on every floor if floors > 1

LAYOUT STRATEGY:
- Divide the plot into horizontal bands (rows), each row spanning full width ${usableW}
- Within each row, split width among rooms (widths must sum to exactly ${usableW})
- Typical band heights: 10-14 feet per row, stacked until total = ${usableL}

Return ONLY a raw JSON object (no markdown, no \`\`\`json, no explanation):
{
  "rooms": [
    { "name": "Living Room", "x": 1, "y": 1, "width": ${Math.round(usableW * 0.55)}, "length": ${Math.round(usableL * 0.35)}, "floor": 0 },
    { "name": "Kitchen", "x": ${1 + Math.round(usableW * 0.55)}, "y": 1, "width": ${usableW - Math.round(usableW * 0.55)}, "length": ${Math.round(usableL * 0.35)}, "floor": 0 }
  ],
  "description": "Brief professional description",
  "vastuNotes": "Vastu notes or null"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
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

    const rooms = (parsedResult.rooms || []).map((room: any) => ({
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
      description: parsedResult.description || "Floor plan generated successfully.",
      vastuNotes: parsedResult.vastuNotes || null,
    });
  } catch (error: any) {
    console.error("Groq error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate floor plan" });
  }
});

export default router;
