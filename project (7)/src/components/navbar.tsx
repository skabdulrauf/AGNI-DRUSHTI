
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Flame, ShieldCheck, Menu, X, Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from 'react';
import { useLanguage } from '@/components/language-provider';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/dashboard', label: t('nav.grid') },
    { href: '/report', label: t('nav.report') },
    { href: '/alerts', label: t('nav.alerts') },
    { href: '/about', label: t('nav.about') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 py-3 bg-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Flame className="text-primary w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:scale-110" />
          <div className="flex flex-col">
            <span className="font-headline font-bold text-primary text-sm md:text-xl tracking-tighter leading-none uppercase">AGNI-DRISHTI</span>
            <span className="text-[6px] md:text-[8px] text-white/40 tracking-[0.3em] font-bold uppercase leading-tight">जंगल की आँख</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "hover:text-primary transition-all text-[9px] font-bold uppercase tracking-[0.2em] text-white/60",
                pathname === link.href && "text-white border-b border-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary h-8 w-8">
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0a0f0a] border-white/10 rounded-xl shadow-2xl">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("text-[9px] font-bold uppercase tracking-widest cursor-pointer", language === 'en' && "text-primary")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('hi')} className={cn("text-[9px] font-bold uppercase tracking-widest cursor-pointer", language === 'hi' && "text-primary")}>हिन्दी</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('kn')} className={cn("text-[9px] font-bold uppercase tracking-widest cursor-pointer", language === 'kn' && "text-primary")}>ಕನ್ನಡ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-white rounded-full font-bold px-4 h-8 transition-all text-[8px] uppercase tracking-widest gap-2" asChild>
            <Link href={user ? "/ranger/dashboard" : "/ranger/login"}>
              <ShieldCheck className="w-3 h-3" />
              <span className="hidden sm:inline">{user ? t('nav.ranger_command') : t('nav.ranger_login')}</span>
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white h-8 w-8">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0a0f0a] border-white/10 text-white">
              <div className="flex flex-col gap-6 pt-10">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-xl font-headline font-bold uppercase tracking-tight">{link.label}</Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
