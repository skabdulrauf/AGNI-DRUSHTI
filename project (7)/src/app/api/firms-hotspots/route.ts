import { NextResponse } from 'next/server';

/**
 * Optimized FIRMS Proxy with persistent caching and lightweight parsing.
 * Reduced latency for HUD and Stats Engine.
 */
let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 mins for high tactical refresh

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetching the Suomi NPP VIIRS C2 active fire data for Southern Asia (Real-time 24h)
    const res = await fetch('https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/J1_VIIRS_C2_Southern_Asia_24h.csv', {
      next: { revalidate: 900 }
    });
    
    if (!res.ok) throw new Error('NASA FIRMS Link Down');
    
    const csvText = await res.text();
    const rows = csvText.split('\n').slice(1);
    
    const hotspots = rows.map(row => {
      const cols = row.split(',');
      if (cols.length < 13) return null;
      return {
        lat: parseFloat(cols[0]),
        lng: parseFloat(cols[1]),
        brightness: parseFloat(cols[2]),
        acq_date: cols[5],
        acq_time: cols[6],
        confidence: cols[8],
        bright_ti5: parseFloat(cols[10]),
        frp: parseFloat(cols[12]),
      };
    }).filter((h): h is any => h !== null && h.lat >= 8 && h.lat <= 37 && h.lng >= 68 && h.lng <= 97); // Focus on Indian Grid

    cache = { data: hotspots, timestamp: now };
    return NextResponse.json(hotspots);
  } catch (error) {
    console.error('FIRMS Link Failure:', error);
    // Return stale cache if available, otherwise empty set
    return NextResponse.json(cache ? cache.data : [], { status: cache ? 200 : 500 });
  }
}
