import { Router } from "express";
import OpenAI from "openai";
import { GenerateFloorPlanBody } from "@workspace/api-zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ROOM_COLORS: Record<string, string> = {
  "Living Room": "#E8D5B7",
  "Master Bedroom": "#B7C5E8",
  "Bedroom": "#C5E8B7",
  "Bathroom": "#E8B7C5",
  "Kitchen": "#E8E0B7",
  "Dining Room": "#D4B7E8",
  "Pooja Room": "#FFE4B5",
  "Study Room": "#B7E8E0",
  "Parking": "#D0D0D0",
  "Garden": "#90EE90",
  "Staircase": "#C8C8C8",
  "Balcony": "#DDA0DD",
  "Lobby": "#F5DEB3",
  "Utility": "#D2B48C",
};

function getRoomColor(roomName: string): string {
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (roomName.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#E0E0E0";
}

router.post("/floorplan/generate", async (req, res) => {
  const parsed = GenerateFloorPlanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const input = parsed.data;

  const prompt = `You are an expert Indian architect. Generate a detailed floor plan layout for a house with these specifications:

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
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ""}

CRITICAL RULES:
1. All rooms must fit WITHIN the plot boundaries (0,0) to (${input.plotWidth}, ${input.plotLength})
2. Rooms should not overlap each other
3. The total area of all rooms on each floor should not exceed the plot area
4. Leave ~1 foot margin for walls
5. For multi-floor buildings, distribute rooms across floors logically

Return a JSON object (no markdown, no code blocks) with this exact structure:
{
  "rooms": [
    {
      "name": "Room Name",
      "x": number (feet from left),
      "y": number (feet from top),
      "width": number (feet),
      "length": number (feet),
      "floor": number (0=ground, 1=first, etc.)
    }
  ],
  "description": "A brief professional description of this floor plan design",
  "vastuNotes": "Vastu compliance notes" or null
}

Make the layout practical and realistic for Indian homes. Include staircase if multiple floors.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed_result: any;
    try {
      parsed_result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }
      parsed_result = JSON.parse(jsonMatch[0]);
    }

    const rooms = (parsed_result.rooms || []).map((room: any) => ({
      name: room.name,
      x: Number(room.x),
      y: Number(room.y),
      width: Number(room.width),
      length: Number(room.length),
      floor: Number(room.floor ?? 0),
      color: getRoomColor(room.name),
    }));

    return res.json({
      rooms,
      plotWidth: input.plotWidth,
      plotLength: input.plotLength,
      floors: input.floors,
      description: parsed_result.description || "Floor plan generated successfully.",
      vastuNotes: parsed_result.vastuNotes || null,
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate floor plan" });
  }
});

export default router;
