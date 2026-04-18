import { useState, useEffect } from 'react';
import { Video } from '../data/videos';
import { showAdsgramAd } from '../lib/adsgram';
import { X, Lock, PlayCircle, ShieldCheck, ExternalLink, Share2, Check } from 'lucide-react';

const ADS_BLOCK_ID = "YOUR_ADSGRAM_BLOCK_ID"; 

const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; 
const APP_SHORT_NAME = "myapp";         

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
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    navigator.clipboard.writeText(tgDeepLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans overflow-y-auto">
      <div className="fixed inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none" style={{ backgroundImage: `url(${video.thumbnail})`, backgroundSize: 'cover' }} />
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 text-center">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-4">{video.title}</h2>
          <div className="h-2 w-full bg-slate-800 rounded-full mb-6">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progressPercentage}%` }} />
          </div>
          {cooldown > 0 ? (
            <button disabled className="w-full bg-slate-800 py-4 rounded-xl text-slate-400">Wait {cooldown}s</button>
          ) : (
            <button onClick={handleUnlockClick} className="w-full bg-indigo-600 py-4 rounded-xl text-white font-bold tracking-wide">Watch Ad ({adsWatched}/{TOTAL_ADS})</button>
          )}
          <button onClick={handleShare} className="mt-4 text-indigo-400 text-sm flex items-center justify-center gap-2 mx-auto">
            {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} {isCopied ? "Copied!" : "Share this video"}
          </button>
          <button onClick={onBack} className="block mt-6 text-slate-500 text-xs mx-auto">Cancel</button>
        </div>
      </div>
    </div>
  );
}
