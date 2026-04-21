import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { showMonetagAd } from '../lib/monetag';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check, Heart, Eye } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserData } from '../App';

const ADS_BLOCK_ID = "int-28063";
// Add your Monetag Zone ID here
const MONETAG_ZONE_ID = "YOUR_MONETAG_ZONE_ID"; 

// --- TELEGRAM CONFIGURATION ---
const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; // আপনার বটের ইউজারনেম দিন (উদা: MyVideoBot)
const APP_SHORT_NAME = "myapp";         // আপনার মিনি অ্যাপের শর্ট নাম দিন (উদা: watch)
// ------------------------------

export default function VideoPlayer({ 
  video, 
  onBack,
  userData,
  coinsPerAd
}: { 
  video: Video, 
  onBack: () => void,
  userData?: UserData | null,
  coinsPerAd?: number
}) {
  const [adsWatched, setAdsWatched] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  
  // Fake or db states for views and likes
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(video.likes || Math.floor(Math.random() * 500) + 50);
  const localViews = video.views || Math.floor(Math.random() * 5000) + 1000;

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

  const handleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLocalLikes(prev => prev + 1);
      // Optional: actually update in Firestore here if your schema allows
      // updateDoc(doc(db, 'videos', video.id), { likes: increment(1) });
    }
  };

  const handleUnlockClick = async () => {
    if (cooldown > 0 || loadingStatus) return;

    setLoadingStatus('Loading Ad...');
    
    // 1. Show Adsgram Ad first
    await showAdsgramAd(ADS_BLOCK_ID);
    
    // 2. Right after Adsgram closes, show Monetag Ad
    await showMonetagAd(MONETAG_ZONE_ID);
    
    // 3. User successfully watched both ads for this step
    const newWatched = adsWatched + 1;
    setAdsWatched(newWatched);

    // Give coins
    if (userData && userData.uid && coinsPerAd) {
      try {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, {
          balance: increment(coinsPerAd)
        });
      } catch (e) {
        console.error("Failed to update coin balance", e);
      }
    }

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
    // Generate the Telegram Mini App deep link (Strictly t.me link)
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    
    const tg = (window as any).Telegram?.WebApp;
    
    // If inside Telegram, use native share dialog
    if (tg && tg.openTelegramLink) {
      const shareText = encodeURIComponent(`Watch this viral video! 🎬`);
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(tgDeepLink)}&text=${shareText}`;
      tg.openTelegramLink(shareUrl);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return;
    }

    // Fallback logic for web browsers: We copy the Tg Deep Link
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tgDeepLink)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(() => fallbackCopyTextToClipboard(tgDeepLink));
    } else {
      fallbackCopyTextToClipboard(tgDeepLink);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // Avoid scrolling to bottom
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
      alert(`Please copy this link manually:\n\n${text}`);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 font-sans animate-in fade-in duration-500 overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 opacity-20 blur-[100px] scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      {/* Top Floating Nav */}
      <nav className="absolute top-0 left-0 w-full z-50 p-4 md:px-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5">
             <ShieldCheck className="w-4 h-4 text-emerald-400" />
             <span className="text-[10px] font-bold text-white uppercase tracking-wider">Secured</span>
          </div>
        </div>
        
        <button 
          onClick={handleShare}
          className="pointer-events-auto flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg border border-indigo-400/30 hover:bg-indigo-500 transition-all font-bold text-xs"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {isCopied ? "COPIED!" : "SHARE"}
        </button>
      </nav>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-12 disable-scrollbars">
        
        {/* Dynamic Hero Thumbnail */}
        <div className="relative w-full h-[50vh] min-h-[350px] shrink-0 rounded-b-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b border-white/10">
          <img src={video.thumbnail} alt={video.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-950/90" />
          
          {/* Animated Centered Lock */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
            <div className="relative flex items-center justify-center">
               <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-30 scale-[1.7]"></div>
               <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-full border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                 <Lock className="w-10 h-10 text-indigo-400" />
               </div>
            </div>
            <span className="mt-5 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-bold tracking-[0.2em] uppercase border border-white/10">
              Content Locked
            </span>
          </div>

          {/* Stats Bar (Inside bottom of hero) */}
          <div className="absolute bottom-6 left-0 w-full px-5 md:px-8 flex justify-between items-end">
             <button 
                onClick={handleLike}
                className="group flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl hover:bg-black/60 transition-all"
              >
                  <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${hasLiked ? 'fill-pink-500 text-pink-500' : 'text-slate-200'}`} />
                  <span className="font-black text-white text-sm">{localLikes}</span>
              </button>

              <div className="flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
                  <Eye className="w-6 h-6 text-slate-200" />
                  <span className="font-black text-white text-sm">{localViews}</span>
              </div>
          </div>
        </div>

        {/* Content & Actions Section */}
        <div className="px-5 pt-8 pb-10 max-w-lg mx-auto relative z-20">
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-6 text-center drop-shadow-md">
             {video.title}
          </h1>

          {/* Glowing Status Board */}
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
             {/* Decorative glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-indigo-500 blur-[20px] rounded-full"></div>

             {/* Bangla Instructions */}
             <div className="text-center mb-6 pt-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-3 border border-indigo-500/20">
                   <PlayCircle className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold text-[17px] md:text-xl leading-relaxed">
                   ভিডিওটি আনলক করতে নিচের বাটনে ক্লিক করে <span className="text-indigo-200 font-black bg-indigo-600 px-2 py-0.5 rounded-lg mx-1 shadow-inner">{TOTAL_ADS} টি অ্যাড</span> সম্পূর্ণ দেখুন।
                </h3>
             </div>

             {/* Earnings Highlight Note */}
             <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-center items-center gap-3 mb-8 shadow-inner">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <span className="text-lg">💰</span>
                </div>
                <p className="text-emerald-300 text-xs md:text-sm font-bold uppercase tracking-wider text-center sm:text-left leading-relaxed">
                  নোট: প্রতিটি অ্যাড দেখলে আপনার একাউন্টে ব্যালেন্স যোগ হবে!
                </p>
             </div>
             
             {/* Dynamic Progress */}
             <div className="mb-8">
                 <div className="flex justify-between items-end mb-3 px-1">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unlock Progress</span>
                     <span className="text-base font-black text-indigo-400">{Math.round(progressPercentage)}%</span>
                 </div>
                 <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
                     <div 
                         className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
                         style={{ width: `${progressPercentage}%` }}
                     >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                     </div>
                 </div>
             </div>

             {/* Action Button */}
             <div className="relative mt-2">
               {loadingStatus === 'Loading Ad...' ? (
                  <button disabled className="w-full bg-slate-800 text-slate-400 font-bold py-4.5 rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed border border-white/5">
                     <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                     Loading Advertisement...
                  </button>
               ) : cooldown > 0 ? (
                  <button disabled className="w-full bg-slate-800 border border-slate-700 text-slate-400 font-bold py-4.5 rounded-2xl flex items-center justify-center cursor-not-allowed">
                     Please wait <span className="text-white mx-1">{cooldown}s</span> before next step
                  </button>
               ) : loadingStatus === 'Redirecting...' ? (
                  <button disabled className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold py-4.5 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
                     <ExternalLink className="w-5 h-5" /> Redirecting to target...
                  </button>
               ) : (
                   <button 
                     onClick={handleUnlockClick}
                     className="w-full group relative bg-indigo-600 text-white font-bold text-lg py-4.5 rounded-2xl transition-all active:scale-[0.98] overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] border border-indigo-500/50"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="relative z-10 flex items-center justify-center gap-2">
                          <PlayCircle className="w-6 h-6"/> 
                          {adsWatched === 0 ? "Watch Ad to Start" : `Watch Ad ${adsWatched + 1}`}
                       </div>
                   </button>
               )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
