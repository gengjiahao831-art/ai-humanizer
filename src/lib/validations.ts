import { z } from "zod";

export const humanizeRequestSchema = z.object({
  text: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(10000, "Text must be under 10,000 characters"),
  voiceSampleId: z.string().optional(),
  mode: z.enum(["standard", "aggressive"]).optional().default("standard"),
});

export type HumanizeRequest = z.infer<typeof humanizeRequestSchema>;
