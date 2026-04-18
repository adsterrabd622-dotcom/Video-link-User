import { useState, useEffect, useRef } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { Video, videos as defaultVideos } from './data/videos';
import { Search, Bell, PlayCircle, X, User } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { showAdsgramAd } from './lib/adsgram';

// Add your Adsgram block ID here for the APP OPEN ad
const APP_OPEN_ADS_BLOCK_ID = "int-28063";

const getTgUser = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user || { first_name: "User", username: "user", photo_url: "" };
};

const checkStartParam = () => {
  const tg = (window as any).Telegram?.WebApp;
  let param = tg?.initDataUnsafe?.start_param;
  
  if (!param) {
    const urlParams = new URLSearchParams(window.location.search);
    param = urlParams.get('tgWebAppStartParam');
  }
  return param;
};

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [appOpenAdWatched, setAppOpenAdWatched] = useState(false);
  const [showingAppOpenAd, setShowingAppOpenAd] = useState(false);
  
  const hasProcessedDeepLink = useRef(false);
  const tgUser = getTgUser();

  const handleDeepLink = (vids: Video[]) => {
    if (!hasProcessedDeepLink.current && vids.length > 0) {
      const param = checkStartParam();
      if (param && param.startsWith('vid_')) {
        const videoId = param.replace('vid_', '');
        const foundVideo = vids.find(v => v.id === videoId);
        if (foundVideo) {
          setSelectedVideo(foundVideo);
          hasProcessedDeepLink.current = true;
        }
      }
    }
  };

  useEffect(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }
    
    const playOpenAd = async () => {
      // Show an ad on first load
      setShowingAppOpenAd(true);
      await showAdsgramAd(APP_OPEN_ADS_BLOCK_ID);
      setAppOpenAdWatched(true);
      setShowingAppOpenAd(false);
    };

    // Trigger App Open Ad
    playOpenAd();

    try {
      // Query videos but we will reverse them client side since firestore doesn't guarantee creation order without a timestamp field
      const unsub = onSnapshot(collection(db, 'videos'), (snap) => {
        const vids: Video[] = [];
        snap.forEach(doc => {
          vids.push({ id: doc.id, ...doc.data() } as Video);
        });
        vids.reverse();
        
        const finalVideos = vids.length > 0 ? vids : [...defaultVideos].reverse();
        setVideos(finalVideos);
        setLoading(false);
        handleDeepLink(finalVideos);
      }, (error) => {
        console.error("Firestore error, falling back to local data:", error);
        const fallback = [...defaultVideos].reverse();
        setVideos(fallback);
        setLoading(false);
        handleDeepLink(fallback);
      });
      
      return () => unsub();
    } catch (err) {
      console.error("Firestore initialization error:", err);
      const fallback = [...defaultVideos].reverse();
      setVideos(fallback);
      setLoading(false);
      handleDeepLink(fallback);
    }
  }, []);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If we are currently showing the app open ad, we can render a loading/ad screen
  if (showingAppOpenAd && !selectedVideo) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-100 font-sans p-6 text-center">
        <PlayCircle className="w-16 h-16 text-indigo-500 animate-pulse mb-6" />
        <h1 className="text-2xl font-bold mb-2">Loading Premium App...</h1>
        <p className="text-slate-400">Please wait while we prepare an advertisement for you.</p>
      </div>
    );
  }

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
          {/* Search Box */}
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
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg cursor-pointer flex items-center justify-center overflow-hidden transition-transform active:scale-95 hover:shadow-indigo-500/50 hover:shadow-lg"
            >
              {tgUser.photo_url ? (
                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            
            {showProfilePopup && (
              <>
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

      {/* Main Home Content */}
      <main className="pt-28 px-4 md:px-10 max-w-7xl mx-auto flex-1">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-in fade-in slide-in-from-bottom-4 mb-3">
            Discover Premium Content
          </h1>
          <p className="text-slate-400 md:text-lg animate-in fade-in slide-in-from-bottom-5">
            Watch exclusive viral videos by unlocking sponsored content seamlessly.
          </p>
        </header>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Trending Now"}
          </h2>
        </div>

        {loading ? (
            <div className="text-center py-20 text-indigo-400 font-medium animate-pulse">Loading premium content...</div>
        ) : filteredVideos.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
            ))}
          </section>
        ) : (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No videos found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
