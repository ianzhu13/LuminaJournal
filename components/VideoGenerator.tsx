
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, GenerationStatus } from '../types';
import { analyzeJournalForVideo, generateCinematicMemory, generateJournalAudio } from '../services/geminiService';
import { Film, Sparkles, Loader2, AlertCircle, Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface VideoGeneratorProps {
  entries: JournalEntry[];
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ entries }) => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ prompt: string; mood: string; script: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      await checkKey();
    }
  };

  const handleGenerate = async () => {
    if (entries.length === 0) {
      setErrorMsg("No journal entries to process.");
      return;
    }

    setStatus(GenerationStatus.ANALYZING);
    setErrorMsg(null);
    setGeneratedVideoUrl(null);
    setGeneratedAudioUrl(null);
    setIsPlaying(false);

    try {
      // 1. Analyze
      const combinedText = entries.map(e => `${e.date}: ${e.content || '[Photo Entry]'}`).join('\n\n');
      const result = await analyzeJournalForVideo(combinedText);
      setAnalysis(result);

      setStatus(GenerationStatus.GENERATING);

      // 2. Pick reference image
      const referenceImage = entries.find(e => e.images.length > 0)?.images[0];

      // 3. Generate Video and Audio in parallel
      const videoPromise = generateCinematicMemory(result.prompt, referenceImage);
      const audioPromise = generateJournalAudio(result.script);

      const [videoUrl, audioUrl] = await Promise.all([videoPromise, audioPromise]);

      setGeneratedVideoUrl(videoUrl);
      setGeneratedAudioUrl(audioUrl);
      setStatus(GenerationStatus.COMPLETED);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate MTV.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current && audioRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        audioRef.current.pause();
      } else {
        videoRef.current.play();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Sync loop (simple) - ensure video loops audio if video is longer, or stops together
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-sm">
        <div className="bg-brand-100 p-4 rounded-full mb-4">
          <Film className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock MTV Mode</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Connect your Google Cloud API Key to generate cinematic videos and AI voiceovers.
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
        >
          Connect API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Film className="w-8 h-8 text-brand-500" />
          Lumina MTV Mode
        </h2>
        <p className="text-slate-500">
          Generate a cinematic video with an AI-narrated soundtrack.
        </p>
      </div>

      {status === GenerationStatus.IDLE && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
          <div className="relative w-24 h-24 mb-6">
             <div className="absolute inset-0 bg-brand-200 rounded-full animate-pulse opacity-50"></div>
             <div className="relative bg-white p-5 rounded-full shadow-md flex items-center justify-center h-full w-full">
                <div className="flex gap-1">
                  <Film className="w-6 h-6 text-brand-600" />
                  <Music className="w-6 h-6 text-indigo-600" />
                </div>
             </div>
          </div>
          
          <p className="text-lg font-medium text-slate-700 mb-2">
            Create a memory from {entries.length} entries
          </p>
          <p className="text-slate-400 mb-8 text-sm max-w-md">
            Gemini Veo will visualize your story while Gemini Flash narrates it.
          </p>

          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate MTV
          </button>
        </div>
      )}

      {(status === GenerationStatus.ANALYZING || status === GenerationStatus.GENERATING) && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
           <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
           <h3 className="text-xl font-semibold text-slate-800">
             {status === GenerationStatus.ANALYZING ? "Composing your story..." : "Producing video & audio..."}
           </h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">
             {status === GenerationStatus.ANALYZING 
               ? "Analyzing journal entries to write a script and visual prompt." 
               : "Generating high-definition video with Veo and synthesizing voiceover."}
           </p>
           
           {analysis && (
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visual Direction</p>
                 <p className="text-sm text-slate-700 italic line-clamp-3">"{analysis.prompt}"</p>
               </div>
               <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                 <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Voiceover Script</p>
                 <p className="text-sm text-indigo-800 italic line-clamp-3">"{analysis.script}"</p>
               </div>
             </div>
           )}
        </div>
      )}

      {status === GenerationStatus.COMPLETED && generatedVideoUrl && (
        <div className="bg-black rounded-2xl shadow-2xl overflow-hidden border border-slate-800 animate-in zoom-in-95">
           <div className="relative aspect-video bg-black group">
             <video 
               ref={videoRef}
               src={generatedVideoUrl} 
               className="w-full h-full object-contain"
               onEnded={handleVideoEnded}
               playsInline
               onClick={togglePlayback}
             />
             {generatedAudioUrl && (
               <audio 
                 ref={audioRef} 
                 src={generatedAudioUrl}
                 onEnded={() => setIsPlaying(false)}
               />
             )}

             {/* Custom Controls Overlay */}
             <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <button 
                  onClick={togglePlayback}
                  className="bg-white/20 backdrop-blur-md text-white p-6 rounded-full hover:bg-white/30 transition-all transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                </button>
             </div>
             
             {/* Mute Toggle */}
             <div className="absolute bottom-4 right-4">
                <button 
                  onClick={toggleMute}
                  className="bg-black/50 backdrop-blur text-white p-2 rounded-full hover:bg-black/70"
                >
                   {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
             </div>
           </div>

           <div className="p-6 bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-2xl font-bold">Your Memory Reel</h3>
                 <div className="flex gap-2">
                    <button 
                      onClick={handleGenerate}
                      className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Regenerate
                    </button>
                    <button 
                      onClick={() => setStatus(GenerationStatus.IDLE)}
                      className="text-sm text-slate-400 hover:text-white underline px-2"
                    >
                      Close
                    </button>
                 </div>
              </div>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                 <span className="bg-brand-900 text-brand-200 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide mt-0.5">
                    {analysis?.mood}
                 </span>
                 <p className="italic opacity-80">"{analysis?.script}"</p>
              </div>
           </div>
        </div>
      )}

      {status === GenerationStatus.ERROR && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-700">Generation Failed</h3>
          <p className="text-red-600 mb-4">{errorMsg}</p>
          <button
            onClick={() => setStatus(GenerationStatus.IDLE)}
            className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
