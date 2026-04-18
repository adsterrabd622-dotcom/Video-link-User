import { useState, useEffect } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { Video } from './data/videos'; // We just need the type now
import { Search, Bell, PlayCircle, X, User } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

// Helper to get Telegram User if running inside Telegram Web App
const getTgUser = () => {
  const tg = (window as any).Telegram?.WebApp;
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return {
    first_name: "Telegram",
    last_name: "User",
    username: "user_123",
    photo_url: ""
  };
};

// Helper for Telegram Deep Linking (start_param)
const getStartParam = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.start_param || null;
};

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  
  const tgUser = getTgUser();

  // Load videos from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'videos'), (snap) => {
      const vids: Video[] = [];
      snap.forEach(doc => {
        vids.push({ id: doc.id, ...doc.data() } as Video);
      });
      setVideos(vids);
      setLoading(false);
      
      // Check for deep link parameter after videos are loaded
      const param = getStartParam();
      if (param && param.startsWith('vid_')) {
        const vId = param.replace('vid_', '');
        const linkedVideo = vids.find(v => v.id === vId);
        if (linkedVideo) {
          setSelectedVideo(linkedVideo);
        }
      }
    });
    
    return () => unsub();
  }, []);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedVideo) {
    return <VideoPlayer video={selectedVideo} onBack={() => setSelectedVideo(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* Glass Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-slate-900/50 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 uppercase relative z-10">
          <PlayCircle className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
          <span className="text-lg md:text-2xl font-black tracking-tighter text-white whitespace-nowrap">VIRAL <span className="text-indigo-500">VIDEO</span></span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4 text-slate-400">
          {/* Search */}
          {isSearchOpen ? (
            <div className="flex items-center gap-1 md:gap-2 bg-slate-800/80 rounded-full px-2 py-1.5 md:px-3 border border-white/10 animate-in fade-in slide-in-from-right-4">
              <Search className="w-4 h-4 text-slate-300 shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-20 sm:w-32 md:w-48 placeholder:text-slate-500"
                autoFocus
              />
              <X className="w-4 h-4 shrink-0 cursor-pointer hover:text-white" onClick={() => {setIsSearchOpen(false); setSearchQuery("");}} />
            </div>
          ) : (
            <Search className="w-5 h-5 hover:text-white cursor-pointer transition" onClick={() => setIsSearchOpen(true)} />
          )}
          
          <Bell className="w-5 h-5 hover:text-white cursor-pointer transition hidden sm:block" />
          
          {/* Profile Icon & Popup */}
          <div className="relative shrink-0">
            <div 
              onClick={() => setShowProfilePopup(!showProfilePopup)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {tgUser.photo_url ? (
                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            
            {/* Profile Popup Menu */}
            {showProfilePopup && (
              <>
                {/* Invisible backdrop to close popup when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={() => setShowProfilePopup(false)}></div>
                <div className="absolute right-0 top-12 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center shrink-0">
                        {tgUser.photo_url ? (
                          <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                     </div>
                     <div className="overflow-hidden">
                       <h3 className="text-white font-bold truncate">{tgUser.first_name} {tgUser.last_name || ''}</h3>
                       <p className="text-slate-400 text-sm truncate">@{tgUser.username || 'username'}</p>
                     </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 text-center border border-white/5">
                     Authenticated via Telegram Mini App
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 px-4 md:px-10 max-w-7xl mx-auto flex-1">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-fade-in mb-3">
            Discover Premium Content
          </h1>
          <p className="text-slate-400 md:text-lg animate-fade-in">Watch exclusive viral videos by unlocking sponsored content seamlessly.</p>
        </header>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Trending Now"}
          </h2>
        </div>

        {loading ? (
            <div className="text-center py-20 text-indigo-400 font-medium">Loading premium content...</div>
        ) : filteredVideos.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
            ))}
          </section>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No videos found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
