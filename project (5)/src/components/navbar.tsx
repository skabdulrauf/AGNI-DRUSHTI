"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Flame, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Tactical Grid' },
    { href: '/report', label: 'Report Smoke' },
    { href: '/alerts', label: 'Live Alerts' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 glass-panel border-t-0 border-x-0 rounded-none bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all rounded-full" />
            <Flame className="text-primary w-9 h-9 relative z-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-primary text-2xl tracking-tighter leading-none uppercase">AGNI-DRISHTI</span>
            <span className="text-[10px] text-white/40 tracking-[0.4em] font-bold uppercase leading-tight">जंगल की आँख</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "hover:text-primary transition-all relative py-2",
                pathname === link.href && "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest hidden lg:inline">LIVE FEED</span>
          </div>
          
          <Button 
            variant="outline" 
            className={cn(
              "border-primary/50 text-primary hover:bg-primary hover:text-white rounded-full font-bold px-6 h-9 transition-all text-[9px] uppercase tracking-[0.2em] gap-2",
              user && "bg-primary/10 border-primary"
            )} 
            asChild
          >
            <Link href={user ? "/ranger/dashboard" : "/ranger/login"}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {user ? "Ranger Command" : "Ranger Login"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
