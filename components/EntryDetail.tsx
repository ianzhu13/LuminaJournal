import React from 'react';
import { JournalEntry } from '../types';
import { ArrowLeft, Calendar, Tag, Smile, Clock } from 'lucide-react';

interface EntryDetailProps {
  entry: JournalEntry;
  onBack: () => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  'Happy': '😊',
  'Excited': '🤩',
  'Grateful': '🥰',
  'Calm': '😌',
  'Neutral': '😐',
  'Sad': '😔',
  'Tired': '😴',
  'Angry': '😠',
};

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onBack }) => {
  const dateObj = new Date(entry.date);
  const moodEmoji = entry.mood ? MOOD_EMOJIS[entry.mood] : null;

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-[80vh] rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-300">
      
      {/* Header / Nav */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center gap-4 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Entry Details</span>
      </div>

      <div className="p-8 md:p-12 space-y-8">
        
        {/* Date & Mood Header */}
        <div className="space-y-4 border-b border-slate-50 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h1>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                   <Calendar className="w-4 h-4" />
                   <span>{dateObj.getFullYear()}</span>
                </div>
             </div>

             {entry.mood && (
               <div className="flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-full border border-brand-100">
                  <span className="text-2xl">{moodEmoji}</span>
                  <span className="font-semibold text-brand-700">{entry.mood}</span>
               </div>
             )}
          </div>
        </div>

        {/* Images Grid */}
        {entry.images.length > 0 && (
          <div className={`grid gap-4 ${entry.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
            {entry.images.map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <img 
                  src={img} 
                  alt={`Memory ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {entry.content && (
           <div className="prose prose-lg prose-slate max-w-none leading-relaxed text-slate-700 whitespace-pre-wrap">
             {entry.content}
           </div>
        )}

        {/* Footer Meta */}
        <div className="pt-8 border-t border-slate-50 flex flex-wrap gap-3">
           {entry.tags?.map(tag => (
             <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm">
               <Tag className="w-3.5 h-3.5" />
               {tag}
             </span>
           ))}
        </div>

      </div>
    </div>
  );
};

export default EntryDetail;