import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check } from 'lucide-react';

const ADS_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; 

// --- TELEGRAM CONFIGURATION ---
const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; // আপনার বটের ইউজারনেম দিন (উদা: MyVideoBot)
const APP_SHORT_NAME = "myapp";         // আপনার মিনি অ্যাপের শর্ট নাম দিন (উদা: watch)
// ------------------------------

export default function VideoPlayer({ video, onBack }: { video: Video, onBack: () => void }) {
  const [adsWatched, setAdsWatched] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const TOTAL_ADS = 5;
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
      // Automatically redirect the user to the target URL natively
      window.location.href = video.videoUrl;
    } else {
      setLoadingStatus('Waiting...');
      setCooldown(5); // 5 seconds wait mandated before next click
    }
  };

  const handleShare = () => {
    // Generate the Telegram Mini App deep link
    // Ensure backticks (`) are used here
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    
    navigator.clipboard.writeText(tgDeepLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans animate-in fade-in duration-500 overflow-y-auto">
      {/* Blurred background image for ambiance */}
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none transition-opacity duration-1000"
        style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      <nav className="relative z-10 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-2 md:px-4 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md">
          <X className="w-5 h-5" /> <span className="hidden sm:block">Back</span>
        </button>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 md:px-4 py-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:block">{isCopied ? "COPIED!" : "SHARE LINK"}</span>
            <span className="sm:hidden">{isCopied ? "COPIED" : "SHARE"}</span>
          </button>
          
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 md:px-3 py-2 rounded-full border border-emerald-400/20 backdrop-blur-md">
             <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:block">LINK PROTECTED</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-center transform transition-all duration-500 relative">
          
          {/* Video Thumbnail in the Card */}
          <div className="relative aspect-video w-full border-b border-white/10">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
               <Lock className="w-12 h-12 text-white drop-shadow-lg mb-2" />
               <div className="text-white font-bold tracking-[0.2em] uppercase text-xs px-2 text-center drop-shadow-md">Target URL Locked</div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 pt-6">
            <h2 className="text-white font-bold text-xl tracking-tight mb-2 line-clamp-2 leading-tight">{video.title}</h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                Unlock required. Please watch {TOTAL_ADS} short sponsored messages to reveal the target link.
            </p>
            
            {/* Progress Display */}
            <div className="mb-6">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2 px-1">
                    <span>Progress ({adsWatched}/{TOTAL_ADS})</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Dynamic Buttons based on state */}
            {loadingStatus === 'Loading Ad...' ? (
               <button disabled className="w-full bg-indigo-600/50 text-white/50 font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  Loading Ad...
               </button>
            ) : cooldown > 0 ? (
               <button disabled className="w-full bg-slate-800 border border-slate-700 text-slate-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  Please wait {cooldown}s...
               </button>
            ) : loadingStatus === 'Redirecting...' ? (
               <button disabled className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                  <ExternalLink className="w-5 h-5" /> Redirecting...
               </button>
            ) : (
                <button 
                  onClick={handleUnlockClick}
                  className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-white/20 active:scale-95"
                >
                    <PlayCircle className="fill-current w-5 h-5"/> 
                    {adsWatched === 0 ? "Watch Ad to Start" : `Watch Ad ${adsWatched + 1}`}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
