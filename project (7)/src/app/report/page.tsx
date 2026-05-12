
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, Camera, Send, CheckCircle2, Loader2, Map as MapIcon, X, Navigation, MapPin } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { classifyCitizenReport } from '@/ai/flows/citizen-report-classification-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

export default function ReportPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const zonesQuery = useMemoFirebase(() => collection(firestore, 'zones'), [firestore]);
  const { data: zones } = useCollection(zonesQuery);

  const recentReportsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'complaints'), orderBy('created_at', 'desc'), limit(15)),
  [firestore]);
  const { data: recentReports } = useCollection(recentReportsQuery);

  // Stabilized Location Resolver
  const fetchLocation = useCallback(() => {
    if (locating) return;
    setLocating(true);
    
    if (!navigator.geolocation) {
      setLocating(false);
      toast({ variant: "destructive", title: "GPS Error", description: "Sensor unavailable." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn("GPS Fail:", err.message);
        setLocation({ lat: 12.8000, lng: 77.5700 }); // Default baseline
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [locating, toast]);

  useEffect(() => {
    fetchLocation();
  }, []);

  const nearestZoneName = useMemo(() => {
    if (!location || !zones.length) return "Primary Forest Grid";
    let nearest = { name: "Primary Forest Grid", dist: Infinity };
    zones.forEach((z: any) => {
      const d = Math.sqrt(Math.pow(z.lat - location.lat, 2) + Math.pow(z.lng - location.lng, 2));
      if (d < nearest.dist) {
        nearest = { name: z.name, dist: d };
      }
    });
    return nearest.name;
  }, [location, zones]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast({ title: "Evidence Locked", description: "Visual data attached." });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setDescription(prev => prev + (prev ? " " : "") + event.results[0][0].transcript);
    };
    recognition.start();
  };

  const resetForm = () => {
    setDescription("");
    setPhoto(null);
    setUrgency("medium");
    setSubmitted(false);
    fetchLocation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const aiResult = await classifyCitizenReport({ 
        description, 
        photo_base64: photo || undefined 
      });

      await addDoc(collection(firestore, 'complaints'), {
        description,
        urgency,
        lat: location.lat,
        lng: location.lng,
        zone_name: nearestZoneName,
        status: 'pending',
        source: 'citizen',
        photo_url: photo,
        ai_classification: aiResult,
        created_at: serverTimestamp()
      });

      setSubmitted(true);
      toast({ title: "SITREP Logged", description: "Intelligence routed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure", description: "Grid interference." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center p-6">
        <Navbar />
        <div className="max-w-2xl w-full liquid-glass p-12 text-center space-y-8 rounded-[3rem] animate-in zoom-in-95">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-primary shadow-2xl">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold text-white tracking-tighter uppercase">{t('report.success_title')}</h1>
            <p className="text-white/60 text-lg">{t('report.success_desc')}</p>
          </div>
          <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 px-10 h-14 rounded-2xl font-bold uppercase tracking-widest">New Transmission</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-6 pb-20 bg-[#0a0f0a]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
        <section className="space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary/20 text-primary border-none text-[10px] tracking-widest px-4 py-1 font-bold uppercase">Ground Intel</Badge>
            <h1 className="text-6xl font-headline font-bold text-white tracking-tighter leading-none uppercase">{t('report.heading')}</h1>
            <p className="text-white/50 text-xl font-light">{t('report.subheading')}</p>
          </div>

          <div className="liquid-glass p-8 rounded-[3rem] border-white/5 space-y-10 relative overflow-hidden">
            <div className="flex flex-col items-center gap-4">
              <button 
                type="button"
                onClick={toggleVoice}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl",
                  isListening ? 'bg-destructive animate-pulse' : 'bg-primary'
                )}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white/40 font-bold uppercase tracking-widest text-[9px]">{t('report.description_label')}</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="..." 
                  className="glass-panel border-white/10 text-white min-h-[100px] rounded-2xl p-4 text-sm"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white/40 font-bold uppercase tracking-widest text-[9px]">{t('report.urgency_label')}</Label>
                <RadioGroup value={urgency} onValueChange={setUrgency} className="grid grid-cols-3 gap-2">
                  <UrgencyItem value="low" color="yellow" label={t('report.urgency_low')} />
                  <UrgencyItem value="medium" color="orange" label={t('report.urgency_medium')} />
                  <UrgencyItem value="high" color="red" label={t('report.urgency_high')} />
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => fetchLocation()} className={cn("glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-3 cursor-pointer", location && "border-primary/40 bg-primary/5")}>
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className={cn("w-4 h-4", location ? "text-primary" : "text-white/20")} />}
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] text-white/40 font-bold uppercase block">{t('report.gps_label')}</span>
                    <span className="text-[10px] font-bold truncate block text-white uppercase">{location ? t('report.gps_locked') : "FETCHING..."}</span>
                  </div>
                </div>
                
                <div onClick={() => fileInputRef.current?.click()} className={cn("glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-3 cursor-pointer", photo && "border-primary/40 bg-primary/5")}>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {photo ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden relative">
                      <Image src={photo} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : <Camera className="w-4 h-4 text-white/20" />}
                  <div className="flex-1">
                    <span className="text-[8px] text-white/40 font-bold uppercase block">{t('report.photo_label')}</span>
                    <span className="text-[10px] font-bold text-white uppercase">{photo ? "ATTACHED" : "UPLOAD"}</span>
                  </div>
                </div>
              </div>

              {location && (
                <div className="flex items-center gap-2 text-primary font-bold p-3 bg-primary/5 rounded-2xl border border-primary/20">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[9px] uppercase tracking-widest truncate">{nearestZoneName}</span>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting || !description || !location} className="w-full bg-primary h-14 rounded-2xl font-bold gap-3 uppercase tracking-widest">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {t('report.submit')}
              </Button>
            </form>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">Intelligence Feed</h2>
          </div>

          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.map((report: any) => (
              <div key={report.id} className="liquid-glass p-5 rounded-[2rem] border-white/5 flex gap-4">
                {report.photo_url && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                    <Image src={report.photo_url} alt="Evidence" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{report.zone_name}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-snug">{report.description}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20">
                <MapIcon className="w-10 h-10 mx-auto mb-4 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Grid...</p>
              </div>
            )}
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
      <Label htmlFor={value} className={cn("flex flex-col items-center justify-center h-16 rounded-xl border-2 cursor-pointer transition-all font-bold uppercase text-[7px] tracking-widest text-center px-1", colors[color])}>
        {label}
      </Label>
    </div>
  );
}
