import { useState, useEffect, useRef } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { Video, videos as defaultVideos } from './data/videos';
import { Search, Bell, PlayCircle, X, User as UserIcon, Home, Briefcase, CreditCard, User as UserTab } from 'lucide-react';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './lib/firebase';
import { showAdsgramAd } from './lib/adsgram';
import WorkTab from './components/WorkTab';
import WithdrawTab from './components/WithdrawTab';
import ProfileTab from './components/ProfileTab';

// Add your Adsgram block ID here for the APP OPEN ad
const APP_OPEN_ADS_BLOCK_ID = "int-28063";

export interface UserData {
  uid: string;
  firstName: string;
  username: string;
  photoUrl: string;
  balance: number;
}

const getTgUser = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user || { id: 12345, first_name: "User", username: "user", photo_url: "" };
};

const checkStartParam = () => {
  const tg = (window as any).Telegram?.WebApp;
  let param = tg?.initDataUnsafe?.start_param;
  
  if (!param) {
    const urlParams = new URLSearchParams(window.location.search);
    param = urlParams.get('tgWebAppStartParam') || urlParams.get('startapp') || urlParams.get('start_param');
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
  
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'withdraw' | 'profile'>('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [coinsPerAd, setCoinsPerAd] = useState<number>(50); // Default to 50, fetch from DB
  
  const hasProcessedDeepLink = useRef(false);
  const tgUser = getTgUser();
  const userId = String(tgUser.id);

  // Sync user and settings from Firestore
  useEffect(() => {
    const syncUser = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        let initialData: UserData;
        if (userSnap.exists()) {
          initialData = { uid: userId, ...userSnap.data() } as UserData;
        } else {
          initialData = {
            uid: userId,
            firstName: tgUser.first_name || '',
            username: tgUser.username || '',
            photoUrl: tgUser.photo_url || '',
            balance: 0,
          };
          await setDoc(userRef, initialData);
        }
        setUserData(initialData);

        // Listen for real-time balance updates
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData(prev => prev ? { ...prev, balance: doc.data()?.balance || 0 } : null);
          }
        });

        // Also fetch app settings for coins
        const settingsRef = doc(db, 'settings', 'app');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data()?.coinsPerAd) {
          setCoinsPerAd(settingsSnap.data().coinsPerAd);
        } else {
          // Initialize if missing
          await setDoc(settingsRef, { coinsPerAd: 50 }, { merge: true });
        }

        return () => unsubUser();
      } catch (err) {
        console.error("Error syncing user:", err);
      }
    };
    syncUser();
  }, [userId, tgUser]);

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
        
        setVideos(vids);
        setLoading(false);
        handleDeepLink(vids);
      }, (error) => {
        console.error("Firestore error:", error);
        setVideos([]);
        setLoading(false);
      });
      
      return () => unsub();
    } catch (err) {
      console.error("Firestore initialization error:", err);
      setVideos([]);
      setLoading(false);
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
    return <VideoPlayer video={selectedVideo} onBack={() => setSelectedVideo(null)} userData={userData} coinsPerAd={coinsPerAd} />;
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
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg cursor-pointer flex items-center justify-center overflow-hidden transition-transform active:scale-95 hover:shadow-indigo-500/50 hover:shadow-lg"
            >
              {tgUser.photo_url ? (
                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
            
            {showProfilePopup && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfilePopup(false)}></div>
                <div className="absolute right-0 top-14 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center shrink-0">
                        {tgUser.photo_url ? (
                          <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-white" />
                        )}
                     </div>
                     <div className="overflow-hidden">
                       <h3 className="text-white font-bold truncate">{userData?.firstName || 'User'}</h3>
                       <p className="text-emerald-400 text-sm font-semibold mt-0.5">Balance: {userData?.balance || 0} 🪙</p>
                     </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 text-center border border-white/5">
                     Authenticated via Telegram
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area based on Tab */}
      {activeTab === 'home' && (
        <main className="pt-28 px-4 md:px-10 max-w-7xl mx-auto flex-1 pb-24">
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
            <div className="text-center py-20 text-slate-500 flex flex-col items-center animate-in fade-in zoom-in-95">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">{searchQuery ? "No videos found matching your search." : "No videos available right now."}</p>
            </div>
          )}
        </main>
      )}

      {activeTab === 'work' && (
        <WorkTab userData={userData} coinsPerAd={coinsPerAd} />
      )}

      {activeTab === 'withdraw' && (
        <WithdrawTab userData={userData} />
      )}

      {activeTab === 'profile' && (
        <ProfileTab userData={userData} tgUser={tgUser} />
      )}

      {/* Bottom Mobile Menu */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-white/10 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'home' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'work' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Briefcase className="w-6 h-6" />
          <span className="text-[10px] font-medium">Work</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <UserTab className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
        <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'withdraw' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <CreditCard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Withdraw</span>
        </button>
      </div>

    </div>
  );
}
