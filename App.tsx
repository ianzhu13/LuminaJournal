
import React, { useState, useEffect } from 'react';
import { JournalEntry, AppView } from './types';
import JournalList from './components/JournalList';
import Editor from './components/Editor';
import VideoGenerator from './components/VideoGenerator';
import EntryDetail from './components/EntryDetail';
import LifeCinema from './components/LifeCinema';
import { Plus, Upload, Film, BookOpen, FileText, CheckSquare, XSquare, Camera, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<AppView>(AppView.TIMELINE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lumina_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load entries", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('lumina_entries', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setEntries([newEntry, ...entries]);
    setView(AppView.TIMELINE);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation: check if it's an array or has an entries property
        const importedEntries = Array.isArray(json) ? json : (json.entries || []);
        
        const formatted: JournalEntry[] = importedEntries.map((raw: any) => ({
          id: crypto.randomUUID(),
          date: raw.date || raw.creationDate || new Date().toISOString(),
          content: raw.text || raw.content || '',
          images: raw.photos ? raw.photos.map((p: any) => typeof p === 'string' ? p : '') : [], // Simple handler
          mood: raw.mood,
          tags: raw.tags || []
        }));

        setEntries(prev => [...prev, ...formatted]);
        setIsImporting(false);
        alert(`Successfully imported ${formatted.length} entries!`);
      } catch (err) {
        alert('Failed to parse JSON. Please ensure format is correct.');
      }
    };
    reader.readAsText(file);
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getSelectedEntries = () => entries.filter(e => selectedIds.includes(e.id));

  const startMtvMode = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one journal entry to generate a memory reel.");
      return;
    }
    setView(AppView.MTV);
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setViewingEntry(entry);
    setView(AppView.DETAIL);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // Clear selections when exiting mode
    if (isSelectionMode) {
      setSelectedIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="md:w-64 bg-white border-r border-slate-200 fixed md:sticky top-0 h-16 md:h-screen z-20 flex md:flex-col justify-between md:justify-start items-center md:items-stretch px-4 md:py-8 w-full shadow-sm md:shadow-none">
        <div className="flex items-center gap-2 md:mb-10">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
             <BookOpen className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block text-slate-800">Lumina</h1>
        </div>

        <nav className="flex md:flex-col gap-1 md:gap-2 w-full md:w-auto justify-evenly md:justify-start">
          <button 
            onClick={() => { setView(AppView.TIMELINE); setSelectedIds([]); setIsSelectionMode(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.TIMELINE ? 'bg-slate-100 text-brand-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="hidden md:inline">Timeline</span>
          </button>

          <button 
            onClick={() => setView(AppView.EDITOR)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.EDITOR ? 'bg-slate-100 text-brand-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Write</span>
          </button>

          <button 
            onClick={() => setView(AppView.EDITOR)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900`}
          >
            <Camera className="w-5 h-5" />
            <span className="hidden md:inline">Photo</span>
          </button>

          <button 
            onClick={() => setView(AppView.LIFE_CINEMA)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.LIFE_CINEMA ? 'bg-slate-100 text-purple-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden md:inline">Life Cinema</span>
          </button>
          
          <button 
            onClick={() => setIsImporting(!isImporting)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900`}
          >
            <Upload className="w-5 h-5" />
            <span className="hidden md:inline">Import</span>
          </button>
        </nav>

        <div className="hidden md:block mt-auto space-y-4">
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <h3 className="font-bold text-sm text-slate-800 mb-2">MTV Mode</h3>
             <p className="text-xs text-slate-500 mb-3">Select entries to generate cinematic videos using Gemini Veo.</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
        
        {/* Import Modal Area */}
        {isImporting && (
           <div className="mb-6 bg-white p-6 rounded-xl shadow-md border border-brand-100 animate-in fade-in slide-in-from-top-4">
             <h3 className="font-bold text-lg mb-2 text-slate-800">Import Journal Data</h3>
             <p className="text-sm text-slate-500 mb-4">Upload a JSON file (e.g., Day One export format).</p>
             <input 
               type="file" 
               accept=".json"
               onChange={handleImport}
               className="block w-full text-sm text-slate-500
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-full file:border-0
                 file:text-sm file:font-semibold
                 file:bg-brand-50 file:text-brand-700
                 hover:file:bg-brand-100
               "
             />
             <button onClick={() => setIsImporting(false)} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">Cancel</button>
           </div>
        )}

        {view === AppView.EDITOR && (
          <Editor onSave={handleSaveEntry} onCancel={() => setView(AppView.TIMELINE)} />
        )}

        {view === AppView.DETAIL && viewingEntry && (
          <EntryDetail 
            entry={viewingEntry} 
            onBack={() => setView(AppView.TIMELINE)} 
          />
        )}

        {view === AppView.TIMELINE && (
          <>
            <header className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Your Journal</h2>
                <p className="text-slate-500 text-sm">{entries.length} entries recorded</p>
              </div>
              
              <div className="flex gap-2">
                {isSelectionMode ? (
                  <>
                     <span className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600 flex items-center animate-in fade-in">
                       {selectedIds.length} selected
                     </span>
                     <button 
                       onClick={() => toggleSelectionMode()}
                       className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                       title="Cancel selection"
                     >
                       <XSquare className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={startMtvMode}
                       disabled={selectedIds.length === 0}
                       className="px-4 py-2 bg-brand-600 text-white rounded-lg shadow-md hover:bg-brand-700 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <Film className="w-4 h-4" />
                       Generate MTV
                     </button>
                  </>
                ) : (
                  <button 
                    onClick={() => toggleSelectionMode()}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Select Multiple
                  </button>
                )}
              </div>
            </header>
            
            <JournalList 
              entries={entries} 
              selectionMode={isSelectionMode} 
              selectedIds={selectedIds}
              toggleSelection={toggleSelection}
              onSelectForMtv={() => {}}
              onEntryClick={handleEntryClick}
            />
          </>
        )}

        {view === AppView.MTV && (
          <div className="animate-in zoom-in-95 duration-300">
             <button 
               onClick={() => setView(AppView.TIMELINE)}
               className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800"
             >
               ← Back to Timeline
             </button>
             <VideoGenerator entries={getSelectedEntries()} />
          </div>
        )}

        {view === AppView.LIFE_CINEMA && (
          <div className="animate-in zoom-in-95 duration-300 h-full">
             <LifeCinema entries={entries} onBack={() => setView(AppView.TIMELINE)} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
