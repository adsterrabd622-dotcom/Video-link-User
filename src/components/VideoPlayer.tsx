import { useState, useEffect, useRef } from 'react';
import { Video } from '../data/videos';
import { showGigaPubAd } from '../lib/gigapub';
import { showAdexiumAd } from '../lib/adexium';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check, Heart, Eye } from 'lucide-react';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserData } from '../App';

const ADS_BLOCK_ID = "int-28063";
// Add your Monetag Zone ID here
const MONETAG_ZONE_ID = "YOUR_MONETAG_ZONE_ID"; 

// --- TELEGRAM CONFIGURATION ---
const BOT_USERNAME = "ViralLinkEarning_Bot"; // আপনার বটের ইউজারনেম দিন (উদা: MyVideoBot)
const APP_SHORT_NAME = "app";         // আপনার মিনি অ্যাপের শর্ট নাম দিন (উদা: watch)
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
  
  // Real DB states for views and likes
  const [hasLiked, setHasLiked] = useState(false);
  const [realLikes, setRealLikes] = useState(video.likes || 0);
  const [realViews, setRealViews] = useState(video.views || 0);
  const [showLikeToast, setShowLikeToast] = useState(false);
  const hasIncrementedView = useRef(false);

  const TOTAL_ADS = 5;
  const progressPercentage = (adsWatched / TOTAL_ADS) * 100;

  // Real-time Database sync for Likes and Views
  useEffect(() => {
    if (!video || !video.id) return;
    
    const videoRef = doc(db, 'videos', video.id);

    // Increment view ONLY ONCE per session when this component opens
    if (!hasIncrementedView.current) {
      updateDoc(videoRef, { views: increment(1) }).catch(console.error);
      hasIncrementedView.current = true;
    }

    // Listen to real-time updates for likes and views
    const unsub = onSnapshot(videoRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if someone else liked it to show notification (if it increased and we haven't clicked recently)
        const currentLikes = data.likes || 0;
        setRealLikes((prev) => {
           if (currentLikes > prev && prev !== 0 && !hasLiked) {
             // Show "Someone loved this!" toast
             setShowLikeToast(true);
             setTimeout(() => setShowLikeToast(false), 3000);
           }
           return currentLikes;
        });

        setRealViews(data.views || 0);
      }
    });

    return () => unsub();
  }, [video.id, hasLiked]);


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
    if (!hasLiked && video?.id) {
      setHasLiked(true);
      
      // Optimitic update UI
      setRealLikes(prev => prev + 1);
      
      // Update in DB
      const videoRef = doc(db, 'videos', video.id);
      updateDoc(videoRef, { likes: increment(1) }).catch(console.error);

      // Show personal toast
      setShowLikeToast(true);
      setTimeout(() => setShowLikeToast(false), 3000);
    }
  };

  const handleUnlockClick = async () => {
    if (cooldown > 0 || loadingStatus) return;

    setLoadingStatus('Loading Ad...');
    
    // 1. Show Giga Pub Ad first
    await showGigaPubAd();
    
    // 2. Show Adexium Ad
    await showAdexiumAd();
    
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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans animate-in fade-in duration-500 overflow-y-auto">
      {/* Blurred background image for ambiance */}
      <div 
        className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none transition-opacity duration-1000"
        style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      {/* Main Header / Logo */}
      <header className="relative z-20 w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 flex items-center shrink-0">
        <div 
          onClick={onBack} 
          className="flex items-center gap-2 text-indigo-400 uppercase cursor-pointer hover:opacity-80 transition-opacity"
        >
          <PlayCircle className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
          <span className="text-lg md:text-2xl font-black tracking-tighter text-white whitespace-nowrap">VIRAL <span className="text-indigo-500">VIDEO</span></span>
        </div>
      </header>

      {/* Secondary Nav for Actions */}
      <nav className="relative z-10 p-4 md:px-6 flex justify-between items-center shrink-0">
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

      <div className="flex-1 flex flex-col items-center justify-start pt-6 p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 relative">
          
          {/* Video Thumbnail Region */}
          <div className="relative aspect-video w-full border-b border-white/10 group">
            <img src={video.thumbnail} alt={video.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
               <Lock className="w-12 h-12 text-white drop-shadow-lg mb-2" />
               <div className="text-white font-bold tracking-[0.2em] uppercase text-xs px-2 text-center drop-shadow-md">Target URL Locked</div>
            </div>
            
            {/* Stats Bar Overlay (Likes / Views) */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                <div className="relative">
                  <button 
                    onClick={handleLike}
                    className={`flex flex-col items-center gap-1 ${hasLiked ? 'text-pink-500' : 'text-white'} hover:scale-110 transition-transform`}
                  >
                      <Heart className={`w-7 h-7 drop-shadow-md ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold text-white drop-shadow-md">{realLikes}</span>
                  </button>
                  {/* Heart Toast overlay */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none transition-all duration-500 flex items-center justify-center ${showLikeToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-50'}`}>
                    <div className="bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current" /> Loved!
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-white">
                    <Eye className="w-7 h-7 drop-shadow-md" />
                    <span className="text-xs font-bold drop-shadow-md">{realViews}</span>
                </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 pt-6">
            <h2 className="text-white font-bold text-xl tracking-tight mb-2 line-clamp-2 leading-tight text-center">{video.title}</h2>
            
            {/* Bengali Usage Instruction & Income Note */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
                <p className="text-indigo-100 font-semibold text-center text-sm md:text-base leading-relaxed mb-2">
                    ভিডিওটি আনলক করতে নিচের বাটনে ক্লিক করে {TOTAL_ADS} টি অ্যাড সম্পূর্ণ দেখুন।
                </p>
                <div className="bg-emerald-500/20 rounded-lg p-2 text-center">
                   <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                     নোট: প্রতিটি অ্যাড দেখলে আপনার একাউন্টে ব্যালেন্স যোগ হবে!
                   </p>
                </div>
            </div>
            
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
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95"
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
