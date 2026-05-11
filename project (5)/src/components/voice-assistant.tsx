
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Sparkles, Volume2, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { voiceAssistant } from '@/ai/flows/voice-assistant-flow';
import { cn } from '@/lib/utils';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setTranscript("");
      setResponse("");
      stopListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleVoiceQuery(text);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleVoiceQuery = async (query: string) => {
    setIsThinking(true);
    try {
      const result = await voiceAssistant({ query });
      setResponse(result.text);
      
      if (result.audio && audioRef.current) {
        audioRef.current.src = result.audio;
        audioRef.current.play().catch(e => console.warn("Audio autoplay blocked or failed:", e));
      }
    } catch (error) {
      console.error("Voice Assistant Error:", error);
      setResponse("I encountered an error while accessing the thermal telemetry. Please try speaking again.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Floating Pill Trigger */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <button
          onClick={toggleAssistant}
          className={cn(
            "h-14 px-6 rounded-full glass-panel border-primary/40 flex items-center gap-3 transition-all duration-500 shadow-2xl hover:scale-105",
            isOpen ? "bg-primary text-white" : "text-primary bg-black/40"
          )}
        >
          <Sparkles className={cn("w-5 h-5", isOpen && "animate-pulse")} />
          <span className="font-bold text-sm tracking-wide uppercase">
            {isOpen ? "Close Assistant" : "Agni Assistant"}
          </span>
        </button>
      </div>

      {/* Assistant Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#0a0f0a]/95 backdrop-blur-3xl z-[90] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
          <button 
            onClick={toggleAssistant}
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-4"
          >
            <X className="w-10 h-10" />
          </button>

          <div className="max-w-2xl w-full space-y-12 text-center">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className={cn(
                  "w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-700",
                  isListening ? "scale-110 shadow-[0_0_80px_rgba(255,92,26,0.8)] bg-primary" : "shadow-[0_0_40px_rgba(255,92,26,0.3)] bg-white/5"
                )}>
                  {isListening && <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />}
                  <Mic className={cn("w-16 h-16 relative z-10 transition-colors", isListening ? "text-white" : "text-primary")} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white text-2xl font-headline font-bold uppercase tracking-tight">
                  {isListening ? "Listening..." : isThinking ? "Agni AI is analyzing..." : "Ready for Command"}
                </p>
                <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[10px]">
                  India Forest Intelligence Grid
                </p>
              </div>
            </div>

            <div className="space-y-8 min-h-[200px] flex flex-col justify-center">
              {transcript && (
                <div className="glass-panel p-6 rounded-3xl border-white/5 animate-in slide-in-from-bottom-4">
                  <p className="text-white/40 text-[10px] font-bold uppercase mb-2 tracking-widest">User Transmission</p>
                  <p className="text-xl text-white font-medium italic">"{transcript}"</p>
                </div>
              )}

              {response && (
                <div className="glass-panel p-8 rounded-[2rem] border-primary/20 bg-primary/5 animate-in zoom-in-95 duration-700 shadow-[inset_0_0_40px_rgba(255,92,26,0.05)]">
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <Volume2 className="text-primary w-5 h-5 animate-pulse" />
                    <span className="text-primary font-bold text-[10px] uppercase tracking-[0.3em]">AI Transmission</span>
                  </div>
                  <p className="text-2xl text-white font-headline font-bold leading-tight">
                    {response}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6">
              {!isListening && !isThinking && (
                <Button 
                  onClick={startListening}
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-20 h-20 text-xl gap-4 shadow-[0_0_40px_rgba(255,92,26,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  <Mic className="w-7 h-7" /> Initiate Voice Link
                </Button>
              )}
              {isThinking && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="text-primary font-bold text-xs uppercase tracking-[0.5em] animate-pulse">Syncing NASA FIRMS telemetry...</span>
                </div>
              )}
            </div>
          </div>
          <audio ref={audioRef} className="hidden" />
        </div>
      )}
    </>
  );
}
