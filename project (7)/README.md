
# AGNI-DRISHTI ("जंगल की आँख")

AI-powered forest fire early warning system for India. Integrates NASA FIRMS satellite telemetry with trilingual AI citizen reporting and a tactical agentic chat assistant.

## 🚀 Deployment Instructions

### 1. Export & Setup
- Export the project as a ZIP and extract it locally.
- Initialize a git repository: `git init`.

### 2. GitHub Push
- Create a new repository on GitHub.
- Link and push your code:
  ```bash
  git add .
  git commit -m "Initial commit"
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

### 3. Hosting on Vercel
- Connect your GitHub repository to [Vercel](https://vercel.com).
- **Required Environment Variables (3 Total)**:
  1. `NEXT_PUBLIC_FIREBASE_API_KEY`: Found in Firebase Project Settings.
  2. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your unique Firebase Project ID.
  3. `GOOGLE_GENAI_API_KEY`: Your Gemini API Key from Google AI Studio.

## 🛠️ Key Tactical Features
- **Agentic AI Assistant**: Automatically handles smoke reporting with robust phonetic normalization (autocorrects misspelled input).
- **Geospatial Intelligence**: Identifies the nearest forest zone (e.g., Avalahalli) using live coordinates.
- **Tactical Dashboard**: Liquid Glass HUD with 100% LIVE NASA FIRMS hotspots and SITREPs.
- **Trilingual Interface**: Full support for English, Hindi (हिन्दी), and Kannada (ಕನ್ನಡ) across all HUD elements.

## 🌐 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI Engine**: Genkit + Gemini 2.5 Flash
- **Database/Auth**: Firebase Firestore & Authentication
- **Mapping**: Leaflet + NASA FIRMS Telemetry
- **Styling**: Tailwind CSS + ShadCN UI

---
*Software-Only | Scalable | Global Open Standards*
