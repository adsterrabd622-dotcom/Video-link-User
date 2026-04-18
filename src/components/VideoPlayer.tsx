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

// --- ডিপ লিংক (start_param) ধরার উন্নত ফাংশন ---
const getStartParam = () => {
  const tg = (window as any).Telegram?.WebApp;
  // টেলিগ্রাম অ্যাপের ভেতর থেকে আসা স্টার্ট প্যারামিটার
  const tgParam = tg?.initDataUnsafe?.start_param;
  if (tgParam) return tgParam;

  // ব্যাকআপ: যদি সরাসরি URL থেকে প্যারামিটার থাকে (tgWebAppStartParam)
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tgWebAppStartParam');
};

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  
  const hasCheckedDeepLink = useRef(false); // নিশ্চিত করবে যেন একবারই চেক হয়

  const tgUser = getTgUser();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'videos'), (snap) => {
      const vids: Video[] = [];
      snap.forEach(doc => {
        vids.push({ id: doc.id, ...doc.data() } as Video);
      });
      setVideos(vids);
      setLoading(false);
      
      // ভিডিওগুলো লোড হওয়ার পর শেয়ার করা লিংকের প্যারামিটার চেক করা
      if (!hasCheckedDeepLink.current && vids.length > 0) {
        const param = getStartParam();
        console.log("Deep Link Param Found:", param); // ডিবাগিং এর জন্য

        if (param && param.startsWith('vid_')) {
          const vId = param.replace('vid_', '');
          const linkedVideo = vids.find(v => v.id === vId);
          if (linkedVideo) {
            setSelectedVideo(linkedVideo);
            hasCheckedDeepLink.current = true; // একবার ওপেন হলে আর হবে না
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

  // যদি কোনো নির্দিষ্ট ভিডিও সিলেক্ট করা থাকে (শেয়ার লিংকের মাধ্যমে বা ক্লিক করে)
  if (selectedVideo) {
    return <VideoPlayer video={selectedVideo} onBack={() => setSelectedVideo(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-20 md:pb-0">
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
            <Search className="w-5 h-5 cursor-pointer" onClick={() => setIsSearchOpen(true)} />
          )}
          
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowProfilePopup(!showProfilePopup)}>
              {tgUser.photo_url ? <img src={tgUser.photo_url} alt="P" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white" />}
          </div>
        </div>
      </nav>

      <main className="pt-28 px-4 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Trending Premium Videos</h1>
          <p className="text-slate-400">Unlock high-quality content by watching ads.</p>
        </header>

        {loading ? (
            <div className="text-center py-20 text-indigo-400">Loading...</div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
