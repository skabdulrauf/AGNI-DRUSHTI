
"use client";

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, Camera, MapPin, Send, CheckCircle2, Loader2, Map as MapIcon, Shield, HelpCircle, X, Image as ImageIcon, Navigation } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { classifyCitizenReport } from '@/ai/flows/citizen-report-classification-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ReportPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const recentReportsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc'), limit(5)),
  [firestore]);
  const { data: recentReports } = useCollection(recentReportsQuery);

  const fetchLocation = () => {
    setLocating(true);
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          setLocating(false);
          resolve(coords);
        },
        (err) => {
          setLocating(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  useEffect(() => {
    fetchLocation().catch(() => {
      // Fallback if initial fetch fails
      setLocation({ lat: 30.0668, lng: 79.0193 });
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast({ title: "Photo Captured", description: "Image attached to report." });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev + " " + transcript);
    };
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setIsSubmitting(true);
    try {
      // Ensure we have the latest location
      const currentLoc = await fetchLocation().catch(() => location || { lat: 30.0668, lng: 79.0193 });

      const aiResult = await classifyCitizenReport({ 
        description, 
        photo_base64: photo || undefined 
      });

      const reportData = {
        description,
        urgency,
        lat: currentLoc.lat,
        lng: currentLoc.lng,
        status: 'pending',
        source: 'citizen',
        photo_url: photo,
        ai_classification: aiResult,
        created_at: serverTimestamp()
      };

      await addDoc(collection(firestore, 'complaints'), reportData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'complaints',
            operation: 'create',
            requestResourceData: reportData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      setSubmitted(true);
      toast({ title: "Grid Updated", description: "Report successfully routed to Forest Rangers." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Transmission Error", description: "Failed to sync with intelligence grid." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] pt-32 px-6">
        <Navbar />
        <div className="max-w-2xl mx-auto liquid-glass p-12 text-center space-y-8 rounded-[3rem]">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-primary animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-bold text-white tracking-tighter">जंगल रक्षित!</h1>
            <p className="text-white/60 text-lg leading-relaxed">Your GPS-tagged information has been verified by AGNI-DRISHTI AI and routed to the nearest Forest Range Officer.</p>
          </div>
          <div className="p-8 glass-panel border-white/5 text-left space-y-4 rounded-3xl">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em]">Immediate Response Info</p>
            <div className="space-y-2">
              <p className="text-white font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Region: Active Monitoring</p>
              <p className="text-white font-medium flex items-center gap-2"><HelpCircle className="w-4 h-4 text-primary" /> Helpline: 112 / 101</p>
            </div>
          </div>
          <Button onClick={() => setSubmitted(false)} className="bg-primary px-12 h-14 rounded-2xl font-bold">New Report</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-6 pb-20 bg-[#0a0f0a]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
        <section className="space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary/20 text-primary border-none text-[10px] tracking-widest px-4 py-1">CITIZEN FRONT-LINE</Badge>
            <h1 className="text-7xl font-headline font-bold text-white tracking-tighter leading-none">Report Smoke or Fire</h1>
            <p className="text-white/50 text-xl font-light">Your intelligence reaches the nearest Forest Range Officer in real-time. Multi-language AI enabled.</p>
          </div>

          <div className="liquid-glass p-10 rounded-[3rem] border-white/5 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
            
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={toggleVoice}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 shadow-[0_0_40px_rgba(255,92,26,0.3)] hover:scale-105",
                  isListening ? 'bg-destructive animate-pulse' : 'bg-primary'
                )}
              >
                <Mic className="w-12 h-12 text-white" />
              </button>
              <div className="text-center space-y-2">
                <span className={cn("text-xs font-bold uppercase tracking-[0.3em]", isListening ? 'text-destructive' : 'text-primary')}>
                  {isListening ? "🔴 Listening..." : "Tap to Speak"}
                </span>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Supported: EN | HI | KN | TA | TE</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <Label className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Incident Description</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Smoke visible near the valley north of Chamoli village..." 
                  className="glass-panel border-white/10 text-white min-h-[140px] rounded-3xl p-6 focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Urgency Level</Label>
                <RadioGroup value={urgency} onValueChange={setUrgency} className="grid grid-cols-3 gap-3">
                  <UrgencyItem value="low" color="yellow" label="Smoke" />
                  <UrgencyItem value="medium" color="orange" label="Likely Fire" />
                  <UrgencyItem value="high" color="red" label="Active Fire" />
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => fetchLocation()}
                  className={cn(
                    "glass-panel p-5 rounded-3xl border-white/5 flex items-center gap-4 group hover:border-primary/20 transition-all cursor-pointer",
                    location ? "border-primary/40 bg-primary/5" : ""
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Positioning</span>
                    <span className="text-xs text-white font-bold">{location ? "LOCKED" : locating ? "SYNCING..." : "FETCH GPS"}</span>
                  </div>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "glass-panel p-5 rounded-3xl border-white/5 flex items-center gap-4 group hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden",
                    photo && "border-primary/40 bg-primary/5"
                  )}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  {photo ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative">
                        <Image src={photo} alt="Preview" fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-primary font-bold uppercase block">Photo Ready</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                          className="text-[8px] text-white/40 hover:text-destructive flex items-center gap-1 mt-0.5"
                        >
                          <X className="w-2 h-2" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 font-bold uppercase block">Photo Proof</span>
                        <span className="text-xs text-white font-bold uppercase">Attach</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !description} 
                className="w-full bg-primary h-14 rounded-3xl font-bold text-lg hover:shadow-[0_0_50px_rgba(255,92,26,0.4)] transition-all gap-3 group"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                Report Incident
              </Button>
            </form>
          </div>
        </section>

        <section className="space-y-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Mission Execution</h2>
            <div className="grid gap-4">
              <StepCard num="01" title="Telemetry Lock" desc="Your report is instantly GPS-tagged and encrypted." />
              <StepCard num="02" title="AI Validation" desc="Gemini classifies smoke type and urgency using vision-logic." />
              <StepCard num="03" title="Tactical Routing" desc="Matched to the exact Range Officer covering your coordinates." />
              <StepCard num="04" title="Verified Response" desc="Rangers are dispatched via Agni Command dashboard." />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Verified Local Intel</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase">Live Feed</span>
              </div>
            </div>
            <div className="space-y-4">
              {recentReports.length > 0 ? recentReports.map((report: any) => (
                <div key={report.id} className="liquid-glass p-6 rounded-3xl border-white/5 animate-in slide-in-from-top duration-700 scan-line group">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-white/10 text-white/60 border-none text-[8px]">SOURCE: CITIZEN</Badge>
                    <div className="flex items-center gap-2">
                      {report.photo_url && <ImageIcon className="w-3 h-3 text-primary" />}
                      <span className="text-[9px] text-white/20 font-bold uppercase">Recent</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed italic group-hover:text-white transition-colors">"{report.description}"</p>
                </div>
              )) : (
                <div className="text-center py-20 opacity-20">
                  <MapIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Awaiting Grid Intel</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function UrgencyItem({ value, color, label }: { value: string; color: string; label: string }) {
  const colors: any = {
    yellow: 'border-accent text-accent peer-data-[state=checked]:bg-accent/10',
    orange: 'border-primary text-primary peer-data-[state=checked]:bg-primary/10',
    red: 'border-destructive text-destructive peer-data-[state=checked]:bg-destructive/10'
  };
  return (
    <div className="relative">
      <RadioGroupItem value={value} id={value} className="sr-only peer" />
      <Label 
        htmlFor={value}
        className={cn(
          "flex flex-col items-center justify-center h-20 rounded-2xl border-2 cursor-pointer transition-all hover:bg-white/5 font-bold uppercase text-[8px] tracking-tighter text-center px-2 leading-tight",
          colors[color]
        )}
      >
        {label}
      </Label>
    </div>
  );
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 flex gap-6 group hover:border-primary/20 transition-all">
      <div className="text-2xl font-headline font-bold text-primary/20 group-hover:text-primary transition-colors">{num}</div>
      <div className="space-y-1">
        <h4 className="text-white font-bold text-base">{title}</h4>
        <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
