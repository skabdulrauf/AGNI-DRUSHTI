'use server';
/**
 * @fileOverview A tactical chat and navigation assistant flow for Agni-Drishti.
 *
 * - voiceAssistant - Handles voice/text queries, returns text, audio, and navigation instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

const VoiceAssistantInputSchema = z.object({
  query: z.string().describe('The user transcription or text query to respond to.'),
  lat: z.number().optional().describe('User latitude for spatial context.'),
  lng: z.number().optional().describe('User longitude for spatial context.'),
});
export type VoiceAssistantInput = z.infer<typeof VoiceAssistantInputSchema>;

const VoiceAssistantOutputSchema = z.object({
  text: z.string().describe('The text response to the user.'),
  audio: z.string().describe('Data URI of the audio response in WAV format.'),
  redirectTo: z.string().optional().describe('An optional URL path to redirect the user to if they express specific intent.'),
  intent: z.enum(['NONE', 'NAVIGATE', 'SUBMIT_REPORT']).optional().describe('The specific action intent detected.'),
  reportDescription: z.string().optional().describe('The description to use for a report if intent is SUBMIT_REPORT.'),
  locateZone: z.string().optional().describe('The name of a specific forest or zone the user wants to locate on the map.'),
  nearestZoneName: z.string().optional().describe('The name of the nearest forest zone found.'),
});
export type VoiceAssistantOutput = z.infer<typeof VoiceAssistantOutputSchema>;

// Tool to find nearest forest
const findNearestForest = ai.defineTool(
  {
    name: 'findNearestForest',
    description: 'Finds the nearest forest zone from the provided coordinates.',
    inputSchema: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    outputSchema: z.object({
      name: z.string(),
      distanceKm: z.number(),
    }),
  },
  async (input) => {
    const { firestore: db } = initializeFirebase();
    const snapshot = await getDocs(collection(db, 'zones'));
    let nearest = { name: "Unknown Forest", dist: Infinity };

    snapshot.forEach(doc => {
      const data = doc.data();
      const d = Math.sqrt(Math.pow(data.lat - input.lat, 2) + Math.pow(data.lng - input.lng, 2)) * 111; 
      if (d < nearest.dist) {
        nearest = { name: data.name, dist: d };
      }
    });

    return { name: nearest.name, distanceKm: Math.round(nearest.dist * 10) / 10 };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', (err) => reject(err));
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const brainPrompt = ai.definePrompt({
  name: 'voiceAssistantBrain',
  input: { schema: VoiceAssistantInputSchema },
  tools: [findNearestForest],
  output: { 
    schema: z.object({
      text: z.string(),
      redirectTo: z.string().optional(),
      intent: z.enum(['NONE', 'NAVIGATE', 'SUBMIT_REPORT']).optional(),
      reportDescription: z.string().optional(),
      locateZone: z.string().optional(),
      nearestZoneName: z.string().optional()
    })
  },
  system: `You are the Agni-Drishti Tactical Assistant.
  
  INTENT RULES:
  - If the user asks you to "report smoke", "fire", or "report for me": set intent to "SUBMIT_REPORT" and extract description. 
  - If coordinates (lat/lng) are provided, ALWAYS use findNearestForest tool to identify proximity. Mention the nearest forest name naturally.
  - If user asks to "locate" or "find" a specific place (e.g., "Locate Avalahalli"), set redirectTo to "/dashboard" and locateZone to the place name.
  
  CONTENT RULES:
  - You are a helpful AI assistant. While focused on India, you can provide global geographic context if asked.
  - Keep responses professional and under 3 sentences.`,
  prompt: `User says: {{{query}}}
  Location: Lat {{lat}}, Lng {{lng}}`,
});

export async function voiceAssistant(input: VoiceAssistantInput): Promise<VoiceAssistantOutput> {
  return voiceAssistantFlow(input);
}

const voiceAssistantFlow = ai.defineFlow(
  {
    name: 'voiceAssistantFlow',
    inputSchema: VoiceAssistantInputSchema,
    outputSchema: VoiceAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output: brainResult } = await brainPrompt(input);
      const text = brainResult?.text || "Tactical link established. How can I assist?";
      
      let audioDataUri = "";
      try {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.5-flash-preview-tts',
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Algenib' },
              },
            },
          },
          prompt: text,
        });

        if (media && media.url) {
          const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
          );
          const wavBase64 = await toWav(audioBuffer);
          audioDataUri = 'data:audio/wav;base64,' + wavBase64;
        }
      } catch (audioError) {
        console.warn("Audio generation skipped/failed:", audioError);
      }

      return {
        text,
        audio: audioDataUri,
        redirectTo: brainResult?.redirectTo,
        intent: brainResult?.intent || 'NONE',
        reportDescription: brainResult?.reportDescription,
        locateZone: brainResult?.locateZone,
        nearestZoneName: brainResult?.nearestZoneName
      };
    } catch (error: any) {
      console.error("Voice Assistant Error:", error);
      return {
        text: "I am having trouble connecting to the intelligence grid. Please check your signal.",
        audio: "",
        intent: 'NONE'
      };
    }
  }
);
