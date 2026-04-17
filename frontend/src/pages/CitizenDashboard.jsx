import React, { useEffect, useState } from 'react';
import { IndianRupee, FileText, CheckCircle, Clock, Banknote, ShieldQuestion, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getReports, getWallet, requestWithdrawal, getWithdrawals } from '../storage';

export default function CitizenDashboard() {
    const { user } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [wallet, setWalletState] = useState(0);
    const [withdrawHistory, setWithdrawHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Withdraw Modal
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [method, setMethod] = useState('UPI');
    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadData();
    }, [user]);

    const loadData = () => {
        const all = getReports();
        const myReports = all.filter(r => r.citizenId === user.id);
        setReports(myReports);
        setWalletState(getWallet(user.id));
        
        const history = getWithdrawals().filter(w => w.userId === user.id);
        setWithdrawHistory(history);
        
        setLoading(false);
    };

    const handleWithdraw = (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (amount <= 0 || amount > wallet) {
            toast.error('Invalid withdrawal amount.');
            return;
        }
        
        requestWithdrawal({
            userId: user.id,
            userName: user.name,
            amount,
            method,
            upiId
        });

        toast.success(`Withdrawal request for ₹${amount} submitted!`);
        setShowWithdraw(false);
        setWithdrawAmount('');
        loadData();
    };

    if (loading) return <div className="p-8 text-center"><span className="animate-pulse">{t('dashboard.loading')}</span></div>;

    const totalReports = reports.length;
    const verifiedReports = reports.filter(r => r.status === 'Resolved').length;
    const pendingReports = reports.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto py-6 md:py-10 px-2 sm:px-6"
        >
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ex-navy dark:text-white mb-6 md:mb-8">
                {t('dashboard.title')} — <span className="text-ex-cyan">{user?.name}</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* User Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-blue-500 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <FileText className="text-blue-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{totalReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.totalSubmissions')}</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-green-500 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <CheckCircle className="text-green-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{verifiedReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.verifiedResolves')}</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-orange-500 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Clock className="text-orange-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{pendingReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.pendingReview')}</p>
                        </motion.div>
                    </div>

                    {/* TABLE: My Complaints */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-ex-navy mb-4 flex items-center">
                            <ShieldQuestion className="h-5 w-5 mr-2" /> {t('dashboard.complaintHistory')}
                        </h2>
                        {reports.length === 0 ? (
                            <p className="text-gray-500 text-sm">{t('dashboard.noReports')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colReportId')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colCategory')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colDate')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(r => (
                                            <tr key={r.reportId} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-mono text-xs">{r.reportId}</td>
                                                <td className="py-3 px-4 text-sm font-medium">{r.category}</td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                                                <td className="py-3 px-4 flex items-center space-x-2">
                                                    <StatusBadge status={r.status} />
                                                    <button
                                                        onClick={() => navigate(`/track?reportId=${r.reportId}&openChat=true`)}
                                                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center"
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        {t('dashboard.trackChat')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Wallet */}
                <div className="space-y-8">
                    <div className="glass-card p-6 bg-white dark:bg-gradient-to-br dark:from-ex-navy dark:to-slate-800 border-none shadow-xl relative overflow-hidden group">
                        {/* Interactive glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-ex-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <Banknote className="absolute -right-6 -bottom-6 w-32 h-32 text-ex-navy dark:text-white opacity-[0.05] dark:opacity-10 pointer-events-none transform -rotate-12 transition-transform duration-700 group-hover:scale-110" />
                        
                        <h2 className="text-lg font-bold text-gray-500 dark:text-blue-100 mb-6 uppercase tracking-wider flex items-center relative z-10">
                            <IndianRupee className="w-5 h-5 mr-2 text-ex-cyan" /> {t('dashboard.rewardWallet')}
                        </h2>
                        
                        <div className="mb-4 md:mb-8 relative z-10">
                            <p className="text-[10px] md:text-sm font-bold text-gray-400 dark:text-blue-200/60 mb-1 uppercase tracking-tighter">{t('dashboard.availableBalance')}</p>
                            <div className="flex items-baseline">
                                <span className="text-2xl md:text-3xl font-bold mr-1 text-ex-navy dark:text-white">₹</span>
                                <motion.h3
                                    className="text-4xl md:text-5xl font-black text-ex-navy dark:text-white"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 100 }}
                                >
                                    {wallet.toLocaleString()}
                                </motion.h3>
                            </div>
                            {verifiedReports > 0 && (
                                <p className="text-xs text-ex-cyan mt-3 font-bold bg-ex-cyan/10 dark:bg-white/10 px-2 py-1 rounded inline-block">
                                    {verifiedReports} {t('dashboard.verifiedResolves')} — keep reporting!
                                </p>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setShowWithdraw(true)}
                            disabled={wallet <= 0}
                            className="w-full py-4 bg-ex-navy dark:bg-ex-cyan hover:bg-slate-800 dark:hover:bg-cyan-500 text-white dark:text-ex-navy font-black rounded-xl shadow-lg disabled:opacity-50 transition-all duration-300 transform active:scale-95 relative z-10"
                        >
                            {t('dashboard.withdrawFunds')}
                        </button>
                    </div>

                    {/* Withdrawal History */}
                    {withdrawHistory.length > 0 && (
                        <div className="glass-card p-6 bg-white dark:bg-slate-900 border-none shadow-lg">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center">
                                <Clock className="w-4 h-4 mr-2" /> Recent Requests
                            </h3>
                            <div className="space-y-3">
                                {withdrawHistory.slice(0, 3).map(w => (
                                    <div key={w.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-slate-800 pb-2">
                                        <div>
                                            <p className="font-bold text-ex-navy dark:text-white">₹{w.amount}</p>
                                            <p className="text-[10px] text-gray-500">{format(new Date(w.timestamp), 'dd MMM')}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            w.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            w.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {w.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-ex-navy mb-4">{t('dashboard.requestWithdrawal')}</h3>
                        <p className="text-sm text-gray-600 mb-6">{t('dashboard.withdrawNote')}</p>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('dashboard.amount')}</label>
                                <input type="number" required max={wallet} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="input-field" placeholder={`Max ₹${wallet}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('dashboard.transferMethod')}</label>
                                <select value={method} onChange={e => setMethod(e.target.value)} className="input-field">
                                    <option value="UPI">UPI ID</option>
                                </select>
                            </div>
                            {method === 'UPI' && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">UPI ID</label>
                                    <input type="text" required value={upiId} onChange={e => setUpiId(e.target.value)} className="input-field" placeholder="e.g. name@okhdfcbank" />
                                </div>
                            )}
                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-2 bg-gray-100 text-gray-800 font-bold rounded hover:bg-gray-200 transition">{t('dashboard.cancel')}</button>
                                <button type="submit" className="flex-1 py-2 bg-ex-navy text-white font-bold rounded hover:bg-slate-800 transition">{t('dashboard.confirm')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
