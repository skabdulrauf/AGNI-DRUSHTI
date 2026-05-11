'use server';
/**
 * @fileOverview A Genkit flow for classifying citizen reports related to forest fires.
 *
 * - classifyCitizenReport - A function that handles the classification of a citizen report.
 * - ClassifyCitizenReportInput - The input type for the classifyCitizenReport function.
 * - ClassifyCitizenReportOutput - The return type for the classifyCitizenReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClassifyCitizenReportInputSchema = z.object({
  description: z.string().describe('The description of the reported incident.'),
  photo_base64: z.string().optional().describe(
    "Optional photo of the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ClassifyCitizenReportInput = z.infer<typeof ClassifyCitizenReportInputSchema>;

const ClassifyCitizenReportOutputSchema = z.object({
  is_fire_related: z.boolean().describe('Whether the report is related to a fire incident.'),
  verdict: z.enum(['FIRE', 'NON_FIRE', 'UNDER_REVIEW']).describe('The AI\'s verdict on the report.'),
  confidence: z.number().int().min(0).max(100).describe('Confidence level of the AI classification (0-100).'),
  smoke_type: z.enum(['black', 'white', 'grey', 'none']).describe('The detected smoke type.'),
});
export type ClassifyCitizenReportOutput = z.infer<typeof ClassifyCitizenReportOutputSchema>;

export async function classifyCitizenReport(input: ClassifyCitizenReportInput): Promise<ClassifyCitizenReportOutput> {
  return classifyCitizenReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyCitizenReportPrompt',
  input: { schema: ClassifyCitizenReportInputSchema },
  output: { schema: ClassifyCitizenReportOutputSchema },
  prompt: `You are a forest fire complaint classifier for India. Your task is to analyze citizen reports, which may include a description and an optional photo, and classify them.\n\nRespond ONLY in JSON. The JSON must adhere to the following schema:\nis_fire_related: boolean (true if the report indicates a fire, false otherwise)\nverdict: "FIRE" | "NON_FIRE" | "UNDER_REVIEW" (categorize the report based on evidence)\nconfidence: integer (0-100, how confident you are in your classification)\nsmoke_type: "black" | "white" | "grey" | "none" (classify the type of smoke if visible or described)\n\nIf a photo is provided, prioritize visual evidence. If no photo, rely on the description.\nIf the information is ambiguous, set verdict to "UNDER_REVIEW" and confidence accordingly.\n\nDescription: {{{description}}}\n{{#if photo_base64}}\nPhoto: {{media url=photo_base64}}\n{{/if}}\n`,
});

const classifyCitizenReportFlow = ai.defineFlow(
  {
    name: 'classifyCitizenReportFlow',
    inputSchema: ClassifyCitizenReportInputSchema,
    outputSchema: ClassifyCitizenReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
