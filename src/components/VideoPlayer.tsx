import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, Share2, Check, ExternalLink } from 'lucide-react';

const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; // আপনার বটের ইউজারনেম
const APP_SHORT_NAME = "h4xor";                // আপনার মিনি অ্যাপের শর্ট নাম
const ADS_BLOCK_ID = "int-28063"; 

export default function VideoPlayer({ video, onBack }: { video: Video, onBack: () => void }) {
  const [adsWatched, setAdsWatched] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const TOTAL_ADS = 5; // ৫ বার অ্যাড দেখতে হবে
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
    const result = await showAdsgramAd(ADS_BLOCK_ID);
    
    if (result) {
        const newWatched = adsWatched + 1;
        setAdsWatched(newWatched);

        if (newWatched >= TOTAL_ADS) {
          setLoadingStatus('Redirecting...');
          window.location.href = video.videoUrl; // ৫ বার দেখা হলে আসল লিংকে নিয়ে যাবে
        } else {
          setLoadingStatus('Waiting...');
          setCooldown(5); // প্রতিটি অ্যাডের পর ৫ সেকেন্ড কুলডাউন
        }
    } else {
        setLoadingStatus(null);
    }
  };

  const handleShare = () => {
    // এই লিংকটি ক্লিক করলে সরাসরি এই ভিডিওটাই ওপেন হবে (উপরে App.tsx আমরা সেভাবেই সেট করেছি)
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tgDeepLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => fallbackCopy(tgDeepLink));
    } else {
      fallbackCopy(tgDeepLink);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert("Please copy this link manually: " + text);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans overflow-y-auto w-full h-full">
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      <nav className="relative z-10 p-4 shrink-0 flex justify-between items-center bg-transparent">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 p-2 rounded-full bg-white/5 backdrop-blur-md">
          <X className="w-6 h-6" /> 
        </button>
        
        <div className="flex gap-2">
          <button onClick={handleShare} className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-full shadow-lg">
            {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {isCopied ? "COPIED" : "SHARE LINK"}
          </button>
          
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-full border border-emerald-400/20">
             <ShieldCheck className="w-4 h-4" /> PROTECTED
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full h-full min-h-max mt-10">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative mb-10">
          
          <div className="relative w-full aspect-video border-b border-white/10">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
               <Lock className="w-12 h-12 text-white mb-2 drop-shadow-md" />
               <div className="text-white font-bold tracking-widest uppercase text-xs">Content Locked</div>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-white font-bold text-lg mb-2 line-clamp-2">{video.title}</h2>
            <p className="text-slate-400 text-sm mb-6">Watch {TOTAL_ADS} ads to unlock the full video.</p>
            
            <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Progress ({adsWatched}/{TOTAL_ADS})</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
            </div>

            {loadingStatus === 'Loading Ad...' ? (
               <button disabled className="w-full bg-indigo-600/50 text-white font-bold py-4 rounded-xl">Loading Ad...</button>
            ) : cooldown > 0 ? (
               <button disabled className="w-full bg-slate-800 border border-slate-700 text-slate-400 font-bold py-4 rounded-xl">Please wait {cooldown}s...</button>
            ) : loadingStatus === 'Redirecting...' ? (
               <button disabled className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 animate-pulse">
                  <ExternalLink className="w-5 h-5"/> Opening Video...
               </button>
            ) : (
                <button onClick={handleUnlockClick} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    <PlayCircle className="w-5 h-5"/> {adsWatched === 0 ? "Watch Ad to Start" : "Watch Next Ad"}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
