import { useState, useEffect, useRef } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { Video } from './data/videos';
import { Search, Bell, PlayCircle, X, User } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

const getTgUser = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user || { first_name: "User", username: "user", photo_url: "" };
};

// --- উন্নত ডিপ লিংক ফাংশন ---
const checkStartParam = () => {
  const tg = (window as any).Telegram?.WebApp;
  
  // ১. সরাসরি টেলিগ্রাম এসডিকে থেকে প্যারামিটার দেখা
  let param = tg?.initDataUnsafe?.start_param;
  
  // ২. ব্যাকআপ: যদি URL এর ভেতর থাকে (কখনও কখনও ব্রাউজারে এটি সরাসরি আসে)
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
  
  const hasProcessedDeepLink = useRef(false);

  const tgUser = getTgUser();

  useEffect(() => {
    // টেলিগ্রামকে জানানো যে অ্যাপ রেডি
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand(); // অ্যাপটি ফুল স্ক্রিন করা
    }

    const unsub = onSnapshot(collection(db, 'videos'), (snap) => {
      const vids: Video[] = [];
      snap.forEach(doc => {
        vids.push({ id: doc.id, ...doc.data() } as Video);
      });
      setVideos(vids);
      setLoading(false);
      
      // ভিডিও লিস্ট আসার পর ডিপ লিংক চেক করা
      if (!hasProcessedDeepLink.current && vids.length > 0) {
        const param = checkStartParam();
        console.log("Start Parameter Found:", param);

        if (param && param.startsWith('vid_')) {
          const videoId = param.replace('vid_', '');
          const foundVideo = vids.find(v => v.id === videoId);
          if (foundVideo) {
            setSelectedVideo(foundVideo);
            hasProcessedDeepLink.current = true;
          }
        }
      }
    });
    
    return () => unsub();
  }, []);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // যদি শেয়ার ডিরেক্ট লিংকের মাধ্যমে ভিডিও সিলেক্ট হয়
  if (selectedVideo) {
    return (
      <VideoPlayer 
        video={selectedVideo} 
        onBack={() => {
          setSelectedVideo(null);
          // ব্যাক বাটনে প্রেস করলে স্টার্ট প্যারামিটার ক্লিন করা (ঐচ্ছিক)
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-20 md:pb-0">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-8 h-8 text-indigo-500" />
          <span className="text-xl font-black tracking-tighter text-white">VIRAL <span className="text-indigo-500">VIDEO</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          {isSearchOpen ? (
            <div className="flex items-center bg-slate-800 rounded-full px-3 py-1.5 border border-white/10">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-32 md:w-48"
                autoFocus
              />
              <X className="w-4 h-4 cursor-pointer" onClick={() => {setIsSearchOpen(false); setSearchQuery("");}} />
            </div>
          ) : (
            <Search className="w-5 h-5 cursor-pointer hover:text-white" onClick={() => setIsSearchOpen(true)} />
          )}
          
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowProfilePopup(!showProfilePopup)}>
              {tgUser.photo_url ? <img src={tgUser.photo_url} alt="P" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white" />}
          </div>
        </div>
      </nav>

      <main className="pt-28 px-4 max-w-7xl mx-auto flex-1">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Exclusive Content</h1>
          <p className="text-slate-400">Select a video to unlock premium access.</p>
        </header>

        {loading ? (
            <div className="text-center py-20 text-indigo-400 font-medium">Loading premium content...</div>
        ) : filteredVideos.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
            ))}
          </section>
        ) : (
          <div className="text-center py-20 text-slate-500">No videos found.</div>
        )}
      </main>
    </div>
  );
}
