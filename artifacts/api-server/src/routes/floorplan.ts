import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateFloorPlanBody } from "@workspace/api-zod";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

  const prompt = `You are an expert Indian architect. Generate a practical floor plan for a house.

Plot Size: ${input.plotWidth} x ${input.plotLength} feet
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

STRICT RULES:
- All room x, y, width, length values must be numbers (not strings)
- x + width must NOT exceed ${input.plotWidth}
- y + length must NOT exceed ${input.plotLength}
- Rooms must not overlap
- Leave 1 foot margin on edges (so x >= 1, y >= 1, x+width <= ${input.plotWidth - 1}, y+length <= ${input.plotLength - 1})
- For multiple floors, use floor: 0 for ground, 1 for first floor, etc.
- Include staircase if floors > 1

Return ONLY a raw JSON object (no markdown, no \`\`\`json, no explanation):
{
  "rooms": [
    { "name": "Living Room", "x": 1, "y": 1, "width": 15, "length": 12, "floor": 0 },
    { "name": "Kitchen", "x": 16, "y": 1, "width": 10, "length": 10, "floor": 0 }
  ],
  "description": "Brief professional description of this layout",
  "vastuNotes": "Vastu notes or null"
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

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
    console.error("Gemini error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate floor plan" });
  }
});

export default router;
