
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Shield, Cloud, Bot, Users, Map, Truck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 space-y-24">
        <div className="text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-primary/20 text-xs px-4 py-1 rounded-full uppercase font-bold tracking-[0.3em]">Our Mission</Badge>
          <h1 className="text-7xl md:text-8xl font-headline font-bold text-white tracking-tighter">AI for Indian Forests</h1>
          <p className="text-white/60 text-xl max-w-3xl mx-auto leading-relaxed">
            AGNI-DRISHTI is a software-only early warning system that bridges the gap between satellite data and real-time citizen reporting.
          </p>
        </div>

        <div className="relative py-12">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 hidden md:block" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
            <PipeItem icon={<Cloud />} label="Satellites" />
            <PipeItem icon={<Map />} label="Ingestion" />
            <PipeItem icon={<Bot />} label="AI Logic" />
            <PipeItem icon={<Users />} label="Citizens" />
            <PipeItem icon={<Shield />} label="Rangers" />
            <PipeItem icon={<Truck />} label="Response" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <SDGCard num="13" color="bg-[#3f7e44]" label="Climate Action" desc="Reducing carbon emissions from massive forest fires." />
          <SDGCard num="15" color="bg-[#56c02b]" label="Life on Land" desc="Protecting critical biodiversity and tiger reserves." />
          <SDGCard num="11" color="bg-[#f99d26]" label="Sustainable Cities" desc="Shielding forest-edge communities from rapid fire spread." />
        </div>

        <div className="liquid-glass p-16 rounded-[3rem] border-white/5 grid md:grid-cols-2 gap-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] -mr-48 -mt-48" />
          
          <div className="space-y-8">
            <h2 className="text-4xl font-headline font-bold text-white">Made for Bharat</h2>
            <div className="space-y-4">
              <FactItem value="71M" label="Hectares of forest with no AI monitoring" />
              <FactItem value="38.3M" label="Hectares burned globally in 2024" />
              <FactItem value="75%" label="Destruction reduction possible with early detection" />
            </div>
          </div>

          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>We combine MODIS/VIIRS thermal anomalies with voice-reported local sightings in 5+ Indian languages.</p>
            <p className="text-primary font-bold">Free APIs. No Hardware. Built for impact.</p>
          </div>
        </div>
      </section>

      <footer className="py-24 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.5em]">
        Software-Only | Scalable | Global Open Standards
      </footer>
    </div>
  );
}

function PipeItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center text-white/40 group-hover:text-primary group-hover:border-primary/50 transition-all">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</span>
    </div>
  );
}

function SDGCard({ num, color, label, desc }: { num: string, color: string, label: string, desc: string }) {
  return (
    <div className="liquid-glass p-8 rounded-3xl border-white/5 space-y-4 hover:translate-y-[-4px] transition-transform">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white font-bold text-xl`}>{num}</div>
      <h3 className="text-xl font-bold text-white">{label}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

function FactItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex items-end gap-4">
      <span className="text-5xl font-headline font-bold text-primary tracking-tighter">{value}</span>
      <span className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2">{label}</span>
    </div>
  );
}
