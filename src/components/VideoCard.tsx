import { Play, Clock, LockKeyhole } from 'lucide-react';
import { Video } from '../data/videos';

export default function VideoCard({ video, onClick }: { video: Video; onClick: () => void; key?: string }) {
  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] transition-all duration-500 transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        <img src={video.thumbnail} alt={video.title} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-indigo-600/90 backdrop-blur flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center text-xs font-medium text-slate-200 border border-white/10">
            <Clock className="w-3 h-3 mr-1.5" />
            {video.duration}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
        <h3 className="font-semibold text-slate-100 text-lg line-clamp-1 mb-2 group-hover:text-indigo-400 transition-colors">{video.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{video.description}</p>
        
        <button className="w-full bg-slate-800 text-slate-200 font-medium text-sm py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-white/5 group-hover:border-indigo-500/30">
            <LockKeyhole className="w-4 h-4" /> 
            <span>Unlock to Watch</span>
        </button>
      </div>
    </div>
  );
}
