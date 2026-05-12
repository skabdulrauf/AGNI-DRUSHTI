import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Shared service to fetch live statistics for Agni-Drishti.
 * Optimized for real-time speed by using lighter weight fetching logic.
 */
export async function getAgniStats() {
  const defaultStats = {
    fires_detected_today: 0,
    alerts_sent: 0,
    ranger_responses: 0,
    citizens_protected: 0,
    last_updated: new Date().toISOString()
  };

  const isConfigReady = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.projectId !== "mock-project");
  
  if (!isConfigReady) {
    return defaultStats;
  }

  try {
    const { firestore: db } = initializeFirebase();
    
    // 1. Optimized FIRMS Fetch
    let firesToday = 0; 
    try {
      const res = await fetch('https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/J1_VIIRS_C2_Southern_Asia_24h.csv', { next: { revalidate: 3600 } });
      if (res.ok) {
        const text = await res.text();
        const rows = text.split('\n');
        // Subtract header and trailing row
        firesToday = Math.max(0, rows.length - 2);
      }
    } catch (e) {
      console.warn("Firms grid interdicted.");
    }

    // 2. Real-time Grid Baseline
    let complaintsSize = 0;
    let resolvedSize = 0;
    try {
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      complaintsSize = complaintsSnap.size;
      const resolvedSnap = await getDocs(query(collection(db, 'complaints'), where('status', '==', 'resolved')));
      resolvedSize = resolvedSnap.size;
    } catch (dbError) {
      console.warn("Firestore grid restricted.");
    }
    
    // 3. Impact Interdiction Logic
    const totalAlerts = firesToday + complaintsSize;
    const citizensProtected = (complaintsSize * 150) + (firesToday * 300) + (resolvedSize * 1000); 

    return {
      fires_detected_today: firesToday,
      alerts_sent: totalAlerts,
      ranger_responses: resolvedSize,
      citizens_protected: citizensProtected,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Stats Grid Error:", error);
    return defaultStats;
  }
}
