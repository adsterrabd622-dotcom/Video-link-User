import { useState } from 'react';
import { UserData } from '../App';
import { CreditCard, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { doc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function WithdrawTab({ userData }: { userData: UserData | null }) {
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !userData.uid) return;
    
    const withdrawAmount = parseInt(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    
    if (userData.balance < withdrawAmount) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    if (number.length < 11) {
      setMessage({ type: 'error', text: 'Enter a valid 11-digit number' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Deduct balance
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, { balance: increment(-withdrawAmount) });

      // 2. Add withdrawal record
      const withdrawRef = collection(db, 'withdrawals');
      await addDoc(withdrawRef, {
        userId: userData.uid,
        method: method,
        number: number,
        amount: withdrawAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: `Withdrawal request sent successfully!` });
      setAmount('');
      setNumber('');

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Something went wrong. Try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="pt-28 px-4 md:px-10 max-w-md mx-auto flex-1 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Withdraw</h2>
        <p className="text-slate-400 text-sm">Transfer your earned coins to bKash or Nagad</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
        
        <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl mb-6 border border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <p className="text-xs text-slate-400">Current Balance</p>
               <p className="text-xl font-bold text-white">{userData?.balance || 0} <span className="text-sm font-normal text-slate-500">Coins</span></p>
             </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-6 flex items-start gap-2 text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
             {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
             <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
               <div 
                 onClick={() => setMethod('bkash')}
                 className={`cursor-pointer text-center py-3 rounded-xl border font-bold transition-all ${method === 'bkash' ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_15px_rgba(219,39,119,0.3)]' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
               >
                 bKash
               </div>
               <div 
                 onClick={() => setMethod('nagad')}
                 className={`cursor-pointer text-center py-3 rounded-xl border font-bold transition-all ${method === 'nagad' ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
               >
                 Nagad
               </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
            <div className="relative">
               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
               <input 
                 type="number" 
                 placeholder={`e.g. 01XXXXXXXXX`}
                 value={number}
                 onChange={e => setNumber(e.target.value)}
                 className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                 required
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount (Coins)</label>
            <div className="relative">
               <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
               <input 
                 type="number" 
                 placeholder="Enter amount to withdraw"
                 value={amount}
                 onChange={e => setAmount(e.target.value)}
                 className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                 required
               />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || userData?.balance === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
          >
            {loading ? <span className="animate-pulse">Processing...</span> : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
