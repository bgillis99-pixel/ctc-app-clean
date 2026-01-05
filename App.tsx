import React, { useState, useEffect, Suspense } from 'react';
import VinChecker from './components/VinChecker';
import ComplianceGuide from './components/ComplianceGuide';
import { AppView, User, HistoryItem } from './types';
import { initGA, trackPageView } from './services/analytics';
import { auth, getHistoryFromCloud, onAuthStateChanged } from './services/firebase'; 

const ChatAssistant = React.lazy(() => import('./components/ChatAssistant'));
const MediaTools = React.lazy(() => import('./components/MediaTools'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));
const GarageView = React.lazy(() => import('./components/GarageView'));
const AdminView = React.lazy(() => import('./components/AdminView'));

// Professional icons for CARB compliance app
const ICON_TOOLS = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ICON_CHAT = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ICON_FLEET = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const ICON_ADMIN = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ICON_SEARCH = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const ICON_SHARE = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
  </svg>
);

const ICON_DOWNLOAD = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME); 
  const [user, setUser] = useState<User | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const shareUrl = window.location.origin;

  useEffect(() => {
    initGA();
    if (auth) {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const cloudHistory = await getHistoryFromCloud(firebaseUser.uid);
                setUser({ 
                    email: firebaseUser.email || 'User', 
                    history: cloudHistory as HistoryItem[] 
                });
            } else {
                setUser(null);
            }
        });
    }
  }, []);

  useEffect(() => {
      trackPageView(currentView);
  }, [currentView]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: 'Clean Truck Check Compliant 12/26/25',
          text: 'The definitive proactive tool for CA HD I/M compliance. Scans VINs instantly.',
          url: shareUrl
        };

        // Try to fetch the logo and share it as a file for a better preview
        try {
          const response = await fetch('/logo.svg');
          const blob = await response.blob();
          const file = new File([blob], 'logo.svg', { type: 'image/svg+xml' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (e) {
          console.log('File share prep failed, falling back to basic share');
        }

        await navigator.share(shareData);
      } catch (err) { 
        console.log('Share failed:', err); 
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleAddToHistory = (value: string, type: 'VIN' | 'ENTITY' | 'TRUCRS') => {
    if (!user) return;
    const newItem: HistoryItem = { id: Date.now().toString(), value, type, timestamp: Date.now() };
    setUser({ ...user, history: [newItem, ...user.history] });
  };

  const triggerTesterSearch = () => {
    if (currentView !== AppView.HOME) {
        setCurrentView(AppView.HOME);
        setTimeout(() => document.getElementById('find-tester-trigger')?.click(), 100);
    } else {
        document.getElementById('find-tester-trigger')?.click();
    }
  };

  const navItems = [
    { id: AppView.ANALYZE, label: 'TOOLS', icon: ICON_TOOLS },
    { id: AppView.ADMIN, label: 'ADMIN', icon: ICON_ADMIN },
    { id: AppView.ASSISTANT, label: 'CHAT', icon: ICON_CHAT },
    { id: AppView.GARAGE, label: 'FLEET', icon: ICON_FLEET },
  ];

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col bg-carb-navy text-white font-sans transition-colors duration-500">
        
        {/* COMPACT TOP NAVIGATION HEADER */}
        <header className="pt-safe px-4 py-3 fixed top-0 left-0 right-0 glass-dark z-[100] flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <div className="flex flex-col" onClick={() => setCurrentView(AppView.HOME)} role="button">
                    <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">CTC COMPLIANT</h1>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.25em] -mt-1">V12.26.25</p>
                </div>
                <div className="flex gap-1.5">
                    <button 
                      onClick={triggerTesterSearch}
                      className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest active-haptic"
                    >
                      Find Tester
                    </button>
                    <button onClick={handleShare} className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-xs active-haptic">
                      {ICON_SHARE}
                    </button>
                </div>
            </div>

            {/* QUICK HEADER NAV */}
            <div className="flex justify-between px-2">
                {navItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === item.id ? 'text-carb-accent' : 'text-gray-500'}`}
                  >
                    <div className="scale-75">{item.icon}</div>
                    <span className="text-[8px] font-black tracking-widest">{item.label}</span>
                  </button>
                ))}
            </div>
        </header>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto pt-32 pb-12 scroll-smooth">
            <div className="px-6">
                <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-carb-accent border-t-transparent rounded-full animate-spin"></div></div>}>
                    {currentView === AppView.HOME && (
                        <>
                          <VinChecker 
                              onAddToHistory={handleAddToHistory} 
                              onNavigateChat={() => setCurrentView(AppView.ASSISTANT)}
                              onShareApp={() => setShowInstall(true)}
                              onNavigateTools={() => setCurrentView(AppView.ANALYZE)}
                          />
                          <ComplianceGuide />
                        </>
                    )}
                    {currentView === AppView.ASSISTANT && <ChatAssistant />}
                    {currentView === AppView.GARAGE && <GarageView user={user} onNavigateLogin={() => setCurrentView(AppView.PROFILE)} />}
                    {currentView === AppView.ANALYZE && <MediaTools />}
                    {currentView === AppView.PROFILE && (
                        <ProfileView 
                            user={user} 
                            onLogin={() => {}} 
                            onRegister={() => {}} 
                            onLogout={() => setUser(null)}
                            onAdminAccess={() => setCurrentView(AppView.ADMIN)}
                            isOnline={true}
                            isDarkMode={true}
                            toggleTheme={() => {}}
                        />
                    )}
                    {currentView === AppView.ADMIN && <AdminView />}
                </Suspense>

                {currentView === AppView.HOME && (
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <button onClick={triggerTesterSearch} className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 active-haptic group">
                           <div className="text-carb-accent">{ICON_SEARCH}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">Find Tester</span>
                        </button>
                        <button onClick={() => setCurrentView(AppView.ASSISTANT)} className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 active-haptic group">
                           <div className="text-carb-accent">{ICON_CHAT}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Intel</span>
                        </button>
                        <button onClick={() => setShowInstall(true)} className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 active-haptic group">
                           <div className="text-carb-accent">{ICON_DOWNLOAD}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">Download</span>
                        </button>
                        <button onClick={handleShare} className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 active-haptic group">
                           <div className="text-carb-accent">{ICON_SHARE}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">Share App</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-10 text-center opacity-10 pb-4">
                <p className="text-[8px] font-black tracking-[0.5em] uppercase italic">CALIFORNIA HD I/M PROTOCOL V12.26.25</p>
            </div>
        </main>

        {/* MODALS */}
        {showInstall && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowInstall(false)}>
                <div className="glass-dark p-10 rounded-[3rem] max-w-sm w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                    <div className="text-center space-y-8">
                        <div className="text-carb-accent flex justify-center">
                          <div className="scale-150">{ICON_DOWNLOAD}</div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">Install App</h2>
                        <p className="text-xs text-gray-400 font-medium px-4 leading-relaxed italic">Add to Home Screen for local diagnostics and offline compliance access.</p>
                        <button onClick={() => setShowInstall(false)} className="w-full py-5 bg-white text-carb-navy rounded-3xl font-black uppercase tracking-widest text-xs active-haptic transition-all">
                            INITIALIZE
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showPrivacy && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowPrivacy(false)}>
                <div className="glass-dark p-10 rounded-[3rem] max-w-sm w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                    <div className="text-center space-y-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">Agency Disclosure</h2>
                        <p className="text-xs text-gray-500 leading-relaxed text-left font-medium">
                            NorCal CARB Mobile LLC is a specialized third-party agency. This tool is a technical interface for public records and regulatory compliance management. We are not a government entity.
                        </p>
                        <button onClick={() => setShowPrivacy(false)} className="w-full py-4 glass text-white rounded-2xl font-bold uppercase tracking-widest text-xs active-haptic">DISMISS</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;