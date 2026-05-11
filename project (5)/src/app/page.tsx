import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Flame, Radio, ShieldCheck, Users } from 'lucide-react';
import { getAgniStats } from '@/lib/stats-service';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch stats directly from the service to avoid internal fetch issues on Vercel
  const stats = await getAgniStats();

  return (
    <div className="min-h-screen bg-[#0a0f0a] selection:bg-primary/40">
      <Navbar />
      
      <section className="relative h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none scale-100">
          <svg viewBox="0 0 800 900" className="w-[80%] h-[80%] fill-transparent stroke-primary stroke-[0.5]">
            <path d="M400 100 L450 150 L420 200 L460 250 L440 300 L480 350 L420 400 L440 450 L400 500 L380 550 L350 520 L300 550 L250 500 L200 450 L220 400 L180 350 L220 300 L200 250 L240 200 L210 150 Z" />
          </svg>
        </div>

        <div className="absolute inset-0 z-1 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,15,10,1)_90%)]" />
        <div className="absolute top-0 left-0 w-full h-full scan-line pointer-events-none opacity-20" />

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <p className="text-white/40 font-bold uppercase tracking-[1em] text-[8px]">Agni-Drishti Tactical Grid</p>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h1 className="text-6xl md:text-7xl font-headline font-bold text-primary drop-shadow-[0_0_60px_rgba(255,92,26,0.4)] tracking-tighter leading-none uppercase">जंगल की आँख</h1>
          </div>
          
          <p className="text-base md:text-lg text-white/70 max-w-3xl mx-auto leading-relaxed font-light tracking-tight italic">
            Next-generation forest fire early-warning system powered by Gemini 1.5, synchronizing real-time satellite telemetry with multi-language citizen reporting.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-7 rounded-full shadow-[0_0_40px_rgba(255,92,26,0.3)] font-bold gap-3 transition-all hover:scale-105" asChild>
              <Link href="/dashboard"><Flame className="w-6 h-6" /> Ranger Command</Link>
            </Button>
            <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 text-lg px-10 py-7 rounded-full border-2 font-bold gap-3 transition-all hover:scale-105 group relative overflow-hidden" asChild>
              <Link href="/report">
                <Radio className="w-6 h-6 group-hover:animate-pulse relative z-10" /> <span className="relative z-10">Report Smoke</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12">
            <StatCard label="Fires Today" value={stats.fires_detected_today} />
            <StatCard label="Alerts Sent" value={stats.alerts_sent} />
            <StatCard label="Verified Responses" value={stats.ranger_responses} />
            <StatCard label="Citizens Protected" value={stats.citizens_protected} />
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Radio className="text-primary w-10 h-10" />}
          title="Satellite Mesh"
          desc="Sub-hour ingestion of NASA FIRMS active fire products mapped to local biodiversity zones."
        />
        <FeatureCard 
          icon={<Users className="text-primary w-10 h-10" />}
          title="AI Ground Truth"
          desc="Multilingual voice verification processed through Gemini classification for remote forest residents."
        />
        <FeatureCard 
          icon={<ShieldCheck className="text-primary w-10 h-10" />}
          title="Tactical Interdiction"
          desc="Automated SITREPs routed to Range Officers with AI-generated multilingual action plans."
        />
      </section>

      <footer className="py-12 border-t border-white/5 text-center bg-black/40">
        <p className="text-white/20 text-[8px] font-bold uppercase tracking-[0.5em] mb-4">
          SOFTWARE-ONLY, FREE-API SOLUTION | POWERED BY GEMINI 1.5 + NASA FIRMS + OPEN-METEO
        </p>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-panel p-6 rounded-[2rem] border-white/5 flex flex-col items-center justify-center scan-line group hover:border-primary/30 transition-all duration-500">
      <span className="text-2xl font-headline font-bold text-white mb-1 group-hover:text-primary transition-all duration-500 tracking-tighter">
        {value.toLocaleString()}+
      </span>
      <span className="text-[8px] text-white/40 font-bold uppercase tracking-[0.2em] text-center">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="liquid-glass p-10 rounded-[2.5rem] border-white/5 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden">
      <div className="mb-6 text-primary">{icon}</div>
      <h3 className="text-xl font-headline font-bold text-white mb-4 group-hover:text-primary transition-colors tracking-tighter leading-none">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm font-medium">{desc}</p>
    </div>
  );
}
