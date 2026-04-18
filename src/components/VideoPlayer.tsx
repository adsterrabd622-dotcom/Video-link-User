import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check } from 'lucide-react';

// --- আপনার তথ্য এখানে বসান ---
const ADS_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; // অ্যাডগ্রাম ব্লক আইডি
const BOT_USERNAME = "YOUR_BOT_USERNAME";      // টেলিগ্রাম বটের নাম (উদা: MyVideoBot)
const APP_SHORT_NAME = "APP_NAME";              // অ্যাপের শর্ট নাম (উদা: play)
// ------------------------------

export default function VideoPlayer({ video, onBack }: { video: Video, onBack: () => void }) {
  const [adsWatched, setAdsWatched] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const TOTAL_ADS = 5; // কয়টি অ্যাড দেখাতে চান তা এখানে পরিবর্তন করতে পারেন
  const progressPercentage = (adsWatched / TOTAL_ADS) * 100;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && loadingStatus === 'Waiting...') {
      setLoadingStatus(null);
    }
    return () => clearInterval(timer);
  }, [cooldown, loadingStatus]);

  const handleUnlockClick = async () => {
    if (cooldown > 0 || loadingStatus) return;

    setLoadingStatus('Loading Ad...');
    await showAdsgramAd(ADS_BLOCK_ID);
    
    const newWatched = adsWatched + 1;
    setAdsWatched(newWatched);

    if (newWatched >= TOTAL_ADS) {
      setLoadingStatus('Redirecting...');
      window.location.href = video.videoUrl;
    } else {
      setLoadingStatus('Waiting...');
      setCooldown(5); 
    }
  };

  const handleShare = () => {
    const tgDeepLink = https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id};
    
    navigator.clipboard.writeText(tgDeepLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans animate-in fade-in duration-500 overflow-y-auto">
      {/* ব্যাকগ্রাউন্ড ডিজাইন */}
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none transition-opacity duration-1000"
        style={{ backgroundImage: url(${video.thumbnail}), backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      {/* নেভিগেশন বার */}
      <nav className="relative z-10 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-2 md:px-4 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md">
          <X className="w-5 h-5" /> Back
        </button>
        
        <button onClick={handleShare} className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-full transition-colors shadow-lg">
          {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {isCopied ? "COPIED" : "SHARE VIDEO"}
        </button>
      </nav>

      {/* ভিডিও কার্ড */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-center relative">
          <div className="relative aspect-video w-full">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
<Lock className="w-12 h-12 text-white mb-2" />
               <div className="text-white font-bold uppercase text-xs">Unlock Required</div>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-white font-bold text-xl mb-2 line-clamp-2">{video.title}</h2>
            <p className="text-slate-400 mb-6 text-sm">
                To watch this video, please complete {TOTAL_ADS} ad views.
            </p>
            
            {/* প্রগ্রেস বার */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Ads Watched: {adsWatched}/{TOTAL_ADS}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: ${progressPercentage}% }} />
                </div>
            </div>

            {/* বাটন */}
            {loadingStatus === 'Loading Ad...' ? (
               <button disabled className="w-full bg-indigo-600/50 text-white font-bold py-4 rounded-xl">Loading Ad...</button>
            ) : cooldown > 0 ? (
               <button disabled className="w-full bg-slate-800 text-slate-400 font-bold py-4 rounded-xl">Wait {cooldown}s</button>
            ) : (
                <button onClick={handleUnlockClick} className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all">
                    <PlayCircle className="inline-block mr-2 w-5 h-5"/> Watch Ad to Unlock
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
