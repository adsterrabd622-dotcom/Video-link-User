import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check } from 'lucide-react';

const ADS_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; 

// --- TELEGRAM CONFIGURATION ---
const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; 
const APP_SHORT_NAME = "myapp";         
// ------------------------------

export default function VideoPlayer({ video, onBack }: { video: Video, onBack: () => void }) {
  const [adsWatched, setAdsWatched] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const TOTAL_ADS = 5;
  const progressPercentage = (adsWatched / TOTAL_ADS) * 100;

  useEffect(() => {
    let timer: any;
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
    const success = await showAdsgramAd(ADS_BLOCK_ID);
    
    if (success) {
      const newWatched = adsWatched + 1;
      setAdsWatched(newWatched);

      if (newWatched >= TOTAL_ADS) {
        setLoadingStatus('Redirecting...');
        window.location.href = video.videoUrl;
      } else {
        setLoadingStatus('Waiting...');
        setCooldown(5); 
      }
    } else {
      setLoadingStatus(null);
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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans overflow-y-auto">
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none"
        style={{ backgroundImage: url(${video.thumbnail}), backgroundSize: 'cover' }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      <nav className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" /> Back
        </button>
        
        <button onClick={handleShare} className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-full">
          {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {isCopied ? "COPIED!" : "SHARE LINK"}
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-center p-6">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-6">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center capitalize font-bold text-xs tracking-widest">
               <Lock className="w-10 h-10 mb-2" /> Target Locked
            </div>
          </div>
          
          <h2 className="text-white font-bold text-xl mb-4">{video.title}</h2>
          {/* Progress Section */}
          <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-300 mb-2">
                  <span>Watched: {adsWatched}/{TOTAL_ADS}</span>
                  <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: ${progressPercentage}% }} />
              </div>
          </div>

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
  );
}
