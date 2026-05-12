'use server';
/**
 * @fileOverview Live Forest Fire Risk Analysis AI Agent.
 * Uses real-time meteorological and thermal data to provide grounded assessments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RangerFireRiskAnalysisInputSchema = z.object({
  name: z.string().describe('The name of the forest zone or location.'),
  state: z.string().describe('The state or region.'),
  temp: z.number().describe('Current live temperature in Celsius.'),
  humidity: z.number().describe('Current relative humidity percentage.'),
  wind: z.number().describe('Current wind speed in km/h.'),
  direction: z.string().describe('Current wind direction in degrees or compass points.'),
  hotspots: z.number().describe('Number of active hotspots detected within 50km radius via FIRMS.'),
  month: z.string().describe('Current month.'),
});
export type RangerFireRiskAnalysisInput = z.infer<typeof RangerFireRiskAnalysisInputSchema>;

const RangerFireRiskAnalysisOutputSchema = z.object({
  risk_score: z.number().int().min(0).max(100).describe('An integer risk score from 0 to 100 based strictly on input data.'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).describe('Categorical risk level.'),
  primary_factors: z.string().describe('Explicitly mention the temp, humidity, and hotspots in this factor analysis.'),
  spread_direction: z.string().describe('Predicted compass direction of fire spread based on wind.'),
  spread_radius_km: z.number().int().min(1).max(20).describe('Predicted radius of fire spread in kilometers.'),
  action_plan: z.array(z.string()).describe('A list of concrete actions to take.'),
  alert_english: z.string().describe('Emergency alert in English.'),
  alert_hindi: z.string().describe('Emergency alert in Hindi script.'),
  alert_kannada: z.string().describe('Emergency alert in Kannada script.'),
  forecast_summary: z.string().describe('Summary of weather impact.'),
});
export type RangerFireRiskAnalysisOutput = z.infer<typeof RangerFireRiskAnalysisOutputSchema>;

export async function rangerFireRiskAnalysis(input: RangerFireRiskAnalysisInput): Promise<RangerFireRiskAnalysisOutput> {
  return rangerFireRiskAnalysisFlow(input);
}

const rangerFireRiskAnalysisPrompt = ai.definePrompt({
  name: 'rangerFireRiskAnalysisPrompt',
  input: { schema: RangerFireRiskAnalysisInputSchema },
  output: { schema: RangerFireRiskAnalysisOutputSchema },
  system: `You are AGNI-DRISHTI, the high-intelligence AI forest fire risk analyst.
  
  DATA GROUNDING RULES:
  1. Use the provided numbers (Temp, Humidity, Wind, Hotspots) to calculate risk. 
  2. Do NOT hallucinate data. If hotspots are 0, state that there are no current thermal anomalies.
  3. Risk Assessment Logic:
     - EXTREME: Temp > 40C OR (Temp > 35C AND Humidity < 15%) OR Hotspots > 5.
     - HIGH: Temp > 32C OR Humidity < 25% OR Hotspots > 1.
     - MEDIUM: Humidity 25-45% OR Wind > 25 km/h.
     - LOW: Otherwise.
  4. Always mention the specific live metrics in the primary_factors.
  5. Alerts must be professional, urgent, and in English, Hindi, and Kannada.`,
  prompt: `Location Context: {{{name}}}, {{{state}}}.
  LIVE METRICS:
  - Temperature: {{{temp}}}°C
  - Humidity: {{{humidity}}}%
  - Wind: {{{wind}}} km/h from {{{direction}}}
  - Active Hotspots (NASA FIRMS): {{{hotspots}}}
  - Seasonal Context: {{{month}}}
  
  Analyze the threat level for this specific grid coordinate.`,
});

const rangerFireRiskAnalysisFlow = ai.defineFlow(
  {
    name: 'rangerFireRiskAnalysisFlow',
    inputSchema: RangerFireRiskAnalysisInputSchema,
    outputSchema: RangerFireRiskAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await rangerFireRiskAnalysisPrompt(input);
    if (!output) {
      throw new Error('Intelligence engine failed to generate response.');
    }
    return output;
  }
);
