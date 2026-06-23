import { z } from "zod";

export const floorPlanFormSchema = z.object({
  plotWidth: z.coerce.number().min(10, "Plot width must be at least 10 feet").max(200, "Plot width must be less than 200 feet"),
  plotLength: z.coerce.number().min(10, "Plot length must be at least 10 feet").max(200, "Plot length must be less than 200 feet"),
  floors: z.coerce.number().int().min(1).max(4),
  facing: z.enum(["North", "South", "East", "West"]),
  bedrooms: z.coerce.number().int().min(1).max(10),
  bathrooms: z.coerce.number().int().min(1).max(10),
  hasParking: z.boolean().default(false),
  hasGarden: z.boolean().default(false),
  hasPooja: z.boolean().default(false),
  hasStudyRoom: z.boolean().default(false),
  vastuCompliant: z.boolean().default(false),
  additionalNotes: z.string().nullable().optional()
});

export type FloorPlanFormValues = z.infer<typeof floorPlanFormSchema>;
