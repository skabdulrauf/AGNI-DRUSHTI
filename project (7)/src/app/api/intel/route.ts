import { NextResponse } from 'next/server';

/**
 * Universal Intelligence API to fetch live environment data for any coordinate.
 * Integrates Open-Meteo (Weather) and internal FIRMS proxy (Thermal anomalies).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    // 1. Fetch Real-time Weather (Open-Meteo)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    // 2. Fetch Nearby Hotspots (Internal FIRMS proxy)
    const baseUrl = new URL(req.url).origin;
    const hotspotsRes = await fetch(`${baseUrl}/api/firms-hotspots`);
    const allHotspots: any[] = await hotspotsRes.json();
    
    // Calculate nearby hotspots (approx. 50km radius)
    const nearbyHotspots = allHotspots.filter(h => {
      const dist = Math.sqrt(Math.pow(h.lat - lat, 2) + Math.pow(h.lng - lng, 2));
      return dist < 0.5; // Roughly 50km in lat/lng units
    });

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = months[new Date().getMonth()];

    return NextResponse.json({
      weather: {
        temp: weatherData.current?.temperature_2m || 25,
        humidity: weatherData.current?.relative_humidity_2m || 50,
        wind: weatherData.current?.wind_speed_10m || 10,
        wind_direction: weatherData.current?.wind_direction_10m || 0
      },
      nearby_hotspots: nearbyHotspots.length,
      current_month: currentMonth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Intel API Failure:', error);
    return NextResponse.json({ error: 'Failed to synchronize live intel' }, { status: 500 });
  }
}
