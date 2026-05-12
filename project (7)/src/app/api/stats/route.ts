
import { NextResponse } from 'next/server';
import { getAgniStats } from '@/lib/stats-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await getAgniStats();
  return NextResponse.json(stats);
}
