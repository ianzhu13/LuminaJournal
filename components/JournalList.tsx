import React from 'react';
import { JournalEntry } from '../types';
import { Calendar, ImageIcon, Tag, CheckCircle2, Circle } from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onSelectForMtv: (entries: JournalEntry[]) => void;
  selectionMode: boolean;
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  onEntryClick: (entry: JournalEntry) => void;
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

const JournalList: React.FC<JournalListProps> = ({ 
  entries, 
  selectionMode,
  selectedIds,
  toggleSelection,
  onEntryClick
}) => {
  
  // Sort by date desc (Newest First) for the timeline
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-xl">Your journal is empty.</p>
        <p>Start writing or import an existing journal.</p>
      </div>
    );
  }

  const handleCardClick = (entry: JournalEntry) => {
    if (selectionMode) {
      toggleSelection(entry.id);
    } else {
      onEntryClick(entry);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto pb-24 px-2 md:px-0">
      {/* Vertical Timeline Line */}
      <div className="absolute left-6 md:left-8 top-6 bottom-0 w-px bg-slate-200" />

      <div className="space-y-8">
        {sortedEntries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id);
          const dateObj = new Date(entry.date);
          const moodEmoji = entry.mood ? MOOD_EMOJIS[entry.mood] : null;
          
          return (
            <div 
              key={entry.id} 
              className="relative pl-14 md:pl-20 group"
              onClick={() => handleCardClick(entry)}
            >
              {/* Timeline Dot */}
              <div 
                className={`
                  absolute left-[17px] md:left-[25px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-300
                  ${isSelected 
                    ? 'bg-brand-500 ring-4 ring-brand-100 scale-110' 
                    : 'bg-white border-slate-300 group-hover:border-brand-400 group-hover:bg-brand-50 group-hover:scale-110'}
                `} 
              />

              {/* Entry Card */}
              <div 
                className={`
                  relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                  ${selectionMode 
                    ? (isSelected 
                        ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/10 shadow-md' 
                        : 'border-slate-200 opacity-80 hover:opacity-100') 
                    : 'border-slate-200 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 hover:shadow-brand-500/5'}
                `}
              >
                {/* Selection Indicator */}
                {selectionMode && (
                   <div className={`absolute top-4 right-4 transition-all duration-200 ${isSelected ? 'text-brand-500 scale-110' : 'text-slate-200'}`}>
                      {isSelected ? <CheckCircle2 className="w-6 h-6 fill-brand-50" /> : <Circle className="w-6 h-6" />}
                   </div>
                )}

                {/* Header */}
                <div className="flex flex-col mb-3 pr-8">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
                  </span>
                  <div className="flex items-center flex-wrap gap-3">
                    <h3 className="text-lg font-bold text-slate-800">
                      {dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    {entry.mood && (
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium capitalize border border-indigo-100 flex items-center gap-1">
                        {moodEmoji && <span>{moodEmoji}</span>}
                        {entry.mood}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Snippet */}
                {entry.content && (
                  <div className="prose prose-slate text-slate-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {entry.content}
                  </div>
                )}

                {/* Images Preview */}
                {entry.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-3">
                    {entry.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-slate-100 group-hover:border-slate-200 transition-colors">
                        <img src={img} alt="Memory" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {entry.images.length > 4 && (
                       <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-400 font-medium">
                         +{entry.images.length - 4}
                       </div>
                    )}
                  </div>
                )}

                {/* Footer Tags & Info */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                   <div className="flex flex-wrap gap-2">
                     {entry.tags && entry.tags.length > 0 ? (
                       entry.tags.map(t => (
                         <span key={t} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                           <Tag className="w-3 h-3" /> {t}
                         </span>
                       ))
                     ) : (
                       <span className="text-xs text-slate-300 italic">No tags</span>
                     )}
                   </div>
                   
                   {entry.images.length > 0 && (
                     <span className="text-xs text-slate-400 flex items-center gap-1">
                       <ImageIcon className="w-3 h-3" /> {entry.images.length}
                     </span>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JournalList;