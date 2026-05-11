"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { collection, query, orderBy } from 'firebase/firestore';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';
import { 
  Wind, Droplets, Thermometer, AlertTriangle, 
  Loader2, Map as MapIcon, Shield, 
  Navigation, Clock, X, Search, Sparkles
} from 'lucide-react';
import { rangerFireRiskAnalysis } from '@/ai/flows/ranger-fire-risk-analysis';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Fuse from 'fuse.js';

const MapClient = dynamic(() => import('@/components/dashboard/map-client'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0f0a] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
});

export default function Dashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  const zonesQuery = useMemoFirebase(() => collection(firestore, 'zones'), [firestore]);
  const { data: zones } = useCollection(zonesQuery);

  const complaintsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc')), 
  [firestore]);
  const { data: complaints } = useCollection(complaintsQuery);

  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [zoneData, setZoneData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    
    fetch('/api/firms-hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data.slice(0, 100)));

    return () => clearInterval(timer);
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(zones, {
      keys: ['name', 'state', 'type'],
      threshold: 0.35,
    });
  }, [zones]);

  const filteredZones = useMemo(() => {
    if (!searchQuery) return zones;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, zones, fuse]);

  const handleZoneSelect = async (zone: any) => {
    setSelectedZone(zone);
    setAnalysis(null);
    setZoneData(null);
    setSearchQuery("");
    
    try {
      const res = await fetch(`/api/zones/${zone.id}/data`);
      const data = await res.json();
      setZoneData(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Agentic Navigation: Handle search query param from AI Assistant
  useEffect(() => {
    const q = searchParams.get('search');
    if (q && zones.length > 0) {
      const results = fuse.search(q);
      if (results.length > 0) {
        handleZoneSelect(results[0].item);
      }
    }
  }, [searchParams, zones, fuse]);

  const generateAIAlert = async () => {
    if (!zoneData) return;
    setLoadingAnalysis(true);
    try {
      const result = await rangerFireRiskAnalysis({
        name: zoneData.zone.name,
        state: zoneData.zone.state,
        temp: zoneData.weather.temp,
        humidity: zoneData.weather.humidity,
        wind: zoneData.weather.wind,
        direction: `${zoneData.weather.wind_direction}°`, 
        hotspots: zoneData.nearby_hotspots,
        month: zoneData.current_month
      });
      setAnalysis(result);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Tactical inference engine timed out." });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0f0a] font-body selection:bg-primary/30 overflow-hidden">
      <Navbar />

      <div className="flex-1 relative mt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapClient 
            zones={zones} 
            hotspots={hotspots} 
            complaints={complaints} 
            onZoneSelect={handleZoneSelect}
            selectedZoneCenter={selectedZone ? [selectedZone.lat, selectedZone.lng] : null}
          />
        </div>

        {/* Floating Top HUD - Ultra Transparent & High Priority */}
        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="liquid-glass h-10 rounded-full px-5 flex items-center gap-4 shadow-2xl max-w-2xl w-full pointer-events-auto">
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1.5 text-primary font-bold text-[8px] uppercase tracking-[0.2em]">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> GRID
              </span>
              <div className="h-2.5 w-px bg-white/10" />
              <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> {currentTime}
              </span>
            </div>

            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Forest Intelligence..." 
                className="bg-transparent border-none rounded-full pl-8 h-7 text-[10px] focus:ring-0 transition-all w-full placeholder:text-white/10 text-white font-medium"
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 liquid-glass rounded-2xl overflow-hidden shadow-2xl z-[60]">
                  <ScrollArea className="max-h-40">
                    {filteredZones.map((z: any) => (
                      <div key={z.id} className="p-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0" onClick={() => handleZoneSelect(z)}>
                        <p className="text-white text-[9px] font-bold">{z.name}</p>
                        <p className="text-[7px] text-white/30 uppercase tracking-widest">{z.state}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="border-white/5 text-white/40 bg-white/5 text-[7px] uppercase tracking-widest px-2 py-0 rounded-full font-bold">LIVE TELEMETRY</Badge>
            </div>
          </div>
        </div>

        {/* Left Sidebar - Ultra Transparent */}
        <aside className="absolute top-20 left-4 bottom-24 w-52 z-40 flex flex-col pointer-events-none">
          <div className="flex-1 liquid-glass rounded-[1.25rem] p-2 pointer-events-auto flex flex-col shadow-2xl">
            <Tabs defaultValue="alerts" className="w-full flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 bg-white/5 p-0.5 rounded-lg mb-2 h-7">
                <TabsTrigger value="alerts" className="rounded-md text-[7px] uppercase font-bold tracking-widest py-1">Alerts</TabsTrigger>
                <TabsTrigger value="zones" className="rounded-md text-[7px] uppercase font-bold tracking-widest py-1">Nodes</TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full pr-1">
                  <div className="space-y-1.5">
                    {complaints.length > 0 ? complaints.map((c: any) => (
                      <div key={c.id} className={cn(
                        "bg-white/5 p-2 rounded-xl border-l-2 transition-all hover:bg-white/10 cursor-pointer border-white/5",
                        c.status === 'resolved' ? 'opacity-30 border-l-green-500' : 'border-l-destructive'
                      )}>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-[5px] font-bold uppercase tracking-widest text-white/30">{c.source}</span>
                          <span className={cn("text-[5px] font-bold uppercase", c.status === 'resolved' ? 'text-green-400' : 'text-primary')}>{c.status}</span>
                        </div>
                        <h3 className="text-[8px] font-bold text-white line-clamp-1 uppercase tracking-tight">{c.description}</h3>
                      </div>
                    )) : (
                      <div className="text-center py-10 opacity-10">
                        <MapIcon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-[7px] font-bold uppercase tracking-widest">Scanning...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="zones" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full pr-1">
                  <div className="space-y-1">
                    {zones.map((z: any) => (
                      <div 
                        key={z.id} 
                        className={cn(
                          "p-2 rounded-xl border transition-all cursor-pointer",
                          selectedZone?.id === z.id ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-white/5 hover:bg-white/10'
                        )}
                        onClick={() => handleZoneSelect(z)}
                      >
                        <h3 className="text-[8px] font-bold text-white leading-tight">{z.name}</h3>
                        <p className="text-[6px] text-white/30 uppercase tracking-widest mt-0.5">{z.state}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* Right Sidebar - Ultra Transparent Intelligence */}
        <aside className={cn(
          "absolute z-40 flex flex-col pointer-events-none transition-all duration-500 ease-in-out",
          selectedZone ? "top-20 right-4 bottom-4 w-72" : "bottom-4 right-4 w-40 h-14"
        )}>
          <div className="flex-1 liquid-glass rounded-[1.25rem] pointer-events-auto flex flex-col shadow-2xl overflow-hidden">
            {selectedZone ? (
              <div className="flex flex-col h-full space-y-3 p-3">
                <header className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Badge className="bg-primary/10 text-primary border-none text-[6px] px-2 py-0 font-bold tracking-widest rounded-full uppercase">Tactical</Badge>
                    <h2 className="text-sm font-headline font-bold text-white tracking-tight leading-none">{selectedZone.name}</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white/20 hover:text-white h-6 w-6" onClick={() => setSelectedZone(null)}><X className="w-3 h-3" /></Button>
                </header>

                {zoneData ? (
                  <ScrollArea className="flex-1 -mx-1 px-1">
                    <div className="space-y-2.5 pb-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <MetricCard icon={<Thermometer className="w-2.5 h-2.5"/>} label="Surf" value={`${zoneData.weather.temp}°C`} />
                        <MetricCard icon={<Droplets className="w-2.5 h-2.5"/>} label="Humid" value={`${zoneData.weather.humidity}%`} />
                        <MetricCard icon={<Wind className="w-2.5 h-2.5"/>} label="Wind" value={`${zoneData.weather.wind}`} />
                        <MetricCard icon={<AlertTriangle className="w-2.5 h-2.5"/>} label="Spots" value={zoneData.nearby_hotspots} highlight={zoneData.nearby_hotspots > 0} />
                      </div>

                      <Button 
                        className="w-full bg-primary h-8 rounded-lg font-bold shadow-lg gap-1.5 text-[9px] uppercase tracking-widest"
                        onClick={generateAIAlert}
                        disabled={loadingAnalysis}
                      >
                        {loadingAnalysis ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Shield className="w-2.5 h-2.5" />}
                        Risk Engine
                      </Button>

                      {analysis && (
                        <div className="bg-white/5 p-3 rounded-xl border border-primary/5 space-y-2.5 animate-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-bold uppercase tracking-widest text-primary">Interdiction</span>
                            <Badge className={cn("text-white font-bold py-0 px-2 text-[6px] uppercase rounded-full", analysis.risk_score > 70 ? 'bg-destructive' : 'bg-accent')}>
                              {analysis.risk_level}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-white/50 leading-relaxed italic">
                            {analysis.primary_factors}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-white/5 p-1.5 rounded-lg border border-white/5 text-center">
                              <p className="text-[6px] text-white/20 uppercase">Spread</p>
                              <p className="text-[9px] font-bold text-white flex justify-center items-center gap-1"><Navigation className="w-2 h-2 text-primary" /> {analysis.spread_direction}</p>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-lg border border-white/5 text-center">
                              <p className="text-[6px] text-white/20 uppercase">Radius</p>
                              <p className="text-[9px] font-bold text-white">{analysis.spread_radius_km} km</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 space-y-2 opacity-20">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-[7px] text-white/50 uppercase tracking-[0.2em]">Syncing...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 h-full opacity-40">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[7px] font-bold text-white uppercase tracking-widest">Standby</h3>
                  <p className="text-[6px] text-white/40 uppercase">Select Zone</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, highlight }: { icon: any, label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={cn(
      "p-1.5 rounded-xl border transition-all text-center",
      highlight ? 'border-primary/10 bg-primary/5' : 'bg-white/5 border-white/5'
    )}>
      <div className="flex justify-center items-center gap-1 text-white/20 mb-0.5">
        {icon}
        <span className="text-[5px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className={cn("text-[10px] font-headline font-bold", highlight ? 'text-primary' : 'text-white')}>{value}</span>
    </div>
  );
}
