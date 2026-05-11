
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function RangerLoginPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      router.push('/ranger/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Authorized", description: "Welcome to the Ranger Intelligence Grid." });
    } catch (error) {
      toast({ variant: "destructive", title: "Access Denied", description: "Official credentials required." });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center p-6 relative overflow-hidden">
      <Navbar />
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-md w-full liquid-glass p-12 rounded-[3rem] border-white/5 space-y-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,92,26,0.1)]">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold text-white tracking-tighter uppercase">Official Access</h1>
            <p className="text-white/40 text-sm font-bold uppercase tracking-[0.3em]">Authorized Personnel Only</p>
          </div>
        </div>

        <div className="p-8 glass-panel border-white/5 rounded-3xl space-y-4 text-left">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-1" />
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Access to the AGNI-DRISHTI command portal requires authorized forest department credentials. All actions are logged and timestamped for accountability.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleLogin}
          className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-bold gap-3 shadow-[0_0_30px_rgba(255,92,26,0.2)] transition-all hover:scale-[1.02]"
        >
          {/* Custom Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFF"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFF" opacity="0.8"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FFF" opacity="0.6"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFF" opacity="0.9"/>
          </svg>
          Government Login
        </Button>

        <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.5em]">
          Secured by Firebase Enterprise Auth
        </p>
      </div>
    </div>
  );
}
