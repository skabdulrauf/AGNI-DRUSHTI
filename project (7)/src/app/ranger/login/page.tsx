"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Loader2, Cpu, Globe } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';

export default function RangerLoginPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push('/ranger/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Authorized", description: "Welcome to the Ranger Intelligence Grid." });
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      let errorMessage = "Credentials verification failed.";
      
      if (error.code === 'auth/api-key-not-valid') {
        errorMessage = "Tactical Grid API Key is invalid. Public mode enabled.";
      } else if (error.code === 'auth/auth-domain-config-required') {
        errorMessage = "Auth domain configuration pending. Public mode enabled.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({ 
        variant: "destructive", 
        title: "Authorization Pending", 
        description: errorMessage
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center p-6 relative overflow-hidden">
      <Navbar />
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 scan-line opacity-10" />
      </div>
      
      <div className="max-w-md w-full liquid-glass p-8 md:p-12 rounded-[3rem] border-white/5 space-y-8 relative z-10 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,92,26,0.1)] relative">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tighter uppercase leading-none">Official Portal</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Agni-Drishti National Security Grid</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-green-500">
            TACTICAL GRID ONLINE
          </span>
        </div>

        <div className="p-6 glass-panel border-white/5 rounded-3xl space-y-4 text-left bg-black/40 shadow-inner">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
              Access is restricted to authorized personnel. Public users can enter in <b>Read-Only</b> mode via the link below.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-bold gap-3 shadow-[0_0_30px_rgba(255,92,26,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Cpu className="w-5 h-5" />
                Authorize Ranger Entry
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            asChild
            className="w-full border-white/10 text-white/60 hover:text-white h-14 rounded-2xl font-bold gap-3 uppercase tracking-widest transition-all hover:scale-[1.02]"
          >
            <Link href="/ranger/dashboard">
              <Globe className="w-5 h-5" />
              Public Intelligence
            </Link>
          </Button>
        </div>

        <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.5em] pt-4">
          National Protocol 2.5 Active
        </p>
      </div>
    </div>
  );
}
