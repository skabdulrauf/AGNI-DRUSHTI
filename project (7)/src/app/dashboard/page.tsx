
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  Wind, Droplets, AlertTriangle, 
  Loader2, Shield, 
  Clock, X, Search, Sparkles, ChevronRight, MapPin, Globe
} from 'lucide-react';
import { rangerFireRiskAnalysis } from '@/ai/flows/ranger-fire-risk-analysis';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import Fuse from 'fuse.js';

const MapClient = dynamic(() => import('@/components/dashboard/map-client'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0f0a] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
});

const getTypeBadgeStyles = (type: string) => {
  switch (type) {
    case 'Tiger Reserve': return 'bg-[#FF4500]/20 text-[#FF4500] border-[#FF4500]/30';
    case 'National Park': return 'bg-[#228B22]/20 text-[#228B22] border-[#228B22]/30';
    case 'Biosphere Reserve': return 'bg-[#008080]/20 text-[#008080] border-[#008080]/30';
    case 'Wildlife Sanctuary': return 'bg-[#DAA520]/20 text-[#DAA520] border-[#DAA520]/30';
    default: return 'bg-white/5 text-white/40 border-white/10';
  }
};

export default function Dashboard() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  const zonesQuery = useMemoFirebase(() => collection(firestore, 'zones'), [firestore]);
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);

  const complaintsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc')), 
  [firestore]);
  const { data: complaints } = useCollection(complaintsQuery);

  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [zoneData, setZoneData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);

  useEffect(() => {
    fetch('/api/zones').catch(err => console.error("Grid Sync Error:", err));
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    
    fetch('/api/firms-hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data.slice(0, 100)))
      .catch(e => console.error("Hotspot HUD Error:", e));

    return () => clearInterval(timer);
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(zones || [], {
      keys: ['name', 'state', 'type'],
      threshold: 0.4,
      distance: 200,
      includeScore: true,
      minMatchCharLength: 2
    });
  }, [zones]);

  const searchGlobal = useCallback(async (q: string) => {
    if (!q || q.length < 3) return;
    setIsSearchingGlobal(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`);
      const data = await res.json();
      setExternalResults(data.map((item: any) => ({
        id: `ext-${item.place_id}`,
        name: item.display_name.split(',')[0],
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'Location',
        isExternal: true
      })));
    } catch (e) {
      console.warn("Global Search Interference.");
    } finally {
      setIsSearchingGlobal(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchGlobal(searchQuery);
      } else {
        setExternalResults([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, searchGlobal]);

  const combinedResults = useMemo(() => {
    const local = searchQuery.length >= 2 ? fuse.search(searchQuery).map(r => r.item) : [];
    return [...local, ...externalResults];
  }, [searchQuery, fuse, externalResults]);

  const fetchLiveIntel = async (lat: number, lng: number, name: string) => {
    setLoadingIntel(true);
    try {
      const res = await fetch(`/api/intel?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setZoneData({
        ...data,
        zone: { name, lat, lng }
      });
    } catch (e) {
      console.error("Intel fetch failed:", e);
      toast({ variant: "destructive", title: "Intel Link Down", description: "Failed to synchronize live environment data." });
    } finally {
      setLoadingIntel(false);
    }
  };

  const handleLocationSelect = async (loc: any) => {
    setSelectedZone(loc);
    setAnalysis(null);
    setZoneData(null);
    setSearchQuery("");
    setExternalResults([]);
    setShowLeftSidebar(false);
    
    // Fetch live intelligence for the selected location (forest or external)
    await fetchLiveIntel(loc.lat, loc.lng, loc.name);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (combinedResults.length > 0) {
      handleLocationSelect(combinedResults[0]);
    }
  };

  const generateAIAlert = async () => {
    if (!selectedZone || !zoneData) {
      toast({ title: "Grid Sync Required", description: "Waiting for live environment telemetry..." });
      return;
    }
    
    setLoadingAnalysis(true);
    try {
      const payload = {
        name: zoneData.zone.name,
        state: selectedZone.state || 'Local Area',
        temp: zoneData.weather.temp,
        humidity: zoneData.weather.humidity,
        wind: zoneData.weather.wind,
        direction: `${zoneData.weather.wind_direction}°`, 
        hotspots: zoneData.nearby_hotspots,
        month: zoneData.current_month
      };

      const result = await rangerFireRiskAnalysis(payload);
      setAnalysis(result);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Analysis interdiction failed." });
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
            onZoneSelect={handleLocationSelect}
            selectedZoneCenter={selectedZone ? [selectedZone.lat, selectedZone.lng] : null}
          />
        </div>

        {/* Tactical Search HUD - Fortified for Interactivity */}
        <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
          <div className="liquid-glass h-12 rounded-full px-4 md:px-6 flex items-center gap-3 md:gap-4 shadow-2xl max-w-xl w-full pointer-events-auto border-primary/20 bg-black/40 backdrop-blur-2xl">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> {t('grid.sync')}
              </span>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Forests, Shops, Restaurants..." 
                  className="bg-transparent border-none rounded-full pl-10 h-8 text-[11px] focus:ring-0 transition-all w-full placeholder:text-white/20 text-white font-medium focus:bg-white/5"
                />
                {isSearchingGlobal && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary animate-spin" />}
              </div>
              
              <Button 
                type="submit" 
                size="sm" 
                className="h-7 px-3 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-full text-[9px] font-bold uppercase tracking-widest border border-primary/30 transition-all shrink-0"
              >
                Execute
              </Button>
              
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 liquid-glass rounded-2xl overflow-hidden shadow-2xl z-[110] border border-white/10 pointer-events-auto animate-in slide-in-from-top-2">
                  <ScrollArea className="max-h-64">
                    {combinedResults.length > 0 ? combinedResults.map((z: any) => (
                      <div 
                        key={z.id} 
                        className="p-4 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex flex-col gap-0.5" 
                        onClick={() => handleLocationSelect(z)}
                      >
                        <div className="flex items-center gap-2">
                          {z.isExternal ? <Globe className="w-3 h-3 text-primary" /> : <MapPin className="w-3 h-3 text-accent" />}
                          <p className="text-white text-[11px] font-bold uppercase tracking-tight">{z.name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-medium line-clamp-1">{z.isExternal ? z.fullName : z.state}</p>
                          <Badge variant="outline" className={cn("text-[6px] py-0 px-2 font-bold uppercase border", getTypeBadgeStyles(z.type))}>
                            {z.type}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center text-white/20 font-bold uppercase text-[9px] tracking-widest">
                        {zonesLoading ? "Indexing Grid..." : "No matches found"}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </form>

            <span className="hidden sm:flex text-white/40 text-[9px] font-bold uppercase tracking-widest items-center gap-2 shrink-0 border-l border-white/10 pl-4">
              <Clock className="w-4 h-4 text-primary" /> {currentTime}
            </span>
          </div>
        </div>

        {/* Sidebars - Shortened to prevent control obstruction */}
        <aside className={cn(
          "absolute top-24 left-4 bottom-36 w-64 md:w-56 z-40 flex flex-col transition-all duration-500 ease-out pointer-events-none",
          showLeftSidebar ? "translate-x-0" : "-translate-x-[calc(100%+24px)] md:translate-x-0"
        )}>
          <div className="flex-1 liquid-glass rounded-[2rem] p-4 pointer-events-auto flex flex-col shadow-2xl border-white/5">
            <Tabs defaultValue="alerts" className="w-full flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 bg-white/5 p-1 rounded-2xl mb-4 h-10">
                <TabsTrigger value="alerts" className="rounded-xl text-[9px] uppercase font-bold tracking-[0.2em] data-[state=active]:bg-primary">SITREPs</TabsTrigger>
                <TabsTrigger value="zones" className="rounded-xl text-[9px] uppercase font-bold tracking-[0.2em] data-[state=active]:bg-primary">Nodes</TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-3">
                    {complaints.length > 0 ? complaints.map((c: any) => (
                      <div key={c.id} className={cn(
                        "bg-white/5 p-4 rounded-2xl border-l-4 transition-all hover:bg-white/10 cursor-pointer border-white/5",
                        c.status === 'resolved' ? 'opacity-40 border-l-green-500' : 'border-l-destructive shadow-lg'
                      )}>
                        <h3 className="text-[11px] font-bold text-white line-clamp-1 uppercase tracking-tighter">{c.description}</h3>
                      </div>
                    )) : (
                      <div className="text-center py-24 opacity-20">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Monitoring Grid</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="zones" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-2">
                    {zones.map((z: any) => (
                      <div 
                        key={z.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer",
                          selectedZone?.id === z.id ? 'border-primary/60 bg-primary/10' : 'border-white/5 bg-white/5 hover:bg-white/10'
                        )}
                        onClick={() => handleLocationSelect(z)}
                      >
                        <h3 className="text-[11px] font-bold text-white leading-tight uppercase tracking-tight">{z.name}</h3>
                        <Badge variant="outline" className={cn("text-[6px] py-0 px-2 mt-1 border", getTypeBadgeStyles(z.type))}>
                          {z.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        <aside className={cn(
          "absolute z-40 flex flex-col pointer-events-none transition-all duration-500 ease-in-out",
          selectedZone 
            ? "top-24 right-4 bottom-4 md:bottom-24 w-[calc(100vw-32px)] md:w-80" 
            : "bottom-6 right-6 w-48 h-16"
        )}>
          <div className="flex-1 liquid-glass rounded-[2.5rem] pointer-events-auto flex flex-col shadow-2xl overflow-hidden border-white/10">
            {selectedZone ? (
              <div className="flex flex-col h-full space-y-5 p-7">
                <header className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] px-4 py-1 font-bold tracking-[0.2em] rounded-full uppercase">Tactical Link</Badge>
                    <h2 className="text-xl md:text-2xl font-headline font-bold text-white tracking-tighter leading-none uppercase">{selectedZone.name}</h2>
                    <Badge variant="outline" className={cn("text-[7px] py-0 px-3 font-bold border", getTypeBadgeStyles(selectedZone.type))}>
                      {selectedZone.type}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white/20 hover:text-white" onClick={() => setSelectedZone(null)}><X className="w-5 h-5" /></Button>
                </header>

                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-5 pb-6">
                    {loadingIntel ? (
                      <div className="p-8 text-center space-y-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse">Synchronizing Intelligence...</p>
                      </div>
                    ) : zoneData ? (
                      <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-500">
                        <MetricCard icon={<Wind className="w-4 h-4"/>} label="Temp" value={`${zoneData.weather.temp}°C`} />
                        <MetricCard icon={<Droplets className="w-4 h-4"/>} label="Humid" value={`${zoneData.weather.humidity}%`} />
                        <MetricCard icon={<AlertTriangle className="w-4 h-4"/>} label="Hotspots" value={zoneData.nearby_hotspots} />
                        <MetricCard icon={<Clock className="w-4 h-4"/>} label="Status" value="LIVE" />
                      </div>
                    ) : (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-[9px] font-bold text-destructive uppercase tracking-widest text-center">
                        Telemetry Interference
                      </div>
                    )}

                    <Button 
                      className="w-full bg-primary h-14 rounded-2xl font-bold shadow-2xl gap-3 text-[11px] uppercase tracking-[0.2em]"
                      onClick={generateAIAlert}
                      disabled={loadingAnalysis || !zoneData}
                    >
                      {loadingAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      Live Risk Analysis
                    </Button>

                    {analysis && (
                      <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/20 space-y-4 animate-in zoom-in-95 duration-500 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">Tactical Verdict</span>
                          <Badge className={cn("text-white font-bold py-1 px-4 text-[8px] uppercase rounded-full tracking-widest", analysis.risk_score > 70 ? 'bg-destructive shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'bg-accent')}>
                            {analysis.risk_level}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-white/60 leading-relaxed italic font-medium">
                          {analysis.primary_factors}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5 h-full bg-black/20">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">{t('grid.sync')}</h3>
                  <p className="text-[8px] text-white/40 uppercase font-medium tracking-widest">Grid Standby</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="p-4 rounded-2xl border bg-white/5 border-white/10 text-center flex flex-col items-center justify-center">
      <div className="flex justify-center items-center gap-2 text-white/30 mb-1.5">
        {icon}
        <span className="text-[7px] font-bold uppercase tracking-[0.3em]">{label}</span>
      </div>
      <span className="text-base font-headline font-bold tracking-tight text-white">{value}</span>
    </div>
  );
}
