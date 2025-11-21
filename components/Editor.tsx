import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { Image as ImageIcon, Save, X, Tag, Sparkles, Smile } from 'lucide-react';
import { fileToBase64, resizeImage } from '../utils/imageUtils';
import { suggestTags } from '../services/geminiService';

interface EditorProps {
  onSave: (entry: Omit<JournalEntry, 'id'>) => void;
  onCancel: () => void;
}

const MOODS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Excited', emoji: '🤩' },
  { label: 'Grateful', emoji: '🥰' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Sad', emoji: '😔' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Angry', emoji: '😠' },
];

const Editor: React.FC<EditorProps> = ({ onSave, onCancel }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        const resized = await resizeImage(base64);
        setImages([...images, resized]);
      } catch (error) {
        console.error("Image processing failed", error);
      }
    }
  };

  const handleSuggestTags = async () => {
    if (!content.trim() && images.length === 0) return;
    setIsSuggesting(true);
    try {
      // Pass the first image for multimodal analysis if available
      const suggested = await suggestTags(content, images[0]);
      setTags([...new Set([...tags, ...suggested])]);
    } catch (error) {
      console.error("Failed to suggest tags", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = () => {
    // Allow save if content is present OR if there are images (Personal Figure Entry)
    if (!content.trim() && images.length === 0) return;
    
    onSave({
      date,
      content,
      images,
      tags,
      mood: mood || undefined
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">New Entry</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
              <Smile className="w-4 h-4" /> Mood
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(m.label)}
                  className={`flex-shrink-0 px-3 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                    mood === m.label
                      ? 'bg-brand-100 border-brand-300 text-brand-700 ring-2 ring-brand-100 ring-offset-1'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">What's on your mind?</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none resize-none text-lg text-slate-700 leading-relaxed"
            placeholder="Dear diary... (Optional if uploading photos)"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {tags.map(tag => (
            <span key={tag} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm flex items-center">
              #{tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-2 hover:text-indigo-800">×</button>
            </span>
          ))}
          <button 
            onClick={handleSuggestTags}
            disabled={isSuggesting || (!content && images.length === 0)}
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand-50 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSuggesting ? 'Thinking...' : 'AI Tags'}
          </button>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-500 mb-2">Photos / Personal Figure</label>
           <div className="flex flex-wrap gap-4">
             {images.map((img, idx) => (
               <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md">
                 <img src={img} alt="upload" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => setImages(images.filter((_, i) => i !== idx))}
                   className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                 >
                   <X className="w-3 h-3" />
                 </button>
               </div>
             ))}
             
             <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors text-slate-400 hover:text-brand-500">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs text-center px-1">Add Photo / Figure</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
             </label>
           </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={!content.trim() && images.length === 0}
          className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg shadow-md hover:bg-brand-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          Save Entry
        </button>
      </div>
    </div>
  );
};

export default Editor;