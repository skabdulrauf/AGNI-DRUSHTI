import { NextResponse } from 'next/server';

let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 mins

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch('https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/J1_VIIRS_C2_Southern_Asia_24h.csv');
    if (!res.ok) throw new Error('Failed to fetch FIRMS data');
    
    const csvText = await res.text();
    const rows = csvText.split('\n').slice(1);
    
    const hotspots = rows.map(row => {
      const cols = row.split(',');
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
    }).filter(h => h.lat >= 8 && h.lat <= 37 && h.lng >= 68 && h.lng <= 97); // India Bbox

    cache = { data: hotspots, timestamp: now };
    return NextResponse.json(hotspots);
  } catch (error) {
    console.error('FIRMS Proxy Error:', error);
    return NextResponse.json(cache ? cache.data : [], { status: cache ? 200 : 500 });
  }
}