/**
 * Firebase configuration object.
 * Environment variables are used for production deployment.
 * Ensure these are set in your hosting provider (Vercel/Firebase) dashboard.
 */
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agni-drishti";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const firebaseConfig = {
  // Use a formatted placeholder if the key is missing to prevent SDK initialization crashes
  apiKey: apiKey || "AIzaSyAs-tactical-grid-placeholder",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  messagingSenderId: "123456789",
  appId: `1:123456789:web:${projectId}`
};
