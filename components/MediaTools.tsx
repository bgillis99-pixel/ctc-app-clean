import React, { useState, useRef } from 'react';
import { analyzeMedia, extractEngineTagInfo } from '../services/geminiService';
import { Submission } from '../types';

const CHECKLISTS = {
  ovi: {
    label: "OVI (Smoke)",
    items: [
        "Warm up engine to operating temp (>185°F)",
        "Inspect exhaust system for leaks",
        "Check oil & coolant levels",
        "Disable exhaust brake/retarder"
    ]
  },
  obd: {
    label: "OBD",
    items: [
        "Verify MIL (Check Engine Light) is working",
        "Ensure no active diagnostic codes",
        "Locate OBD port (9-pin or 16-pin)",
        "Drive cycle complete (if codes cleared recently)"
    ]
  }
};

const MediaTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'analyze' | 'generate'>('scan');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [engineTagResult, setEngineTagResult] = useState<{familyName: string, modelYear: string} | null>(null);
  const [subTab, setSubTab] = useState<'ovi' | 'obd'>('ovi');

  const engineTagRef = useRef<HTMLInputElement>(null);
  const analysisInputRef = useRef<HTMLInputElement>(null);

  const logSubmission = (type: string, summary: string, details: any) => {
      const submission: Submission = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          dateStr: new Date().toLocaleString(),
          type: 'ENGINE_TAG',
          summary: `${type}: ${summary}`,
          details,
          coordinates: null,
          status: 'NEW'
      };
      
      try {
        const existing = JSON.parse(localStorage.getItem('vin_diesel_submissions') || '[]');
        localStorage.setItem('vin_diesel_submissions', JSON.stringify([submission, ...existing]));
      } catch (e) {
          console.error("Failed to log submission", e);
      }
  };

  const handleEngineTagScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      setEngineTagResult(null);
      try {
          const result = await extractEngineTagInfo(file);
          setEngineTagResult(result);
          logSubmission('Engine Tag Scan', result.familyName, result);
      } catch (err) {
          alert('Engine label read failed. Ensure label is clean.');
      } finally {
          setLoading(false);
          e.target.value = '';
      }
  };

  const handleAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult('');
    try {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const text = await analyzeMedia(file, "Analyze this diesel component for CARB compliance.", type);
        setResult(text);
        logSubmission('Visual Inspection', `Uploaded ${type}`, { result: text });
    } catch (err) {
        setResult("Analysis failed. Try again.");
    } finally {
        setLoading(false);
        e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 border-navy overflow-hidden mb-20 transition-colors">
      <div className="flex border-b-4 border-navy bg-gray-50 dark:bg-gray-900">
        <button className={`flex-1 p-4 font-black text-[10px] uppercase tracking-tighter ${activeTab === 'scan' ? 'text-teslaRed border-b-4 border-teslaRed bg-white dark:bg-gray-800' : 'text-gray-400'}`} onClick={() => setActiveTab('scan')}>Engine Scan</button>
        <button className={`flex-1 p-4 font-black text-[10px] uppercase tracking-tighter ${activeTab === 'analyze' ? 'text-teslaRed border-b-4 border-teslaRed bg-white dark:bg-gray-800' : 'text-gray-400'}`} onClick={() => setActiveTab('analyze')}>Checklists</button>
        <button className={`flex-1 p-4 font-black text-[10px] uppercase tracking-tighter ${activeTab === 'generate' ? 'text-teslaRed border-b-4 border-teslaRed bg-white dark:bg-gray-800' : 'text-gray-400'}`} onClick={() => setActiveTab('generate')}>Decals</button>
      </div>

      <div className="p-6 min-h-[400px]">
        {activeTab === 'scan' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-navy/5 rounded-full flex items-center justify-center mx-auto border-2 border-navy/10">
                    <svg className="w-10 h-10 text-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <div>
                    <h3 className="text-xl font-black text-navy dark:text-white uppercase tracking-tight">Engine Family Reader</h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Identify EFN codes instantly</p>
                </div>
                
                <button 
                  onClick={() => engineTagRef.current?.click()} 
                  className="w-full btn-heavy py-6 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    <span className="font-black uppercase tracking-tighter">SCAN LABEL</span>
                </button>
                <input type="file" ref={engineTagRef} onChange={handleEngineTagScan} accept="image/*" capture="environment" className="hidden" />

                {engineTagResult && (
                    <div className="p-6 bg-orange-50 dark:bg-orange-900/20 border-4 border-navy rounded-2xl space-y-4 animate-in slide-in-from-bottom-2">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-navy uppercase">EFN Detected</p>
                            <h4 className="text-2xl font-mono font-black text-navy dark:text-white uppercase tracking-widest">{engineTagResult.familyName}</h4>
                            <p className="text-xs text-gray-500">Model Year: {engineTagResult.modelYear}</p>
                        </div>
                        <div className="space-y-2">
                             <a href={`sms:6173596953?body=I scanned EFN ${engineTagResult.familyName} and need a test.`} className="block w-full btn-heavy py-3 rounded-xl text-xs !bg-navy !text-white !border-navy">TEXT DISPATCH</a>
                             <a href="tel:6173596953" className="block w-full btn-heavy py-3 rounded-xl text-xs">CALL DISPATCH</a>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'analyze' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-navy/5 dark:bg-gray-700 rounded-lg p-1 border-2 border-navy/20">
                    {(Object.keys(CHECKLISTS) as Array<keyof typeof CHECKLISTS>).map((key) => (
                        <button
                            key={key}
                            onClick={() => setSubTab(key)}
                            className={`flex-1 py-2 text-xs font-black uppercase rounded-md transition-all ${subTab === key ? 'bg-navy text-white shadow-lg' : 'text-gray-400 hover:text-navy'}`}
                        >
                            {CHECKLISTS[key].label}
                        </button>
                    ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border-4 border-navy">
                    <h4 className="text-xs font-black text-navy dark:text-blue-300 uppercase mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Pre-Test Checklist
                    </h4>
                    <ul className="space-y-2">
                        {CHECKLISTS[subTab].items.map((item, idx) => (
                            <li key={idx} className="text-xs text-navy dark:text-gray-300 flex items-start gap-2 font-bold">
                                <span className="text-teslaRed font-black">•</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <button 
                      onClick={() => analysisInputRef.current?.click()}
                      className="w-full btn-heavy py-4 rounded-xl flex items-center justify-center gap-2 text-xs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                        UPLOAD PHOTO FOR REVIEW
                        <input type="file" ref={analysisInputRef} accept="image/*,video/*" capture="environment" className="hidden" onChange={handleAnalyze} />
                    </button>
                    <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest">Logs reviewed by certified testers.</p>
                </div>
            </div>
        )}

        {activeTab === 'generate' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-xs font-black uppercase tracking-widest">Fleet Decal Generator Coming Soon</p>
            </div>
        )}

        {loading && <div className="mt-4 p-4 bg-navy/5 text-teslaRed text-center rounded-xl animate-pulse font-black uppercase text-xs">AI Analyzing...</div>}
        {result && <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-700 text-navy dark:text-white rounded-xl border-2 border-navy whitespace-pre-wrap text-[11px] font-bold uppercase leading-relaxed">{result}</div>}
      </div>
    </div>
  );
};

export default MediaTools;