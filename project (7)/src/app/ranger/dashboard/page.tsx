"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { collection, query, orderBy, updateDoc, doc, onSnapshot, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, AlertCircle, MapPin, Clock, CheckCircle2, 
  Truck, Radio, User, Image as ImageIcon, ExternalLink,
  Loader2, Filter, Bell, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function RangerDashboard() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  const complaintsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc')),
  [firestore]);
  const { data: complaints, loading: dataLoading } = useCollection(complaintsQuery);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'complaints'), orderBy('created_at', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !dataLoading) {
          toast({ 
            title: "CRITICAL ALERT", 
            description: "New citizen report received. Check SITREP feed.",
            variant: "destructive"
          });
        }
      });
    });
    return () => unsubscribe();
  }, [firestore, dataLoading, toast]);

  const updateStatus = async (reportId: string, status: string) => {
    if (!user) {
      toast({ 
        variant: "destructive", 
        title: "Action Denied", 
        description: "Official credentials required for grid interdiction." 
      });
      return;
    }

    try {
      await updateDoc(doc(firestore, 'complaints', reportId), { status });
      toast({ title: "Command Updated", description: `Incident set to: ${status.toUpperCase()}` });
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Tactical grid update failed." });
    }
  };

  const filteredComplaints = complaints.filter(c => filter === 'all' || c.status === filter);

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0f0a] flex flex-col font-body overflow-hidden selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 mt-20 flex p-6 gap-6 overflow-hidden">
        <aside className="w-96 flex flex-col gap-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">Live SITREPs</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-[9px] font-bold text-destructive uppercase tracking-[0.2em]">Active Interdiction</span>
              </div>
            </div>
            {!user && (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[8px] font-bold uppercase tracking-widest px-3">
                Read-Only
              </Badge>
            )}
          </header>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <StatusFilter active={filter === 'all'} label="All" onClick={() => setFilter('all')} />
            <StatusFilter active={filter === 'pending'} label="Pending" onClick={() => setFilter('pending')} color="text-destructive" />
            <StatusFilter active={filter === 'dispatched'} label="Action" onClick={() => setFilter('dispatched')} color="text-accent" />
            <StatusFilter active={filter === 'resolved'} label="Closed" onClick={() => setFilter('resolved')} color="text-green-500" />
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-3 pb-6">
              {filteredComplaints.length > 0 ? filteredComplaints.map((c: any) => (
                <ReportItem 
                  key={c.id} 
                  report={c} 
                  active={selectedReport?.id === c.id} 
                  onClick={() => setSelectedReport(c)} 
                />
              )) : (
                <div className="text-center py-20 opacity-20">
                  <Shield className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Grid Secured. No pending alerts.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex-1 liquid-glass rounded-[3rem] border-white/5 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
          
          {selectedReport ? (
            <div className="flex-1 flex flex-col p-10 relative z-10">
              <header className="flex items-start justify-between mb-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "font-bold text-[9px] uppercase tracking-widest border-none px-4 py-1",
                      selectedReport.status === 'pending' ? 'bg-destructive/20 text-destructive' :
                      selectedReport.status === 'dispatched' ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-500'
                    )}>
                      {selectedReport.status}
                    </Badge>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">ID: {selectedReport.id.slice(0, 8)}</span>
                  </div>
                  <h1 className="text-4xl font-headline font-bold text-white tracking-tighter leading-tight max-w-2xl uppercase">
                    {selectedReport.description}
                  </h1>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="liquid-glass border-white/5 text-white/60 font-bold rounded-2xl h-12 px-6 gap-2 hover:bg-white/10"
                    onClick={() => updateStatus(selectedReport.id, 'dispatched')}
                  >
                    <Truck className="w-4 h-4 text-accent" /> Dispatch
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-green-500/20 border-green-500/30 text-green-500 font-bold rounded-2xl h-12 px-6 gap-2 hover:bg-green-500 hover:text-white transition-all"
                    onClick={() => updateStatus(selectedReport.id, 'resolved')}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </Button>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-8 flex-1">
                <div className="col-span-1 space-y-6">
                  <div className="aspect-[4/5] rounded-[2rem] overflow-hidden liquid-glass border-white/5 relative group">
                    {selectedReport.photo_url ? (
                      <Image src={selectedReport.photo_url} alt="Evidence" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-4">
                        <ImageIcon className="w-12 h-12" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No visual evidence</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest">Ground Truth</span>
                      <Button size="icon" variant="ghost" className="text-white/40 hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <IntelligenceCard 
                      icon={<Shield className="w-5 h-5 text-primary" />} 
                      label="AI Verdict" 
                      value={selectedReport.ai_classification?.verdict || "UNVERIFIED"} 
                      desc="Gemini-based threat assessment"
                    />
                    <IntelligenceCard 
                      icon={<Radio className="w-5 h-5 text-accent" />} 
                      label="Smoke Type" 
                      value={selectedReport.ai_classification?.smoke_type || "NONE"} 
                      desc="Thermal density analysis"
                    />
                    <IntelligenceCard 
                      icon={<MapPin className="w-5 h-5 text-blue-400" />} 
                      label="Location Range" 
                      value={selectedReport.zone_name || "Unknown Range"} 
                      desc={`Coords: ${selectedReport.lat.toFixed(3)}, ${selectedReport.lng.toFixed(3)}`}
                    />
                    <IntelligenceCard 
                      icon={<Clock className="w-5 h-5 text-white/40" />} 
                      label="Detected" 
                      value={format(selectedReport.created_at?.toDate() || new Date(), 'HH:mm')} 
                      desc={format(selectedReport.created_at?.toDate() || new Date(), 'MMM dd, yyyy')}
                    />
                  </div>

                  {!user && (
                    <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                      <Lock className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">Public Intelligence Mode</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">Login as a Ranger to initiate grid interdiction and dispatch ground teams.</p>
                      </div>
                    </div>
                  )}

                  <div className="liquid-glass p-8 rounded-[2.5rem] border-white/5 space-y-6 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Confidence Engine</h3>
                      <span className="text-primary font-bold text-xl">{selectedReport.ai_classification?.confidence || 0}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${selectedReport.ai_classification?.confidence || 0}%` }}
                      />
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed italic">
                      Interpreted from {selectedReport.source} input. This confidence score reflects consistency between report and AI vision logic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6 opacity-40">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Tactical Standby</h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto">Select a report from the live feed to initiate intelligence interdiction.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ReportItem({ report, active, onClick }: { report: any; active?: boolean; onClick: () => void }) {
  const isPending = report.status === 'pending';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 rounded-3xl border transition-all cursor-pointer scan-line group relative overflow-hidden",
        active ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,92,26,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10',
        isPending && !active && "border-l-4 border-l-destructive"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {isPending && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />}
          <span className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em]">
            {format(report.created_at?.toDate() || new Date(), 'HH:mm')}
          </span>
        </div>
        <Badge className={cn(
          "text-[6px] font-bold uppercase py-0 px-2 rounded-full",
          report.status === 'pending' ? 'bg-destructive/20 text-destructive' :
          report.status === 'dispatched' ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-500'
        )}>
          {report.status}
        </Badge>
      </div>
      <h3 className="text-[11px] font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors uppercase">
        {report.description}
      </h3>
      <div className="flex items-center gap-4 text-[7px] text-white/40 font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1 text-primary truncate">
          <MapPin className="w-2.5 h-2.5" /> {report.zone_name || "Unknown Range"}
        </span>
        <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> Citizen</span>
      </div>
    </div>
  );
}

function StatusFilter({ label, active, onClick, color }: { label: string; active?: boolean; onClick: () => void; color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all shrink-0 border",
        active ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(255,92,26,0.3)]' : 'liquid-glass border-white/5 text-white/40 hover:text-white',
        color && !active && color
      )}
    >
      {label}
    </button>
  );
}

function IntelligenceCard({ icon, label, value, desc }: { icon: any; label: string; value: string; desc: string }) {
  return (
    <div className="liquid-glass p-6 rounded-3xl border-white/5 space-y-3 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[8px] text-white/40 font-bold uppercase tracking-[0.2em]">{label}</p>
          <p className="text-base font-headline font-bold text-white tracking-tight truncate uppercase">{value}</p>
        </div>
      </div>
      <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{desc}</p>
    </div>
  );
}