import { Play, Clock, Eye, Share2 } from 'lucide-react';
import { Video } from '../data/videos';

// Helper to format date nicely
const timeAgo = (dateInput: any) => {
  if (!dateInput) return "Recently";
  
  let date;
  if (typeof dateInput.toMillis === 'function') {
    date = new Date(dateInput.toMillis());
  } else if (typeof dateInput.seconds === 'number') {
     date = new Date(dateInput.seconds * 1000);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return "Recently";

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
};

// --- TELEGRAM CONFIGURATION ---
const BOT_USERNAME = "VIRAL_LINK_VIDEO_HUB_BOT"; 
const APP_SHORT_NAME = "myapp";         
// ------------------------------

export default function VideoCard({ video, onClick }: { video: Video; onClick: () => void; key?: string }) {
  
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the video full screen when clicking share
    
    const tgDeepLink = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=vid_${video.id}`;
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg && tg.openTelegramLink) {
      const shareText = encodeURIComponent(`Watch this viral video! 🎬`);
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(tgDeepLink)}&text=${shareText}`;
      tg.openTelegramLink(shareUrl);
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(tgDeepLink).then(() => alert('Link copied string!'));
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] transition-all duration-500 transform hover:-translate-y-1"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video overflow-hidden">
        <img src={video.thumbnail} alt={video.title} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-indigo-600/90 backdrop-blur flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center text-xs font-medium text-slate-200 border border-white/10">
            <Clock className="w-3 h-3 mr-1.5" />
            {video.duration || "0:00"}
        </div>
      </div>
      
      {/* Info Area */}
      <div className="p-4 flex gap-3 bg-gradient-to-b from-slate-900 to-slate-950 items-start justify-between">
        {/* Left Side: Title & Meta */}
        <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-slate-100 text-base md:text-lg line-clamp-2 leading-tight mb-1.5 group-hover:text-indigo-400 transition-colors">
              {video.title}
            </h3>
            
            <div className="flex flex-col gap-1 mt-1">
              {/* Uploader Name */}
              <div className="text-xs text-slate-400 font-medium">
                Admin
              </div>
              
              {/* Views and Time */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> 
                  {video.views || 0} views
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>{timeAgo(video.createdAt)}</span>
              </div>
            </div>
        </div>

        {/* Right Side: Share Action */}
        <button 
           onClick={handleShareClick}
           className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
