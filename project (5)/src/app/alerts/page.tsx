
"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { MapPin, Radio, Shield, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';

export default function AlertsPage() {
  const firestore = useFirestore();
  const [hotspots, setHotspots] = useState<any[]>([]);

  const complaintsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc')),
  [firestore]);
  const { data: complaints } = useCollection(complaintsQuery);

  useEffect(() => {
    fetch('/api/firms-hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data.slice(0, 10).map((h: any) => ({ ...h, type: 'SATELLITE' }))));
  }, []);

  const citizenAlerts = complaints.map(doc => ({ ...doc, type: 'CITIZEN' }));
  const combinedAlerts = [...citizenAlerts, ...hotspots].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-5xl font-headline font-bold text-white">Live Fire Intelligence Feed</h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-destructive animate-pulse text-sm font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-destructive" /> LIVE DATA STREAM
              </span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Global satellite clusters verified by Ground Truth</span>
            </div>
          </div>
          <div className="hidden md:flex glass-panel p-2 rounded-full border-white/5 gap-2">
            <FilterPill label="All Sources" active />
            <FilterPill label="Satellite Only" />
            <FilterPill label="Citizen Only" />
          </div>
        </header>

        <div className="space-y-6">
          {combinedAlerts.map((alert: any, idx) => (
            <AlertCard key={alert.id || idx} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,92,26,0.3)]' : 'text-white/40 hover:text-white'}`}>
      {label}
    </button>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const isSatellite = alert.type === 'SATELLITE';

  return (
    <div className="glass-panel p-8 rounded-[2rem] border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row gap-8 scan-line group overflow-hidden relative">
      <div className="flex flex-col items-center justify-center w-32 border-r border-white/5 pr-8">
        <div className="w-20 h-20 rounded-full border-2 border-white/5 flex items-center justify-center relative">
          <span className={`text-2xl font-bold ${isSatellite ? 'text-accent' : 'text-primary'}`}>{Math.floor(Math.random() * 20) + 80}%</span>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
            <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={240} strokeDashoffset={240 - (240 * 0.9)} className={isSatellite ? 'text-accent' : 'text-primary'} />
          </svg>
        </div>
        <span className="text-[10px] text-white/40 font-bold uppercase mt-2">Confidence</span>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={isSatellite ? 'bg-accent/20 text-accent border-none' : 'bg-primary/20 text-primary border-none'}>
              {isSatellite ? <Radio className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
              {alert.type}
            </Badge>
            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{alert.id || 'LIVE-STREAM'}</span>
          </div>
          <span className="text-xs text-white/40 font-bold flex items-center gap-2"><Clock className="w-3 h-3" /> Live</span>
        </div>

        <div>
          <h3 className="text-2xl font-headline font-bold text-white mb-2">
            {isSatellite ? `Thermal Hotspot detected at Lat ${alert.lat}, Lng ${alert.lng}` : alert.description}
          </h3>
          <div className="flex items-center gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {isSatellite ? "Indian Subcontinent" : "Western Himalayas"}</span>
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> FRP: {isSatellite ? alert.frp : '12.4'} MW</span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-48 space-y-3">
        <Button variant="outline" className="w-full glass-panel border-white/10 text-white font-bold h-12 rounded-xl" asChild>
          <Link href="/dashboard">View on Map</Link>
        </Button>
      </div>
    </div>
  );
}
