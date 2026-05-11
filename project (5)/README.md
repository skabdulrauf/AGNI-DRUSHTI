# AGNI-DRISHTI ("जंगल की आँख")

AI-powered forest fire early warning system for India. Integrates NASA FIRMS satellite telemetry with trilingual AI citizen reporting and a tactical agentic chat assistant.

## 🛠️ Key Tactical Features
- **Agentic AI Assistant**: Automatically handles "report smoke" intents with high-precision GPS lock and autonomous SITREP submission.
- **Geospatial Intelligence**: Proactively identifies the nearest forest (e.g., Avalahalli Forest) using live coordinates.
- **Tactical Dashboard**: Immersive Liquid Glass HUD with NASA FIRMS hotspots and live ground-truth reports.
- **Trilingual Interdiction**: Emergency alerts and reports processed in English, Hindi, and Kannada script.

## 🚀 Getting Started
1. **Environment Variables**: Ensure you have a `.env` file with your Firebase and Google AI credentials:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `GOOGLE_GENAI_API_KEY`
2. **Installation**: Run `npm install`.
3. **Development**: Run `npm run dev` to launch the tactical grid.

## 🌐 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI Engine**: Genkit + Gemini 1.5 Flash
- **Database/Auth**: Firebase Firestore & Authentication
- **Mapping**: Leaflet + NASA FIRMS Telemetry
- **Styling**: Tailwind CSS + ShadCN UI (Liquid Glass Theme)