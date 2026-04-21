import { UserData } from '../App';
import { User, Wallet, Shield, MapPin, Calendar, Clock } from 'lucide-react';

export default function ProfileTab({ userData, tgUser }: { userData: UserData | null, tgUser: any }) {
  return (
    <div className="pt-28 px-4 md:px-10 max-w-lg mx-auto flex-1 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">My Profile</h2>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl mb-4 flex items-center justify-center overflow-hidden">
                {userData?.photoUrl ? (
                    <img src={userData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User className="w-10 h-10 text-slate-400" />
                )}
            </div>
            <h3 className="text-2xl font-bold text-white">{userData?.firstName || 'User'}</h3>
            <p className="text-indigo-400 font-medium">@{userData?.username || 'username'}</p>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Balance</p>
                        <p className="text-white font-bold">{userData?.balance || 0} Coins</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Telegram ID</p>
                        <p className="text-white font-bold">{userData?.uid || 'Unknown'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</p>
                        <p className="text-white font-bold text-sm">Active Member</p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
