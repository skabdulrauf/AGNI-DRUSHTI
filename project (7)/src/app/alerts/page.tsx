
"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { MapPin, Radio, Shield, TrendingUp, Clock, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import Image from 'next/image';
import { useLanguage } from '@/components/language-provider';

export default function AlertsPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [hotspots, setHotspots] = useState<any[]>([]);

  const complaintsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc'), limit(50)),
  [firestore]);
  const { data: complaints, loading } = useCollection(complaintsQuery);

  useEffect(() => {
    fetch('/api/firms-hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data.slice(0, 30).map((h: any) => ({ ...h, type: 'SATELLITE' }))))
      .catch(e => console.error("Hotspot Sync Error:", e));
  }, []);

  const citizenAlerts = complaints.map(doc => ({ ...doc, type: 'CITIZEN' }));
  
  const combinedAlerts = [...citizenAlerts, ...hotspots].sort((a, b) => {
    const timeA = a.created_at?.seconds || (Date.now() / 1000);
    const timeB = b.created_at?.seconds || (Date.now() / 1000);
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-5xl font-headline font-bold text-white uppercase tracking-tighter">Live Intelligence Feed</h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-primary animate-pulse text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary" /> {t('grid.sync')}
              </span>
              <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">NASA FIRMS & SITREP SYNCHRONIZATION</span>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {combinedAlerts.length > 0 ? combinedAlerts.map((alert: any, idx) => (
            <AlertCard key={alert.id || `hotspot-${idx}`} alert={alert} />
          )) : (
            <div className="py-24 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <Radio className="w-full h-full text-primary animate-pulse" />
                <Sparkles className="absolute top-0 right-0 w-6 h-6 text-primary animate-bounce" />
              </div>
              <p className="font-bold uppercase tracking-[0.5em] text-white/30 text-xs">{t('grid.scanning')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const isSatellite = alert.type === 'SATELLITE';
  
  const confidence = isSatellite 
    ? Math.min(99, Math.round(80 + (alert.frp || 0) / 10))
    : alert.ai_classification?.confidence || 85;

  return (
    <div className="glass-panel p-8 rounded-[2rem] border-white/5 hover:border-primary/20 transition-all flex flex-col md:flex-row gap-8 scan-line group overflow-hidden relative">
      <div className="flex flex-col items-center justify-center w-32 border-r border-white/5 pr-8 shrink-0">
        <div className="w-20 h-20 rounded-full border-2 border-white/5 flex items-center justify-center relative">
          <span className={`text-2xl font-bold ${isSatellite ? 'text-accent' : 'text-primary'}`}>
            {confidence}%
          </span>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
            <circle 
              cx="40" 
              cy="40" 
              r="38" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray={240} 
              strokeDashoffset={240 - (240 * (confidence / 100))} 
              className={isSatellite ? 'text-accent' : 'text-primary'} 
            />
          </svg>
        </div>
        <span className="text-[10px] text-white/40 font-bold uppercase mt-2 tracking-widest text-center">Confidence</span>
      </div>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={isSatellite ? 'bg-accent/20 text-accent border-none font-bold uppercase tracking-widest px-3' : 'bg-primary/20 text-primary border-none font-bold uppercase tracking-widest px-3'}>
              {isSatellite ? <Radio className="w-3 h-3 mr-2" /> : <Shield className="w-3 h-3 mr-2" />}
              {alert.type}
            </Badge>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Source: {isSatellite ? "NASA VIIRS-C2" : "CITIZEN SITREP"}</span>
          </div>
          <span className="text-[10px] text-white/40 font-bold flex items-center gap-2 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-primary animate-pulse" /> Live Link
          </span>
        </div>

        <div className="flex gap-8">
          {!isSatellite && alert.photo_url && (
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0 border border-white/10 relative shadow-2xl group-hover:scale-105 transition-transform">
              <Image src={alert.photo_url} alt="Evidence" fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <h3 className="text-3xl font-headline font-bold text-white leading-tight tracking-tighter uppercase">
              {isSatellite ? `Hotspot Node [${alert.lat.toFixed(2)}, ${alert.lng.toFixed(2)}]` : alert.description}
            </h3>
            <div className="flex flex-wrap items-center gap-8 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 text-primary">
                <MapPin className="w-4 h-4" /> 
                {isSatellite ? "Indian Grid Node" : (alert.zone_name || "Primary Forest Range")}
              </span>
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> 
                {isSatellite ? `FRP: ${alert.frp} MW` : `Urgency: ${alert.urgency}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-48 flex items-center">
        <Button variant="outline" className="w-full bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white font-bold h-14 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all" asChild>
          <Link href="/dashboard">Tactical HUD</Link>
        </Button>
      </div>
    </div>
  );
}
