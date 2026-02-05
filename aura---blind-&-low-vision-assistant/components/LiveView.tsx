
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { SYSTEM_INSTRUCTION, MODEL_NAME, FRAME_RATE, JPEG_QUALITY } from '../constants';
import { decode, encode, decodeAudioData } from '../utils/audio-utils';
import { PersonProfile, EmergencyContact, SavedLocation } from '../types';
import Logo from './Logo';

interface LiveViewProps {
  profiles: PersonProfile[];
  contacts: EmergencyContact[];
  locations: SavedLocation[];
  userName: string;
  onExit: () => void;
  onUpdateMemory: (data: { profiles?: PersonProfile[], contacts?: EmergencyContact[], locations?: SavedLocation[] }) => void;
}

const LiveView: React.FC<LiveViewProps> = ({ profiles, contacts, locations, userName, onExit, onUpdateMemory }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [showMemoryTray, setShowMemoryTray] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trayType, setTrayType] = useState({ name: '', val: '' });

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const profilesRef = useRef(profiles);
  const contactsRef = useRef(contacts);
  const locationsRef = useRef(locations);

  useEffect(() => {
    profilesRef.current = profiles;
    contactsRef.current = contacts;
    locationsRef.current = locations;
  }, [profiles, contacts, locations]);

  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  const stopAudioPlayback = useCallback(() => {
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setLastMessage('');
  }, []);

  const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
    functionDeclarations: [
      {
        name: 'save_location',
        description: 'Saves or updates a location/address to user memory.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['name', 'description']
        }
      },
      {
        name: 'add_person',
        description: 'Saves or updates a person profile.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            relationship: { type: Type.STRING }
          },
          required: ['name', 'relationship']
        }
      },
      {
        name: 'add_emergency_contact',
        description: 'Saves or updates an emergency contact.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING }
          },
          required: ['name', 'phone']
        }
      },
      {
        name: 'call_contact',
        description: 'Initiates a phone call to a saved contact.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING }
          },
          required: ['name', 'phone']
        }
      }
    ]
  }];

  const memoryContext = `
[SAVED DATA]
User: ${userName || 'User'}
Locations: ${locations.map(l => l.name).join(', ') || 'None'}
People: ${profiles.map(p => p.name).join(', ') || 'None'}
Contacts: ${contacts.map(c => c.name).join(', ') || 'None'}
`;

  const startLiveSession = useCallback(async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key required");
      const ai = new GoogleGenAI({ apiKey });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription?.text) {
                const text = message.serverContent.inputTranscription.text.toLowerCase();
                const silenceCommands = ["ai quiet", "ai silent", "shut up", "stop", "silent"];
                if (silenceCommands.some(cmd => text.includes(cmd))) {
                    stopAudioPlayback();
                }
            }

            if (message.serverContent?.outputTranscription?.text) {
                const text = message.serverContent.outputTranscription.text;
                if (text.startsWith("Stop.") || text.startsWith("Stop!")) {
                    vibrate([500, 100, 500]); 
                }
                setLastMessage(text);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let confirmationText = "Updated.";
                if (fc.name === 'save_location') {
                  onUpdateMemory({ locations: [...locationsRef.current.filter(l => l.name !== fc.args.name), { id: Date.now().toString(), name: fc.args.name as string, description: fc.args.description as string }] });
                } else if (fc.name === 'add_person') {
                  onUpdateMemory({ profiles: [...profilesRef.current.filter(p => p.name !== fc.args.name), { id: Date.now().toString(), name: fc.args.name as string, relationship: fc.args.relationship as string }] });
                } else if (fc.name === 'add_emergency_contact') {
                  onUpdateMemory({ contacts: [...contactsRef.current.filter(c => c.name !== fc.args.name), { id: Date.now().toString(), name: fc.args.name as string, phone: fc.args.phone as string }] });
                } else if (fc.name === 'call_contact') {
                  confirmationText = `Calling ${fc.args.name}.`;
                  window.location.href = `tel:${fc.args.phone}`;
                }
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: confirmationText } } }));
              }
            }

            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }
          },
          onerror: () => { setError("Check connection..."); setIsSessionActive(false); },
          onclose: () => setIsSessionActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + "\n" + memoryContext,
          tools,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;

      const frameInterval = setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = 640; canvas.height = 360;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64data = (reader.result as string).split(',')[1];
                  sessionRef.current.sendRealtimeInput({ media: { data: base64data, mimeType: 'image/jpeg' } });
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', JPEG_QUALITY);
          }
        }
      }, 1000 / FRAME_RATE);

      return () => {
        clearInterval(frameInterval);
        if (sessionRef.current) sessionRef.current.close();
        stream.getTracks().forEach(t => t.stop());
      };

    } catch (err: any) {
      setError("I need to see and hear to help you.");
    }
  }, [memoryContext, onUpdateMemory, stopAudioPlayback, vibrate]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    startLiveSession().then(cleanup => { cleanupFn = cleanup; });
    return () => {
        if (cleanupFn) cleanupFn();
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [startLiveSession]);

  const handleScanPress = () => {
    vibrate(80);
    sessionRef.current?.sendRealtimeInput({ text: "Aura, what do you see around me? Is it safe?" });
  };

  const handleHelpPress = () => {
    vibrate(120);
    sessionRef.current?.sendRealtimeInput({ text: "Aura, I need some help. Please guide me." });
  };

  return (
    <div className="relative h-screen w-screen flex flex-col bg-slate-950 overflow-hidden select-none text-white font-sans">
      
      {/* Softened Camera Background */}
      <div className={`absolute inset-0 z-0 transition-all duration-1000 ${isHighContrast ? 'grayscale contrast-[1.8] brightness-[0.4] opacity-100' : 'opacity-40 scale-105 blur-sm'}`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Main UI Overlay */}
      <div className="relative z-10 flex-1 flex flex-col p-8 sm:p-12 justify-between">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center">
          <div className="bg-slate-900/60 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 flex items-center space-x-4 shadow-xl">
            <Logo size="sm" isAnimated={isSessionActive} />
            <span className="text-xl font-bold tracking-tight text-indigo-100 italic">Aura is with you</span>
          </div>
          <button 
            onClick={() => { vibrate(); setIsHighContrast(!isHighContrast); }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl border border-white/10 active:scale-90 ${isHighContrast ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            <span className="text-2xl">👁️</span>
          </button>
        </div>

        {/* Dynamic Center Caption */}
        <div className="flex-1 flex items-center justify-center py-12">
          <div className={`bg-slate-950/70 backdrop-blur-3xl p-12 rounded-[4rem] border-2 transition-all duration-500 max-w-4xl w-full shadow-2xl ${lastMessage.startsWith("Stop") ? 'border-coral-500 shadow-[0_0_100px_rgba(244,63,94,0.3)] scale-[1.02]' : 'border-white/5'}`}>
            <p className={`text-5xl sm:text-7xl font-bold text-center leading-tight tracking-tight italic ${lastMessage.startsWith("Stop") ? 'text-rose-400' : 'text-slate-100'}`}>
              {lastMessage || "Quietly observing..."}
            </p>
          </div>
        </div>

        {/* Warm Control Hub */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8 h-48">
            <button 
              onClick={handleHelpPress}
              className="group bg-indigo-600 active:bg-indigo-700 text-white rounded-[4rem] flex flex-col items-center justify-center shadow-2xl transition-all active:translate-y-2 border-b-[10px] border-indigo-900"
            >
              <span className="text-6xl mb-3 group-active:scale-90 transition-transform">🤝</span>
              <span className="text-2xl font-black italic tracking-tighter">I NEED HELP</span>
            </button>
            <button 
              onClick={handleScanPress}
              className="group bg-slate-800 active:bg-slate-900 text-white rounded-[4rem] flex flex-col items-center justify-center shadow-2xl transition-all active:translate-y-2 border-b-[10px] border-slate-950"
            >
              <span className="text-6xl mb-3 group-active:scale-90 transition-transform">✨</span>
              <span className="text-2xl font-black italic tracking-tighter">WHAT'S HERE?</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 h-24">
            <button 
              onClick={() => { vibrate(); setShowMemoryTray(true); }}
              className="bg-white/5 active:bg-white/10 text-indigo-100 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-xl"
            >
              <span className="text-xl font-bold uppercase tracking-widest italic">Memory</span>
            </button>
            <button 
              onClick={() => { vibrate(); onExit(); }}
              className="bg-white/5 active:bg-white/10 text-slate-400 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-xl"
            >
              <span className="text-xl font-bold uppercase tracking-widest italic">Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Memory Tray - Friendlier View */}
      {showMemoryTray && (
        <div className="absolute inset-0 z-50 bg-slate-950/98 p-10 overflow-y-auto animate-in fade-in slide-in-from-bottom-24 duration-700 scrollbar-hide backdrop-blur-3xl">
          <div className="flex justify-between items-center mb-16 max-w-4xl mx-auto">
            <h3 className="text-6xl font-black text-white tracking-tighter italic">Memories</h3>
            <button onClick={() => setShowMemoryTray(false)} className="bg-white/5 hover:bg-white/10 p-8 rounded-full text-5xl text-white transition-all">&times;</button>
          </div>
          
          <div className="grid gap-16 max-w-4xl mx-auto pb-60">
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-3xl">
              <h4 className="text-sm font-bold mb-6 uppercase text-indigo-400 tracking-[0.3em] text-center">Add a new memory</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Name" 
                    value={trayType.name} 
                    onChange={e => setTrayType({...trayType, name: e.target.value})}
                    className="bg-slate-900 border border-white/5 p-5 rounded-2xl text-2xl font-semibold focus:border-indigo-500 outline-none"
                  />
                  <input 
                    placeholder="Details" 
                    value={trayType.val} 
                    onChange={e => setTrayType({...trayType, val: e.target.value})}
                    className="bg-slate-900 border border-white/5 p-5 rounded-2xl text-2xl font-semibold focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <button onClick={() => handleManualAddInTray('LOC')} className="bg-emerald-600/90 py-6 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">PLACE</button>
                  <button onClick={() => handleManualAddInTray('PERSON')} className="bg-indigo-600/90 py-6 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">FRIEND</button>
                  <button onClick={() => handleManualAddInTray('CONTACT')} className="bg-amber-600/90 py-6 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">SAFE</button>
                </div>
              </div>
            </div>

            <section className="space-y-8">
               <div className="flex items-center space-x-6 px-4">
                 <div className="w-2 h-10 bg-indigo-500 rounded-full" />
                 <h4 className="text-4xl font-bold text-white italic">Saved spots & friends</h4>
               </div>
               <div className="grid gap-6">
                {locations.length === 0 && <p className="text-slate-700 text-3xl italic font-bold pl-8">Your memory is currently empty.</p>}
                {locations.map(l => (
                  <div key={l.id} className="bg-white/5 p-10 rounded-[3rem] border border-white/5 flex justify-between items-center group shadow-2xl transition-all">
                      <div>
                        <p className="text-4xl font-bold text-white italic">{l.name}</p>
                        <p className="text-xl text-slate-500 mt-2">{l.description}</p>
                      </div>
                      <button onClick={() => onUpdateMemory({ locations: locations.filter(x => x.id !== l.id) })} className="bg-red-500/10 text-red-500 p-6 rounded-full hover:bg-red-500 transition-all text-2xl">✕</button>
                  </div>
                ))}
               </div>
            </section>
          </div>
        </div>
      )}

      {error && <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-10 py-6 rounded-3xl font-black text-2xl z-[100] shadow-2xl animate-bounce">{error}</div>}
    </div>
  );

  function handleManualAddInTray(type: 'PERSON' | 'LOC' | 'CONTACT') {
    if (!trayType.name || !trayType.val) return;
    vibrate();
    const id = Date.now().toString();
    if (type === 'PERSON') onUpdateMemory({ profiles: [...profiles, { id, name: trayType.name, relationship: trayType.val }] });
    else if (type === 'LOC') onUpdateMemory({ locations: [...locations, { id, name: trayType.name, description: trayType.val }] });
    else if (type === 'CONTACT') onUpdateMemory({ contacts: [...contacts, { id, name: trayType.name, phone: trayType.val }] });
    setTrayType({ name: '', val: '' });
  }
};

export default LiveView;
