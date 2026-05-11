
'use server';
/**
 * @fileOverview A forest fire risk analysis AI agent for rangers.
 *
 * - rangerFireRiskAnalysis - A function that handles the forest fire risk analysis process.
 * - RangerFireRiskAnalysisInput - The input type for the rangerFireRiskAnalysis function.
 * - RangerFireRiskAnalysisOutput - The return type for the rangerFireRiskAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RangerFireRiskAnalysisInputSchema = z.object({
  name: z.string().describe('The name of the forest zone.'),
  state: z.string().describe('The state where the forest zone is located.'),
  temp: z.number().describe('Current temperature in Celsius.'),
  humidity: z.number().describe('Current relative humidity in percentage.'),
  wind: z.number().describe('Current wind speed in km/h.'),
  direction: z.string().describe('Current wind direction (e.g., North, South-East).'),
  hotspots: z.number().describe('Number of hotspots detected within a 50km radius.'),
  month: z.string().describe('Current month (e.g., January, June).'),
});
export type RangerFireRiskAnalysisInput = z.infer<typeof RangerFireRiskAnalysisInputSchema>;

const RangerFireRiskAnalysisOutputSchema = z.object({
  risk_score: z.number().int().min(0).max(100).describe('An integer risk score from 0 to 100.'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).describe('Categorical risk level.'),
  primary_factors: z.string().describe('Two sentences describing the primary factors contributing to the risk.'),
  spread_direction: z.string().describe('Predicted compass direction of fire spread.'),
  spread_radius_km: z.number().int().min(1).max(20).describe('Predicted radius of fire spread in kilometers.'),
  action_plan: z.array(z.string()).describe('A list of concrete actions to take.'),
  alert_english: z.string().describe('An emergency alert message in English.'),
  alert_hindi: z.string().describe('An emergency alert message in Hindi script.'),
  alert_kannada: z.string().describe('An emergency alert message in Kannada script.'),
  forecast_summary: z.string().describe('Two sentences summarizing the weather forecast impact.'),
});
export type RangerFireRiskAnalysisOutput = z.infer<typeof RangerFireRiskAnalysisOutputSchema>;

export async function rangerFireRiskAnalysis(input: RangerFireRiskAnalysisInput): Promise<RangerFireRiskAnalysisOutput> {
  return rangerFireRiskAnalysisFlow(input);
}

const rangerFireRiskAnalysisPrompt = ai.definePrompt({
  name: 'rangerFireRiskAnalysisPrompt',
  input: { schema: RangerFireRiskAnalysisInputSchema },
  output: { schema: RangerFireRiskAnalysisOutputSchema },
  system: `You are AGNI-DRISHTI, the high-intelligence AI forest fire risk analyst for Indian forests. 
  Analyze meteorological and thermal anomaly data. 
  Provide risk assessment, spread predictions, and an action plan.
  Your tone is professional and urgent.
  Alerts must be in English, Hindi, and Kannada script.`,
  prompt: `Zone: {{{name}}}, {{{state}}}. 
  Current Data: 
  Temp: {{{temp}}}°C
  Humidity: {{{humidity}}}%
  Wind: {{{wind}}} km/h from {{{direction}}}
  Nearby Hotspots (FIRMS): {{{hotspots}}}
  Month: {{{month}}} (Indian peak fire season: Feb-June).
  
  Predict fire behavior based on this data. Extreme risk thresholds: temp>35, humidity<20, wind>40, hotspots>3.`,
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
      throw new Error('AI analysis failed to return output.');
    }
    return output;
  }
);
