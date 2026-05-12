
'use server';
/**
 * @fileOverview A fortified tactical chat assistant flow for Agni-Drishti.
 * Handles user intent extraction with robust phonetic normalization and multi-lingual support.
 * Optimized for users with low literacy or noisy inputs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const VoiceAssistantInputSchema = z.object({
  query: z.string().describe('The user transcription or text query to respond to.'),
  lat: z.number().optional().describe('User latitude for spatial context.'),
  lng: z.number().optional().describe('User longitude for spatial context.'),
  language: z.enum(['en', 'hi', 'kn']).optional().describe('Preferred tactical response language.'),
});
export type VoiceAssistantInput = z.infer<typeof VoiceAssistantInputSchema>;

const VoiceAssistantOutputSchema = z.object({
  text: z.string().describe('The text response to the user.'),
  audio: z.string().describe('Data URI of the audio response in WAV format.'),
  redirectTo: z.string().optional().describe('An optional URL path to redirect the user to.'),
  intent: z.enum(['NONE', 'NAVIGATE', 'SUBMIT_REPORT']).optional().describe('Detected intent.'),
  reportDescription: z.string().optional().describe('Description for auto-reporting.'),
  locateZone: z.string().optional().describe('Target zone for map focus.'),
  nearestZoneName: z.string().optional().describe('Nearest forest identified.'),
});
export type VoiceAssistantOutput = z.infer<typeof VoiceAssistantOutputSchema>;

/**
 * Robust tool to find nearest forest.
 */
const findNearestForest = ai.defineTool(
  {
    name: 'findNearestForest',
    description: 'Finds the nearest forest zone from coordinates. Crucial for tactical context.',
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
    try {
      const { firestore: db } = initializeFirebase();
      const snapshot = await getDocs(query(collection(db, 'zones'), limit(50)));
      
      let nearest = { name: "Jim Corbett Range", dist: Infinity };
      snapshot.forEach(doc => {
        const data = doc.data();
        const d = Math.sqrt(Math.pow(data.lat - input.lat, 2) + Math.pow(data.lng - input.lng, 2)) * 111; 
        if (d < nearest.dist) {
          nearest = { name: data.name, dist: d };
        }
      });

      return { name: nearest.name, distanceKm: Math.round(nearest.dist * 10) / 10 };
    } catch (e) {
      return { name: "Primary Forest Grid", distanceKm: 0 };
    }
  }
);

async function pcmToWav(
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

const assistantPrompt = ai.definePrompt({
  name: 'voiceAssistantPrompt',
  input: { schema: VoiceAssistantInputSchema },
  tools: [findNearestForest],
  output: { 
    schema: z.object({
      text: z.string().describe('Clear, professional tactical response in the requested language.'),
      redirectTo: z.string().optional().describe('Path like /dashboard or /report'),
      intent: z.enum(['NONE', 'NAVIGATE', 'SUBMIT_REPORT']).optional(),
      reportDescription: z.string().optional(),
      locateZone: z.string().optional(),
      nearestZoneName: z.string().optional()
    })
  },
  system: `You are the AGNI-DRISHTI Tactical Intelligence Assistant.
  
  ROBUSTNESS & PHONETIC NORMALIZATION:
  - Users may be illiterate or have poor spelling skills. Correct their input internally.
  - "fayar", "piyer", "aag", "benki" -> FIRE
  - "somk", "dhuan", "hoge" -> SMOKE
  - "avalali", "avalahali" -> Avalahalli Forest
  - Infer intent even from heavily misspelled queries. If they mention fire/smoke in any misspelled form, set intent="SUBMIT_REPORT".

  LANGUAGE PREFERENCE:
  - If language is 'hi', respond ONLY in Hindi script.
  - If language is 'kn', respond ONLY in Kannada script.
  - Otherwise, respond in clear English.
  
  INTENT RECOGNITION:
  - "Report smoke/fire": set intent="SUBMIT_REPORT", generate description.
  - "Where am I": use findNearestForest tool.
  - "Locate [Place]": set redirectTo="/dashboard" and locateZone=[Place].
  
  BEHAVIOR:
  - Tactical, calm, and authoritative tone.
  - Keep responses under 20 words.`,
  prompt: `User Query: {{{query}}}
  Requested Language: {{{language}}}
  Context: Location [{{lat}}, {{lng}}]`,
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
      const { output: brain } = await assistantPrompt(input);
      if (!brain) throw new Error("AI Brain interdiction failure.");

      const textResponse = brain.text || "Tactical link stable.";
      
      let audioUri = "";
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
          prompt: textResponse,
        });

        if (media && media.url) {
          const pcmBase64 = media.url.split(',')[1];
          const audioBuffer = Buffer.from(pcmBase64, 'base64');
          const wavBase64 = await pcmToWav(audioBuffer);
          audioUri = `data:audio/wav;base64,${wavBase64}`;
        }
      } catch (audioError) {
        console.warn("TTS Interference.");
      }

      return {
        text: textResponse,
        audio: audioUri,
        redirectTo: brain.redirectTo,
        intent: brain.intent || 'NONE',
        reportDescription: brain.reportDescription,
        locateZone: brain.locateZone,
        nearestZoneName: brain.nearestZoneName
      };
    } catch (error: any) {
      console.error("AI Assistant Failure:", error);
      return {
        text: "Grid interdiction active.",
        audio: "",
        intent: 'NONE'
      };
    }
  }
);
