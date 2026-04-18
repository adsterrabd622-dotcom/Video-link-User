import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check } from 'lucide-react';

// --- এই দুটি নাম আপনার নিজের বটের সাথে মিলিয়ে পরিবর্তন করুন ---
const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; // আপনার বটের ইউজারনেম (বটফাদারে পাবেন)
const APP_SHORT_NAME = "myapp";                // আপনার মিনি অ্যাপের শর্ট নাম (জিপ ফাইল বানানোর সময় যা দিয়েছিলেন)
// -------------------------------------------------------

const ADS_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; 

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
    const result = await showAdsgramAd(ADS_BLOCK_ID);
    if (result) {
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
    // এটি সঠিক টেলিগ্রাম মিনি অ্যাপ লিংক তৈরি করবে
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    
    // কপি করার চেষ্টা করছি
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tgDeepLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error("Copy failed", err);
        alert("Link could not be copied. Please try manually.");
      });
    } else {
      // বিকল্প পদ্ধতি যদি ক্লিপবোর্ড কাজ না করে
      const textArea = document.createElement("textarea");
      textArea.value = tgDeepLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        alert("Use this link: " + tgDeepLink);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans overflow-y-auto">
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none" 
        style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover' }} 
      />
      
      <nav className="relative z-10 p-4 flex justify-between items-center backdrop-blur-md bg-black/20">
        <button onClick={onBack} className="text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
          <X className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-full shadow-lg active:scale-95 transition"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {isCopied ? "COPIED!" : "SHARE"}
            </button>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-full border border-emerald-400/20">
                 <ShieldCheck className="w-4 h-4" /> SECURE
            </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
               <Lock className="w-12 h-12 text-white mb-2" />
               <p className="text-white text-[10px] font-bold tracking-widest uppercase">Content Locked</p>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-white font-bold text-lg mb-4 line-clamp-1">{video.title}</h2>
            
            <div className="mb-6">
                <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                    <span>PROGRESS ({adsWatched}/{TOTAL_ADS})</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
            </div>

            {loadingStatus === 'Loading Ad...' ? (
               <button disabled className="w-full bg-indigo-600/50 text-white font-bold py-4 rounded-xl">Loading Ad...</button>
            ) : cooldown > 0 ? (
               <button disabled className="w-full bg-slate-800 text-slate-400 font-bold py-4 rounded-xl">Wait {cooldown}s</button>
            ) : loadingStatus === 'Redirecting...' ? (
               <button disabled className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl animate-pulse">Redirecting...</button>
            ) : (
                <button 
                  onClick={handleUnlockClick}
                  className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 transition-transform active:scale-95"
                >
                    <PlayCircle className="fill-current w-5 h-5 inline mr-2"/>
                    {adsWatched === 0 ? "Watch Ad to Unlock" : "Watch Next Ad"}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
