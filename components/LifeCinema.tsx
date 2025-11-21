
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, GenerationStatus } from '../types';
import { analyzeLifeProfile, generateCinematicMemory, generateJournalAudio } from '../services/geminiService';
import { Sparkles, Play, Pause, Volume2, VolumeX, User, Music, Film, Loader2, AlertCircle } from 'lucide-react';

interface LifeCinemaProps {
  entries: JournalEntry[];
  onBack: () => void;
}

const LifeCinema: React.FC<LifeCinemaProps> = ({ entries, onBack }) => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [profile, setProfile] = useState<{ 
    archetype: string; 
    traits: string[]; 
    musicalStyle: string; 
    lyrics: string;
    visualPrompt: string;
  } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = async () => {
    if (entries.length < 3) {
      setError("Please write or import at least 3 journal entries to analyze your life patterns.");
      return;
    }
    setError(null);
    setStatus(GenerationStatus.ANALYZING);

    try {
      const combinedText = entries.map(e => `${e.date}: ${e.content}`).join('\n\n');
      const profileResult = await analyzeLifeProfile(combinedText);
      setProfile(profileResult);

      setStatus(GenerationStatus.GENERATING);

      // Generate Media
      const vidPromise = generateCinematicMemory(profileResult.visualPrompt);
      // Use a deeper, more authoritative voice for the "Life Anthem"
      const audPromise = generateJournalAudio(profileResult.lyrics, 'Charon');

      const [vid, aud] = await Promise.all([vidPromise, audPromise]);
      
      setVideoUrl(vid);
      setAudioUrl(aud);
      setStatus(GenerationStatus.COMPLETED);

      // Auto play
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compose your Life Cinema. Please try again.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  // Sync Playback
  useEffect(() => {
    if (status === GenerationStatus.COMPLETED && videoRef.current && audioRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        audioRef.current.play().catch(e => console.log("Autoplay prevented", e));
      } else {
        videoRef.current.pause();
        audioRef.current.pause();
      }
    }
  }, [isPlaying, status]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div ref={containerRef} className="min-h-full flex flex-col bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Life Cinema</h2>
            <p className="text-xs text-slate-400">Your personal anthem & movie</p>
          </div>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          Exit
        </button>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 min-h-[500px]">
        
        {/* Background Ambience */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
        </div>

        {status === GenerationStatus.IDLE && (
          <div className="text-center max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse blur-xl opacity-50"></div>
              <div className="relative bg-slate-800 rounded-full w-full h-full flex items-center justify-center border-4 border-slate-700 shadow-2xl">
                 <User className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Discover Your Theme</h3>
              <p className="text-slate-400 leading-relaxed">
                Let AI analyze your journals to compose your unique life anthem and cinematic movie.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-800 p-4 rounded-lg text-red-200 text-sm flex items-center gap-2 text-left">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button 
              onClick={handleStart}
              className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 hover:scale-[1.02] transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Begin Analysis
            </button>
          </div>
        )}

        {(status === GenerationStatus.ANALYZING || status === GenerationStatus.GENERATING) && (
           <div className="text-center z-10">
             <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
             <h3 className="text-2xl font-light text-white mb-2 animate-pulse">
               {status === GenerationStatus.ANALYZING ? "Reading your story..." : "Composing your anthem..."}
             </h3>
             <p className="text-slate-500">
               {status === GenerationStatus.ANALYZING 
                 ? "Extracting personality archetypes and emotional patterns."
                 : "Generating symbolic visuals and spoken word composition."}
             </p>

             {profile && (
               <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-xl max-w-sm mx-auto text-left animate-in slide-in-from-bottom-4">
                 <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">Profile Identified</p>
                 <h4 className="text-xl font-bold text-white mb-1">{profile.archetype}</h4>
                 <div className="flex gap-2 mb-4">
                   {profile.traits.map(t => (
                     <span key={t} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{t}</span>
                   ))}
                 </div>
                 <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-700 pt-3">
                    <Music className="w-3 h-3" />
                    {profile.musicalStyle}
                 </div>
               </div>
             )}
           </div>
        )}

        {status === GenerationStatus.COMPLETED && videoUrl && (
           <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
             
             {/* Player Column */}
             <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 group">
                   <video 
                     ref={videoRef}
                     src={videoUrl}
                     className="w-full h-full object-cover"
                     playsInline
                     loop
                     onClick={() => setIsPlaying(!isPlaying)}
                   />
                   {audioUrl && (
                     <audio 
                       ref={audioRef} 
                       src={audioUrl}
                       loop
                     />
                   )}
                   
                   {/* Controls */}
                   <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 p-6 rounded-full text-white transition-transform hover:scale-105"
                      >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                      </button>
                   </div>
                   <button onClick={toggleMute} className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                   </button>
                </div>
                
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Film className="w-4 h-4" />
                      <span>Generated by Veo 3.1</span>
                   </div>
                   <button onClick={handleStart} className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                     Regenerate
                   </button>
                </div>
             </div>

             {/* Profile Column */}
             <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Archetype</p>
                   <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                     {profile?.archetype}
                   </h1>
                   
                   <div className="flex flex-wrap gap-2 mb-6">
                      {profile?.traits.map(trait => (
                        <span key={trait} className="px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-sm font-medium border border-slate-600">
                           {trait}
                        </span>
                      ))}
                   </div>

                   <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                           <Music className="w-4 h-4 text-purple-400" />
                           <span>Theme Style</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           {profile?.musicalStyle}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                           <User className="w-4 h-4 text-pink-400" />
                           <span>Life Anthem</span>
                        </div>
                        <blockquote className="text-lg text-white italic font-serif leading-relaxed border-l-2 border-purple-500 pl-4 py-1">
                           "{profile?.lyrics}"
                        </blockquote>
                      </div>
                   </div>
                </div>
             </div>

           </div>
        )}
      </div>
    </div>
  );
};

export default LifeCinema;
