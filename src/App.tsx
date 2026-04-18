import { useState, useEffect, useRef } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { Video } from './data/videos';
import { Search, PlayCircle, X, User } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

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
  
  const hasProcessedDeepLink = useRef(false);
  const tgUser = getTgUser();

  useEffect(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }

    const unsub = onSnapshot(collection(db, 'videos'), (snap) => {
      const vids: Video[] = [];
      snap.forEach(doc => {
        vids.push({ id: doc.id, ...doc.data() } as Video);
      });
      setVideos(vids);
      setLoading(false);
      
      // ডিপ লিংক চেক করা
      if (!hasProcessedDeepLink.current && vids.length > 0) {
        const param = checkStartParam();
        if (param && param.startsWith('vid_')) {
          const videoId = param.replace('vid_', '');
          const foundVideo = vids.find(v => v.id === videoId);
          if (foundVideo) {
            // যদি ভিডিও পাওয়া যায়, সোজা ভিডিও পেজে পাঠিয়ে দেবে
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

  // যদি selectedVideo থাকে, তাহলে শুধুমাত্র VideoPlayer দেখাবে (হোম পেজ নয়)
  if (selectedVideo) {
    return (
      <VideoPlayer 
        video={selectedVideo} 
        onBack={() => {
          setSelectedVideo(null); // ব্যাক করলে আবার হোম পেজে আসবে
        }} 
      />
    );
  }

  // যদি ভিডিও সিলেক্ট করা না থাকে, তাহলে রেগুলার হোম পেজ দেখাবে
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
          
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden">
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
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
