
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await params as required by Next.js 15
  const parameters = await params;
  const zoneId = parameters.id;

  const { firestore: db } = initializeFirebase();
  
  try {
    const zoneSnap = await getDoc(doc(db, 'zones', zoneId));
    if (!zoneSnap.exists()) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }
    
    const zone: any = zoneSnap.data();
    const { lat, lng } = zone;

    // Fetch Weather (Open-Meteo)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    // Fetch Hotspots (Internal FIRMS proxy)
    const baseUrl = new URL(req.url).origin;
    const hotspotsRes = await fetch(`${baseUrl}/api/firms-hotspots`);
    const allHotspots: any[] = await hotspotsRes.json();
    
    // Calculate nearby hotspots (roughly 1 degree lat/lng radius)
    const nearbyHotspots = allHotspots.filter(h => {
      const dist = Math.sqrt(Math.pow(h.lat - lat, 2) + Math.pow(h.lng - lng, 2));
      return dist < 1.0; 
    });

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = months[new Date().getMonth()];

    return NextResponse.json({
      zone,
      weather: {
        temp: weatherData.current?.temperature_2m || 0,
        humidity: weatherData.current?.relative_humidity_2m || 0,
        wind: weatherData.current?.wind_speed_10m || 0,
        wind_direction: weatherData.current?.wind_direction_10m || 0
      },
      nearby_hotspots: nearbyHotspots.length,
      current_month: currentMonth,
      data_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Zone Data API Error:', error);
    return NextResponse.json({ error: 'Failed to process intelligence data' }, { status: 500 });
  }
}
