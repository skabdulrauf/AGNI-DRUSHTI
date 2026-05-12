# AGNI-DRISHTI ("जंगल की आँख")

AI-powered forest fire early warning system for India. Integrates NASA FIRMS satellite telemetry with trilingual AI citizen reporting and a tactical agentic chat assistant.

## 🚀 Deployment Instructions (Vercel)

### 1. CRITICAL: Deployment Fix
If you have an `index.html` file in your root directory, **DELETE IT**. This file is a static placeholder that prevents Vercel from serving the Next.js application. Removing it allows Vercel to serve the built app.

### 2. Vercel Configuration
1. Connect your repository to Vercel.
2. Vercel will automatically detect **Next.js**.
3. Ensure the **Root Directory** is set to `./`.

### 3. Environment Variables (Required for LIVE Data)
Add these variables in the Vercel dashboard:
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Found in Firebase Project Settings.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your unique Firebase Project ID.
- `GOOGLE_GENAI_API_KEY`: Your Gemini API Key from Google AI Studio.

## 🛠️ Key Tactical Features
- **Agentic AI Assistant**: Automatically handles smoke reporting with robust phonetic normalization.
- **Geospatial Intelligence**: Locates anything from shops/restaurants to national tiger reserves.
- **Tactical Dashboard**: Liquid Glass HUD with 100% LIVE NASA FIRMS hotspots and SITREPs.
- **Trilingual Interface**: Full support for English, Hindi (हिन्दी), Kannada (ಕನ್ನಡ).

---
*Software-Only | Scalable | Global Open Standards*
