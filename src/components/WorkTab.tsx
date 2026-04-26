import { UserData } from '../App';
import { PlayCircle, Youtube, ThumbsUp, DollarSign } from 'lucide-react';
import { showGigaPubAd } from '../lib/gigapub';
import { showAdexiumAd } from '../lib/adexium';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';

export default function WorkTab({ userData, coinsPerAd }: { userData: UserData | null, coinsPerAd: number }) {
  const [loading, setLoading] = useState(false);

  const handleWatchAdTask = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await showGigaPubAd();
      await showAdexiumAd();
      
      if (userData && userData.uid) {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, { balance: increment(coinsPerAd) });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleExternalTask = async (url: string, reward: number) => {
    // Open URL
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }

    // Give reward immediately (or you could add a delay)
    if (userData && userData.uid) {
      try {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, { balance: increment(reward) });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="pt-28 px-4 md:px-10 max-w-xl mx-auto flex-1 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Earn Coins</h2>
        <p className="text-slate-400 text-sm mb-4">Complete simple tasks to earn coins which can be withdrawn to bKash or Nagad.</p>
        
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
           <DollarSign className="w-5 h-5 text-emerald-400" />
           <span className="text-white font-bold text-xl">{userData?.balance || 0}</span>
           <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Balance</span>
        </div>
      </div>

      <div className="space-y-4 shadow-xl">
        {/* Task 1: Ads */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center justify-between transition-transform active:scale-[0.98]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                 <h3 className="text-white font-semibold">Watch Ads</h3>
                 <p className="text-slate-400 text-xs mt-0.5">Earn {coinsPerAd} coins per view</p>
              </div>
           </div>
           <button 
             onClick={handleWatchAdTask}
             disabled={loading}
             className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
           >
             {loading ? 'Wait...' : 'Watch'}
           </button>
        </div>

        {/* Task 2: YouTube */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center justify-between transition-transform active:scale-[0.98]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <Youtube className="w-6 h-6 text-red-400" />
              </div>
              <div>
                 <h3 className="text-white font-semibold">Subscribe YouTube</h3>
                 <p className="text-slate-400 text-xs mt-0.5">Earn 100 coins</p>
              </div>
           </div>
           <button 
             onClick={() => handleExternalTask('https://youtube.com', 100)}
             className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
           >
             Go
           </button>
        </div>

        {/* Task 3: Facebook */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center justify-between transition-transform active:scale-[0.98]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <ThumbsUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                 <h3 className="text-white font-semibold">Follow Facebook</h3>
                 <p className="text-slate-400 text-xs mt-0.5">Earn 100 coins</p>
              </div>
           </div>
           <button 
             onClick={() => handleExternalTask('https://facebook.com', 100)}
             className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
           >
             Go
           </button>
        </div>

      </div>
    </div>
  );
}
