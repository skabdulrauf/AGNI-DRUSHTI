'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Loader2, MessageSquare, Bot, Trash2, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { voiceAssistant } from '@/ai/flows/voice-assistant-flow';
import { classifyCitizenReport } from '@/ai/flows/citizen-report-classification-flow';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audio?: string;
  redirectTo?: string;
  isAction?: boolean;
};

export function ChatAssistant() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isThinking, isExecuting]);

  const toggleAssistant = () => setIsOpen(!isOpen);

  const fetchCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 30.0668, lng: 79.0193 }); 
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: 30.0668, lng: 79.0193 }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const executeReportAction = async (description: string, lat: number, lng: number) => {
    setIsExecuting(true);
    try {
      const aiMeta = await classifyCitizenReport({ description });
      
      const reportData = {
        description,
        urgency: 'medium',
        lat,
        lng,
        status: 'pending',
        source: 'ai_assistant',
        ai_classification: aiMeta,
        created_at: serverTimestamp()
      };
      
      await addDoc(collection(firestore, 'complaints'), reportData);
      
      const successMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Tactical link established. SITREP submitted to Ranger Command Grid.`,
        timestamp: new Date(),
        isAction: true
      };
      setMessages(prev => [...prev, successMsg]);
      toast({ title: "Grid Updated", description: "Autonomous report successfully routed." });
      
    } catch (error) {
      console.error("Action error:", error);
      toast({ variant: "destructive", title: "Action Failed", description: "Failed to submit report." });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking || isExecuting) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsThinking(true);

    try {
      // Proactively fetch location for all inputs to provide spatial context
      const location = await fetchCurrentLocation();
      
      const result = await voiceAssistant({ 
        query: currentInput,
        lat: location.lat,
        lng: location.lng
      });
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        audio: result.audio,
        redirectTo: result.redirectTo
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (assistantMsg.audio && audioRef.current) {
        audioRef.current.src = assistantMsg.audio;
        audioRef.current.play().catch(err => console.warn("Audio playback blocked", err));
      }

      if (result.redirectTo) {
        let finalPath = result.redirectTo;
        if (result.locateZone && result.redirectTo === '/dashboard') {
          finalPath = `${result.redirectTo}?search=${encodeURIComponent(result.locateZone)}`;
        }
        
        setTimeout(() => {
          router.push(finalPath);
        }, 1500);
      }

      if (result.intent === 'SUBMIT_REPORT' && result.reportDescription) {
        await executeReportAction(result.reportDescription, location.lat, location.lng);
      }

    } catch (error) {
      console.error("Assistant error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the intelligence grid. Please check your signal.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[100]">
        <button
          onClick={toggleAssistant}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl hover:scale-110 border border-white/10",
            isOpen ? "bg-destructive text-white" : "bg-primary text-white"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {!isOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-8 w-[85vw] max-w-[360px] h-[520px] z-[90] flex flex-col liquid-glass rounded-[2.5rem] border-white/5 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden">
          <header className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-headline font-bold text-xs tracking-tight leading-none uppercase">AGNI AI</h3>
                <p className="text-[6px] text-primary font-bold uppercase tracking-[0.3em] mt-1">Tactical Agent</p>
              </div>
            </div>
            <button onClick={clearChat} className="text-white/20 hover:text-destructive transition-colors p-2"><Trash2 className="w-3 h-3" /></button>
          </header>

          <ScrollArea className="flex-1 p-5" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-20 space-y-4 opacity-20">
                  <Bot className="w-12 h-12 mx-auto text-primary" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                    Command established. How can I assist today?
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[92%] gap-1.5",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] leading-relaxed shadow-xl",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none backdrop-blur-3xl"
                  )}>
                    {msg.content}
                    
                    {msg.isAction && (
                      <div className="mt-3 flex items-center gap-2 text-primary font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[8px] uppercase tracking-widest">Action Verified</span>
                      </div>
                    )}

                    {msg.redirectTo && (
                      <div className="mt-3 p-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-primary uppercase">Guiding Interface...</span>
                        <ArrowRight className="w-3 h-3 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                  <span className="text-[6px] text-white/20 font-bold uppercase tracking-widest px-1">
                    {msg.role === 'user' ? 'Local' : 'Agni Intel'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-start gap-2">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 border border-white/10">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest animate-pulse">Processing...</span>
                  </div>
                </div>
              )}
              {isExecuting && (
                <div className="flex flex-col items-center gap-3 w-full py-6 animate-in fade-in zoom-in-95">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[8px] font-bold text-primary uppercase tracking-[0.3em] animate-pulse text-center px-4">Locking GPS & Syncing...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="p-5 bg-black/40 backdrop-blur-3xl border-t border-white/5 shrink-0">
            <div className="relative group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Command input..."
                className="bg-white/5 border-none text-white rounded-full pr-12 h-11 text-[10px] font-medium placeholder:text-white/20 focus:ring-0 transition-all shadow-inner"
                disabled={isThinking || isExecuting}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isThinking || isExecuting}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <audio ref={audioRef} className="hidden" />
        </div>
      )}
    </>
  );
}